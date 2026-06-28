// Package repository 数据访问层
package repository

import (
	"context"

	"gorm.io/gorm"
)

// Repository 仓储接口集合
type Repository struct {
	db       *gorm.DB
	User     *UserRepository
	Order    *OrderRepository
	Category *CategoryRepository
	Point    *PointRepository
	Address  *AddressRepository
	Story    *StoryRepository
}

func New(db *gorm.DB) *Repository {
	return &Repository{
		db:       db,
		User:     NewUserRepository(db),
		Order:    NewOrderRepository(db),
		Category: NewCategoryRepository(db),
		Point:    NewPointRepository(db),
		Address:  NewAddressRepository(db),
		Story:    NewStoryRepository(db),
	}
}

// DB 获取原始 gorm.DB（用于事务）
func (r *Repository) DB() *gorm.DB {
	return r.db
}

// WithTx 在事务里执行业务逻辑
// 用法：repo.WithTx(ctx, func(tx *gorm.DB) error { ... })
func (r *Repository) WithTx(ctx context.Context, fn func(tx *gorm.DB) error) error {
	return r.db.WithContext(ctx).Transaction(fn)
}
