---
layout: home
---

<div class="hero-section" align="center">
  <div class="avatar-container">
    <svg class="avatar-img" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 160px; height: 160px; border-radius: 50%; border: 8px solid rgba(13, 17, 23, 0.9); background: rgba(13, 17, 23, 0.95); box-shadow: 0 0 60px rgba(123, 104, 238, 0.6), 0 0 120px rgba(123, 104, 238, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.05);">
      <defs>
        <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e2130"/>
          <stop offset="100%" stop-color="#2a2d3e"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <!-- PCB 基板圆盘 -->
      <circle cx="100" cy="100" r="90" fill="#16122b" stroke="#7b68ee" stroke-width="1.5" opacity="0.4"/>
      <circle cx="100" cy="100" r="82" fill="none" stroke="#ff69b4" stroke-width="0.5" opacity="0.3" stroke-dasharray="4,4"/>
      
      <!-- 外圈焊盘孔 -->
      <circle cx="100" cy="20" r="3" fill="#0d0a1f" stroke="#7b68ee" stroke-width="1.5"/>
      <circle cx="100" cy="180" r="3" fill="#0d0a1f" stroke="#7b68ee" stroke-width="1.5"/>
      <circle cx="20" cy="100" r="3" fill="#0d0a1f" stroke="#7b68ee" stroke-width="1.5"/>
      <circle cx="180" cy="100" r="3" fill="#0d0a1f" stroke="#7b68ee" stroke-width="1.5"/>
      <circle cx="43" cy="43" r="3" fill="#0d0a1f" stroke="#ff69b4" stroke-width="1.5"/>
      <circle cx="157" cy="43" r="3" fill="#0d0a1f" stroke="#ff69b4" stroke-width="1.5"/>
      <circle cx="43" cy="157" r="3" fill="#0d0a1f" stroke="#ff69b4" stroke-width="1.5"/>
      <circle cx="157" cy="157" r="3" fill="#0d0a1f" stroke="#ff69b4" stroke-width="1.5"/>
      
      <!-- 主芯片 (STM32 风格) -->
      <rect x="65" y="65" width="70" height="70" rx="4" fill="url(#chipGrad)" stroke="#7b68ee" stroke-width="2"/>
      <!-- 芯片引脚 -->
      <rect x="58" y="72" width="6" height="3" fill="#b19cd9"/>
      <rect x="58" y="82" width="6" height="3" fill="#b19cd9"/>
      <rect x="58" y="92" width="6" height="3" fill="#b19cd9"/>
      <rect x="58" y="102" width="6" height="3" fill="#b19cd9"/>
      <rect x="58" y="112" width="6" height="3" fill="#b19cd9"/>
      <rect x="58" y="122" width="6" height="3" fill="#b19cd9"/>
      
      <rect x="135" y="72" width="6" height="3" fill="#b19cd9"/>
      <rect x="135" y="82" width="6" height="3" fill="#b19cd9"/>
      <rect x="135" y="92" width="6" height="3" fill="#b19cd9"/>
      <rect x="135" y="102" width="6" height="3" fill="#b19cd9"/>
      <rect x="135" y="112" width="6" height="3" fill="#b19cd9"/>
      <rect x="135" y="122" width="6" height="3" fill="#b19cd9"/>
      
      <rect x="72" y="58" width="3" height="6" fill="#b19cd9"/>
      <rect x="82" y="58" width="3" height="6" fill="#b19cd9"/>
      <rect x="92" y="58" width="3" height="6" fill="#b19cd9"/>
      <rect x="102" y="58" width="3" height="6" fill="#b19cd9"/>
      <rect x="112" y="58" width="3" height="6" fill="#b19cd9"/>
      <rect x="122" y="58" width="3" height="6" fill="#b19cd9"/>
      
      <rect x="72" y="135" width="3" height="6" fill="#b19cd9"/>
      <rect x="82" y="135" width="3" height="6" fill="#b19cd9"/>
      <rect x="92" y="135" width="3" height="6" fill="#b19cd9"/>
      <rect x="102" y="135" width="3" height="6" fill="#b19cd9"/>
      <rect x="112" y="135" width="3" height="6" fill="#b19cd9"/>
      <rect x="122" y="135" width="3" height="6" fill="#b19cd9"/>
      
      <!-- 芯片中心圆点 -->
      <circle cx="100" cy="100" r="12" fill="#7b68ee" opacity="0.3"/>
      <circle cx="100" cy="100" r="6" fill="#ff69b4" filter="url(#glow)"/>
      
      <!-- 走线 -->
      <path d="M43,43 L65,72" stroke="#7b68ee" stroke-width="1.5" fill="none" opacity="0.8"/>
      <path d="M157,43 L135,72" stroke="#ff69b4" stroke-width="1.5" fill="none" opacity="0.8"/>
      <path d="M43,157 L65,128" stroke="#ff69b4" stroke-width="1.5" fill="none" opacity="0.8"/>
      <path d="M157,157 L135,128" stroke="#7b68ee" stroke-width="1.5" fill="none" opacity="0.8"/>
      
      <!-- 电阻 -->
      <rect x="25" y="95" width="20" height="10" fill="none" stroke="#d4c2ff" stroke-width="1.5"/>
      <line x1="20" y1="100" x2="25" y2="100" stroke="#d4c2ff" stroke-width="1.5"/>
      <line x1="45" y1="100" x2="58" y2="100" stroke="#d4c2ff" stroke-width="1.5"/>
      
      <!-- 电容 -->
      <line x1="150" y1="95" x2="150" y2="105" stroke="#d4c2ff" stroke-width="1.5"/>
      <line x1="155" y1="95" x2="155" y2="105" stroke="#d4c2ff" stroke-width="1.5"/>
      <line x1="142" y1="100" x2="150" y2="100" stroke="#d4c2ff" stroke-width="1.5"/>
      <line x1="155" y1="100" x2="170" y2="100" stroke="#d4c2ff" stroke-width="1.5"/>
      
      <!-- LED -->
      <circle cx="100" cy="30" r="5" fill="#00ff88" filter="url(#glow)"/>
      <line x1="100" y1="35" x2="100" y2="58" stroke="#7b68ee" stroke-width="1.5" opacity="0.8"/>
      
      <!-- 晶体振荡器 -->
      <rect x="90" y="142" width="20" height="12" rx="2" fill="none" stroke="#ff69b4" stroke-width="1.5"/>
      <line x1="92" y1="135" x2="92" y2="142" stroke="#ff69b4" stroke-width="1.5"/>
      <line x1="108" y1="135" x2="108" y2="142" stroke="#ff69b4" stroke-width="1.5"/>
      
      <!-- 过孔 / 焊点 -->
      <circle cx="60" cy="60" r="2.5" fill="#7b68ee" opacity="0.6"/>
      <circle cx="140" cy="60" r="2.5" fill="#ff69b4" opacity="0.6"/>
      <circle cx="60" cy="140" r="2.5" fill="#ff69b4" opacity="0.6"/>
      <circle cx="140" cy="140" r="2.5" fill="#7b68ee" opacity="0.6"/>
      <circle cx="100" cy="170" r="2.5" fill="#7b68ee" opacity="0.6"/>
      
      <!-- 丝印文字 -->
      <text x="100" y="88" text-anchor="middle" fill="#b19cd9" font-family="Consolas, monospace" font-size="6" font-weight="bold">STM32</text>
      <text x="100" y="125" text-anchor="middle" fill="#7b68ee" font-family="Consolas, monospace" font-size="5" opacity="0.7">⚡ MCU</text>
      
      <!-- 电流脉冲动画 -->
      <circle cx="100" cy="100" r="18" fill="none" stroke="#ff69b4" stroke-width="1" opacity="0.5">
        <animate attributeName="r" values="18;30;18" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  </div>
  
  <h1 class="hero-title">
    <span class="gradient-text">⚡ 电气自动化与嵌入式</span>
  </h1>
  
  <p class="hero-subtitle">
    玩转单片机 · 折腾 PLC · 记录硬件与代码的碰撞
  </p>
  
  <div class="hero-badges">
    <span class="badge">🔌 电气自动化</span>
    <span class="badge">🖥️ 嵌入式开发</span>
    <span class="badge">⚙️ 硬件设计</span>
    <span class="badge">💡 技术分享</span>
  </div>
