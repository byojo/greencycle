# 🌱 绿循环 · 项目技术方案

> 旧物回收小程序：让每一件旧物都值得被温柔对待

## 📦 项目结构

```
greencycle/
├── miniprogram/          # 微信小程序前端（11 个核心页面）
├── server/               # Go 服务端（Clean Architecture）
├── sql/                  # MySQL 建表 + 初始数据
├── deploy/               # 部署方案（Docker + Nginx + CI/CD）
├── docs/                 # 技术方案文档
└── README.md             # 本文件
```

## 🎯 核心流程

```
选品类 → 上传照片 → 下单 → 等待上门 → 当面评估 → 当面转账 → 碳积分
```

**核心理念**：回收金额由回收员上门当面评估，用户不同意可当场拒绝，避免线上定价纠纷。

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd deploy
cp .env.example .env  # 填入实际配置
make dev               # 启动 MySQL + Redis + API + Nginx
```

服务地址：
- API: http://localhost:8080
- MySQL: localhost:3306（用户 `greencycle`）
- Redis: localhost:6379
- 健康检查: http://localhost:8080/health

### 2. 启动小程序

1. 打开「微信开发者工具」
2. 选择「导入项目」
3. 项目目录选择 `miniprogram/`
4. 填入你的 AppID
5. 修改 `miniprogram/config.js` 中的 `apiBase` 为你的服务端地址

### 3. 初始化数据库

数据库会自动执行 `sql/schema.sql` 和 `sql/seed.sql` 初始化。

如需手动初始化：
```bash
mysql -uroot -p greencycle < sql/schema.sql
mysql -uroot -p greencycle < sql/seed.sql
```

## 🏗 技术架构

### 整体架构

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  微信小程序       │         │   Go API 服务     │         │     MySQL        │
│  (前端)           │ ──────> │  (业务逻辑)       │ ──────> │   (主存储)       │
│                  │ <────── │                  │ <────── │                  │
└──────────────────┘         └──────┬───────────┘         └──────────────────┘
                                    │
                                    ├──> Redis (会话/缓存)
                                    ├──> 腾讯云 COS (图片)
                                    └──> 微信开放接口
```

### 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端 | 微信小程序原生 | 基础库 2.32+ | 遵循微信开发者规范 |
| 框架 | - | - | 原生框架 + 自定义组件 |
| 服务端 | Go | 1.21+ | 高性能、强类型 |
| Web 框架 | Gin | 1.9+ | 轻量、流行 |
| ORM | GORM | 1.25+ | 支持 MySQL |
| 缓存 | Redis | 7.0+ | 缓存热点数据 |
| 数据库 | MySQL | 8.0+ | 主存储 |
| 对象存储 | 腾讯云 COS | - | 图片、文件 |
| 部署 | Docker | 20+ | 容器化 |
| 反向代理 | Nginx | 1.25+ | HTTPS、负载均衡 |
| CI/CD | GitHub Actions | - | 自动化部署 |

## 📱 微信小程序页面

| 路径 | 说明 |
|------|------|
| `pages/home/home` | 首页 |
| `pages/pick-category/pick-category` | 品类选择 |
| `pages/category-list/category-list` | 分类物品列表 |
| `pages/photo-upload/photo-upload` | **核心：照片上传 + 动态表单** |
| `pages/order-confirm/order-confirm` | 订单确认 |
| `pages/order-success/order-success` | 下单成功 |
| `pages/order-list/order-list` | 订单列表（按月分组，仅显示已完成）|
| `pages/order-detail/order-detail` | 订单详情（动态展示对应品类） |
| `pages/order-track/order-track` | 订单追踪（进行中）|
| `pages/points/points` | 碳积分 |
| `pages/profile/profile` | 个人中心 |
| `pages/story/story` | 改造故事 |
| `pages/address/address` | 地址管理 |
| `pages/login/login` | 登录 |

## 🔌 API 接口

### 不需要鉴权

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/v1/auth/login` | 微信登录 |
| GET | `/api/v1/categories` | 品类列表 |
| GET | `/api/v1/categories/:code` | 品类详情 |
| GET | `/api/v1/categories/:code/fields` | 品类字段配置 |
| GET | `/api/v1/stories` | 故事列表 |
| GET | `/health` | 健康检查 |

### 需要鉴权（JWT）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/user/info` | 用户信息 |
| POST | `/api/v1/orders` | 创建订单 |
| GET | `/api/v1/orders` | 订单列表 |
| GET | `/api/v1/orders/:id` | 订单详情 |
| POST | `/api/v1/orders/:id/cancel` | 取消订单 |
| GET | `/api/v1/points` | 积分概览 |
| GET | `/api/v1/points/history` | 积分流水 |
| GET | `/api/v1/user/addresses` | 地址列表 |
| POST | `/api/v1/user/addresses` | 新增地址 |
| PUT | `/api/v1/user/addresses/:id` | 更新地址 |
| DELETE | `/api/v1/user/addresses/:id` | 删除地址 |
| POST | `/api/v1/upload/sign` | 上传签名 |

## 🗄 MySQL 数据表

| 表名 | 说明 |
|------|------|
| `users` | 用户表 |
| `categories` | 品类表 |
| `category_fields` | 品类动态字段配置 |
| `orders` | 订单表 |
| `order_images` | 订单图片 |
| `order_timelines` | 订单时间线 |
| `carbon_point_logs` | 碳积分流水 |
| `carbon_reductions` | 碳减排记录 |
| `addresses` | 用户地址 |
| `stories` | 改造故事 |
| `riders` | 骑手（回收员） |
| `feedbacks` | 反馈意见 |

## 🚢 部署

### 一键启动开发环境

```bash
make dev
```

### 手动部署

```bash
# 1. 构建服务端
cd server && docker build -t greencycle/server:latest .

# 2. 启动所有服务
cd deploy && docker compose up -d

# 3. 查看日志
make logs
```

### 生产部署

通过 GitHub Actions 自动部署（参考 `.github/workflows/deploy.yml`）。

需要在 GitHub Secrets 配置：
- `SERVER_HOST`: 服务器 IP
- `SERVER_USER`: SSH 用户名
- `SSH_PRIVATE_KEY`: SSH 私钥

## 📂 子项目文档

- [微信小程序文档](./miniprogram/README.md)
- [Go 服务端文档](./server/README.md) （如需创建）
- [技术方案详细文档](./docs/architecture.md)

## 📄 License

MIT