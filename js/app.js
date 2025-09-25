(() => {
  // ===== 工具 =====
  const $ = (id) => document.getElementById(id);
  const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // ===== 元素 =====
  const yes1 = $('yes1'), no1 = $('no1');
  const loveBtn = $('loveBtn'), noBtn = $('noBtn'), btns = $('btns');
  const loveScreen = $('loveScreen'), floaters = $('floaters');
  const fireworks = $('fireworks'), floatHearts = $('floatHearts'), photos = $('photos');

  // ===== 音乐 =====
  const bgm = new Audio('./music.m4a'); bgm.preload='auto'; bgm.loop=true; bgm.volume=0.4;

  // ===== 状态 =====
  let yes1Scale = 1, noBtnScale = 1;
  let fwTimer=null, floatHeartTimer=null, photoTimer=null;
  let loveStage = 0; // 0：首击播放心弹+显示天数；1：二击跳到第4页

  // —— 布局控制（照片防重叠） —— //
  const SAFE_MARGIN_VW = 3, GRID_COLS = 6, GRID_ROWS = 3, GRID_TOP_VH = 52, GRID_BOTTOM_VH = 92;
  const CELL_BUSY_MS = 2800, RECENT_TTL = 3800;
  const gridBusyUntil = new Array(GRID_COLS * GRID_ROWS).fill(0);
  const recentRects = [];
  const vw2px = (v)=>innerWidth*(v/100), vh2px=(v)=>innerHeight*(v/100);
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const cellIndex=(c,r)=>r*GRID_COLS+c;

  function pickCell(){
    const now=Date.now(), all=[];
    for(let r=0;r<GRID_ROWS;r++) for(let c=0;c<GRID_COLS;c++){
      const busy = gridBusyUntil[cellIndex(c,r)]>now;
      all.push({c,r,busy});
    }
    const free=all.filter(x=>!x.busy), list=free.length?free:all;
    return list[Math.floor(Math.random()*list.length)];
  }
  function pushRecent(x,y,w,h){ const now=Date.now(); recentRects.push({x,y,w,h,t:now+RECENT_TTL}); for(let i=recentRects.length-1;i>=0;i--) if(recentRects[i].t<now) recentRects.splice(i,1); }
  function tooClose(x,y,w,h){ const cx=x+w/2, cy=y+h/2; for(const r of recentRects){ if(r.t<Date.now()) continue; const rx=r.x+r.w/2, ry=r.y+r.h/2; const dx=Math.abs(cx-rx), dy=Math.abs(cy-ry); if(dx<(w+r.w)*.55 && dy<(h+r.h)*.55) return true } return false }

  // 全局冷却窗
  let suppressNavUntil=0; const guardNav=(ms=400)=> suppressNavUntil=Date.now()+ms;
  document.addEventListener('click',(e)=>{ if(Date.now()<suppressNavUntil){ e.preventDefault(); e.stopPropagation(); }}, true);

  // 切页
  function showPage(n){
    document.querySelectorAll('section').forEach(sec=>sec.classList.remove('active'));
    const target = $('page'+n);
    if (target) target.classList.add('active');

    if(n === 4){
      startFireworks();
      startFloatHearts();
      startPhotos();
      startShootingStars();

      requestAnimationFrame(() => {
        const card = document.querySelector('#page4 .goodnight-card');
        const txt  = document.querySelector('#page4 .rainbow-text');
        if (card) card.classList.add('enter');

        if (txt) {
          // 永久果冻质感
          txt.classList.add('gel');

          // 一次性的“慢慢弹入”
          txt.classList.remove('jelly-in'); // 重置
          void txt.offsetWidth;
          txt.classList.add('jelly-in');

          // 持续的轻柔律动（等入场结束后再开始更自然）
          setTimeout(() => {
            txt.classList.add('jelly-soft');
          }, 800);
        }
      });

    } else {
      stopFireworks();
      stopFloatHearts();
      stopPhotos();
      stopShootingStars();
    }
  }

  // 第1页：yes 乱跑
  function moveYes1Random(e){
    guardNav(600);
    const maxX=innerWidth-yes1.offsetWidth, maxY=innerHeight-yes1.offsetHeight;
    yes1.style.position='fixed';
    yes1.style.left=Math.max(0,Math.random()*maxX)+'px';
    yes1.style.top =Math.max(0,Math.random()*maxY)+'px';
    if(e.type==='click'||e.type==='pointerdown'){ yes1Scale*=0.85; yes1.style.transform=`scale(${yes1Scale})`; }
    e.preventDefault(); e.stopImmediatePropagation();
  }
  yes1.addEventListener('mouseover', moveYes1Random);
  yes1.addEventListener('pointerdown', moveYes1Random, {passive:false});
  yes1.addEventListener('click', moveYes1Random);
  no1.addEventListener('click',(e)=>{ if(Date.now()<suppressNavUntil){ e.preventDefault(); return; } showPage(2); });

  // 第2页：no 换位缩小；love 进第3页
  let lastSwapTs=0;
  function swapNo(e){
    const now=Date.now(); if(now-lastSwapTs<150){ e.preventDefault?.(); e.stopImmediatePropagation?.(); return; }
    lastSwapTs=now; guardNav(600);
    if(loveBtn.nextElementSibling===noBtn) btns.insertBefore(noBtn, loveBtn); else btns.insertBefore(loveBtn, noBtn);
    noBtnScale*=0.8; noBtn.style.transform=`scale(${noBtnScale})`;
    if(e.pointerId && noBtn.setPointerCapture){ try{ noBtn.setPointerCapture(e.pointerId) }catch{} }
    if(navigator.vibrate) navigator.vibrate(8);
    e.preventDefault?.(); e.stopImmediatePropagation?.();
  }
  noBtn.addEventListener('mouseenter', swapNo);
  noBtn.addEventListener('pointerdown', (e)=>{ e.preventDefault(); e.stopImmediatePropagation(); swapNo(e); }, {passive:false});
  noBtn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopImmediatePropagation(); });

  loveBtn.addEventListener('click',(e)=>{
    if(Date.now()<suppressNavUntil){ e.preventDefault(); e.stopImmediatePropagation(); return; }
    try{
      bgm.currentTime=0; bgm.volume=0; bgm.play();
      const target=0.4, step=0.01; const t=setInterval(()=>{ if(bgm.volume<target) bgm.volume=Math.min(bgm.volume+step,target); else clearInterval(t) },100);
    }catch{}
    loveScreen.style.display='grid'; loveScreen.setAttribute('aria-hidden','false'); sprayHearts();
  });

  /* =========================
   * 第3页：单心果冻弹 → 文案切换为天数
   * ========================= */
  function daysSince(y,m,d){
    const start=new Date(y,m-1,d), now=new Date();
    const a=new Date(start.getFullYear(),start.getMonth(),start.getDate());
    const b=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    return Math.max(0, Math.floor((b-a)/86400000));
  }

  function countUpTo(target){
    const numEl = $('daysNum'); const dur=2800; const t0=performance.now();
    return new Promise(resolve=>{
      function tick(t){ const p=Math.min(1,(t-t0)/dur); const eased=0.5 - Math.cos(Math.PI*p)/2;
        const val=Math.round(target*eased); numEl.textContent=val;
        if(p<1) requestAnimationFrame(tick); else { numEl.textContent=String(target); resolve(); } }
      requestAnimationFrame(tick);
    });
  }

  async function smoothToPage4(options = {}) {
    const {
      explodeTotal = 1600,  // 爆炸总时长 = 你的 BLAST_DUR + DRIFT_DUR
      prewarmLead = 200,    // 卡片比爆炸提前多少毫秒弹入
      fadeOutP3  = 280      // 第3页淡出时长，和 CSS 的 .28s 对齐
    } = options;

    const love = document.getElementById('loveScreen');
    const card = document.querySelector('#page4 .goodnight-card');

    // 1) 立刻切到第4页（预热到场，但卡片还未弹入）
    showPage(4);

    // 2) 第3页开始淡出（和爆炸尾声重叠）
    love.classList.add('fade-out');

    // 4) 等爆炸真正结束 + 淡出收尾，再彻底隐藏第3页
    await new Promise(r => setTimeout(r, Math.max(explodeTotal, prewarmLead) + fadeOutP3));
    love.style.display = 'none';
    love.setAttribute('aria-hidden', 'true');

    // 清理第3页心雨
    const floaters = document.getElementById('floaters');
    if (floaters) floaters.innerHTML = '';
  }

  function explodeHeartThenGo() {
    // ===== 可调参数 =====
    const PARTICLE_COUNT = 86;
    const R_MIN = 160, R_MAX = 280;
    const BLAST_DUR = 900;          // 第一段外抛
    const DRIFT_DUR = 700;          // 第二段漂移
    const PAGE_SWITCH_DELAY = 680;  // 切到第4页时机
    const VEIL_MAX_OPACITY = 0.16;
    const GHOST_SCALE = 1.32;       // 幽灵心扩散
    const GHOST_DUR = 520;          // 幽灵心淡出时长
    const SOURCE_VANISH_DUR = 320;  // “源心”同步消失时长

    // 既兼容只有 .heart-svg，也兼容之前可能存在的 .heart-stack
    const heart = document.querySelector('.heart-svg');
    if (!heart) return;
    const heartHolder = heart.closest('.heart-stack') || heart;

    const rect = heart.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;

    // 0) 源心同步“融解”：轻放大+淡出（看起来就是它自己炸开）
    //    用 WAAPI 避免写额外 CSS
    heartHolder.animate(
      [
        { transform: 'scale(1)',    opacity: 1,   filter:'none' },
        { transform: 'scale(1.18)', opacity: 0.15, filter:'blur(0.3px)' }
      ],
      { duration: SOURCE_VANISH_DUR, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
    );
    // 动画结束后彻底隐藏，避免余光看到它还在
    setTimeout(() => { heartHolder.style.visibility = 'hidden'; }, SOURCE_VANISH_DUR);

    // 1) 幽灵心（用于承接“气浪”）：更大更久，和源心动画重叠几帧，视觉更连贯
    const ghost = heart.cloneNode(true);
    ghost.classList.add('puff-heart'); // 你已有的 CSS：position:fixed + drop-shadow
    ghost.style.left = rect.left + 'px';
    ghost.style.top  = rect.top  + 'px';
    document.body.appendChild(ghost);

    ghost.animate(
      [
        { transform: 'scale(1)',           opacity: 0.9 },
        { transform: `scale(${GHOST_SCALE})`, opacity: 0.02 }
      ],
      { duration: GHOST_DUR, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
    ).finished.then(() => ghost.remove());

    // 2) 白纱幕：略亮、停久一点
    const veil = document.createElement('div');
    veil.className = 'fade-veil';
    document.body.appendChild(veil);
    veil.animate(
      [{opacity:0}, {opacity:VEIL_MAX_OPACITY}, {opacity:VEIL_MAX_OPACITY * 0.6}],
      { duration: BLAST_DUR + DRIFT_DUR - 80, easing: 'ease-out', fill: 'forwards' }
    ).finished.then(() => veil.remove());

    // 3) 微粒爱心：两段式（猛爆→漂移下落）
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const m = document.createElement('div');
      m.className = 'micro-heart';
      m.textContent = '❤';
      const baseSize = 12 + Math.random()*9; // 12~21px
      m.style.fontSize = baseSize + 'px';
      m.style.left = cx + 'px';
      m.style.top  = cy + 'px';
      m.style.color = ['#ff7da3','#ff5b7c','#ef3b5d','#ffafc8'][i % 4];
      document.body.appendChild(m);

      const ang = Math.random() * Math.PI * 2;
      const r   = R_MIN + Math.random() * (R_MAX - R_MIN);
      const dx  = Math.cos(ang) * r;
      const dy  = Math.sin(ang) * r * 0.92;
      const rot = (Math.random()*80 - 40) + 'deg';

      // 第一段：猛爆
      const blast = m.animate(
        [
          { transform: 'translate(0,0) scale(0.86)', opacity: 1,   filter:'blur(0px)' },
          { transform: `translate(${dx}px, ${dy}px) rotate(${rot}) scale(1.08)`, opacity: 0.92, filter:'blur(0.2px)' }
        ],
        { duration: BLAST_DUR, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
      );

      // 第二段：漂移下落
      blast.finished.then(() => {
        const driftX = dx + (Math.random()*60 - 30);
        const driftY = dy + 60 + Math.random()*80;
        m.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) rotate(${rot}) scale(1.02)`, opacity: 0.9, filter:'blur(0.25px)' },
            { transform: `translate(${driftX}px, ${driftY}px) rotate(${rot}) scale(0.98)`, opacity: 0.0, filter:'blur(0.6px)' }
          ],
          { duration: DRIFT_DUR, easing: 'cubic-bezier(.25,.8,.28,1)', fill: 'forwards' }
        ).finished.then(() => m.remove());
      });
    }

    // 4) 爆炸与第4页重叠过渡（更自然）
    (async () => {
      // 让第4页卡片与爆炸尾声重叠：爆炸总时长 = BLAST_DUR + DRIFT_DUR
      const EXPLODE_TOTAL = BLAST_DUR + DRIFT_DUR; // 900 + 700 = 1600（按你上面的参数）

      // 先并行触发第4页预热过渡
      smoothToPage4({ explodeTotal: EXPLODE_TOTAL, prewarmLead: 200, fadeOutP3: 280 });

      // 同时在第4页放烟花（承接你的视觉动势）
      const x = innerWidth * 0.5 + (Math.random()*120-60);
      const y = innerHeight * 0.38 + (Math.random()*80-40);
      explode(x, y);
      setTimeout(()=> explode(x + (Math.random()*160-80), y + (Math.random()*80-40)), 160);
      setTimeout(()=> explode(x + (Math.random()*200-100), y + (Math.random()*100-50)), 360);
    })();
  }

  loveScreen.addEventListener('click', async (e)=>{
    e.preventDefault(); e.stopPropagation();

    // 第二次点击：进入第4页
    if (loveStage === 1) {
      explodeHeartThenGo();
      return;
    }
    // 第一次点击：心做果冻弹跳
    const heart = document.querySelector('.heart-svg');
    if (heart){
      // 触发一次性动画
      heart.style.animation = 'jellyPop .52s cubic-bezier(.22,1,.36,1) forwards';
      // 让 shine 动画在点击时更明显一点（瞬时加速一下）
      const shine = heart.querySelector('.heart-shine');
      if (shine){ shine.style.animationDuration = '2.2s'; setTimeout(()=> shine.style.animationDuration='', 600); }
    }

    // 隐藏“我也爱你！宝宝”，显示天数（占据同样位置）
    const loveLine = $('loveLine');
    const line = $('togetherLine');
    if (loveLine) loveLine.style.display='none';
    if (line){
      line.hidden=false;
      // 触发过渡
      requestAnimationFrame(()=> line.classList.add('show'));
      // 计天（从 2025/05/20）
      const days = daysSince(2025,5,20);
      await countUpTo(days);

      // 👉 在这里偷偷预热第4页卡片
      document.querySelector('#page4 .goodnight-card')?.offsetWidth;
    }

    loveStage = 1; // 等待第二次点击
  });

  function countUpTo(days) {
    return new Promise((resolve) => {
      let current = 0;
      const numEl = document.getElementById('daysNum');
      const step = Math.max(1, Math.floor(days / 60));
      const interval = setInterval(() => {
        current += step;
        if (current >= days) {
          current = days;
          clearInterval(interval);
          resolve();
        }
        numEl.textContent = current;
        numEl.classList.remove('jelly'); // 重置
        void numEl.offsetWidth;          // 强制回流
        numEl.classList.add('jelly');    // 触发动画
      }, 30);
    });
  }

  // 心心雨
  function sprayHearts(){
    floaters.innerHTML=''; const colors=['#ffd6e7','#ffafc8','#ff7da3','#ff5b7c','#ef3b5d'];
    for(let i=0;i<36;i++){
      const s=document.createElement('div'); s.className='floater'; s.textContent='❤';
      s.style.left=rand(0,100)+'vw'; s.style.bottom=rand(-10,10)+'vh';
      s.style.animationDelay=(Math.random()*1.2).toFixed(2)+'s';
      s.style.fontSize=rand(12,28)+'px'; s.style.color=colors[rand(0,colors.length)];
      floaters.appendChild(s);
    }
  }

  /* =========================
   * 第4页：烟花 + 漂浮心 + 随机照片
   * ========================= */
  function startFireworks(){ stopFireworks(); fwTimer=setInterval(()=>launchFirework(),1000); }
  function stopFireworks(){ if(fwTimer){ clearInterval(fwTimer); fwTimer=null; } }
  function launchFirework(){
    const startX=Math.random()*innerWidth, startY=innerHeight+10;
    const targetY=innerHeight*(0.3+Math.random()*0.4), rise=900+Math.random()*300;
    const rocket=document.createElement('div'); rocket.className='particle';
    rocket.style.background='#fff'; rocket.style.left=startX+'px'; rocket.style.top=startY+'px'; fireworks.appendChild(rocket);
    rocket.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(0,${targetY-startY}px)`,opacity:1}],{duration:rise,easing:'ease-out',fill:'forwards'});
    setTimeout(()=>{ rocket.remove(); explode(startX,targetY); }, rise);
  }
  function explode(x,y){
    const colors=['#ff4d4d','#ffd633','#66ff66','#66ccff','#cc99ff','#ff66cc','#ff9933']; const count=60;
    for(let i=0;i<count;i++){
      const el=document.createElement('div'); el.className='particle'; const s=6+Math.random()*6; el.style.width=el.style.height=s+'px';
      el.style.background=colors[Math.floor(Math.random()*colors.length)]; el.style.left=x+'px'; el.style.top=y+'px'; fireworks.appendChild(el);
      const angle=Math.random()*Math.PI*2, r=140+Math.random()*120, dx=Math.cos(angle)*r, dy=Math.sin(angle)*r, dur=1200+Math.random()*800;
      el.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${dx}px,${dy}px)`,opacity:0}],{duration:dur,easing:'ease-out',fill:'forwards'});
      setTimeout(()=>el.remove(), dur+120);
    }
  }
  function startFloatHearts(){ stopFloatHearts(); floatHeartTimer=setInterval(spawnFloatHeart,800); }
  function stopFloatHearts(){ if(floatHeartTimer){ clearInterval(floatHeartTimer); floatHeartTimer=null; } }
  function spawnFloatHeart(){
    const colors=['#ffd6e7','#ffafc8','#ff7da3','#ff5b7c','#ef3b5d']; const h=document.createElement('div'); h.textContent='❤';
    h.style.position='absolute'; h.style.left=rand(0,100)+'vw'; h.style.bottom='-10vh'; h.style.fontSize=(12+Math.random()*16)+'px'; h.style.color=colors[rand(0,colors.length)]; h.style.opacity=0; floatHearts.appendChild(h);
    const xShift=(Math.random()*80-40)+'px', dur=6000+Math.random()*4000;
    h.animate([{transform:'translate(0,0)',opacity:0},{transform:`translate(${xShift}, -80vh)`,opacity:1}],{duration:dur,easing:'linear',fill:'forwards'});
    setTimeout(()=>h.remove(), dur+50);
  }

  // 照片
  const PHOTO_BASE='./image/';
  const photoList=[
    "IMG_0331.jpg","IMG_0624.jpg","IMG_0112.jpg","IMG_1624.JPG","IMG_1708.JPG","IMG_1873.JPG",
    "IMG_2013.JPG","IMG_2015.JPG","IMG_2019.JPG","IMG_2184.jpg","IMG_2186.JPG","IMG_2027.JPG",
    "IMG_2198.JPG","IMG_3932.JPG","IMG_3984.JPG","IMG_3994.JPG","IMG_9322.JPG","Live.JPG",
    "livePhoto_1752290338.JPG","livePhoto_1752418468.JPG","livePhoto_1752805567.JPG",
    "livePhoto_1752920335.JPG","livePhoto_1756553045.JPG","livePhoto_1756613710.JPG",
    "livePhoto_1756613786.JPG","livePhoto_1756872620.JPG","livePhoto_1756952839.JPG",
    "R0002588.JPG","R0002796.JPG","R0002803.JPG","R0002810.JPG","R0002811.JPG","R0002986.JPG",
    "R0002989.JPG","R0002998.JPG","R0003010.JPG","R0003048.jpg","R0003067.JPG","R0003089.JPG",
    "R0003221.JPG","R0003531.JPG",
    "IMG_0145.jpg","IMG_0170.jpg","IMG_0171.jpg","IMG_0175.jpg","IMG_0333.jpg",
    "IMG_0582.jpg","IMG_0601.JPG","IMG_1257.PNG","IMG_1445.jpg","IMG_1451.jpg","IMG_1459.JPG",
    "IMG_1461.JPG","IMG_1486.jpg","IMG_1487.jpg","IMG_1489.jpg","IMG_1521.jpg","IMG_1538.jpg",
    "IMG_1541.jpg","IMG_1542.jpg","IMG_1555.jpg","IMG_1660.jpg","IMG_1672.jpg","IMG_1675.jpg",
    "IMG_1677.jpg","IMG_1678.jpg","IMG_1679.jpg","IMG_1719.jpg","IMG_2069.JPG","IMG_2189.JPG",
    "IMG_2215.jpg","IMG_2217.jpg","IMG_2218.jpg","IMG_2219.jpg","IMG_2274.jpg","IMG_2277.jpg",
    "IMG_9087.jpg","IMG_9115.jpg","IMG_9138.jpg","IMG_9140.jpg","IMG_9876.jpg",
    "livePhoto_1752290338.JPG","livePhoto_1752418468.JPG"
  ];
  let usablePhotos=[];
  function startPhotos(){ stopPhotos(); photoTimer=setInterval(spawnBurst,1400) }
  function stopPhotos(){ if(photoTimer){ clearInterval(photoTimer); photoTimer=null } }
  function spawnBurst(){
    if(!usablePhotos.length) return; if(photos.childElementCount>=25) return;
    const howMany=2+Math.floor(Math.random()*2);
    for(let i=0;i<howMany;i++){ const jitter=Math.floor(Math.random()*220); setTimeout(()=>{ if(photos.childElementCount<25) spawnPhoto(); }, jitter) }
  }
  function spawnPhoto(){
    if(!usablePhotos.length) return;
    const name=usablePhotos[Math.floor(Math.random()*usablePhotos.length)];
    const img=document.createElement('img'); img.src=PHOTO_BASE+name; img.loading='lazy'; img.decoding='async';
    const w=90+Math.random()*70; img.style.width=w+'px'; const approxH=w*.66;
    const safeLeftPx=vw2px(SAFE_MARGIN_VW), safeRightPx=vw2px(SAFE_MARGIN_VW), usableW=innerWidth-safeLeftPx-safeRightPx;
    const usableTopPx=vh2px(GRID_TOP_VH), usableBotPx=vh2px(GRID_BOTTOM_VH), usableH=Math.max(20,usableBotPx-usableTopPx);
    const cell=pickCell(), cellW=usableW/GRID_COLS, cellH=usableH/GRID_ROWS;
    let leftPx, topPx, attempts=0; const MAX_ATTEMPTS=10;
    do{
      attempts++;
      leftPx=safeLeftPx+cell.c*cellW+Math.random()*(cellW-w); leftPx=clamp(leftPx,safeLeftPx,innerWidth-safeRightPx-w);
      topPx=usableTopPx+cell.r*cellH+Math.random()*Math.max(8,cellH-approxH); if(topPx>innerHeight-approxH-20) topPx=innerHeight-approxH-20;
    }while(attempts<MAX_ATTEMPTS && tooClose(leftPx,topPx,w,approxH));
    gridBusyUntil[cellIndex(cell.c,cell.r)] = Date.now()+CELL_BUSY_MS; pushRecent(leftPx,topPx,w,approxH);
    img.style.left=leftPx+'px'; img.style.top=topPx+'px';
    const dx=(Math.random()*220-110)+'px', dy='-105vh', rot=(Math.random()*100-50)+'deg', durMs=12000+Math.random()*5000, delayMs=Math.floor(Math.random()*1000);
    img.style.animationDelay=delayMs+'ms'; img.style.setProperty('--dx',dx); img.style.setProperty('--dy',dy); img.style.setProperty('--rot',rot); img.style.animationDuration=durMs+'ms';
    img.onerror=()=>img.remove(); photos.appendChild(img); setTimeout(()=>img.remove(), durMs+delayMs+300);
  }
  function preloadPhotos(list, done){
    let left=list.length; const ok=[];
    list.forEach(name=>{ const test=new Image(); test.onload=()=>{ ok.push(name); if(--left===0) done(ok) }; test.onerror=()=>{ if(--left===0) done(ok) }; test.src=PHOTO_BASE+name; });
  }
  preloadPhotos(photoList, (ok)=>{ usablePhotos=ok; showPage(1); });

  // 流星
  const shootingStars = document.getElementById('shootingStars'); let shootingTimer=null;
  function startShootingStars(){ stopShootingStars(); shootingTimer=setInterval(spawnShootingStar,6000) }
  function stopShootingStars(){ if(shootingTimer){ clearInterval(shootingTimer); shootingTimer=null } }
  function spawnShootingStar(){ if(!shootingStars) return; const star=document.createElement('div'); star.className='shooting-star'; star.style.top=rand(0,40)+'vh'; star.style.left=rand(60,100)+'vw'; shootingStars.appendChild(star); setTimeout(()=> star.remove(), 1500) }
})();