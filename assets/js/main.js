/**
 * 动态星空粒子效果 - 完全重写版
 * 特性：
 * - 500+ 星星，多层次深度
 * - 流星效果
 * - 鼠标交互（吸引/排斥）
 * - 星座连线
 * - 星云动态背景
 * - 性能优化
 */
(function() {
  'use strict';
  
  var canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var animationId;
  var time = 0;
  var mouseX = -1000;
  var mouseY = -1000;
  var mouseActive = false;
  
  // 配置参数
  var config = {
    starCount: 500,
    maxStarSize: 3,
    twinkleSpeed: 0.003,
    mouseRadius: 200,
    mouseForce: 0.5,
    connectionDistance: 100,
    connectionOpacity: 0.15,
    shootingStarChance: 0.005,
    maxShootingStars: 3
  };
  
  // 星星数组
  var stars = [];
  var shootingStars = [];
  var nebulae = [];
  
  // 性能优化：减少动画偏好
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    canvas.style.display = 'none';
    return;
  }
  
  // 工具函数
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  function dist(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  
  // 调整画布大小
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  // 星星类
  function Star(x, y, layer) {
    this.x = x || rand(0, canvas.width);
    this.y = y || rand(0, canvas.height);
    this.layer = layer || 0; // 0: 远景, 1: 中景, 2: 近景
    this.reset();
  }
  
  Star.prototype.reset = function() {
    var layerConfig = [
      { size: rand(0.3, 1.2), alpha: rand(0.2, 0.6), speed: 0.3 },  // 远景
      { size: rand(0.8, 2.0), alpha: rand(0.4, 0.8), speed: 0.6 },  // 中景
      { size: rand(1.5, 3.0), alpha: rand(0.6, 1.0), speed: 1.0 }   // 近景
    ];
    
    var cfg = layerConfig[this.layer];
    this.size = cfg.size;
    this.baseAlpha = cfg.alpha;
    this.alpha = this.baseAlpha;
    this.speed = cfg.speed;
    this.twinklePhase = rand(0, Math.PI * 2);
    this.twinkleAmp = rand(0.1, 0.4);
    this.hue = rand(35, 55);
    this.saturation = rand(30, 80);
    this.lightness = rand(75, 100);
    this.driftX = rand(-0.1, 0.1);
    this.driftY = rand(-0.05, 0.05);
    this.pulse = rand(0.8, 1.2);
    this.pulseSpeed = rand(0.01, 0.03);
  };
  
  Star.prototype.update = function(mouseX, mouseY) {
    // 闪烁效果
    this.alpha = this.baseAlpha + Math.sin(time * config.twinkleSpeed * this.speed + this.twinklePhase) * this.twinkleAmp;
    this.alpha = Math.max(0.05, Math.min(1, this.alpha));
    
    // 脉冲效果
    this.pulse = 1 + Math.sin(time * this.pulseSpeed) * 0.15;
    
    // 漂移
    this.x += this.driftX * this.speed;
    this.y += this.driftY * this.speed;
    
    // 鼠标交互
    if (mouseActive) {
      var d = dist(this.x, this.y, mouseX, mouseY);
      if (d < config.mouseRadius) {
        var force = (1 - d / config.mouseRadius) * config.mouseForce;
        var angle = Math.atan2(this.y - mouseY, this.x - mouseX);
        this.x += Math.cos(angle) * force * 2;
        this.y += Math.sin(angle) * force * 2;
      }
    }
    
    // 边界检查
    if (this.x < -10) this.x = canvas.width + 10;
    if (this.x > canvas.width + 10) this.x = -10;
    if (this.y < -10) this.y = canvas.height + 10;
    if (this.y > canvas.height + 10) this.y = -10;
  };
  
  Star.prototype.draw = function() {
    if (this.alpha < 0.02) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    
    // 大星星添加光晕
    if (this.size > 1.8) {
      var glowSize = this.size * 6 * this.pulse;
      var glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
      glow.addColorStop(0, 'hsla(' + this.hue + ', ' + this.saturation + '%, ' + this.lightness + '%, 0.8)');
      glow.addColorStop(0.2, 'hsla(' + this.hue + ', ' + this.saturation + '%, ' + this.lightness + '%, 0.4)');
      glow.addColorStop(0.5, 'hsla(' + this.hue + ', ' + this.saturation + '%, ' + this.lightness + '%, 0.1)');
      glow.addColorStop(1, 'hsla(' + this.hue + ', ' + this.saturation + '%, ' + this.lightness + '%, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
      
      // 十字星光效果
      if (this.alpha > 0.6 && Math.sin(time * 0.005 + this.twinklePhase) > 0.5) {
        this.drawCrossGlow();
      }
    }
    
    // 核心亮点
    var coreSize = this.size * this.pulse;
    var coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, coreSize);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, ' + this.alpha + ')');
    coreGradient.addColorStop(0.5, 'hsla(' + this.hue + ', ' + this.saturation + '%, ' + this.lightness + '%, ' + (this.alpha * 0.8) + ')');
    coreGradient.addColorStop(1, 'hsla(' + this.hue + ', ' + this.saturation + '%, ' + this.lightness + '%, 0)');
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, coreSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };
  
  Star.prototype.drawCrossGlow = function() {
    var len = this.size * 8;
    var opacity = this.alpha * 0.3;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, ' + opacity + ')';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(this.x - len, this.y);
    ctx.lineTo(this.x + len, this.y);
    ctx.moveTo(this.x, this.y - len);
    ctx.lineTo(this.x, this.y + len);
    ctx.stroke();
  };
  
  // 流星类
  function ShootingStar() {
    this.reset();
  }
  
  ShootingStar.prototype.reset = function() {
    this.x = rand(-100, canvas.width * 0.6);
    this.y = rand(-50, canvas.height * 0.4);
    this.length = rand(80, 200);
    this.speed = rand(8, 16);
    this.angle = rand(Math.PI * 0.15, Math.PI * 0.4);
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.alpha = 1;
    this.decay = rand(0.008, 0.02);
    this.trail = [];
    this.maxTrail = 40;
    this.warmth = rand(0, 1);
    this.thickness = rand(1.5, 3);
  };
  
  ShootingStar.prototype.update = function() {
    this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
    if (this.trail.length > this.maxTrail) this.trail.shift();
    
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
    
    for (var i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha -= this.decay * 1.2;
    }
    this.trail = this.trail.filter(function(p) { return p.alpha > 0; });
  };
  
  ShootingStar.prototype.draw = function() {
    if (this.trail.length < 2) return;
    
    ctx.save();
    
    // 绘制流星尾迹
    for (var i = 1; i < this.trail.length; i++) {
      var p = this.trail[i];
      var prev = this.trail[i - 1];
      var ratio = i / this.trail.length;
      
      var r = Math.floor(230 + this.warmth * 25);
      var g = Math.floor(180 + this.warmth * 75);
      var b = Math.floor(80 + this.warmth * 60);
      
      ctx.strokeStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + (p.alpha * ratio * 0.8) + ')';
      ctx.lineWidth = ratio * this.thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    
    // 绘制流星头部光晕
    var head = this.trail[this.trail.length - 1];
    if (head) {
      var headGlow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 12);
      headGlow.addColorStop(0, 'rgba(255, 255, 255, ' + (this.alpha * 0.9) + ')');
      headGlow.addColorStop(0.3, 'rgba(255, 230, 180, ' + (this.alpha * 0.6) + ')');
      headGlow.addColorStop(0.6, 'rgba(255, 200, 120, ' + (this.alpha * 0.3) + ')');
      headGlow.addColorStop(1, 'rgba(200, 160, 80, 0)');
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };
  
  ShootingStar.prototype.isDead = function() {
    return this.alpha <= 0 || this.x > canvas.width + 100 || this.y > canvas.height + 100;
  };
  
  // 星云类
  function Nebula() {
    this.x = rand(0, canvas.width);
    this.y = rand(0, canvas.height);
    this.radius = rand(200, 400);
    this.hue = rand(30, 50);
    this.alpha = rand(0.01, 0.03);
    this.driftSpeed = rand(0.0002, 0.0005);
    this.phase = rand(0, Math.PI * 2);
  }
  
  Nebula.prototype.draw = function() {
    var nx = this.x + Math.sin(time * this.driftSpeed + this.phase) * 50;
    var ny = this.y + Math.cos(time * this.driftSpeed * 0.7 + this.phase) * 40;
    
    var gradient = ctx.createRadialGradient(nx, ny, 0, nx, ny, this.radius);
    gradient.addColorStop(0, 'hsla(' + this.hue + ', 60%, 30%, ' + this.alpha + ')');
    gradient.addColorStop(0.5, 'hsla(' + this.hue + ', 50%, 20%, ' + (this.alpha * 0.5) + ')');
    gradient.addColorStop(1, 'hsla(' + this.hue + ', 40%, 10%, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  
  // 初始化
  function init() {
    resize();
    
    // 创建星星 - 三层深度
    stars = [];
    for (var i = 0; i < config.starCount; i++) {
      var layer = i < config.starCount * 0.5 ? 0 : (i < config.starCount * 0.8 ? 1 : 2);
      stars.push(new Star(null, null, layer));
    }
    
    // 创建星云
    nebulae = [];
    for (var j = 0; j < 3; j++) {
      nebulae.push(new Nebula());
    }
  }
  
  // 绘制星座连线
  function drawConnections() {
    ctx.save();
    ctx.strokeStyle = 'rgba(201, 168, 76, ' + config.connectionOpacity + ')';
    ctx.lineWidth = 0.5;
    
    for (var i = 0; i < stars.length; i++) {
      var s1 = stars[i];
      if (s1.layer < 2) continue; // 只连接近景星星
      
      for (var j = i + 1; j < stars.length; j++) {
        var s2 = stars[j];
        if (s2.layer < 2) continue;
        
        var d = dist(s1.x, s1.y, s2.x, s2.y);
        if (d < config.connectionDistance) {
          var opacity = (1 - d / config.connectionDistance) * 0.3 * Math.min(s1.alpha, s2.alpha);
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  
  // 绘制鼠标光效
  function drawMouseEffect() {
    if (!mouseActive) return;
    
    ctx.save();
    var gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, config.mouseRadius);
    gradient.addColorStop(0, 'rgba(201, 168, 76, 0.05)');
    gradient.addColorStop(0.5, 'rgba(201, 168, 76, 0.02)');
    gradient.addColorStop(1, 'rgba(201, 168, 76, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  
  // 主动画循环
  function animate(timestamp) {
    time = timestamp || 0;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制星云背景
    for (var n = 0; n < nebulae.length; n++) {
      nebulae[n].draw();
    }
    
    // 绘制星星
    for (var i = 0; i < stars.length; i++) {
      stars[i].update(mouseX, mouseY);
      stars[i].draw();
    }
    
    // 绘制星座连线
    drawConnections();
    
    // 绘制鼠标效果
    drawMouseEffect();
    
    // 更新和绘制流星
    if (Math.random() < config.shootingStarChance && shootingStars.length < config.maxShootingStars) {
      shootingStars.push(new ShootingStar());
    }
    
    for (var j = shootingStars.length - 1; j >= 0; j--) {
      shootingStars[j].update();
      shootingStars[j].draw();
      if (shootingStars[j].isDead()) {
        shootingStars.splice(j, 1);
      }
    }
    
    animationId = requestAnimationFrame(animate);
  }
  
  // 事件监听
  window.addEventListener('resize', function() {
    resize();
  });
  
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseActive = true;
  });
  
  document.addEventListener('mouseleave', function() {
    mouseActive = false;
  });
  
  window.addEventListener('beforeunload', function() {
    if (animationId) cancelAnimationFrame(animationId);
  });
  
  // 启动
  init();
  animate();
  
})();
