#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""文件分享服务的端到端自检。

在服务器上运行，覆盖：健康检查、上传、审核门槛、非法扩展名与超大文件拦截、
路径穿越尝试、下载响应头、审核通过后可见、管理接口鉴权、删除。

用法：
  python3 files-service/selftest.py [base_url]
默认 http://127.0.0.1:8000（直连服务）；经 nginx 反代时传 http://127.0.0.1。
环境变量 ADMIN_TOKEN 提供管理令牌；SELFTEST_PORT 可追加一个允许的端口。

安全边界：本脚本是「只打自己」的自检工具。目标在解析阶段就被限定为回环地址
与固定端口白名单，连接用 http.client 直接指定已校验的 host:port，不经过任何
URL 解析或重定向，因此不可能被当作访问第三方（含内网、云元数据）的代理。
"""
import http.client
import ipaddress
import json
import os
import re
import socket
import sys
import urllib.parse
import uuid

DEFAULT_HOST = '127.0.0.1'
DEFAULT_PORT = 8000
ALLOWED_HOSTS = ('127.0.0.1', 'localhost', '::1')
BASE_PORTS = (80, 8000)
FILE_ID_RE = re.compile(r'^[0-9a-f]{8,64}$')

passed = []
failed = []
HOST = DEFAULT_HOST
PORT = DEFAULT_PORT
TOKEN = os.environ.get('ADMIN_TOKEN', '').strip()


def allowed_ports():
    """端口白名单：默认 80/8000，可用 SELFTEST_PORT 追加一个（自检临时实例用）。"""
    ports = list(BASE_PORTS)
    raw = os.environ.get('SELFTEST_PORT', '').strip()
    if raw:
        try:
            ports.append(int(raw))
        except ValueError:
            raise SystemExit('SELFTEST_PORT 不是合法端口: %r' % raw)
    return ports


def resolve_target(raw):
    """校验自检目标：只允许 http + 回环主机 + 白名单端口，返回 (host, port)。"""
    parts = urllib.parse.urlsplit(raw)
    if parts.scheme != 'http':
        raise SystemExit('只允许 http 协议的自检目标，收到: %r' % parts.scheme)
    if parts.hostname not in ALLOWED_HOSTS:
        raise SystemExit('自检目标必须是回环地址（%s），收到: %r'
                         % ('/'.join(ALLOWED_HOSTS), parts.hostname))
    if parts.path not in ('', '/'):
        raise SystemExit('自检目标不应带路径: %r' % parts.path)
    try:
        port = parts.port or 80
    except ValueError:
        raise SystemExit('端口不合法: %r' % parts.netloc)
    if port not in allowed_ports():
        raise SystemExit('端口必须在 %s 之内（可用 SELFTEST_PORT 追加），收到: %r'
                         % (sorted(allowed_ports()), port))
    # 回环主机名必须真的解析到回环地址，避免 hosts 被改写后打到别处
    for info in socket.getaddrinfo(parts.hostname, port, proto=socket.IPPROTO_TCP):
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_loopback:
            raise SystemExit('自检目标解析到非回环地址 %s，已拒绝' % ip)
    return parts.hostname, port


def check(name, condition, detail=''):
    if condition:
        passed.append(name)
        print('  [通过] %s' % name)
    else:
        failed.append(name)
        print('  [失败] %s  %s' % (name, detail))


class Client(object):
    """只连已校验的 host:port；接口路径限定在 /api/ 前缀内。"""

    def __init__(self, host, port):
        self.host = host
        self.port = port

    def request(self, method, path, data=None, headers=None, content_length=None):
        endpoint = path.split('?', 1)[0]
        if not endpoint.startswith('/api/') or '..' in endpoint:
            raise SystemExit('自检只允许调用 /api/ 下的接口: %r' % endpoint)

        conn = http.client.HTTPConnection(self.host, self.port, timeout=60)
        try:
            send_headers = {'Accept': 'application/json'}
            send_headers.update(headers or {})
            if content_length is not None:
                send_headers['Content-Length'] = str(content_length)
                conn.putrequest(method, path)
                for key, value in send_headers.items():
                    conn.putheader(key, value)
                conn.endheaders()
                if data:
                    conn.send(data)
            else:
                conn.request(method, path, body=data, headers=send_headers)
            res = conn.getresponse()
            body = res.read()
            return res.status, dict(res.getheaders()), body
        except (http.client.HTTPException, OSError) as exc:
            return None, {}, ('%s: %s' % (type(exc).__name__, exc)).encode('utf-8')
        finally:
            conn.close()


def parse_json(body):
    try:
        return json.loads(body.decode('utf-8'))
    except Exception:
        return {}


def upload(client, name, payload, category='工具软件', uploader='自检',
           note='端到端自检文件'):
    query = '/api/upload?name=%s&category=%s&uploader=%s&note=%s' % (
        urllib.parse.quote(name), urllib.parse.quote(category),
        urllib.parse.quote(uploader), urllib.parse.quote(note))
    status, headers, body = client.request(
        'PUT', query, data=payload,
        headers={'Content-Type': 'application/octet-stream'})
    return status, parse_json(body)


def fetch_download(client, file_id, range_header=None):
    if not FILE_ID_RE.match(file_id or ''):
        raise SystemExit('文件 ID 不合法: %r' % file_id)
    headers = {'Range': range_header} if range_header else None
    return client.request('GET', '/api/download/' + file_id, headers=headers)


def main():
    client = Client(HOST, PORT)
    suffix = uuid.uuid4().hex[:8]
    payload = os.urandom(4096)

    print('== 自检目标: http://%s:%d ==' % (HOST, PORT))

    status, _, body = client.request('GET', '/api/health')
    check('健康检查返回 200', status == 200 and parse_json(body).get('ok'),
          'status=%s' % status)

    status, _, body = client.request('GET', '/api/stats')
    stats = parse_json(body)
    check('统计接口可用', status == 200 and 'max_file_bytes' in stats, 'status=%s' % status)
    if status != 200:
        summarize()
        return

    need_approval = stats.get('require_approval')
    limit_bytes = stats.get('max_file_bytes') or 0

    status, data = upload(client, 'selftest-%s.bin' % suffix, payload)
    file_id = (data.get('file') or {}).get('id')
    check('上传成功', status in (200, 201) and bool(file_id),
          'status=%s body=%s' % (status, data))
    if not file_id:
        summarize()
        return

    if need_approval:
        status, _, _ = fetch_download(client, file_id)
        check('待审核文件匿名下载被拒', status == 404, 'status=%s' % status)

        _, _, body = client.request('GET', '/api/files?q=%s' % suffix)
        listing = parse_json(body)
        check('待审核文件不出现在公开列表',
              file_id not in [f['id'] for f in listing.get('files', [])])

    status, _ = upload(client, 'evil.sh', b'#!/bin/sh\n')
    check('非法扩展名被拒', status == 400, 'status=%s' % status)

    if limit_bytes:
        query = '/api/upload?name=' + urllib.parse.quote('big-%s.bin' % suffix)
        status, _, _ = client.request('PUT', query, data=b'x',
                                      content_length=limit_bytes + 1024)
        check('超过单文件上限被拒', status in (413, None), 'status=%s' % status)

    status, data = upload(client, '../../etc/passwd.zip', b'PK\x03\x04 fake')
    saved_name = (data.get('file') or {}).get('name', '')
    probe_id = (data.get('file') or {}).get('id')
    check('遍历型文件名被清洗', status in (200, 201) and saved_name == 'passwd.zip',
          'status=%s name=%r' % (status, saved_name))

    if TOKEN and need_approval:
        status, _, body = client.request('POST', '/api/admin/approve/%s' % file_id,
                                         headers={'X-Admin-Token': TOKEN})
        check('管理员审核通过', status == 200,
              'status=%s %s' % (status, parse_json(body).get('error')))
        _, _, body = client.request('GET', '/api/files?q=%s' % suffix)
        check('通过后出现在公开列表',
              file_id in [f['id'] for f in parse_json(body).get('files', [])])
    elif need_approval:
        print('  [跳过] 审核用例（未提供 ADMIN_TOKEN）')

    status, headers, body = fetch_download(client, file_id)
    check('下载返回 200', status == 200, 'status=%s' % status)
    check('下载响应禁止公共缓存',
          headers.get('Cache-Control', '').startswith('private'),
          headers.get('Cache-Control'))
    check('下载响应禁止 MIME 嗅探',
          headers.get('X-Content-Type-Options') == 'nosniff',
          headers.get('X-Content-Type-Options'))
    check('下载为附件形式',
          'attachment' in headers.get('Content-Disposition', ''),
          headers.get('Content-Disposition'))

    # 直连服务（:8000）时文件由 nginx 依 X-Accel-Redirect 发出，Python 只回响应头；
    # 经 nginx（:80）才会真正拿到字节，故这两种断言只在后者成立。
    internal = headers.get('X-Accel-Redirect', '')
    if internal:
        check('内部跳转指向 /__files/ 且不含路径成分',
              internal.startswith('/__files/') and '..' not in internal, internal)
        print('  [跳过] 下载字节与 Range 断言（当前直连服务，需经 nginx 才能验证）')
    else:
        check('下载内容与上传一致', body == payload,
              '收到 %d 字节，期望 %d 字节' % (len(body), len(payload)))
        rstatus, _, rbody = fetch_download(client, file_id, range_header='bytes=0-99')
        check('Range 请求返回 206 且长度为 100',
              rstatus == 206 and len(rbody) == 100,
              'status=%s len=%s' % (rstatus, len(rbody)))

    status, _, _ = fetch_download(client, 'deadbeefdeadbeef')
    check('不存在的文件返回 404', status == 404, 'status=%s' % status)

    status, _, _ = client.request('GET', '/api/admin/list?status=pending')
    check('无令牌访问管理接口被拒', status == 403, 'status=%s' % status)

    if TOKEN:
        for fid in [fid for fid in (file_id, probe_id) if fid]:
            client.request('POST', '/api/admin/delete/%s' % fid,
                           headers={'X-Admin-Token': TOKEN})
        print('  [清理] 已删除自检产生的文件')

    summarize()


def summarize():
    print()
    print('== 结果: %d 通过, %d 失败 ==' % (len(passed), len(failed)))
    if failed:
        for name in failed:
            print('   失败: %s' % name)
        sys.exit(1)


if __name__ == '__main__':
    HOST, PORT = resolve_target(sys.argv[1] if len(sys.argv) > 1
                                else 'http://%s:%d' % (DEFAULT_HOST, DEFAULT_PORT))
    main()
