// Package handler HTTP 处理器
package handler

import "github.com/greencycle/server/internal/service"

type Handler struct {
	Svc      *service.Service
	Partner  *PartnerHandler
}

func New(svc *service.Service) *Handler {
	h := &Handler{Svc: svc}
	h.Partner = NewPartnerHandler(svc)
	return h
}