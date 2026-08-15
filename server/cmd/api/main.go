// 叮当回收服务端入口（适配微信云托管）
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/greencycle/server/internal/handler"
	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
	"github.com/greencycle/server/internal/router"
	"github.com/greencycle/server/internal/service"
	"github.com/greencycle/server/pkg/config"
	"github.com/greencycle/server/pkg/cos"
	"github.com/greencycle/server/pkg/database"
	"github.com/greencycle/server/pkg/logger"
	"github.com/greencycle/server/pkg/wechat"
)

func main() {
	cfg := config.Load()
	logger.Init(cfg.Log)
	defer logger.Sync()
	gin.SetMode(cfg.Server.Mode)

	// 安全校验：JWT Secret 不应为空，如果未配置则使用随机值并警告
	if cfg.JWT.Secret == "" {
		log.Println("⚠️ JWT_SECRET 环境变量未设置，使用随机密钥（多实例会导致 token 失效，请尽快配置）")
	}

	db := database.InitMySQL(cfg.MySQL)

	// 自动建表（全部表，忽略索引已存在的错误）
	if err := db.AutoMigrate(
		&model.User{},
		&model.Category{},
		&model.CategoryField{},
		&model.Order{},
		&model.OrderImage{},
		&model.OrderTimeline{},
		&model.Address{},
		&model.CarbonPointLog{},
		&model.CarbonReduction{},
		&model.Story{},
		&model.Rider{},
		&model.PartnerApplication{},
		&model.ExchangeItem{},
		&model.ExchangeRecord{},
	); err != nil {
		log.Printf("⚠️ AutoMigrate 警告（已忽略）: %v", err)
	}

	// 兑换商品种子数据（表为空时才插入）
	seedExchangeItems(db)

	repo := repository.New(db)
	wechatCli := wechat.NewClient()
	cosCli := cos.NewClient()
	svc := service.New(repo, wechatCli, cosCli)
	h := handler.New(svc)
	r := router.Register(h)

	srv := &http.Server{
		Addr:         cfg.Server.Addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("🚀 叮当回收服务已启动 [addr=%s]", cfg.Server.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("服务异常退出: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("正在关闭服务...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("服务关闭异常: %v", err)
	}
	log.Println("服务已退出")
}

// seedExchangeItems 兑换商品种子数据（仅表为空时插入）
// 商品图由服务端静态托管（随容器镜像提供，见 Dockerfile 的 COPY server/assets 与 router 的 /assets 路由）
const assetBaseURL = "https://sxyrgy.cn"

func seedExchangeItems(db *gorm.DB) {
	var count int64
	db.Model(&model.ExchangeItem{}).Count(&count)
	if count > 0 {
		return
	}
	items := []model.ExchangeItem{
		{Name: "环保帆布袋", Desc: "可循环使用的棉布购物袋，减少一次性塑料袋使用", Image: assetBaseURL + "/assets/exchange/bag.png", Points: 200, Stock: 100, LimitPerUser: 5, Sort: 1, Enabled: true},
		{Name: "碳中和徽章", Desc: "绿循环官方认证碳中和徽章，佩戴即环保", Image: assetBaseURL + "/assets/exchange/badge.png", Points: 500, Stock: 200, LimitPerUser: 5, Sort: 2, Enabled: true},
		{Name: "绿植种子套装", Desc: "包含 3 种适合家养的绿植种子，共建绿色家园", Image: assetBaseURL + "/assets/exchange/seeds.png", Points: 800, Stock: 50, LimitPerUser: 5, Sort: 3, Enabled: true},
		{Name: "保温杯", Desc: "不锈钢真空保温杯，随手环保从一杯热水开始", Image: assetBaseURL + "/assets/exchange/cup.png", Points: 1500, Stock: 30, LimitPerUser: 5, Sort: 4, Enabled: true},
		{Name: "电动牙刷", Desc: "声波震动牙刷，环保从每一次刷牙开始", Image: assetBaseURL + "/assets/exchange/toothbrush.png", Points: 3000, Stock: 20, LimitPerUser: 5, Sort: 5, Enabled: true},
	}
	if err := db.Create(&items).Error; err != nil {
		log.Printf("⚠️ 兑换商品种子数据插入失败: %v", err)
	} else {
		log.Printf("✅ 已插入 %d 条兑换商品种子数据", len(items))
	}
}
