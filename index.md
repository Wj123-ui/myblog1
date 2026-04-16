---
layout: home
---

<div align="center">

# 🤖 AI 项目博客

**记录 AI 学习之旅 · 分享技术实践 · 沉淀项目经验**

</div>

---

## 关于本站

欢迎来到我的个人技术博客！这里主要分享：

- 🧠 **AI 学习笔记** — 深度学习、机器学习、大模型等理论知识整理
- 🛠️ **项目实践** — 从想法到落地的完整项目记录
- 💡 **技术分享** — 工具使用、最佳实践与踩坑总结

## 最新文章

{% for post in site.posts limit:5 %}
- **{{ post.date | date: "%Y-%m-%d" }}** — [{{ post.title }}]({{ post.url | relative_url }})
{% endfor %}

---

<div align="center">
  <p>📬 欢迎交流讨论，一起探索 AI 的无限可能！</p>
</div>
