# 纸飞机部署指南（域名：sxyrgy.cn）

> 适用生产环境：CentOS 7+ / Ubuntu 20+ / Debian 11+
> 目标架构：Nginx (HTTPS) → Go API → MySQL + Redis

---

## 1. 前置准备

### 1.1 域名解析
到域名服务商（阿里云 / 腾讯云）控制台添加 A 记录：

| 主机记录 | 记录类型 | 记录值 |
|---------|---------|--------|
| @ | A | `<服务器公网 IP>` |
| www | A | `<服务器公网 IP>` |
| api | A | `<服务器公网 IP>` |

### 1.2 服务器安全组
放行端口：**80 (HTTP)**、**443 (HTTPS)**、**22 (SSH)**

### 1.3 安装 Docker
```bash
curl -fsSL https://get.docker.com | bash
systemctl start docker && systemctl enable docker
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

---

## 2. 部署代码

```bash
# 2.1 拉取代码（用你自己的 Git 仓库）
cd /opt
git clone https://github.com/your-org/greencycle.git
cd greencycle/deploy

# 2.2 改环境变量
cp .env.example .env  # 或直接编辑
cat .env
```

`.env` 模板：
```bash
# MySQL
MYSQL_ROOT_PASSWORD=YourRoot@Pass123!
MYSQL_DATABASE=greencycle
MYSQL_USER=greencycle
MYSQL_PASSWORD=YourUser@Pass123!

# JWT
JWT_SECRET=$(openssl rand -hex 32)

# 微信小程序
WECHAT_APPID=wx36bbf191a358e44b
WECHAT_APPSECRET=your-app-secret-here

# 腾讯云 COS
COS_SECRETID=your-cos-secret-id
COS_SECRETKEY=your-cos-secret-key
COS_REGION=ap-shanghai
COS_BUCKET=greencycle-1258888888
COS_CDN=https://cdn.sxyrgy.cn
```

```bash
# 2.3 启动（数据库会自动初始化）
docker compose up -d

# 查看日志
docker compose logs -f api
```

---

## 3. 配置 HTTPS（Let's Encrypt 免费证书）

### 3.1 一键申请
```bash
cd /workspace/greencycle/deploy
chmod +x ssl/init-letsencrypt.sh
sudo ./ssl/init-letsencrypt.sh
```

脚本会自动：
1. 安装 certbot
2. 申请证书（域名：sxyrgy.cn / www.sxyrgy.cn / api.sxyrgy.cn）
3. 部署到 `/workspace/greencycle/deploy/nginx/ssl/`
4. 配置 crontab 自动续期（每天 3 点检测，过期自动 renew）

### 3.2 验证
```bash
curl -I https://sxyrgy.cn/health
# 期望：HTTP/2 200

curl https://api.sxyrgy.cn/health
# 期望：{"code":0,"message":"success","data":{"status":"ok"}}
```

---

## 4. 微信公众平台配置

### 4.1 小程序后台 → 开发管理 → 开发设置
**服务器域名**：

| 类型 | 域名 |
|------|------|
| request 合法域名 | `https://sxyrgy.cn` `https://api.sxyrgy.cn` |
| uploadFile 合法域名 | `https://sxyrgy.cn` `https://api.sxyrgy.cn` |
| downloadFile 合法域名 | `https://sxyrgy.cn` `https://api.sxyrgy.cn` |

### 4.2 修改小程序代码
`miniprogram/config.js`：
```js
apiBase: 'https://sxyrgy.cn/v1',  // ✓ 已配置
```

### 4.3 关闭 Mock
发布前改：
```js
useMock: false
```

---

## 5. 业务流程验证

| 检查项 | 命令 | 期望 |
|--------|------|------|
| API 健康 | `curl https://sxyrgy.cn/health` | `{"code":0,...}` |
| 登录 | 小程序登录 | 200 + token |
| 创建订单 | 小程序下单 | 200 + order id |
| 微信回调 | 微信后台域名校验 | 通过 |

---

## 6. 常用运维命令

```bash
# 查看所有容器状态
cd /workspace/greencycle/deploy
docker compose ps

# 看 API 日志
docker compose logs -f --tail=100 api

# 重启 API
docker compose restart api

# 数据库备份
docker exec greencycle-mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" greencycle' > backup_$(date +%Y%m%d).sql

# 数据库恢复
cat backup_20260101.sql | docker exec -i greencycle-mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" greencycle

# 重新申请 SSL 证书（90 天到期前）
sudo certbot renew --force-renewal
```

---

## 7. 故障排查

### 7.1 502 Bad Gateway
```bash
# API 没启动
docker compose ps api
docker compose logs --tail=50 api
docker compose restart api
```

### 7.2 数据库连接失败
```bash
docker compose exec mysql mysql -ugreencycle -p
SHOW DATABASES;
```

### 7.3 证书过期
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
docker compose restart nginx
```

---

## 8. CI/CD（可选）

`.github/workflows/deploy.yml` 已配好，推送 tag 自动部署：
```bash
git tag v1.0.1
git push origin v1.0.1
# → 触发部署：build → push image → ssh pull → restart
```

服务器侧需要在 `/root/.ssh/` 配置 deploy key，环境变量 `DEPLOY_HOST` / `DEPLOY_USER` 在 GitHub Secrets 配置。
