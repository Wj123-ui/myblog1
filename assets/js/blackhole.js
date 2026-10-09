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
//   * 内侧增亮：越靠内越亮、流线越粗，与真实吸积盘一致；
//   * 弧长分层：外圈流线更长（像被引力拉出的拖尾），并掺入少量长拖尾；
//   * 遮挡关系：盘的后半圈先画、视界圆盘后画、前半圈最后画，
//     于是穿过黑洞背后的那半圈被自然挡住；
//   * 引力气晕 + 三层光子环：紧贴视界由亮到暗衰减，示意光线绕行。
//
// 调观感先改「观感参数」那一段，其余是结构代码。
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
  var HORIZON_GLOW = (rootStyle.getPropertyValue('--bg') || '').trim() || '#f7f5f1';

  var TAU = Math.PI * 2;

  var COUNT = 2600;         // 流线段数
  var TILT = 0.50;          // 盘面倾斜：屏幕 y 方向的压缩比
  var R_MIN = 0.20;         // 盘内缘（归一化半径），同时决定视界大小
  var R_MAX = 1.0;          // 盘外缘
  var SPEED = 1.05;         // 角速度基准（rad/s），实际按 r^-1.5 放大
  var OMEGA_MAX = 4.2;      // 内缘角速度上限，避免最内圈糊成一片
  var DRIFT = 0.020;        // 内落速度（归一化半径/秒）
  var DISK_H = 0.018;       // 盘厚（归一化）：太厚会散成一团雾
  var WIDTH = 2.0;          // 流线宽度（CSS px）
  var ALPHA_LEVELS = 6;     // 透明度分档：合并成少量路径描边，省掉逐条换样式

  // ---- 观感参数（这一组决定像不像吸积盘，改这几个值最有感）----
  // 高温区按内侧权重在内核色与主色之间插值，而不是「t < 某值 就换色」——
  // 原先一刀切会在橙与灰之间留下一圈可见色带。
  // HEAT_HALO 收得比较小：站点设计上橙色只在极小的面积里点一下，
  // 大一片橙会喧宾夺主，也违背「文字与画面以黑灰白为主」的基调。
  var HEAT_HALO = 0.16;     // 只有最靠内的一圈才带主色
  var INNER_LIFT = 1.55;    // 内侧亮度提升：真实吸积盘越靠内越亮，原实现反而被收边压暗
  var LEN_BASE = 0.010;     // 弧长下限（弧度）
  var LEN_RANGE = 0.062;    // 弧长随半径变化的幅度：外圈更长，像被引力拉出的拖尾
  var WOBBLE = 0.010;       // 盘面细纹抖动幅度
  var PARALLAX = 14;        // 鼠标视差最大位移（px）
  var PARALLAX_TILT = 0.0016; // 视差带来的倾角变化

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
  // 本段所有 Math.random() 都只用于打散初始轨道半径、相位、弧长与亮度，
  // 纯装饰用途，不参与任何安全判断（如令牌、非位、ID 生成），无需加密随机源。

  function spawn(p, initial) {
    // 初次铺满盘面并让粒子向内偏聚（u^1.6 把均匀分布压向内侧），
    // 内侧自然更密实，读起来才像一个盘；被吞掉后从外缘重新进入。
    p.r = initial
      ? R_MIN + (R_MAX - R_MIN) * Math.pow(Math.random(), 1.6)
      : R_MAX * (0.97 + Math.random() * 0.08);
    p.a = Math.random() * TAU;
    p.h = (Math.random() * 2 - 1) * DISK_H;
    // 弧长按半径拉开差距：外圈流线更长、内圈更碎，且有少量长拖尾。
    // 原先所有粒子长度几乎相同（0.016~0.058 均匀取样），整片看起来像
    // 均匀铺开的噪点，缺少气体被引力拉长的那种方向感。
    var rr = (p.r - R_MIN) / (R_MAX - R_MIN);
    var tail = Math.random() < 0.18 ? 2.6 : 1;   // 少数长拖尾，打破均匀感
    p.len = (LEN_BASE + LEN_RANGE * Math.pow(rr, 0.7) * Math.random()) * tail;
    p.alpha = 0.42 + Math.random() * 0.46;       // 每条流线的基准亮度
    p.wob = Math.random() * TAU;
    p.spin = 0.7 + Math.random() * 0.6;          // 各自的自转相位差
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

  // 内核色与主色之间按权重插值。原先是「t < HOT_BAND 就用主色」的硬切换，
  // 在橙与灰的交界处会留下一圈能看出来的色带；插值后过渡是连续的。
  function mixHex(a, b, t) {
    var pa = parseInt(a.replace('#', ''), 16);
    var pb = parseInt(b.replace('#', ''), 16);
    if (isNaN(pa) || isNaN(pb)) return a;
    var r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
    var g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
    var bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  // 预先算好每个透明度档在「冷」「热」两端各自的颜色，绘制时直接取，
  // 避免逐条粒子做颜色计算。
  var COLD_RAMP = [];
  var HOT_RAMP = [];
  for (var li = 0; li < ALPHA_LEVELS; li++) {
    var lt = li / (ALPHA_LEVELS - 1);
    COLD_RAMP.push(mixHex('#a8a29a', CORE, lt));
    // 热色从很淡的暖灰起步，只在最亮几档才接近主色——避免整圈发橙
    HOT_RAMP.push(mixHex('#bdb0a4', ACCENT, lt * lt));
  }

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

      // 内外缘都做柔和收边，避免盘的边界是一圈生硬的椭圆。
      // 内侧的收边减轻（0.16 -> 0.07）：原值把最内圈压得过暗，
      // 而真实吸积盘最亮的部分恰恰在内缘。
      var fade = Math.min(1, t / 0.07) * Math.min(1, (1 - t) / 0.12);
      if (fade <= 0.03) continue;

      var heat = 1 - t;                                    // 越靠内越热
      // 多普勒增亮：把 cos 映射到 0.62~1.38，比原来的 0.10~1.00 更接近
      // 相对论束流那种「一侧明显更亮」的观感，同时另一侧不至于全黑。
      var dop = 1.0 + 0.38 * -Math.cos(p.a);
      var alpha = p.alpha * fade * (0.34 + 0.66 * heat * INNER_LIFT) * dop * (1 + 0.18 * sin);
      if (alpha <= 0.04) continue;
      if (alpha > 0.98) alpha = 0.98;

      var wob = Math.sin(elapsed * (0.9 + p.spin) + p.wob) * WOBBLE;
      var rr = p.r + wob;
      var rx = rr * R;
      var ry = rr * tilt * R;
      var yh = oy + p.h * R;                               // 盘厚带来的纵向偏移

      var ai = Math.floor(alpha * ALPHA_LEVELS);
      if (ai >= ALPHA_LEVELS) ai = ALPHA_LEVELS - 1;
      // 只有明显偏内侧的才归入暖色桶，其余走冷色，避免整片发橙
      buckets[heat > (1 - HEAT_HALO) ? 1 : 0][ai].push(ox, yh, rx, ry, p.a, p.len);
    }
  }

  function flush() {
    for (var c = 0; c < 2; c++) {
      ctx.lineCap = 'round';
      for (var a = 0; a < ALPHA_LEVELS; a++) {
        var arr = buckets[c][a];
        if (!arr.length) continue;
        var ramp = c ? HOT_RAMP : COLD_RAMP;
        ctx.strokeStyle = ramp[a];
        ctx.globalAlpha = (a + 0.6) / ALPHA_LEVELS;
        // 内圈更粗、外圈更细：厚薄变化让盘面有纵深，不再是均匀的一层
        ctx.lineWidth = WIDTH * (c ? 1.15 : 1);
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
    var tilt = TILT + pointer.y * PARALLAX_TILT;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 1) 盘的后半圈
    collect(0, ox, oy, tilt);
    flush();

    // 2) 事件视界外的一圈引力透镜光晕：贴着黑色圆盘由亮到暗向外衰减。
    //    真实黑洞的视界本身不发光，但周围被弯曲的光会形成一圈薄的辉光。
    //    半径收得很紧（1.02 -> 1.34）：开大了会变成一圈「实心浅色圆盘」糊住中心，
    //    看起来像套了一个环，而不是薄薄一层辉光。
    var rHorizon = R_MIN * R * 1.02;
    var glow = ctx.createRadialGradient(ox, oy, rHorizon * 0.99, ox, oy, rHorizon * 1.34);
    glow.addColorStop(0, 'rgba(206, 190, 174, 0.42)');
    glow.addColorStop(0.45, 'rgba(206, 190, 174, 0.13)');
    glow.addColorStop(1, 'rgba(206, 190, 174, 0)');
    ctx.beginPath();
    ctx.arc(ox, oy, rHorizon * 1.34, 0, TAU);
    ctx.fillStyle = glow;
    ctx.fill();

    // 3) 事件视界：纯黑圆盘，正好吃掉盘内缘在竖直方向的投影
    ctx.beginPath();
    ctx.arc(ox, oy, rHorizon, 0, TAU);
    ctx.fillStyle = INK;
    ctx.fill();

    // 4) 光子环：由内向外三层，内层细白、中层主色、外层淡晕，
    //    叠出「光线绕黑洞转了一圈」的层次，而不是原来两条均匀的圆圈。
    ctx.strokeStyle = ACCENT;
    ctx.globalAlpha = 0.10;
    ctx.lineWidth = 5.4;
    ctx.beginPath();
    ctx.arc(ox, oy, rHorizon * 1.34, 0, TAU);
    ctx.stroke();

    ctx.globalAlpha = 0.46;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(ox, oy, rHorizon * 1.17, 0, TAU);
    ctx.stroke();

    // 最内侧那道环用偏白的亮线，紧贴黑盘边缘形成锐利轮廓
    ctx.strokeStyle = mixHex(HORIZON_GLOW, '#ffffff', 0.75);
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(ox, oy, rHorizon * 1.045, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 5) 盘的前半圈：盖住视界下缘，形成「盘从黑洞前方掠过」的层次
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
    // 只做轻微的呼吸感：整体位移限制在几个像素内，不做大幅跟随
    pointer.tx = Math.max(-PARALLAX, Math.min(PARALLAX, mx * 0.045));
    pointer.ty = Math.max(-PARALLAX * 0.6, Math.min(PARALLAX * 0.6, my * 0.03));
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
