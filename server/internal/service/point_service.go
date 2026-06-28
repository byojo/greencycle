package service

import (
	"context"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
)

type PointService struct {
	repo *repository.Repository
}

func NewPointService(repo *repository.Repository) *PointService {
	return &PointService{repo: repo}
}

type PointOverview struct {
	Balance   int     `json:"balance"`
	CarbonKg  float64 `json:"carbonKg"`
	TreeCount int     `json:"treeCount"`
	Withdraw  int     `json:"withdraw"`
}

// Overview 积分概览
func (s *PointService) Overview(ctx context.Context, userID uint) (*PointOverview, error) {
	user, err := s.repo.User.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// 查询累计减碳
	var totalCarbon float64
	var treeCount int
	s.repo.DB().WithContext(ctx).
		Model(&model.CarbonReduction{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(carbon_kg), 0)").
		Scan(&totalCarbon)
	treeCount = int(totalCarbon / 18)

	return &PointOverview{
		Balance:   user.Points,
		CarbonKg:  totalCarbon,
		TreeCount: treeCount,
		Withdraw:  0,
	}, nil
}

// History 积分流水
func (s *PointService) History(ctx context.Context, userID uint, page, size int) ([]model.CarbonPointLog, int64, error) {
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}
	return s.repo.Point.HistoryByUser(ctx, userID, page, size)
}