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
  function swapNo(e){
    if (loveBtn.nextElementSibling === noBtn) btns.insertBefore(noBtn, loveBtn);
    else                                     btns.insertBefore(loveBtn, noBtn);
    noBtnScale *= 0.8; noBtn.style.transform = `scale(${noBtnScale})`;
    if (navigator.vibrate) navigator.vibrate(8);
    e.preventDefault(); e.stopImmediatePropagation();
  }
  noBtn.addEventListener('mouseenter', swapNo);
  noBtn.addEventListener('pointerdown', swapNo, {passive:false});
  noBtn.addEventListener('click', swapNo);
  noBtn.addEventListener('touchstart', (e)=>{ e.preventDefault(); swapNo(e); }, {passive:false});

  loveBtn.addEventListener('click', () => {
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
    "IMG_0331.jpg","IMG_0624.jpg","IMG_0112.jpg","IMG_1624.JPG","IMG_1708.JPG","IMG_1873.JPG",
    "IMG_2013.JPG","IMG_2015.JPG","IMG_2019.JPG","IMG_2184.jpg","IMG_2186.JPG","IMG_2027.JPG",
    "IMG_2198.JPG","IMG_3932.JPG","IMG_3984.JPG","IMG_3994.JPG","IMG_9322.JPG","Live.JPG"
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
  const MAX_PHOTOS_ON_SCREEN = 22;

  function startPhotos(){
    stopPhotos();
    // 节奏更快：每 1200ms 触发一次“连发”
    photoTimer = setInterval(spawnBurst, 1200);
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

    // ---- 改动 1: 照片尺寸缩小 ----
    const w = 90 + Math.random()*70; // 90~160px
    img.style.width = w + 'px';

    // ---- 改动 2: 分区生成 ----
    const zones = [8, 40, 72]; // 左/中/右区段起点
    const zone = zones[Math.floor(Math.random() * zones.length)];
    img.style.left = (zone + Math.random()*16) + 'vw'; // 区段宽度16vw
    img.style.top   = (60 + Math.random()*25) + 'vh'; // 起点在屏幕下半部分

    // ---- 保留：上升 + 慢旋转 ----
    const dx  = (Math.random()*200 - 100) + 'px';
    const dy  = '-100vh';
    const rot = (Math.random()*120 - 60) + 'deg';     // 缩小到 ±60° 更自然
    const durMs = 12000 + Math.random()*5000;         // 12~17 秒

    img.style.setProperty('--dx', dx);
    img.style.setProperty('--dy', dy);
    img.style.setProperty('--rot', rot);
    img.style.animationDuration = durMs + 'ms';

    img.onerror = () => img.remove();

    photos.appendChild(img);
    setTimeout(()=> img.remove(), durMs + 200);
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