package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/greencycle/server/pkg/logger"
)

// Logger 日志中间件
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()

		if raw != "" {
			path = path + "?" + raw
		}

		logger.L().Info("HTTP",
			zap.Int("status", statusCode),
			zap.String("method", method),
			zap.String("path", path),
			zap.String("ip", clientIP),
			zap.Duration("latency", latency),
			zap.String("errors", c.Errors.String()),
		)
	}
}

// Recovery 错误恢复
func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		logger.L().Error("Panic recovered", zap.Any("error", recovered))
		c.AbortWithStatusJSON(500, gin.H{
			"code":    500,
			"message": "服务器内部错误",
		})
	})
}