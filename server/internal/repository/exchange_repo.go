package repository

import (
	"context"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
)

type ExchangeRepository struct {
	db *gorm.DB
}

func NewExchangeRepository(db *gorm.DB) *ExchangeRepository {
	return &ExchangeRepository{db: db}
}

// ListActive 可兑换商品列表
func (r *ExchangeRepository) ListActive(ctx context.Context) ([]model.ExchangeItem, error) {
	var items []model.ExchangeItem
	err := r.db.WithContext(ctx).
		Where("enabled = ?", true).
		Where("stock > ?", 0).
		Order("sort ASC").
		Find(&items).Error
	return items, err
}

// GetByID 根据 ID 获取
func (r *ExchangeRepository) GetByID(ctx context.Context, id uint) (*model.ExchangeItem, error) {
	var item model.ExchangeItem
	err := r.db.WithContext(ctx).First(&item, id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// DeductStock 扣减库存（在事务中调用）
func (r *ExchangeRepository) DeductStock(ctx context.Context, tx *gorm.DB, id uint) error {
	return tx.WithContext(ctx).
		Model(&model.ExchangeItem{}).
		Where("id = ? AND stock > 0", id).
		UpdateColumn("stock", gorm.Expr("stock - 1")).Error
}

// UserExchangeCount 用户已兑换次数
func (r *ExchangeRepository) UserExchangeCount(ctx context.Context, userID, itemID uint) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&model.ExchangeRecord{}).
		Where("user_id = ? AND item_id = ? AND status != ?", userID, itemID, 4).
		Count(&count).Error
	return count, err
}

// CreateRecord 创建兑换记录（在事务中调用）
func (r *ExchangeRepository) CreateRecord(ctx context.Context, tx *gorm.DB, record *model.ExchangeRecord) error {
	return tx.WithContext(ctx).Create(record).Error
}

// UserExchangeHistory 用户兑换记录列表
func (r *ExchangeRepository) UserExchangeHistory(ctx context.Context, userID uint, page, size int) ([]model.ExchangeRecord, int64, error) {
	var records []model.ExchangeRecord
	var total int64

	tx := r.db.WithContext(ctx).Model(&model.ExchangeRecord{}).Where("user_id = ?", userID)
	tx.Count(&total)

	err := tx.Order("created_at DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&records).Error

	return records, total, err
}
