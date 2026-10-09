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
    loading: false,
    uploading: false
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

  function selectedFiles() {
    return el.fileInput.files ? Array.prototype.slice.call(el.fileInput.files) : [];
  }

  function onFileChange() {
    var files = selectedFiles();
    var text;
    if (!files.length) {
      text = '点击选择文件，或把文件拖到这里';
    } else if (files.length === 1) {
      text = files[0].name + '（' + formatSize(files[0].size) + '）';
    } else {
      var total = files.reduce(function (sum, f) { return sum + f.size; }, 0);
      text = '已选 ' + files.length + ' 个文件（共 ' + formatSize(total) + '）';
    }
    el.fileHint.textContent = files.length
      ? '已选择：' + text
      : '支持安装包、固件、压缩包与文档，可一次选择多个';
    refreshDropZoneText(text);
  }

  /* 上传单个文件。返回 Promise，永不 reject，结果统一是
     { ok, name, status, message }，方便批量时逐个汇总。 */
  function uploadOne(file, index, total) {
    return new Promise(function (resolve) {
      var params = '?name=' + encodeURIComponent(file.name)
        + '&category=' + encodeURIComponent(el.categorySelect.value || '')
        + '&uploader=' + encodeURIComponent(el.uploaderInput.value.trim())
        + '&note=' + encodeURIComponent(el.noteInput.value.trim());

      var xhr = new window.XMLHttpRequest();
      xhr.open('PUT', API + '/upload' + params, true);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.setRequestHeader('Accept', 'application/json');

      var tag = total > 1 ? '（' + (index + 1) + '/' + total + '）' + file.name + ' ' : '';

      xhr.upload.addEventListener('progress', function (e) {
        if (!e.lengthComputable) { return; }
        var pct = Math.round(e.loaded / e.total * 100);
        // 批量时进度条走整批的比例，单文件时就是它自己的比例
        var overall = total > 1
          ? Math.round((index + e.loaded / e.total) / total * 100)
          : pct;
        el.progressBar.style.width = overall + '%';
        setStatus(el.uploadHint, '正在上传 ' + tag + pct + '%');
      });

      xhr.addEventListener('load', function () {
        var data = {};
        try { data = JSON.parse(xhr.responseText); } catch (e) { data = {}; }
        if (xhr.status >= 200 && xhr.status < 300 && data.ok !== false) {
          resolve({ ok: true, name: file.name, status: xhr.status,
                    message: data.message || '上传成功' });
        } else {
          resolve({ ok: false, name: file.name, status: xhr.status,
                    message: data.error || ('上传失败（HTTP ' + xhr.status + '）') });
        }
      });

      xhr.addEventListener('error', function () {
        resolve({ ok: false, name: file.name, status: 0,
                  message: '网络中断，这个文件没有传完' });
      });

      xhr.send(file);
    });
  }

  /* 顺序上传一批文件。逐个传而不是并发：进度提示更清楚，
     也不会一次性把上行带宽占满、或瞬间撞掉服务端的限流。 */
  function runBatch(files) {
    var summary = { ok: 0, failed: [], skipped: 0, lastMessage: '' };
    var i = 0;

    function step() {
      if (i >= files.length) { return Promise.resolve(); }
      var index = i;
      var file = files[i];
      i += 1;
      return uploadOne(file, index, files.length).then(function (res) {
        if (res.ok) {
          summary.ok += 1;
          summary.lastMessage = res.message;
        } else {
          summary.failed.push(res);
          if (res.status === 429) {
            // 已经被限流了，剩下的传上去也会被拒：停下来并说明还剩几个没传
            summary.skipped = files.length - i;
            return;
          }
        }
        return step();
      });
    }

    return step().then(function () { return summary; });
  }

  /* 上传前预检文件名：命中重名或类型不支持的文件直接跳过，不上传。

     为什么要预检：服务端在读完正文前拒绝时（同名、类型不符），由于 nginx 配了
     proxy_request_buffering off，客户端正文还在发就拿不到响应，浏览器只会看到
     「HTTP 502」。所以先问一句 /api/check-name，命中就根本不上传；
     服务端落库前仍会再查一次兜底，那一次能干净地返回 409。 */
  function preflight(files) {
    var result = { allowed: [], skipped: [] };
    var chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () {
        return api('/check-name?name=' + encodeURIComponent(file.name)).then(function (data) {
          if (data.exists) {
            result.skipped.push({ name: file.name, message: data.message || '同名文件已存在，请换一个文件名' });
          } else if (data.ext_allowed === false) {
            result.skipped.push({ name: file.name, message: data.ext_message || '不支持的文件类型' });
          } else {
            result.allowed.push(file);
          }
        }).catch(function () {
          // 预检本身失败（网络抖动、服务未就绪）不该挡着上传，交给服务端判定
          result.allowed.push(file);
        });
      });
    });
    return chain.then(function () { return result; });
  }

  function describeFailures(failed) {
    return failed.map(function (r) {
      var prefix = (failed.length > 1 && r.message.indexOf(r.name) === -1) ? r.name + '：' : '';
      return prefix + r.message;
    }).join('；');
  }

  function onSubmit(event) {
    event.preventDefault();
    if (state.uploading) { return; }

    var files = selectedFiles();
    if (!files.length) {
      setStatus(el.uploadHint, '请先选择文件', 'error');
      return;
    }

    // 客户端先挡掉超限文件：省得白传，也让提示更直接
    var limit = state.stats ? state.stats.max_file_bytes : 0;
    var tooBig = limit ? files.filter(function (f) { return f.size > limit; }) : [];
    if (tooBig.length) {
      setStatus(el.uploadHint,
        '以下文件超过 ' + formatSize(limit) + ' 上限：'
        + tooBig.map(function (f) { return f.name + '（' + formatSize(f.size) + '）'; }).join('、'),
        'error');
      return;
    }

    state.uploading = true;
    el.uploadSubmit.disabled = true;
    el.progress.hidden = false;
    el.progressBar.style.width = '0%';
    setStatus(el.uploadHint, files.length > 1 ? '正在检查 ' + files.length + ' 个文件…' : '正在检查…');

    preflight(files).then(function (pre) {
      var skipped = pre.skipped;

      function wrapUp(summary) {
        state.uploading = false;
        el.uploadSubmit.disabled = false;
        el.progress.hidden = true;
        reportBatch(skipped, summary || { ok: 0, failed: [], skipped: 0, lastMessage: '' });
        el.form.reset();
        onFileChange();
        if ((summary && summary.ok) || skipped.length) {
          loadStats();
          loadFiles(true);
          if (window.localStorage.getItem(TOKEN_KEY)) { loadAdmin(); }
        }
      }

      if (!pre.allowed.length) {
        // 全被预检拦下，没必要再走一遍上传
        wrapUp(null);
        return;
      }

      setStatus(el.uploadHint, pre.allowed.length > 1
        ? '正在上传 1/' + pre.allowed.length + '…'
        : '正在上传…');
      return runBatch(pre.allowed).then(function (summary) {
        if (summary.ok) { el.progressBar.style.width = '100%'; }
        wrapUp(summary);
      });
    });
  }

  /* 汇总整批结果：预检跳过的（重名/类型不符）与上传阶段失败的合并成一句话。 */
  function reportBatch(skipped, summary) {
    var failedList = (summary.failed || []).slice();
    var bad = skipped.length + failedList.length;

    if (!bad && !summary.skipped) {
      setStatus(el.uploadHint,
        summary.ok === 1 ? (summary.lastMessage || '上传成功')
                         : summary.ok + ' 个文件已全部提交，管理员审核通过后即可公开下载',
        'ok');
      return;
    }

    var parts = [];
    if (skipped.length) { parts.push(describeFailures(skipped)); }
    if (failedList.length) { parts.push(describeFailures(failedList)); }
    if (summary.skipped) {
      parts.push('已达上传频率上限，剩余 ' + summary.skipped + ' 个未上传（可稍后再传）');
    }

    if (summary.ok) {
      setStatus(el.uploadHint,
        '成功 ' + summary.ok + ' 个；另有 ' + (bad + (summary.skipped || 0)) + ' 个未上传 —— '
        + parts.join('；'), 'error');
    } else {
      setStatus(el.uploadHint, parts.join('；'), 'error');
    }
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
