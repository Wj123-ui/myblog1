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

---

<div class="features-grid">
  <div class="feature-card">
    <div class="feature-icon">🔌</div>
    <h3>电气自动化</h3>
    <p>PLC 编程、工控通讯、变频器调试、电气图纸设计等工业自动化技术笔记。</p>
  </div>
  
  <div class="feature-card">
    <div class="feature-icon">🖥️</div>
    <h3>嵌入式开发</h3>
    <p>STM32 / ESP32 / Arduino 等单片机开发，RTOS、驱动开发、C/C++ 代码实战。</p>
  </div>
  
  <div class="feature-card">
    <div class="feature-icon">⚡</div>
    <h3>硬件设计</h3>
    <p>电路原理图、PCB Layout、元器件选型、示波器与烙铁陪伴的硬件折腾记录。</p>
  </div>
</div>

## 最新文章

<div class="posts-list">
{% for post in site.posts limit:5 %}
  <a href="{{ post.url | relative_url }}" class="post-item">
    <span class="post-date">{{ post.date | date: "%Y-%m-%d" }}</span>
    <span class="post-title">{{ post.title }}</span>
    <span class="post-arrow">→</span>
  </a>
{% endfor %}
</div>

---

<div align="center" class="footer-cta">
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
  const particleCount = 25;
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1
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
      ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
      ctx.fill();
      
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[j].x - p.x;
        const dy = particles[j].y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(100, 200, 255, ' + (0.1 * (1 - dist / 100)) + ')';
          ctx.stroke();
        }
      }
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
})();
</script>
