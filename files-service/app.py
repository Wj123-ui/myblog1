#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""myblog 文件分享服务。

职责：接收上传、登记元数据、按审核状态对外提供列表；下载交给 nginx 直接发送
（X-Accel-Redirect 内部跳转，支持 Range 断点续传，不让 Python 搬运字节）。

只用标准库，不需要 venv 和 pip。只监听回环地址，由 nginx 反代 /api/ 对外暴露。

接口：
  GET  /api/health
  GET  /api/stats
  GET  /api/files?q=&category=&limit=&offset=
  PUT  /api/upload?name=&category=&uploader=&note=     请求体即文件原始字节
  GET  /api/download/<id>
  GET  /api/admin/list?status=pending
  POST /api/admin/approve/<id> | /reject/<id> | /delete/<id>
管理接口需要请求头 X-Admin-Token。

安全设计：
  * 磁盘访问一律通过 SafeDir —— 它持有目录的 O_DIRECTORY 文件描述符，所有 open/stat/
    unlink/rename 都用 dir_fd 相对该描述符定位。整个过程不拼接任何路径字符串，
    因此 `../`、绝对路径、符号链接逃逸在内核层面就无法生效；写入另加 O_NOFOLLOW。
  * SQL 全部是本模块内的字面量，取值走命名占位符；没有任何函数接受外部传入的 SQL 片段。
  * 下载响应固定 application/octet-stream + Content-Disposition: attachment + nosniff，
    并且只有审核通过的文件才对匿名访问可见。
