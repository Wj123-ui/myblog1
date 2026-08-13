// ===== 自定义光标（MiMo 同款：小实心点 + 描边圆环）=====
(function() {
  // 触摸设备不启用
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
  // 尊重系统减少动效设置
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.body.classList.add('custom-cursor');

  var ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.style.opacity = '0';
  document.body.appendChild(ring);

  var dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.style.opacity = '0';
  document.body.appendChild(dot);

  var shown = false;

  document.addEventListener('mousemove', function(e) {
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
    ring.style.left = e.clientX + 'px';
    ring.style.top = e.clientY + 'px';
    if (!shown) {
      shown = true;
      ring.style.opacity = '1';
      dot.style.opacity = '1';
    }
  }, { passive: true });

  document.addEventListener('mouseleave', function() {
    ring.style.opacity = '0';
    dot.style.opacity = '0';
  });

  document.addEventListener('mouseenter', function() {
    ring.style.opacity = '1';
    dot.style.opacity = '1';
  });

  // 悬停文本元素时圆环放大
  var textTargets = document.querySelectorAll(
    'h1, h2, h3, h4, h5, h6, p, span, li, a:not([class*="btn"])'
  );
  for (var i = 0; i < textTargets.length; i++) {
    textTargets[i].addEventListener('mouseenter', function() {
      ring.classList.add('cursor-text');
    });
    textTargets[i].addEventListener('mouseleave', function() {
      ring.classList.remove('cursor-text');
    });
  }

  // 悬停按钮时圆环放大
  var btnTargets = document.querySelectorAll('button, [class*="btn"]');
  for (var j = 0; j < btnTargets.length; j++) {
    btnTargets[j].addEventListener('mouseenter', function() {
      ring.classList.add('cursor-button');
    });
    btnTargets[j].addEventListener('mouseleave', function() {
      ring.classList.remove('cursor-button');
    });
  }
})();

