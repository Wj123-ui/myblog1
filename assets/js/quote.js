// ===== 页眉轮换名言 / 古诗词 =====
// 每隔一段时间换一条，淡出再淡入。内容写在本文件里，不请求外部接口，
// 因此不依赖任何第三方服务，也不会因为网络问题空着。
// 首屏同步写入第一条，所以即使脚本定时器不跑，页眉也不会是空白。
(function () {
  'use strict';

  var INTERVAL = 9000;    // 轮换间隔（毫秒）
  var FADE = 320;         // 淡出/淡入时长，需与 CSS 的 transition 一致

  // 混搭古诗词与工程师名言：站点主题是电气自动化与嵌入式，爱迪生和
  // Knuth 这类句子比纯文学更贴题。
  var QUOTES = [
    { text: '路漫漫其修远兮，吾将上下而求索。', source: '屈原《离骚》' },
    { text: '纸上得来终觉浅，绝知此事要躬行。', source: '陆游《冬夜读书示子聿》' },
    { text: '不积跬步，无以至千里；不积小流，无以成江海。', source: '《荀子·劝学》' },
    { text: '锲而不舍，金石可镂。', source: '《荀子·劝学》' },
    { text: '博观而约取，厚积而薄发。', source: '苏轼《稼说送张琥》' },
    { text: '长风破浪会有时，直挂云帆济沧海。', source: '李白《行路难》' },
    { text: '山重水复疑无路，柳暗花明又一村。', source: '陆游《游山西村》' },
    { text: '咬定青山不放松，立根原在破岩中。', source: '郑燮《竹石》' },
    { text: '天才是百分之一的灵感，加上百分之九十九的汗水。', source: '爱迪生' },
    { text: '我没有失败，我只是发现了一万种行不通的方法。', source: '爱迪生' },
    { text: '简单性是可靠性的前提。', source: 'Edsger W. Dijkstra' },
    { text: '过早的优化是万恶之源。', source: 'Donald Knuth' },
    { text: 'Talk is cheap. Show me the code.', source: 'Linus Torvalds' }
  ];

  var el = document.querySelector('.site-quote');
  if (!el) return;
  var textEl = el.querySelector('.site-quote-text');
  var srcEl = el.querySelector('.site-quote-source');
  if (!textEl || !srcEl) return;

  // 随机起点，避免每次进站都从同一条开始。
  // 这里的 Math.random() 只用来挑起始序号，纯展示用途，不参与任何安全判断。
  var i = Math.floor(Math.random() * QUOTES.length);
  var timer = 0;

  function show(n) {
    var q = QUOTES[n];
    textEl.textContent = q.text;
    srcEl.textContent = q.source ? '—— ' + q.source : '';
  }

  function next() {
    if (document.hidden) return;          // 后台标签页不推进，回来时再继续
    i = (i + 1) % QUOTES.length;
    el.classList.add('is-fading');
    window.setTimeout(function () {
      show(i);
      el.classList.remove('is-fading');
    }, FADE);
  }

  show(i);                                 // 先落一条，页眉不会是空的
  timer = window.setInterval(next, INTERVAL);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      window.clearInterval(timer);
      timer = 0;
    } else if (!timer) {
      timer = window.setInterval(next, INTERVAL);
    }
  });
})();
