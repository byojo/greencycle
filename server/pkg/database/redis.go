package database

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"

	"github.com/greencycle/server/pkg/config"
)

// InitRedis 初始化 Redis
func InitRedis(cfg config.RedisConfig) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
		PoolSize: cfg.PoolSize,
	})

	// 测试连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*1e9)
	defer cancel()
	if _, err := rdb.Ping(ctx).Result(); err != nil {
		panic(fmt.Errorf("连接 Redis 失败: %w", err))
	}

	return rdb
}