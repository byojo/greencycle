package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/pkg/response"
	"github.com/greencycle/server/internal/service"
)

// ExchangeList 商品列表
func (h *Handler) ExchangeList(c *gin.Context) {
	items, err := h.Svc.Exchange.ListItems(c.Request.Context())
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, items)
}

// ExchangeDo 兑换商品
func (h *Handler) ExchangeDo(c *gin.Context) {
	userID := getUserID(c)

	var req service.ExchangeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}

	err := h.Svc.Exchange.Exchange(c.Request.Context(), userID, &req)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Success(c, nil)
}

// ExchangeHistory 用户兑换记录
func (h *Handler) ExchangeHistory(c *gin.Context) {
	userID := getUserID(c)
	page, size := getPageParams(c)

	records, total, err := h.Svc.Exchange.ExchangeHistory(c.Request.Context(), userID, page, size)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, gin.H{
		"list":  records,
		"total": total,
		"page":  page,
		"size":  size,
	})
}
