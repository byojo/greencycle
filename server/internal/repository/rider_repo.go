package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
)

type RiderRepository struct {
	db *gorm.DB
}

func NewRiderRepository(db *gorm.DB) *RiderRepository {
	return &RiderRepository{db: db}
}

// List 骑手列表（仅在职）
func (r *RiderRepository) List(ctx context.Context) ([]model.Rider, error) {
	var riders []model.Rider
	err := r.db.WithContext(ctx).
		Where("status = ?", 1).
		Order("rating DESC, service_count DESC").
		Find(&riders).Error
	return riders, err
}

// GetByID 根据 ID 获取
func (r *RiderRepository) GetByID(ctx context.Context, id uint) (*model.Rider, error) {
	var rider model.Rider
	err := r.db.WithContext(ctx).First(&rider, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &rider, nil
}

// Create 创建骑手
func (r *RiderRepository) Create(ctx context.Context, rider *model.Rider) error {
	return r.db.WithContext(ctx).Create(rider).Error
}

// Update 更新骑手
func (r *RiderRepository) Update(ctx context.Context, id uint, updates map[string]interface{}) error {
	return r.db.WithContext(ctx).
		Model(&model.Rider{}).
		Where("id = ?", id).
		Updates(updates).Error
}

// IncrementServiceCount 服务次数 +1
func (r *RiderRepository) IncrementServiceCount(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).
		Model(&model.Rider{}).
		Where("id = ?", id).
		UpdateColumn("service_count", gorm.Expr("service_count + 1")).Error
}
