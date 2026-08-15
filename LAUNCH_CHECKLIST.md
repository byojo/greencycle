# 叮当回收 上线前检查清单（Launch Readiness）

> 生成时间：2026-08-15
> 范围：miniprogram（前端）+ server（Go/Gin 后端）+ 微信云托管 + 微信公众平台
> 结论：**代码主体已可用，但仍有 3 项上线阻塞 + 数项高优体验/合规问题，需在代码和微信/云托管控制台两侧补齐。**

---

## 🔴 上线阻塞（不修无法过审 / 功能不可用）

### 1. 隐私政策落地页缺失（代码 + 控制台）
- **现象**：`pages/settings/settings.js:158` 指向 `https://sxyrgy.cn/privacy`，登录页也引用隐私政策。
- **问题**：后端 `router.go` 仅静态托管了 `/admin` 与 `/health`，**没有 `/privacy` 路由或静态页**。该 URL 会 404。
- **微信要求**：小程序必须在 MP 后台登记「隐私保护指引」且 URL 可访问，否则无法发布。
- **修复**：
  - 在服务端新增隐私政策页面（建议 `server` 内加 `r.StaticFile("/privacy", "./privacy/index.html")` 或新增一个 HTML 文件），内容包含信息收集清单（位置、手机号、相册/头像等）。
  - 在 MP 后台「设置 → 服务内容 → 用户隐私保护指引」填入 `https://sxyrgy.cn/privacy` 并提交审核。

### 2. 生产域名 HTTPS / 自定义域名未生效（云托管控制台）
- **现象**：前端 `config.js` 写死 `PROD_API = 'https://sxyrgy.cn/api/v1'`。
- **问题**：项目记忆记载 `sxyrgy.cn` 的 DNS CNAME 已做，但「需在云托管控制台登记自定义域名并签发 SSL 证书后生效」——**目前未生效**。未生效时：
  - 前端所有接口打不通；
  - 微信 MP 后台「request 合法域名」无法添加 `https://sxyrgy.cn`（必须是已备案且可 HTTPS 访问的域名）。
- **修复**：云托管控制台 → 服务设置 → 自定义域名 → 添加 `sxyrgy.cn` → 按提示完成验证并**签发 SSL 证书** → 等待生效。

### 3. 微信公众平台合规配置（控制台）
- **request 合法域名**：必须加入 `https://sxyrgy.cn`（等 #2 生效后）。
- **业务域名**：若用到 `web-view` 嵌入 H5（隐私政策若用 web-view 打开而非原生页），需配置业务域名并下载校验文件放到域名根。
- **类目资质**：回收/二手类目在部分情况下需提交行业资质，提前在 MP 后台核对类目与资质要求。
- **隐私协议登记**：同 #1。

---

## 🟠 高优（影响核心体验 / 可能被审核打回）

### 4. 「联系客服」全部是"开发中"死路
- **位置**：`order-detail.js:209/213/218`、`order-track.js:201/205`。
- **问题**：点击客服直接 `wx.showToast({title:'客服功能开发中'})`，回收业务客服是刚需，且非功能入口易被审核打回。
- **修复**（低成本）：改为拨打客服电话
  ```js
  wx.makePhoneCall({ phoneNumber: config.customerService.phone }); // 15249019944（config.js 已配）
  ```
  或在 `order-track` 接入微信客服消息（`button open-type="contact"`）。

### 5. 多个"开发中"入口是死路，上线前应隐藏或实现
- `pages/points/points.js:97` 签到功能 → "签到功能开发中"
- `pages/settings/settings.js:74` 更换手机号 → "开发中"
- `pages/story/story.js:139` 发布动态 → "发布功能开发中"
- `pages/pick-category/pick-category.js:29/76` 更多品类 → "敬请期待 / 更多品类开发中"
- `pages/profile/profile.js:171` 我的页「账户与安全 / 消息通知」→ "功能开发中"

**建议**：上线前要么把对应入口（`view`/`button`）隐藏（加 `wx:if` 开关或由配置控制），要么实现。保留一堆"开发中"按钮属于破窗体验，且审核可能以"功能不可用"驳回。

---

## 🟡 中优（安全 / 健壮，建议上线前处理）

