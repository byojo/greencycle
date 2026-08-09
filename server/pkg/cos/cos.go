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
	if cfg.Bucket == "" || cfg.Region == "" {
		// 配置不完整时返回空 client，调用时会报错
		return &Client{cfg: cfg}
	}
	u, err := url.Parse(fmt.Sprintf("https://%s.cos.%s.myqcloud.com", cfg.Bucket, cfg.Region))
	if err != nil {
		return &Client{cfg: cfg}
	}
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
	if c.client == nil {
		return nil, fmt.Errorf("COS 未配置，请设置 COS_BUCKET 和 COS_REGION")
	}
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

// GetSignedURL 获取带签名的读取 URL（私有桶用，有效期 1 小时）
func (c *Client) GetSignedURL(key string) string {
	if c.client == nil {
		return c.GetFullURL(key)
	}
	signedURL, err := c.client.Object.GetPresignedURL(
		context.Background(),
		http.MethodGet,
		key,
		c.cfg.SecretID,
		c.cfg.SecretKey,
		time.Hour,
		nil,
	)
	if err != nil {
		return c.GetFullURL(key)
	}
	return signedURL.String()
}

// SignKey 如果 key 是完整 URL，提取 path 部分再签名
func (c *Client) SignKey(fullURL string) string {
	if fullURL == "" {
		return ""
	}
	// 如果已经是带签名的 URL，直接返回
	if u, err := url.Parse(fullURL); err == nil && u.Query().Get("q-sign-algorithm") != "" {
		return fullURL
	}
	// 提取 key（去掉域名部分）
	key := fullURL
	if u, err := url.Parse(fullURL); err == nil && u.Path != "" {
		key = u.Path[1:] // 去掉前导 /
	}
	return c.GetSignedURL(key)
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