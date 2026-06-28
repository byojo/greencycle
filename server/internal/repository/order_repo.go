package repository

import (
	"context"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
)

type OrderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

// Create 创建订单
func (r *OrderRepository) Create(ctx context.Context, order *model.Order) error {
	return r.db.WithContext(ctx).Create(order).Error
}

// CreateImages 批量创建图片
func (r *OrderRepository) CreateImages(ctx context.Context, images []model.OrderImage) error {
	if len(images) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).Create(&images).Error
}

// CreateTimeline 创建时间线
func (r *OrderRepository) CreateTimeline(ctx context.Context, t *model.OrderTimeline) error {
	return r.db.WithContext(ctx).Create(t).Error
}

// FindByID 查询订单
func (r *OrderRepository) FindByID(ctx context.Context, id uint64) (*model.Order, error) {
	var order model.Order
	err := r.db.WithContext(ctx).
		Preload("Images").
		Preload("Timelines").
		First(&order, id).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

// ListByUser 用户订单列表
func (r *OrderRepository) ListByUser(ctx context.Context, userID uint, page, size int, status int) ([]model.Order, int64, error) {
	var orders []model.Order
	var total int64

	tx := r.db.WithContext(ctx).Model(&model.Order{}).Where("user_id = ?", userID)
	if status > 0 {
		tx = tx.Where("status = ?", status)
	}

	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := tx.Order("created_at DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&orders).Error

	return orders, total, err
}

// UpdateStatus 更新状态
func (r *OrderRepository) UpdateStatus(ctx context.Context, id uint64, status int) error {
	return r.db.WithContext(ctx).
		Model(&model.Order{}).
		Where("id = ?", id).
		Update("status", status).Error
}

// Transaction 事务
func (r *OrderRepository) Transaction(ctx context.Context, fn func(tx *gorm.DB) error) error {
	return r.db.WithContext(ctx).Transaction(fn)
}