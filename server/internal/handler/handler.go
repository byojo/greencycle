// Package handler HTTP 处理器
package handler

import "github.com/greencycle/server/internal/service"

type Handler struct {
	Svc *service.Service
}

func New(svc *service.Service) *Handler {
	return &Handler{Svc: svc}
}