---
layout: default
title: 项目展示
permalink: /projects/
---

<div class="projects-page glass-card" style="padding: 40px; max-width: 1000px; margin: 0 auto;">
  <h2 style="color: #f0f6fc; text-align: center; margin-bottom: 40px;">🔧 我的项目</h2>
  
  <p style="color: #a8b3cf; text-align: center; line-height: 1.8; font-size: 1.1em; margin-bottom: 50px;">
    这里展示我的一些电气自动化与嵌入式相关的个人项目，包括硬件设计、嵌入式代码和工业控制应用。
  </p>
  
  <div class="projects-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
    
    <div class="project-card glass-card" style="padding: 30px; text-align: center;">
      <div style="font-size: 3em; margin-bottom: 20px; color: #7b68ee;">🔌</div>
      <h3 style="color: #f0f6fc; margin-bottom: 16px;">智能 PLC 控制系统</h3>
      <p style="color: #a8b3cf; line-height: 1.7; margin-bottom: 24px;">
        基于西门子 S7‑1200 PLC 的自动化生产线控制系统，集成 HMI 触摸屏与远程监控功能。
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
        <span class="skill-tag">PLC</span>
        <span class="skill-tag">HMI</span>
        <span class="skill-tag">SCADA</span>
      </div>
    </div>
    
    <div class="project-card glass-card" style="padding: 30px; text-align: center;">
      <div style="font-size: 3em; margin-bottom: 20px; color: #ff69b4;">🖥️</div>
      <h3 style="color: #f0f6fc; margin-bottom: 16px;">ESP32 环境监测节点</h3>
      <p style="color: #a8b3cf; line-height: 1.7; margin-bottom: 24px;">
        使用 ESP32 采集温湿度、PM2.5 等数据，通过 Wi‑Fi 上传至云平台，实现远程环境监控。
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
        <span class="skill-tag">ESP32</span>
        <span class="skill-tag">FreeRTOS</span>
        <span class="skill-tag">MQTT</span>
      </div>
    </div>
    
    <div class="project-card glass-card" style="padding: 30px; text-align: center;">
      <div style="font-size: 3em; margin-bottom: 20px; color: #9370db;">⚡</div>
      <h3 style="color: #f0f6fc; margin-bottom: 16px;">STM32 四轴飞行器控制器</h3>
      <p style="color: #a8b3cf; line-height: 1.7; margin-bottom: 24px;">
        基于 STM32F4 的四轴飞行器飞控板，实现姿态解算、PID 控制与无线通信功能。
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
        <span class="skill-tag">STM32</span>
        <span class="skill-tag">PID</span>
        <span class="skill-tag">IMU</span>
      </div>
    </div>
    
  </div>
  
  <div style="text-align: center; margin-top: 60px;">
    <p style="color: #a8b3cf; line-height: 1.8; font-size: 1.1em; margin-bottom: 30px;">
      更多项目正在开发中，后续会陆续更新详细的设计文档与源码。
    </p>
    <a href="{{ '/' | relative_url }}" class="social-btn" style="padding: 14px 40px;">
      <span style="margin-right: 8px;">🏠</span> 返回首页
    </a>
  </div>
</div>

<style>
.project-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 50px rgba(123, 104, 238, 0.3);
}
</style>