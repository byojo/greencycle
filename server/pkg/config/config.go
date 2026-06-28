// Package config 配置加载（适配微信云托管）
//
// 环境变量规范（参考 https://github.com/WeixinCloud/wxcloudrun-golang）：
//   MYSQL_USERNAME / MYSQL_PASSWORD / MYSQL_ADDRESS / MYSQL_DATABASE
//   WECHAT_APPID / WECHAT_APPSECRET
//   JWT_SECRET
//   COS_SECRETID / COS_SECRETKEY / COS_REGION / COS_BUCKET
//   PORT（云托管自动注入，默认 80）
//
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Server ServerConfig
	MySQL  MySQLConfig
	Redis  RedisConfig
	JWT    JWTConfig
	Wechat WechatConfig
	COS    COSConfig
	Log    LogConfig
}

type ServerConfig struct {
	Addr string
	Mode string
}

type MySQLConfig struct {
	Host         string
	Port         int
	User         string
	Password     string
	DBName       string
	Charset      string
	ParseTime    bool
	Loc          string
	MaxOpenConns int
	MaxIdleConns int
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
	PoolSize int
}

type JWTConfig struct {
	Secret      string
	ExpireHours int
}

type WechatConfig struct {
	AppID     string
	AppSecret string
}

type COSConfig struct {
	SecretID     string
	SecretKey    string
	Region       string
	Bucket       string
	UploadPrefix string
	CDNDomain    string
}

type LogConfig struct {
	Level      string
	Path       string
	MaxSize    int
	MaxAge     int
	MaxBackups int
}

var global *Config

// Load 加载配置
// 优先级：环境变量 > config.yaml > 默认值
func Load(path ...string) *Config {
	// ===== 优先从环境变量构造（云托管模式） =====
	if hasCloudEnv() {
		return loadFromEnv()
	}

	// ===== 否则读 yaml 配置（本地开发） =====
	v := viper.New()
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath("./configs")
	v.AddConfigPath(".")
	if len(path) > 0 {
		v.AddConfigPath(path[0])
	}

	v.SetEnvPrefix("GREENCYCLE")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	if err := v.ReadInConfig(); err != nil {
		fmt.Printf("[config] 配置文件未找到，使用默认 + 环境变量: %v\n", err)
	}

	cfg := &Config{}
	if err := v.Unmarshal(cfg); err != nil {
		panic(fmt.Errorf("解析配置失败: %w", err))
	}

	// 部分字段从环境变量读
	overrideFromEnv(cfg)

	global = cfg
	return cfg
}

// hasCloudEnv 检测是否在云托管环境
func hasCloudEnv() bool {
	return os.Getenv("MYSQL_ADDRESS") != "" || os.Getenv("MYSQL_USERNAME") != ""
}

// loadFromEnv 从云托管环境变量构造配置
func loadFromEnv() *Config {
	mysqlAddr := getenv("MYSQL_ADDRESS", "127.0.0.1:3306")
	host, port := parseHostPort(mysqlAddr, 3306)

	cfg := &Config{
		Server: ServerConfig{
			Addr: ":" + getenv("PORT", "80"),
			Mode: getenv("SERVER_MODE", "release"),
		},
		MySQL: MySQLConfig{
			Host:         host,
			Port:         port,
			User:         getenv("MYSQL_USERNAME", "greencycle"),
			Password:     getenv("MYSQL_PASSWORD", ""),
			DBName:       getenv("MYSQL_DATABASE", "greencycle"),
			Charset:      "utf8mb4",
			ParseTime:    true,
			Loc:          "Local",
			MaxOpenConns: 100,
			MaxIdleConns: 10,
		},
		Redis: RedisConfig{
			Host:     getenv("REDIS_HOST", "127.0.0.1"),
			Port:     parseInt(getenv("REDIS_PORT", "6379")),
			Password: getenv("REDIS_PASSWORD", ""),
			DB:       0,
			PoolSize: 50,
		},
		JWT: JWTConfig{
			Secret:      getenv("JWT_SECRET", "change-me"),
			ExpireHours: parseInt(getenv("JWT_EXPIRE_HOURS", "720")),
		},
		Wechat: WechatConfig{
			AppID:     getenv("WECHAT_APPID", ""),
			AppSecret: getenv("WECHAT_APPSECRET", ""),
		},
		COS: COSConfig{
			SecretID:     getenv("COS_SECRETID", ""),
			SecretKey:    getenv("COS_SECRETKEY", ""),
			Region:       getenv("COS_REGION", "ap-shanghai"),
			Bucket:       getenv("COS_BUCKET", ""),
			UploadPrefix: "orders/",
			CDNDomain:    getenv("COS_CDN", ""),
		},
		Log: LogConfig{
			Level:      getenv("LOG_LEVEL", "info"),
			Path:       getenv("LOG_PATH", "./logs"),
			MaxSize:    100,
			MaxAge:     30,
			MaxBackups: 10,
		},
	}

	global = cfg
	return cfg
}

// overrideFromEnv 用环境变量覆盖 yaml 里的字段
func overrideFromEnv(cfg *Config) {
	if v := os.Getenv("PORT"); v != "" {
		cfg.Server.Addr = ":" + v
	}
	if v := os.Getenv("MYSQL_ADDRESS"); v != "" {
		host, port := parseHostPort(v, 3306)
		cfg.MySQL.Host = host
		cfg.MySQL.Port = port
	}
	if v := os.Getenv("MYSQL_USERNAME"); v != "" {
		cfg.MySQL.User = v
	}
	if v := os.Getenv("MYSQL_PASSWORD"); v != "" {
		cfg.MySQL.Password = v
	}
	if v := os.Getenv("MYSQL_DATABASE"); v != "" {
		cfg.MySQL.DBName = v
	}
	if v := os.Getenv("JWT_SECRET"); v != "" {
		cfg.JWT.Secret = v
	}
	if v := os.Getenv("WECHAT_APPID"); v != "" {
		cfg.Wechat.AppID = v
	}
	if v := os.Getenv("WECHAT_APPSECRET"); v != "" {
		cfg.Wechat.AppSecret = v
	}
}

// Get 获取全局配置
func Get() *Config {
	return global
}

// ===== 工具 =====

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func parseInt(s string) int {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return n
}

func parseHostPort(addr string, defaultPort int) (string, int) {
	parts := strings.Split(addr, ":")
	if len(parts) == 2 {
		return parts[0], parseInt(parts[1])
	}
	return parts[0], defaultPort
}
