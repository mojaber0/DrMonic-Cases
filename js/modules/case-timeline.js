// ════════════════════════════════════════════════
//  CASE TIMELINE (optional, per-case)
//  Lets you tell a case's story as an arrow of steps instead of long
//  prose: Symptoms → Day 1 → Day 3 → Day 7 → Interventions → Outcome.
//  Labels are free text — not required to be "days"; could be hours,
//  visits, anything. Fully optional: cases without a timeline just
//  don't show the button's badge.
//  Storage key: drmonic_timeline_<caseKey>  →  [{ id, label, text }]
// ════════════════════════════════════════════════

function tlKeyFor(c, idx) {
  return 'drmonic_timeline_' + (c && (c.id || c.createdAt) || idx);
}

function tlLoad(c, idx) {
  try { return JSON.parse(localStorage.getItem(tlKeyFor(c, idx))) || []; } catch (e) { return []; }
}
function tlSave(c, idx, steps) {
  safeLocalSet(tlKeyFor(c, idx), JSON.stringify(steps));
}

// Renders the small "Timeline" button + badge for the case-view toolbar.
// Call this after renderCaseView() builds the back-bar, or embed the
// returned HTML directly where you want the entry point to live.
function tlButtonHtml(idx) {
  const c = cases[idx];
  if (!c) return '';
  const steps = tlLoad(c, idx);
  const badge = steps.length ? ` <span class="tl-badge">${steps.length}</span>` : '';
  return `<button class="btn btn-ghost btn-sm" onclick="tlOpenModal(${idx})" title="عرض/تعديل الخط الزمني للحالة">🕒 Timeline${badge}</button>`;
}

function tlOpenModal(idx) {
  const c = cases[idx];
  if (!c) return;
  tlModalCaseIdx = idx;
  const steps = tlLoad(c, idx);
  const modal = document.getElementById('tlModal');
  modal.style.display = 'flex';
  tlRenderModalBody(steps);
}
let tlModalCaseIdx = null;

function tlRenderModalBody(steps) {
  const body = document.getElementById('tlModalBody');
  if (!steps.length) {
    body.innerHTML = `<div class="gam-empty">🕒 ما في خط زمني لهاي الحالة بعد — أضف أول خطوة (مثلاً: الأعراض، يوم 1، تدخل، نتيجة...)</div>`;
  } else {
    body.innerHTML = `<div class="tl-track">${steps.map((s, i) => `
      <div class="tl-step">
        <div class="tl-step-dot"></div>
        <div class="tl-step-card">
          <div class="tl-step-header">
            <input class="form-input tl-step-label" value="${esc(s.label)}" placeholder="مثلاً: يوم 1" oninput="tlUpdateStep(${i}, 'label', this.value)" />
            <button class="btn btn-ghost btn-sm" onclick="tlRemoveStep(${i})" title="حذف الخطوة">🗑️</button>
          </div>
          <textarea class="form-textarea" rows="2" placeholder="شو صار بهاي المرحلة؟" oninput="tlUpdateStep(${i}, 'text', this.value)">${esc(s.text)}</textarea>
        </div>
        ${i < steps.length - 1 ? '<div class="tl-arrow">→</div>' : ''}
      </div>`).join('')}</div>`;
  }
}

function tlGetCurrentSteps() {
  return tlLoad(cases[tlModalCaseIdx], tlModalCaseIdx);
}

function tlAddStep() {
  const steps = tlGetCurrentSteps();
  steps.push({ id: genId(), label: '', text: '' });
  tlSave(cases[tlModalCaseIdx], tlModalCaseIdx, steps);
  tlRenderModalBody(steps);
}

function tlUpdateStep(i, field, value) {
  const steps = tlGetCurrentSteps();
  if (!steps[i]) return;
  steps[i][field] = value;
  tlSave(cases[tlModalCaseIdx], tlModalCaseIdx, steps);
}

function tlRemoveStep(i) {
  const steps = tlGetCurrentSteps();
  steps.splice(i, 1);
  tlSave(cases[tlModalCaseIdx], tlModalCaseIdx, steps);
  tlRenderModalBody(steps);
}

function tlCloseModal() {
  document.getElementById('tlModal').style.display = 'none';
  // refresh the badge on the case-view toolbar button, if present
  const btn = document.getElementById('tlToolbarBtnWrap');
  if (btn && tlModalCaseIdx !== null) btn.innerHTML = tlButtonHtml(tlModalCaseIdx);
}

// Hook into renderCaseView (defined in cases.js) so the Timeline button
// in the case-view toolbar always reflects the case currently open,
// without modifying cases.js itself.
(function () {
  const _origRenderCaseView = renderCaseView;
  renderCaseView = function (idx) {
    _origRenderCaseView(idx);
    const wrap = document.getElementById('tlToolbarBtnWrap');
    if (wrap) wrap.innerHTML = tlButtonHtml(idx);
  };
})();
