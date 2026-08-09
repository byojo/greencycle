package handler

import (
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// getRiderID 获取当前用户关联的回收专员ID
func (h *Handler) getRiderID(c *gin.Context) uint {
	userID := getUserID(c)
	if userID == 0 {
		return 0
	}

	// 方式1: 通过 RIDER_USER_IDS 环境变量判断是否是专员用户
	if isRiderUser(userID) {
		// 查找该用户关联的专员
		rider, err := h.Svc.Repo.Rider.FindByUserID(c.Request.Context(), userID)
		if err == nil && rider != nil {
			return rider.ID
		}
		// 如果没找到关联，尝试通过手机号匹配
		user, err := h.Svc.Auth.GetUserInfo(c.Request.Context(), userID)
		if err == nil && user.Phone != "" {
			riders, _ := h.Svc.Rider.List(c.Request.Context())
			for _, r := range riders {
				if r.Phone == user.Phone {
					// 自动关联
					_ = h.Svc.Repo.Rider.SetUserID(c.Request.Context(), r.ID, userID)
					return r.ID
				}
			}
		}
	}

	return 0
}

// isRiderUser 检查用户是否在 RIDER_USER_IDS 列表中
func isRiderUser(userID uint) bool {
	ids := os.Getenv("RIDER_USER_IDS")
	if ids == "" {
		return false
	}
	for _, idStr := range strings.Split(ids, ",") {
		id, err := strconv.ParseUint(strings.TrimSpace(idStr), 10, 64)
		if err == nil && uint(id) == userID {
			return true
		}
	}
	return false
}
