package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/internal/service"
	"github.com/greencycle/server/pkg/response"
)

type CreateOrderRequest struct {
	CategoryCode string   `json:"categoryCode" binding:"required"`
	ItemName     string   `json:"itemName" binding:"required"`
	ItemDesc     string   `json:"itemDesc"`
	FormData     string   `json:"formData"`
	PhotoKeys    []string `json:"photoKeys" binding:"required,min=1"`
	EstimatedAt  string   `json:"estimatedAt" binding:"required"`
	PickupAddr   string   `json:"pickupAddr" binding:"required"`
	PickupLat    float64  `json:"pickupLat"`
	PickupLng    float64  `json:"pickupLng"`
	Remark       string   `json:"remark"`
}

// CreateOrder 创建订单
func (h *Handler) CreateOrder(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "未登录")
		return
	}

	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	estimatedAt, err := time.Parse("2006-01-02 15:04:05", req.EstimatedAt)
	if err != nil {
		response.BadRequest(c, "时间格式错误")
		return
	}

	order, err := h.Svc.Order.Create(c.Request.Context(), service.CreateOrderParams{
		UserID:       userID,
		CategoryCode: req.CategoryCode,
		ItemName:     req.ItemName,
		ItemDesc:     req.ItemDesc,
		FormData:     req.FormData,
		PhotoKeys:    req.PhotoKeys,
		EstimatedAt:  estimatedAt,
		PickupAddr:   req.PickupAddr,
		PickupLat:    req.PickupLat,
		PickupLng:    req.PickupLng,
		Remark:       req.Remark,
	})
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"orderId": order.ID,
		"orderNo": order.OrderNo,
	})
}

// OrderList 订单列表
func (h *Handler) OrderList(c *gin.Context) {
	userID := getUserID(c)
	page, size := getPageParams(c)
	status, _ := strconv.Atoi(c.DefaultQuery("status", "0"))

	orders, total, err := h.Svc.Order.ListByUser(c.Request.Context(), userID, page, size, status)
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

// OrderDetail 订单详情
func (h *Handler) OrderDetail(c *gin.Context) {
	userID := getUserID(c)
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "订单 ID 错误")
		return
	}

	order, err := h.Svc.Order.GetDetail(c.Request.Context(), orderID, userID)
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, order)
}

// CancelOrder 取消订单
func (h *Handler) CancelOrder(c *gin.Context) {
	userID := getUserID(c)
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "订单 ID 错误")
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	if err := h.Svc.Order.Cancel(c.Request.Context(), orderID, userID, req.Reason); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, nil)
}