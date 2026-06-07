// 星空粒子背景
(function() {
  var canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    canvas.style.display = 'none';
    return;
  }

  var particles = [];
  var stars = [];
  var nebulae = [];
  var mouseX = 0, mouseY = 0;
  var animationId;

  // 检测是否为移动设备
  var isMobile = window.innerWidth < 768;

  // 粒子数量根据屏幕大小调整
  var particleCount = isMobile ? 40 : 80;
  var starCount = isMobile ? 60 : 120;
  var nebulaCount = isMobile ? 2 : 4;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    isMobile = window.innerWidth < 768;
    particleCount = isMobile ? 40 : 80;
    starCount = isMobile ? 60 : 120;
    nebulaCount = isMobile ? 2 : 4;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // 鼠标位置跟踪（仅桌面端）
  if (!isMobile) {
    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
  }

  // 粒子类
  function Particle() {
    this.reset();
  }

  Particle.prototype.reset = function() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.5 + 0.2;
    this.color = this.getRandomColor();
    this.life = Math.random() * 200 + 100;
    this.maxLife = this.life;
  };

  Particle.prototype.getRandomColor = function() {
    var colors = [
      'rgba(201, 168, 76,',  // 金色
      'rgba(224, 192, 104,', // 浅金色
      'rgba(139, 105, 20,',  // 深金色
      'rgba(255, 255, 255,', // 白色
      'rgba(180, 160, 120,', // 暖金色
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  Particle.prototype.update = function() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;

    // 鼠标交互（仅桌面端）
    if (!isMobile) {
      var dx = mouseX - this.x;
      var dy = mouseY - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        var force = (150 - dist) / 150;
        this.speedX -= (dx / dist) * force * 0.02;
        this.speedY -= (dy / dist) * force * 0.02;
      }
    }

    // 边界检测
    if (this.x < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = 0;
    if (this.y < 0) this.y = canvas.height;
    if (this.y > canvas.height) this.y = 0;

    // 速度衰减
    this.speedX *= 0.99;
    this.speedY *= 0.99;

    // 生命值衰减时降低透明度
    this.opacity = (this.life / this.maxLife) * 0.5 + 0.1;

    if (this.life <= 0) {
      this.reset();
    }
  };

  Particle.prototype.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color + this.opacity + ')';
    ctx.fill();

    // 光晕效果
    if (this.size > 1.2) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color + (this.opacity * 0.2) + ')';
      ctx.fill();
    }
  };

  // 星星类
  function Star() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.5 + 0.3;
    this.twinkleSpeed = Math.random() * 0.02 + 0.01;
    this.twinkleOffset = Math.random() * Math.PI * 2;
    this.opacity = Math.random() * 0.8 + 0.2;
  }

  Star.prototype.update = function(time) {
    this.opacity = 0.4 + Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.4;
  };

  Star.prototype.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, ' + this.opacity + ')';
    ctx.fill();
  };

  // 星云类
  function Nebula() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.radius = Math.random() * 200 + 100;
    this.color = this.getRandomColor();
    this.opacity = Math.random() * 0.15 + 0.05;
    this.speedX = (Math.random() - 0.5) * 0.1;
    this.speedY = (Math.random() - 0.5) * 0.1;
  }

  Nebula.prototype.getRandomColor = function() {
    var colors = [
      { r: 201, g: 168, b: 76 },   // 金色
      { r: 139, g: 105, b: 20 },   // 深金色
      { r: 100, g: 60, b: 20 },    // 暗金色
      { r: 60, g: 40, b: 80 },     // 紫色调
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  Nebula.prototype.update = function() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < -this.radius) this.x = canvas.width + this.radius;
    if (this.x > canvas.width + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = canvas.height + this.radius;
    if (this.y > canvas.height + this.radius) this.y = -this.radius;
  };

  Nebula.prototype.draw = function() {
    var gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    gradient.addColorStop(0, 'rgba(' + this.color.r + ', ' + this.color.g + ', ' + this.color.b + ', ' + this.opacity + ')');
    gradient.addColorStop(0.5, 'rgba(' + this.color.r + ', ' + this.color.g + ', ' + this.color.b + ', ' + (this.opacity * 0.3) + ')');
    gradient.addColorStop(1, 'rgba(' + this.color.r + ', ' + this.color.g + ', ' + this.color.b + ', 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
  };

  // 连线函数
  function drawConnections() {
    var maxDist = isMobile ? 100 : 150;
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          var opacity = (1 - dist / maxDist) * 0.15;
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(201, 168, 76, ' + opacity + ')';
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  // 初始化
  function init() {
    particles = [];
    stars = [];
    nebulae = [];

    for (var i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
    for (var i = 0; i < starCount; i++) {
      stars.push(new Star());
    }
    for (var i = 0; i < nebulaCount; i++) {
      nebulae.push(new Nebula());
    }
  }

  // 动画循环
  var time = 0;
  function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    time++;

    // 绘制星云
    for (var i = 0; i < nebulae.length; i++) {
      nebulae[i].update();
      nebulae[i].draw();
    }

    // 绘制星星
    for (var i = 0; i < stars.length; i++) {
      stars[i].update(time);
      stars[i].draw();
    }

    // 更新和绘制粒子
    for (var i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    // 绘制连线
    if (!isMobile) {
      drawConnections();
    }

    animationId = requestAnimationFrame(animate);
  }

  // 页面可见性控制
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  });

  init();
  animate();

  // 窗口大小变化时重新初始化
  var resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      resizeCanvas();
      init();
    }, 250);
  });
})();

// ===== UI 交互逻辑 =====
(function() {
  var backToTop = document.getElementById('back-to-top');
  var progressBar = document.getElementById('reading-progress');
  var cursorGlow = document.getElementById('cursor-glow');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!backToTop || !progressBar || !cursorGlow) return;

  // 滚动进度条 + 返回顶部按钮
  var ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        var scrollY = window.pageYOffset;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;

        if (scrollY > 300) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }

        if (docHeight > 0) {
          progressBar.style.width = (scrollY / docHeight) * 100 + '%';
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  backToTop.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });

  // 鼠标跟随光效
  if (!prefersReduced) {
    var mouseX = 0, mouseY = 0;
    var glowX = 0, glowY = 0;

    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    function animateGlow() {
      glowX += (mouseX - glowX) * 0.1;
      glowY += (mouseY - glowY) * 0.1;
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  } else {
    cursorGlow.style.display = 'none';
  }

  // 滚动渐入动画
  var observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.feature-card, .post-item').forEach(function(el) {
    observer.observe(el);
  });

  // 锚点平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        var headerHeight = document.querySelector('.site-header')?.offsetHeight || 80;
        var targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: prefersReduced ? 'auto' : 'smooth'
        });
      }
    });
  });
})();
