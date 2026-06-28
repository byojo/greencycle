package repository

import (
	"context"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
)

type StoryRepository struct {
	db *gorm.DB
}

func NewStoryRepository(db *gorm.DB) *StoryRepository {
	return &StoryRepository{db: db}
}

// List 故事列表
func (r *StoryRepository) List(ctx context.Context, page, size int) ([]model.Story, int64, error) {
	var list []model.Story
	var total int64

	tx := r.db.WithContext(ctx).Model(&model.Story{}).Where("enabled = ?", true)
	tx.Count(&total)

	err := tx.Order("created_at DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&list).Error

	return list, total, err
}

// FindByID 查询故事
func (r *StoryRepository) FindByID(ctx context.Context, id uint) (*model.Story, error) {
	var s model.Story
	err := r.db.WithContext(ctx).First(&s, id).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}