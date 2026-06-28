package handler

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/pkg/response"
)

// UploadSign 直传模式：前端传 base64，后端上传 COS
func (h *Handler) UploadSign(c *gin.Context) {
	var req struct {
		Ext     string `json:"ext"`
		Content string `json:"content"` // base64 编码的图片内容
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}
	if req.Ext == "" {
		req.Ext = "jpg"
	}
	if req.Content == "" {
		response.BadRequest(c, "缺少图片内容")
		return
	}

	sign, err := h.Svc.Upload.SignUpload(req.Ext)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}

	// 解 base64（含 data:image/xxx;base64, 前缀）
	data, err := decodeBase64(req.Content)
	if err != nil {
		response.BadRequest(c, "图片格式错误")
		return
	}

	// 后端直传 COS（云托管有公网出站能力）
	httpReq, _ := http.NewRequest(http.MethodPut, sign.URL, bytes.NewReader(data))
	httpReq.Header.Set("Content-Type", sign.Headers["Content-Type"])
	httpReq.Header.Set("Content-Length", fmt.Sprintf("%d", len(data)))

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		response.ServerError(c, fmt.Sprintf("上传失败: %v", err))
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 204 {
		body, _ := io.ReadAll(resp.Body)
		response.ServerError(c, fmt.Sprintf("COS 返回 %d: %s", resp.StatusCode, string(body)))
		return
	}

	response.Success(c, gin.H{
		"key":     sign.Key,
		"fullUrl": h.Svc.Upload.GetFullURL(sign.Key),
	})
}

// decodeBase64 解析 data:image/xxx;base64,xxx 格式的 base64 字符串
func decodeBase64(s string) ([]byte, error) {
	idx := strings.Index(s, ",")
	if idx >= 0 {
		s = s[idx+1:]
	}
	// 补全 padding
	for len(s)%4 != 0 {
		s += "="
	}
	return []byte(s), nil
}
