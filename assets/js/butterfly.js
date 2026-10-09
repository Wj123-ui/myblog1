// ===== 首页点阵蝴蝶（参考 MiMo 首页的 halftone 蝴蝶视觉）=====
// 离散圆点按密度铺出蝴蝶轮廓：中心密实、翅尖稀疏；鼠标靠近时点阵散开，
// 另有轻微扇翅与呼吸。纯 Canvas 绘制，不依赖图片或视频素材。
//
// 设计取舍：轮廓先同步画好一帧，动画只在其上叠位移，因此即使
// requestAnimationFrame 不被调度（后台标签页等），画面也始终完整。
(function () {
  'use strict';

  var canvas = document.querySelector('.hero-visual canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var rootStyle = getComputedStyle(document.documentElement);
  var INK = (rootStyle.getPropertyValue('--text') || '').trim() || '#202124';
  var ACCENT = (rootStyle.getPropertyValue('--accent') || '').trim() || '#fb8147';

  var TAU = Math.PI * 2;

  // 轮廓坐标盒：200 × 160，蝴蝶正好铺满
  var BOX_W = 200;
  var BOX_H = 160;

  var SPACING = 11;         // 点阵间距（CSS px）
  var MAX_RATIO = 0.5;      // 点半径上限 = SPACING * MAX_RATIO（0.5 时相邻点正好相切）
  var SUPERSAMPLE = 3;      // 轮廓光栅化的超采样倍数，消除密度分层造成的块状
  var MIN_DENSITY = 0.04;   // 低于此密度不生成点
  var EDGE_MARGIN = 4;      // 网格四周留出的点格数
  var PUSH_RADIUS = 100;    // 鼠标排斥半径
  var PUSH_STRENGTH = 24;   // 最大排斥位移

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dots = [];
  var w = 0, h = 0, dpr = 1;
  var pivotX = 0, pivotY = 0;
  var pointer = { x: -1e4, y: -1e4 };
  var elapsed = 0, lastTs = 0, raf = 0, running = false;

  // ---------- 蝴蝶轮廓（左翅 + 身体 + 触角，右翅镜像） ----------

  function leftWings() {
    var p = new Path2D();
    // 上翅：自身体上段斜向上外展开，翅尖收成尖角，再沿外缘收回身体中段
    p.moveTo(100, 50);
    p.bezierCurveTo(88, 26, 60, 3, 34, 7);
    p.bezierCurveTo(12, 11, -1, 33, 9, 56);
    p.bezierCurveTo(19, 76, 45, 89, 74, 87);
    p.bezierCurveTo(89, 86, 97, 79, 100, 68);
    p.closePath();
    // 下翅：更圆润的尾翼，与上翅之间留出明显缺口
    p.moveTo(100, 90);
    p.bezierCurveTo(93, 99, 74, 105, 55, 113);
    p.bezierCurveTo(32, 123, 20, 139, 29, 150);
    p.bezierCurveTo(39, 161, 62, 156, 74, 139);
    p.bezierCurveTo(85, 124, 96, 108, 100, 99);
    p.closePath();
    return p;
  }

  function centerParts() {
    var p = new Path2D();
    // 身体：上粗下细的纺锤形
    p.moveTo(100, 38);
    p.bezierCurveTo(105, 56, 107, 82, 104, 106);
    p.bezierCurveTo(103, 117, 102, 124, 100, 130);
    p.bezierCurveTo(98, 124, 97, 117, 96, 106);
    p.bezierCurveTo(93, 82, 95, 56, 100, 38);
    p.closePath();
    // 触角：两片细长叶形，自头部向外上方伸出
    p.moveTo(99, 40);
    p.bezierCurveTo(94, 27, 82, 13, 71, 6);
    p.bezierCurveTo(82, 12, 94, 24, 100, 37);
    p.closePath();
    p.moveTo(101, 40);
    p.bezierCurveTo(106, 27, 118, 13, 129, 6);
    p.bezierCurveTo(118, 12, 106, 24, 100, 37);
    p.closePath();
    return p;
  }

  var WINGS = leftWings();
  var CENTER = centerParts();

  function paintShape(g) {
    // 以身体为心的径向渐变：中心密实、翅尖稀疏，天然形成网点层次
    var grad = g.createRadialGradient(100, 84, 0, 100, 84, 92);
    grad.addColorStop(0.00, 'rgba(255,255,255,1)');
    grad.addColorStop(0.38, 'rgba(255,255,255,0.94)');
    grad.addColorStop(0.60, 'rgba(255,255,255,0.64)');
    grad.addColorStop(0.78, 'rgba(255,255,255,0.34)');
    grad.addColorStop(1.00, 'rgba(255,255,255,0.10)');
    g.fillStyle = grad;

    g.fill(WINGS);
    g.save();
    g.translate(BOX_W, 0);
    g.scale(-1, 1);
    g.fill(WINGS);
    g.restore();
    g.fill(CENTER);
  }

  // ---------- 采样成点阵 ----------

  function build() {
    var rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    var cols = Math.max(10, Math.floor(w / SPACING));
    var rows = Math.max(10, Math.floor(h / SPACING));

    // 用超采样画布光栅化轮廓，再把每个点格内的像素取平均作为密度。
    // 直接按格子读单像素会留下明显分层，翅膀上会看到一圈圈同心色阶。
    var ss = SUPERSAMPLE;
    var off = document.createElement('canvas');
    off.width = cols * ss;
    off.height = rows * ss;
    var g = off.getContext('2d');
    if (!g) return;

    var scale = Math.min((cols - EDGE_MARGIN * 2) / BOX_W,
                         (rows - EDGE_MARGIN * 2) / BOX_H);
    g.setTransform(scale * ss, 0, 0, scale * ss,
                   (cols - BOX_W * scale) * ss / 2,
                   (rows - BOX_H * scale) * ss / 2);
    paintShape(g);

    var data = g.getImageData(0, 0, off.width, off.height).data;
    var next = [];
    var sumX = 0, sumY = 0;

    // 整格平均：密实区得 1，轮廓边缘按覆盖率给出中间值
    function cellDensity(cx, cy) {
      var total = 0;
      for (var sy = 0; sy < ss; sy++) {
        for (var sx = 0; sx < ss; sx++) {
          var px = cx * ss + sx;
          var py = cy * ss + sy;
          total += data[(py * off.width + px) * 4 + 3];
        }
      }
      return total / (ss * ss * 255);
    }

    for (var cy = 0; cy < rows; cy++) {
      for (var cx = 0; cx < cols; cx++) {
        var density = cellDensity(cx, cy);
        if (density < MIN_DENSITY) continue;

        var n = next.length;
        var jitter = ((n * 2654435761) >>> 0) % 1000 / 1000;   // 确定性伪随机
        var tx = (cx + 0.5) * SPACING;
        var ty = (cy + 0.5) * SPACING;
        next.push({
          tx: tx, ty: ty,
          d: density,
          x: tx, y: ty,
          phase: jitter * TAU,
          // 约 1.4% 的点用主色点缀，避免整片都是灰黑
          accent: (((n * 40503) >>> 0) % 1000) < 14
        });
        sumX += tx;
        sumY += ty;
      }
    }

    dots = next;
    // 扇翅与呼吸都以图案中心为支点
    pivotX = dots.length ? sumX / dots.length : w / 2;
    pivotY = dots.length ? sumY / dots.length : h / 2;

    elapsed = 0;
    lastTs = 0;
    pointer.x = -1e4;
    pointer.y = -1e4;
  }

  // ---------- 绘制 ----------

  function radiusOf(d) {
    return SPACING * MAX_RATIO * Math.sqrt(d.d);
  }

  function paintOnce(t) {
    // 先把每个点按「基础位置 + 动画偏移」算出来
    var flap = reduceMotion ? 1 : 1 + 0.035 * Math.sin(t * 1.7);

    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var x = pivotX + (d.tx - pivotX) * flap;
      var y = d.ty;

      if (!reduceMotion) {
        // 静止时的细微波纹，让整片点阵有呼吸感
        x += Math.sin(t * 0.9 + d.phase) * 1.6;
        y += Math.cos(t * 0.8 + d.phase) * 1.6;

        var dx = x - pointer.x;
        var dy = y - pointer.y;
        var dist2 = dx * dx + dy * dy;
        if (dist2 < PUSH_RADIUS * PUSH_RADIUS) {
          var dist = Math.sqrt(dist2) || 0.001;
          var falloff = 1 - dist / PUSH_RADIUS;
          var push = falloff * falloff * PUSH_STRENGTH;
          x += dx / dist * push;
          y += dy / dist * push;
        }
      }

      d.x = x;
      d.y = y;
      d.r = radiusOf(d) * (reduceMotion ? 1 : 1 + 0.06 * Math.sin(t * 1.3 + d.phase));
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 高密度区：实心墨点
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    for (var a = 0; a < dots.length; a++) {
      var p1 = dots[a];
      if (p1.d >= 0.5 && p1.r > 0.4 && !p1.accent) {
        ctx.moveTo(p1.x + p1.r, p1.y);
        ctx.arc(p1.x, p1.y, p1.r, 0, TAU);
      }
    }
    ctx.fill();

    // 低密度区：翅尖过渡，颜色收淡
    ctx.globalAlpha = 0.46;
    ctx.beginPath();
    for (var b = 0; b < dots.length; b++) {
      var p2 = dots[b];
      if (p2.d < 0.5 && p2.r > 0.4 && !p2.accent) {
        ctx.moveTo(p2.x + p2.r, p2.y);
        ctx.arc(p2.x, p2.y, p2.r, 0, TAU);
      }
    }
    ctx.fill();

    // 主色点缀：数量很少，只做提亮
    ctx.fillStyle = ACCENT;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    for (var c = 0; c < dots.length; c++) {
      var p3 = dots[c];
      if (p3.accent && p3.r > 0.4) {
        ctx.moveTo(p3.x + p3.r * 1.1, p3.y);
        ctx.arc(p3.x, p3.y, p3.r * 1.1, 0, TAU);
      }
    }
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  // ---------- 主循环 ----------

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    elapsed += dt;
    paintOnce(elapsed);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    lastTs = 0;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // ---------- 事件 ----------

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      build();
      paintOnce(elapsed);
    }, 180);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });

  if (!reduceMotion) {
    canvas.addEventListener('pointermove', function (e) {
      var rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    });
    canvas.addEventListener('pointerleave', function () {
      pointer.x = -1e4;
      pointer.y = -1e4;
    });
  }

  build();
  paintOnce(0);              // 先同步画好静帧，动画只是在其上叠偏移
  start();                   // 减少动效偏好下 start() 内部直接返回，画面保持静帧
})();