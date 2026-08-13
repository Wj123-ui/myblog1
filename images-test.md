---
layout: default
title: 图片测试页面
permalink: /images-test/
---

<div class="images-test page-container page-container--narrow">
  <h2 class="page-title">图片加载测试</h2>

  <p class="page-description">
    此页面用于测试博客中所有图片的加载情况。如果图片无法显示，请检查网络连接或图片路径。
  </p>

  <h3 class="about-section-heading">图片 URL 列表</h3>
  <ul style="color: var(--text-secondary); line-height: 2; font-family: var(--font-mono); font-size: 13px;">
    <li>头像: <a href="{{ site.baseurl }}/assets/images/avatar.jpg" target="_blank">DiceBear API</a></li>
    <li>Jekyll文章图: <a href="{{ site.baseurl }}/assets/images/jekyll-github.svg" target="_blank">{{ site.baseurl }}/assets/images/jekyll-github.svg</a></li>
    <li>CSS效果图: <a href="{{ site.baseurl }}/assets/images/css-effects.svg" target="_blank">{{ site.baseurl }}/assets/images/css-effects.svg</a></li>
    <li>STM32/PLC图: <a href="{{ site.baseurl }}/assets/images/stm32-plc.svg" target="_blank">{{ site.baseurl }}/assets/images/stm32-plc.svg</a></li>
    <li>Favicon: <a href="{{ site.baseurl }}/favicon.svg" target="_blank">{{ site.baseurl }}/favicon.svg</a></li>
  </ul>

  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin: 32px 0;">
    <div style="padding: 20px; text-align: center; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius);">
      <h4 style="color: var(--text); margin: 0 0 14px;">DiceBear 头像</h4>
      <img src="{{ site.baseurl }}/assets/images/avatar.jpg" alt="Avatar" loading="lazy" decoding="async" style="width: 150px; height: 150px; border-radius: 50%; border: 1px solid var(--border-strong);">
      <p style="color: var(--text-muted); margin: 10px 0 0; font-size: 13px;">外部SVG (DiceBear API)</p>
    </div>

    <div style="padding: 20px; text-align: center; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius);">
      <h4 style="color: var(--text); margin: 0 0 14px;">Jekyll文章图</h4>
      <img src="{{ site.baseurl }}/assets/images/jekyll-github.svg" alt="Jekyll GitHub" loading="lazy" decoding="async" style="width: 100%; height: 150px; object-fit: contain; border-radius: 10px; border: 1px solid var(--border-strong);">
      <p style="color: var(--text-muted); margin: 10px 0 0; font-size: 13px;">本地SVG</p>
    </div>
  </div>

  <h3 class="about-section-heading">故障排除</h3>
  <ul style="color: var(--text-secondary); line-height: 1.8; padding-left: 22px;">
    <li>如果图片无法加载，请尝试直接点击上面的 URL 链接测试</li>
    <li>检查浏览器控制台是否有错误信息（F12 → Console）</li>
    <li>确保网络连接正常，可以访问 GitHub Pages</li>
    <li>清空浏览器缓存并刷新页面（Ctrl+F5）</li>
    <li>SVG 图片可能需要几秒钟时间加载和渲染</li>
  </ul>

  <div class="page-cta-wrapper">
    <a href="{{ '/' | relative_url }}" class="social-btn social-btn--medium">
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M10 3 5 8l5 5"/>
      </svg>
      返回首页
    </a>
  </div>
</div>
