(function() {
  var canvas = document.getElementById('particles-canvas');
  if (!canvas) { console.error('Canvas not found'); return; }
  
  var ctx = canvas.getContext('2d');
  var W, H, time = 0;
  
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resize);
  resize();
  
  // 创建明显的测试效果
  var stars = [];
  for (var i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.1,
      hue: Math.random() * 60 + 20
    });
  }
  
  // 星云数据
  var nebulae = [
    { x: W * 0.3, y: H * 0.4, r: 300, hue: 220, a: 0.15 },
    { x: W * 0.7, y: H * 0.6, r: 250, hue: 330, a: 0.12 },
    { x: W * 0.5, y: H * 0.3, r: 200, hue: 170, a: 0.1 }
  ];
  
  function animate(ts) {
    time = ts || 0;
    ctx.clearRect(0, 0, W, H);
    
    // 黑色背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    
    // 绘制星云
    for (var n = 0; n < nebulae.length; n++) {
      var nb = nebulae[n];
      var nx = nb.x + Math.sin(time * 0.0005 + n) * 50;
      var ny = nb.y + Math.cos(time * 0.0003 + n) * 30;
      
      var grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nb.r);
      grad.addColorStop(0, 'hsla(' + (nb.hue + Math.sin(time * 0.001) * 20) + ',70%,50%,' + nb.a + ')');
      grad.addColorStop(0.5, 'hsla(' + nb.hue + ',60%,40%,' + (nb.a * 0.5) + ')');
      grad.addColorStop(1, 'hsla(' + nb.hue + ',50%,30%,0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(nx, ny, nb.r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制星星
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.y -= s.speed;
      if (s.y < -10) { s.y = H + 10; s.x = Math.random() * W; }
      
      var alpha = 0.5 + Math.sin(time * 0.003 + i) * 0.5;
      ctx.fillStyle = 'hsla(' + s.hue + ',80%,80%,' + alpha + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      
      // 大星星加光晕
      if (s.size > 2) {
        var glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 4);
        glow.addColorStop(0, 'hsla(' + s.hue + ',80%,80%,0.3)');
        glow.addColorStop(1, 'hsla(' + s.hue + ',80%,80%,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 流星
    if (Math.random() < 0.01) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      var sx = Math.random() * W;
      var sy = Math.random() * H * 0.5;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 100, sy + 100);
      ctx.stroke();
    }
    
    requestAnimationFrame(animate);
  }
  
  animate();
})();
