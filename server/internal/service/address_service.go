package service

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
)

var (
	phoneRegexp = regexp.MustCompile(`^1[3-9]\d{9}$`)

	// 允许的标签
	allowedTags = map[string]bool{
		"":       true, // 允许空（不选标签）
		"家":     true,
		"公司":   true,
		"学校":   true,
		"其他":   true,
	}
)

type AddressService struct {
	repo *repository.Repository
}

func NewAddressService(repo *repository.Repository) *AddressService {
	return &AddressService{repo: repo}
}

// validate 校验地址字段
func validateAddress(addr *model.Address) error {
	if strings.TrimSpace(addr.Name) == "" {
		return errors.New("姓名不能为空")
	}
	if len(addr.Name) > 20 {
		return errors.New("姓名过长（≤20 字）")
	}
	// 清洗手机号（去掉空格、横线、星号）
	cleaned := strings.NewReplacer(" ", "", "-", "", "*", "", "+86", "").Replace(addr.Phone)
	if !phoneRegexp.MatchString(cleaned) {
		return errors.New("手机号格式错误")
	}
	addr.Phone = cleaned // 用清洗后的值入库

	if strings.TrimSpace(addr.Province) == "" {
		return errors.New("省份不能为空")
	}
	if strings.TrimSpace(addr.City) == "" {
		return errors.New("城市不能为空")
	}
	if strings.TrimSpace(addr.District) == "" {
		return errors.New("区/县不能为空")
	}
	if strings.TrimSpace(addr.Detail) == "" {
		return errors.New("详细地址不能为空")
	}
	if len([]rune(addr.Detail)) < 5 {
		return errors.New("详细地址至少 5 个字")
	}
	if !allowedTags[addr.Tag] {
		return errors.New("标签必须是：家/公司/学校/其他 之一")
	}
	return nil
}

// ListByUser 用户地址（默认地址置顶）
func (s *AddressService) ListByUser(ctx context.Context, userID uint) ([]model.Address, error) {
	return s.repo.Address.ListByUser(ctx, userID)
}

// Create 创建地址
// 若 isDefault=true，会自动取消该用户其他默认地址
func (s *AddressService) Create(ctx context.Context, addr *model.Address) error {
	if err := validateAddress(addr); err != nil {
		return err
	}

	// 如果用户没有其他地址，自动设为默认
	list, _ := s.repo.Address.ListByUser(ctx, addr.UserID)
	if len(list) == 0 {
		addr.IsDefault = true
	}

	if addr.IsDefault {
		return s.repo.WithTx(ctx, func(tx *gorm.DB) error {
			if err := s.repo.Address.ClearDefaultTx(ctx, tx, addr.UserID); err != nil {
				return err
			}
			return s.repo.Address.CreateTx(ctx, tx, addr)
		})
	}
	return s.repo.Address.Create(ctx, addr)
}

// Update 更新地址（部分字段）
func (s *AddressService) Update(ctx context.Context, id uint, userID uint, updates map[string]interface{}) error {
	if id == 0 {
		return errors.New("地址 ID 无效")
	}
	if len(updates) == 0 {
		return errors.New("没有要更新的字段")
	}

	// 字段白名单（防止前端传非法字段）
	allowed := map[string]bool{
		"name": true, "phone": true, "province": true, "city": true,
		"district": true, "detail": true, "tag": true,
		"lat": true, "lng": true, "is_default": true,
	}
	for k := range updates {
		if !allowed[k] {
			delete(updates, k)
		}
	}
	if len(updates) == 0 {
		return errors.New("没有可更新的字段")
	}

	// 校验：手机号格式
	if phone, ok := updates["phone"].(string); ok {
		cleaned := strings.NewReplacer(" ", "", "-", "", "*", "", "+86", "").Replace(phone)
		if !phoneRegexp.MatchString(cleaned) {
			return errors.New("手机号格式错误")
		}
		updates["phone"] = cleaned
	}
	// 校验：tag 枚举
	if tag, ok := updates["tag"].(string); ok {
		if !allowedTags[tag] {
			return errors.New("标签必须是：家/公司/学校/其他 之一")
		}
	}
	// 校验：详细地址长度
	if detail, ok := updates["detail"].(string); ok {
		if len([]rune(detail)) < 5 {
			return errors.New("详细地址至少 5 个字")
		}
	}

	// 校验地址存在且属于当前用户
	exists, err := s.repo.Address.ExistsByIDAndUser(ctx, id, userID)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("地址不存在或无权限")
	}

	// 如果要把某个地址设为默认
	if isDef, ok := updates["is_default"].(bool); ok && isDef {
		return s.repo.WithTx(ctx, func(tx *gorm.DB) error {
			if err := s.repo.Address.ClearDefaultTx(ctx, tx, userID); err != nil {
				return err
			}
			return s.repo.Address.UpdateTx(ctx, tx, id, userID, updates)
		})
	}

	return s.repo.Address.Update(ctx, id, userID, updates)
}

// Delete 删除地址（如果删除的是默认地址，自动把剩余第一个设为默认）
func (s *AddressService) Delete(ctx context.Context, id uint, userID uint) error {
	if id == 0 {
		return errors.New("地址 ID 无效")
	}

	// 先查地址
	addr, err := s.repo.Address.GetByIDAndUser(ctx, id, userID)
	if err != nil {
		return err
	}
	if addr == nil {
		return errors.New("地址不存在或无权限")
	}

	return s.repo.WithTx(ctx, func(tx *gorm.DB) error {
		// 删除
		if err := s.repo.Address.DeleteTx(ctx, tx, id, userID); err != nil {
			return err
		}
		// 如果是默认地址，自动把剩余最早的一个设为默认
		if addr.IsDefault {
			return s.repo.Address.SetFirstAsDefaultTx(ctx, tx, userID)
		}
		return nil
	})
}

// SetDefault 设为默认
func (s *AddressService) SetDefault(ctx context.Context, userID uint, id uint) error {
	if id == 0 {
		return errors.New("地址 ID 无效")
	}
	exists, err := s.repo.Address.ExistsByIDAndUser(ctx, id, userID)
	if err != nil {
		return err
	}
	if !exists {
		return errors.New("地址不存在或无权限")
	}
	return s.repo.Address.SetDefault(ctx, userID, id)
}
