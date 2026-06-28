package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create 创建用户
func (r *UserRepository) Create(ctx context.Context, user *model.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

// FindByID 根据 ID 查询
func (r *UserRepository) FindByID(ctx context.Context, id uint) (*model.User, error) {
	var user model.User
	err := r.db.WithContext(ctx).First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByOpenID 根据 OpenID 查询
func (r *UserRepository) FindByOpenID(ctx context.Context, openID string) (*model.User, error) {
	var user model.User
	err := r.db.WithContext(ctx).Where("open_id = ?", openID).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// Update 更新
func (r *UserRepository) Update(ctx context.Context, user *model.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

// IncrementPoints 增加积分（在事务中使用）
func (r *UserRepository) IncrementPoints(ctx context.Context, tx *gorm.DB, userID uint, delta int) error {
	return tx.WithContext(ctx).
		Model(&model.User{}).
		Where("id = ?", userID).
		UpdateColumn("points", gorm.Expr("points + ?", delta)).
		Error
}