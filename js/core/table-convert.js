// ════════════════════════════════════════════════
//  GLOBAL: SELECTION → TABLE (works anywhere on the site —
//  case fields, notes, any textarea/input, or plain read-only text)
// ════════════════════════════════════════════════
let tableConvertSource = null; // { kind:'field', el, start, end, raw } | { kind:'text', raw }

function isTablishText(raw) {
  if (!raw) return false;
  const lines = raw.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const pipeLines = lines.filter(l => l.includes('|'));
  if (pipeLines.length < 2) return false;
  const sepRe = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/;
  return lines.some(l => sepRe.test(l));
}

function parseMarkdownTable(raw) {
  const lines = raw.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  const sepRe = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/;
  const splitRow = l => {
    let s = l.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);
    return s.split('|').map(c => c.trim());
  };
  const rows = lines.filter(l => !sepRe.test(l)).map(splitRow);
  if (!rows.length) return null;
  const header = rows[0];
  const body = rows.slice(1);
  const colCount = Math.max(header.length, ...body.map(r => r.length), 1);
  const pad = r => { const c = r.slice(); while (c.length < colCount) c.push(''); return c; };
  return { header: pad(header), body: body.map(pad) };
}

function getFieldSelection(el) {
  if (!el) return null;
  const tag = (el.tagName || '').toUpperCase();
  const isTextField = tag === 'TEXTAREA' || (tag === 'INPUT' && /^(text|search|url|tel)?$/i.test(el.type || 'text'));
  if (!isTextField) return null;
  const start = el.selectionStart, end = el.selectionEnd;
  if (start == null || end == null || start === end) return null;
  return { start, end, raw: el.value.slice(start, end) };
}

function handleGlobalSelectionForTable(e) {
  const btn = document.getElementById('tableConvertBtn');
  if (!btn) return;
  const active = document.activeElement;
  const fieldSel = getFieldSelection(active);
  let raw = '';
  if (fieldSel) raw = fieldSel.raw;
  else raw = (window.getSelection ? window.getSelection().toString() : '');

  if (!isTablishText(raw)) {
    btn.classList.remove('show');
    tableConvertSource = null;
    return;
  }

  tableConvertSource = fieldSel
    ? { kind: 'field', el: active, start: fieldSel.start, end: fieldSel.end, raw }
    : { kind: 'text', raw };

  const x = e && e.clientX != null ? e.clientX : (window.innerWidth / 2);
  const y = e && e.clientY != null ? e.clientY : (window.innerHeight / 2);
  btn.style.left = Math.min(Math.max(x, 80), window.innerWidth - 80) + 'px';
  btn.style.top = Math.max(y - 8, 50) + 'px';
  btn.classList.add('show');
}

function hideTableConvertBtn() {
  const btn = document.getElementById('tableConvertBtn');
  if (btn) btn.classList.remove('show');
}

document.addEventListener('mouseup', e => {
  if (e.target.closest('#tableConvertBtn')) return;
  setTimeout(() => handleGlobalSelectionForTable(e), 0);
});
document.addEventListener('touchend', e => {
  const t = e.changedTouches && e.changedTouches[0];
  setTimeout(() => handleGlobalSelectionForTable(t || {}), 0);
});
document.addEventListener('scroll', hideTableConvertBtn, true);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideTableConvertBtn(); closeTableConvertModal(); }
});

let _lastParsedTable = null;

function openTableConvertModal() {
  if (!tableConvertSource) return;
  const parsed = parseMarkdownTable(tableConvertSource.raw);
  if (!parsed) { showToast('⚠️ ما قدرت أفهم شكل الجدول'); return; }
  _lastParsedTable = parsed;

  const table = document.getElementById('tableConvertHtml');
  table.innerHTML = `
    <thead><tr>${parsed.header.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${parsed.body.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
  `;

  const replaceBtn = document.getElementById('tableConvertReplaceBtn');
  replaceBtn.style.display = tableConvertSource.kind === 'field' ? 'inline-flex' : 'none';

  hideTableConvertBtn();
  document.getElementById('tableConvertOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTableConvertModal() {
  const ov = document.getElementById('tableConvertOverlay');
  if (ov) ov.classList.remove('open');
  document.body.style.overflow = '';
}

function buildAlignedPlainTable(parsed) {
  const cols = parsed.header.length;
  const widths = new Array(cols).fill(0);
  const allRows = [parsed.header, ...parsed.body];
  allRows.forEach(r => r.forEach((c, i) => { widths[i] = Math.max(widths[i], (c || '').length); }));
  const padRow = r => '| ' + r.map((c, i) => (c || '').padEnd(widths[i], ' ')).join(' | ') + ' |';
  const sepRow = '| ' + widths.map(w => '-'.repeat(Math.max(w, 3))).join(' | ') + ' |';
  return [padRow(parsed.header), sepRow, ...parsed.body.map(padRow)].join('\n');
}

function buildMarkdownTable(parsed) {
  const row = r => '| ' + r.join(' | ') + ' |';
  const sep = '| ' + parsed.header.map(() => '---').join(' | ') + ' |';
  return [row(parsed.header), sep, ...parsed.body.map(row)].join('\n');
}

async function copyTableConvertMarkdown() {
  if (!_lastParsedTable) return;
  try {
    await navigator.clipboard.writeText(buildMarkdownTable(_lastParsedTable));
    showToast('📋 اتنسخ الجدول بصيغة Markdown');
  } catch { showToast('⚠️ تعذّر النسخ'); }
}

async function copyTableConvertPlain() {
  if (!_lastParsedTable) return;
  try {
    await navigator.clipboard.writeText(buildAlignedPlainTable(_lastParsedTable));
    showToast('📋 اتنسخ الجدول كنص منظم');
  } catch { showToast('⚠️ تعذّر النسخ'); }
}

function applyTableConvertReplace() {
  if (!tableConvertSource || tableConvertSource.kind !== 'field' || !_lastParsedTable) return;
  const { el, start, end } = tableConvertSource;
  const aligned = buildAlignedPlainTable(_lastParsedTable);
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  el.value = before + aligned + after;
  const newPos = (before + aligned).length;
  el.setSelectionRange(newPos, newPos);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.focus();
  closeTableConvertModal();
  showToast('✅ تم استبدال النص بجدول منظم');
}
