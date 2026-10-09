# 电气自动化与嵌入式开发博客

基于 **Jekyll + GitHub Pages** 构建的个人技术博客，专注电气自动化、嵌入式系统与硬件设计。

## 技术栈

- **静态站点**: Jekyll 4.3 + Minima 主题（另有自带的零依赖 Python 构建脚本）
- **托管**: 阿里云 ECS + nginx（同时保留 GitHub Pages 那条构建路径）
- **文件分享服务**: 纯标准库 Python，systemd 托管，nginx 反代 + X-Accel-Redirect 下载
- **样式**: 浅色暖底 · 黑灰白 + 小米橙点缀 · 手写 CSS 设计系统
- **插件**: jekyll-feed · jekyll-seo-tag · jekyll-sitemap

## 目录结构

```
AIxiangmu/
├── _config.yml          # Jekyll 配置文件（GitHub Pages 构建用）
├── _layouts/            # 页面布局模板
│   ├── default.html     # 全局布局
│   └── post.html        # 文章布局
├── _includes/           # 可复用组件
│   ├── header.html      # 导航栏
│   ├── footer.html      # 页脚
│   └── custom-head.html # 自定义头部（粒子/光效/滚动条）
├── _posts/              # 博客文章（Markdown）
├── assets/
│   ├── css/custom.css   # 全局自定义样式
│   ├── js/files.js      # 文件分享页交互（上传/列表/审核）
│   └── images/          # 图片资源
├── index.md             # 首页
├── about.md             # 关于页
├── projects.md          # 项目展示
├── archive.md           # 文章归档
├── downloads.md         # 文件分享页（上传 / 下载 / 审核面板）
├── 404.md               # 404 错误页
├── build_preview.py     # 零依赖静态站构建脚本
├── deploy.py            # 一键部署（构建 + 上传 + 服务安装）
├── deploy/              # 部署配套
│   ├── nginx.conf          # nginx 站点配置（静态站 + /api 反代 + 内部下载）
│   ├── setup_server.sh     # 服务器初始化（装 nginx、写站点配置）
│   ├── tunnel.py           # SSH 隧道，安全组未放行时预览
│   ├── doctor.py           # 部署后诊断（服务器侧 + 公网端口）
│   └── probe.py            # IP 与域名访问对比、备案拦截识别
└── files-service/       # 文件分享服务
    ├── app.py              # 后端（纯标准库，systemd 托管）
    ├── myblog-files.service # systemd 单元（含沙箱限制）
    ├── setup_files_server.sh # 服务安装脚本
    └── selftest.py         # 端到端自检
```

## 本地运行

```bash
# 安装依赖
bundle install

# 启动开发服务器
bundle exec jekyll serve

# 访问 http://localhost:4000/myblog1
```

## 构建

仓库里有两套构建方式，产物都是 `_site/`：

```bash
# 本地预览 / GitHub Pages 模式：链接为根绝对路径，不输出 canonical
python build_preview.py

# 自建服务器模式：注入 canonical、og:url，并额外生成 sitemap.xml 与 robots.txt
SITE_URL="http://121.196.246.16" python build_preview.py
```

`build_preview.py` 每次构建会先清空 `_site/`，所以两种模式的产物不会互相污染。

> 注：`_config.yml` 与 Gemfile 仍保留给 GitHub Pages 用原生 Jekyll 构建（`bundle exec jekyll serve`），
> 两条路径互不影响。

## 部署到自有服务器

服务器：阿里云 ECS `121.196.246.16`，Ubuntu 26.04 + nginx，站点根目录 `/var/www/myblog1`。

```bash
# 首次配置：把 .deploy.example.env 复制为 .deploy.env 并填好地址与凭据
cp .deploy.example.env .deploy.env

# 一键部署（构建 + 上传 + 改属主 + 冒烟检查）
python deploy.py --smoke

# 首次在新服务器上部署：额外装 nginx 并写入站点配置
python deploy.py --setup

# 连同文件分享服务一起部署（同步代码 + systemd 单元 + nginx 反代，然后重启服务）
python deploy.py --files

# 只上传不重新构建
python deploy.py --no-build
```

