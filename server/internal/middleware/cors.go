package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Cors 跨域中间件
func Cors() gin.HandlerFunc {
	config := cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type", "Authorization", "X-Requested-With"},
		ExposeHeaders:   []string{"Content-Length"},
		MaxAge:          12 * time.Hour,
	}
	return cors.New(config)
}