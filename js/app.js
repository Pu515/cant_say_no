(() => {
  // ===== 工具 =====
  const $ = (id) => document.getElementById(id);
  const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);

  // ===== 元素引用 =====
  const yes1 = $('yes1');
  const no1  = $('no1');
  const loveBtn = $('loveBtn');
  const noBtn   = $('noBtn');
  const btns    = $('btns');

  const loveScreen = $('loveScreen'); // 第3页（全屏）
  const floaters   = $('floaters');   // 第3页心心雨
  const fireworks  = $('fireworks');  // 第4页烟花
  const floatHearts= $('floatHearts');// 第4页漂浮心
  const photos     = $('photos');     // 第4页动态照片

  // ===== 状态 =====
  let yes1Scale = 1;
  let noBtnScale = 1;
  let fwTimer = null, floatHeartTimer = null, photoTimer = null;

    // —— 布局控制：更均匀、更少重叠 —— //
  const SAFE_MARGIN_VW = 3;           // 左右安全边距（防止出框）
  const GRID_COLS = 6;                // 横向网格列数（越大越均匀）
  const GRID_ROWS = 3;                // 纵向网格行数（用于下半屏分区）
  const GRID_TOP_VH = 52;             // 网格顶部（vh）
  const GRID_BOTTOM_VH = 92;          // 网格底部（vh）
  const CELL_BUSY_MS = 2800;          // 网格单元占用时间（控制“不要立刻挤在一起”）
  const RECENT_TTL = 3800;            // 近邻碰撞检测保留时间

  // 网格占位 & 最近位置（简单防碰撞）
  const gridBusyUntil = new Array(GRID_COLS * GRID_ROWS).fill(0);
  const recentRects = []; // {x, y, w, h, t}

  // 小工具
  const vw2px = (v) => window.innerWidth  * (v/100);
  const vh2px = (v) => window.innerHeight * (v/100);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const cellIndex = (c, r) => r * GRID_COLS + c;

  // 选一个“优先空闲”的单元格
  function pickCell() {
    const now = Date.now();
    const all = [];
    for (let r=0; r<GRID_ROWS; r++){
      for (let c=0; c<GRID_COLS; c++){
        const busy = gridBusyUntil[cellIndex(c,r)] > now;
        all.push({c, r, busy});
      }
    }
    const free = all.filter(x => !x.busy);
    const list = free.length ? free : all;
    return list[Math.floor(Math.random() * list.length)];
  }

  // 记录最近的摆放矩形，用于简单“防重叠”
  function pushRecent(x, y, w, h){
    const now = Date.now();
    recentRects.push({ x, y, w, h, t: now + RECENT_TTL });
    // 清理过期
    for (let i=recentRects.length-1; i>=0; i--){
      if (recentRects[i].t < now) recentRects.splice(i,1);
    }
  }

  // 与最近矩形做快速“重叠/太近”检测
  function tooClose(x, y, w, h){
    const cx = x + w/2, cy = y + h/2;
    for (const r of recentRects){
      if (r.t < Date.now()) continue;
      const rx = r.x + r.w/2, ry = r.y + r.h/2;
      const dx = Math.abs(cx - rx);
      const dy = Math.abs(cy - ry);
      const minDx = (w + r.w) * 0.55; // 中心距离阈值（横向）
      const minDy = (h + r.h) * 0.55; // 中心距离阈值（纵向）
      if (dx < minDx && dy < minDy) return true;
    }
    return false;
  }

  // ===== 页面切换 =====
  function showPage(n){
    document.querySelectorAll('section').forEach(sec=>sec.classList.remove('active'));
    const target = $('page'+n);
    if (target) target.classList.add('active');

    if(n === 4){
      startFireworks();
      startFloatHearts();
      startPhotos();
    } else {
      stopFireworks();
      stopFloatHearts();
      stopPhotos();
    }
  }

  /* =========================
   * 第1页：愿意 全屏乱跑 + 变小
   * ========================= */
  function moveYes1Random(e){
    // 全屏范围（viewport），按钮使用 fixed 定位
    const maxX = window.innerWidth  - yes1.offsetWidth;
    const maxY = window.innerHeight - yes1.offsetHeight;

    yes1.style.position = 'fixed';
    yes1.style.left = Math.max(0, Math.random()*maxX) + 'px';
    yes1.style.top  = Math.max(0, Math.random()*maxY) + 'px';

    if (e.type === 'click' || e.type === 'pointerdown'){
      yes1Scale *= 0.85;
      yes1.style.transform = `scale(${yes1Scale})`;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
  }
  yes1.addEventListener('mouseover', moveYes1Random);
  yes1.addEventListener('pointerdown', moveYes1Random, {passive:false});
  yes1.addEventListener('click', moveYes1Random);

  no1.addEventListener('click', ()=> showPage(2));

    /* =========================
  * 第2页：不爱 交换位置 + 变小；爱 → 爱心屏
  * ========================= */

  // —— 新增：短暂屏蔽全局点击，防止换位后的抬手点到别的元素 —— //
  let suppressNavUntil = 0;
  function guardNav(ms = 400){ suppressNavUntil = Date.now() + ms; }

  // 捕获阶段全局 click 守卫（优先于目标监听器执行）
  document.addEventListener('click', (e) => {
    if (Date.now() < suppressNavUntil) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true); // capture = true

  let lastSwapTs = 0; // 防抖，避免 mouseenter 后紧跟 pointerdown/click 连续触发两次

  function swapNo(e){
    const now = Date.now();
    if (now - lastSwapTs < 150) {
      e.preventDefault?.();
      e.stopImmediatePropagation?.();
      return;
    }
    lastSwapTs = now;

    // 先开保护：接下来 400ms 内任何 click 都被全局守卫吃掉
    guardNav(600);

    // 交换 loveBtn 和 noBtn 的位置
    if (loveBtn.nextElementSibling === noBtn) {
      btns.insertBefore(noBtn, loveBtn);
    } else {
      btns.insertBefore(loveBtn, noBtn);
    }

    // 缩小
    noBtnScale *= 0.8;
    noBtn.style.transform = `scale(${noBtnScale})`;

    // 尝试把后续事件“绑”在 noBtn 上，避免目标漂移
    if (e.pointerId && noBtn.setPointerCapture) {
      try { noBtn.setPointerCapture(e.pointerId); } catch {}
    }

    if (navigator.vibrate) navigator.vibrate(8);

    e.preventDefault?.();
    e.stopImmediatePropagation?.();
  }

  // PC：鼠标移入触发交换+缩小
  noBtn.addEventListener('mouseenter', swapNo);

  // 主事件：pointerdown（手机/PC都走这条）
  noBtn.addEventListener('pointerdown', (e) => {
    // 先阻止默认，再执行交换
    e.preventDefault();
    e.stopImmediatePropagation();
    swapNo(e);
  }, { passive: false });

  // 兜底：click 仅拦截，不再重复交换（避免双触发）
  noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
  });

  // “爱 ❤️” 按钮：进入爱心屏（同时受 suppressNavUntil 保护）
  loveBtn.addEventListener('click', (e) => {
    if (Date.now() < suppressNavUntil) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    loveScreen.style.display = 'grid';
    loveScreen.setAttribute('aria-hidden','false');
    sprayHearts();
  });

  /* =========================
   * 第3页：爱心特效（点击任意处 → 第4页）
   * ========================= */
  loveScreen.addEventListener('click', () => {
    loveScreen.style.display = 'none';
    loveScreen.setAttribute('aria-hidden','true');
    floaters.innerHTML = '';
    showPage(4);
  });

  // 第3页：心心雨
  function sprayHearts(){
    floaters.innerHTML = '';
    const colors = ['#ffd6e7','#ffafc8','#ff7da3','#ff5b7c','#ef3b5d'];
    for(let i=0;i<36;i++){
      const s = document.createElement('div');
      s.className = 'floater';
      s.textContent = '❤';
      s.style.left = rand(0, 100) + 'vw';
      s.style.bottom = rand(-10, 10) + 'vh';
      s.style.animationDelay = (Math.random()*1.2).toFixed(2) + 's';
      s.style.fontSize = rand(12, 28) + 'px';
      s.style.color = colors[rand(0, colors.length)];
      floaters.appendChild(s);
    }
  }

  /* =========================
   * 第4页：烟花 + 背景漂浮小心心 + 随机照片（动态）
   * ========================= */
  function startFireworks(){ stopFireworks(); fwTimer = setInterval(()=>launchFirework(), 1000); }
  function stopFireworks(){ if(fwTimer){ clearInterval(fwTimer); fwTimer=null; } }

  function launchFirework(){
    const startX = Math.random()*window.innerWidth;
    const startY = window.innerHeight + 10;
    const targetY = window.innerHeight*(0.3 + Math.random()*0.4);
    const riseDuration = 900 + Math.random()*300;

    const rocket = document.createElement('div');
    rocket.className = 'particle'; rocket.style.background = '#fff';
    rocket.style.left = startX + 'px'; rocket.style.top = startY + 'px';
    fireworks.appendChild(rocket);

    rocket.animate([
      { transform:'translate(0,0)', opacity:1 },
      { transform:`translate(0,${targetY-startY}px)`, opacity:1 }
    ], { duration: riseDuration, easing:'ease-out', fill:'forwards' });

    setTimeout(()=>{ rocket.remove(); explode(startX, targetY); }, riseDuration);
  }

  function explode(x, y){
    const colors = ['#ff4d4d','#ffd633','#66ff66','#66ccff','#cc99ff','#ff66cc','#ff9933'];
    const count = 60;
    for(let i=0;i<count;i++){
      const el = document.createElement('div');
      el.className = 'particle';
      const s = 6 + Math.random()*6; el.style.width = el.style.height = s + 'px';
      el.style.background = colors[Math.floor(Math.random()*colors.length)];
      el.style.left = x + 'px'; el.style.top = y + 'px';
      fireworks.appendChild(el);

      const angle = Math.random()*Math.PI*2; const r = 140 + Math.random()*120;
      const dx = Math.cos(angle)*r; const dy = Math.sin(angle)*r; const dur = 1200 + Math.random()*800;

      el.animate([
        { transform:'translate(0,0)', opacity:1 },
        { transform:`translate(${dx}px,${dy}px)`, opacity:0 }
      ], { duration: dur, easing:'ease-out', fill:'forwards' });

      setTimeout(()=>el.remove(), dur+120);
    }
  }

  // 背景漂浮小心心
  function startFloatHearts(){ stopFloatHearts(); floatHeartTimer = setInterval(spawnFloatHeart, 800); }
  function stopFloatHearts(){ if(floatHeartTimer){ clearInterval(floatHeartTimer); floatHeartTimer=null; } }
  function spawnFloatHeart(){
    const colors = ['#ffd6e7','#ffafc8','#ff7da3','#ff5b7c','#ef3b5d'];
    const h = document.createElement('div');
    h.textContent = '❤';
    h.style.position='absolute';
    h.style.left = rand(0, 100) + 'vw';
    h.style.bottom = '-10vh';
    h.style.fontSize = (12 + Math.random()*16) + 'px';
    h.style.color = colors[rand(0, colors.length)];
    h.style.opacity = 0;
    floatHearts.appendChild(h);

    const xShift = (Math.random() * 80 - 40) + 'px';
    const dur = 6000 + Math.random()*4000;
    h.animate(
      [ { transform:'translate(0,0)', opacity:0 },
        { transform:`translate(${xShift}, -80vh)`, opacity:1 } ],
      { duration: dur, easing:'linear', fill:'forwards' }
    );
    setTimeout(()=>h.remove(), dur+50);
  }

  /* =========================
   * 照片：路径/清单/预加载 + 连发
   * ========================= */
  const PHOTO_BASE = './image/';
  const photoList = [
  // ===== 你之前已有的 =====
  "IMG_0331.jpg","IMG_0624.jpg","IMG_0112.jpg","IMG_1624.JPG","IMG_1708.JPG","IMG_1873.JPG",
  "IMG_2013.JPG","IMG_2015.JPG","IMG_2019.JPG","IMG_2184.jpg","IMG_2186.JPG","IMG_2027.JPG",
  "IMG_2198.JPG","IMG_3932.JPG","IMG_3984.JPG","IMG_3994.JPG","IMG_9322.JPG","Live.JPG",

  // ===== 新增的 livePhoto 系列 =====
  "livePhoto_1752290338.JPG","livePhoto_1752418468.JPG","livePhoto_1752805567.JPG",
  "livePhoto_1752920335.JPG","livePhoto_1756553045.JPG","livePhoto_1756613710.JPG",
  "livePhoto_1756613786.JPG","livePhoto_1756872620.JPG","livePhoto_1756952839.JPG",

  // ===== 新增的 R 开头系列 =====
  "R0002588.JPG","R0002796.JPG","R0002803.JPG","R0002810.JPG","R0002811.JPG","R0002986.JPG",
  "R0002989.JPG","R0002998.JPG","R0003010.JPG","R0003048.jpg","R0003067.JPG","R0003089.JPG",
  "R0003221.JPG","R0003531.JPG",

  // ===== 新增的 IMG_xxxx 系列（HEIC 已转为 JPG） =====
  "IMG_0145.jpg","IMG_0170.jpg","IMG_0171.jpg","IMG_0175.jpg","IMG_0322.jpg","IMG_0333.jpg",
  "IMG_0582.jpg","IMG_0601.JPG","IMG_1257.PNG","IMG_1445.jpg","IMG_1451.jpg","IMG_1459.JPG",
  "IMG_1461.JPG","IMG_1486.jpg","IMG_1487.jpg","IMG_1489.jpg","IMG_1521.jpg","IMG_1538.jpg",
  "IMG_1541.jpg","IMG_1542.jpg","IMG_1555.jpg","IMG_1660.jpg","IMG_1672.jpg","IMG_1675.jpg",
  "IMG_1677.jpg","IMG_1678.jpg","IMG_1679.jpg","IMG_1719.jpg","IMG_2069.JPG","IMG_2189.JPG",
  "IMG_2215.jpg","IMG_2217.jpg","IMG_2218.jpg","IMG_2219.jpg","IMG_2274.jpg","IMG_2277.jpg",
  "IMG_9087.jpg","IMG_9115.jpg","IMG_9138.jpg","IMG_9140.jpg","IMG_9876.jpg",

  // ===== 再次出现的 livePhoto（确认不重复即可） =====
  "livePhoto_1752290338.JPG","livePhoto_1752418468.JPG"
  ];
  let usablePhotos = [];

  function preloadPhotos(list, done){
    let left = list.length;
    const ok = [];
    list.forEach(name => {
      const test = new Image();
      test.onload  = () => { ok.push(name); if (--left === 0) done(ok); };
      test.onerror = () => { console.warn('[photo missing]', name); if (--left === 0) done(ok); };
      test.src = PHOTO_BASE + name;
    });
  }

  // —— 更密集：每拍连发 2~3 张；屏幕上限，防止卡顿 —— //
  const MAX_PHOTOS_ON_SCREEN = 25;

  function startPhotos(){
    stopPhotos();
    // 节奏更快：每 1200ms 触发一次“连发”
    photoTimer = setInterval(spawnBurst, 1400);
  }
  function stopPhotos(){ if(photoTimer){ clearInterval(photoTimer); photoTimer=null; } }

  function spawnBurst(){
    if(!usablePhotos.length) return;

    // 控制上限：超了就先不发
    if (photos.childElementCount >= MAX_PHOTOS_ON_SCREEN) return;

    // 这次要发几张：2 或 3
    const howMany = 2 + Math.floor(Math.random() * 2); // 2 or 3
    for (let i = 0; i < howMany; i++){
      // 给每张图一个微小延迟（0~220ms），让爆发更自然
      const jitter = Math.floor(Math.random() * 220);
      setTimeout(() => {
        if (photos.childElementCount < MAX_PHOTOS_ON_SCREEN) {
          spawnPhoto();
        }
      }, jitter);
    }
  }

  // —— 单张照片生成：降低旋转幅度 + 拉长动画时长 —— //
  function spawnPhoto(){
    if(!usablePhotos.length) return;

    const name = usablePhotos[Math.floor(Math.random()*usablePhotos.length)];
    const img = document.createElement('img');
    img.src = PHOTO_BASE + name;
    img.loading = 'lazy';
    img.decoding = 'async';

    // —— 1) 尺寸：轻微随机 —— //
    const w = 90 + Math.random()*70;    // 90~160px
    img.style.width = w + 'px';
    const approxH = w * 0.66;           // 估一下高度用于碰撞判断即可（真实高度由浏览器算）

    // —— 2) 计算“可用区域”的像素范围（考虑左右安全边） —— //
    const safeLeftPx  = vw2px(SAFE_MARGIN_VW);
    const safeRightPx = vw2px(SAFE_MARGIN_VW);
    const usableW = window.innerWidth - safeLeftPx - safeRightPx;

    const usableTopPx = vh2px(GRID_TOP_VH);
    const usableBotPx = vh2px(GRID_BOTTOM_VH);
    const usableH = Math.max(20, usableBotPx - usableTopPx);

    // —— 3) 选择一个网格单元，并在单元内随机 —— //
    const cell = pickCell();
    const cellW = usableW / GRID_COLS;
    const cellH = usableH / GRID_ROWS;

    let leftPx, topPx;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    do {
      attempts++;

      // 水平位置：单元内随机摆放，但要保证不越右边界
      leftPx = safeLeftPx + cell.c * cellW + Math.random() * (cellW - w);
      leftPx = clamp(leftPx, safeLeftPx, window.innerWidth - safeRightPx - w);

      // 垂直位置：单元内随机摆放
      topPx  = usableTopPx + cell.r * cellH + Math.random() * Math.max(8, cellH - approxH);

      // 如果“太靠下”导致动画看不清，稍微往上抬一点
      if (topPx > window.innerHeight - approxH - 20) {
        topPx = window.innerHeight - approxH - 20;
      }

      // 如果距离最近的已经存在的太近，就再试
    } while (attempts < MAX_ATTEMPTS && tooClose(leftPx, topPx, w, approxH));

    // 标记网格占用（让这个格子一小段时间不要再来）
    gridBusyUntil[cellIndex(cell.c, cell.r)] = Date.now() + CELL_BUSY_MS;

    // 记录到“最近矩形”池子，辅助后续避让
    pushRecent(leftPx, topPx, w, approxH);

    // —— 4) 设置位置 —— //
    img.style.left = leftPx + 'px';
    img.style.top  = topPx  + 'px';

    // —— 5) 动画：更自然的漂移与慢旋转 —— //
    const dx  = (Math.random()*220 - 110) + 'px';
    const dy  = '-105vh';
    const rot = (Math.random()*100 - 50) + 'deg';       // 缩到 ±50°
    const durMs = 12000 + Math.random()*5000;

    // 随机延迟（错峰进入，避免成团）
    const delayMs = Math.floor(Math.random() * 2000);
    img.style.animationDelay = delayMs + 'ms';

    img.style.setProperty('--dx', dx);
    img.style.setProperty('--dy', dy);
    img.style.setProperty('--rot', rot);
    img.style.animationDuration = durMs + 'ms';

    img.onerror = () => img.remove();
    photos.appendChild(img);

    // 结束后清理
    setTimeout(() => img.remove(), durMs + delayMs + 300);
  }
  // 预加载完成后，才开始页面 & 动效
  preloadPhotos(photoList, (okList)=> {
    usablePhotos = okList;
    // 初始化首页
    showPage(1);
  });

  // 如果你更希望立即显示首页（不等预加载），可改成：
  // showPage(1);
  // preloadPhotos(photoList, (okList)=> { usablePhotos = okList; });

})();