package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/pkg/response"
)

// AddressList 地址列表
// GET /api/v1/user/addresses
func (h *Handler) AddressList(c *gin.Context) {
	userID := getUserID(c)
	list, err := h.Svc.Address.ListByUser(c.Request.Context(), userID)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, gin.H{"list": list})
}

// AddressCreate 新增地址
// POST /api/v1/user/addresses
// Body: { name, phone, province, city, district, detail, tag, isDefault }
func (h *Handler) AddressCreate(c *gin.Context) {
	userID := getUserID(c)
	var addr model.Address
	if err := c.ShouldBindJSON(&addr); err != nil {
		response.BadRequest(c, "参数错误："+err.Error())
		return
	}
	addr.UserID = userID
	if err := h.Svc.Address.Create(c.Request.Context(), &addr); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Success(c, addr)
}

// AddressUpdate 更新地址
// PUT /api/v1/user/addresses/:id
// Body: 部分字段（name/phone/province/city/district/detail/tag/isDefault）
func (h *Handler) AddressUpdate(c *gin.Context) {
	userID := getUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		response.BadRequest(c, "地址 ID 无效")
		return
	}
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		response.BadRequest(c, "参数错误："+err.Error())
		return
	}
	if err := h.Svc.Address.Update(c.Request.Context(), uint(id), userID, updates); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	// 返回更新后的完整数据
	list, _ := h.Svc.Address.ListByUser(c.Request.Context(), userID)
	for _, a := range list {
		if a.ID == uint(id) {
			response.Success(c, a)
			return
		}
	}
	response.Success(c, nil)
}

// AddressDelete 删除地址
// DELETE /api/v1/user/addresses/:id
func (h *Handler) AddressDelete(c *gin.Context) {
	userID := getUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		response.BadRequest(c, "地址 ID 无效")
		return
	}
	if err := h.Svc.Address.Delete(c.Request.Context(), uint(id), userID); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Success(c, nil)
}

// AddressSetDefault 设置默认地址
// POST /api/v1/user/addresses/:id/default
func (h *Handler) AddressSetDefault(c *gin.Context) {
	userID := getUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		response.BadRequest(c, "地址 ID 无效")
		return
	}
	if err := h.Svc.Address.SetDefault(c.Request.Context(), userID, uint(id)); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.Success(c, nil)
}
