package repository

import (
	"context"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
)

type PointRepository struct {
	db *gorm.DB
}

func NewPointRepository(db *gorm.DB) *PointRepository {
	return &PointRepository{db: db}
}

// CreateLog 创建积分流水（在事务中调用）
func (r *PointRepository) CreateLog(ctx context.Context, tx *gorm.DB, log *model.CarbonPointLog) error {
	return tx.WithContext(ctx).Create(log).Error
}

// CreateReduction 创建减碳记录
func (r *PointRepository) CreateReduction(ctx context.Context, tx *gorm.DB, red *model.CarbonReduction) error {
	return tx.WithContext(ctx).Create(red).Error
}

// HistoryByUser 积分历史
func (r *PointRepository) HistoryByUser(ctx context.Context, userID uint, page, size int) ([]model.CarbonPointLog, int64, error) {
	var logs []model.CarbonPointLog
	var total int64

	tx := r.db.WithContext(ctx).Model(&model.CarbonPointLog{}).Where("user_id = ?", userID)
	tx.Count(&total)

	err := tx.Order("created_at DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&logs).Error

	return logs, total, err
}