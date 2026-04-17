---
layout: home
---

<div class="hero-section" align="center">
  <div class="avatar-container">
    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=MyBlog" alt="My Avatar" class="avatar-img">
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
  </div>
</div>

<div class="about-section glass-card">
  <p>
    👋 你好，我是一名电气自动化专业的学生/工程师，热衷于嵌入式系统开发和工业控制技术。
    这里记录我的学习历程、项目实战踩坑经验，以及从示波器到烙铁的各种硬件折腾笔记。
    欢迎一起交流 STM32、ESP32、PLC 和电路设计！
  </p>
</div>

<div class="skills-cloud">
  <span class="skill-tag">STM32</span>
  <span class="skill-tag">ESP32</span>
  <span class="skill-tag">Arduino</span>
  <span class="skill-tag">FreeRTOS</span>
  <span class="skill-tag">C / C++</span>
  <span class="skill-tag">PLC</span>
  <span class="skill-tag">Modbus</span>
  <span class="skill-tag">Altium Designer</span>
  <span class="skill-tag">Keil</span>
  <span class="skill-tag">CAN 总线</span>
  <span class="skill-tag">PCB Layout</span>
  <span class="skill-tag">Python</span>
</div>

---

<h2 class="section-title">🔥 核心技术领域</h2>

<div class="features-grid">
  <div class="feature-card glass-card">
    <div class="feature-icon">🔌</div>
    <h3>电气自动化</h3>
    <p>PLC 编程、工控通讯、变频器调试、电气图纸设计等工业自动化技术笔记。</p>
  </div>
  
  <div class="feature-card glass-card">
    <div class="feature-icon">🖥️</div>
    <h3>嵌入式开发</h3>
    <p>STM32 / ESP32 / Arduino 等单片机开发，RTOS、驱动开发、C/C++ 代码实战。</p>
  </div>
  
  <div class="feature-card glass-card">
    <div class="feature-icon">⚡</div>
    <h3>硬件设计</h3>
    <p>电路原理图、PCB Layout、元器件选型、示波器与烙铁陪伴的硬件折腾记录。</p>
  </div>
</div>

---

<h2 class="section-title">📝 最新文章</h2>

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
      <p class="post-excerpt">{{ post.excerpt | strip_html | truncate: 90 }}</p>
    {% endif %}
  </a>
{% endfor %}
</div>

---

<div align="center" class="footer-cta glass-card">
  <p>📬 欢迎交流讨论，一起探索电气与嵌入式的无限可能！</p>
  <div class="social-links">
    <a href="https://github.com/Wj123-ui" class="social-btn" target="_blank">GitHub</a>
    <a href="mailto:your-email@example.com" class="social-btn">Email</a>
  </div>
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
  const particleCount = 35;
  const colors = ['rgba(0, 212, 255, 0.35)', 'rgba(255, 159, 67, 0.25)', 'rgba(124, 58, 237, 0.2)'];
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: Math.random() * 2.5 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)]
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
      ctx.fillStyle = p.color;
      ctx.fill();
      
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[j].x - p.x;
        const dy = particles[j].y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(0, 212, 255, ' + (0.08 * (1 - dist / 120)) + ')';
          ctx.stroke();
        }
      }
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
})();
</script>
