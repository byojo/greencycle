package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/pkg/response"
)

// PointsOverview 积分概览
func (h *Handler) PointsOverview(c *gin.Context) {
	userID := getUserID(c)
	overview, err := h.Svc.Point.Overview(c.Request.Context(), userID)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, overview)
}

// PointsHistory 积分流水
func (h *Handler) PointsHistory(c *gin.Context) {
	userID := getUserID(c)
	page, size := getPageParams(c)
	logs, total, err := h.Svc.Point.History(c.Request.Context(), userID, page, size)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, gin.H{
		"list":  logs,
		"total": total,
		"page":  page,
		"size":  size,
	})
}