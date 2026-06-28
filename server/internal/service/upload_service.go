package service

import (
	"github.com/greencycle/server/pkg/cos"
)

type UploadService struct {
	cos *cos.Client
}

func NewUploadService(cosCli *cos.Client) *UploadService {
	return &UploadService{cos: cosCli}
}

// SignUpload 生成上传签名
func (s *UploadService) SignUpload(ext string) (*cos.UploadSign, error) {
	return s.cos.SignUpload(ext)
}

// GetFullURL 获取完整 CDN URL
func (s *UploadService) GetFullURL(key string) string {
	return s.cos.GetFullURL(key)
}