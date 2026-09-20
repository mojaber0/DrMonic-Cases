// ════════════════════════════════════════════════
//  THEME  — cycles: dark → light → warm (daytime) → night (calm) → dark
// ════════════════════════════════════════════════
const THEME_ORDER = ['dark', 'light', 'warm', 'night', 'ocean', 'nebula', 'clinical'];
const THEME_ICONS = { dark: '🌙', light: '☀️', warm: '🌤️', night: '🌌', ocean: '🌊', nebula: '🪐', clinical: '✨' };
const THEME_NAMES = { dark: 'داكن', light: 'فاتح', warm: 'دافئ نهاري', night: 'ليلي هادئ', ocean: 'محيطي أزرق', nebula: 'سديمي بنفسجي', clinical: 'عصري تجريبي ✨' };
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = THEME_ICONS[t] || '🌙';
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.title = 'الثيم الحالي: ' + (THEME_NAMES[t] || t) + ' (اضغط للتبديل)';
  localStorage.setItem('drmonic_theme', t);
}
function toggleHeaderMoreMenu(event) {
  event.stopPropagation();
  document.getElementById('headerMoreMenu').classList.toggle('open');
}
function closeHeaderMoreMenu() {
  document.getElementById('headerMoreMenu')?.classList.remove('open');
}
document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.header-more-wrap');
  if (wrap && !wrap.contains(e.target)) closeHeaderMoreMenu();
});

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
  applyTheme(next);
}
(function initTheme() {
  const t = localStorage.getItem('drmonic_theme') || 'dark';
  applyTheme(THEME_ORDER.includes(t) ? t : 'dark');
  if (localStorage.getItem('drmonic_light_icons') === '1') {
    document.documentElement.classList.add('icons-light');
  }
})();
function toggleLightIcons(checked) {
  document.documentElement.classList.toggle('icons-light', !!checked);
  localStorage.setItem('drmonic_light_icons', checked ? '1' : '0');
}

