# 绿循环 · Go 服务端

> 基于 Gin + GORM 的 Clean Architecture 后端服务

## 📋 目录结构

```
server/
├── cmd/
│   └── api/
│       └── main.go              # 入口文件
├── internal/
│   ├── handler/                 # HTTP Handler
│   │   ├── handler.go
│   │   ├── auth.go              # 鉴权
│   │   ├── category.go          # 品类
│   │   ├── order.go             # 订单
│   │   ├── point.go             # 碳积分
│   │   ├── address.go           # 地址
│   │   ├── story.go             # 故事
│   │   ├── upload.go            # 上传
│   │   └── common.go
│   ├── service/                 # 业务逻辑
│   │   ├── service.go
│   │   ├── auth_service.go
│   │   ├── category_service.go
│   │   ├── order_service.go
│   │   ├── point_service.go
│   │   ├── address_service.go
│   │   ├── story_service.go
│   │   └── upload_service.go
│   ├── repository/              # 数据访问
│   │   ├── repository.go
│   │   ├── user_repo.go
│   │   ├── order_repo.go
│   │   ├── category_repo.go
│   │   ├── point_repo.go
│   │   ├── address_repo.go
│   │   └── story_repo.go
│   ├── model/                   # 数据模型
│   │   ├── user.go
│   │   ├── category.go
│   │   ├── order.go
│   │   ├── point.go
│   │   ├── address.go
│   │   └── story.go
│   ├── middleware/              # 中间件
│   │   ├── auth.go              # JWT
│   │   ├── cors.go              # 跨域
│   │   └── logger.go            # 日志
│   └── router/                  # 路由
│       └── router.go
├── pkg/                         # 公共包
│   ├── config/                  # 配置加载
│   ├── database/                # MySQL / Redis
│   ├── logger/                  # Zap
│   ├── jwt/                     # JWT 工具
│   ├── response/                # 统一响应
│   ├── wechat/                  # 微信开放接口
│   └── cos/                     # 腾讯云 COS
├── configs/
│   └── config.yaml              # 配置文件
├── go.mod
├── go.sum
└── Dockerfile
```

## 🏗 架构层级

```
   HTTP Request
       ↓
   ┌──────────┐
   │ Router   │  路由分发
   └─────┬────┘
         ↓
   ┌──────────┐
   │Middleware│  JWT、CORS、日志、Recovery
   └─────┬────┘
         ↓
   ┌──────────┐
   │ Handler  │  参数解析、响应封装
   └─────┬────┘
         ↓
   ┌──────────┐
   │ Service  │  业务逻辑、事务控制
   └─────┬────┘
         ↓
   ┌──────────┐
   │Repository│  数据访问、SQL 拼接
   └─────┬────┘
         ↓
   ┌──────────┐
   │  Model   │  数据模型
   └──────────┘
```

## 🚀 快速开始

### 1. 本地开发

```bash
# 安装依赖
go mod download

# 修改配置
cp configs/config.yaml.example configs/config.yaml
# 编辑 config.yaml，填入实际的 MySQL、Redis、微信、COS 配置

# 运行
go run ./cmd/api
```

### 2. Docker 构建

```bash
# 构建镜像
docker build -t greencycle/server:latest .

# 运行容器
docker run -d \
  --name greencycle-api \
  -p 8080:8080 \
  -v $(pwd)/configs:/app/configs \
  -v $(pwd)/logs:/app/logs \
  greencycle/server:latest
```

### 3. 通过 Docker Compose

```bash
cd ../deploy
make dev
```

## 📦 依赖说明

| 包 | 用途 |
|----|------|
| `gin-gonic/gin` | HTTP Web 框架 |
| `gorm.io/gorm` | ORM |
| `redis/go-redis` | Redis 客户端 |
| `golang-jwt/jwt` | JWT 鉴权 |
| `spf13/viper` | 配置管理 |
| `uber-go/zap` | 日志 |
| `google/uuid` | UUID 生成 |
| `tencentyun/cos-go-sdk-v5` | 腾讯云 COS |
| `patrickmn/go-cache` | 内存缓存（access_token 等）|

## 🔧 配置项

编辑 `configs/config.yaml`：

```yaml
server:
  addr: ":8080"
  mode: "release"

mysql:
  host: "127.0.0.1"
  port: 3306
  user: "greencycle"
  password: "your_password"
  dbname: "greencycle"

redis:
  host: "127.0.0.1"
  port: 6379
  password: ""
  db: 0

jwt:
  secret: "your-jwt-secret"
  expireHours: 720

wechat:
  appID: "your-appid"
  appSecret: "your-appsecret"

cos:
  secretID: "your-secret-id"
  secretKey: "your-secret-key"
  region: "ap-shanghai"
  bucket: "your-bucket-appid"
  cdnDomain: "https://cdn.your-domain.com"
```

支持环境变量覆盖，前缀 `GREENCYCLE_`，如 `GREENCYCLE_MYSQL_HOST`。

## 🛣 API 路由

### 鉴权
- `POST /api/v1/auth/login` - 微信登录
- `GET  /api/v1/user/info` - 用户信息
- `POST /api/v1/auth/logout` - 退出登录

### 品类
- `GET  /api/v1/categories` - 品类列表
- `GET  /api/v1/categories/:code` - 品类详情
- `GET  /api/v1/categories/:code/fields` - 字段配置

### 订单
- `POST /api/v1/orders` - 创建订单
- `GET  /api/v1/orders` - 订单列表
- `GET  /api/v1/orders/:id` - 订单详情
- `POST /api/v1/orders/:id/cancel` - 取消订单

### 碳积分
- `GET  /api/v1/points` - 积分概览
- `GET  /api/v1/points/history` - 积分流水

### 地址
- `GET    /api/v1/user/addresses` - 地址列表
- `POST   /api/v1/user/addresses` - 新增地址
- `PUT    /api/v1/user/addresses/:id` - 更新地址
- `DELETE /api/v1/user/addresses/:id` - 删除地址
- `POST   /api/v1/user/addresses/:id/default` - 设为默认

### 上传
- `POST /api/v1/upload/sign` - 获取上传签名

### 内容
- `GET /api/v1/stories` - 故事列表

## 📊 响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

错误码：
- `0`: 成功
- `400`: 参数错误
- `401`: 未登录
- `403`: 无权限
- `404`: 资源不存在
- `500`: 服务器异常

## 🧪 测试

```bash
# 运行所有测试
go test ./...

# 运行单个包
go test ./internal/service/...

# 带覆盖率
go test -cover ./...
```

## 📊 代码风格

```bash
# 格式化
gofmt -w .

# 检查
go vet ./...
```

## 🐛 常见问题

### 1. 数据库连接失败
检查 `configs/config.yaml` 中的 MySQL 配置，确保：
- 用户名密码正确
- 数据库已创建（`CREATE DATABASE greencycle`）
- MySQL 服务已启动

### 2. 微信登录失败
- 检查 `wechat.appID` 和 `wechat.appSecret` 是否正确
- 检查小程序后台的服务器域名是否配置
- 检查网络是否能访问微信接口

### 3. 图片上传失败
- 检查 COS 凭证是否正确
- 检查 bucket 是否存在
- 检查 CORS 配置（前端可能跨域）

## 📄 License

MIT