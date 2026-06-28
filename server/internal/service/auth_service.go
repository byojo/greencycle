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
	Token  string      `json:"token"`
	User   *model.User `json:"user"`
	IsNew  bool        `json:"isNew"`
}

// WechatLogin 微信登录
func (s *AuthService) WechatLogin(ctx context.Context, code string, userInfo map[string]interface{}) (*LoginResult, error) {
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

// GetUserInfo 获取用户信息
func (s *AuthService) GetUserInfo(ctx context.Context, userID uint) (*model.User, error) {
	user, err := s.repo.User.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}
	return user, nil
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