// ===== 技能星图（参考 MiMo「开发者的声音」词云 canvas）=====
// 通用工厂：传入容器 id 与配置，即可生成一片漂浮词云
function createSkillMap(containerId, config) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var canvas = container.querySelector('canvas');
  var tooltip = container.querySelector('.skillmap-tooltip');
  if (!canvas || !tooltip) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var nodes = config.nodes;
  var edges = config.edges || [];
  var details = config.details || {};

  var state = { w: 0, h: 0, mx: -1, my: -1, hovered: null, time: 0 };
  var isMobile = window.matchMedia('(max-width: 760px)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 每次交互前刷新移动端判断（视口可能已变化）
  function refreshViewport() {
    isMobile = window.matchMedia('(max-width: 760px)').matches;
  }

  // 缓慢漂浮（复刻 MiMo 的正弦位移）；悬停中的词暂停漂移，避免卡片抖动
  function pos(n, w, h, t) {
    var x = n.x * w;
    var y = n.y * h;
    if (n.id === 'center' || reduced) return { x: x, y: y };
    if (state.hovered && state.hovered.id === n.id) return { x: x, y: y };
    var r = n.size === 'large' ? 12 : 8;
    return {
      x: x + Math.sin(0.4 * t + 11 * n.x + 7 * n.y) * r,
      y: y + Math.cos(0.35 * t + 9 * n.y + 6 * n.x) * (0.7 * r)
    };
  }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var w = container.clientWidth;
    var h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.w = w;
    state.h = h;
    isMobile = window.matchMedia('(max-width: 760px)').matches;
  }

  function nodeFont(n) {
    if (n.size === 'center') return 'normal ' + (isMobile ? 24 : 32) + 'px Georgia, serif';
    if (n.size === 'large') return 'bold ' + (isMobile ? 14 : 18) + 'px Georgia, serif';
    return 'normal ' + (isMobile ? 11 : 13) + 'px Georgia, serif';
  }

  function nodeColor(n, active) {
    if (n.size === 'center') return active ? '#111' : '#1a1a1a';
    if (n.size === 'large') return active ? '#111' : '#2d2a26';
    return active ? '#3a3530' : '#8a8580';
  }

  function draw() {
    var w = state.w, h = state.h, t = state.time;
    ctx.clearRect(0, 0, w, h);

    // 连线
    for (var i = 0; i < edges.length; i++) {
      var a = find(edges[i][0]), b = find(edges[i][1]);
      if (!a || !b) continue;
      var pa = pos(a, w, h, t), pb = pos(b, w, h, t);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = 'rgba(175,168,160,0.28)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    // 文字节点
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var k = 0; k < nodes.length; k++) {
      var n = nodes[k];
      var p = pos(n, w, h, t);
      var active = state.hovered && state.hovered.id === n.id;
      ctx.font = nodeFont(n);
      ctx.fillStyle = nodeColor(n, active);
      ctx.fillText(n.label, p.x, p.y);
    }
  }

  function find(id) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return nodes[i];
    }
    return null;
  }

  // 命中检测：按文字包围盒（仅 small 节点可 hover）
  function hitTest(mx, my) {
    var w = state.w, h = state.h, t = state.time;
    var best = null, bestDist = Infinity;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.size !== 'small') continue;
      var p = pos(n, w, h, t);
      ctx.font = nodeFont(n);
      var halfW = ctx.measureText(n.label).width / 2 + 8;
      var halfH = (isMobile ? 11 : 13) / 2 + 8;
      if (Math.abs(mx - p.x) <= halfW && Math.abs(my - p.y) <= halfH) {
        var d = Math.abs(mx - p.x) + Math.abs(my - p.y);
        if (d < bestDist) { bestDist = d; best = n; }
      }
    }
    return best;
  }

  function updateTooltip() {
    var n = state.hovered;
    if (!n || !details[n.id]) {
      tooltip.classList.remove('visible');
      return;
    }
    var d = details[n.id];
    tooltip.querySelector('.skillmap-tooltip-avatar').textContent = d.avatar;
    tooltip.querySelector('.skillmap-tooltip-name').textContent = d.name;
    tooltip.querySelector('.skillmap-tooltip-role').textContent = d.role;
    tooltip.querySelector('.skillmap-tooltip-quote').textContent = d.quote;

    if (!isMobile) {
      var p = pos(n, state.w, state.h, state.time);
      var left = p.x + 20;
      var top = p.y - 80;
      if (left + 310 > state.w) left = p.x - 320;
      if (left < 0) left = 10;
      if (top < 10) top = p.y + 20;
      if (top + tooltip.offsetHeight > state.h - 10) {
        top = p.y - tooltip.offsetHeight - 10;
      }
      if (top < 0) top = 10;
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    } else {
      tooltip.style.left = '';
      tooltip.style.top = '';
    }
    tooltip.classList.add('visible');
  }

  canvas.addEventListener('mousemove', function(e) {
    refreshViewport();
    var rect = canvas.getBoundingClientRect();
    state.mx = e.clientX - rect.left;
    state.my = e.clientY - rect.top;
    var hit = hitTest(state.mx, state.my);
    if (hit !== state.hovered) {
      state.hovered = hit;
      updateTooltip();
    } else if (hit) {
      updateTooltip();
    }
  }, { passive: true });

  canvas.addEventListener('mouseleave', function() {
    state.hovered = null;
    state.mx = state.my = -1;
    tooltip.classList.remove('visible');
  });

  // 移动端点击查看
  canvas.addEventListener('click', function(e) {
    refreshViewport();
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    state.mx = mx;
    state.my = my;
    var hit = hitTest(mx, my);
    state.hovered = hit;
    updateTooltip();
  });

  resize();
  window.addEventListener('resize', function() {
    resize();
    if (state.hovered) updateTooltip();
  });

  (function loop() {
    if (!reduced) state.time += 0.016;
    draw();
    // 词会缓慢漂移：每帧用当前坐标重新命中，避免词漂走后卡片闪烁
    if (state.mx >= 0 && state.my >= 0) {
      var hit = hitTest(state.mx, state.my);
      if (hit !== state.hovered) {
        state.hovered = hit;
        updateTooltip();
      }
    }
    requestAnimationFrame(loop);
  })();
}

