// Package logger 日志
package logger

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"

	"github.com/greencycle/server/pkg/config"
)

var lg *zap.Logger

// Init 初始化日志
func Init(cfg config.LogConfig) {
	// 日志级别
	var level zapcore.Level
	if err := level.UnmarshalText([]byte(cfg.Level)); err != nil {
		level = zapcore.InfoLevel
	}

	// 编码器
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
	encoder := zapcore.NewJSONEncoder(encoderConfig)

	// 文件输出（按大小切割）
	fileWriter := &lumberjack.Logger{
		Filename:   cfg.Path,
		MaxSize:    cfg.MaxSize,
		MaxAge:     cfg.MaxAge,
		MaxBackups: cfg.MaxBackups,
		Compress:   true,
	}

	// 多输出：控制台 + 文件
	core := zapcore.NewTee(
		zapcore.NewCore(encoder, zapcore.AddSync(os.Stdout), level),
		zapcore.NewCore(encoder, zapcore.AddSync(fileWriter), level),
	)

	lg = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))
	zap.ReplaceGlobals(lg)
}

// L 获取 logger
func L() *zap.Logger {
	return lg
}

// Sync 刷新
func Sync() {
	if lg != nil {
		_ = lg.Sync()
	}
}