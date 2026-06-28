package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/pkg/response"
)

// ListCategories 品类列表
func (h *Handler) ListCategories(c *gin.Context) {
	list, err := h.Svc.Category.List(c.Request.Context())
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, gin.H{"list": list})
}

// CategoryDetail 品类详情
func (h *Handler) CategoryDetail(c *gin.Context) {
	code := c.Param("code")
	cat, fields, err := h.Svc.Category.Detail(c.Request.Context(), code)
	if err != nil {
		response.NotFound(c, "品类不存在")
		return
	}
	response.Success(c, gin.H{
		"category": cat,
		"fields":   fields,
	})
}

// CategoryFields 品类字段配置
func (h *Handler) CategoryFields(c *gin.Context) {
	code := c.Param("code")
	fields, err := h.Svc.Category.Fields(c.Request.Context(), code)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, gin.H{"fields": fields})
}