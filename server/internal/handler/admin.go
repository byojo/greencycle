package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/pkg/response"
	"github.com/greencycle/server/pkg/wecom"
)

// AdminTestNotify 测试企业微信群通知
func (h *Handler) AdminTestNotify(c *gin.Context) {
	err := wecom.SendMarkdown("## 🧪 测试通知\n\n> 这是一条来自叮当回收服务端的测试消息\n> 收到说明群机器人配置成功 ✅")
	if err != nil {
		response.ServerError(c, "发送失败: "+err.Error())
		return
	}
	response.Success(c, gin.H{"message": "测试消息已发送"})
}

// ========== 骑手管理 ==========

// AdminRiderList 骑手列表（仅在职）
func (h *Handler) AdminRiderList(c *gin.Context) {
	riders, err := h.Svc.Rider.List(c.Request.Context())
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, gin.H{"list": riders})
}

// AdminRiderCreate 创建骑手
func (h *Handler) AdminRiderCreate(c *gin.Context) {
	var req struct {
		Name    string `json:"name" binding:"required,min=2,max=32"`
		Phone   string `json:"phone" binding:"required"`
		IDCard  string `json:"idCard"`
		PlateNo string `json:"plateNo"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	if err := h.Svc.Rider.Create(c.Request.Context(), req.Name, req.Phone, req.IDCard, req.PlateNo); err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, nil)
}

// AdminRiderUpdate 更新骑手
func (h *Handler) AdminRiderUpdate(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "骑手 ID 错误")
		return
	}

	var req struct {
		Name    *string `json:"name"`
		Phone   *string `json:"phone"`
		PlateNo *string `json:"plateNo"`
		Status  *int    `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Phone != nil {
		updates["phone"] = *req.Phone
	}
	if req.PlateNo != nil {
		updates["plate_no"] = *req.PlateNo
	}
	if req.Status != nil {
		if *req.Status != 0 && *req.Status != 1 {
			response.BadRequest(c, "骑手状态只能为 0(离职) 或 1(在职)")
			return
		}
		updates["status"] = *req.Status
	}

	if err := h.Svc.Rider.Update(c.Request.Context(), uint(id), updates); err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, nil)
}

// ========== 订单管理 ==========

// AdminOrderList 管理端订单列表（不按用户过滤）
func (h *Handler) AdminOrderList(c *gin.Context) {
	page, size := getPageParams(c)
	status, _ := strconv.Atoi(c.DefaultQuery("status", "0"))
	if status < 0 || status > 5 {
		response.BadRequest(c, "无效的订单状态")
		return
	}

	orders, total, err := h.Svc.Order.AdminListByUser(c.Request.Context(), page, size, status)
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

// AdminAssignOrder 派单（从骑手列表中选择骑手分配给订单）
// body: { "riderId": 1 }
func (h *Handler) AdminAssignOrder(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "订单 ID 错误")
		return
	}

	var req struct {
		RiderID uint `json:"riderId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	if err := h.Svc.Order.AssignRider(c.Request.Context(), orderID, req.RiderID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "派单成功"})
}

// AdminUpdateOrderStatus 更新订单状态
// body: { "status": 3 }
func (h *Handler) AdminUpdateOrderStatus(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "订单 ID 错误")
		return
	}

	var req struct {
		Status int `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	if req.Status < 1 || req.Status > 5 {
		response.BadRequest(c, "无效的订单状态")
		return
	}

	if err := h.Svc.Order.AdminUpdateStatus(c.Request.Context(), orderID, req.Status, nil, "", ""); err != nil {
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
	if req.FinalAmount < 0 {
		response.BadRequest(c, "金额不能为负数")
		return
	}

	if err := h.Svc.Order.Complete(c.Request.Context(), orderID, req.FinalAmount); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"message": "订单已完成，积分已发放",
	})
}
