#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把本地端口通过 SSH 隧道转发到服务器的 127.0.0.1:80。

用途：阿里云安全组还没放行 80 端口时，也能在浏览器里预览线上站点的真实渲染。
运行后会一直阻塞，Ctrl+C 结束。

用法：
  python deploy/tunnel.py [本地端口]        # 默认 8898
"""
import os, sys, select, socket, threading

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENV_FILE = os.path.join(ROOT, '.deploy.env')


def load_config():
    cfg = {}
    if os.path.isfile(ENV_FILE):
        with open(ENV_FILE, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                cfg[k.strip()] = v.strip()
    for k in ('DEPLOY_HOST', 'DEPLOY_PORT', 'DEPLOY_USER', 'DEPLOY_PASSWORD'):
        if os.environ.get(k):
            cfg[k] = os.environ[k]
    cfg.setdefault('DEPLOY_PORT', '22')
    cfg.setdefault('DEPLOY_USER', 'root')
    if not cfg.get('DEPLOY_HOST'):
        raise SystemExit('未配置 DEPLOY_HOST，请创建 .deploy.env 或设置环境变量')
    return cfg


def pipe(a, b):
    try:
        while True:
            r, _, _ = select.select([a], [], [], 30)
            if not r:
                continue
            data = a.recv(65536)
            if not data:
                break
            b.sendall(data)
    except Exception:
        pass
    finally:
        for s in (a, b):
            try:
                s.close()
            except Exception:
                pass


def main():
    import paramiko

    cfg = load_config()
    local_port = int(sys.argv[1]) if len(sys.argv) > 1 else 8898
    remote_host, remote_port = '127.0.0.1', 80

    client = paramiko.SSHClient()
    client.load_system_host_keys()
    if client.get_host_keys().lookup(cfg['DEPLOY_HOST']) is not None:
        client.set_missing_host_key_policy(paramiko.RejectPolicy())
    else:
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        print('[warn] %s 不在 known_hosts 中，本次信任其主机密钥。' % cfg['DEPLOY_HOST'])
        print('       如要固定校验，请先执行: ssh-keyscan -p %s %s >> ~/.ssh/known_hosts'
              % (cfg['DEPLOY_PORT'], cfg['DEPLOY_HOST']))
    client.connect(cfg['DEPLOY_HOST'], port=int(cfg['DEPLOY_PORT']),
                   username=cfg['DEPLOY_USER'],
                   password=cfg.get('DEPLOY_PASSWORD') or None)
    transport = client.get_transport()

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('127.0.0.1', local_port))
    server.listen(16)
    print('隧道已就绪: http://127.0.0.1:%d/  ->  %s:%d（Ctrl+C 结束）'
          % (local_port, cfg['DEPLOY_HOST'], remote_port), flush=True)

    while True:
        try:
            conn, _ = server.accept()
        except KeyboardInterrupt:
            break
        try:
            chan = transport.open_channel('direct-tcpip', (remote_host, remote_port),
                                          conn.getpeername())
        except Exception as e:
            print('建立通道失败:', e, flush=True)
            conn.close()
            continue
        threading.Thread(target=pipe, args=(conn, chan), daemon=True).start()
        threading.Thread(target=pipe, args=(chan, conn), daemon=True).start()


if __name__ == '__main__':
    main()
