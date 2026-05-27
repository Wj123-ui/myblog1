// 调试版本 - 检查canvas是否工作
(function() {
  console.log('JS开始执行');
  
  var canvas = document.getElementById('particles-canvas');
  if (!canvas) {
    console.error('找不到canvas元素');
    return;
  }
  console.log('找到canvas:', canvas);
  
  var ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('无法获取2d上下文');
    return;
  }
  console.log('获取到ctx:', ctx);
  
  // 设置canvas尺寸
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  console.log('Canvas尺寸:', canvas.width, canvas.height);
  
  // 立即绘制一个红色矩形测试
  ctx.fillStyle = 'red';
  ctx.fillRect(100, 100, 200, 200);
  console.log('绘制了红色矩形');
  
  // 绘制蓝色圆形
  ctx.fillStyle = 'blue';
  ctx.beginPath();
  ctx.arc(300, 300, 50, 0, Math.PI * 2);
  ctx.fill();
  console.log('绘制了蓝色圆形');
  
  // 绘制渐变星云测试
  var grad = ctx.createRadialGradient(400, 400, 0, 400, 400, 200);
  grad.addColorStop(0, 'rgba(100, 50, 200, 0.8)');
  grad.addColorStop(0.5, 'rgba(50, 100, 200, 0.5)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(200, 200, 400, 400);
  console.log('绘制了渐变星云');
  
  // 简单动画测试
  var x = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 黑色背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 移动的方块
    ctx.fillStyle = 'lime';
    ctx.fillRect(x, 200, 100, 100);
    x += 2;
    if (x > canvas.width) x = -100;
    
    // 星云
    var grad = ctx.createRadialGradient(400, 300, 0, 400, 300, 250);
    grad.addColorStop(0, 'rgba(200, 50, 100, 0.5)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(150, 50, 500, 500);
    
    requestAnimationFrame(animate);
  }
  animate();
  console.log('动画已启动');
  
  // 监听窗口大小变化
  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log('Canvas尺寸已更新');
  });
})();