// ===== 核心技术领域（三大方向 + 技术点）=====
createSkillMap('skillmap', {
  nodes: [
    { id: 'center', label: '嵌入式', size: 'center', x: 0.5, y: 0.5 },

    { id: 'auto',   label: '电气自动化', size: 'large', x: 0.22, y: 0.24 },
    { id: 'embed',  label: '嵌入式开发', size: 'large', x: 0.78, y: 0.3 },
    { id: 'hw',     label: '硬件设计',   size: 'large', x: 0.5,  y: 0.83 },

    { id: 'plc',    label: 'PLC 编程',   size: 'small', x: 0.1,  y: 0.44 },
    { id: 'modbus', label: 'Modbus',     size: 'small', x: 0.3,  y: 0.09 },
    { id: 'hmi',    label: 'HMI 触摸屏', size: 'small', x: 0.09, y: 0.13 },
    { id: 'vfd',    label: '变频器调试', size: 'small', x: 0.32, y: 0.4 },

    { id: 'stm32',  label: 'STM32',      size: 'small', x: 0.9,  y: 0.16 },
    { id: 'esp32',  label: 'ESP32',      size: 'small', x: 0.68, y: 0.14 },
    { id: 'rtos',   label: 'FreeRTOS',   size: 'small', x: 0.93, y: 0.45 },
    { id: 'ccpp',   label: 'C / C++',    size: 'small', x: 0.7,  y: 0.47 },
    { id: 'can',    label: 'CAN 总线',   size: 'small', x: 0.86, y: 0.62 },

    { id: 'pcb',    label: 'PCB Layout', size: 'small', x: 0.33, y: 0.68 },
    { id: 'altium', label: 'Altium',     size: 'small', x: 0.16, y: 0.75 },
    { id: 'scope',  label: '示波器',     size: 'small', x: 0.66, y: 0.72 },
    { id: 'circuit',label: '电路设计',   size: 'small', x: 0.5,  y: 0.65 },
    { id: 'kicad',  label: 'KiCad',      size: 'small', x: 0.78, y: 0.88 },
    { id: 'debug',  label: '调试测试',   size: 'small', x: 0.24, y: 0.9 }
  ],
  edges: [
    ['center', 'auto'], ['center', 'embed'], ['center', 'hw'],
    ['auto', 'plc'], ['auto', 'modbus'], ['auto', 'hmi'], ['auto', 'vfd'],
    ['embed', 'stm32'], ['embed', 'esp32'], ['embed', 'rtos'],
    ['embed', 'ccpp'], ['embed', 'can'],
    ['hw', 'pcb'], ['hw', 'altium'], ['hw', 'scope'],
    ['hw', 'circuit'], ['hw', 'kicad'], ['hw', 'debug']
  ],
  details: {
    plc:    { avatar: 'PLC', name: 'PLC 编程',   role: '工业控制', quote: '西门子 S7-1200 / 三菱 FX 系列梯形图与 SCL 编程，涵盖顺序控制与工艺联锁。' },
    modbus: { avatar: 'MB',  name: 'Modbus',     role: '通信协议', quote: 'RTU / TCP 主从站配置与寄存器映射，是上位机与现场设备联调的基础。' },
    hmi:    { avatar: 'HMI', name: 'HMI 触摸屏', role: '人机界面', quote: '组态画面设计、报警记录与数据趋势曲线，让现场操作更直观。' },
    vfd:    { avatar: 'VFD', name: '变频器调试', role: '设备调试', quote: 'V/F 与矢量控制参数整定，配合加减速曲线解决启动冲击问题。' },
    stm32:  { avatar: 'ST',  name: 'STM32',      role: '单片机',   quote: 'HAL 与 LL 库双线并行，从寄存器配置到 CubeMX 工程组织的完整实践。' },
    esp32:  { avatar: 'ESP', name: 'ESP32',      role: '物联网',   quote: 'Wi-Fi / BLE 联网采集，配合 MQTT 上云做远程环境监测节点。' },
    rtos:   { avatar: 'RT',  name: 'FreeRTOS',   role: '实时系统', quote: '任务优先级划分、信号量与队列通信，以及优先级翻转的排查经验。' },
    ccpp:   { avatar: 'C',   name: 'C / C++',    role: '编程语言', quote: '嵌入式场景下的内存管理、指针技巧与模块化分层设计。' },
    can:    { avatar: 'CAN', name: 'CAN 总线',   role: '通信协议', quote: '报文 ID 规划与滤波器配置，多节点组网时的仲裁与错误帧分析。' },
    pcb:    { avatar: 'PCB', name: 'PCB Layout', role: '硬件设计', quote: '叠层规划、阻抗控制与地平面处理，兼顾信号完整性与可制造性。' },
    altium: { avatar: 'AD',  name: 'Altium',     role: '设计工具', quote: '原理图分页管理、封装库维护与生产文件（Gerber / BOM）输出流程。' },
    scope:  { avatar: 'OSC', name: '示波器',     role: '调试测试', quote: '探头补偿、触发设置与时序测量，定位纹波、抖动与信号畸变。' },
    circuit:{ avatar: 'CKT', name: '电路设计',   role: '硬件设计', quote: '电源拓扑选型、运放调理电路与保护设计，从模拟到数字全覆盖。' },
    kicad:  { avatar: 'KC',  name: 'KiCad',      role: '设计工具', quote: '开源 EDA 全流程，适合个人项目与快速打样验证。' },
    debug:  { avatar: 'DBG', name: '调试测试',   role: '验证',     quote: 'SWD 在线调试、逻辑分析仪抓包与现场问题复现的排查方法。' }
  }
});

