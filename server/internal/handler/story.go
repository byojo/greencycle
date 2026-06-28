package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/pkg/response"
)

// StoryList 故事列表
func (h *Handler) StoryList(c *gin.Context) {
	page, size := getPageParams(c)
	list, total, err := h.Svc.Story.List(c.Request.Context(), page, size)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, gin.H{
		"list":  list,
		"total": total,
		"page":  page,
		"size":  size,
	})
}