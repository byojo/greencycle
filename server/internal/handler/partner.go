package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/internal/service"
	"github.com/greencycle/server/pkg/response"
)

type PartnerHandler struct {
	Svc *service.Service
}

func NewPartnerHandler(svc *service.Service) *PartnerHandler {
	return &PartnerHandler{Svc: svc}
}

type PartnerApplyRequest struct {
	Name     string `json:"name" binding:"required,max=64"`
	Phone    string `json:"phone" binding:"required,max=20"`
	District string `json:"district" binding:"max=128"`
	Remark   string `json:"remark"`
}

// Apply POST /api/v1/partner-apply 合作加盟申请（无需登录）
func (h *PartnerHandler) Apply(c *gin.Context) {
	var req PartnerApplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	if err := h.Svc.Partner.Apply(c.Request.Context(), service.PartnerApplyParams{
		Name:     req.Name,
		Phone:    req.Phone,
		District: req.District,
		Remark:   req.Remark,
	}); err != nil {
		response.ServerError(c, "提交失败")
		return
	}

	response.Success(c, nil)
}
