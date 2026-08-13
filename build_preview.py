#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
最小 Jekyll 构建脚本：把 .md 源渲染成 _site 静态站点，用于本地预览。
本地预览时忽略 baseurl，链接使用相对路径，file:// 或 http://localhost 均可浏览。
用法：python build_preview.py   （产物在 _site/ 目录）
"""
import re, os, io, datetime, html as HTML

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.path.join(ROOT, '_site')

# ---------------- site 配置（本地预览用，baseurl 留空） ----------------
SITE = {
    'title': '电气自动化与嵌入式开发',
    'email': '2594538837@qq.com',
    'github_username': 'Wj123-ui',
    'baseurl': '',
    'url': '',
    'lang': 'zh-CN',
    'time': datetime.datetime.now(),
    'posts': [],
}

# ---------------- 工具函数 ----------------

def read(path):
    with io.open(path, encoding='utf-8') as f:
        return f.read()

def write(path, text):
    d = os.path.dirname(path)
    if not os.path.isdir(d):
        os.makedirs(d)
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)

def split_frontmatter(text):
    """返回 (meta_dict, body)。meta 为空 dict 表示无 front matter。"""
    if text.startswith('---'):
        end = text.find('\n---', 3)
        if end != -1:
            import yaml
            meta = yaml.safe_load(text[4:end]) or {}
            return meta, text[end+4:].lstrip('\n')
    return {}, text

def local_path(p):
    """relative_url 的本地实现：输出根绝对路径（/xxx.html），任意深度页面都可点击。
    local_path('/archive') -> '/archive.html'，local_path('/assets/x.css') -> '/assets/x.css'。"""
    p = (p or '').strip()
    if p == '/':
        return '/index.html'
    p = p.lstrip('/').rstrip('/')
    if p in ('archive', 'projects', 'about', 'images-test'):
        return '/' + p + '.html'
    if p.endswith('.html'):
        return '/' + p
    return '/' + p

# ---------------- Liquid 渲染 ----------------

def resolve(expr, ctx):
    expr = expr.strip()
    if expr.startswith("'") or expr.startswith('"'):
        return expr[1:-1]
    parts = expr.split('.')
    cur = ctx
    for p in parts:
        if isinstance(cur, dict):
            cur = cur.get(p, None)
        else:
            return None
    return cur

def apply_filter(val, filt):
    filt = filt.strip()
    if filt == 'relative_url':
        return local_path(val)
    if filt.startswith('prepend:'):
        return filt.split(':', 1)[1].strip().strip("'").strip('"') + str(val)
    if filt.startswith('default:'):
        d = filt.split(':', 1)[1].strip().strip("'").strip('"')
        return val if val else d
    if filt.startswith('date:'):
        fmt = filt.split(':', 1)[1].strip().strip("'").strip('"')
        if isinstance(val, (datetime.datetime, datetime.date)):
            return val.strftime(fmt)
        return str(val)
    if filt == 'date_to_xmlschema':
        if isinstance(val, datetime.datetime):
            return val.isoformat()
        return str(val)
    if filt == 'strip_html':
        return re.sub(r'<[^>]+>', '', str(val))
    if filt.startswith('truncate:'):
        n = int(filt.split(':', 1)[1].strip())
        s = str(val)
        return s if len(s) <= n else s[:n].rstrip() + '…'
    return val

def eval_var(expr, ctx):
    parts = [p.strip() for p in expr.split('|')]
    val = resolve(parts[0], ctx)
    for f in parts[1:]:
        val = apply_filter(val, f)
    return val

def render_vars(text, ctx):
    return re.sub(r'\{\{\s*(.*?)\s*\}\}', lambda m: str(eval_var(m.group(1), ctx)), text)

def eval_cond(cond, ctx):
    cond = cond.strip()
    if ' or ' in cond:
        return any(eval_cond(c, ctx) for c in cond.split(' or '))
    if ' and ' in cond:
        return all(eval_cond(c, ctx) for c in cond.split(' and '))
    m = re.match(r"^(.+?)\s*(==|!=|contains)\s*(.+)$", cond)
    if m:
        left, op, right = m.group(1).strip(), m.group(2), m.group(3).strip()
        lv = resolve(left, ctx)
        rv = right[1:-1] if right.startswith("'") else right
        if op == '==':
            return str(lv) == str(rv)
        if op == '!=':
            return str(lv) != str(rv)
        if op == 'contains':
            return rv in str(lv)
    m = re.match(r'^(\S+?)\.size\s*(>|>=|==)\s*(\d+)$', cond)
    if m:
        lv = resolve(m.group(1), ctx)
        n = int(m.group(3))
        if lv is None:
            return False
        if m.group(2) == '>':
            return len(lv) > n
        if m.group(2) == '>=':
            return len(lv) >= n
        return len(lv) == n
    # 存在性判断
    return bool(resolve(cond, ctx))

def render_ifs(text, ctx):
    # 先处理带 else 的
    def repl_else(m):
        cond, a, b = m.group(1), m.group(2), m.group(3)
        return a if eval_cond(cond, ctx) else b
    text = re.sub(r'\{%\s*if\s+(.+?)\s*%\}(.*?)\{%\s*else\s*%\}(.*?)\{%\s*endif\s*%\}',
                  repl_else, text, flags=re.DOTALL)
    def repl(m):
        cond, a = m.group(1), m.group(2)
        return a if eval_cond(cond, ctx) else ''
    text = re.sub(r'\{%\s*if\s+(.+?)\s*%\}(.*?)\{%\s*endif\s*%\}',
                  repl, text, flags=re.DOTALL)
    return text

def render_fors(text, ctx):
    # 先匹配最内层 for（body 不含嵌套 {% for %}），处理后再向外层推进
    pattern = re.compile(
        r'\{%\s*for\s+(\w+)\s+in\s+([\w.]+)(?:\s+limit:\s*(\d+))?\s*%\}'
        r'((?:(?!\{%\s*for\b).)*?)'
        r'\{%\s*endfor\s*%\}',
        re.DOTALL)
    while True:
        m = pattern.search(text)
        if not m:
            break
        var, coll_expr, limit, body = m.group(1), m.group(2), m.group(3), m.group(4)
        items = resolve(coll_expr, ctx) or []
        if limit:
            items = items[:int(limit)]
        rendered = []
        for item in items:
            c2 = dict(ctx)
            c2[var] = item
            rendered.append(render_liquid(body, c2))
        text = text[:m.start()] + ''.join(rendered) + text[m.end():]
    return text

def render_includes(text, ctx):
    def repl(m):
        name = m.group(1)
        path = os.path.join(ROOT, '_includes', name)
        if os.path.isfile(path):
            return render_liquid(read(path), ctx)
        return ''
    return re.sub(r'\{%\s*include\s+([\w.-]+)\s*%\}', repl, text)

def render_liquid(text, ctx):
    text = render_includes(text, ctx)
    text = text.replace('{% seo %}', '').replace('{% feed_meta %}', '')
    text = render_fors(text, ctx)
    text = render_ifs(text, ctx)
    text = render_vars(text, ctx)
    return text

# ---------------- Markdown 渲染（文章正文用） ----------------

def _inline(t):
    # 行内代码（先保护，避免被后续替换）
    codes = []
    def stash_code(m):
        codes.append(m.group(1))
        return '\x00C%d\x00' % (len(codes) - 1)
    t = re.sub(r'`([^`]+)`', stash_code, t)
    # 图片
    t = re.sub(r'!\[([^\]]*)\]\(([^)\s]+)\)', r'<img src="\2" alt="\1">', t)
    # 链接
    t = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', r'<a href="\2">\1</a>', t)
    # 粗体 / 斜体
    t = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', t)
    # 还原行内代码
    def code_repl(m):
        i = int(m.group(1))
        return '<code>' + HTML.escape(codes[i]) + '</code>'
    t = re.sub(r'\x00C(\d+)\x00', code_repl, t)
    return t

def _parse_row(line):
    s = line.strip()
    if s.startswith('|'):
        s = s[1:]
    if s.endswith('|'):
        s = s[:-1]
    return [c.strip() for c in s.split('|')]

def markdown_to_html(md):
    # 围栏代码块先提取保护
    code_blocks = []
    def stash(m):
        lang = (m.group(1) or '').strip()
        code_blocks.append(HTML.escape(m.group(2)))
        return '\x00BLOCK%d\x00' % (len(code_blocks) - 1)
    md = re.sub(r'```([^\n]*)\n(.*?)```', stash, md, flags=re.DOTALL)

    lines = md.split('\n')
    out = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        # 表格
        if stripped.startswith('|') and i + 1 < n and re.match(r'^\|[\s:|-]+\|\s*$', lines[i+1]):
            header = _parse_row(line)
            i += 2
            rows = []
            while i < n and lines[i].strip().startswith('|'):
                rows.append(_parse_row(lines[i]))
                i += 1
            h = '<thead><tr>' + ''.join('<th>%s</th>' % HTML.escape(c) for c in header) + '</tr></thead>'
            b = '<tbody>' + ''.join(
                '<tr>' + ''.join('<td>%s</td>' % HTML.escape(c) for c in r) + '</tr>' for r in rows
            ) + '</tbody>'
            out.append('<table>' + h + b + '</table>')
            continue

        # 标题
        m = re.match(r'^(#{1,6})\s+(.*)$', line)
        if m:
            lvl = len(m.group(1))
            out.append('<h%d>%s</h%d>' % (lvl, _inline(m.group(2)), lvl))
            i += 1
            continue

        # 分隔线
        if re.match(r'^\s*(-{3,}|\*{3,})\s*$', line):
            out.append('<hr>')
            i += 1
            continue

        # 引用
        if stripped.startswith('>'):
            buf = []
            while i < n and lines[i].strip().startswith('>'):
                buf.append(lines[i].strip()[1:].strip())
                i += 1
            out.append('<blockquote>' + _inline(' '.join(buf)) + '</blockquote>')
            continue

        # 列表
        if re.match(r'^\s*[-*+]\s+', line):
            buf = []
            while i < n and re.match(r'^\s*[-*+]\s+', lines[i]):
                buf.append('<li>' + _inline(re.sub(r'^\s*[-*+]\s+', '', lines[i])) + '</li>')
                i += 1
            out.append('<ul>' + ''.join(buf) + '</ul>')
            continue
        if re.match(r'^\s*\d+\.\s+', line):
            buf = []
            while i < n and re.match(r'^\s*\d+\.\s+', lines[i]):
                buf.append('<li>' + _inline(re.sub(r'^\s*\d+\.\s+', '', lines[i])) + '</li>')
                i += 1
            out.append('<ol>' + ''.join(buf) + '</ol>')
            continue

        # 段落（收集连续非空行）
        buf = [line.strip()]
        i += 1
        while i < n and lines[i].strip() and not re.match(r'^\s*(#{1,6}\s|\||\s*[-*+]\s|\s*\d+\.\s|>|```)', lines[i]):
            buf.append(lines[i].strip())
            i += 1
        out.append('<p>' + _inline(' '.join(buf)) + '</p>')

    html = '\n'.join(out)

    def unblock(m):
        i = int(m.group(1))
        return '<pre><code>' + code_blocks[i] + '</code></pre>'
    html = re.sub(r'\x00BLOCK(\d+)\x00', unblock, html)
    return html

# ---------------- 页面生成 ----------------

def load_posts():
    posts = []
    for f in sorted(os.listdir(os.path.join(ROOT, '_posts'))):
        if not f.endswith('.md'):
            continue
        meta, body = split_frontmatter(read(os.path.join(ROOT, '_posts', f)))
        slug = re.sub(r'^\d{4}-\d{2}-\d{2}-', '', f[:-3])
        date = meta.get('date')
        if isinstance(date, str):
            date = datetime.datetime.strptime(date[:19], '%Y-%m-%d %H:%M:%S')
        excerpt = meta.get('excerpt') or ''
        posts.append({
            'title': meta.get('title', ''),
            'date': date,
            'categories': meta.get('categories', []),
            'tags': meta.get('tags', []),
            'excerpt': excerpt,
            'slug': slug,
            'url': 'posts/%s.html' % slug,
            'body': body,
        })
    posts.sort(key=lambda p: p['date'] or datetime.datetime.min, reverse=True)
    return posts

def page_context(url, title='', meta=None):
    meta = meta or {}
    return {
        'url': url,
        'title': title,
        'date': meta.get('date'),
        'author': meta.get('author'),
        'categories': meta.get('categories', []),
        'tags': meta.get('tags', []),
    }

def apply_layout(layout_name, content, page_meta):
    """套用布局，支持 front matter 里的 layout: 父布局 递归继承。"""
    path = os.path.join(ROOT, '_layouts', layout_name + '.html')
    if not os.path.isfile(path):
        return content
    meta, body = split_frontmatter(read(path))
    ctx = {'site': SITE, 'page': page_meta, 'content': content}
    result = render_liquid(body, ctx)
    parent = meta.get('layout')
    if parent and parent != layout_name:
        result = apply_layout(parent, result, page_meta)
    return result

def render_page(page_meta, body_html):
    """用 default 布局包裹。"""
    return apply_layout('default', body_html, page_meta)

def render_post_page(post_meta, body_html):
    """用 post 布局包裹（post.html 的 front matter 会继续继承 default）。"""
    return apply_layout('post', body_html, post_meta)

def build():
    SITE['posts'] = load_posts()

    # 静态资源
    for src, dst in [
        ('assets/css/custom.css', 'assets/css/custom.css'),
        ('assets/js/main.js', 'assets/js/main.js'),
        ('favicon.svg', 'favicon.svg'),
    ]:
        write(os.path.join(SITE_DIR, dst), read(os.path.join(ROOT, src)))

    # assets/images/ 整目录复制
    img_src = os.path.join(ROOT, 'assets', 'images')
    if os.path.isdir(img_src):
        for f in os.listdir(img_src):
            s = os.path.join(img_src, f)
            if os.path.isfile(s):
                with io.open(s, 'rb') as fh:
                    data = fh.read()
                d = os.path.join(SITE_DIR, 'assets', 'images')
                if not os.path.isdir(d):
                    os.makedirs(d)
                with io.open(os.path.join(d, f), 'wb') as fh:
                    fh.write(data)

    # ---- 首页 ----
    meta, body = split_frontmatter(read(os.path.join(ROOT, 'index.md')))
    pm = page_context('/', meta.get('title', ''))
    ctx = {'site': SITE, 'page': pm}
    body_html = render_liquid(body, ctx)
    write(os.path.join(SITE_DIR, 'index.html'), render_page(pm, body_html))

    # ---- 归档 / 项目 / 关于 / 404 / 图片测试 ----
    for name, fname in [
        ('archive', 'archive.md'), ('projects', 'projects.md'),
        ('about', 'about.md'), ('images-test', 'images-test.md'),
    ]:
        m2, b2 = split_frontmatter(read(os.path.join(ROOT, fname)))
        url = '/%s/' % name
        pm2 = page_context(url, m2.get('title', ''))
        ctx2 = {'site': SITE, 'page': pm2}
        b2_html = render_liquid(b2, ctx2)
        write(os.path.join(SITE_DIR, name + '.html'), render_page(pm2, b2_html))

    # ---- 404 ----
    m3, b3 = split_frontmatter(read(os.path.join(ROOT, '404.md')))
    pm3 = page_context('/404.html', m3.get('title', ''))
    b3_html = render_liquid(b3, {'site': SITE, 'page': pm3})
    write(os.path.join(SITE_DIR, '404.html'), render_page(pm3, b3_html))

    # ---- 文章页 ----
    for p in SITE['posts']:
        body_md = render_vars(p['body'], {'site': SITE, 'post': p})
        body_html = markdown_to_html(body_md)
        pmeta = page_context('posts/%s.html' % p['slug'], p['title'], p)
        write(os.path.join(SITE_DIR, 'posts', p['slug'] + '.html'),
              render_post_page(pmeta, body_html))

    print('构建完成：', SITE_DIR)

if __name__ == '__main__':
    build()
