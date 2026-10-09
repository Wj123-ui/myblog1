#!/usr/bin/env bash
# 服务器端初始化：安装 nginx + 安装站点配置。幂等，可重复执行。
# 用法（在服务器上）: bash /root/myblog1-setup.sh
set -euo pipefail

CONF_SRC=/root/myblog1-nginx.conf
CONF_DST=/etc/nginx/sites-available/myblog1
SITE_ROOT=/var/www/myblog1

echo "==> 1/5 安装 nginx"
export DEBIAN_FRONTEND=noninteractive
if ! command -v nginx >/dev/null 2>&1; then
    apt-get update -qq
    apt-get install -y -qq nginx
fi
nginx -v

echo "==> 2/5 准备站点目录 $SITE_ROOT"
mkdir -p "$SITE_ROOT"

echo "==> 3/5 安装站点配置"
if [ ! -f "$CONF_SRC" ]; then
    echo "缺少配置文件 $CONF_SRC" >&2
    exit 1
fi
install -m 644 "$CONF_SRC" "$CONF_DST"
ln -sfn "$CONF_DST" /etc/nginx/sites-enabled/myblog1
# 移除发行版默认站点，避免与 default_server 冲突
rm -f /etc/nginx/sites-enabled/default

echo "==> 4/5 校验配置"
nginx -t

echo "==> 5/5 启动 / 重载 nginx"
systemctl enable nginx >/dev/null 2>&1 || true
if systemctl is-active --quiet nginx; then
    systemctl reload nginx
else
    systemctl start nginx
fi
systemctl is-active nginx
echo "==> 完成"
