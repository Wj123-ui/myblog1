---
layout: default
title: 文章归档
permalink: /archive/
---

<div class="archive-page page-container">
  <h2 class="page-title">所有文章</h2>

  <div class="posts-archive">
    {% for post in site.posts %}
      <a href="{{ post.url | relative_url }}" class="archive-post-item">
        <time class="post-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
        <div>
          <span class="archive-post-title">{{ post.title }}</span>
          {% if post.tags %}
            <div class="archive-post-meta">
              {% for tag in post.tags limit:3 %}
                <span class="post-tag">{{ tag }}</span>
              {% endfor %}
            </div>
          {% endif %}
          {% if post.excerpt %}
            <p class="archive-post-excerpt">{{ post.excerpt | strip_html | truncate: 120 }}</p>
          {% endif %}
        </div>
        <span class="archive-post-arrow" aria-hidden="true">→</span>
      </a>
    {% endfor %}
  </div>

  <div class="page-cta-wrapper">
    <a href="{{ '/' | relative_url }}" class="social-btn social-btn--medium">
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M10 3 5 8l5 5"/>
      </svg>
      返回首页
    </a>
  </div>
</div>
