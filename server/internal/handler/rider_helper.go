package handler

import (
	"errors"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
)

// getRiderID 获取当前用户关联的回收专员ID
func (h *Handler) getRiderID(c *gin.Context) uint {
	userID := getUserID(c)
	if userID == 0 {
		return 0
	}

	// 必须在 RIDER_USER_IDS 列表中
	if !isRiderUser(userID) {
		return 0
	}

	// 1. 通过 user_id 查找
	rider, err := h.Svc.Repo.Rider.FindByUserID(c.Request.Context(), userID)
	if err == nil && rider != nil {
		return rider.ID
	}

	// 2. 通过手机号匹配
	user, err := h.Svc.Auth.GetUserInfo(c.Request.Context(), userID)
	if err == nil && user.Phone != "" {
		riders, _ := h.Svc.Rider.List(c.Request.Context())
		for _, r := range riders {
			if r.Phone == user.Phone {
				_ = h.Svc.Repo.Rider.SetUserID(c.Request.Context(), r.ID, userID)
				return r.ID
			}
		}
	}

	// 3. 都没找到，但用户在 RIDER_USER_IDS 里 → 自动关联第一个在职专员
	riders, _ := h.Svc.Rider.List(c.Request.Context())
	if len(riders) > 0 {
		_ = h.Svc.Repo.Rider.SetUserID(c.Request.Context(), riders[0].ID, userID)
		return riders[0].ID
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
