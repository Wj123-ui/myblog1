#!/usr/bin/env bash
# 安装 / 更新 myblog 文件分享服务。幂等，可重复执行。
#
# 部署脚本会把 app.py、myblog-files.service、本脚本上传到 /root/ 后以 root 执行。
# 用法（服务器上）: bash /root/myblog-files-setup.sh
set -euo pipefail

SERVICE_USER=myblog-files
APP_DIR=/opt/myblog-files
DATA_DIR=/var/lib/myblog-files
ENV_FILE=/etc/myblog-files.env
UNIT=/etc/systemd/system/myblog-files.service
SITE_ORIGIN_DEFAULT="${1:-}"

echo "==> 1/6 创建系统用户"
if ! id -u "$SERVICE_USER" >/dev/null 2>&1; then
    useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER"
    echo "    已创建 $SERVICE_USER"
else
    echo "    已存在 $SERVICE_USER"
fi

echo "==> 2/6 准备目录"
install -d -o root -g root -m 755 "$APP_DIR"
# 目录 755、文件 644：nginx(www-data) 需要能读取 storage 才能做 X-Accel-Redirect
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 755 "$DATA_DIR"
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 755 "$DATA_DIR/storage"
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 700 "$DATA_DIR/tmp"

echo "==> 3/6 安装服务代码"
install -m 644 /root/myblog-files-app.py "$APP_DIR/app.py"
# 自检脚本一并放上去，方便运维随时验证
if [ -f /root/myblog-files-selftest.py ]; then
    install -m 644 /root/myblog-files-selftest.py "$APP_DIR/selftest.py"
fi

echo "==> 4/6 生成环境变量文件"
# 只在首次创建；已存在则保留（含 ADMIN_TOKEN，不覆盖）
if [ ! -f "$ENV_FILE" ]; then
    ADMIN_TOKEN=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
    cat > "$ENV_FILE" <<EOF
# myblog 文件分享服务配置 —— 由 setup 脚本生成，改动后需 systemctl restart myblog-files
BIND=127.0.0.1
PORT=8000

FILES_ROOT=$DATA_DIR

# 单文件上限（MB）与整站配额（GB）
MAX_FILE_MB=2048
MAX_TOTAL_GB=15

# 是否需要管理员审核后才公开可下载
REQUIRE_APPROVAL=true

# 每个 IP 在 RATE_WINDOW_SEC 秒内允许的上传次数
# 注意：同一出口 IP（学校 / 公司 NAT）下的所有用户共享这个额度，别设得太小
RATE_MAX_UPLOADS=20
RATE_WINDOW_SEC=3600

# 允许的扩展名（逗号分隔，不带点）
ALLOWED_EXTS=zip,rar,7z,tar,gz,tgz,bz2,xz,tar.gz,tar.bz2,tar.xz,exe,msi,msix,apk,aab,dmg,pkg,deb,rpm,jar,whl,iso,img,bin,hex,elf,mot,srec,uf2,sar,pack,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,md,csv,json

# 前端分类（逗号分隔）
CATEGORIES=工具软件,固件与驱动,开发环境,文档资料,其他

# 允许的前端来源，防止别站把这里当免费网盘；留空表示不校验
SITE_ORIGIN=$SITE_ORIGIN_DEFAULT

# 管理令牌：审核 / 删除接口需要，请勿外泄
ADMIN_TOKEN=$ADMIN_TOKEN
EOF
    chmod 600 "$ENV_FILE"
    echo "    已生成 $ENV_FILE"
    echo "    ---- 管理令牌（请自行保存）----"
    grep '^ADMIN_TOKEN=' "$ENV_FILE"
    echo "    ------------------------------"
else
    chmod 600 "$ENV_FILE"
    echo "    已存在 $ENV_FILE，保留原配置"
    if [ -n "$SITE_ORIGIN_DEFAULT" ] && ! grep -q "^SITE_ORIGIN=$SITE_ORIGIN_DEFAULT$" "$ENV_FILE"; then
        sed -i "s|^SITE_ORIGIN=.*|SITE_ORIGIN=$SITE_ORIGIN_DEFAULT|" "$ENV_FILE"
        echo "    已更新 SITE_ORIGIN=$SITE_ORIGIN_DEFAULT"
    fi
fi

echo "==> 5/6 安装 systemd 单元"
install -m 644 /root/myblog-files.service "$UNIT"
systemctl daemon-reload
systemctl enable myblog-files >/dev/null 2>&1 || true

echo "==> 6/6 启动服务"
systemctl restart myblog-files
sleep 1
systemctl is-active myblog-files
curl -s --max-time 5 http://127.0.0.1:8000/api/health || echo "(健康检查失败，请查看 journalctl -u myblog-files)"
echo
echo "==> 完成"
