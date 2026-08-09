package repository

import (
	"context"

	"github.com/greencycle/server/internal/model"

	"gorm.io/gorm"
)

type PartnerRepository struct {
	db *gorm.DB
}

func NewPartnerRepository(db *gorm.DB) *PartnerRepository {
	return &PartnerRepository{db: db}
}

// Create 创建申请
func (r *PartnerRepository) Create(ctx context.Context, app *model.PartnerApplication) error {
	return r.db.WithContext(ctx).Create(app).Error
}

// List 申请列表
func (r *PartnerRepository) List(ctx context.Context, status int) ([]model.PartnerApplication, error) {
	var list []model.PartnerApplication
	tx := r.db.WithContext(ctx).Model(&model.PartnerApplication{})
	if status >= 0 {
		tx = tx.Where("status = ?", status)
	}
	err := tx.Order("created_at DESC").Find(&list).Error
	return list, err
}

// GetByID 根据ID获取
func (r *PartnerRepository) GetByID(ctx context.Context, id uint64) (*model.PartnerApplication, error) {
	var app model.PartnerApplication
	err := r.db.WithContext(ctx).First(&app, id).Error
	return &app, err
}

// UpdateStatus 更新状态
func (r *PartnerRepository) UpdateStatus(ctx context.Context, id uint64, status int) error {
	return r.db.WithContext(ctx).Model(&model.PartnerApplication{}).
		Where("id = ?", id).
		Update("status", status).Error
}
