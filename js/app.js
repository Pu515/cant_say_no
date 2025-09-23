(() => {
  const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);

  const loveBtn = document.getElementById('loveBtn');
  const noBtn   = document.getElementById('noBtn');
  const btns    = document.getElementById('btns');
  const loveScreen = document.getElementById('loveScreen');
  const floaters = document.getElementById('floaters');

  let noBtnScale = 1; // 不爱按钮缩放倍数
  let loveBtnScale = 1; // 爱按钮放大倍数

  // 点击“爱”按钮
  loveBtn.addEventListener('click', () => {
    loveBtnScale *= 1.2; // 每次点击放大 1.2 倍
    loveBtn.style.transform = `scale(${loveBtnScale})`;

    loveScreen.style.display = 'grid';
    loveScreen.setAttribute('aria-hidden', 'false');
    sprayHearts();
  });

  // 点击关闭爱心页面
  loveScreen.addEventListener('click', () => {
    loveScreen.style.display = 'none';
    loveScreen.setAttribute('aria-hidden', 'true');
    floaters.innerHTML = '';
  });

    // 不爱按钮交换 + 不断缩小
    const swapButtons = () => {
    const love = document.getElementById('loveBtn');
    const no = document.getElementById('noBtn');
    if (love.nextElementSibling === no) {
        btns.insertBefore(no, love);
    } else {
        btns.insertBefore(love, no);
    }

    // 每次缩小一半，不设下限，直到看不见为止
    noBtnScale *= 0.8;
    no.style.transform = `scale(${noBtnScale})`;

    if (navigator.vibrate) navigator.vibrate(6);
    };

  noBtn.addEventListener('mouseenter', swapButtons);
  noBtn.addEventListener('focus', swapButtons);
  noBtn.addEventListener('touchstart', (e) => { e.preventDefault(); swapButtons(); }, {passive:false});

  document.addEventListener('mousemove', (e) => {
    const rect = noBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx; const dy = e.clientY - cy;
    if (Math.hypot(dx, dy) < 80) swapButtons();
  });

  // 飘落爱心
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

  document.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') loveBtn.click(); });
})();
