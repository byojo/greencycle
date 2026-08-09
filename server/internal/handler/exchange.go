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
		// 业务错误返回 BadRequest，系统错误返回 ServerError
		msg := err.Error()
		if isBusinessError(msg) {
			response.BadRequest(c, msg)
		} else {
			response.ServerError(c, "兑换失败，请稍后重试")
		}
		return
	}
	response.Success(c, nil)
}

// isBusinessError 判断是否为业务错误（用户可见的错误信息）
func isBusinessError(msg string) bool {
	knownErrors := []string{
		"该商品每人限兑", "您已", "积分不足", "库存不足", "商品已下架",
		"地址不属于", "限兑检查失败", "商品不存在", "用户信息获取失败",
	}
	for _, e := range knownErrors {
		if msg == e || len(msg) > 0 && containsStr(msg, e) {
			return true
		}
	}
	return false
}

func containsStr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
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
