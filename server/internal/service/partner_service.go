package service

import (
	"context"
	"errors"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
)

type PartnerService struct {
	Repo *repository.Repository
}

func NewPartnerService(repo *repository.Repository) *PartnerService {
	return &PartnerService{Repo: repo}
}

type PartnerApplyParams struct {
	Name     string
	Phone    string
	District string
	Remark   string
}

// Apply 提交加盟申请
func (s *PartnerService) Apply(ctx context.Context, params PartnerApplyParams) error {
	app := &model.PartnerApplication{
		Name:     params.Name,
		Phone:    params.Phone,
		District: params.District,
		Remark:   params.Remark,
		Status:   0,
	}
	return s.Repo.Partner.Create(ctx, app)
}

// ListApplications 获取申请列表
func (s *PartnerService) ListApplications(ctx context.Context, status int) ([]model.PartnerApplication, error) {
	return s.Repo.Partner.List(ctx, status)
}

// ApproveApplication 通过申请 → 自动创建回收专员
func (s *PartnerService) ApproveApplication(ctx context.Context, id uint64) error {
	app, err := s.Repo.Partner.GetByID(ctx, id)
	if err != nil {
		return errors.New("申请不存在")
	}
	if app.Status != 0 {
		return errors.New("该申请已处理")
	}

	// 更新申请状态为已通过
	if err := s.Repo.Partner.UpdateStatus(ctx, id, 1); err != nil {
		return errors.New("更新申请状态失败")
	}

	// 创建回收专员
	rider := &model.Rider{
		Name:    app.Name,
		Phone:   app.Phone,
		Status:  1,
		Rating:  5.0,
	}
	if err := s.Repo.Rider.Create(ctx, rider); err != nil {
		return errors.New("创建回收专员失败")
	}

	return nil
}

// UpdateStatus 更新申请状态
func (s *PartnerService) UpdateStatus(ctx context.Context, id uint64, status int) error {
	return s.Repo.Partner.UpdateStatus(ctx, id, status)
}
