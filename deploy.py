#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把博客与文件分享服务部署到自有服务器。

用法：
  python deploy.py                # 构建（带 SITE_URL）+ 上传静态站
  python deploy.py --no-build     # 跳过构建，直接上传 _site
  python deploy.py --setup        # 额外执行服务器初始化（装 nginx、装站点配置）
  python deploy.py --files        # 一并部署文件分享服务（app.py + systemd + nginx 配置）
  python deploy.py --selftest     # 在服务器上跑文件服务的端到端自检（需 --files 已部署过）
  python deploy.py --prune        # 删除远端已下线的旧文件（本地构建里不存在的）
  python deploy.py --smoke        # 上传后跑一轮 HTTP 冒烟检查

凭据与目标地址从下列位置读取，优先级：环境变量 > .deploy.env（仓库根，已 gitignore）。
  DEPLOY_HOST        服务器地址（必需）
  DEPLOY_USER        SSH 用户名，默认 root
  DEPLOY_PORT        SSH 端口，默认 22
  DEPLOY_PASSWORD    SSH 密码；若已配置 SSH 密钥可留空
  DEPLOY_SITE_URL    站点根地址，如 http://121.196.246.16（构建时注入 canonical/sitemap）
  DEPLOY_REMOTE_DIR  远端站点目录，默认 /var/www/myblog1
  DEPLOY_WEB_USER    远端文件属主，默认 www-data
  DEPLOY_SERVICES_DIR 服务端代码目录，默认 /opt/myblog-files

