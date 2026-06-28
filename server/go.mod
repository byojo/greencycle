module github.com/greencycle/server

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/gin-contrib/cors v1.6.0
	gorm.io/driver/mysql v1.5.2
	gorm.io/gorm v1.25.5
	github.com/redis/go-redis/v9 v9.3.0
	github.com/golang-jwt/jwt/v5 v5.2.0
	github.com/google/uuid v1.5.0
	go.uber.org/zap v1.26.0
	github.com/spf13/viper v1.18.1
	github.com/tencentyun/cos-go-sdk-v5 v0.7.41
	github.com/patrickmn/go-cache v2.1.0+incompatible
	gopkg.in/natefinch/lumberjack.v2 v2.2.1
)