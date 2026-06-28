# 微信云托管部署指南

> 适用：CloudBase Run（微信云托管）
> 参考：[官方文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/src/basic/intro.html)
> 模板仓库：[wxcloudrun-golang](https://github.com/WeixinCloud/wxcloudrun-golang)
> 服务域名：`https://golang-ox8i-275614-7-1448098353.sh.run.tcloudbase.com`

---

## 1. 项目结构（按 wxcloudrun 风格）

```
server/
├── main.go                 # 入口（监听 :80）
├── go.mod
├── Dockerfile              # 云托管标准多阶段构建
├── container.config.json   # 云托管服务配置（容器规格/扩缩容/初始 SQL）
├── .dockerignore
└── (业务代码：model / service / handler)
```

**环境变量规范**（云托管直接识别，无需前缀）：

| 变量名 | 用途 | 示例 |
|--------|------|------|
| `MYSQL_ADDRESS` | MySQL 地址（host:port） | `cdb-xxx.tencentcloud.com:3306` |
| `MYSQL_USERNAME` | MySQL 用户名 | `greencycle` |
| `MYSQL_PASSWORD` | MySQL 密码 | `xxx` |
| `MYSQL_DATABASE` | 数据库名 | `greencycle` |
| `WECHAT_APPID` | 微信 AppID | `wx36bbf191a358e44b` |
| `WECHAT_APPSECRET` | 微信 AppSecret | `xxx` |
| `JWT_SECRET` | JWT 签名密钥 | `$(openssl rand -hex 32)` |
| `COS_SECRETID` | 腾讯云 COS SecretId | `xxx` |
| `COS_SECRETKEY` | 腾讯云 COS SecretKey | `xxx` |
| `COS_REGION` | COS 地域 | `ap-shanghai` |
| `COS_BUCKET` | COS 桶名 | `greencycle-1300000000` |
| `COS_CDN` | CDN 加速域名 | `https://cdn.sxyrgy.cn` |
| `PORT` | 监听端口（云托管自动注入 80） | `80` |
| `SERVER_MODE` | Gin 模式 | `release` |

---

## 2. 三步部署

### 2.1 创建云托管服务

**方式 A：微信开发者工具 / 云开发控制台**
1. 登录 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 云开发
2. 创建/选择环境，记下 `envId`
3. 云托管 → 创建服务
   - 服务名：`greencycle-api`
   - 代码来源：GitHub 仓库
   - 仓库地址：`https://github.com/your-org/greencycle`
   - 代码目录：`server`
   - Dockerfile 路径：`server/Dockerfile`

**方式 B：命令行（推荐）**

```bash
# 安装 CLI
npm install -g @cloudbase/cli
tcb login

# 创建服务
tcb service create greencycle-api \
  --cpu 1 --mem 2 \
  --min-num 0 --max-num 5 \
  --port 80 \
  --path ./server
```

### 2.2 配置环境变量

在云托管控制台 → 服务 `greencycle-api` → 环境变量 → 批量粘贴：

```bash
MYSQL_ADDRESS=cdb-xxx.tencentcloud.com:3306
MYSQL_USERNAME=greencycle
MYSQL_PASSWORD=YourPassword
MYSQL_DATABASE=greencycle
WECHAT_APPID=wx36bbf191a358e44b
WECHAT_APPSECRET=<your-app-secret>
JWT_SECRET=$(openssl rand -hex 32)
COS_SECRETID=your-cos-secret-id
COS_SECRETKEY=your-cos-secret-key
COS_REGION=ap-shanghai
COS_BUCKET=greencycle-1300000000
COS_CDN=https://cdn.sxyrgy.cn
SERVER_MODE=release
```

或 CLI：
```bash
tcb service env update greencycle-api \
  --env MYSQL_ADDRESS=cdb-xxx:3306 \
  --env MYSQL_USERNAME=greencycle \
  --env MYSQL_PASSWORD=xxx \
  --env WECHAT_APPID=wx36bbf191a358e44b \
  --env WECHAT_APPSECRET=xxx \
  --env JWT_SECRET=$(openssl rand -hex 32) \
  ...
```

### 2.3 触发部署

```bash
# 推送代码到 GitHub，触发自动部署
git push origin main

# 或 CLI 手动部署
tcb service deploy greencycle-api -e <envId>
```

---

## 3. 数据库准备（云托管外 MySQL）

### 3.1 创建腾讯云 MySQL
1. [腾讯云 MySQL 控制台](https://console.cloud.tencent.com/cdb) → 新建
2. 配置：MySQL 8.0 / 1核1G / 按量付费 / 同 VPC
3. 帐号管理 → 创建用户 `greencycle`
4. 数据库管理 → 创建数据库 `greencycle`
5. 实例详情 → 拿**内网地址**：`cdb-xxx.tencentcloud.com:3306`

### 3.2 初始化表结构
```bash
# 本地连远端 MySQL
mysql -h cdb-xxx.tencentcloud.com -P 3306 -ugreencycle -p greencycle < sql/schema.sql
mysql -h cdb-xxx.tencentcloud.com -P 3306 -ugreencycle -p greencycle < sql/seed.sql
```

---

## 4. 验证

```bash
# 1. 健康检查
curl https://golang-ox8i-275614-7-1448098353.sh.run.tcloudbase.com/health
# 期望：{"code":0,"message":"success","data":{"status":"ok"}}

# 2. 登录测试
curl -X POST https://golang-ox8i-275614-7-1448098353.sh.run.tcloudbase.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"mock-code","userInfo":{"nickName":"测试"}}'

# 3. 看日志（CLI）
tcb service logs greencycle-api -f

# 4. 微信小程序后台添加合法域名
# mp.weixin.qq.com → 开发管理 → 服务器域名
# 添加: https://golang-ox8i-275614-7-1448098353.sh.run.tcloudbase.com
```

---

## 5. 与 wxcloudrun-golang 的差异

我们的实现基于 wxcloudrun-golang 风格做了**业务扩展**：

| 维度 | wxcloudrun-golang 模板 | 我们的实现 |
|------|----------------------|----------|
| 业务 | 计数器（Counter）| 完整 21 个 API（用户/订单/品类/地址/积分/故事/上传）|
| 数据库 | 1 张表（Counters）| 12 张表（完整业务）|
| 表结构 | 单数命名（counter）| 复数命名（users/orders/...）|
| 配置加载 | 仅环境变量 | 环境变量优先 + yaml 兜底（兼容本地开发）|
| 响应格式 | `{code, errorMsg, data}` | `{code, message, data}`（前端已适配）|
| 架构 | main.go + service/ | main.go + handler/ + service/ + repository/ + model/（Clean Architecture）|
| MySQL 连接池 | 100/200/1h | 100/10/1h（更保守）|

**为什么不用 errorMsg**：因为小程序前端的 request.js 期望 `message` 字段（v17 已经定了）。改前端成本高于改后端响应字段。

---

## 6. 本地开发 vs 云托管

### 6.1 本地开发（不上云）
```bash
# 用 yaml 配置文件 + 兼容环境变量
cd server
cp configs/config.yaml.example configs/config.yaml
# 改 host 为 localhost
go run ./cmd/api
# → 监听 :8080（fallback）
```

### 6.2 云托管
```bash
# 平台自动注入 PORT=80
# 平台注入 MYSQL_ADDRESS 等环境变量
# 应用自动监听 :80
```

切换**零代码**：只靠环境变量。

---

## 7. 成本估算（生产环境）

| 资源 | 规格 | 月费 |
|------|------|------|
| 云托管 | 1 实例 / 1 CPU / 2G | ¥60 |
| MySQL | 1 核 1G | ¥70 |
| COS + CDN | 100G 流量 | ¥20 |
| **合计** | | **¥150/月** |

够 1-3 万 DAU 用。

---

## 8. 常见问题

### Q1: 容器启动报「找不到 config.yaml」
**A**: 正常。云托管模式下不读 yaml，纯环境变量。如果本地跑要 `cp configs/config.yaml.example configs/config.yaml`。

### Q2: MySQL 连接超时
**A**: 检查 MySQL 是否在**同 VPC**，云托管只能连同 VPC 的内网 MySQL。

### Q3: 端口 80 被占用
**A**: 不会，云托管自动注入 `PORT=80` 环境变量，应用从 `os.Getenv("PORT")` 读。

### Q4: 冷启动慢
**A**: 在云托管服务设置把 `minNum` 改为 1（永远至少 1 个实例，免冷启动），月费 +¥30。