</div>

<div class="about-section glass-card">
  <p style="display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;">
    <span style="font-size: 1.5em;">👋</span>
    <span>你好，我是一名电气自动化专业的学生/工程师，热衷于嵌入式系统开发和工业控制技术。</span>
    <span style="font-size: 1.5em;">🔧</span>
    <span>这里记录我的学习历程、项目实战踩坑经验，以及从示波器到烙铁的各种硬件折腾笔记。</span>
    <span style="font-size: 1.5em;">🚀</span>
    <span>欢迎一起交流 STM32、ESP32、PLC 和电路设计！</span>
  </p>
</div>

<div style="text-align: center; margin: 30px 0;">
  <h3 style="color: #b19cd9; margin-bottom: 20px; font-size: 1.1em;">
    🛠️ 技术栈与工具
  </h3>
</div>

<div class="skills-cloud">
  <span class="skill-tag">🔹 STM32</span>
  <span class="skill-tag">🔸 ESP32</span>
  <span class="skill-tag">🔹 Arduino</span>
  <span class="skill-tag">🔸 FreeRTOS</span>
  <span class="skill-tag">🔹 C / C++</span>
  <span class="skill-tag">🔸 Python</span>
  <span class="skill-tag">🔹 PLC 编程</span>
  <span class="skill-tag">🔸 Modbus</span>
  <span class="skill-tag">🔹 Altium Designer</span>
  <span class="skill-tag">🔸 KiCad</span>
  <span class="skill-tag">🔹 Keil / IAR</span>
  <span class="skill-tag">🔸 CAN 总线</span>
  <span class="skill-tag">🔹 PCB Layout</span>
  <span class="skill-tag">🔸 电路设计</span>
  <span class="skill-tag">🔹 示波器</span>
  <span class="skill-tag">🔸 万用表</span>