依赖：pip install paramiko
"""
import os, sys, io, posixpath, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.join(ROOT, '_site')
SERVICE_DIR = os.path.join(ROOT, 'files-service')
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
    # 环境变量优先于文件
    for k in list(cfg) + ['DEPLOY_HOST', 'DEPLOY_USER', 'DEPLOY_PORT', 'DEPLOY_PASSWORD',
                          'DEPLOY_SITE_URL', 'DEPLOY_REMOTE_DIR', 'DEPLOY_WEB_USER',
                          'DEPLOY_SERVICES_DIR']:
        if os.environ.get(k):
            cfg[k] = os.environ[k]
    cfg.setdefault('DEPLOY_USER', 'root')
    cfg.setdefault('DEPLOY_PORT', '22')
    cfg.setdefault('DEPLOY_REMOTE_DIR', '/var/www/myblog1')
    cfg.setdefault('DEPLOY_WEB_USER', 'www-data')
    cfg.setdefault('DEPLOY_SERVICES_DIR', '/opt/myblog-files')
    return cfg


def connect(cfg):
    """建立 SSH 连接。已在 known_hosts 中的主机强制校验指纹，否则首次信任并打印该指纹。"""
    import paramiko
    host, port = cfg['DEPLOY_HOST'], int(cfg['DEPLOY_PORT'])
    client = paramiko.SSHClient()
    client.load_system_host_keys()

    known = client.get_host_keys().lookup(host)
    if known is not None:
        client.set_missing_host_key_policy(paramiko.RejectPolicy())
    else:
        policy = paramiko.AutoAddPolicy()
        client.set_missing_host_key_policy(policy)
        print('[warn] %s 不在 known_hosts 中，本次将信任其主机密钥。' % host)
        print('       如要固定校验，请先执行: ssh-keyscan -p %d %s >> ~/.ssh/known_hosts'
              % (port, host))

    client.connect(host, port=port, username=cfg['DEPLOY_USER'],
                   password=cfg.get('DEPLOY_PASSWORD') or None,
                   timeout=25, banner_timeout=30, auth_timeout=30)
    return client


def run(client, cmd, quiet=False):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=900)
    out = stdout.read().decode('utf-8', 'replace')
    err = stderr.read().decode('utf-8', 'replace')
    code = stdout.channel.recv_exit_status()
    if not quiet:
        sys.stdout.write(out)
        if err.strip():
            sys.stderr.write(err)
    if code != 0:
        raise SystemExit('远端命令失败（exit %d）: %s' % (code, cmd))
    return out


def put_text(sftp, local, remote):
    """上传文本文件，并把 CRLF 归一化成 LF。

    Windows 上 core.autocrlf=true 会把工作区签出成 CRLF，而 paramiko 的 put() 是
    二进制上传、原样保留。Python/HTML 带 CRLF 无所谓，但 shell 脚本会静默失效：
    `set -euo pipefail\\r` 里的 \\r 被当成选项名的一部分，bash 报
    「set: pipefail: invalid option name」。这里统一转 LF，避免再次踩到。
    仓库侧还有 .gitattributes 兜底（*.sh 固定 eol=lf）。
    """
    with io.open(local, 'rb') as fh:
        data = fh.read().replace(b'\r\n', b'\n')
    sftp.putfo(io.BytesIO(data), remote)


def mkdirs(sftp, remote_dir):
    parts, cur = [], remote_dir
    while cur and cur not in ('/', ''):
        parts.append(cur)
        cur = posixpath.dirname(cur.rstrip('/'))
    for d in reversed(parts):
        try:
            sftp.stat(d)
        except IOError:
            sftp.mkdir(d)


def upload(client, localdir, remotedir):
    sftp = client.open_sftp()
    mkdirs(sftp, remotedir)
    count = 0
    for root, dirs, files in os.walk(localdir):
        rel = os.path.relpath(root, localdir).replace('\\', '/')
        rdir = remotedir if rel == '.' else posixpath.join(remotedir, rel)
        mkdirs(sftp, rdir)
        for d in dirs:
            mkdirs(sftp, posixpath.join(rdir, d))
        for f in files:
            sftp.put(os.path.join(root, f), posixpath.join(rdir, f))
            count += 1
    sftp.close()
    print('已上传 %d 个文件 -> %s' % (count, remotedir))
    return count


def build(cfg):
    env = dict(os.environ)
    if cfg.get('DEPLOY_SITE_URL'):
        env['SITE_URL'] = cfg['DEPLOY_SITE_URL']
    print('==> 构建静态站点（SITE_URL=%s）' % env.get('SITE_URL', '(未设置)'))
    subprocess.run([sys.executable, os.path.join(ROOT, 'build_preview.py')],
                   cwd=ROOT, env=env, check=True)


def prune(client, cfg):
    """删除远端站点目录里本地构建已不存在的文件。

    上传只做单向覆盖，所以删掉一个页面后远端旧文件会一直留着并且仍可访问
    （例如已下线的 images-test.html，还会被搜索引擎继续抓到）。
    这里列出远端多出来的文件并逐个删除。
    """
    remote_root = cfg['DEPLOY_REMOTE_DIR']
    print('==> 清理远端多余文件')

    local = set()
    for root, _dirs, files in os.walk(SITE_DIR):
        rel = os.path.relpath(root, SITE_DIR).replace('\\', '/')
        for name in files:
            local.add(name if rel == '.' else posixpath.join(rel, name))

    out = run(client, "cd %s && find . -type f | sed 's|^\\./||'" % remote_root, quiet=True)
    remote = [line.strip() for line in out.splitlines() if line.strip()]
    stale = sorted(p for p in remote if p not in local)

    if not stale:
        print('  远端没有多余文件')
        return

    for path in stale:
        print('  删除 %s' % path)
    # 路径来自远端 find 的输出，逐个单引号包裹，避免空格或特殊字符被 shell 解释
    quoted = ' '.join("'%s'" % p.replace("'", "'\\''") for p in stale)
    run(client, 'cd %s && rm -f -- %s' % (remote_root, quoted))


def smoke(client, cfg, paths):
    """在服务器本机逐个 curl，确认 nginx 真的能把每个路径服务出来。"""
    print('==> 冒烟检查（服务器本机 127.0.0.1）')
    for path in paths:
        rel = path.lstrip('/')
        try:
            out = run(client, 'curl -s -o /dev/null -w "%%{http_code}" http://127.0.0.1/%s' % rel,
                      quiet=True).strip()
        except SystemExit:
            out = 'curl 执行失败'
        print('  /%-24s %s' % (rel, out))
    print('  说明：最后一个 no-such-page 返回 404 属预期（自定义 404 页面）。')


def deploy_files_service(client, cfg, setup=False):
    """把文件分享服务同步到服务器：代码 + systemd 单元 + nginx 站点配置（含 /api 反代）。

    代码是自包含的纯标准库脚本，不需要 venv 或 pip 安装。
    nginx 站点配置每次都重新下发，保证 /api 反代与 /__files/ 内部下载位置存在。
    """
    print('==> 同步文件分享服务代码')
    sftp = client.open_sftp()
    try:
        put_text(sftp, os.path.join(SERVICE_DIR, 'app.py'), '/root/myblog-files-app.py')
        put_text(sftp, os.path.join(SERVICE_DIR, 'selftest.py'),
                 '/root/myblog-files-selftest.py')
        put_text(sftp, os.path.join(SERVICE_DIR, 'myblog-files.service'),
                 '/root/myblog-files.service')
        put_text(sftp, os.path.join(SERVICE_DIR, 'setup_files_server.sh'),
                 '/root/myblog-files-setup.sh')
        put_text(sftp, os.path.join(ROOT, 'deploy', 'nginx.conf'),
                 '/root/myblog1-nginx.conf')
        put_text(sftp, os.path.join(ROOT, 'deploy', 'setup_server.sh'),
                 '/root/myblog1-setup.sh')
    finally:
        sftp.close()

    print('==> 更新 nginx 站点配置')
    run(client, 'bash /root/myblog1-setup.sh')

    origin = cfg.get('DEPLOY_SITE_URL') or ''
    print('==> 安装并启动服务（SITE_ORIGIN=%s）' % (origin or '(不限制)'))
    # 传站点地址给初始化脚本，用于生成/更新 SITE_ORIGIN，挡住别站的跨站上传
    run(client, 'bash /root/myblog-files-setup.sh %s' % origin)

    print('==> 重新校验并重载 nginx')
    run(client, 'nginx -t && systemctl reload nginx')


def selftest_files(client, cfg, base='http://127.0.0.1'):
    """在服务器上跑文件服务的端到端自检。

    走 nginx（默认 http://127.0.0.1）而不是直连 :8000，这样下载字节与 Range 的
    断言才会真正执行——直连时文件由 nginx 依 X-Accel-Redirect 发出，Python 只回响应头。
    ADMIN_TOKEN 从服务的环境文件里取，不 source 整个文件（避免执行其内容）。
    """
    print('==> 运行文件服务自检（%s）' % base)
    cmd = ("ADMIN_TOKEN=$(sed -n 's/^ADMIN_TOKEN=//p' /etc/myblog-files.env | head -1) "
           "python3 /root/myblog-files-selftest.py %s" % base)
    run(client, cmd)


def main():
    args = set(sys.argv[1:])
    cfg = load_config()
    if not cfg.get('DEPLOY_HOST'):
        raise SystemExit('未配置 DEPLOY_HOST，请创建 .deploy.env 或设置环境变量')

    if '--no-build' not in args:
        build(cfg)

    if not os.path.isdir(SITE_DIR):
        raise SystemExit('缺少 %s，请先构建（去掉 --no-build）' % SITE_DIR)

    client = connect(cfg)
    try:
        if '--setup' in args:
            print('==> 执行服务器初始化')
            sftp = client.open_sftp()
            try:
                put_text(sftp, os.path.join(ROOT, 'deploy', 'nginx.conf'),
                         '/root/myblog1-nginx.conf')
                put_text(sftp, os.path.join(ROOT, 'deploy', 'setup_server.sh'),
                         '/root/myblog1-setup.sh')
            finally:
                sftp.close()
            run(client, 'bash /root/myblog1-setup.sh')

        upload(client, SITE_DIR, cfg['DEPLOY_REMOTE_DIR'])
        run(client, 'chown -R %s:%s %s' % (cfg['DEPLOY_WEB_USER'], cfg['DEPLOY_WEB_USER'],
                                           cfg['DEPLOY_REMOTE_DIR']))

        if '--files' in args:
            deploy_files_service(client, cfg, setup='--setup' in args)

        if '--selftest' in args:
            selftest_files(client, cfg)

        if '--prune' in args:
            prune(client, cfg)

        if '--smoke' in args:
            smoke(client, cfg, ['/', 'archive.html', 'projects.html', 'about.html',
                                'downloads.html', 'sitemap.xml', 'robots.txt',
                                'api/health', 'no-such-page'])
    finally:
        client.close()

    site = cfg.get('DEPLOY_SITE_URL') or cfg['DEPLOY_HOST']
    print('==> 完成。访问 %s' % site)


if __name__ == '__main__':
    main()
