---
layout: post
title: "🎨 博客视觉升级：CSS 动画与交互特效实践"
date: 2025-04-16 14:00:00 +0800
categories: ["前端开发", "CSS", "Jekyll"]
tags: ["css", "animation", "jekyll", "frontend", "ui-design"]
excerpt: "分享为 Jekyll 博客添加粒子背景、滚动动画、鼠标光效等交互特效的实现过程。"
---

<svg class="post-header-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" style="width: 100%; max-height: 400px;">
  <defs>
    <linearGradient id="css-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff69b4" />
      <stop offset="100%" stop-color="#7b68ee" />
    </linearGradient>
    <linearGradient id="css-text" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0f6fc" />
    </linearGradient>
    <path id="css-wave" d="M100,200 C200,100 300,300 400,200 C500,100 600,300 700,200" fill="none" />
  </defs>
  <rect width="800" height="400" rx="20" fill="url(#css-bg)" />
  <g transform="translate(150, 120)">
    <rect x="0" y="0" width="120" height="120" rx="20" fill="none" stroke="white" stroke-width="8" />
    <rect x="40" y="40" width="40" height="40" rx="8" fill="white" />
    <circle cx="60" cy="60" r="8" fill="#7b68ee">
      <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
    </circle>
  </g>
  <circle cx="400" cy="150" r="20" fill="white">
    <animate attributeName="cy" values="150;250;150" dur="3s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite" />
  </circle>
  <circle cx="100" cy="200" r="15" fill="white">
    <animateMotion dur="5s" repeatCount="indefinite">
      <mpath xlink:href="#css-wave" />
    </animateMotion>
  </circle>
  <path d="M150,150 L200,100 L250,150 L300,100 L350,150" stroke="white" stroke-width="4" fill="none">
    <animate attributeName="stroke-dashoffset" values="0;-100" dur="2s" repeatCount="indefinite" />
    <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
  </path>
  <text x="400" y="320" text-anchor="middle" fill="url(#css-text)" font-family="Arial, sans-serif" font-size="48" font-weight="bold">CSS Animation Effects</text>
  <g opacity="0.2">
    <circle cx="50" cy="300" r="25" fill="white" />
    <circle cx="750" cy="100" r="20" fill="white" />
    <rect x="650" y="300" width="40" height="40" rx="10" fill="white" />
  </g>
</svg>

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
