/**
 * 动态星云星空效果
 * 特性：
 * - 多层流动星云
 * - 极光效果
 * - 穿梭粒子
 * - 流星
 * - 深邃宇宙感
 */
(function() {
  'use strict';
  
  var canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  
  var W, H, time = 0, animId;
  var mouse = { x: -999, y: -999, active: false };
  
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { canvas.style.display = 'none'; return; }
  
  // 配置
  var CFG = {
    starCount: 400,
    nebulaLayers: 5,
    auroraEnabled: true,
    particleCount: 60,
    shootingChance: 0.003,
    maxShooting: 2
  };
  
  var stars = [], particles = [], shootStars = [], nebulae = [], aurorae = [];
  
  function rand(a, b) { return Math.random() * (b - a) + a; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  
  // ===== 星云 =====
  function Nebula() {
    this.x = rand(W * 0.1, W * 0.9);
    this.y = rand(H * 0.1, H * 0.9);
    this.rx = rand(200, 500);
    this.ry = rand(150, 400);
    this.rotation = rand(0, Math.PI * 2);
    this.rotSpeed = rand(-0.0002, 0.0002);
    this.driftX = rand(-0.15, 0.15);
    this.driftY = rand(-0.1, 0.1);
    this.phase = rand(0, 100);
    this.breathe = rand(0.001, 0.003);
    
    // 星云色彩 - 蓝紫、粉红、青绿、金色
    var palettes = [
      { h: 220, s: 60, l: 25 },  // 深蓝
      { h: 270, s: 50, l: 20 },  // 紫
      { h: 330, s: 55, l: 22 },  // 粉红
      { h: 170, s: 50, l: 18 },  // 青
      { h: 40, s: 65, l: 20 },   // 金
      { h: 200, s: 70, l: 15 },  // 深青
      { h: 290, s: 45, l: 18 },  // 暗紫
    ];
    var pal = palettes[Math.floor(rand(0, palettes.length))];
    this.hue = pal.h;
    this.sat = pal.s;
    this.lit = pal.l;
    this.alpha = rand(0.04, 0.12);
  }
  
  Nebula.prototype.update = function() {
    this.x += this.driftX;
    this.y += this.driftY;
    this.rotation += this.rotSpeed;
    
    if (this.x < -this.rx) this.x = W + this.rx;
    if (this.x > W + this.rx) this.x = -this.rx;
    if (this.y < -this.ry) this.y = H + this.ry;
    if (this.y > H + this.ry) this.y = -this.ry;
  };
  
  Nebula.prototype.draw = function() {
    var breathe = 1 + Math.sin(time * this.breathe + this.phase) * 0.2;
    var rx = this.rx * breathe;
    var ry = this.ry * breathe;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rx, ry));
    var a = this.alpha * (0.8 + Math.sin(time * 0.001 + this.phase) * 0.2);
    grad.addColorStop(0, 'hsla(' + this.hue + ',' + this.sat + '%,' + (this.lit + 10) + '%,' + a + ')');
    grad.addColorStop(0.3, 'hsla(' + (this.hue + 15) + ',' + (this.sat - 10) + '%,' + this.lit + '%,' + (a * 0.7) + ')');
    grad.addColorStop(0.6, 'hsla(' + (this.hue + 30) + ',' + (this.sat - 20) + '%,' + (this.lit - 5) + '%,' + (a * 0.3) + ')');
    grad.addColorStop(1, 'hsla(' + this.hue + ',' + this.sat + '%,' + this.lit + '%,0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  
  // ===== 极光 =====
  function Aurora() {
    this.y = rand(H * 0.05, H * 0.35);
    this.hue = rand(120, 300);
    this.speed = rand(0.3, 0.8);
    this.amplitude = rand(30, 80);
    this.freq = rand(0.002, 0.005);
    this.phase = rand(0, 100);
    this.alpha = rand(0.02, 0.06);
    this.width = rand(60, 150);
  }
  
  Aurora.prototype.draw = function() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    
    var hueShift = Math.sin(time * 0.0003) * 30;
    var h = this.hue + hueShift;
    
    ctx.beginPath();
    ctx.moveTo(0, this.y);
    
    for (var x = 0; x <= W; x += 4) {
      var y = this.y + Math.sin(x * this.freq + time * 0.001 + this.phase) * this.amplitude;
      y += Math.sin(x * this.freq * 2.3 + time * 0.0015) * this.amplitude * 0.4;
      ctx.lineTo(x, y);
    }
    
    for (var x2 = W; x2 >= 0; x2 -= 4) {
      var y2 = this.y + this.width + Math.sin(x2 * this.freq + time * 0.001 + this.phase + 1) * this.amplitude * 0.6;
      ctx.lineTo(x2, y2);
    }
    
    ctx.closePath();
    
    var grad = ctx.createLinearGradient(0, this.y - this.amplitude, 0, this.y + this.width + this.amplitude);
    grad.addColorStop(0, 'hsla(' + h + ',80%,60%,0.3)');
    grad.addColorStop(0.3, 'hsla(' + (h + 20) + ',70%,50%,0.5)');
    grad.addColorStop(0.5, 'hsla(' + (h + 40) + ',60%,45%,0.6)');
    grad.addColorStop(0.7, 'hsla(' + (h + 20) + ',70%,50%,0.4)');
    grad.addColorStop(1, 'hsla(' + h + ',80%,60%,0.1)');
    
    ctx.fillStyle = grad;
    ctx.filter = 'blur(15px)';
    ctx.fill();
    ctx.filter = 'none';
    
    ctx.restore();
  };
  
  // ===== 星星 =====
  function Star() {
    this.reset(true);
  }
  
  Star.prototype.reset = function(init) {
    this.x = init ? rand(0, W) : rand(-W * 0.1, W * 1.1);
    this.y = init ? rand(0, H) : rand(-H * 0.1, H * 1.1);
    this.size = rand(0.3, 2.8);
    this.baseA = rand(0.3, 1);
    this.twinkleSpd = rand(0.002, 0.01);
    this.twinklePh = rand(0, 6.28);
    this.hue = rand(35, 55);
    this.sat = rand(30, 90);
    this.lit = rand(75, 100);
    this.vx = rand(-0.02, 0.02);
    this.vy = rand(-0.01, 0.01);
  };
  
  Star.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    
    if (mouse.active) {
      var dx = this.x - mouse.x, dy = this.y - mouse.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < 180) {
        var f = (1 - d / 180) * 0.3;
        this.x += dx / d * f;
        this.y += dy / d * f;
      }
    }
    
    if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) {
      this.reset(false);
    }
  };
  
  Star.prototype.draw = function() {
    var a = this.baseA + Math.sin(time * this.twinkleSpd + this.twinklePh) * 0.3;
    a = clamp(a, 0.05, 1);
    
    ctx.save();
    ctx.globalAlpha = a;
    
    if (this.size > 1.8) {
      var gs = this.size * 5;
      var g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, gs);
      g.addColorStop(0, 'hsla(' + this.hue + ',' + this.sat + '%,' + this.lit + '%,0.7)');
      g.addColorStop(0.3, 'hsla(' + this.hue + ',' + this.sat + '%,' + this.lit + '%,0.2)');
      g.addColorStop(1, 'hsla(' + this.hue + ',' + this.sat + '%,' + this.lit + '%,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, gs, 0, 6.28);
      ctx.fill();
    }
    
    ctx.fillStyle = 'hsla(' + this.hue + ',' + this.sat + '%,' + this.lit + '%,' + a + ')';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 6.28);
    ctx.fill();
    ctx.restore();
  };
  
  // ===== 穿梭粒子 =====
  function Particle() {
    this.reset();
  }
  
  Particle.prototype.reset = function() {
    this.x = rand(0, W);
    this.y = rand(0, H);
    this.vx = rand(-0.8, 0.8);
    this.vy = rand(-0.5, 0.5);
    this.size = rand(1, 3);
    this.life = rand(200, 500);
    this.maxLife = this.life;
    this.hue = rand(180, 320);
    this.trail = [];
    this.maxTrail = Math.floor(rand(5, 15));
  };
  
  Particle.prototype.update = function() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) this.trail.shift();
    
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    
    if (this.life <= 0 || this.x < -50 || this.x > W + 50 || this.y < -50 || this.y > H + 50) {
      this.reset();
    }
  };
  
  Particle.prototype.draw = function() {
    var lifeRatio = this.life / this.maxLife;
    var a = lifeRatio * 0.6;
    
    ctx.save();
    
    for (var i = 0; i < this.trail.length; i++) {
      var t = this.trail[i];
      var ta = (i / this.trail.length) * a * 0.5;
      ctx.fillStyle = 'hsla(' + this.hue + ',70%,70%,' + ta + ')';
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.size * 0.5, 0, 6.28);
      ctx.fill();
    }
    
    ctx.fillStyle = 'hsla(' + this.hue + ',60%,80%,' + a + ')';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 6.28);
    ctx.fill();
    
    ctx.restore();
  };
  
  // ===== 流星 =====
  function ShootingStar() {
    this.reset();
  }
  
  ShootingStar.prototype.reset = function() {
    this.x = rand(-50, W * 0.5);
    this.y = rand(-30, H * 0.3);
    this.len = rand(100, 250);
    this.spd = rand(10, 20);
    this.ang = rand(0.3, 0.7);
    this.vx = Math.cos(this.ang) * this.spd;
    this.vy = Math.sin(this.ang) * this.spd;
    this.a = 1;
    this.decay = rand(0.006, 0.015);
    this.trail = [];
    this.maxTrail = 50;
    this.warmth = rand(0, 1);
  };
  
  ShootingStar.prototype.update = function() {
    this.trail.push({ x: this.x, y: this.y, a: this.a });
    if (this.trail.length > this.maxTrail) this.trail.shift();
    this.x += this.vx;
    this.y += this.vy;
    this.a -= this.decay;
    for (var i = 0; i < this.trail.length; i++) this.trail[i].a -= this.decay * 1.3;
    this.trail = this.trail.filter(function(p) { return p.a > 0; });
  };
  
  ShootingStar.prototype.draw = function() {
    if (this.trail.length < 2) return;
    ctx.save();
    
    for (var i = 1; i < this.trail.length; i++) {
      var p = this.trail[i], prev = this.trail[i - 1];
      var r = i / this.trail.length;
      var red = 230 + this.warmth * 25;
      var grn = 180 + this.warmth * 75;
      var blu = 80 + this.warmth * 60;
      ctx.strokeStyle = 'rgba(' + ~~red + ',' + ~~grn + ',' + ~~blu + ',' + (p.a * r * 0.8) + ')';
      ctx.lineWidth = r * 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    
    var hd = this.trail[this.trail.length - 1];
    if (hd) {
      var hg = ctx.createRadialGradient(hd.x, hd.y, 0, hd.x, hd.y, 15);
      hg.addColorStop(0, 'rgba(255,255,255,' + (this.a * 0.9) + ')');
      hg.addColorStop(0.3, 'rgba(255,230,180,' + (this.a * 0.5) + ')');
      hg.addColorStop(1, 'rgba(200,160,80,0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(hd.x, hd.y, 15, 0, 6.28);
      ctx.fill();
    }
    ctx.restore();
  };
  
  ShootingStar.prototype.dead = function() { return this.a <= 0; };
  
  // ===== 绘制深空背景 =====
  function drawDeepSpace() {
    var g1 = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, W * 0.6);
    g1.addColorStop(0, 'rgba(10,5,25,0.3)');
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    
    var g2 = ctx.createRadialGradient(W * 0.8, H * 0.7, 0, W * 0.8, H * 0.7, W * 0.5);
    g2.addColorStop(0, 'rgba(15,10,30,0.25)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
  }
  
  // ===== 鼠标光效 =====
  function drawMouseGlow() {
    if (!mouse.active) return;
    var g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200);
    g.addColorStop(0, 'rgba(120,80,200,0.04)');
    g.addColorStop(0.5, 'rgba(80,50,150,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  
  // ===== 初始化 =====
  function init() {
    resize();
    stars = []; particles = []; shootStars = []; nebulae = []; aurorae = [];
    
    for (var i = 0; i < CFG.starCount; i++) stars.push(new Star());
    for (var j = 0; j < CFG.particleCount; j++) particles.push(new Particle());
    for (var k = 0; k < CFG.nebulaLayers; k++) nebulae.push(new Nebula());
    if (CFG.auroraEnabled) {
      for (var l = 0; l < 3; l++) aurorae.push(new Aurora());
    }
  }
  
  // ===== 主循环 =====
  function loop(ts) {
    time = ts || 0;
    ctx.clearRect(0, 0, W, H);
    
    drawDeepSpace();
    
    for (var a = 0; a < aurorae.length; a++) aurorae[a].draw();
    
    for (var n = 0; n < nebulae.length; n++) {
      nebulae[n].update();
      nebulae[n].draw();
    }
    
    drawMouseGlow();
    
    for (var s = 0; s < stars.length; s++) {
      stars[s].update();
      stars[s].draw();
    }
    
    for (var p = 0; p < particles.length; p++) {
      particles[p].update();
      particles[p].draw();
    }
    
    if (Math.random() < CFG.shootingChance && shootStars.length < CFG.maxShooting) {
      shootStars.push(new ShootingStar());
    }
    for (var ss = shootStars.length - 1; ss >= 0; ss--) {
      shootStars[ss].update();
      shootStars[ss].draw();
      if (shootStars[ss].dead()) shootStars.splice(ss, 1);
    }
    
    animId = requestAnimationFrame(loop);
  }
  
  // ===== 事件 =====
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', function(e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
  document.addEventListener('mouseleave', function() { mouse.active = false; });
  window.addEventListener('beforeunload', function() { if (animId) cancelAnimationFrame(animId); });
  
  init();
  loop();
})();
