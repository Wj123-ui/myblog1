---
layout: default
title: 文章归档
permalink: /archive/
---

<div class="archive-page glass-card" style="padding: 40px; max-width: 900px; margin: 0 auto;">
  <h2 style="color: #f0f6fc; text-align: center; margin-bottom: 40px;">📚 所有文章</h2>
  
  <div class="posts-archive">
    {% for post in site.posts %}
      <a href="{{ post.url | relative_url }}" class="archive-post-item glass-card" style="display: block; padding: 24px; margin-bottom: 20px; text-decoration: none; transition: all 0.3s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="color: #f0f6fc; font-weight: 700; font-size: 1.2em;">{{ post.title }}</span>
            <div style="margin-top: 8px;">
              <span style="color: #8b949e; font-size: 0.9em; background: rgba(123, 104, 238, 0.1); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(123, 104, 238, 0.2);">
                {{ post.date | date: "%Y-%m-%d" }}
              </span>
              {% if post.tags %}
                {% for tag in post.tags limit:3 %}
                  <span style="color: #ffcce0; font-size: 0.85em; background: rgba(255, 105, 180, 0.15); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255, 105, 180, 0.3); margin-left: 8px;">
                    {{ tag }}
                  </span>
                {% endfor %}
              {% endif %}
            </div>
          </div>
          <span style="color: rgba(123, 104, 238, 0.8); font-size: 1.4em;">→</span>
        </div>
        {% if post.excerpt %}
          <p style="color: #a8b3cf; margin-top: 16px; line-height: 1.6;">{{ post.excerpt | strip_html | truncate: 120 }}</p>
        {% endif %}
      </a>
    {% endfor %}
  </div>
  
  <div style="text-align: center; margin-top: 50px;">
    <a href="{{ '/' | relative_url }}" class="social-btn" style="padding: 14px 40px;">
      <span style="margin-right: 8px;">🏠</span> 返回首页
    </a>
  </div>
</div>

<style>
.archive-post-item:hover {
  transform: translateX(10px);
  border-color: rgba(123, 104, 238, 0.5);
  box-shadow: 0 12px 36px rgba(123, 104, 238, 0.25);
}
</style>