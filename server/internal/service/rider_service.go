package service

import (
	"context"
	"errors"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
)

type RiderService struct {
	repo *repository.Repository
}

func NewRiderService(repo *repository.Repository) *RiderService {
	return &RiderService{repo: repo}
}

// List 在职骑手列表
func (s *RiderService) List(ctx context.Context) ([]model.Rider, error) {
	return s.repo.Rider.List(ctx)
}

// Create 创建骑手
func (s *RiderService) Create(ctx context.Context, name, phone, idCard, plateNo string) error {
	rider := &model.Rider{
		Name:    name,
		Phone:   phone,
		IDCard:  idCard,
		PlateNo: plateNo,
		Status:  1,
		Rating:  5.0,
	}
	return s.repo.Rider.Create(ctx, rider)
}

// Update 更新骑手
func (s *RiderService) Update(ctx context.Context, id uint, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return errors.New("无更新内容")
	}
	return s.repo.Rider.Update(ctx, id, updates)
}
