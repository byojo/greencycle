package service

import (
	"context"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
)

type CategoryService struct {
	repo *repository.Repository
}

func NewCategoryService(repo *repository.Repository) *CategoryService {
	return &CategoryService{repo: repo}
}

// List 品类列表
func (s *CategoryService) List(ctx context.Context) ([]model.Category, error) {
	return s.repo.Category.List(ctx)
}

// Detail 品类详情（包含字段配置）
func (s *CategoryService) Detail(ctx context.Context, code string) (*model.Category, []model.CategoryField, error) {
	cat, err := s.repo.Category.FindByCode(ctx, code)
	if err != nil {
		return nil, nil, err
	}
	fields, err := s.repo.Category.FieldsByCategory(ctx, cat.ID)
	if err != nil {
		return nil, nil, err
	}
	return cat, fields, nil
}

// Fields 只返回字段配置
func (s *CategoryService) Fields(ctx context.Context, code string) ([]model.CategoryField, error) {
	cat, err := s.repo.Category.FindByCode(ctx, code)
	if err != nil {
		return nil, err
	}
	return s.repo.Category.FieldsByCategory(ctx, cat.ID)
}