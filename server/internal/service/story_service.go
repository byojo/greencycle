package service

import (
	"context"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
)

type StoryService struct {
	repo *repository.Repository
}

func NewStoryService(repo *repository.Repository) *StoryService {
	return &StoryService{repo: repo}
}

// List 故事列表
func (s *StoryService) List(ctx context.Context, page, size int) ([]model.Story, int64, error) {
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 50 {
		size = 10
	}
	return s.repo.Story.List(ctx, page, size)
}