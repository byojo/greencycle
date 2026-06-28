package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/internal/middleware"
)

// getUserID 从 context 获取用户 ID
func getUserID(c *gin.Context) uint {
	return middleware.GetUserID(c)
}

// getPageParams 解析分页参数
func getPageParams(c *gin.Context) (int, int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}
	return page, size
}