// 纸飞机服务端入口（适配微信云托管）
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

	db := database.InitMySQL(cfg.MySQL)

	// 自动建表
	db.AutoMigrate(
		&model.PartnerApplication{},
	)

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
		log.Printf("🚀 纸飞机服务已启动 [addr=%s]", cfg.Server.Addr)
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
