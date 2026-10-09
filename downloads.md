---
layout: default
title: 文件下载
permalink: /downloads/
---

<div class="files-page page-container">
  <h2 class="page-title">文件分享</h2>

  <p class="page-description">
    这里是我整理的开发工具、固件与参考资料。<strong>任何人都可以上传文件</strong>，
    为防止滥用，提交后需管理员审核通过才会公开下载。
  </p>

  <section class="files-panel" aria-labelledby="list-title">
    <div class="panel-head">
      <h3 id="list-title">可下载文件</h3>
      <span class="panel-count" id="files-count"></span>
    </div>

    <div class="files-toolbar">
      <input type="search" id="search-input" placeholder="搜索文件名、说明或上传者"
             aria-label="搜索文件">
      <select id="filter-category" aria-label="按分类筛选">
        <option value="">全部分类</option>
      </select>
      <button type="button" class="btn-ghost" id="refresh-btn">刷新</button>
    </div>

    <p class="files-status" id="files-status" role="status" aria-live="polite">正在加载…</p>
    <ul class="files-list" id="files-list"></ul>

    <div class="files-more" id="files-more" hidden>
      <button type="button" class="btn-ghost" id="load-more">加载更多</button>
    </div>
  </section>

  <section class="upload-panel" aria-labelledby="upload-title">
    <div class="panel-head">
      <h3 id="upload-title">上传文件</h3>
      <button type="button" class="panel-toggle" id="upload-toggle" aria-expanded="false"
              aria-controls="upload-body">展开</button>
    </div>

    <div class="panel-body" id="upload-body" hidden>
      <form id="upload-form" novalidate>
        <div class="field">
          <label for="file-input">选择文件</label>
          <!-- 上传控件由 files.js 替换为拖放区域，无脚本时退回原生 input -->
          <input type="file" id="file-input" required>
          <p class="field-hint" id="file-hint">支持安装包、固件、压缩包与文档</p>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="category-select">分类</label>
            <select id="category-select"></select>
          </div>
          <div class="field">
            <label for="uploader-input">上传者（可选）</label>
            <input type="text" id="uploader-input" maxlength="40" placeholder="昵称，方便标注来源">
          </div>
        </div>

        <div class="field">
          <label for="note-input">说明（可选）</label>
          <input type="text" id="note-input" maxlength="200" placeholder="一句话说明文件用途">
        </div>

        <div class="upload-actions">
          <button type="submit" class="btn-primary" id="upload-submit">开始上传</button>
          <span class="upload-hint" id="upload-hint" role="status" aria-live="polite"></span>
        </div>

        <div class="progress" id="progress" hidden>
          <div class="progress-bar" id="progress-bar"></div>
        </div>

        <p class="field-hint" id="upload-limits"></p>
      </form>
    </div>
  </section>

  <section class="admin-panel" id="admin-panel" hidden aria-labelledby="admin-title">
    <div class="panel-head">
      <h3 id="admin-title">待审核</h3>
      <button type="button" class="panel-toggle" id="admin-logout">退出管理</button>
    </div>
    <p class="files-status" id="admin-status" role="status" aria-live="polite"></p>
    <ul class="files-list" id="admin-list"></ul>
  </section>

  <p class="files-footnote">
    <button type="button" class="link-button" id="admin-login">管理入口</button>
  </p>
</div>

<script src="{{ '/assets/js/files.js?v=1' | relative_url }}" defer></script>
