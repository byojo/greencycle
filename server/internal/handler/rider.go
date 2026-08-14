package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/pkg/response"
)

// RiderUpdateLocation 专员上报实时位置
func (h *Handler) RiderUpdateLocation(c *gin.Context) {
	riderID := h.getRiderID(c)
	if riderID == 0 {
		response.BadRequest(c, "您不是回收专员")
		return
	}

	var req struct {
		Lat float64 `json:"lat" binding:"required"`
		Lng float64 `json:"lng" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}

	if err := h.Svc.Rider.UpdateLocation(c.Request.Context(), riderID, req.Lat, req.Lng); err != nil {
		response.ServerError(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// RiderOrders 获取分配给当前专员的工单
func (h *Handler) RiderOrders(c *gin.Context) {
	riderID := h.getRiderID(c)
	if riderID == 0 {
		response.BadRequest(c, "您不是回收专员")
		return
	}

	month := c.DefaultQuery("month", "")
	orders, err := h.Svc.Rider.GetOrdersByRiderID(c.Request.Context(), riderID, month)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}

	// 填充回收类型名称（按 categoryCode 反查）
	if cats, cerr := h.Svc.Repo.Category.List(c.Request.Context()); cerr == nil {
		catMap := make(map[string]string, len(cats))
		for _, c := range cats {
			catMap[c.Code] = c.Name
		}
		for i := range orders {
			orders[i].CategoryName = catMap[orders[i].CategoryCode]
		}
	}

	// 填充客户联系方式（仅对分配专员可见）
	userIDs := make([]uint, 0, len(orders))
	for i := range orders {
		if orders[i].UserID != 0 {
			userIDs = append(userIDs, orders[i].UserID)
		}
	}
	if len(userIDs) > 0 {
		if users, uerr := h.Svc.Repo.User.FindByIDs(c.Request.Context(), userIDs); uerr == nil {
			userMap := make(map[uint]model.User, len(users))
			for _, u := range users {
				userMap[u.ID] = u
			}
			for i := range orders {
				if u, ok := userMap[orders[i].UserID]; ok {
					orders[i].CustomerName = u.Nickname
					orders[i].CustomerPhone = u.Phone
				}
			}
		}
	}

	// 对图片 URL 签名
	for i := range orders {
		for j := range orders[i].Images {
			orders[i].Images[j].URL = h.Svc.COS.SignKey(orders[i].Images[j].URL)
		}
	}

	response.Success(c, gin.H{"list": orders})
}

// RiderOrderDetail 专员查看分配给自己的工单详情（含客户联系方式）
func (h *Handler) RiderOrderDetail(c *gin.Context) {
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

	order, err := h.Svc.Repo.Order.FindByID(c.Request.Context(), orderID)
	if err != nil {
		response.NotFound(c, "工单不存在")
		return
	}

	// 仅允许查看分配给自己的工单
	if order.RiderID == nil || *order.RiderID != riderID {
		response.BadRequest(c, "无权查看该工单")
		return
	}

	// 附加客户联系方式（仅对分配专员可见）
	if user, uerr := h.Svc.Repo.User.FindByID(c.Request.Context(), order.UserID); uerr == nil && user != nil {
		order.CustomerName = user.Nickname
		order.CustomerPhone = user.Phone
	}

	h.signSingleOrderImages(order)
	response.Success(c, order)
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
