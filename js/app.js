(() => {
  const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);

  const loveBtn = document.getElementById('loveBtn');
  const noBtn   = document.getElementById('noBtn');
  const btns    = document.getElementById('btns');
  const loveScreen = document.getElementById('loveScreen');
  const floaters = document.getElementById('floaters');

  loveBtn.addEventListener('click', () => {
    loveScreen.style.display = 'grid';
    loveScreen.setAttribute('aria-hidden', 'false');
    sprayHearts();
  });
  loveScreen.addEventListener('click', () => {
    loveScreen.style.display = 'none';
    loveScreen.setAttribute('aria-hidden', 'true');
    floaters.innerHTML = '';
  });

  const swapButtons = () => {
    const love = document.getElementById('loveBtn');
    const no = document.getElementById('noBtn');
    if (love.nextElementSibling === no) {
      btns.insertBefore(no, love);
    } else {
      btns.insertBefore(love, no);
    }
    if (window.navigator && navigator.vibrate) { navigator.vibrate(6); }
  };

  noBtn.addEventListener('mouseenter', swapButtons);
  noBtn.addEventListener('focus', swapButtons);
  noBtn.addEventListener('touchstart', (e) => { e.preventDefault(); swapButtons(); }, {passive:false});

  document.addEventListener('mousemove', (e) => {
    const rect = noBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx; const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < 80) swapButtons();
  });

  function sprayHearts(){
    floaters.innerHTML = '';
    const colors = ['#fecaca','#fda4af','#f87171','#ef4444','#dc2626'];
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
