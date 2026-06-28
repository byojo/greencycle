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
