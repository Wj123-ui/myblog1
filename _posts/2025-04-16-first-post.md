---
layout: post
title: "🚀 博客搭建完成：基于 Jekyll + GitHub Pages 的第一篇文章"
date: 2025-04-16 10:00:00 +0800
categories: ["Jekyll", "GitHub Pages", "博客搭建"]
tags: ["jekyll", "github-pages", "blog", "tutorial"]
excerpt: "记录基于 Jekyll 和 GitHub Pages 搭建个人博客的过程，以及选择这套技术栈的原因。"
---

<svg class="post-header-image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" style="width: 100%; max-height: 400px;">
  <defs>
    <linearGradient id="jekyll-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7b68ee" />
      <stop offset="100%" stop-color="#ff69b4" />
    </linearGradient>
    <linearGradient id="jekyll-text" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0f6fc" />
    </linearGradient>
  </defs>
  <rect width="800" height="400" rx="20" fill="url(#jekyll-bg)" />
  <g transform="translate(100, 100) scale(0.8)">
    <path d="M150,150 C200,100 250,100 300,150 C350,200 350,250 300,300 C250,350 200,350 150,300 C100,250 100,200 150,150 Z" fill="none" stroke="white" stroke-width="8" />
    <circle cx="220" cy="180" r="20" fill="white" />
    <circle cx="280" cy="180" r="20" fill="white" />
    <path d="M200,240 Q250,280 300,240" stroke="white" stroke-width="8" fill="none" />
  </g>
  <g transform="translate(450, 100) scale(0.8)">
    <path d="M50,50 L150,150 L50,250 L150,350 L250,250 L150,150 L250,50 Z" fill="none" stroke="white" stroke-width="8" />
    <circle cx="150" cy="150" r="40" fill="rgba(255,255,255,0.2)" />
  </g>
  <text x="400" y="320" text-anchor="middle" fill="url(#jekyll-text)" font-family="Arial, sans-serif" font-size="48" font-weight="bold">Jekyll + GitHub Pages</text>
  <circle cx="50" cy="50" r="20" fill="white" opacity="0.2" />
  <circle cx="750" cy="350" r="30" fill="white" opacity="0.1" />
  <circle cx="700" cy="80" r="15" fill="white" opacity="0.3" />
</svg>

> 这是我的个人博客的第一篇文章，主要记录搭建这个博客的初衷和技术选型。

## 为什么使用 Jekyll + GitHub Pages

在众多的博客方案中，我最终选择了 **Jekyll + GitHub Pages**，主要有以下几个原因：

### 1. 完全免费托管
GitHub Pages 提供免费的静态网站托管服务，并且支持自定义域名。对于个人博客来说，零成本运营是非常重要的优势。

### 2. Markdown 原生支持
所有的文章都使用 Markdown 格式编写，这让写作变得非常纯粹和高效，不需要被复杂的编辑器所干扰。

### 3. 版本控制
因为所有内容都托管在 Git 仓库中，我可以：
- 追踪每一篇文章的修改历史
- 轻松回滚到之前的版本
- 在不同设备上协作写作

### 4. 丰富的主题生态
Jekyll 拥有大量的开源主题，比如我现在使用的 `minima` 主题，简洁大方，非常适合技术博客。

## 博客定位

作为一名电气自动化与嵌入式方向的工程师，这个博客主要会分享以下内容：

| 栏目 | 说明 |
|------|------|
| 🔌 电气自动化 | PLC 编程、工控通讯、变频器调试、电气图纸设计 |
| 🖥️ 嵌入式开发 | STM32 / ESP32 / Arduino、RTOS、驱动开发、C/C++ |
| ⚡ 硬件设计 | 电路原理图、PCB Layout、元器件选型与调试经验 |
| 💡 技术分享 | 工具使用、最佳实践与踩坑总结 |

## 下一步计划

- [ ] 深入学习 Jekyll 主题定制技巧
- [ ] 分享一个 STM32 项目或 PLC 控制项目的实践经验
- [ ] 优化博客的 SEO 和访问速度
- [ ] 接入评论系统，增强互动性

---

如果你也对搭建博客感兴趣，欢迎在评论区留言交流！🎉