依赖 `pip install paramiko`。`.deploy.env` 已在 `.gitignore` 中，密码不会进仓库。

### 排查访问不通

```bash
python deploy/doctor.py
```

一次跑完服务器侧检查（nginx 状态、监听端口、本机 HTTP、站点文件数、本机防火墙）
和公网端口探测，直接给出「问题在服务器内还是安全组」的结论。

## 文件分享功能

页面在 [http://121.196.246.16/downloads.html](http://121.196.246.16/downloads.html)。
**任何访客都能上传文件**，提交后进入待审核队列，管理员审核通过才会出现在公开列表。

### 架构

```
浏览器 ──/api/*──▶ nginx ──▶ 127.0.0.1:8000 (files-service, systemd)
                    │
                    └─/__files/* (internal)──▶ /var/lib/myblog-files/storage/
```

上传走 Python（流式写盘、边收边算 SHA-256）；下载时 Python 只回一个
`X-Accel-Redirect`，真正的字节由 nginx 从 `internal` 位置直接发送，
因此**支持 Range 断点续传**、不占 Python 进程，还能走 sendfile。

### 安全设计

| 关注点 | 做法 |
|--------|------|
| 路径穿越 | 所有文件操作通过 `SafeDir`：持有目录的 `O_DIRECTORY` fd，用 `dir_fd` 相对定位，不拼路径字符串；写入再叠加 `O_NOFOLLOW` |
| SQL 注入 | 每条语句都是模块内字面量，取值全走命名占位符；没有任何函数接受外部 SQL 片段 |
| 恶意文件 | 扩展名白名单；下载一律 `application/octet-stream` + `Content-Disposition: attachment` + `nosniff`，浏览器不会内联执行 |
| 未审核外泄 | 非 `published` 状态对匿名访问一律返回 404，公开列表也不出现 |
| 滥用 | 按 IP 滑动窗口限流（默认 20 次/小时）；整站配额默认 15 GB；单文件默认 2 GB |
| 跨站盗用 | `SITE_ORIGIN` 校验，别站无法把这里当免费网盘 |
| 管理接口 | `X-Admin-Token` 常量时间比对；令牌在 `/etc/myblog-files.env`（权限 600） |
| 进程权限 | 专用系统用户 `myblog-files`；systemd 沙箱 `ProtectSystem=strict` + `ReadWritePaths` 只放开数据目录 |
| 资源耗尽 | 服务只监听回环，公网必须经 nginx；`proxy_request_buffering off` 让大文件直通不落盘 |

### 管理员操作

打开下载页 → 页脚「管理入口」→ 粘贴管理令牌（存本机 localStorage，不会外传）。
待审核面板会列出所有待审文件，可「通过」或「拒绝并删除」。

令牌在服务器上：

```bash
grep '^ADMIN_TOKEN=' /etc/myblog-files.env
```

**请自行保存这份令牌**，`--files` 重复部署不会覆盖已生成的环境变量文件。

### 服务运维

```bash
# 改配置：编辑 /etc/myblog-files.env 后重启
sudo systemctl restart myblog-files

# 看日志
sudo journalctl -u myblog-files -f

# 端到端自检（在服务器上运行）
sudo ADMIN_TOKEN=$(grep '^ADMIN_TOKEN=' /etc/myblog-files.env | cut -d= -f2) \
     python3 /opt/myblog-files/selftest.py http://127.0.0.1

# 查看用量
curl -s http://127.0.0.1/api/stats
```

自检覆盖 18 项：健康检查、上传、审核门槛（未审不可下载、不进公开列表）、
非法扩展名与超限文件拦截、遍历型文件名清洗、审核通过后可见、下载响应头、
Range 断点续传、404、管理接口鉴权。

### 可调项（`/etc/myblog-files.env`）

| 变量 | 默认 | 说明 |
|------|------|------|
| `MAX_FILE_MB` | 2048 | 单文件上限。改大时需同步调大 `deploy/nginx.conf` 的 `client_max_body_size` |
| `MAX_TOTAL_GB` | 15 | 整站配额 |
| `REQUIRE_APPROVAL` | true | 设为 false 则上传即公开，无需审核 |
| `RATE_MAX_UPLOADS` | 20 | 每 IP 每小时上传次数。同一出口 IP 的用户共享额度，NAT 环境下别设太小 |
| `ALLOWED_EXTS` | 见文件 | 允许的扩展名白名单 |
| `CATEGORIES` | 见文件 | 上传时可选的分类 |
| `SITE_ORIGIN` | 站点地址 | 校验上传来源，留空则不校验 |

### 已放行：IP 可直接访问

安全组已放行 80 端口，[http://121.196.246.16/](http://121.196.246.16/) 现在可正常访问，全站页面返回 200。

### 域名访问受备案限制（不是配置问题）

用域名（如 `http://xxx.duckdns.org/`）访问时返回 403，页面是「域名暂时无法访问 / Non-compliance ICP Filing」，
响应头里 `Server: Beaver` —— 这是**阿里云的备案合规拦截网关**，请求根本没到 nginx。

这是政策限制，不是配置能绕过的：

- 未备案域名解析到境内服务器 IP，80/443 的请求会被云厂商强制拦截
- 非标端口（8080/8888 等）实测同样被拦（域名:8080 返回 502），且云平台会周期性全网扫描，
  检测到未备案域名关联后触发封停流程
- 免费动态域名（duckdns 等）无法备案：备案要求提供域名证书、申请人须为域名持有者，
  免费二级域名的用户不持有所有权

**三条可行路线**（都需要人工决定，不是脚本能解决的）：

| 路线 | 成本 | 时间 | 结果 |
|------|------|------|------|
| 用 IP 访问 | 0 | 现在就可用 | URL 是 `http://121.196.246.16/`，无 HTTPS |
| 买域名 + 阿里云 ICP 备案 | 域名约 50 元/年 | 1–3 周 | 域名可用，可签 HTTPS 证书 |
| 域名指向境外托管（GitHub Pages 等） | 0 | 当天 | 域名可用，但内容不在本服务器 |

备案流程：阿里云万网买域名 → 域名实名认证（1–3 天）→ 提交 ICP 备案
（需要备案服务号，ECS 通常要求包年包月且剩余时长 ≥ 3 个月）→ 审核 7–20 工作日。

> ⚠️ 当前 duckdns 域名解析到了本服务器 IP。若长期不备案又保留该解析，可能触发
> 「服务器 IP 关联未备案域名」的封停流程，建议备案或把该解析改指别处。

### 安全组

已放行的规则（入方向）：SSH `22/22`、HTTP `80/80`。要上 HTTPS 再加 `443/443`。

排查端口是否放行：`python deploy/probe.py [域名]`

### 未放行端口时如何预览

用 SSH 隧道把服务器的 80 端口映射到本地，绕开安全组：

```bash
python deploy/tunnel.py 8898   # 然后访问 http://127.0.0.1:8898/
```

## 设计特色

- **深色主题**: 多层叠加的径向渐变背景 + CSS 网格装饰
- **玻璃拟态**: `backdrop-filter: blur()` 毛玻璃卡片 + 光泽扫过动画
- **粒子系统**: Canvas 2D 绘制的动态粒子，粒子间距离连线
- **3D 交互**: 鼠标悬停卡片时的视角倾斜效果
- **滚动动画**: IntersectionObserver 驱动的渐入效果
- **进度条**: 页面顶部阅读进度指示器
- **无障碍**: 支持 `prefers-reduced-motion`、键盘导航、屏幕阅读器

## 内容方向

- 电气自动化 (PLC 编程、工控通讯、SCADA)
- 嵌入式开发 (STM32、ESP32、Arduino、FreeRTOS)
- 硬件设计 (PCB Layout、电路设计、示波器调试)
- 编程工具 (VS Code、Keil/IAR、Git)

## 许可

MIT License
