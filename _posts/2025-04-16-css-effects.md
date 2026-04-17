---
layout: post
title: "🎨 博客视觉升级：CSS 动画与交互特效实践"
date: 2025-04-16 14:00:00 +0800
categories: ["前端开发", "CSS", "Jekyll"]
tags: ["css", "animation", "jekyll", "frontend", "ui-design"]
excerpt: "分享为 Jekyll 博客添加粒子背景、滚动动画、鼠标光效等交互特效的实现过程。"
---

<img src="{{ site.baseurl }}/assets/images/css-effects.svg" alt="CSS Animation" class="post-header-image">

> 视觉体验是博客的重要组成部分。这篇文章记录了我为博客添加各种 CSS 动画和交互特效的过程。

## 已实现的特效

### 1. 粒子动画背景
首页添加了 Canvas 粒子背景，粒子之间会在一定距离内自动连线，营造出科技感。

```css
#particles-canvas {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: -1;
}
```

### 2. 鼠标跟随光效
页面中有一个柔和的光晕会跟随鼠标移动，增强沉浸感。

### 3. 滚动渐入动画
特性卡片和文章列表项会在滚动到视口时渐现，避免一次性全部展示造成的视觉疲劳。

### 4. 阅读进度条
页面顶部有一条细长的进度条，实时显示当前阅读进度。

### 5. 返回顶部按钮
滚动超过 300px 后，右下角会出现返回顶部按钮，点击后平滑滚动到顶部。

## 特效实现心得

| 特效 | 技术方案 | 性能影响 |
|------|---------|---------|
| 粒子背景 | Canvas 2D | 低（粒子数控制在 25 个） |
| 鼠标光效 | CSS + JS 缓动 | 极低 |
| 滚动动画 | IntersectionObserver | 极低（原生 API） |
| 进度条 | scroll 事件节流 | 低 |

## 代码片段

下面是一个简单的滚动渐入动画实现：

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
});

document.querySelectorAll('.feature-card').forEach(el => {
  observer.observe(el);
});
```

## 下一步

- [ ] 添加暗色/亮色主题切换
- [ ] 接入文章阅读量统计
- [ ] 优化移动端动画性能

---

如果你也喜欢折腾博客样式，欢迎一起交流！✨
