# 绿循环小程序 · 设计 Token 规范

> 来源：`/workspace/recycle-miniprogram/index.html`（HTML 原型）
> 目标：`/workspace/greencycle/miniprogram/`（微信小程序）
> 原则：颜色 / 间距 / 圆角 / 字号统一，rpx 化后保持视觉一致

---

## 一、颜色系统

### 1.1 主题色

| Token | 值 | 用途 |
|-------|-----|------|
| `--primary` | `#07C160` | 主色（绿循环品牌色）|
| `--primary-dark` | `#06A050` | 主色深态（按下/激活）|
| `--primary-light` | `#E8F8EE` | 主色浅态（背景/标签）|
| `--accent` | `#FF8C42` | 强调色（积分/数字）|

### 1.2 中性色

| Token | 值 | 用途 |
|-------|-----|------|
| `--text-1` | `#1F2937` | 主文字（深灰）|
| `--text-2` | `#6B7280` | 次文字（中灰）|
| `--text-3` | `#9CA3AF` | 辅助文字（浅灰）|
| `--bg` | `#F7F8FA` | 页面背景 |
| `--card` | `#FFFFFF` | 卡片背景 |
| `--border` | `#E5E7EB` | 分割线 |

### 1.3 8 大品类配色（重要！）

| 品类 | 背景色 | 图标 emoji |
|------|--------|-----------|
| 衣物 | `#FEF3C7` | 👕 |
| 手机 | `#DBEAFE` | 📱 |
| 数码 | `#E0E7FF` | 💻 |
| 家电 | `#FEE2E2` | 🔌 |
| 书籍 | `#D1FAE5` | 📚 |
| 废品 | `#FCE7F3` | 🥫 |
| 闲置包 | `#F3E8FF` | 👜 |
| 全部 | `#E5E7EB` | ··· |

> ⚠️ 之前的 ❌ "废品 ♻️" 改为 ✅ "废品 🥫"（原型用 🥫 表示废旧罐子）

### 1.4 故事封面渐变

| 类型 | 渐变 |
|------|------|
| 衣物 | `linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)` |
| 数码 | `linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)` |
| 玩偶 | `linear-gradient(135deg, #F9A8D4 0%, #F472B6 100%)` |
| 默认 | `linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)` |

---

## 二、字体

```css
font-family: 'Inter', 'Noto Sans SC', -apple-system, 
             BlinkMacSystemFont, "PingFang SC", 
             "Hiragino Sans GB", "Microsoft YaHei", 
             sans-serif;
```

> 微信小程序默认用 system font，本规范以系统字体为主。Inter 仅在 PC 模拟器生效。

---

## 三、字号系统（rpx）

| 用途 | 字号 | 备注 |
|------|------|------|
| 数字大字（积分） | 44-48rpx | bold |
| 页面主标题 | 40rpx | bold |
| 区块标题 | 34rpx | bold |
| 卡片标题 | 28-30rpx | semibold |
| 正文 | 26-28rpx | regular |
| 辅助文字 | 22-24rpx | regular |
| 徽标/标签 | 20-22rpx | medium |

---

## 四、间距系统（rpx）

| Token | 值 | 用途 |
|-------|-----|------|
| 页面左右边距 | 32rpx | `.page` |
| 区块上下间距 | 24-40rpx | `.section` |
| 卡片内边距 | 24-32rpx | `.card` |
| 元素间小间距 | 8-16rpx | gap |
| 元素间中间距 | 16-24rpx | gap |
| 元素间大间距 | 32-48rpx | gap |

---

## 五、圆角系统

| 用途 | 圆角 |
|------|------|
| 小标签 | 8rpx |
| 按钮 | 24-32rpx |
| 卡片 | 16-24rpx |
| 大卡片/页面区块 | 28-32rpx |
| FAB 圆形 | 50% |
| 搜索框 | 48rpx |

---

## 六、阴影系统

| 用途 | box-shadow |
|------|-----------|
| 普通卡片 | `0 2rpx 12rpx rgba(0,0,0,0.04)` |
| 浮起卡片 | `0 8rpx 32rpx rgba(0,0,0,0.06)` |
| 凸起卡片 | `0 16rpx 48rpx rgba(0,0,0,0.06)` |
| FAB | `0 8rpx 24rpx rgba(7, 193, 96, 0.35)` |
| 按钮按下 | `0 4rpx 16rpx rgba(7, 193, 96, 0.25)` |

---

## 七、组件规范

### 7.1 按钮

```css
.btn-primary {
  background: linear-gradient(135deg, #07C160 0%, #06A050 100%);
  color: white;
  border-radius: 32rpx;
  padding: 24rpx 48rpx;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.25);
}
```

### 7.2 卡片

```css
.card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}
```

### 7.3 区块标题

```css
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 32rpx 32rpx 16rpx;
}
.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1F2937;
}
.section-more {
  font-size: 24rpx;
  color: #6B7280;
}
```

### 7.4 中间 FAB 按钮

```css
.fab-circle {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.35);
}
```

---

## 八、rpx 换算

原型基于 375px 宽度的 iPhone。1px ≈ 2rpx。

| 原型 px | 小程序 rpx |
|---------|-----------|
| 4px | 8rpx |
| 8px | 16rpx |
| 12px | 24rpx |
| 16px | 32rpx |
| 20px | 40rpx |
| 24px | 48rpx |
| 32px | 64rpx |
| 40px | 80rpx |
| 48px | 96rpx |

---

## 九、注意事项

1. **所有 var(--xxx) 必须展开成具体值**（之前已修过，避免重蹈覆辙）
2. **CSS 变量定义在 page 选择器内有效**，但子选择器使用 var() 有兼容问题
3. **不要在 wxss 里用 @import**（部分版本不支持）
4. **emoji 在不同设备显示略不同**，但可接受
5. **渐变方向 135deg** 是原型统一风格
6. **阴影偏柔和**（低不透明度），不要用纯黑
