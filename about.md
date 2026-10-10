---
layout: default
title: 关于我
permalink: /about/
---

<div class="about-page page-container page-container--narrow">
  <div class="about-avatar-wrapper">
    <img src="{{ '/assets/images/avatar.jpg' | relative_url }}" alt="头像" class="about-avatar" width="96" height="96" loading="lazy" decoding="async">
  </div>

  <h2>你好！</h2>

  <p class="about-text">
    我是一名电气自动化专业的工程师，专注于嵌入式系统开发和工业控制技术。
  </p>

  <p class="about-text">
    日常工作涉及 PLC 编程、单片机开发、电路设计，以及各种工业现场的调试与优化。
    热爱从零开始构建硬件项目，享受代码与硬件结合带来的成就感。
  </p>

  <p class="about-text">
    这个博客主要用于记录学习过程中的心得体会、项目实战经验以及技术分享，
    希望能与同行交流，共同进步。
  </p>

  <div class="about-section-divider">
    <h3 class="about-section-heading">技术领域</h3>
    <div class="about-tags">
      <span class="skill-tag">电气自动化</span>
      <span class="skill-tag">嵌入式开发</span>
      <span class="skill-tag">硬件设计</span>
      <span class="skill-tag">数据采集</span>
      <span class="skill-tag">通信协议</span>
      <span class="skill-tag">调试测试</span>
    </div>
  </div>

  <div class="about-section-divider">
    <h3 class="about-section-heading">联系我</h3>
    <p class="about-text" style="margin-bottom: 0;">
      欢迎通过以下方式与我交流：
    </p>
    <div class="about-social-links">
      <a href="https://github.com/Wj123-ui" class="social-btn social-btn--compact" target="_blank" rel="noopener">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
        </svg>
        GitHub
      </a>
      <a href="mailto:{{ site.email }}" class="social-btn social-btn--compact">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3Zm2 0v.52l6 4.2 6-4.2V3H2Zm12 2.06-5.03 3.52a1.5 1.5 0 0 1-1.94 0L2 5.06V13h12V5.06Z"/>
        </svg>
        Email
      </a>
      <!-- QQ 没有可靠的网页直达链接，做成点击复制号码；号码本身也显示在按钮上，
           手机上长按即可选中，脚本失效时也不影响查看。
           点击逻辑在页脚（全站共用一份），这里改用 class 绑定以免和页脚的同名 id 冲突 -->
      <button type="button" class="social-btn social-btn--compact js-qq-copy" data-qq="3554786480" aria-label="复制 QQ 号 3554786480">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M3.5 2.5h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7.2l-3.4 2.9a.5.5 0 0 1-.83-.38V11.4A2 2 0 0 1 1.5 9.5v-5a2 2 0 0 1 2-2Z"/>
        </svg>
        <span class="js-qq-label">QQ 3554786480</span>
      </button>
      <!-- 抖音没有可用的网页直达链接。参照小米官网的做法：
           图标本身是一行里的普通按钮，鼠标悬停（或键盘聚焦）时二维码浮在它上方。
           纯 :hover 键盘用不了，所以容器同时响应 :focus-within；
           触摸设备没有悬停，改为点击切换，由下面的脚本处理。 -->
      <span class="contact-pop">
        <button type="button" class="social-btn social-btn--compact" aria-describedby="douyin-tip">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M9.6 1h2.2c.2 1.2.9 2.2 1.9 2.8.5.3 1 .5 1.6.6v2.2a6.6 6.6 0 0 1-3.6-1.1v4.9a4.3 4.3 0 1 1-4.3-4.3c.2 0 .4 0 .6.1v2.3a2 2 0 1 0 1.4 1.9V1Z"/>
          </svg>
          抖音
        </button>
        <span class="contact-pop-card" role="tooltip">
          <!-- 不加 loading="lazy"：卡片初始是 visibility:hidden，懒加载判定它不在视口内
               就不会去取图，于是鼠标移上去时先看到一块空白（实测）。
               这张图本来就只在悬停时才显示，提前加载正合适。 -->
          <img class="contact-pop-qr" src="{{ '/assets/images/douyin.png' | relative_url }}"
               alt="抖音账号 Hesperus 的二维码" width="180" height="180"
               decoding="async">
          <span class="contact-pop-name">Hesperus</span>
          <span class="contact-pop-id">抖音号 84526083977</span>
        </span>
      </span>
    </div>
    <p class="contact-pop-hint" id="douyin-tip">把鼠标移到图标上可看二维码；也可以直接搜索上方的抖音号关注。</p>
  </div>
</div>

<script>
// 触摸设备没有悬停，改为点击图标切换二维码；桌面端交给 CSS 的 :hover / :focus-within。
(function () {
  var pops = document.querySelectorAll('.contact-pop');
  Array.prototype.forEach.call(pops, function (pop) {
    var btn = pop.querySelector('button');
    if (!btn) return;
    // 只接管没有真实悬停能力的设备，避免和 CSS 的 :hover 打架
    if (!window.matchMedia('(hover: none)').matches) return;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var open = pop.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
})();
</script>
