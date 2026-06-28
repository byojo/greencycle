# 公共样式目录

存放跨页面复用的样式模块。

## 使用方式

在 `app.wxss` 中通过 `@import` 引入：
```css
@import "/styles/common.wxss";
@import "/styles/variables.wxss";
```

## 规划文件

- `common.wxss`: 通用工具类（flex 布局、padding、margin、文字大小等）
- `variables.wxss`: CSS 变量（颜色、间距、字号等）
- `animations.wxss`: 动画效果

> 当前为空目录，可根据需要补充。
