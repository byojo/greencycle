package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/pkg/response"
)

// UploadSign 上传签名
func (h *Handler) UploadSign(c *gin.Context) {
	var req struct {
		Ext string `json:"ext"`
	}
	c.ShouldBindJSON(&req)
	if req.Ext == "" {
		req.Ext = "jpg"
	}

	sign, err := h.Svc.Upload.SignUpload(req.Ext)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}

	// 把 key 转换成完整 URL
	fullURL := h.Svc.Upload.GetFullURL(sign.Key)
	response.Success(c, gin.H{
		"url":       sign.URL,
		"method":    sign.Method,
		"key":       sign.Key,
		"fullUrl":   fullURL,
		"headers":   sign.Headers,
	})
}