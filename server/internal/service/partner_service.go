package service

import (
	"context"

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
