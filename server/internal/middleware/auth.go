// Package middleware 中间件
package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/pkg/jwt"
	"github.com/greencycle/server/pkg/response"
)

// JWTAuth JWT 鉴权
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" {
			response.Unauthorized(c, "请先登录")
			c.Abort()
			return
		}

		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Unauthorized(c, "Token 格式错误")
			c.Abort()
			return
		}

		claims, err := jwt.Parse(parts[1])
		if err != nil {
			response.Unauthorized(c, "Token 无效或已过期")
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("openID", claims.OpenID)
		c.Next()
	}
}

// GetUserID 从 context 获取用户 ID
func GetUserID(c *gin.Context) uint {
	if v, exists := c.Get("userID"); exists {
		return v.(uint)
	}
	return 0
}