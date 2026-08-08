package handler

import (
	"regexp"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/internal/service"
	"github.com/greencycle/server/pkg/response"
)

var phoneRegexp = regexp.MustCompile(`^1[3-9]\d{9}$`)

type PartnerHandler struct {
	Svc *service.Service
}

func NewPartnerHandler(svc *service.Service) *PartnerHandler {
	return &PartnerHandler{Svc: svc}
}

type PartnerApplyRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=64"`
	Phone    string `json:"phone" binding:"required"`
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

	// 校验手机号格式
	if !phoneRegexp.MatchString(req.Phone) {
		response.BadRequest(c, "手机号格式不正确")
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
