package service

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
	"github.com/greencycle/server/pkg/jwt"
	"github.com/greencycle/server/pkg/wechat"
)

type AuthService struct {
	repo   *repository.Repository
	wechat *wechat.Client
}

func NewAuthService(repo *repository.Repository, wc *wechat.Client) *AuthService {
	return &AuthService{repo: repo, wechat: wc}
}

type LoginResult struct {
	Token string      `json:"token"`
	User  *model.User `json:"user"`
	IsNew bool        `json:"isNew"`
}

// WechatLogin 微信登录
func (s *AuthService) WechatLogin(ctx context.Context, code string, userInfo map[string]interface{}, inviteCode string) (*LoginResult, error) {
	// 1. 调微信接口换 session
	session, err := s.wechat.Code2Session(code)
	if err != nil {
		return nil, fmt.Errorf("微信登录失败: %w", err)
	}

	// 2. 查询或创建用户
	user, err := s.repo.User.FindByOpenID(ctx, session.OpenID)
	if err != nil {
		return nil, err
	}

	isNew := false
	if user == nil {
		// 创建新用户
		user = &model.User{
			OpenID:   session.OpenID,
			UnionID:  session.UnionID,
			Nickname: getString(userInfo, "nickName", "绿友"),
			Avatar:   getString(userInfo, "avatarUrl", ""),
			Gender:   getInt(userInfo, "gender", 0),
			Level:    1,
			Points:   0,
		}
		if err := s.repo.User.Create(ctx, user); err != nil {
			return nil, fmt.Errorf("创建用户失败: %w", err)
		}
		isNew = true

		// 处理邀请奖励
		if inviteCode != "" {
			s.processInviteReward(ctx, user.ID, inviteCode)
		}
	} else if userInfo != nil {
		// 更新用户信息
		user.Nickname = getString(userInfo, "nickName", user.Nickname)
		user.Avatar = getString(userInfo, "avatarUrl", user.Avatar)
		_ = s.repo.User.Update(ctx, user)
	}

	// 3. 生成 JWT
	token, err := jwt.Generate(user.ID, user.OpenID)
	if err != nil {
		return nil, fmt.Errorf("生成 token 失败: %w", err)
	}

	return &LoginResult{
		Token: token,
		User:  user,
		IsNew: isNew,
	}, nil
}

// UserInfoResponse 用户信息（带扩展统计字段）
type UserInfoResponse struct {
	model.User
	OrderCount   int     `json:"orderCount"`   // 总订单数
	AddressCount int     `json:"addressCount"` // 地址数量
	CarbonKg     float64 `json:"carbonKg"`     // 累计减碳 kg
	InUseCount   int     `json:"inUseCount"`   // 在用中订单数（未完成）
}

// GetUserInfo 获取用户信息（含统计）
func (s *AuthService) GetUserInfo(ctx context.Context, userID uint) (*UserInfoResponse, error) {
	user, err := s.repo.User.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}

	orderCount, _ := s.repo.Order.CountByUser(ctx, userID)
	addrCount, _ := s.repo.Address.CountByUser(ctx, userID)
	inUseCount, _ := s.repo.Order.CountInProgressByUser(ctx, userID)
	carbonKg, _ := s.repo.Point.TotalCarbonByUser(ctx, userID)

	return &UserInfoResponse{
		User:         *user,
		OrderCount:   orderCount,
		AddressCount: addrCount,
		CarbonKg:     carbonKg,
		InUseCount:   inUseCount,
	}, nil
}

// helpers
func getString(m map[string]interface{}, key, def string) string {
	if v, ok := m[key].(string); ok && v != "" {
		return v
	}
	return def
}

func getInt(m map[string]interface{}, key string, def int) int {
	if v, ok := m[key].(float64); ok {
		return int(v)
	}
	if v, ok := m[key].(int); ok {
		return v
	}
	return def
}

// processInviteReward 处理邀请奖励
func (s *AuthService) processInviteReward(ctx context.Context, newUserID uint, inviteCode string) {
	// 邀请码格式：GC000001，解析出邀请人ID
	if len(inviteCode) <= 2 {
		return
	}
	codeStr := inviteCode[2:] // 去掉 "GC" 前缀
	var inviterID uint
	for _, c := range codeStr {
		if c < '0' || c > '9' {
			return // 非数字，忽略
		}
		inviterID = inviterID*10 + uint(c-'0')
	}
	if inviterID == 0 || inviterID == newUserID {
		return // 不能自己邀请自己
	}

	// 查邀请人是否存在
	inviter, err := s.repo.User.FindByID(ctx, inviterID)
	if err != nil || inviter == nil {
		return
	}

	const rewardPoints = 50
	db := s.repo.DB()

	// 邀请人 +50 积分
	_ = s.repo.User.IncrementPoints(ctx, db, inviter.ID, rewardPoints)
	// 被邀请人 +50 积分
	_ = s.repo.User.IncrementPoints(ctx, db, newUserID, rewardPoints)

	// 记录积分流水
	_ = s.repo.Point.CreateLog(ctx, db, &model.CarbonPointLog{
		UserID:  inviter.ID,
		Type:    2, // 邀请奖励
		Amount:  rewardPoints,
		Balance: inviter.Points + rewardPoints,
		Remark:  "邀请好友奖励",
	})
	_ = s.repo.Point.CreateLog(ctx, db, &model.CarbonPointLog{
		UserID:  newUserID,
		Type:    2,
		Amount:  rewardPoints,
		Balance: rewardPoints,
		Remark:  "受邀注册奖励",
	})

	fmt.Printf("✅ 邀请奖励: 邀请人 #%d +%d, 新用户 #%d +%d\n", inviterID, rewardPoints, newUserID, rewardPoints)
}

// GetInviteList 获取邀请记录
func (s *AuthService) GetInviteList(ctx context.Context, userID uint) ([]map[string]interface{}, error) {
	// 查询所有 Type=2 的积分流水（邀请奖励）
	logs, _, err := s.repo.Point.HistoryByUser(ctx, userID, 1, 100)
	if err != nil {
		return nil, err
	}
	var list []map[string]interface{}
	for _, log := range logs {
		if log.Type != 2 {
			continue
		}
		list = append(list, map[string]interface{}{
			"id":        log.ID,
			"points":    log.Amount,
			"remark":    log.Remark,
			"createdAt": log.CreatedAt,
		})
	}
	if list == nil {
		list = []map[string]interface{}{}
	}
	return list, nil
}
