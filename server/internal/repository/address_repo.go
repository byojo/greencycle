package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
)

type AddressRepository struct {
	db *gorm.DB
}

func NewAddressRepository(db *gorm.DB) *AddressRepository {
	return &AddressRepository{db: db}
}

// ListByUser 用户地址（默认地址置顶，然后按 id 倒序）
func (r *AddressRepository) ListByUser(ctx context.Context, userID uint) ([]model.Address, error) {
	var list []model.Address
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("is_default DESC, id DESC").
		Find(&list).Error
	return list, err
}

// GetByIDAndUser 单个地址（带权限校验）
func (r *AddressRepository) GetByIDAndUser(ctx context.Context, id uint, userID uint) (*model.Address, error) {
	var addr model.Address
	err := r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		First(&addr).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &addr, nil
}

// ExistsByIDAndUser 检查地址存在且属于用户
func (r *AddressRepository) ExistsByIDAndUser(ctx context.Context, id uint, userID uint) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&model.Address{}).
		Where("id = ? AND user_id = ?", id, userID).
		Count(&count).Error
	return count > 0, err
}

// Create 创建
func (r *AddressRepository) Create(ctx context.Context, addr *model.Address) error {
	return r.db.WithContext(ctx).Create(addr).Error
}

// CountByUser 用户地址数量
func (r *AddressRepository) CountByUser(ctx context.Context, userID uint) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Address{}).Where("user_id = ?", userID).Count(&count).Error
	return int(count), err
}

// CreateTx 事务内创建
func (r *AddressRepository) CreateTx(ctx context.Context, tx *gorm.DB, addr *model.Address) error {
	return tx.WithContext(ctx).Create(addr).Error
}

// Update 更新
func (r *AddressRepository) Update(ctx context.Context, id uint, userID uint, updates map[string]interface{}) error {
	return r.db.WithContext(ctx).
		Model(&model.Address{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(updates).Error
}

// UpdateTx 事务内更新
func (r *AddressRepository) UpdateTx(ctx context.Context, tx *gorm.DB, id uint, userID uint, updates map[string]interface{}) error {
	return tx.WithContext(ctx).
		Model(&model.Address{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(updates).Error
}

// Delete 删除
func (r *AddressRepository) Delete(ctx context.Context, id uint, userID uint) error {
	return r.db.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&model.Address{}).Error
}

// DeleteTx 事务内删除
func (r *AddressRepository) DeleteTx(ctx context.Context, tx *gorm.DB, id uint, userID uint) error {
	return tx.WithContext(ctx).
		Where("id = ? AND user_id = ?", id, userID).
		Delete(&model.Address{}).Error
}

// ClearDefaultTx 取消某用户所有默认地址（事务内）
func (r *AddressRepository) ClearDefaultTx(ctx context.Context, tx *gorm.DB, userID uint) error {
	return tx.WithContext(ctx).
		Model(&model.Address{}).
		Where("user_id = ?", userID).
		Update("is_default", false).Error
}

// SetFirstAsDefaultTx 把该用户最早创建的地址设为默认（事务内）
func (r *AddressRepository) SetFirstAsDefaultTx(ctx context.Context, tx *gorm.DB, userID uint) error {
	// 找最早的非默认地址
	var first model.Address
	err := tx.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("id ASC").
		First(&first).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil // 没有任何地址了，无需处理
		}
		return err
	}
	return tx.WithContext(ctx).
		Model(&model.Address{}).
		Where("id = ?", first.ID).
		Update("is_default", true).Error
}

// SetDefault 设为默认
func (r *AddressRepository) SetDefault(ctx context.Context, userID uint, id uint) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. 取消其他默认
		if err := tx.WithContext(ctx).
			Model(&model.Address{}).
			Where("user_id = ?", userID).
			Update("is_default", false).Error; err != nil {
			return err
		}
		// 2. 设置新的默认
		return tx.WithContext(ctx).
			Model(&model.Address{}).
			Where("id = ? AND user_id = ?", id, userID).
			Update("is_default", true).Error
	})
}
