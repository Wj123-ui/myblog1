#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""部署后探测：端口放行情况 + 是否触发阿里云备案拦截。

只探测「.deploy.env 里配置的那台服务器」和命令行显式给出的域名。
两者都要先通过白名单校验，并且解析结果必须是公网地址（拦掉环回 / 私网 /
链路本地 / 云元数据），连接用 http.client 直接指定已校验的 host:port，
不经过 URL 解析与重定向，因此不存在被当作访问第三方代理的可能。

用法：python deploy/probe.py [域名]
"""
import http.client
import ipaddress
import os
import socket
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import deploy  # noqa: E402

PORTS = (80, 443, 8080, 8443, 8000, 8888)
ICP_MARKERS = ('Non-compliance', 'ICP Filing', '域名暂时无法访问', '备案')
# 云厂商元数据等永远不允许作为探测目标
BLOCKED_HOSTS = {'100.100.100.200', '169.254.169.254', 'metadata.google.internal'}
ALLOWED_PORTS = (80, 8080)


def is_public_ip(ip_str):
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return False
    return not (ip.is_private or ip.is_loopback or ip.is_link_local
                or ip.is_reserved or ip.is_multicast or ip.is_unspecified)


def resolve_allowed(host, allowlist):
    """host 必须在调用方给定的白名单内，且解析到的每个地址都是公网地址。"""
    host = (host or '').strip().lower()
    if not host:
        raise ValueError('空主机名')
    if host in BLOCKED_HOSTS:
        raise ValueError('拒绝探测云元数据地址: %s' % host)
    if host not in allowlist:
        raise ValueError('主机 %s 不在允许列表 %s 中' % (host, sorted(allowlist)))
    addresses = []
    try:
        for family, _, _, _, sockaddr in socket.getaddrinfo(host, None):
            if family not in (socket.AF_INET, socket.AF_INET6):
                continue
            if not is_public_ip(sockaddr[0]):
                raise ValueError('主机 %s 解析到非公网地址 %s，已阻断' % (host, sockaddr[0]))
            addresses.append(sockaddr[0])
    except socket.gaierror as exc:
        raise ValueError('主机 %s 解析失败: %s' % (host, exc))
    if not addresses:
        raise ValueError('主机 %s 没有可用的公网地址' % host)
    return host


def tcp_open(host, port, timeout=6):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect((host, port))
        return True
    except OSError:
        return False
    finally:
        sock.close()


def fetch(host, port=80, timeout=15):
    """向已校验的主机请求首页，返回 (状态码, 是否备案拦截, 标题)。

    用 http.client 指定 host:port，不做 URL 解析、不跟随重定向；
    host 必须已经通过 resolve_allowed，端口限定在 ALLOWED_PORTS。
    """
    if port not in ALLOWED_PORTS:
        raise ValueError('探测端口不在允许列表: %r' % port)
    if host in BLOCKED_HOSTS:
        raise ValueError('拒绝探测云元数据地址: %s' % host)
    for family, _, _, _, sockaddr in socket.getaddrinfo(host, port):
        if family in (socket.AF_INET, socket.AF_INET6) and not is_public_ip(sockaddr[0]):
            raise ValueError('主机 %s 解析到非公网地址 %s，已阻断' % (host, sockaddr[0]))

    target = '%s:%d' % (host, port)
    conn = http.client.HTTPConnection(host, port, timeout=timeout)
    try:
        conn.request('GET', '/', headers={'Host': host, 'User-Agent': 'Mozilla/5.0'})
        res = conn.getresponse()
        body = res.read(20000).decode('utf-8', 'replace')
        code = res.status
    except (http.client.HTTPException, OSError) as exc:
        return None, False, '连接失败: %s: %s' % (type(exc).__name__, exc)
    finally:
        conn.close()

    blocked = any(marker in body for marker in ICP_MARKERS)
    lo, hi = body.find('<title>'), body.find('</title>')
    title = (body[lo + 7:hi].strip() if lo != -1 and hi > lo
             else body[:60].replace('\n', ' ').strip())
    return code, blocked, '%s (%s)' % (title, target) if title else target


def main():
    cfg = deploy.load_config()
    host = cfg['DEPLOY_HOST']
    domain = (sys.argv[1].strip() if len(sys.argv) > 1 else '')

    allowlist = {host.lower()}
    if domain:
        allowlist.add(domain.lower())

    resolve_allowed(host, allowlist)

    print('=== 1. 端口放行情况（%s） ===' % host)
    for port in PORTS:
        print('  port %-5d %s' % (port, 'OPEN' if tcp_open(host, port) else '超时/未放行'))

    print()
    print('=== 2. 通过 IP 访问 ===')
    code, blocked, title = fetch(host, 80)
    print('  HTTP %s  %s  %s' % (code, '【备案拦截】' if blocked else '正常', title))

    if domain:
        resolve_allowed(domain, allowlist)
        print()
        print('=== 3. 通过域名访问（%s） ===' % domain)
        for port in ALLOWED_PORTS:
            try:
                code, blocked, title = fetch(domain, port)
            except ValueError as exc:
                print('  :%-6d %s' % (port, exc))
                continue
            print('  :%-6d HTTP %s  %s  %s'
                  % (port, code, '【备案拦截】' if blocked else '正常', title))


if __name__ == '__main__':
    main()
