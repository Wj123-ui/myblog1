---
layout: default
title: 项目展示
permalink: /projects/
---

<div class="projects-page page-container page-container--wide glass-card">
  <h2 class="page-title">🔧 我的项目</h2>

  <p class="page-description">
    这里展示我的一些电气自动化与嵌入式相关的个人项目，包括硬件设计、嵌入式代码和工业控制应用。
  </p>

  <div class="projects-grid">

    <div class="project-card glass-card">
      <div class="project-icon project-icon-purple" aria-hidden="true">🔌</div>
      <h3>智能 PLC 控制系统</h3>
      <p>
        基于西门子 S7‑1200 PLC 的自动化生产线控制系统，集成 HMI 触摸屏与远程监控功能。
      </p>
      <div class="project-tags">
        <span class="skill-tag">PLC</span>
        <span class="skill-tag">HMI</span>
        <span class="skill-tag">SCADA</span>
      </div>
    </div>

    <div class="project-card glass-card">
      <div class="project-icon project-icon-pink" aria-hidden="true">🖥️</div>
      <h3>ESP32 环境监测节点</h3>
      <p>
        使用 ESP32 采集温湿度、PM2.5 等数据，通过 Wi‑Fi 上传至云平台，实现远程环境监控。
      </p>
      <div class="project-tags">
        <span class="skill-tag">ESP32</span>
        <span class="skill-tag">FreeRTOS</span>
        <span class="skill-tag">MQTT</span>
      </div>
    </div>

    <div class="project-card glass-card">
      <div class="project-icon project-icon-lavender" aria-hidden="true">⚡</div>
      <h3>STM32 四轴飞行器控制器</h3>
      <p>
        基于 STM32F4 的四轴飞行器飞控板，实现姿态解算、PID 控制与无线通信功能。
      </p>
      <div class="project-tags">
        <span class="skill-tag">STM32</span>
        <span class="skill-tag">PID</span>
        <span class="skill-tag">IMU</span>
      </div>
    </div>

  </div>

  <div class="page-cta-wrapper page-cta-wrapper--large">
    <p class="page-cta-text">
      更多项目正在开发中，后续会陆续更新详细的设计文档与源码。
    </p>
    <a href="{{ '/' | relative_url }}" class="social-btn social-btn--medium">
      <span aria-hidden="true" style="margin-right: 8px;">🏠</span> 返回首页
    </a>
  </div>
</div>