</div>

---

<h2 class="section-title">🚀 核心技术领域</h2>

<div class="features-grid">
  <div class="feature-card glass-card">
    <div class="feature-icon">⚡</div>
    <h3>电气自动化</h3>
    <p>PLC 编程、工控通讯、变频器调试、电气图纸设计等工业自动化技术笔记。涵盖西门子、三菱等主流 PLC 平台。</p>
    <div style="margin-top: 20px; font-size: 0.9em; color: #a8b3cf;">
      <span style="display: inline-block; margin-right: 10px;">🏭 工业控制</span>
      <span style="display: inline-block; margin-right: 10px;">🔧 设备调试</span>
      <span style="display: inline-block;">📊 数据采集</span>
    </div>
  </div>
  
  <div class="feature-card glass-card">
    <div class="feature-icon">💻</div>
    <h3>嵌入式开发</h3>
    <p>STM32 / ESP32 / Arduino 等单片机开发，RTOS、驱动开发、C/C++ 代码实战。从寄存器操作到系统框架全面覆盖。</p>
    <div style="margin-top: 20px; font-size: 0.9em; color: #a8b3cf;">
      <span style="display: inline-block; margin-right: 10px;">🖥️ 单片机</span>
      <span style="display: inline-block; margin-right: 10px;">⚙️ 驱动开发</span>
      <span style="display: inline-block;">🔗 通信协议</span>
    </div>
  </div>
  
  <div class="feature-card glass-card">
    <div class="feature-icon">🔧</div>
    <h3>硬件设计</h3>
    <p>电路原理图、PCB Layout、元器件选型、示波器与烙铁陪伴的硬件折腾记录。从模拟电路到高速数字电路设计。</p>
    <div style="margin-top: 20px; font-size: 0.9em; color: #a8b3cf;">
      <span style="display: inline-block; margin-right: 10px;">📐 电路设计</span>
      <span style="display: inline-block; margin-right: 10px;">🔌 PCB Layout</span>
      <span style="display: inline-block;">🔍 调试测试</span>
    </div>
  </div>
