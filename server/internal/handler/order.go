package handler

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/internal/model"
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

// signOrderImages 对订单图片 URL 签名（私有桶）
func (h *Handler) signOrderImages(orders []model.Order) {
	for i := range orders {
		for j := range orders[i].Images {
			orders[i].Images[j].URL = h.Svc.COS.SignKey(orders[i].Images[j].URL)
		}
	}
}

// signSingleOrderImages 对单个订单图片 URL 签名
func (h *Handler) signSingleOrderImages(order *model.Order) {
	for j := range order.Images {
		order.Images[j].URL = h.Svc.COS.SignKey(order.Images[j].URL)
	}
}

// OrderList 订单列表
func (h *Handler) OrderList(c *gin.Context) {
	userID := getUserID(c)
	page, size := getPageParams(c)
	status, err := strconv.Atoi(c.DefaultQuery("status", "0"))
	if err != nil {
		status = 0
	}
	// 校验 status 合法值：0(全部), 1-5
	if status < 0 || status > 5 {
		response.BadRequest(c, "无效的订单状态")
		return
	}

	orders, total, err := h.Svc.Order.ListByUser(c.Request.Context(), userID, page, size, status)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}

	h.signOrderImages(orders)

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

	h.signSingleOrderImages(order)

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