// ===== 技术栈与工具（平铺词云，星座式连线）=====
createSkillMap('skillmap-tools', {
  nodes: [
    { id: 'stm32',  label: 'STM32',        size: 'small', x: 0.1,  y: 0.25 },
    { id: 'esp32',  label: 'ESP32',        size: 'small', x: 0.3,  y: 0.2 },
    { id: 'arduino',label: 'Arduino',      size: 'small', x: 0.5,  y: 0.23 },
    { id: 'freertos',label: 'FreeRTOS',    size: 'small', x: 0.7,  y: 0.2 },
    { id: 'cpp',    label: 'C / C++',      size: 'small', x: 0.88, y: 0.28 },

    { id: 'python', label: 'Python',       size: 'small', x: 0.14, y: 0.55 },
    { id: 'plc',    label: 'PLC 编程',     size: 'small', x: 0.34, y: 0.52 },
    { id: 'modbus', label: 'Modbus',       size: 'small', x: 0.52, y: 0.55 },
    { id: 'altium', label: 'Altium Designer', size: 'small', x: 0.72, y: 0.52 },
    { id: 'kicad',  label: 'KiCad',        size: 'small', x: 0.9,  y: 0.55 },

    { id: 'keil',   label: 'Keil / IAR',   size: 'small', x: 0.12, y: 0.82 },
    { id: 'can',    label: 'CAN 总线',     size: 'small', x: 0.3,  y: 0.84 },
    { id: 'pcb',    label: 'PCB Layout',   size: 'small', x: 0.5,  y: 0.82 },
    { id: 'circuit',label: '电路设计',     size: 'small', x: 0.68, y: 0.86 },
    { id: 'scope',  label: '示波器',       size: 'small', x: 0.88, y: 0.8 }
  ],
  edges: [
    ['stm32', 'esp32'], ['esp32', 'arduino'], ['arduino', 'freertos'],
    ['freertos', 'cpp'],
    ['cpp', 'python'], ['python', 'plc'], ['plc', 'modbus'],
    ['modbus', 'altium'], ['altium', 'kicad'],
    ['kicad', 'keil'], ['keil', 'can'], ['can', 'pcb'],
    ['pcb', 'circuit'], ['circuit', 'scope'], ['scope', 'stm32']
  ],
  details: {
    stm32:   { avatar: 'ST',   name: 'STM32',        role: '芯片平台', quote: '主流 ARM Cortex-M 单片机平台，生态成熟、资料丰富。' },
    esp32:   { avatar: 'ESP',  name: 'ESP32',        role: '芯片平台', quote: 'Wi-Fi / BLE 双模物联网芯片，性价比高。' },
    arduino: { avatar: 'AR',   name: 'Arduino',      role: '芯片平台', quote: '快速原型与教学场景首选，社区庞大。' },
    freertos:{ avatar: 'RT',   name: 'FreeRTOS',     role: '实时系统', quote: '轻量级实时操作系统，嵌入式多任务标配。' },
    cpp:     { avatar: 'C',    name: 'C / C++',      role: '编程语言', quote: '嵌入式主力语言，直接操作寄存器与硬件。' },
    python:  { avatar: 'PY',   name: 'Python',       role: '编程语言', quote: '上位机脚本、数据处理与自动化测试。' },
    plc:     { avatar: 'PLC',  name: 'PLC 编程',     role: '工业控制', quote: '梯形图 / SCL 编写工业控制逻辑。' },
    modbus:  { avatar: 'MB',   name: 'Modbus',       role: '通信协议', quote: '工控现场最通用的串口 / 以太网协议。' },
    altium:  { avatar: 'AD',   name: 'Altium Designer', role: '设计工具', quote: '商业 EDA，适合正规项目与批量打样。' },
    kicad:   { avatar: 'KC',   name: 'KiCad',        role: '设计工具', quote: '开源 EDA 全流程，个人项目利器。' },
    keil:    { avatar: 'KE',   name: 'Keil / IAR',   role: '开发工具', quote: '主流嵌入式 IDE，配合调试器在线调试。' },
    can:     { avatar: 'CAN',  name: 'CAN 总线',     role: '通信协议', quote: '车载与工控领域的高可靠总线。' },
    pcb:     { avatar: 'PCB',  name: 'PCB Layout',   role: '硬件设计', quote: '布局布线、叠层与阻抗控制。' },
    circuit: { avatar: 'CKT',  name: '电路设计',     role: '硬件设计', quote: '原理图设计、电源与信号调理。' },
    scope:   { avatar: 'OSC',  name: '示波器',       role: '调试测试', quote: '硬件调试的核心仪器。' }
  }
});
