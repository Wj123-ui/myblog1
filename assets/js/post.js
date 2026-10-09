// ===== 文章页阅读增强 =====
// 参考文档型网站（MDN、Tailwind、Stripe 这类）的通用做法，做成四件事：
//   1) 给正文标题生成 slug id 与可悬停的锚点链接，便于深链到某一节；
//   2) 由标题自动生成「本文目录」，带当前阅读位置高亮；
//   3) 估算阅读时长；
//   4) 顶部阅读进度条 + 右下角回到顶部。
//
// 全部在浏览器端完成，因此自建服务器与 GitHub Pages 两条构建路径的表现一致，
// 不需要在构建脚本里各实现一遍。标题 id 在脚本启动时同步写入，
// 所以页面加载完立刻点目录也能跳。
(function () {
  'use strict';

  var article = document.querySelector('.post');
  var content = document.querySelector('.post-content');
  if (!article || !content) return;

  // 判定「当前读到哪里」的基准线。取值要略大于标题的 scroll-margin-top
  // （--header-height + 18px = 78px），否则点目录跳转后标题停在 78px，
  // 而阈值是 76px，会把高亮留在上一节。这里留出一点余量。
  var ACTIVE_BASELINE = 96;

  // ---------- 1) 标题 id 与锚点 ----------

  // 中文标题也要能生成可读的 id：保留汉字、字母、数字，
  // 其余（空格、全角标点、斜杠等）折叠成连字符。
  function slugify(text) {
    var s = (text || '').trim().toLowerCase();
    s = s.replace(/[\s\u3000]+/g, '-');
    s = s.replace(/[^\w\u4e00-\u9fff-]+/g, '');
    s = s.replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
    return s;
  }

  var used = {};

  // id 与锚点给所有 h1–h3，方便深链到任意一节
  var all = Array.prototype.slice.call(content.querySelectorAll('h1, h2, h3')).map(function (h, i) {
    var label = h.textContent.trim();       // 必须在插入锚点前取，否则标签会带一个 '#'
    var id = slugify(label) || ('section-' + (i + 1));
    if (used[id]) {
      used[id] += 1;
      id = id + '-' + used[id];
    } else {
      used[id] = 1;
    }
    h.id = id;

    var link = document.createElement('a');
    link.className = 'heading-anchor';
    link.href = '#' + id;
    link.setAttribute('aria-label', '链接到本节：' + label);
    link.textContent = '#';
    h.appendChild(link);

    return { el: h, id: id, label: label, level: parseInt(h.tagName.charAt(1), 10) };
  });

  // 目录只收「文章最上面两级标题」。有的文章用 # 起头（外设大节），有的用 ## 起头，
  // 早先写死 h2/h3，于是 `# GPIO`、`# I²C` 这类大节整层漏掉，
  // 目录里只剩一串重名的 `## SysConfig 配置重点`，看不出归属。
  var topLevel = all.reduce(function (lo, item) {
    return Math.min(lo, item.level);
  }, 3);
  var headings = all.filter(function (item) {
    return item.level <= topLevel + 1;
  }).map(function (item) {
    item.depth = item.level - topLevel;
    return item;
  });

  // ---------- 2) 目录 ----------

  var tocHost = document.getElementById('post-toc');

  // 在外层声明：syncActive 需要在下方滚动回调里调用，而它是块内赋值的。
  // 注意不能把函数声明写在 if 块里——文件开了 'use strict'，块内函数声明
  // 是块级作用域，外面取不到（之前就是这个原因导致高亮从未生效）。
  var syncActive = null;

  if (tocHost && headings.length >= 3) {
    var list = document.createElement('ul');
    list.className = 'post-toc-list';
    // 条目越多排得越宽：速查手册这类 30 节的文档，双栏会拉成一长条
    if (headings.length > 24) list.classList.add('post-toc-list--wide');
    else if (headings.length > 8) list.classList.add('post-toc-list--split');

    headings.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'post-toc-item post-toc-item--h' + item.level;
      if (item.depth > 0) li.classList.add('post-toc-item--sub');
      li.style.setProperty('--toc-depth', item.depth);
      var a = document.createElement('a');
      a.className = 'post-toc-link';
      a.href = '#' + item.id;
      a.textContent = item.label;
      a.dataset.target = item.id;
      li.appendChild(a);
      list.appendChild(li);
    });

    tocHost.appendChild(list);
    tocHost.hidden = false;

    // 当前阅读位置高亮：取「最后一个已经滚过基准线的标题」。
    // 比 IntersectionObserver 更可控——长文里一节可能横跨好几屏，
    // IO 在节中段会认为没有任何标题进入视口。
    var links = Array.prototype.slice.call(tocHost.querySelectorAll('.post-toc-link'));
    var activeId = null;

    syncActive = function () {
      var current = headings[0] ? headings[0].id : null;
      // 末尾几节下方往往不足一屏，标题顶不过基准线，于是最后几节永远高亮不到
      // （实测长文滚到底仍停在倒数第二节）。触底时直接采用最后一个标题。
      var atBottom =
        window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4;
      if (atBottom) {
        current = headings[headings.length - 1].id;
      } else {
        for (var i = 0; i < headings.length; i++) {
          if (headings[i].el.getBoundingClientRect().top <= ACTIVE_BASELINE) current = headings[i].id;
          else break;
        }
      }
      if (current === activeId) return;
      activeId = current;
      links.forEach(function (a) {
        if (a.dataset.target === current) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
  }

  // ---------- 3) 阅读时长 ----------

  var timeHost = document.getElementById('post-reading-time');
  if (timeHost) {
    var text = content.innerText || '';
    var cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    var words = (text.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9_]+/g) || []).length;
    var codeLines = 0;
    Array.prototype.forEach.call(content.querySelectorAll('pre'), function (pre) {
      codeLines += (pre.innerText || '').split('\n').length;
    });
    // 中文技术内容按 ~380 字/分钟，英文按 ~200 词/分钟，代码按 ~35 行/分钟估
    var minutes = Math.max(1, Math.round(cjk / 380 + words / 200 + codeLines / 35));
    timeHost.textContent = '约 ' + minutes + ' 分钟读完';
    timeHost.hidden = false;
  }

  // ---------- 4) 进度条与回到顶部 ----------

  var bar = document.getElementById('reading-progress');
  var toTop = document.getElementById('back-to-top');

  if (toTop) {
    toTop.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      if (bar) {
        var rect = article.getBoundingClientRect();
        // 文章整体高度减去一屏，就是需要滚动完的距离
        var total = rect.height - window.innerHeight;
        var passed = -rect.top;
        var ratio = total > 0 ? Math.min(1, Math.max(0, passed / total)) : 1;
        bar.style.transform = 'scaleX(' + ratio + ')';
      }
      if (toTop) {
        var show = window.pageYOffset > 600;
        if (show !== toTop.classList.contains('is-visible')) {
          toTop.classList.toggle('is-visible', show);
        }
      }
      if (syncActive) syncActive();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (syncActive) syncActive();
  onScroll();
})();
