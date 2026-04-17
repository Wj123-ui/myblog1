---
layout: home
---

<div class="hero-section" align="center">
  <div class="avatar-container">
    <img src="https://api.dicebear.com/9.x/adventurer/svg?seed=Electronics&backgroundColor=ffdfbf&hair=variant08&hairColor=2c1810&accessories=variant01&accessoriesColor=ffdfbf" alt="Anime Avatar" class="avatar-img">
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