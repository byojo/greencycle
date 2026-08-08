package middleware

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/greencycle/server/pkg/response"
)

// AdminAuth 管理端鉴权中间件
// 通过 X-Admin-Key 请求头校验，密钥从环境变量 ADMIN_KEY 读取
func AdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		adminKey := os.Getenv("ADMIN_KEY")
		if adminKey == "" {
			response.Fail(c, response.CodeForbidden, "管理端未配置")
			c.Abort()
			return
		}

		key := c.GetHeader("X-Admin-Key")
		if key == "" || key != adminKey {
			response.Fail(c, response.CodeForbidden, "无管理权限")
			c.Abort()
			return
		}

		c.Next()
	}
}
