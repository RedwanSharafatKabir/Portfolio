// Theme toggle
let isDark = true;
function toggleTheme(){
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.getElementById('themeBtn').children[0].textContent = isDark ? '🌙' : '☀️';
  document.getElementById('themeLabel').textContent = isDark ? 'Dark' : 'Light';
  document.getElementById('mobileThemeIcon').textContent = isDark ? '🌙' : '☀️';
  document.getElementById('mobileThemeLabel').textContent = isDark ? 'Switch to Light' : 'Switch to Dark';
}

// Mobile menu
let menuOpen = false;
function toggleMenu(){
  menuOpen = !menuOpen;
  document.getElementById('mobileMenu').classList.toggle('open', menuOpen);
}
function closeMenu(){
  menuOpen = false;
  document.getElementById('mobileMenu').classList.remove('open');
}

// Scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, {threshold:0.1});
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Form submit
function handleSubmit(){
  alert('Thank you for your message! Redwan will get back to you soon.');
}

// Close menu on resize
window.addEventListener('resize', () => {
  if(window.innerWidth > 900) closeMenu();
});
