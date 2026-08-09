package handler

import (
	"github.com/gin-gonic/gin"
)

// getRiderID 获取当前用户关联的回收专员ID（通过手机号匹配）
func (h *Handler) getRiderID(c *gin.Context) uint {
	userID := getUserID(c)
	if userID == 0 {
		return 0
	}

	// 查用户信息（含手机号）
	user, err := h.Svc.Auth.GetUserInfo(c.Request.Context(), userID)
	if err != nil || user.Phone == "" {
		return 0
	}

	// 查专员表（通过手机号匹配）
	riders, err := h.Svc.Rider.List(c.Request.Context())
	if err != nil {
		return 0
	}
	for _, r := range riders {
		if r.Phone == user.Phone && r.Status == 1 {
			return r.ID
		}
	}
	return 0
}
