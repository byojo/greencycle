// Package database 数据库连接
package database

import (
	"fmt"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/greencycle/server/pkg/config"
)

// InitMySQL 初始化 MySQL
func InitMySQL(cfg config.MySQLConfig) *gorm.DB {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=%t&loc=%s",
		cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.DBName,
		cfg.Charset, cfg.ParseTime, cfg.Loc,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		panic(fmt.Errorf("连接 MySQL 失败: %w", err))
	}

	sqlDB, err := db.DB()
	if err != nil {
		panic(err)
	}

	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// 自动迁移（开发环境）
	// db.AutoMigrate(&model.User{}, &model.Order{}, ...)

	return db
}