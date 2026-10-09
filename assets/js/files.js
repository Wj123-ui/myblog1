/* 文件分享页：列表 / 搜索 / 上传（含拖放） / 审核面板 */
(function () {
  'use strict';

  var API = '/api';
  var PAGE_SIZE = 20;
  var TOKEN_KEY = 'myblog-admin-token';

  var state = {
    offset: 0,
    total: 0,
    keyword: '',
    category: '',
    stats: null,
    loading: false
  };

  var el = {};

  function $(id) { return document.getElementById(id); }

  function init() {
    el.form = $('upload-form');
    el.list = $('files-list');
    if (!el.list || !el.form) { return; }

    el.fileInput = $('file-input');
    el.fileHint = $('file-hint');
    el.categorySelect = $('category-select');
    el.uploaderInput = $('uploader-input');
    el.noteInput = $('note-input');
    el.uploadSubmit = $('upload-submit');
    el.uploadHint = $('upload-hint');
    el.uploadLimits = $('upload-limits');
    el.progress = $('progress');
    el.progressBar = $('progress-bar');
    el.uploadBody = $('upload-body');
    el.uploadToggle = $('upload-toggle');
    el.status = $('files-status');
    el.count = $('files-count');
    el.search = $('search-input');
    el.filterCategory = $('filter-category');
    el.refresh = $('refresh-btn');
    el.more = $('files-more');
    el.loadMore = $('load-more');
    el.adminPanel = $('admin-panel');
    el.adminList = $('admin-list');
    el.adminStatus = $('admin-status');
    el.adminLogin = $('admin-login');
    el.adminLogout = $('admin-logout');

    bindEvents();
    setupDropZone();
    loadStats().then(function () { loadFiles(true); });
  }

  /* ---------------- 基础工具 ---------------- */

  function api(path, options) {
    options = options || {};
    options.headers = Object.assign({ 'Accept': 'application/json' }, options.headers || {});
    return window.fetch(API + path, options).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || ('请求失败（HTTP ' + res.status + '）'));
        }
        return data;
      });
    });
  }

  function formatSize(bytes) {
    if (bytes === null || bytes === undefined) { return ''; }
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = 0, n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return (i === 0 ? n : n.toFixed(n >= 100 ? 0 : 1)) + ' ' + units[i];
  }

  function formatDate(iso) {
    if (!iso) { return ''; }
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return String(iso).slice(0, 10); }
    var pad = function (v) { return v < 10 ? '0' + v : '' + v; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function setStatus(node, text, kind) {
    if (!node) { return; }
    node.textContent = text || '';
    node.className = (node.classList.contains('files-status') ? 'files-status' : 'upload-hint')
      + (kind ? ' is-' + kind : '');
  }

  function togglePanel(panel, button) {
    var willOpen = panel.hidden;
    panel.hidden = !willOpen;
    button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    button.textContent = willOpen ? '收起' : '展开';
  }

  function bindEvents() {
    el.uploadToggle.addEventListener('click', function () {
      togglePanel(el.uploadBody, el.uploadToggle);
    });
    el.form.addEventListener('submit', onSubmit);
    el.fileInput.addEventListener('change', onFileChange);
    el.refresh.addEventListener('click', function () { loadStats(); loadFiles(true); });
    el.loadMore.addEventListener('click', function () { loadFiles(false); });

    var timer = null;
    el.search.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.keyword = el.search.value.trim();
        loadFiles(true);
      }, 300);
    });
    el.filterCategory.addEventListener('change', function () {
      state.category = el.filterCategory.value;
      loadFiles(true);
    });

    el.adminLogin.addEventListener('click', function () {
      var token = window.prompt('请输入管理令牌（仅保存在本机浏览器）');
      if (token && token.trim()) {
        window.localStorage.setItem(TOKEN_KEY, token.trim());
        openAdmin();
      }
    });
    el.adminLogout.addEventListener('click', function () {
      window.localStorage.removeItem(TOKEN_KEY);
      el.adminPanel.hidden = true;
    });

    if (window.localStorage.getItem(TOKEN_KEY)) { openAdmin(); }
  }

  /* ---------------- 拖放上传 ---------------- */

  function setupDropZone() {
    var wrapper = document.createElement('div');
    wrapper.className = 'drop-zone';
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('role', 'button');
    wrapper.innerHTML = '<span class="drop-zone-text">点击选择文件，或把文件拖到这里</span>';

    el.fileInput.parentNode.insertBefore(wrapper, el.fileInput);
    el.fileInput.classList.add('visually-hidden');

    wrapper.addEventListener('click', function () { el.fileInput.click(); });
    wrapper.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.fileInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach(function (name) {
      wrapper.addEventListener(name, function (e) {
        e.preventDefault();
        wrapper.classList.add('is-over');
      });
    });
    ['dragleave', 'drop'].forEach(function (name) {
      wrapper.addEventListener(name, function (e) {
        e.preventDefault();
        wrapper.classList.remove('is-over');
      });
    });
    wrapper.addEventListener('drop', function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) {
        el.fileInput.files = files;
        onFileChange();
      }
    });

    el.dropZone = wrapper;
  }

  function refreshDropZoneText(text) {
    if (!el.dropZone) { return; }
    var span = el.dropZone.querySelector('.drop-zone-text');
    if (span) { span.textContent = text; }
  }

  /* ---------------- 统计与分类 ---------------- */

  function loadStats() {
    return api('/stats').then(function (data) {
      state.stats = data;
      renderCategories(data.categories);
      el.uploadLimits.textContent =
        '单个文件最大 ' + formatSize(data.max_file_bytes) + '；支持 ' +
        data.allowed_exts.length + ' 种类型（' + data.allowed_exts.join('、') + '）' +
        (data.require_approval ? '。提交后需管理员审核通过才会公开。' : '。');
      el.uploadSubmit.disabled = false;
    }).catch(function (err) {
      el.uploadLimits.textContent = '';
      el.uploadSubmit.disabled = true;
      setStatus(el.status, '文件服务暂时不可用：' + err.message, 'error');
    });
  }

  function renderCategories(categories) {
    var current = el.filterCategory.value || '';
    el.categorySelect.textContent = '';
    el.filterCategory.textContent = '';
    el.filterCategory.appendChild(new window.Option('全部分类', ''));
    (categories || []).forEach(function (name) {
      el.categorySelect.appendChild(new window.Option(name, name));
      el.filterCategory.appendChild(new window.Option(name, name));
    });
    if (current) { el.filterCategory.value = current; }
  }

  /* ---------------- 文件列表 ---------------- */

  function loadFiles(reset) {
    if (state.loading) { return; }
    state.loading = true;
    if (reset) {
      state.offset = 0;
      el.list.textContent = '';
    }
    if (!el.list.children.length) { setStatus(el.status, '正在加载…'); }

    var query = '/files?limit=' + PAGE_SIZE + '&offset=' + state.offset;
    if (state.keyword) { query += '&q=' + encodeURIComponent(state.keyword); }
    if (state.category) { query += '&category=' + encodeURIComponent(state.category); }

    api(query).then(function (data) {
      var files = data.files || [];
      files.forEach(function (f) { el.list.appendChild(renderRow(f)); });
      state.offset += files.length;
      state.total = data.total;

      el.count.textContent = data.total ? '共 ' + data.total + ' 个' : '';
      if (!el.list.children.length) {
        setStatus(el.status,
          (state.keyword || state.category) ? '没有匹配的文件' : '还没有文件，欢迎上传第一个',
          'empty');
      } else {
        setStatus(el.status, '');
      }
      el.more.hidden = state.offset >= data.total;
    }).catch(function (err) {
      setStatus(el.status, '加载失败：' + err.message, 'error');
    }).then(function () {
      state.loading = false;
    });
  }

  function downloadHref(id) {
    return API + '/download/' + encodeURIComponent(id);
  }

  function renderRow(file) {
    var li = document.createElement('li');
    li.className = 'file-item';

    var main = document.createElement('div');
    main.className = 'file-main';

    var name = document.createElement('a');
    name.className = 'file-name';
    name.href = downloadHref(file.id);
    name.textContent = file.name;
    main.appendChild(name);

    var meta = document.createElement('div');
    meta.className = 'file-meta';
    [
      formatSize(file.size),
      file.category,
      file.uploader ? '上传者 ' + file.uploader : '',
      formatDate(file.created_at),
      file.downloads ? file.downloads + ' 次下载' : ''
    ].filter(Boolean).forEach(function (text) {
      var span = document.createElement('span');
      span.className = 'file-meta-item';
      span.textContent = text;
      meta.appendChild(span);
    });
    main.appendChild(meta);

    if (file.note) {
      var note = document.createElement('p');
      note.className = 'file-note';
      note.textContent = file.note;
      main.appendChild(note);
    }

    var action = document.createElement('a');
    action.className = 'btn-ghost file-download';
    action.href = downloadHref(file.id);
    action.textContent = '下载';

    li.appendChild(main);
    li.appendChild(action);
    return li;
  }

  /* ---------------- 上传 ---------------- */

  function onFileChange() {
    var file = el.fileInput.files && el.fileInput.files[0];
    var text = file
      ? file.name + '（' + formatSize(file.size) + '）'
      : '点击选择文件，或把文件拖到这里';
    el.fileHint.textContent = file ? '已选择：' + text : '支持安装包、固件、压缩包与文档';
    refreshDropZoneText(text);
  }

  function onSubmit(event) {
    event.preventDefault();
    var file = el.fileInput.files && el.fileInput.files[0];
    if (!file) {
      setStatus(el.uploadHint, '请先选择文件', 'error');
      return;
    }
    if (state.stats && file.size > state.stats.max_file_bytes) {
      setStatus(el.uploadHint,
        '文件 ' + formatSize(file.size) + ' 超过 ' + formatSize(state.stats.max_file_bytes) + ' 上限',
        'error');
      return;
    }

    var params = '?name=' + encodeURIComponent(file.name)
      + '&category=' + encodeURIComponent(el.categorySelect.value || '')
      + '&uploader=' + encodeURIComponent(el.uploaderInput.value.trim())
      + '&note=' + encodeURIComponent(el.noteInput.value.trim());

    var xhr = new window.XMLHttpRequest();
    xhr.open('PUT', API + '/upload' + params, true);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('Accept', 'application/json');

    el.uploadSubmit.disabled = true;
    el.progress.hidden = false;
    el.progressBar.style.width = '0%';
    setStatus(el.uploadHint, '正在上传…');

    xhr.upload.addEventListener('progress', function (e) {
      if (e.lengthComputable) {
        var pct = Math.round(e.loaded / e.total * 100);
        el.progressBar.style.width = pct + '%';
        setStatus(el.uploadHint, '正在上传… ' + pct + '%');
      }
    });

    xhr.addEventListener('load', function () {
      el.uploadSubmit.disabled = false;
      var data = {};
      try { data = JSON.parse(xhr.responseText); } catch (e) { data = {}; }

      if (xhr.status >= 200 && xhr.status < 300 && data.ok !== false) {
        el.progressBar.style.width = '100%';
        setStatus(el.uploadHint, data.message || '上传成功', 'ok');
        el.form.reset();
        onFileChange();
        loadStats();
        loadFiles(true);
        if (window.localStorage.getItem(TOKEN_KEY)) { loadAdmin(); }
      } else {
        el.progress.hidden = true;
        setStatus(el.uploadHint, data.error || ('上传失败（HTTP ' + xhr.status + '）'), 'error');
      }
    });

    xhr.addEventListener('error', function () {
      el.uploadSubmit.disabled = false;
      el.progress.hidden = true;
      setStatus(el.uploadHint, '网络中断，上传未完成', 'error');
    });

    xhr.send(file);
  }

  /* ---------------- 审核 ---------------- */

  function authHeaders() {
    return { 'X-Admin-Token': window.localStorage.getItem(TOKEN_KEY) || '' };
  }

  function openAdmin() {
    el.adminPanel.hidden = false;
    loadAdmin();
  }

  function loadAdmin() {
    setStatus(el.adminStatus, '正在加载待审核文件…');
    api('/admin/list?status=pending', { headers: authHeaders() }).then(function (data) {
      var files = data.files || [];
      el.adminList.textContent = '';
      files.forEach(function (f) { el.adminList.appendChild(renderAdminRow(f)); });
      setStatus(el.adminStatus, files.length ? '共 ' + files.length + ' 个待审核' : '暂无待审核文件');
    }).catch(function (err) {
      setStatus(el.adminStatus, '读取失败：' + err.message, 'error');
    });
  }

  function renderAdminRow(file) {
    var li = document.createElement('li');
    li.className = 'file-item';

    var main = document.createElement('div');
    main.className = 'file-main';

    var name = document.createElement('span');
    name.className = 'file-name';
    name.textContent = file.name;
    main.appendChild(name);

    var meta = document.createElement('div');
    meta.className = 'file-meta';
    [
      formatSize(file.size),
      file.category,
      file.uploader ? '上传者 ' + file.uploader : '匿名上传',
      formatDate(file.created_at)
    ].filter(Boolean).forEach(function (text) {
      var span = document.createElement('span');
      span.className = 'file-meta-item';
      span.textContent = text;
      meta.appendChild(span);
    });
    main.appendChild(meta);

    var actions = document.createElement('div');
    actions.className = 'file-actions';

    var approve = document.createElement('button');
    approve.type = 'button';
    approve.className = 'btn-ghost';
    approve.textContent = '通过';
    approve.addEventListener('click', function () { review(file.id, 'approve'); });

    var reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'btn-ghost is-danger';
    reject.textContent = '拒绝并删除';
    reject.addEventListener('click', function () { review(file.id, 'reject'); });

    actions.appendChild(approve);
    actions.appendChild(reject);
    li.appendChild(main);
    li.appendChild(actions);
    return li;
  }

  function review(id, action) {
    if (action === 'reject' && !window.confirm('拒绝后文件会被永久删除，确定吗？')) { return; }
    api('/admin/' + action + '/' + encodeURIComponent(id), {
      method: 'POST', headers: authHeaders()
    }).then(function () {
      loadAdmin();
      loadStats();
      loadFiles(true);
    }).catch(function (err) {
      setStatus(el.adminStatus, '操作失败：' + err.message, 'error');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
