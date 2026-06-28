# 纸飞机 · 微信小程序

> 旧物回收小程序，绿色环保理念

## 📋 目录结构

```
miniprogram/
├── app.js                    # 小程序入口、全局状态、登录管理
├── app.json                  # 全局配置（页面路由、tabBar、权限）
├── app.wxss                  # 全局样式（CSS 变量、通用类）
├── project.config.json       # 项目配置（微信开发者工具）
├── sitemap.json              # 站点地图
├── config.js                 # 业务配置（API 地址、COS）
│
├── pages/                    # 页面（每个页面 4 个文件）
│   ├── home/                 # 首页
│   ├── pick-category/        # 品类选择
│   ├── category-list/        # 分类物品列表
│   ├── photo-upload/         # 照片上传（核心）
│   ├── order-confirm/        # 订单确认
│   ├── order-success/        # 下单成功
│   ├── order-list/           # 订单列表
│   ├── order-detail/         # 订单详情
│   ├── order-track/          # 订单追踪（进行中）
│   ├── points/               # 碳积分
│   ├── profile/              # 个人中心
│   ├── story/                # 改造故事
│   ├── address/              # 地址管理
│   └── login/                # 登录页
│
├── services/                 # API 服务层
│   ├── request.js            # 网络请求封装（含 401 自动重登）
│   ├── api.js                # API 接口定义
│   └── upload.js             # 图片上传（直传 COS）
│
└── utils/                    # 工具函数
    ├── auth.js               # 登录鉴权
    ├── storage.js            # 本地存储（带过期）
    └── format.js             # 格式化工具
```

## 🚀 快速开始

### 1. 准备工作

- 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册小程序账号，获取 AppID（在 `project.config.json` 中替换 `appid`）
- 准备后端服务（参考 `../server` 目录）

### 2. 配置

修改 `config.js`：

```js
module.exports = {
  // API 地址（开发环境用本地，生产环境用域名）
  apiBase: 'http://localhost:8080/v1',

  // 腾讯云 COS 配置
  cos: {
    bucket: 'your-bucket-appid',
    region: 'ap-shanghai',
    uploadPrefix: 'order-images/'
  }
};
```

修改 `project.config.json` 中的 `appid`：

```json
{
  "appid": "wx1234567890abcdef"
}
```

### 3. 打开项目

1. 启动微信开发者工具
2. 选择「导入项目」
3. 项目目录选择 `miniprogram/`
4. AppID 选择你的小程序 AppID
5. 点击「导入」

### 4. 真机调试

- 点击「真机调试」按钮
- 用微信扫码，即可在手机上预览

## 📱 核心页面说明

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `pages/home/home` | 入口、搜索、积分卡、改造故事 |
| 品类选择 | `pages/pick-category/pick-category` | 8 大品类网格 |
| 分类列表 | `pages/category-list/category-list` | 具体物品列表 |
| **照片上传** | `pages/photo-upload/photo-upload` | 核心：拍照 + 动态表单 |
| 订单确认 | `pages/order-confirm/order-confirm` | 地址 + 时间 + 提交 |
| 下单成功 | `pages/order-success/order-success` | 3s 自动跳转订单列表 |
| 订单列表 | `pages/order-list/order-list` | 按月分组，仅展示已完成 |
| 订单详情 | `pages/order-detail/order-detail` | 动态展示对应品类信息 |
| 订单追踪 | `pages/order-track/order-track` | 进行中订单（地图 mock） |
| 碳积分 | `pages/points/points` | 余额 + 流水 + 兑换 |
| 个人中心 | `pages/profile/profile` | 用户信息 + 9 宫格菜单 |

## 🔄 用户主流程

```
首页 → 品类选择 → 分类列表 → 照片上传 → 订单确认 → 下单成功
                ↓
              订单追踪（进行中）
                ↓
              订单详情（已完成）→ 订单列表
```

## 🔐 关键设计

### 1. 微信登录

```js
// app.js
async login() {
  const { code } = await this.wxLogin();
  const res = await api.login(code);
  // 存储 token 和用户信息
}
```

### 2. 网络请求（含 401 自动重登）

```js
// services/request.js
async function handleUnauthorized() {
  await app.login();  // 静默重登
  // 自动重试原请求
}
```

### 3. 图片上传（直传 COS）

```js
// 1. 服务端返回临时上传签名
const signRes = await api.getUploadSign({ ext: 'jpg' });
// 2. 客户端用签名直传 COS（不走服务端）
wx.uploadFile({ url: signRes.data.url, ... });
```

### 4. 动态品类字段

每个品类的表单字段由后端动态下发：

```js
// 后端返回：
[
  { key: 'model', label: '品牌型号', type: 'text', required: false },
  { key: 'condition', label: '外观成色', type: 'select', options: [...] }
]

// 前端根据 type 渲染不同组件
```

## 🎨 设计规范

### 颜色变量（app.wxss）

```css
--primary: #07C160;      /* 主色 - 绿色 */
--primary-dark: #06A050;
--primary-light: #E8F8EE;
--accent: #FF8C42;       /* 强调色 - 橙色 */
--bg: #F7F8FA;
--text-1: #1F2937;
--text-2: #6B7280;
--text-3: #9CA3AF;
```

### 单位规范

- 所有尺寸用 `rpx`（自适应像素，750rpx = 1 设计稿宽度）
- 字号最小 22rpx（约 11px），保证可读性
- 圆角统一：12rpx / 16rpx / 24rpx / 44rpx

## 🐛 常见问题

### 1. tabBar 不显示图标
原生 tabBar 必须配置 `iconPath`。如果不配置图标，可以：
- 方案 A：使用自定义 tabBar（参考微信文档）
- 方案 B：删除对应 tab，通过其他入口进入该页面

### 2. wx.chooseMedia 部分机型不支持
可以使用 `wx.chooseImage` 作为降级方案：

```js
wx.chooseImage({
  count: 9,
  sizeType: ['compressed'],
  sourceType: ['album', 'camera'],
  success: (res) => { /* ... */ }
});
```

### 3. 网络请求跨域
小程序没有跨域问题，但需要在「微信公众平台」后台配置「request 合法域名」。

## 📦 发布流程

1. 在微信开发者工具中点击「上传」
2. 填写版本号和项目备注
3. 登录 [微信公众平台](https://mp.weixin.qq.com) → 版本管理
4. 提交审核
5. 审核通过后点击「发布」

## 📄 License

MIT