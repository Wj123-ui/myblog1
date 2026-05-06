---
layout: default
title: 文章归档
permalink: /archive/
---

<div class="archive-page page-container glass-card">
  <h2 class="page-title">📚 所有文章</h2>

  <div class="posts-archive">
    {% for post in site.posts %}
      <a href="{{ post.url | relative_url }}" class="archive-post-item glass-card">
        <div class="archive-post-item-header">
          <div>
            <span class="archive-post-title">{{ post.title }}</span>
            <div class="archive-post-meta">
              <span class="post-date">
                {{ post.date | date: "%Y-%m-%d" }}
              </span>
              {% if post.tags %}
                {% for tag in post.tags limit:3 %}
                  <span class="post-tag">
                    {{ tag }}
                  </span>
                {% endfor %}
              {% endif %}
            </div>
          </div>
          <span class="archive-post-arrow" aria-hidden="true">→</span>
        </div>
        {% if post.excerpt %}
          <p class="archive-post-excerpt">{{ post.excerpt | strip_html | truncate: 120 }}</p>
        {% endif %}
      </a>
    {% endfor %}
  </div>

  <div style="text-align: center; margin-top: 50px;">
    <a href="{{ '/' | relative_url }}" class="social-btn" style="padding: 14px 40px;">
      <span aria-hidden="true" style="margin-right: 8px;">🏠</span> 返回首页
    </a>
  </div>
</div>