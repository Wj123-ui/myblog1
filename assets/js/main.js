(function() {
  var canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var stars = [];
  var shootingStars = [];
  var STAR_COUNT = 300;
  var EDGE_DENSITY = 1.8;
  var mouseX = 0;
  var mouseY = 0;
  var time = 0;
  var animationId;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = document.documentElement.scrollHeight;
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function Star() {
    this.reset();
  }

  Star.prototype.reset = function() {
    var edgeBias = Math.random();
    if (edgeBias < 0.35) {
      var side = Math.random();
      if (side < 0.25) {
        this.x = rand(-canvas.width * 0.05, canvas.width * 0.08);
      } else if (side < 0.5) {
        this.x = rand(canvas.width * 0.92, canvas.width * 1.05);
      } else if (side < 0.75) {
        this.y = rand(-canvas.height * 0.05, canvas.height * 0.08);
      } else {
        this.y = rand(canvas.height * 0.92, canvas.height * 1.05);
      }
      if (side < 0.5) {
        this.y = rand(0, canvas.height);
      } else {
        this.x = rand(0, canvas.width);
      }
    } else {
      this.x = rand(0, canvas.width);
      this.y = rand(0, canvas.height);
    }

    this.size = Math.random() * 2.5 + 0.3;
    this.baseAlpha = rand(0.3, 1);
    this.alpha = this.baseAlpha;
    this.twinkleSpeed = rand(0.002, 0.02);
    this.twinklePhase = rand(0, Math.PI * 2);
    this.twinkleAmp = rand(0.2, 0.6);
    this.hue = rand(35, 55);
    this.saturation = rand(30, 80);
    this.lightness = rand(70, 98);
    this.driftX = 0;
    this.driftY = 0;
    this.driftTarget = rand(0.05, 0.3);
  };

  Star.prototype.update = function() {
    this.alpha = this.baseAlpha + Math.sin(time * this.twinkleSpeed + this.twinklePhase) * this.twinkleAmp;
    this.alpha = Math.max(0.1, Math.min(1, this.alpha));

    this.driftX += (this.driftTarget - this.driftX) * 0.001;
    this.x += this.driftX * 0.15;

    if (this.x > canvas.width + 10 || this.x < -10 ||
        this.y > canvas.height + 10 || this.y < -10) {
      this.reset();
      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;
    }
  };

  Star.prototype.draw = function() {
    var a = this.alpha;
    if (a < 0.05) return;

    ctx.save();
    ctx.globalAlpha = a;

    if (this.size > 1.8) {
      var glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
      glow.addColorStop(0, 'hsla(' + this.hue + ', ' + this.saturation + '%, ' + this.lightness + '%, 0.9)');
      glow.addColorStop(0.3, 'hsla(' + this.hue + ', ' + this.saturation + '%, ' + this.lightness + '%, 0.4)');
      glow.addColorStop(1, 'hsla(' + this.hue + ', ' + this.saturation + '%, ' + this.lightness + '%, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
      ctx.fill();

      if (a > 0.5 && Math.sin(time * 0.005 + this.twinklePhase) > 0.7) {
        var crossGlow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 1.5);
        crossGlow.addColorStop(0, 'rgba(255, 255, 255, ' + a + ')');
        crossGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = crossGlow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = 'hsla(' + this.hue + ', ' + this.saturation + '%, ' + this.lightness + '%, ' + a + ')';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  function ShootingStar() {
    this.reset();
  }

  ShootingStar.prototype.reset = function() {
    this.x = rand(-100, canvas.width * 0.5);
    this.y = rand(0, canvas.height * 0.5);
    this.length = rand(60, 160);
    this.speed = rand(4, 10);
    this.angle = rand(Math.PI * 0.3, Math.PI * 0.6);
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.alpha = 1;
    this.decay = rand(0.01, 0.03);
    this.trailPoints = [];
    this.warmth = rand(0, 1);
  };

  ShootingStar.prototype.update = function() {
    this.trailPoints.push({ x: this.x, y: this.y, alpha: this.alpha });
    if (this.trailPoints.length > 30) this.trailPoints.shift();

    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;

    for (var i = 0; i < this.trailPoints.length; i++) {
      this.trailPoints[i].alpha -= this.decay * 1.5;
    }
    this.trailPoints = this.trailPoints.filter(function(p) { return p.alpha > 0; });
  };

  ShootingStar.prototype.draw = function() {
    if (this.trailPoints.length < 2) return;

    ctx.save();
    for (var i = 1; i < this.trailPoints.length; i++) {
      var p = this.trailPoints[i];
      var prev = this.trailPoints[i - 1];
      var ratio = i / this.trailPoints.length;
      ctx.strokeStyle = 'rgba(' +
        Math.floor(230 + this.warmth * 25) + ', ' +
        Math.floor(180 + this.warmth * 75) + ', ' +
        Math.floor(80 + this.warmth * 60) + ', ' +
        (p.alpha * ratio) + ')';
      ctx.lineWidth = ratio * 2.5;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    var head = this.trailPoints[this.trailPoints.length - 1];
    if (head) {
      var headGlow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 8);
      headGlow.addColorStop(0, 'rgba(255, 255, 255, ' + (this.alpha * 0.9) + ')');
      headGlow.addColorStop(0.4, 'rgba(255, 220, 150, ' + (this.alpha * 0.5) + ')');
      headGlow.addColorStop(1, 'rgba(200, 160, 80, 0)');
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  ShootingStar.prototype.isDead = function() {
    return this.alpha <= 0;
  };

  function initStars() {
    stars = [];
    for (var i = 0; i < STAR_COUNT; i++) {
      stars.push(new Star());
    }
  }

  function spawnShootingStar() {
    if (Math.random() < 0.003 && shootingStars.length < 2 && !prefersReduced) {
      shootingStars.push(new ShootingStar());
    }
  }

  function drawNebula() {
    ctx.save();
    var nx = canvas.width * 0.25 + Math.sin(time * 0.0003) * 100;
    var ny = canvas.height * 0.3 + Math.cos(time * 0.0004) * 80;
    var nebula1 = ctx.createRadialGradient(nx, ny, 0, nx, ny, canvas.width * 0.5);
    nebula1.addColorStop(0, 'rgba(120, 80, 20, 0.03)');
    nebula1.addColorStop(0.5, 'rgba(60, 35, 10, 0.015)');
    nebula1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebula1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var nx2 = canvas.width * 0.75 + Math.cos(time * 0.00035) * 120;
    var ny2 = canvas.height * 0.65 + Math.sin(time * 0.00045) * 90;
    var nebula2 = ctx.createRadialGradient(nx2, ny2, 0, nx2, ny2, canvas.width * 0.4);
    nebula2.addColorStop(0, 'rgba(140, 90, 25, 0.025)');
    nebula2.addColorStop(0.5, 'rgba(60, 30, 10, 0.012)');
    nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebula2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function drawDarkCorners() {
    ctx.save();
    var corners = [
      { x: 0, y: 0, w: canvas.width * 0.3, h: canvas.height * 0.3 },
      { x: canvas.width * 0.7, y: 0, w: canvas.width * 0.3, h: canvas.height * 0.3 },
      { x: 0, y: canvas.height * 0.7, w: canvas.width * 0.3, h: canvas.height * 0.3 },
      { x: canvas.width * 0.7, y: canvas.height * 0.7, w: canvas.width * 0.3, h: canvas.height * 0.3 }
    ];

    for (var i = 0; i < corners.length; i++) {
      var c = corners[i];
      var cx = c.x + c.w / 2;
      var cy = c.y + c.h / 2;
      var r = Math.max(c.w, c.h) * 0.6;
      var grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  }

  function animate(timestamp) {
    if (timestamp) time = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawNebula();

    for (var i = 0; i < stars.length; i++) {
      stars[i].update();
      stars[i].draw();
    }

    spawnShootingStar();

    for (var j = shootingStars.length - 1; j >= 0; j--) {
      shootingStars[j].update();
      shootingStars[j].draw();
      if (shootingStars[j].isDead()) {
        shootingStars.splice(j, 1);
      }
    }

    drawDarkCorners();

    if (!prefersReduced) {
      animationId = requestAnimationFrame(animate);
    }
  }

  function handleScroll() {
    resize();
  }

  window.addEventListener('resize', resize);
  window.addEventListener('scroll', handleScroll);
  document.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  resize();
  initStars();
  animate();

  window.addEventListener('beforeunload', function() {
    if (animationId) cancelAnimationFrame(animationId);
  });
})();
