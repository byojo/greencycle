package repository

import (
	"context"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
)

type CategoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

// List 品类列表
func (r *CategoryRepository) List(ctx context.Context) ([]model.Category, error) {
	var list []model.Category
	err := r.db.WithContext(ctx).
		Where("enabled = ?", true).
		Order("sort ASC, id ASC").
		Find(&list).Error
	return list, err
}

// FindByCode 根据 code 查询
func (r *CategoryRepository) FindByCode(ctx context.Context, code string) (*model.Category, error) {
	var c model.Category
	err := r.db.WithContext(ctx).Where("code = ?", code).First(&c).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// FieldsByCategory 查询品类的字段配置
func (r *CategoryRepository) FieldsByCategory(ctx context.Context, categoryID uint) ([]model.CategoryField, error) {
	var fields []model.CategoryField
	err := r.db.WithContext(ctx).
		Where("category_id = ?", categoryID).
		Order("sort ASC").
		Find(&fields).Error
	return fields, err
}