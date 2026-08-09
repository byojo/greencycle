package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/pkg/response"
)

// RiderOrders 获取分配给当前专员的工单
func (h *Handler) RiderOrders(c *gin.Context) {
	riderID := h.getRiderID(c)
	if riderID == 0 {
		response.BadRequest(c, "您不是回收专员")
		return
	}

	orders, err := h.Svc.Rider.GetOrdersByRiderID(c.Request.Context(), riderID)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}

	// 对图片 URL 签名
	for i := range orders {
		for j := range orders[i].Images {
			orders[i].Images[j].URL = h.Svc.COS.SignKey(orders[i].Images[j].URL)
		}
	}

	response.Success(c, gin.H{"list": orders})
}

// RiderPickOrder 专员标记已取件
func (h *Handler) RiderPickOrder(c *gin.Context) {
	riderID := h.getRiderID(c)
	if riderID == 0 {
		response.BadRequest(c, "您不是回收专员")
		return
	}

	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "订单 ID 错误")
		return
	}

	if err := h.Svc.Rider.PickOrder(c.Request.Context(), orderID, riderID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "已标记取件"})
}

// RiderCompleteOrder 专员完成订单（输入金额）
func (h *Handler) RiderCompleteOrder(c *gin.Context) {
	riderID := h.getRiderID(c)
	if riderID == 0 {
		response.BadRequest(c, "您不是回收专员")
		return
	}

	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "订单 ID 错误")
		return
	}

	var req struct {
		FinalAmount int `json:"finalAmount" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "请输入回收金额")
		return
	}
	if req.FinalAmount < 0 {
		response.BadRequest(c, "金额不能为负数")
		return
	}

	if err := h.Svc.Rider.CompleteOrder(c.Request.Context(), orderID, riderID, req.FinalAmount); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "订单已完成"})
}
