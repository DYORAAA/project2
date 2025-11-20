// login.js
document.addEventListener('DOMContentLoaded', () => {
  const loginContainer = document.getElementById('loginContainer');
  const closedIcon = document.getElementById('closedIcon');
  const btn = document.getElementById('btnLogin');
  const userInput = document.getElementById('user');
  const passInput = document.getElementById('pass');

  // buka form saat ikon diklik, fokus ke username
  closedIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    loginContainer?.classList.add('open');
    setTimeout(() => userInput?.focus(), 180);
  });

  // tutup saat klik di luar form
  document.addEventListener('click', (e) => {
    if (!loginContainer) return;
    if (!loginContainer.classList.contains('open')) return;
    if (!loginContainer.contains(e.target)) loginContainer.classList.remove('open');
  });

  // submit on Enter
  [userInput, passInput].forEach(input => {
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btn?.click();
      }
    });
  });

  // validasi contoh (ganti sesuai backend)
  btn?.addEventListener('click', () => {
    const u = userInput?.value.trim() || '';
    const p = passInput?.value.trim() || '';
    if (u === 'admin' && p === 'tkj123') {
      localStorage.setItem('login', 'true');
      window.location.href = 'dashboard.html';
    } else {
      // efek shake singkat
      loginContainer?.classList.remove('shake');
      void loginContainer?.offsetWidth;
      loginContainer?.classList.add('shake');
      setTimeout(() => loginContainer?.classList.remove('shake'), 600);
      alert('Username atau password salah!');
    }
  });
});

// Animasi biner (rain) pada canvas — responsif (tidak diubah)
(function(){
  const canvas = document.getElementById('binaryCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, columns, drops;
  let fontSize = Math.max(10, Math.floor(window.innerWidth / 120));
  const chars = ['0','1'];

  function resize(){
    fontSize = Math.max(10, Math.floor(window.innerWidth / 120));
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Math.floor(width / fontSize) || 1;
    drops = new Array(columns).fill(0).map(()=> Math.floor(Math.random()*height/fontSize));
  }

  function draw(){
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0,0,width,height);
    ctx.font = fontSize + 'px monospace';
    ctx.fillStyle = 'rgba(0,212,255,0.9)';
    for (let i=0;i<columns;i++){
      const text = chars[Math.random() > 0.5 ? 0 : 1];
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      ctx.fillText(text, x, y);
      if (y > height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, {passive:true});
  resize();
  ctx.clearRect(0,0,width,height);
  draw();
})();