### 6. CORS 全开
- `server/internal/router/router.go:18`：`AllowAllOrigins: true`。
- **建议**：限制为已知来源：`https://sxyrgy.cn`、云托管默认域名、`http://localhost:*`（本地调试）。

### 7. 订阅消息需配置，否则用户收不到通知
- 后端 `order_service.go:282` 模板 ID 硬编码 `j4dcmYkCBav2QZ8OZQZZjK69Xu4IhUbd-iYt5UG1N-M`，发送失败仅打日志（非致命）。
- **要求**：
  - 先在 MP 后台「订阅消息」申请**相同字段结构**的模板，确认模板 ID 与本 AppID 匹配；
  - 前端需在用户点击动作中调用 `wx.requestSubscribeMessage` 获取授权，否则服务端发送会返回"用户未订阅"。
- 否则派单/完成通知用户收不到（不影响主流程，但体验缺失）。

### 8. 环境变量必须逐项确认已配置（云托管控制台）
- `config/config.go` 有多处**默认值兜底**，若云托管未设环境变量会用默认值：
  - `JWT_SECRET` 默认 `greencycle-default-jwt-secret-2026`（**生产必须用强随机值，否则 token 可被伪造**）；
  - `MYSQL_*`、`WECHAT_APPID/SECRET`、`COS_*`、`ADMIN_KEY`、`ADMIN_USER_IDS`、`WECOM_BOT_KEY`、`REDIS_*`。
- **操作**：云托管控制台逐项核对；`WECOM_BOT_KEY` 已更新为 `afdfe1b4-...`，需**重新部署/重启服务**使环境变量生效。

### 9. 开放接口无限流 / 风控
- `/auth/login`、`/partner-apply` 无需登录即可调用，无频率限制，存在被刷风险。
- **建议**：加基础限流（按 IP/用户）或图形验证码（中低优先级）。

---

## 🟢 低优（清理，不影响上线）

### 10. `config.js` 内错误的 COS 桶占位
- `miniprogram/config.js:21`：`bucket:'greencycle-1258888888'`、`region:'ap-shanghai'` 是占位（真实桶 `greencycle-image-1255464850`/ap-guangzhou 由后端 env 配置，前端该 `cos` 块实际未用于上传，仅 `cdnDomain` 被读且为空）。
- **建议**：删掉或更正，避免后续维护误解。

### 11. 孤儿代码 `onFilter`
- `pages/order-list/order-list.js:207` 的 `onFilter` 在 wxml 中无绑定（筛选已由状态 tab `onStatusChange` 实现），属死代码，可删除。

### 12. `mock.js` 仍打包
- `useMock:false` 已禁用，无害，可保留。

---

## ✅ 已达标项（无需改动）
- 隐私合规封装 `utils/privacy.js`（`getLocation`/`chooseLocation` 前调起授权）已接入首页/地址编辑/骑手端。
- JWT 鉴权中间件、`/admin` 的 `X-Admin-Key` 中间件均在位；`/upload/sign` 在登录组下（需 token）。
- 登录页用户协议/隐私政策勾选门控已实现（弹窗文案为占位，建议补全真实条款链接）。
- 订单"查看更早"真实分页已修复并上线。
- 群通知覆盖回收/兑换各 4 场景（新建/派单/完成/取消），均带订单类型。
- 已完成工单"查看详情"不再误弹填金额框。
- 积分商城商品点击无反应已修复（dataset 传 id 而非整个对象）。

---

## 行动建议（优先级排序）
1. 云托管控制台：登记 `sxyrgy.cn` 自定义域名 + 签发 SSL（#2）。
2. MP 后台：request 合法域名 + 隐私协议 URL 登记 + 类目资质核对（#1/#3）。
3. 代码新增隐私政策页并托管 `/privacy`（#1）。
4. 代码：客服按钮改 `makePhoneCall`；隐藏/实现其余"开发中"入口（#4/#5）。
5. 控制台：核对全部环境变量、重新部署使 WECOM_BOT_KEY 生效（#8）。
6. 代码：CORS 收口、订阅消息模板与前端授权对接（#6/#7）。
7. 清理占位与死代码（#10/#11）。
