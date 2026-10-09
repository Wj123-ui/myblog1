#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""部署后诊断：确认服务器侧 nginx 与监听状态正常，并探测公网端口是否放行。

用法：python deploy/doctor.py
"""
import os, socket, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

import deploy  # noqa: E402  仓库根的部署脚本，复用其配置与连接逻辑

CHECK_PORTS = [80, 443]


def probe(host, port, timeout=6):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        s.connect((host, port))
        return True
    except Exception:
        return False
    finally:
        s.close()


def main():
    cfg = deploy.load_config()
    host = cfg['DEPLOY_HOST']

    print('=== 1. 服务器侧检查 ===')
    client = deploy.connect(cfg)
    try:
        cmds = [
            ('nginx 服务状态', 'systemctl is-active nginx'),
            ('监听端口', "ss -tlnp | grep -E ':80 |:22 '"),
            ('本机 HTTP', 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/'),
            ('站点文件数', 'find /var/www/myblog1 -type f | wc -l'),
            ('ufw 状态', 'ufw status | head -1'),
            ('iptables 规则数', 'iptables -S | wc -l'),
            ('nft 规则数', 'nft list ruleset 2>/dev/null | wc -l'),
        ]
        for label, cmd in cmds:
            try:
                out = deploy.run(client, cmd, quiet=True).strip()
            except SystemExit as e:
                out = '(命令失败) %s' % e
            print('  %-14s %s' % (label + ':', out))
    finally:
        client.close()

    print()
    print('=== 2. 公网端口探测（%s） ===' % host)
    blocked = []
    for port in CHECK_PORTS:
        ok = probe(host, port)
        print('  port %-4d %s' % (port, 'OPEN' if ok else '超时/被拦截'))
        if not ok:
            blocked.append(port)

    print()
    if blocked:
        print('结论：服务器侧一切正常，但公网 %s 端口不通 —— 拦截点在阿里云安全组。'
              % '/'.join(str(p) for p in blocked))
        print('需要到阿里云 ECS 控制台放行入方向 TCP %s。' % ', '.join(str(p) for p in blocked))
    else:
        print('结论：公网可访问，站点已上线。')


if __name__ == '__main__':
    main()
