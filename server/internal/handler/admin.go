package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/pkg/response"
)

// AdminOrderList 管理端订单列表（不按用户过滤）
func (h *Handler) AdminOrderList(c *gin.Context) {
	page, size := getPageParams(c)
	status, _ := strconv.Atoi(c.DefaultQuery("status", "0"))

	orders, total, err := h.Svc.Order.AdminListByUser(c.Request.Context(), page, size, status)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"list":  orders,
		"total": total,
		"page":  page,
		"size":  size,
	})
}

// AdminUpdateOrderStatus 更新订单状态
// body: { "status": 2, "riderId": 1, "riderName": "张师傅", "riderPhone": "13800138000" }
func (h *Handler) AdminUpdateOrderStatus(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "订单 ID 错误")
		return
	}

	var req struct {
		Status     int    `json:"status" binding:"required"`
		RiderID    *uint  `json:"riderId"`
		RiderName  string `json:"riderName"`
		RiderPhone string `json:"riderPhone"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	// 校验状态合法性
	if req.Status < 1 || req.Status > 5 {
		response.BadRequest(c, "无效的订单状态")
		return
	}

	if err := h.Svc.Order.AdminUpdateStatus(c.Request.Context(), orderID, req.Status, req.RiderID, req.RiderName, req.RiderPhone); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// AdminCompleteOrder 完成订单（触发积分奖励 + 减碳记录）
// body: { "finalAmount": 5000 }
func (h *Handler) AdminCompleteOrder(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "订单 ID 错误")
		return
	}

	var req struct {
		FinalAmount int `json:"finalAmount"`
	}
	c.ShouldBindJSON(&req)

	if err := h.Svc.Order.Complete(c.Request.Context(), orderID, req.FinalAmount); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "订单已完成，积分已发放",
	})
}
