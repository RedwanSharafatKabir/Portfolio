/* ===== Theme toggle ===== */
let isDark = true;
function toggleTheme(){
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('themeBtn').children[0].textContent = isDark ? '🌙' : '☀️';
  document.getElementById('themeLabel').textContent = isDark ? 'Dark' : 'Light';
  document.getElementById('mobileThemeIcon').textContent = isDark ? '🌙' : '☀️';
  document.getElementById('mobileThemeLabel').textContent = isDark ? 'Switch to Light' : 'Switch to Dark';
  if (window.__neural) window.__neural.recolor();
}

/* ===== Mobile menu ===== */
let menuOpen = false;
function toggleMenu(){
  menuOpen = !menuOpen;
  document.getElementById('mobileMenu').classList.toggle('open', menuOpen);
}
function closeMenu(){
  menuOpen = false;
  document.getElementById('mobileMenu').classList.remove('open');
}
window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });

/* ===== Scroll reveal ===== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-in').forEach(el => revealObserver.observe(el));

/* ===== Scroll progress + nav shadow ===== */
const progressEl = document.getElementById('scrollProgress');
const navEl = document.getElementById('nav');
function onScroll(){
  const h = document.documentElement;
  const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
  if (progressEl) progressEl.style.width = (scrolled * 100) + '%';
  if (navEl) navEl.classList.toggle('scrolled', h.scrollTop > 12);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ===== Scroll-spy (active nav link) ===== */
const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
const sections = navLinks
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);
const spy = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting){
      const id = '#' + e.target.id;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => spy.observe(s));

/* ===== Form submit ===== */
function handleSubmit(){
  const form = document.querySelector('.contact-form');
  const name = form.querySelector('input[type="text"]').value.trim();
  const email = form.querySelector('input[type="email"]').value.trim();
  if (!name || !email){
    alert('Please add your name and email so Redwan can reply.');
    return;
  }
  alert('Thank you for your message! Redwan will get back to you soon.');
  form.querySelectorAll('input, textarea').forEach(f => f.value = '');
}

/* ===== Hero neural signature (one large interactive node web) ===== */
(function initNeural(){
  const canvas = document.getElementById('heroNeural');
  if (!canvas) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const ctx = canvas.getContext('2d');
  let w, h, dpr, nodes = [], raf, running = true;
  let colors = { node: 'rgba(120,235,170,0.95)', line: 'rgba(64,214,180,0.6)' };

  const MARGIN = 40;    // let the web bleed slightly past the edges (full-bleed look)
  const LINK   = 185;   // connection distance — tuned so the nodes form ONE mesh
  const GRAB   = 210;   // radius around the cursor that reacts
  const REACH  = 1.4;   // how strongly the point under the cursor is pulled to it
  const EASE   = 0.14;  // spring toward target (follow, then settle back)
  const pointer = { x: -9999, y: -9999, on: false };
  let rect = null;

  function readColors(){
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    colors = light
      ? { node: 'rgba(0,90,115,0.85)',  line: 'rgba(0,90,115,0.5)' }
      : { node: 'rgba(120,235,170,0.95)', line: 'rgba(64,214,180,0.6)' };
  }

  function resize(){
    // <canvas> is a replaced element, so the stylesheet's inset:0 can't stretch it.
    // Size it to its positioned host (the hero) so the web fills the background.
    if (getComputedStyle(canvas).display === 'none'){ w = h = 0; nodes = []; return; }
    const host = canvas.offsetParent || canvas.parentElement || canvas;
    const r = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rect = canvas.getBoundingClientRect();
    const fW = w + MARGIN * 2, fH = h + MARGIN * 2;
    const count = Math.min(120, Math.max(40, Math.round(fW * fH / 15000)));
    nodes = Array.from({ length: count }, () => {
      const z = Math.random();                       // depth 0..1 → subtle 3D layering
      const hx = Math.random() * fW - MARGIN;
      const hy = Math.random() * fH - MARGIN;
      return {
        hx, hy, x: hx, y: hy,                          // home (drifts) + rendered (springs)
        vx: (Math.random() - 0.5) * (0.12 + z * 0.22),
        vy: (Math.random() - 0.5) * (0.12 + z * 0.22),
        z, r: 0.8 + z * 2.6
      };
    });
  }

  function step(){
    ctx.clearRect(0, 0, w, h);

    // ambient drift of the home positions
    for (const n of nodes){
      n.hx += n.vx; n.hy += n.vy;
      if (n.hx < -MARGIN || n.hx > w + MARGIN) n.vx *= -1;
      if (n.hy < -MARGIN || n.hy > h + MARGIN) n.vy *= -1;
    }

    // pull the point(s) under the cursor toward it; the rest rests at home
    for (const n of nodes){
      let tx = n.hx, ty = n.hy;
      if (pointer.on){
        const dx = pointer.x - n.hx, dy = pointer.y - n.hy;
        const d = Math.hypot(dx, dy);
        if (d < GRAB){
          const s = Math.min(1, (1 - d / GRAB) * REACH); // nearest → reaches cursor, fades to 0 at GRAB
          tx = n.hx + dx * s;
          ty = n.hy + dy * s;
        }
      }
      n.x += (tx - n.x) * EASE;
      n.y += (ty - n.y) * EASE;
    }

    // links use rendered positions, so the web visibly stretches toward the cursor
    for (let i = 0; i < nodes.length; i++){
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++){
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < LINK){
          const depth = (a.z + b.z) * 0.5;
          ctx.globalAlpha = (1 - dist / LINK) * (0.22 + depth * 0.6);
          ctx.strokeStyle = colors.line;
          ctx.lineWidth = 0.6 + depth * 0.9;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    // nodes (nearer = larger + brighter)
    ctx.fillStyle = colors.node;
    for (const n of nodes){
      ctx.globalAlpha = 0.35 + n.z * 0.6;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (running) raf = requestAnimationFrame(step);
  }

  readColors(); resize(); step();
  window.__neural = { recolor: readColors };

  function setPointer(clientX, clientY){
    if (!rect) rect = canvas.getBoundingClientRect();
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;
    pointer.on = true;
  }
  window.addEventListener('mousemove', (e) => setPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('mouseout', () => { pointer.on = false; });
  window.addEventListener('blur',     () => { pointer.on = false; });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchend', () => { pointer.on = false; });

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
  window.addEventListener('scroll', () => { rect = canvas.getBoundingClientRect(); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running){ raf = requestAnimationFrame(step); } else { cancelAnimationFrame(raf); }
  });
})();