</div>

---

<h2 class="section-title">📚 最新文章</h2>

<div class="posts-list">
{% for post in site.posts limit:6 %}
  <a href="{{ post.url | relative_url }}" class="post-item glass-card">
    <div class="post-meta">
      <span class="post-date">{{ post.date | date: "%Y-%m-%d" }}</span>
      {% if post.tags %}
        <div class="post-tags">
          {% for tag in post.tags limit:3 %}
            <span class="post-tag">{{ tag }}</span>
          {% endfor %}
        </div>
      {% endif %}
      <span class="post-arrow">→</span>
    </div>
    <span class="post-title">{{ post.title }}</span>
    {% if post.excerpt %}
      <p class="post-excerpt">{{ post.excerpt | strip_html | truncate: 100 }}</p>
    {% endif %}
    <div style="display: flex; align-items: center; margin-top: 10px;">
      <span style="font-size: 0.85em; color: #8b949e; background: rgba(123, 104, 238, 0.1); padding: 3px 10px; border-radius: 12px; border: 1px solid rgba(123, 104, 238, 0.2);">
        📖 阅读全文
      </span>
    </div>
  </a>
{% endfor %}
</div>

<div style="text-align: center; margin: 40px 0;">
  <a href="/archive" style="display: inline-block; padding: 12px 30px; background: rgba(123, 104, 238, 0.15); border: 1px solid rgba(123, 104, 238, 0.3); border-radius: 25px; color: #b19cd9; text-decoration: none; font-weight: 600; transition: all 0.3s ease;">
    查看所有文章 →
  </a>
</div>

---

<div align="center" class="footer-cta glass-card">
  <div style="margin-bottom: 24px;">
    <span style="font-size: 1.8em; margin-right: 15px;">📬</span>
    <span style="font-size: 1.8em; margin-right: 15px;">💬</span>
    <span style="font-size: 1.8em;">🚀</span>
  </div>
  <p style="font-size: 1.4em; margin-bottom: 32px; color: #d4c2ff; font-weight: 600;">
    欢迎交流讨论，一起探索电气与嵌入式的无限可能！
  </p>
  <div class="social-links">
    <a href="https://github.com/Wj123-ui" class="social-btn" target="_blank">
      <span style="margin-right: 8px;">🐙</span> GitHub
    </a>
    <a href="mailto:your-email@example.com" class="social-btn">
      <span style="margin-right: 8px;">📧</span> Email
    </a>
    <a href="https://wj123-ui.github.io/myblog1" class="social-btn" style="background: linear-gradient(135deg, #ff69b4 0%, #7b68ee 100%);">
      <span style="margin-right: 8px;">🌐</span> 博客主页
    </a>
  </div>
  <p style="margin-top: 32px; color: #a8b3cf; font-size: 0.95em;">
    © 2025 电气自动化与嵌入式博客 · 基于 Jekyll + GitHub Pages 构建
  </p>
</div>

<!-- 粒子动画背景 -->
<canvas id="particles-canvas"></canvas>

<script>
(function() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  
  const particles = [];
  const particleCount = 45;
  const colors = [
    'rgba(123, 104, 238, 0.5)',
    'rgba(255, 105, 180, 0.4)',
    'rgba(147, 112, 219, 0.35)',
    'rgba(180, 120, 255, 0.3)',
    'rgba(255, 182, 193, 0.25)'
  ];
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.5 + 0.3
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', `, ${p.opacity})`);
      ctx.fill();
      
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[j].x - p.x;
        const dy = particles[j].y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const alpha = 0.15 * (1 - dist / 150);
          ctx.strokeStyle = `rgba(123, 104, 238, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
  
  // 添加一些交互效果
  const cards = document.querySelectorAll('.glass-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      card.classList.add('transforming');
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateY = (x - centerX) / 25;
      const rotateX = (centerY - y) / 25;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
      setTimeout(() => {
        card.style.transform = '';
        card.classList.remove('transforming');
      }, 300);
    });
  });
})();
</script>