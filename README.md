# ⚡ 电气自动化与嵌入式开发博客

基于 **Jekyll + GitHub Pages** 构建的个人技术博客，专注电气自动化、嵌入式系统与硬件设计。

## 🔧 技术栈

- **静态站点**: Jekyll 4.3 + Minima 主题
- **托管**: GitHub Pages
- **样式**: 深色玻璃拟态 · 动漫紫粉配色 · 1381 行手写 CSS 设计系统
- **特效**: Canvas 粒子动画 · 鼠标跟随光效 · 3D 倾斜卡 · 滚动渐入
- **插件**: jekyll-feed · jekyll-seo-tag · jekyll-sitemap

## 📁 目录结构

```
AIxiangmu/
├── _config.yml          # Jekyll 配置文件
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
│   └── images/          # 图片资源
├── index.md             # 首页
├── about.md             # 关于页
├── projects.md          # 项目展示
├── archive.md           # 文章归档
└── 404.md               # 404 错误页
```

## 🚀 本地运行

```bash
# 安装依赖
bundle install

# 启动开发服务器
bundle exec jekyll serve

# 访问 http://localhost:4000/myblog1
```

## 🎨 设计特色

- **深色主题**: 多层叠加的径向渐变背景 + CSS 网格装饰
- **玻璃拟态**: `backdrop-filter: blur()` 毛玻璃卡片 + 光泽扫过动画
- **粒子系统**: Canvas 2D 绘制的动态粒子，粒子间距离连线
- **3D 交互**: 鼠标悬停卡片时的视角倾斜效果
- **滚动动画**: IntersectionObserver 驱动的渐入效果
- **进度条**: 页面顶部阅读进度指示器
- **无障碍**: 支持 `prefers-reduced-motion`、键盘导航、屏幕阅读器

## 📝 内容方向

- 电气自动化 (PLC 编程、工控通讯、SCADA)
- 嵌入式开发 (STM32、ESP32、Arduino、FreeRTOS)
- 硬件设计 (PCB Layout、电路设计、示波器调试)
- 编程工具 (VS Code、Keil/IAR、Git)

## 📄 许可

MIT License
