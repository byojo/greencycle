// Package router 路由
package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/internal/handler"
	"github.com/greencycle/server/internal/middleware"
)

// Register 注册路由
func Register(h *handler.Handler) *gin.Engine {
	r := gin.New()
	r.Use(middleware.Logger())
	r.Use(middleware.Recovery())
	r.Use(cors.New(cors.Config{
		// 仅允许已知来源，避免任意站点调用接口
		AllowOrigins:     []string{"https://sxyrgy.cn", "https://golang-ox8i-275614-7-1448098353.sh.run.tcloudbase.com", "http://localhost", "http://127.0.0.1"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
	}))

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 管理后台页面
	r.StaticFile("/admin", "./admin/index.html")

	// 隐私政策页（微信小程序发布需在 MP 后台登记该 URL：https://sxyrgy.cn/privacy）
	r.StaticFile("/privacy", "./privacy/index.html")

	// 静态资源（兑换商品图等）：随容器镜像提供，访问地址如 https://sxyrgy.cn/assets/exchange/bag.png
	r.Static("/assets", "./assets")

	api := r.Group("/api/v1")

	// ========== 不需要鉴权 ==========
	api.POST("/auth/login", h.Login)
	api.GET("/categories", h.ListCategories)
	api.GET("/categories/:code", h.CategoryDetail)
	api.GET("/categories/:code/fields", h.CategoryFields)
	api.GET("/stories", h.StoryList)
	api.POST("/partner-apply", h.Partner.Apply)

	// ========== 需要鉴权 ==========
	auth := api.Group("/")
	auth.Use(middleware.JWTAuth())
	{
		auth.GET("/user/info", h.UserInfo)
		auth.PUT("/user/profile", h.UpdateProfile)
		auth.GET("/user/is-admin", h.IsAdmin)
		auth.GET("/user/invite-list", h.InviteList)
		auth.POST("/auth/logout", h.Logout)

		auth.POST("/orders", h.CreateOrder)
		auth.GET("/orders", h.OrderList)
		auth.GET("/orders/:id", h.OrderDetail)
		auth.POST("/orders/:id/cancel", h.CancelOrder)

		auth.GET("/points", h.PointsOverview)
		auth.GET("/points/history", h.PointsHistory)

		auth.GET("/user/addresses", h.AddressList)
		auth.POST("/user/addresses", h.AddressCreate)
		auth.PUT("/user/addresses/:id", h.AddressUpdate)
		auth.DELETE("/user/addresses/:id", h.AddressDelete)
		auth.POST("/user/addresses/:id/default", h.AddressSetDefault)

		auth.POST("/upload/sign", h.UploadSign)

		// 兑换商城
		auth.GET("/exchange/items", h.ExchangeList)
		auth.POST("/exchange", h.ExchangeDo)
		auth.GET("/exchange/history", h.ExchangeHistory)

		// 回收专员工单
		auth.GET("/rider/orders", h.RiderOrders)
		auth.GET("/rider/orders/:id", h.RiderOrderDetail)
		auth.PUT("/rider/orders/:id/pick", h.RiderPickOrder)
		auth.POST("/rider/orders/:id/complete", h.RiderCompleteOrder)
		auth.PUT("/rider/location", h.RiderUpdateLocation)

		// 回收专员配送任务（积分兑换商品配送）
		auth.GET("/rider/deliveries", h.RiderDeliveries)
		auth.GET("/rider/deliveries/:id", h.RiderDeliveryDetail)
		auth.PUT("/rider/deliveries/:id/complete", h.RiderCompleteDelivery)
	}

	// ========== 管理端（X-Admin-Key 鉴权）==========
	admin := api.Group("/admin")
	admin.Use(middleware.AdminAuth())
	{
		// 回收专员管理
		admin.GET("/riders", h.AdminRiderList)
		admin.POST("/riders", h.AdminRiderCreate)
		admin.PUT("/riders/:id", h.AdminRiderUpdate)
		admin.GET("/orders/:id/nearest-riders", h.AdminNearestRiders)

		// 订单管理
		admin.GET("/orders", h.AdminOrderList)
		admin.PUT("/orders/:id/status", h.AdminUpdateOrderStatus)
		admin.POST("/orders/:id/assign", h.AdminAssignOrder)
		admin.POST("/orders/:id/complete", h.AdminCompleteOrder)

		// 加盟申请管理
		admin.GET("/applications", h.AdminApplicationList)
		admin.POST("/applications/:id", h.AdminApproveApplication)

		// 兑换工单管理
		admin.GET("/exchanges", h.AdminExchangeList)
		admin.POST("/exchanges/:id/assign", h.AdminExchangeAssign)
		admin.PUT("/exchanges/:id/cancel", h.AdminExchangeCancel)

		// 测试
		admin.POST("/test-notify", h.AdminTestNotify)
	}

	return r
}
