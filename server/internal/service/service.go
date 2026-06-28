// Package service 业务逻辑层
package service

import (
	"github.com/greencycle/server/pkg/cos"
	"github.com/greencycle/server/pkg/wechat"

	"github.com/greencycle/server/internal/repository"
)

type Service struct {
	Repo     *repository.Repository
	Wechat   *wechat.Client
	COS      *cos.Client
	Auth     *AuthService
	Category *CategoryService
	Order    *OrderService
	Point    *PointService
	Address  *AddressService
	Story    *StoryService
	Upload   *UploadService
}

func New(repo *repository.Repository, wc *wechat.Client, cosCli *cos.Client) *Service {
	s := &Service{
		Repo:   repo,
		Wechat: wc,
		COS:    cosCli,
	}
	s.Auth = NewAuthService(repo, wc)
	s.Category = NewCategoryService(repo)
	s.Order = NewOrderService(repo)
	s.Point = NewPointService(repo)
	s.Address = NewAddressService(repo)
	s.Story = NewStoryService(repo)
	s.Upload = NewUploadService(cosCli)
	return s
}