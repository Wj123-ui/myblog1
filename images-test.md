---
layout: default
title: 图片测试页面
permalink: /images-test/
---

<div class="images-test glass-card" style="padding: 40px; max-width: 900px; margin: 0 auto;">
  <h2 style="color: #f0f6fc; text-align: center; margin-bottom: 40px;">🖼️ 图片加载测试</h2>
  
  <p style="color: #a8b3cf; line-height: 1.8; margin-bottom: 30px;">
    此页面用于测试博客中所有图片的加载情况。如果图片无法显示，请检查网络连接或图片路径。
  </p>
  
  <div style="background: rgba(123, 104, 238, 0.1); border-radius: 16px; padding: 24px; margin-bottom: 30px;">
    <h3 style="color: #d4c2ff; margin-bottom: 20px;">🔗 图片URL列表</h3>
    <ul style="color: #a8b3cf; line-height: 2; font-family: 'Fira Code', monospace;">
      <li>头像: <a href="https://api.dicebear.com/7.x/adventurer/svg?seed=Electronics&backgroundColor=ffdfbf&hair=variant08&hairColor=2c1810&accessories=variant01&accessoriesColor=ffdfbf" target="_blank">DiceBear API</a></li>
      <li>Jekyll文章图: <a href="{{ site.baseurl }}/assets/images/jekyll-github.svg" target="_blank">{{ site.baseurl }}/assets/images/jekyll-github.svg</a></li>
      <li>CSS效果图: <a href="{{ site.baseurl }}/assets/images/css-effects.svg" target="_blank">{{ site.baseurl }}/assets/images/css-effects.svg</a></li>
      <li>STM32/PLC图: <a href="{{ site.baseurl }}/assets/images/stm32-plc.svg" target="_blank">{{ site.baseurl }}/assets/images/stm32-plc.svg</a></li>
      <li>Favicon: <a href="{{ site.baseurl }}/favicon.svg" target="_blank">{{ site.baseurl }}/favicon.svg</a></li>
    </ul>
  </div>
  
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-bottom: 40px;">
    <div class="glass-card" style="padding: 20px; text-align: center;">
      <h4 style="color: #f0f6fc; margin-bottom: 15px;">🎭 DiceBear 头像</h4>
      <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Electronics&backgroundColor=ffdfbf&hair=variant08&hairColor=2c1810&accessories=variant01&accessoriesColor=ffdfbf" alt="Avatar" style="width: 150px; height: 150px; border-radius: 50%; border: 4px solid rgba(123, 104, 238, 0.3);">
      <p style="color: #8b949e; margin-top: 10px; font-size: 0.9em;">外部SVG (DiceBear API)</p>
    </div>
    
    <div class="glass-card" style="padding: 20px; text-align: center;">
      <h4 style="color: #f0f6fc; margin-bottom: 15px;">📝 Jekyll文章图</h4>
      <img src="{{ site.baseurl }}/assets/images/jekyll-github.svg" alt="Jekyll GitHub" style="width: 100%; height: 150px; object-fit: contain; border-radius: 12px; border: 2px solid rgba(123, 104, 238, 0.3);">
      <p style="color: #8b949e; margin-top: 10px; font-size: 0.9em;">本地SVG</p>
    </div>
  </div>
  
  <div style="background: rgba(255, 105, 180, 0.1); border-radius: 16px; padding: 24px; margin-top: 30px;">
    <h3 style="color: #ffcce0; margin-bottom: 15px;">💡 故障排除</h3>
    <ul style="color: #a8b3cf; line-height: 1.8;">
      <li>如果图片无法加载，请尝试直接点击上面的URL链接测试</li>
      <li>检查浏览器控制台是否有错误信息 (F12 → Console)</li>
      <li>确保网络连接正常，可以访问GitHub Pages</li>
      <li>清空浏览器缓存并刷新页面 (Ctrl+F5)</li>
      <li>SVG图片可能需要几秒钟时间加载和渲染</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin-top: 40px;">
    <a href="{{ '/' | relative_url }}" class="social-btn" style="padding: 14px 40px;">
      <span style="margin-right: 8px;">🏠</span> 返回首页
    </a>
  </div>
</div>

<style>
.images-test img {
  transition: all 0.3s ease;
}

.images-test img:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(123, 104, 238, 0.4);
}
</style>