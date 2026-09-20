// ════════════════════════════════════════════════
//  GLOBAL "SELECT → BOLD" FLOATING BUTTON
//  Select text inside any textarea/text input anywhere on the site →
//  a small floating "B" button appears → click wraps the selection in
//  **...** (the existing hl() renderer already turns that into <strong>).
// ════════════════════════════════════════════════
let globalBoldTarget = null;
function ensureGlobalBoldBtn() {
  let btn = document.getElementById('globalBoldFloatBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'globalBoldFloatBtn';
    btn.type = 'button';
    btn.textContent = 'B';
    btn.title = 'Bold — **نص عريض**';
    btn.addEventListener('mousedown', (e) => { e.preventDefault(); applyGlobalBold(); });
    document.body.appendChild(btn);
  }
  return btn;
}
function applyGlobalBold() {
  const el = globalBoldTarget;
  if (!el) return;
  const start = el.selectionStart, end = el.selectionEnd;
  if (start == null || start === end) return;
  const val = el.value;
  const selected = val.slice(start, end);
  const wrapped = `**${selected}**`;
  el.value = val.slice(0, start) + wrapped + val.slice(end);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.focus();
  el.setSelectionRange(start, start + wrapped.length);
  hideGlobalBoldBtn();
}
function hideGlobalBoldBtn() {
  const btn = document.getElementById('globalBoldFloatBtn');
  if (btn) btn.style.display = 'none';
  globalBoldTarget = null;
}
document.addEventListener('mouseup', (e) => {
  if (e.target && e.target.id === 'globalBoldFloatBtn') return;
  const field = e.target.closest && e.target.closest('textarea, input[type="text"], input:not([type])');
  if (!field) { hideGlobalBoldBtn(); return; }
  setTimeout(() => {
    if (field.selectionStart === field.selectionEnd) { hideGlobalBoldBtn(); return; }
    globalBoldTarget = field;
    const btn = ensureGlobalBoldBtn();
    btn.style.display = 'block';
    btn.style.left = (e.pageX + 8) + 'px';
    btn.style.top = (e.pageY - 36) + 'px';
  }, 0);
});
document.addEventListener('scroll', hideGlobalBoldBtn, true);
document.addEventListener('keyup', (e) => {
  const field = e.target.closest && e.target.closest('textarea, input[type="text"], input:not([type])');
  if (!field || field.selectionStart === field.selectionEnd) hideGlobalBoldBtn();
});

