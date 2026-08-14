package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/internal/service"
	"github.com/greencycle/server/pkg/response"
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

// ========== 管理端：兑换工单管理 ==========

// AdminExchangeList 管理端兑换工单列表
func (h *Handler) AdminExchangeList(c *gin.Context) {
	status, _ := strconv.Atoi(c.DefaultQuery("status", "0"))
	records, err := h.Svc.Exchange.AdminList(c.Request.Context(), status)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, gin.H{"list": records})
}

// AdminExchangeAssign 分配配送专员
// body: { "riderId": 1 }
func (h *Handler) AdminExchangeAssign(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "工单 ID 错误")
		return
	}

	var req struct {
		RiderID uint `json:"riderId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}

	if err := h.Svc.Exchange.AssignRider(c.Request.Context(), uint(id), req.RiderID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Success(c, gin.H{"message": "已分配配送专员"})
}

// AdminExchangeCancel 取消兑换工单
func (h *Handler) AdminExchangeCancel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "工单 ID 错误")
		return
	}

	if err := h.Svc.Exchange.CancelRecord(c.Request.Context(), uint(id)); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Success(c, gin.H{"message": "已取消"})
}

// ========== 回收专员：配送任务 ==========

// RiderDeliveries 获取分配给当前专员的配送任务
func (h *Handler) RiderDeliveries(c *gin.Context) {
	riderID := h.getRiderID(c)
	if riderID == 0 {
		response.BadRequest(c, "您不是回收专员")
		return
	}

	records, err := h.Svc.Exchange.RiderDeliveries(c.Request.Context(), riderID)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, gin.H{"list": records})
}

// RiderCompleteDelivery 专员标记配送完成
func (h *Handler) RiderCompleteDelivery(c *gin.Context) {
	riderID := h.getRiderID(c)
	if riderID == 0 {
		response.BadRequest(c, "您不是回收专员")
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "工单 ID 错误")
		return
	}

	if err := h.Svc.Exchange.CompleteDelivery(c.Request.Context(), uint(id), riderID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Success(c, gin.H{"message": "配送已完成"})
}

// RiderDeliveryDetail 专员查看分配给自己的配送任务详情
func (h *Handler) RiderDeliveryDetail(c *gin.Context) {
	riderID := h.getRiderID(c)
	if riderID == 0 {
		response.BadRequest(c, "您不是回收专员")
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "工单 ID 错误")
		return
	}

	record, err := h.Svc.Repo.Exchange.GetRecordByID(c.Request.Context(), uint(id))
	if err != nil {
		response.NotFound(c, "配送工单不存在")
		return
	}

	// 仅允许查看分配给自己的配送任务
	if record.RiderID == nil || *record.RiderID != riderID {
		response.BadRequest(c, "无权查看该配送工单")
		return
	}

	response.Success(c, record)
}
