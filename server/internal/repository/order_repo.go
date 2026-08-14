package repository

import (
	"context"
	"time"

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

// CreateTimelineWithDetails 创建时间线（带参数）
func (r *OrderRepository) CreateTimelineWithDetails(ctx context.Context, orderID uint64, status int, content, operator string) error {
	return r.db.WithContext(ctx).Create(&model.OrderTimeline{
		OrderID:  orderID,
		Status:   status,
		Content:  content,
		Operator: operator,
	}).Error
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

// FindByRiderID 查询分配给专员的订单；since 非空时仅返回该时间之后的工单（按创建时间）
func (r *OrderRepository) FindByRiderID(ctx context.Context, riderID uint, since *time.Time) ([]model.Order, error) {
	tx := r.db.WithContext(ctx).
		Preload("Images").
		Where("rider_id = ?", riderID)
	if since != nil {
		tx = tx.Where("created_at >= ?", *since)
	}
	var orders []model.Order
	err := tx.Order("created_at DESC").Find(&orders).Error
	return orders, err
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

// AdminList 管理端订单列表（不按用户过滤）
func (r *OrderRepository) AdminList(ctx context.Context, page, size int, status int) ([]model.Order, int64, error) {
	var orders []model.Order
	var total int64

	tx := r.db.WithContext(ctx).Model(&model.Order{})
	if status > 0 {
		tx = tx.Where("status = ?", status)
	}

	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := tx.Order("created_at DESC").
		Offset((page - 1) * size).
		Limit(size).
		Preload("Images").
		Find(&orders).Error

	return orders, total, err
}

// AdminUpdateStatus 管理端更新订单状态
func (r *OrderRepository) AdminUpdateStatus(ctx context.Context, id uint64, updates map[string]interface{}) error {
	return r.db.WithContext(ctx).
		Model(&model.Order{}).
		Where("id = ?", id).
		Updates(updates).Error
}

// Transaction 事务
func (r *OrderRepository) Transaction(ctx context.Context, fn func(tx *gorm.DB) error) error {
	return r.db.WithContext(ctx).Transaction(fn)
}

// CountByUser 用户订单总数
func (r *OrderRepository) CountByUser(ctx context.Context, userID uint) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Order{}).Where("user_id = ?", userID).Count(&count).Error
	return int(count), err
}

// CountInProgressByUser 用户进行中订单数（待评估+已派单+已取件）
func (r *OrderRepository) CountInProgressByUser(ctx context.Context, userID uint) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Order{}).
		Where("user_id = ? AND status IN ?", userID, []int{1, 2, 3}).
		Count(&count).Error
	return int(count), err
}
