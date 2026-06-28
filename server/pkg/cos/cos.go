// Package cos 腾讯云对象存储
package cos

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/google/uuid"
	"github.com/tencentyun/cos-go-sdk-v5"

	"github.com/greencycle/server/pkg/config"
)

type Client struct {
	client *cos.Client
	cfg    config.COSConfig
}

// NewClient 创建 COS 客户端
func NewClient() *Client {
	cfg := config.Get().COS
	u, _ := url.Parse(fmt.Sprintf("https://%s.cos.%s.myqcloud.com", cfg.Bucket, cfg.Region))
	bucketURL := &cos.BaseURL{BucketURL: u}
	client := cos.NewClient(bucketURL, &http.Client{
		Timeout: 30 * time.Second,
	})

	return &Client{
		client: client,
		cfg:    cfg,
	}
}

// UploadSign 临时上传签名（前端直传 COS）
type UploadSign struct {
	URL      string            `json:"url"`
	Method   string            `json:"method"`
	Key      string            `json:"key"`
	Headers  map[string]string `json:"headers"`
	FormData map[string]string `json:"formData"`
}

// SignUpload 生成上传签名
func (c *Client) SignUpload(ext string) (*UploadSign, error) {
	key := fmt.Sprintf("%s%s.%s", c.cfg.UploadPrefix, uuid.New().String(), ext)

	// 简单签名（生产环境推荐 STS + 临时密钥）
	signedURL, err := c.client.Object.GetPresignedURL(
		context.Background(),
		http.MethodPut,
		key,
		c.cfg.SecretID,
		c.cfg.SecretKey,
		time.Hour,
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("生成上传签名失败: %w", err)
	}

	return &UploadSign{
		URL:    signedURL.String(),
		Method: http.MethodPut,
		Key:    key,
		Headers: map[string]string{
			"Content-Type": getContentType(ext),
		},
	}, nil
}

// GetFullURL 获取完整 CDN URL
func (c *Client) GetFullURL(key string) string {
	if c.cfg.CDNDomain != "" {
		return fmt.Sprintf("%s/%s", c.cfg.CDNDomain, key)
	}
	return fmt.Sprintf("https://%s.cos.%s.myqcloud.com/%s", c.cfg.Bucket, c.cfg.Region, key)
}

func getContentType(ext string) string {
	switch ext {
	case "jpg", "jpeg":
		return "image/jpeg"
	case "png":
		return "image/png"
	case "gif":
		return "image/gif"
	case "webp":
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}