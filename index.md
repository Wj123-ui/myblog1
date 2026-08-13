---
layout: default
---

<div class="hero-section">
  <p class="hero-kicker">Embedded Systems · Industrial Automation · Hardware</p>
  <h1 class="hero-title">电气自动化与嵌入式开发</h1>
  <p class="hero-subtitle">
    玩转单片机，折腾 PLC，记录硬件与代码的碰撞。
    这里是我的学习历程、项目实战踩坑经验与硬件设计笔记。
  </p>
  <div class="hero-actions">
    <a href="{{ '/archive/' | relative_url }}" class="btn-primary">
      查看最新文章
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 8h10M9 4l4 4-4 4"/>
      </svg>
    </a>
    <a href="{{ '/about/' | relative_url }}" class="btn-secondary">
      关于我
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 3h12M2 8h12M2 13h8"/>
      </svg>
    </a>
  </div>
  <div class="hero-badges">
    <span class="badge">电气自动化</span>
    <span class="badge">嵌入式开发</span>
    <span class="badge">硬件设计</span>
    <span class="badge">技术分享</span>
  </div>
</div>

<div class="about-section">
  <p class="about-intro">
    你好，我是一名<strong>电气自动化</strong>专业的工程师，热衷于嵌入式系统开发与工业控制技术。
    这里记录从示波器到烙铁的各种硬件折腾笔记，欢迎一起交流
    <strong>STM32 / ESP32 / PLC</strong> 和电路设计。
  </p>
</div>

<div class="section-header">
  <h2 class="section-title"><span class="section-hash" aria-hidden="true">#</span>技术栈与工具</h2>
  <p class="section-desc">平时常用的芯片、语言与工具，移到词上看简介。</p>
</div>

<div class="skillmap-section">
  <div class="skillmap-container skillmap-container--tools" id="skillmap-tools">
    <canvas role="img" aria-label="技术栈与工具词云"></canvas>
    <div class="skillmap-tooltip" role="tooltip" aria-hidden="true">
      <div class="skillmap-tooltip-header">
        <span class="skillmap-tooltip-avatar"></span>
        <div>
          <div class="skillmap-tooltip-name"></div>
          <div class="skillmap-tooltip-role"></div>
        </div>
      </div>
      <p class="skillmap-tooltip-quote"></p>
    </div>
  </div>
</div>

<noscript>
  <div class="skills-cloud">
    <span class="skill-tag">STM32</span>
    <span class="skill-tag">ESP32</span>
    <span class="skill-tag">Arduino</span>
    <span class="skill-tag">FreeRTOS</span>
    <span class="skill-tag">C / C++</span>
    <span class="skill-tag">Python</span>
    <span class="skill-tag">PLC 编程</span>
    <span class="skill-tag">Modbus</span>
    <span class="skill-tag">Altium Designer</span>
    <span class="skill-tag">KiCad</span>
    <span class="skill-tag">Keil / IAR</span>
    <span class="skill-tag">CAN 总线</span>
    <span class="skill-tag">PCB Layout</span>
    <span class="skill-tag">电路设计</span>
    <span class="skill-tag">示波器</span>
  </div>
</noscript>

<div class="section-header">
  <h2 class="section-title"><span class="section-hash" aria-hidden="true">#</span>核心技术领域</h2>
  <p class="section-desc">三个方向串起日常实践，把鼠标移到任一技术点看详情。</p>
</div>

<div class="skillmap-section">
  <div class="skillmap-container" id="skillmap">
    <canvas role="img" aria-label="技能关系图：电气自动化、嵌入式开发、硬件设计三大方向及相关技术点"></canvas>
    <div class="skillmap-tooltip" role="tooltip" aria-hidden="true">
      <div class="skillmap-tooltip-header">
        <span class="skillmap-tooltip-avatar"></span>
        <div>
          <div class="skillmap-tooltip-name"></div>
          <div class="skillmap-tooltip-role"></div>
        </div>
      </div>
      <p class="skillmap-tooltip-quote"></p>
    </div>
  </div>
</div>

<noscript>
  <div class="features-grid">
    <div class="feature-card">
      <h3>电气自动化</h3>
      <p>PLC 编程、工控通讯、变频器调试、电气图纸设计，涵盖西门子、三菱等主流平台。</p>
    </div>
    <div class="feature-card">
      <h3>嵌入式开发</h3>
      <p>STM32 / ESP32 / Arduino 单片机开发，RTOS、驱动开发与 C/C++ 实战，从寄存器到系统框架。</p>
    </div>
    <div class="feature-card">
      <h3>硬件设计</h3>
      <p>电路原理图、PCB Layout、元器件选型与调试测试，从模拟电路到高速数字电路的设计记录。</p>
    </div>
  </div>
</noscript>

<div class="section-header">
  <h2 class="section-title"><span class="section-hash" aria-hidden="true">#</span>最新文章</h2>
</div>

<div class="posts-list">
{% for post in site.posts limit:6 %}
  <a href="{{ post.url | relative_url }}" class="post-item">
    <div class="post-meta">
      <time class="post-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
      {% if post.tags %}
        <div class="post-tags">
          {% for tag in post.tags limit:2 %}
            <span class="post-tag">{{ tag }}</span>
          {% endfor %}
        </div>
      {% endif %}
      <span class="post-arrow" aria-hidden="true">→</span>
    </div>
    <span class="post-title">{{ post.title }}</span>
    {% if post.excerpt %}
      <p class="post-excerpt">{{ post.excerpt | strip_html | truncate: 90 }}</p>
    {% endif %}
  </a>
{% endfor %}
</div>

<div class="cta-wrapper">
  <a href="{{ '/archive/' | relative_url }}" class="cta-link">查看所有文章 →</a>
</div>
