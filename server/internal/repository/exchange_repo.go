package repository

import (
	"context"
	"errors"
	"time"

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

// GetByID 根据 ID 获取（仅上架商品）
func (r *ExchangeRepository) GetByID(ctx context.Context, id uint) (*model.ExchangeItem, error) {
	var item model.ExchangeItem
	err := r.db.WithContext(ctx).
		Where("id = ? AND enabled = ?", id, true).
		First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// DeductStock 扣减库存（在事务中调用），返回受影响行数
func (r *ExchangeRepository) DeductStock(ctx context.Context, tx *gorm.DB, id uint) (int64, error) {
	result := tx.WithContext(ctx).
		Model(&model.ExchangeItem{}).
		Where("id = ? AND stock > 0", id).
		UpdateColumn("stock", gorm.Expr("stock - 1"))
	return result.RowsAffected, result.Error
}

// DeductStockBy 按数量扣减库存（在事务中调用），返回受影响行数
func (r *ExchangeRepository) DeductStockBy(ctx context.Context, tx *gorm.DB, id uint, qty int) (int64, error) {
	if qty <= 0 {
		return 0, errors.New("数量必须大于 0")
	}
	result := tx.WithContext(ctx).
		Model(&model.ExchangeItem{}).
		Where("id = ? AND stock >= ?", id, qty).
		UpdateColumn("stock", gorm.Expr("stock - ?", qty))
	return result.RowsAffected, result.Error
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
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := tx.Order("created_at DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&records).Error

	return records, total, err
}

// AdminListRecords 管理端兑换工单列表（可选状态过滤）
func (r *ExchangeRepository) AdminListRecords(ctx context.Context, status int) ([]model.ExchangeRecord, error) {
	var records []model.ExchangeRecord
	tx := r.db.WithContext(ctx).Model(&model.ExchangeRecord{})
	if status > 0 {
		tx = tx.Where("status = ?", status)
	}
	err := tx.Order("created_at DESC").Find(&records).Error
	return records, err
}

// GetRecordByID 根据 ID 获取兑换记录
func (r *ExchangeRepository) GetRecordByID(ctx context.Context, id uint) (*model.ExchangeRecord, error) {
	var record model.ExchangeRecord
	err := r.db.WithContext(ctx).First(&record, id).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}

// AssignRider 分配配送专员并更新状态为配送中
func (r *ExchangeRepository) AssignRider(ctx context.Context, id uint, riderID uint, riderName, riderPhone string) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&model.ExchangeRecord{}).
		Where("id = ? AND status = ?", id, 1). // 仅待发货可分配
		Updates(map[string]interface{}{
			"rider_id":    riderID,
			"rider_name":  riderName,
			"rider_phone": riderPhone,
			"status":      2, // 配送中
			"shipped_at":  &now,
		}).Error
}

// CompleteDelivery 标记配送完成
func (r *ExchangeRepository) CompleteDelivery(ctx context.Context, id uint, riderID uint) error {
	now := time.Now()
	result := r.db.WithContext(ctx).Model(&model.ExchangeRecord{}).
		Where("id = ? AND status = ? AND rider_id = ?", id, 2, riderID).
		Updates(map[string]interface{}{
			"status":       3, // 已完成
			"completed_at": &now,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// CancelRecord 取消兑换记录
func (r *ExchangeRepository) CancelRecord(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Model(&model.ExchangeRecord{}).
		Where("id = ? AND status = ?", id, 1). // 仅待发货可取消
		Update("status", 4).Error
}

// FindDeliveriesByRiderID 获取分配给专员的配送任务
func (r *ExchangeRepository) FindDeliveriesByRiderID(ctx context.Context, riderID uint) ([]model.ExchangeRecord, error) {
	var records []model.ExchangeRecord
	err := r.db.WithContext(ctx).
		Where("rider_id = ? AND status IN ?", riderID, []int{2, 3}).
		Order("created_at DESC").
		Find(&records).Error
	return records, err
}