"""
import hashlib
import json
import logging
import os
import re
import secrets
import signal
import sqlite3
import sys
import threading
import time
import unicodedata
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, quote, unquote, urlsplit

LOG = logging.getLogger('myblog-files')

# ---------------------------------------------------------------- 配置

DEFAULT_ALLOWED_EXTS = (
    'zip,rar,7z,tar,gz,tgz,bz2,xz,tar.gz,tar.bz2,tar.xz,'
    'exe,msi,msix,apk,aab,dmg,pkg,deb,rpm,jar,whl,'
    'iso,img,bin,hex,elf,mot,srec,uf2,sar,pack,'
    'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,md,csv,json'
)

DEFAULT_CATEGORIES = '工具软件,固件与驱动,开发环境,文档资料,其他'


def _env_bool(key, default):
    raw = os.environ.get(key)
    if raw is None or not raw.strip():
        return default
    return raw.strip().lower() in ('1', 'true', 'yes', 'on')


def _env_int(key, default):
    try:
        return int(os.environ.get(key, '').strip())
    except (TypeError, ValueError):
        return default


class Config(object):
    def __init__(self):
        self.root = os.environ.get('FILES_ROOT', '/var/lib/myblog-files').rstrip('/')
        self.storage_dir = os.path.join(self.root, 'storage')
        self.tmp_dir = os.path.join(self.root, 'tmp')
        self.db_path = os.environ.get('FILES_DB', os.path.join(self.root, 'files.db'))

        self.bind = os.environ.get('BIND', '127.0.0.1')
        self.port = _env_int('PORT', 8000)

        self.max_file_bytes = _env_int('MAX_FILE_MB', 2048) * 1024 * 1024
        self.max_total_bytes = int(float(os.environ.get('MAX_TOTAL_GB', '15')) * 1024 ** 3)
        self.max_name_len = _env_int('MAX_NAME_LEN', 180)
        self.chunk_size = _env_int('CHUNK_KB', 256) * 1024

        self.allowed_exts = {
            e.strip().lower().lstrip('.')
            for e in os.environ.get('ALLOWED_EXTS', DEFAULT_ALLOWED_EXTS).split(',')
            if e.strip()
        }
        self.categories = [c.strip() for c in
                           os.environ.get('CATEGORIES', DEFAULT_CATEGORIES).split(',') if c.strip()]
        self.require_approval = _env_bool('REQUIRE_APPROVAL', True)

        self.rate_max = _env_int('RATE_MAX_UPLOADS', 20)
        self.rate_window = _env_int('RATE_WINDOW_SEC', 3600)

        self.admin_token = os.environ.get('ADMIN_TOKEN', '').strip()
        # 允许的前端来源，挡住别站把这里当免费图床；留空表示不校验。
        self.site_origin = os.environ.get('SITE_ORIGIN', '').strip().rstrip('/')

    def ensure_dirs(self):
        for d in (self.root, self.storage_dir, self.tmp_dir):
            os.makedirs(d, exist_ok=True)


CFG = Config()


class TooLarge(Exception):
    """流式接收过程中超过单文件上限。"""


class UnsafeName(ValueError):
    """文件名不符合白名单，或包含路径成分。"""


# ---------------------------------------------------------------- 安全目录句柄

# 存储名完全由本服务生成：16 位十六进制 + 可选扩展名，临时文件再加 .part。
_SAFE_NAME_RE = re.compile(r'^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$')

_O_DIRECTORY = getattr(os, 'O_DIRECTORY', 0)
_O_NOFOLLOW = getattr(os, 'O_NOFOLLOW', 0)
_O_CLOEXEC = getattr(os, 'O_CLOEXEC', 0)


def check_name(name):
    """文件名白名单校验：只允许单段、无分隔符、无路径成分的名字。"""
    if not name or os.sep in name or '/' in name or '\\' in name:
        raise UnsafeName('文件名含路径成分')
    if name in ('.', '..') or not _SAFE_NAME_RE.match(name):
        raise UnsafeName('文件名不合法')
    return name


class SafeDir(object):
    """把目录操作限制在一个已打开的目录描述符内。

    所有文件操作都以 dir_fd 相对该描述符执行，并且不构造路径字符串，
    因此传入任何含 `../` 或绝对路径的名字都无法越出本目录；写入再叠加
    O_NOFOLLOW，符号链接也会被内核拒绝。
    """

    def __init__(self, path):
        os.makedirs(path, exist_ok=True)
        self.path = path
        self.fd = os.open(path, os.O_RDONLY | _O_DIRECTORY | _O_CLOEXEC)

    def exists(self, name):
        check_name(name)
        try:
            os.stat(name, dir_fd=self.fd, follow_symlinks=False)
            return True
        except OSError:
            return False

    def actual_size(self, name):
        check_name(name)
        info = os.stat(name, dir_fd=self.fd, follow_symlinks=False)
        return info.st_size

    def open_write(self, name):
        """创建/截断一个普通文件用于写入。O_NOFOLLOW 挡住符号链接替换。"""
        check_name(name)
        flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC | _O_NOFOLLOW | _O_CLOEXEC
        fd = os.open(name, flags, 0o644, dir_fd=self.fd)
        return os.fdopen(fd, 'wb')

    def unlink(self, name):
        """删除本目录内的普通文件。越界或非法名字直接返回 False。"""
        try:
            check_name(name)
        except UnsafeName:
            LOG.warning('拒绝删除非法文件名: %r', name)
            return False
        try:
            if not self.exists(name):
                return False
            os.unlink(name, dir_fd=self.fd)
            return True
        except OSError:
            LOG.warning('删除失败: %s', name)
            return False

    def move_into(self, src_name, target_dir, dst_name):
        """把本目录内的 src_name 改名为 target_dir 内的 dst_name（同分区，原子操作）。"""
        check_name(src_name)
        check_name(dst_name)
        os.rename(src_name, dst_name, src_dir_fd=self.fd, dst_dir_fd=target_dir.fd)


STORAGE = None
TMP = None


def storage():
    global STORAGE
    if STORAGE is None:
        CFG.ensure_dirs()
        STORAGE = SafeDir(CFG.storage_dir)
    return STORAGE


def tmp_dir():
    global TMP
    if TMP is None:
        CFG.ensure_dirs()
        TMP = SafeDir(CFG.tmp_dir)
    return TMP


# ---------------------------------------------------------------- 存储层

class Store(object):
    """SQLite 仓储。

    每条语句都在方法内以字面量写出并用命名占位符传参，方法签名里没有 SQL 参数，
    因此外部输入没有任何途径进入语句结构。
    """

    def __init__(self, path):
        self._lock = threading.Lock()
        self._writes = 0
        self.conn = sqlite3.connect(path, check_same_thread=False, timeout=15)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute('PRAGMA journal_mode=WAL')
        self.conn.execute('PRAGMA synchronous=NORMAL')
        # 这个连接在整个进程生命周期里都不关闭，而 WAL 模式下自动检查点要等
        # WAL 超过 1000 页才触发。本站写入很少，结果就是 WAL 一路涨、主库一直很小
        # （实测主库 4KB、WAL 1.6MB）：WAL 无界增长，崩溃恢复还要重放全部未合并的页。
        # 这里主动定期合并。
        self.conn.execute('PRAGMA wal_autocheckpoint=256')
        self.conn.execute(
            '''CREATE TABLE IF NOT EXISTS files (
                   id           TEXT PRIMARY KEY,
                   name         TEXT NOT NULL,
                   stored       TEXT NOT NULL,
                   ext          TEXT NOT NULL DEFAULT '',
                   size         INTEGER NOT NULL,
                   sha256       TEXT NOT NULL,
                   category     TEXT NOT NULL DEFAULT '其他',
                   uploader     TEXT NOT NULL DEFAULT '',
                   note         TEXT NOT NULL DEFAULT '',
                   ip           TEXT NOT NULL DEFAULT '',
                   status       TEXT NOT NULL DEFAULT 'pending',
                   downloads    INTEGER NOT NULL DEFAULT 0,
                   created_at   TEXT NOT NULL,
                   published_at TEXT
               )''')
        self.conn.execute(
            'CREATE INDEX IF NOT EXISTS idx_status_created ON files(status, created_at DESC)')
        self.conn.execute('CREATE INDEX IF NOT EXISTS idx_sha ON files(sha256)')
        self.conn.commit()

    # ---- 读 ----

    def stats(self):
        with self._lock:
            published = self.conn.execute(
                "SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS total FROM files"
                " WHERE status = 'published'").fetchone()
            pending = self.conn.execute(
                "SELECT COUNT(*) AS n FROM files WHERE status = 'pending'").fetchone()
        return {'files': published['n'], 'bytes': int(published['total']),
                'pending': pending['n']}

    def active_bytes(self):
        with self._lock:
            row = self.conn.execute(
                "SELECT COALESCE(SUM(size), 0) AS total FROM files"
                " WHERE status <> 'rejected'").fetchone()
        return int(row['total'])

    def get(self, file_id):
        with self._lock:
            row = self.conn.execute(
                'SELECT * FROM files WHERE id = :id', {'id': file_id}).fetchone()
        return dict(row) if row else None

    def find_by_sha(self, sha):
        with self._lock:
            row = self.conn.execute(
                "SELECT * FROM files WHERE sha256 = :sha AND status <> 'rejected'"
                " ORDER BY created_at LIMIT 1", {'sha': sha}).fetchone()
        return dict(row) if row else None

    def find_by_name(self, name):
        """按文件名查已有记录，用于「同名文件自动驳回」。

        忽略大小写：Tool.zip 与 tool.zip 视为同名，避免列表里出现难以分辨的两条。
        已驳回的记录不占名字——否则同名文件被驳回后就永远传不上来了。
        """
        with self._lock:
            row = self.conn.execute(
                "SELECT * FROM files WHERE lower(name) = lower(:name) AND status <> 'rejected'"
                " ORDER BY created_at LIMIT 1", {'name': name}).fetchone()
        return dict(row) if row else None

    def list_published(self, keyword, like, category, limit, offset):
        params = {'kw': keyword, 'like': like, 'category': category,
                  'limit': limit, 'offset': offset}
        with self._lock:
            rows = self.conn.execute(
                "SELECT * FROM files"
                " WHERE status = 'published'"
                "   AND (:category = '' OR category = :category)"
                "   AND (:kw = '' OR name LIKE :like ESCAPE '\\'"
                "                OR note LIKE :like ESCAPE '\\'"
                "                OR uploader LIKE :like ESCAPE '\\')"
                " ORDER BY created_at DESC LIMIT :limit OFFSET :offset", params).fetchall()
            total = self.conn.execute(
                "SELECT COUNT(*) AS n FROM files"
                " WHERE status = 'published'"
                "   AND (:category = '' OR category = :category)"
                "   AND (:kw = '' OR name LIKE :like ESCAPE '\\'"
                "                OR note LIKE :like ESCAPE '\\'"
                "                OR uploader LIKE :like ESCAPE '\\')", params).fetchone()
        return [dict(r) for r in rows], total['n']

    def list_for_admin(self, status):
        with self._lock:
            rows = self.conn.execute(
                "SELECT * FROM files WHERE (:status = 'all' OR status = :status)"
                ' ORDER BY created_at DESC LIMIT 500', {'status': status}).fetchall()
        return [dict(r) for r in rows]

    # ---- 写 ----

    def _after_write(self):
        """写完后按计数做一次被动检查点。调用方必须已持有锁。

        这个连接在整个进程生命周期里都不关闭，而 WAL 模式下的检查点主要靠自动触发。
        本站写入很少，所以此前 WAL 一路涨、主库一直很小（实测主库 4KB、WAL 1.6MB）。
        构造函数里把自动检查点阈值降到 256 页，这里再按写入次数补一次被动检查点：
        PASSIVE 不阻塞其他连接，也不会因为有人正在读就卡住写路径。
        """
        self._writes += 1
        if self._writes % 64 == 0:
            try:
                self.conn.execute('PRAGMA wal_checkpoint(PASSIVE)')
            except sqlite3.Error:
                LOG.exception('WAL 检查点失败（不影响本次写入）')

    def checkpoint(self):
        """把 WAL 合并回主库并截断，进程退出前调用一次。"""
        with self._lock:
            try:
                self.conn.execute('PRAGMA wal_checkpoint(TRUNCATE)')
            except sqlite3.Error:
                LOG.exception('退出前 WAL 检查点失败')

    def insert(self, record):
        with self._lock:
            self.conn.execute(
                'INSERT INTO files (id, name, stored, ext, size, sha256, category, uploader,'
                ' note, ip, status, downloads, created_at, published_at)'
                ' VALUES (:id, :name, :stored, :ext, :size, :sha256, :category, :uploader,'
                ' :note, :ip, :status, 0, :created_at, :published_at)', record)
            self.conn.commit()
            self._after_write()

    def bump_downloads(self, file_id):
        with self._lock:
            self.conn.execute('UPDATE files SET downloads = downloads + 1 WHERE id = :id',
                              {'id': file_id})
            self.conn.commit()
            self._after_write()

    def publish(self, file_id, stamp):
        with self._lock:
            self.conn.execute(
                "UPDATE files SET status = 'published', published_at = :ts WHERE id = :id",
                {'id': file_id, 'ts': stamp})
            self.conn.commit()
            self._after_write()

    def remove(self, file_id):
        with self._lock:
            self.conn.execute('DELETE FROM files WHERE id = :id', {'id': file_id})
            self.conn.commit()
            self._after_write()


STORE = None


def store():
    """惰性初始化仓储，确保目录已就绪。"""
    global STORE
    if STORE is None:
        CFG.ensure_dirs()
        STORE = Store(CFG.db_path)
    return STORE


# ---------------------------------------------------------------- 输入校验

_CTRL_RE = re.compile(r'[\x00-\x1f\x7f]')
_EXT_RE = re.compile(r'^[A-Za-z0-9]{1,10}$')


def ext_of(name):
    """取扩展名，tar.gz 这类双段完整保留。"""
    lowered = name.lower()
    for compound in ('tar.gz', 'tar.bz2', 'tar.xz'):
        if lowered.endswith('.' + compound):
            return compound
    _, dot, tail = name.rpartition('.')
    return tail.lower() if dot else ''


def clean_name(raw):
    """规范化上传文件名：丢掉路径成分与控制字符，限长。返回 (name, ext)。"""
    name = unquote(raw or '').replace('\\', '/').split('/')[-1]
    name = _CTRL_RE.sub('', name)
    name = unicodedata.normalize('NFC', name).strip().strip('.')
    if not name:
        raise ValueError('文件名为空')
    if len(name) > CFG.max_name_len:
        stem, dot, tail = name.rpartition('.')
        if dot:
            name = stem[:max(CFG.max_name_len - len(tail) - 1, 1)] + '.' + tail
        else:
            name = name[:CFG.max_name_len]
    return name, ext_of(name)


def assert_ext_allowed(ext):
    if not ext:
        raise ValueError('文件需带扩展名，且类型需在允许列表内')
    if not _EXT_RE.match(ext) or ext.lower() not in CFG.allowed_exts:
        raise ValueError('不支持的文件类型 .%s' % ext)


def clean_text(raw, limit):
    return _CTRL_RE.sub('', unquote(raw or '')).strip()[:limit]


def content_disposition(name):
    """RFC 5987，保证中文文件名在各浏览器都能正确落地。"""
    fallback = re.sub(r'[^A-Za-z0-9._-]', '_',
                      name.encode('ascii', 'ignore').decode('ascii')).strip('_') or 'download'
    return "attachment; filename=\"%s\"; filename*=UTF-8''%s" % (fallback, quote(name, safe=''))


def name_conflict_message(existing):
    """同名冲突的提示语。区分待审核与已发布，上传者才知道下一步该做什么。"""
    if existing['status'] == 'pending':
        return ('同名文件「%s」已在待审核队列中，请换一个文件名，'
                '或等管理员审核后再试' % existing['name'])
    return '同名文件「%s」已存在，请换一个文件名' % existing['name']


def public_record(row):
    """对外暴露的字段：不含磁盘上的存储名与上传者 IP。"""
    return {
        'id': row['id'],
        'name': row['name'],
        'ext': row['ext'],
        'size': row['size'],
        'category': row['category'],
        'uploader': row['uploader'],
        'note': row['note'],
        'downloads': row['downloads'],
        'created_at': row['created_at'],
        'status': row['status'],
    }


def now_iso():
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


# ---------------------------------------------------------------- 限流

class RateLimiter(object):
    """按 IP 的滑动窗口计数。单进程单实例，无外部依赖。"""

    def __init__(self, max_events, window_sec):
        self.max_events = max_events
        self.window = window_sec
        self._hits = {}
        self._lock = threading.Lock()

    def check(self, key):
        """返回 (是否放行, 建议等待秒数)。"""
        if self.max_events <= 0:
            return True, 0
        now = time.time()
        with self._lock:
            stamps = [t for t in self._hits.get(key, []) if now - t < self.window]
            if len(stamps) >= self.max_events:
                self._hits[key] = stamps
                return False, int(self.window - (now - stamps[0])) + 1
            stamps.append(now)
            self._hits[key] = stamps
            if len(self._hits) > 4096:
                self._hits = {k: v for k, v in self._hits.items() if v and now - v[-1] < self.window}
            return True, 0


RATE = RateLimiter(CFG.rate_max, CFG.rate_window)


# ---------------------------------------------------------------- HTTP

class Handler(BaseHTTPRequestHandler):
    server_version = 'myblog-files'
    sys_version = ''
    protocol_version = 'HTTP/1.1'

    # ---------- 基础工具 ----------

    def log_message(self, fmt, *args):
        LOG.info('%s %s', self.client_address[0], fmt % args)

    def _send_json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def ok(self, payload=None, code=200):
        data = {'ok': True}
        if payload:
            data.update(payload)
        self._send_json(code, data)

    def fail(self, code, message):
        LOG.warning('reject %s: %s', self.path, message)
        self._send_json(code, {'ok': False, 'error': message})

    def reject_before_body(self, code, message):
        """在尚未读取请求体的情况下拒绝。

        HTTP/1.1 下客户端还在上传正文，连接已经不同步，必须关闭而不能复用，
        否则后续请求会被当成上一个请求的剩余正文解析。
        """
        self.close_connection = True
        self.fail(code, message)

    def _client_ip(self):
        # 只信任 nginx 注入的 X-Real-IP；直连时退回 socket 对端地址。
        forwarded = self.headers.get('X-Forwarded-For', '').split(',')[0].strip()
        return self.headers.get('X-Real-IP') or forwarded or self.client_address[0]

    def _origin_ok(self):
        if not CFG.site_origin:
            return True
        origin = (self.headers.get('Origin') or '').rstrip('/')
        return (not origin) or origin == CFG.site_origin

    def _admin_ok(self):
        supplied = self.headers.get('X-Admin-Token', '')
        return bool(CFG.admin_token) and secrets.compare_digest(supplied, CFG.admin_token)

    # ---------- 路由 ----------

    def do_GET(self):
        parts = urlsplit(self.path)
        path = parts.path.rstrip('/') or '/'
        try:
            if path == '/api/health':
                return self.ok({'status': 'ok'})
            if path == '/api/stats':
                return self.handle_stats()
            if path == '/api/files':
                return self.handle_list(parse_qs(parts.query))
            if path == '/api/check-name':
                return self.handle_check_name(parse_qs(parts.query))
            if path.startswith('/api/download/'):
                return self.handle_download(path.rsplit('/', 1)[-1])
            if path == '/api/admin/list':
                if not self._admin_ok():
                    return self.fail(403, '管理令牌无效')
                return self.handle_admin_list(parse_qs(parts.query))
            return self.fail(404, '接口不存在')
        except ValueError as e:
            return self.fail(400, str(e))
        except Exception:
            LOG.exception('GET %s 处理失败', self.path)
            return self.fail(500, '服务器内部错误')

    def do_POST(self):
        path = urlsplit(self.path).path.rstrip('/') or '/'
        try:
            if path.startswith('/api/admin/'):
                if not self._admin_ok():
                    return self.fail(403, '管理令牌无效')
                action, _, file_id = path[len('/api/admin/'):].partition('/')
                if action == 'approve':
                    return self.handle_review(file_id, publish=True)
                if action == 'reject':
                    return self.handle_review(file_id, publish=False)
                if action == 'delete':
                    return self.handle_delete(file_id)
                return self.fail(404, '接口不存在')
            return self.fail(404, '接口不存在')
        except ValueError as e:
            return self.fail(400, str(e))
        except Exception:
            LOG.exception('POST %s 处理失败', self.path)
            return self.fail(500, '服务器内部错误')

    def do_PUT(self):
        parts = urlsplit(self.path)
        path = parts.path.rstrip('/') or '/'
        if path != '/api/upload':
            return self.reject_before_body(404, '接口不存在')
        try:
            return self.handle_upload(parse_qs(parts.query))
        except ValueError as exc:
            # 参数校验失败发生在读取请求体之前，连接已不同步，需关闭
            return self.reject_before_body(400, str(exc))
        except Exception:
            LOG.exception('PUT %s 处理失败', self.path)
            return self.fail(500, '服务器内部错误')

    # ---------- 读接口 ----------

    def handle_check_name(self, qs):
        """上传前的文件名预检。

        为什么要单独一个接口：/api/upload 在读完正文之前就拒绝时（比如同名、类型不符），
        因为 nginx 配了 proxy_request_buffering off，正文还在发的客户端拿不到这个响应，
        nginx 只能回 502。大文件重名时会看到「HTTP 502」而不是原因说明。
        所以前端先问一句，命中就根本不上传；服务端在落库前仍会再查一次兜底，
        那一次正文已经读完，能干净地返回 409。
        """
        raw = qs.get('name', [''])[0]
        if not raw:
            return self.fail(400, '缺少文件名')
        try:
            name, ext = clean_name(raw)
        except ValueError as exc:
            return self.fail(400, str(exc))

        existing = store().find_by_name(name)
        payload = {'name': name, 'ext': ext, 'exists': bool(existing)}
        if existing:
            payload['message'] = name_conflict_message(existing)
            payload['status'] = existing['status']
        if ext not in CFG.allowed_exts:
            payload['ext_allowed'] = False
            payload['ext_message'] = '不支持的文件类型 .%s' % ext
        else:
            payload['ext_allowed'] = True
        return self.ok(payload)

    def handle_stats(self):
        info = store().stats()
        info.update({
            'quota_bytes': CFG.max_total_bytes,
            'used_bytes': store().active_bytes(),
            'max_file_bytes': CFG.max_file_bytes,
            'categories': CFG.categories,
            'allowed_exts': sorted(CFG.allowed_exts),
            'require_approval': CFG.require_approval,
        })
        return self.ok(info)

    def handle_list(self, qs):
        limit = min(max(int((qs.get('limit', ['50'])[0] or 50)), 1), 200)
        offset = max(int((qs.get('offset', ['0'])[0] or 0)), 0)
        keyword = clean_text(qs.get('q', [''])[0], 60)
        category = clean_text(qs.get('category', [''])[0], 30)
        if category and category not in CFG.categories:
            category = ''
        like = '%' + keyword.replace('\\', r'\\').replace('%', r'\%').replace('_', r'\_') + '%'

        rows, total = store().list_published(keyword, like, category, limit, offset)
        return self.ok({'files': [public_record(r) for r in rows], 'total': total,
                        'limit': limit, 'offset': offset})

    def handle_admin_list(self, qs):
        status = (qs.get('status', ['pending'])[0] or 'pending').strip()
        if status not in ('pending', 'published', 'all'):
            raise ValueError('status 取值不合法')
        rows = store().list_for_admin(status)
        return self.ok({'files': [public_record(r) for r in rows]})

    def handle_download(self, file_id):
        if not re.match(r'^[A-Za-z0-9]{4,64}$', file_id or ''):
            raise ValueError('文件 ID 不合法')
        row = store().get(file_id)
        if not row:
            return self.fail(404, '文件不存在')
        if row['status'] != 'published' and not self._admin_ok():
            return self.fail(404, '文件不存在或尚未通过审核')

        try:
            exists = storage().exists(row['stored'])
        except UnsafeName:
            LOG.error('存储名不合法: %r', row['stored'])
            return self.fail(500, '存储记录异常')
        if not exists:
            LOG.error('记录存在但文件缺失: %s', row['stored'])
            return self.fail(404, '文件已丢失，请联系管理员')

        store().bump_downloads(file_id)

        # 交给 nginx 的 internal 位置发送：天然支持 Range 与 sendfile。
        # Content-Length: 0 表示本响应自身没有正文（真正的字节由 nginx 从 /__files/
        # 读取后补齐长度），这样 HTTP/1.1 连接语义明确，不会让客户端等待 body。
        self.send_response(200)
        self.send_header('X-Accel-Redirect', '/__files/' + quote(row['stored'], safe=''))
        self.send_header('Content-Type', 'application/octet-stream')
        self.send_header('Content-Disposition', content_disposition(row['name']))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'private, max-age=0, must-revalidate')
        self.send_header('Content-Length', '0')
        self.end_headers()

    # ---------- 写接口 ----------

    def handle_upload(self, qs):
        if not self._origin_ok():
            return self.reject_before_body(403, '不允许的来源')

        # 先做最廉价的校验，让「文件类型不对」这类正常误操作不消耗上传配额；
        # 校验通过后才计数，这样限流既挡得住滥用，又不会误伤手滑的用户。
        name, ext = clean_name(qs.get('name', [''])[0])
        try:
            assert_ext_allowed(ext)
        except ValueError as exc:
            return self.reject_before_body(400, str(exc))

        ip = self._client_ip()
        allowed, retry_after = RATE.check(ip)
        if not allowed:
            return self.reject_before_body(429, '上传过于频繁，请在 %d 秒后重试' % retry_after)

        category = clean_text(qs.get('category', [''])[0], 30)
        if category not in CFG.categories:
            category = CFG.categories[-1]
        uploader = clean_text(qs.get('uploader', [''])[0], 40)
        note = clean_text(qs.get('note', [''])[0], 200)

        try:
            length = int(self.headers.get('Content-Length', ''))
        except (TypeError, ValueError):
            return self.reject_before_body(411, '缺少 Content-Length，无法确认文件大小')
        if length <= 0:
            return self.fail(400, '文件内容为空')
        limit_mb = CFG.max_file_bytes // 1024 // 1024
        if length > CFG.max_file_bytes:
            return self.reject_before_body(413, '文件超过 %d MB 上限' % limit_mb)
        if store().active_bytes() + length > CFG.max_total_bytes:
            return self.reject_before_body(507, '站点存储空间不足，请联系管理员清理')

        file_id = uuid.uuid4().hex[:16]
        stored = '%s.%s' % (file_id, ext if _EXT_RE.match(ext) else 'bin')
        part = stored + '.part'

        digest = hashlib.sha256()
        received = 0
        try:
            with tmp_dir().open_write(part) as fh:
                remaining = length
                while remaining > 0:
                    chunk = self.rfile.read(min(CFG.chunk_size, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    received += len(chunk)
                    if received > CFG.max_file_bytes:
                        raise TooLarge()
                    digest.update(chunk)
                    fh.write(chunk)
        except TooLarge:
            tmp_dir().unlink(part)
            self.close_connection = True
            return self.fail(413, '文件超过 %d MB 上限' % limit_mb)
        except UnsafeName:
            return self.fail(500, '临时文件名异常')
        except Exception:
            tmp_dir().unlink(part)
            self.close_connection = True
            LOG.exception('写入临时文件失败')
            return self.fail(500, '接收文件失败，请重试')

        if received != length:
            tmp_dir().unlink(part)
            self.close_connection = True
            return self.fail(400, '传输不完整（收到 %d 字节，声明 %d 字节），请重试' % (received, length))

        sha = digest.hexdigest()

        # 同名驳回放在正文读完之后：这是唯一能稳定送达客户端的时机。
        # 放在读正文之前会更快，但 nginx 配的是 proxy_request_buffering off，
        # 正文还没传完客户端就断开，nginx 只能回 502，用户看到的是一个「服务器错误」
        # 而不是「同名文件已存在」。前端另有 /api/check-name 预检，正常情况下
        # 重名在选中文件的那一刻就被拦下，这里只是落库前的兜底（也挡住绕过前端的调用）。
        conflict = store().find_by_name(name)
        if conflict:
            tmp_dir().unlink(part)
            LOG.info('同名驳回 name=%s 已有 id=%s status=%s',
                     name, conflict['id'], conflict['status'])
            return self.fail(409, name_conflict_message(conflict))

        existing = store().find_by_sha(sha)
        if existing:
            tmp_dir().unlink(part)
            LOG.info('重复文件 %s（已有 id=%s）', name, existing['id'])
            return self.ok({'duplicate': True, 'file': public_record(existing),
                            'message': '该文件已存在，直接复用已有记录'})

        try:
            tmp_dir().move_into(part, storage(), stored)
        except Exception:
            tmp_dir().unlink(part)
            LOG.exception('落盘失败')
            return self.fail(500, '保存文件失败')

        pending = CFG.require_approval
        stamp = now_iso()
        store().insert({
            'id': file_id, 'name': name, 'stored': stored, 'ext': ext, 'size': received,
            'sha256': sha, 'category': category, 'uploader': uploader, 'note': note, 'ip': ip,
            'status': 'pending' if pending else 'published', 'created_at': stamp,
            'published_at': None if pending else stamp,
        })
        LOG.info('上传成功 id=%s name=%s size=%d category=%s status=%s ip=%s',
                 file_id, name, received, category, 'pending' if pending else 'published', ip)

        row = store().get(file_id)
        return self.ok({
            'file': public_record(row) if row else None,
            'duplicate': False,
            'message': '已提交，管理员审核通过后即可公开下载' if pending else '上传成功，已可下载',
        }, code=201)

    def handle_review(self, file_id, publish):
        row = store().get(file_id)
        if not row:
            return self.fail(404, '文件不存在')
        if not publish:
            storage().unlink(row['stored'])
            store().remove(file_id)
            LOG.info('审核拒绝并删除 id=%s name=%s', file_id, row['name'])
            return self.ok({'deleted': True})
        store().publish(file_id, now_iso())
        LOG.info('审核通过 id=%s name=%s', file_id, row['name'])
        updated = store().get(file_id)
        return self.ok({'file': public_record(updated) if updated else None})

    def handle_delete(self, file_id):
        row = store().get(file_id)
        if not row:
            return self.fail(404, '文件不存在')
        storage().unlink(row['stored'])
        store().remove(file_id)
        LOG.info('管理员删除 id=%s name=%s', file_id, row['name'])
        return self.ok({'deleted': True})


def main():
    logging.basicConfig(level=os.environ.get('LOG_LEVEL', 'INFO').upper(),
                        format='%(asctime)s %(levelname)s %(message)s', stream=sys.stderr)
    CFG.ensure_dirs()
    store()
    storage()
    tmp_dir()
    if not CFG.admin_token:
        LOG.warning('未设置 ADMIN_TOKEN：审核与删除接口已禁用（上传按 REQUIRE_APPROVAL=%s 处理）',
                    CFG.require_approval)
    LOG.info('启动 %s:%d root=%s 单文件上限=%dMB 总配额=%dGB 需审核=%s',
             CFG.bind, CFG.port, CFG.root, CFG.max_file_bytes // 1024 // 1024,
             CFG.max_total_bytes // 1024 ** 3, CFG.require_approval)

    server = ThreadingHTTPServer((CFG.bind, CFG.port), Handler)
    server.daemon_threads = True

    # systemd 停止服务时先发 SIGTERM（TimeoutStopSec=15），默认处置会直接结束进程，
    # 于是 WAL 留在原地等下次启动重放。这里接住信号，退出前把 WAL 合并并截断。
    def shutdown(signum, frame):
        LOG.info('收到信号 %s，准备退出', signum)
        threading.Thread(target=server.shutdown, daemon=True).start()

    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            signal.signal(sig, shutdown)
        except (ValueError, OSError):
            pass

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        st = STORE
        if st is not None:
            st.checkpoint()
            LOG.info('已合并 WAL 并退出')


if __name__ == '__main__':
    main()
