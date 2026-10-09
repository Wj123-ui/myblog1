// ===== 首页黑洞（吸积盘 + 事件视界 + 光子环）=====
// 中心是纯黑的视界圆盘，四周一圈倾斜的吸积盘。盘面粒子沿各自轨道运动，
// 形状画成「轨道上的一小段弧线」而不是圆点 —— 这样大量粒子会连成流线，
// 才像被引力拖曳的气体；用圆点画会散成一团噪点。
//
// 几个刻意的物理近似：
//   * 倾斜投影：屏幕 y 方向按 TILT 压扁，轨道由圆变成椭圆；
//   * 开普勒速度：角速度 ∝ r^-1.5，内侧转得明显更快；
//   * 内落与再生：半径缓慢减小，越过内缘被吞掉，再从外缘重新进入；
//   * 多普勒增亮：朝向观察者运动的一侧更亮，另一侧压暗；
//   * 遮挡关系：盘的后半圈先画、视界圆盘后画、前半圈最后画，
//     于是穿过黑洞背后的那半圈被自然挡住；
//   * 光子环：视界外一条细亮环，示意光线绕行。
//
// 首帧同步绘制，动画只叠位移，因此即使 rAF 不被调度，画面也完整。
(function () {
  'use strict';

  var canvas = document.querySelector('.hero-visual canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var rootStyle = getComputedStyle(document.documentElement);
  var INK = (rootStyle.getPropertyValue('--ink') || '').trim() || '#000000';
  var CORE = (rootStyle.getPropertyValue('--text') || '').trim() || '#202124';
  var ACCENT = (rootStyle.getPropertyValue('--accent') || '').trim() || '#fb8147';

  var TAU = Math.PI * 2;

  var COUNT = 2600;         // 流线段数
  var TILT = 0.50;          // 盘面倾斜：屏幕 y 方向的压缩比
  var R_MIN = 0.20;         // 盘内缘（归一化半径），同时决定视界大小
  var R_MAX = 1.0;          // 盘外缘
  var SPEED = 1.05;         // 角速度基准（rad/s），实际按 r^-1.5 放大
  var OMEGA_MAX = 4.2;      // 内缘角速度上限，避免最内圈糊成一片
  var DRIFT = 0.020;        // 内落速度（归一化半径/秒）
  var DISK_H = 0.018;       // 盘厚（归一化）：太厚会散成一团雾
  var HOT_BAND = 0.13;      // 内侧多少比例算「高温区」用主色：很大一段会糊成色块
  var WIDTH = 2.0;          // 流线宽度（CSS px）
  var ALPHA_LEVELS = 6;     // 透明度分档：合并成少量路径描边，省掉逐条换样式

  // 本文件早先会读系统的「减弱动态效果 / 移除动画」并据此保持静帧。已按站点
  // 主的决定去掉：站内动画不再遵从该设置。若将来要恢复，需同时改回
  // update() / start() 两处的守卫，以及 main.js、quote.js、post.js 与
  // custom.css 里对应的地方。

  var w = 0, h = 0, dpr = 1, cx = 0, cy = 0, R = 0;
  var parts = [];
  var buckets = [];
  var elapsed = 0, lastTs = 0, raf = 0, running = false;
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  // ---------- 粒子 ----------
  // 这里的 Math.random() 只用于打散初始轨道半径、相位与长度，
  // 纯装饰用途，不参与任何安全判断，无需换加密随机源。

  function spawn(p, initial) {
    // 初次铺满盘面并让粒子向内偏聚（u^1.6 把均匀分布压向内侧），
    // 内侧自然更密实，读起来才像一个盘；被吞掉后从外缘重新进入。
    p.r = initial
      ? R_MIN + (R_MAX - R_MIN) * Math.pow(Math.random(), 1.6)
      : R_MAX * (0.97 + Math.random() * 0.08);
    p.a = Math.random() * TAU;
    p.h = (Math.random() * 2 - 1) * DISK_H;
    p.len = 0.016 + Math.random() * 0.042;   // 弧长（弧度）
    p.alpha = 0.40 + Math.random() * 0.50;   // 每条流线的基准亮度
    p.wob = Math.random() * TAU;
    return p;
  }

  function buildParticles() {
    parts = [];
    for (var i = 0; i < COUNT; i++) parts.push(spawn({}, true));
  }

  function buildBuckets() {
    buckets = [];
    for (var c = 0; c < 2; c++) {
      var row = [];
      for (var a = 0; a < ALPHA_LEVELS; a++) row.push([]);
      buckets.push(row);
    }
  }

  // ---------- 尺寸 ----------

  function resize() {
    var rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    cx = w / 2;
    cy = h / 2;
    // 盘的水平半宽是 R，竖直半高是 R*TILT，取两者都放得下的大小
    R = Math.min(w * 0.47, h * 0.66);
  }

  // ---------- 每帧更新 ----------

  function update(dt) {
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var omega = SPEED * Math.pow(0.24 / p.r, 1.5);
      if (omega > OMEGA_MAX) omega = OMEGA_MAX;
      p.a += omega * dt;
      p.r -= DRIFT * dt;
      if (p.r <= R_MIN) spawn(p, false);
    }
  }

  // ---------- 绘制 ----------

  function collect(pass, ox, oy, tilt) {
    for (var c = 0; c < 2; c++) {
      for (var a = 0; a < ALPHA_LEVELS; a++) buckets[c][a].length = 0;
    }

    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var sin = Math.sin(p.a);
      var front = sin >= 0;                      // 盘面上朝向观察者的一半
      if ((pass === 1) !== front) continue;

      var t = (p.r - R_MIN) / (R_MAX - R_MIN);   // 0 = 内缘，1 = 外缘
      if (t < 0) continue;

      // 内外缘都做柔和收边，避免盘的边界是一圈生硬的椭圆
      var fade = Math.min(1, t / 0.16) * Math.min(1, (1 - t) / 0.12);
      if (fade <= 0.03) continue;

      var heat = 1 - t;                                    // 越靠内越热
      var dop = 0.55 - 0.45 * Math.cos(p.a);               // 多普勒增亮
      var alpha = p.alpha * fade * (0.42 + 0.58 * heat) * dop * (1 + 0.18 * sin);
      if (alpha <= 0.04) continue;
      if (alpha > 0.98) alpha = 0.98;

      var wob = Math.sin(elapsed * 1.6 + p.wob) * 0.005;   // 极轻微的抖动
      var rr = p.r + wob;
      var rx = rr * R;
      var ry = rr * tilt * R;
      var yh = oy + p.h * R;                               // 盘厚带来的纵向偏移

      var ai = Math.floor(alpha * ALPHA_LEVELS);
      if (ai >= ALPHA_LEVELS) ai = ALPHA_LEVELS - 1;
      buckets[t < HOT_BAND ? 1 : 0][ai].push(ox, yh, rx, ry, p.a, p.len);
    }
  }

  function flush() {
    for (var c = 0; c < 2; c++) {
      ctx.strokeStyle = c ? ACCENT : CORE;
      ctx.lineCap = 'round';
      for (var a = 0; a < ALPHA_LEVELS; a++) {
        var arr = buckets[c][a];
        if (!arr.length) continue;
        ctx.globalAlpha = (a + 0.6) / ALPHA_LEVELS;
        ctx.lineWidth = WIDTH;
        ctx.beginPath();
        for (var k = 0; k < arr.length; k += 6) {
          var ox = arr[k], oy = arr[k + 1];
          var rx = arr[k + 2], ry = arr[k + 3];
          var mid = arr[k + 4], half = arr[k + 5];
          var a0 = mid - half, a1 = mid + half;
          // 先把当前点移到弧的起点，再描这段椭圆弧；
          // 移动点与弧起点重合，因此不会留下连接线。
          ctx.moveTo(ox + rx * Math.cos(a0), oy + ry * Math.sin(a0));
          ctx.ellipse(ox, oy, rx, ry, 0, a0, a1);
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    // 鼠标视差：整体轻微跟随，并让盘面倾角有一点变化
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    var ox = cx + pointer.x;
    var oy = cy + pointer.y;
    var tilt = TILT + pointer.y * 0.0005;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 1) 盘的后半圈
    collect(0, ox, oy, tilt);
    flush();

    // 2) 事件视界：纯黑圆盘，正好吃掉盘内缘在竖直方向的投影
    ctx.beginPath();
    ctx.arc(ox, oy, R_MIN * R * 1.02, 0, TAU);
    ctx.fillStyle = INK;
    ctx.fill();

    // 3) 光子环：紧贴视界外的一圈细亮环 + 更淡的外晕
    ctx.beginPath();
    ctx.arc(ox, oy, R_MIN * R * 1.30, 0, TAU);
    ctx.strokeStyle = ACCENT;
    ctx.globalAlpha = 0.14;
    ctx.lineWidth = 3.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ox, oy, R_MIN * R * 1.14, 0, TAU);
    ctx.globalAlpha = 0.60;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 4) 盘的前半圈：盖住视界下缘，形成「盘从黑洞前方掠过」的层次
    collect(1, ox, oy, tilt);
    flush();
  }

  // ---------- 主循环 ----------

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    elapsed += dt;
    update(dt);
    render();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
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
      resize();
      render();
    }, 180);
  });

  // 滚出视口就停帧：黑洞在首屏，但你往下读文章时它早已不可见，
  // 继续每帧重绘整片吸积盘纯属浪费 CPU 与电量。
  var onScreen = true;
  var pageVisible = !document.hidden;

  function sync() {
    if (onScreen && pageVisible) start();
    else stop();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      sync();
    }, { rootMargin: '150px' }).observe(canvas);
  }

  document.addEventListener('visibilitychange', function () {
    pageVisible = !document.hidden;
    sync();
  });

  canvas.addEventListener('pointermove', function (e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left - cx;
    var my = e.clientY - rect.top - cy;
    // 限制在几个像素内，只做轻微的呼吸感，不做大幅位移
    pointer.tx = Math.max(-9, Math.min(9, mx * 0.03));
    pointer.ty = Math.max(-6, Math.min(6, my * 0.03));
  });
  canvas.addEventListener('pointerleave', function () {
    pointer.tx = 0;
    pointer.ty = 0;
  });

  buildBuckets();
  buildParticles();
  resize();
  render();                  // 先同步画好静帧
  sync();                    // 可见才跑动画，滚出视口就停帧省电
})();
