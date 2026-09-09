// ════════════════════════════════════════════════
//  DRUG INTERACTIONS CHECKER
//  Quick cross-checker for hospital rounds / exam prep: pick 2+ drugs,
//  see color-coded interaction cards (🔴 Critical / 🟡 Caution / 🟢 Safe).
//  The admin builds the drugs/interactions matrix by hand or via
//  JSON/CSV upload (see INTX_CSV_HEADERS below for the expected columns).
// ════════════════════════════════════════════════
const INTX_STORAGE_KEY = 'drmonic_intx_data';
const INTX_CSV_HEADERS = 'drug_a,drug_b,severity_level,severity_label,title,mechanism,clinical_effect,action_required';
let intxData = { drugs: [], interactions: [] };
let intxSelected = [];

function intxLoadData() {
  try { intxData = JSON.parse(localStorage.getItem(INTX_STORAGE_KEY)) || { drugs: [], interactions: [] }; }
  catch (e) { intxData = { drugs: [], interactions: [] }; }
  if (!Array.isArray(intxData.drugs)) intxData.drugs = [];
  if (!Array.isArray(intxData.interactions)) intxData.interactions = [];
}
function intxSaveData() {
  return safeLocalSet(INTX_STORAGE_KEY, JSON.stringify(intxData));
}

function showInteractionsView() {
  hideAllViews();
  document.getElementById('interactionsView').classList.add('active');
  intxLoadData();
  intxSelected = intxLoadLastSelection().filter(name => intxData.drugs.some(d => d.generic_name === name));
  renderIntxChecker();
  if (intxSelected.length >= 2) intxCheckInteractions();
}

function intxLoadLastSelection() {
  try { return JSON.parse(localStorage.getItem('drmonic_intx_last_selection')) || []; }
  catch (e) { return []; }
}
function intxSaveLastSelection() {
  safeLocalSet('drmonic_intx_last_selection', JSON.stringify(intxSelected));
}

function intxRenderChecker() { renderIntxChecker(); } // alias safety

function renderIntxChecker() {
  const area = document.getElementById('intxCheckerArea');
  if (!intxData.drugs.length) {
    area.innerHTML = `<div class="notes-empty"><div class="icon">💊</div><h3>لا توجد أدوية مسجّلة بعد</h3><p>أضف أدوية وتفاعلات من "⚙️ إدارة البيانات"</p></div>`;
    return;
  }
  const chips = intxSelected.map(name => `
    <span class="pharma-trade-chip" style="cursor:pointer;font-size:0.85rem;padding:5px 12px;" onclick="intxToggleDrug('${name.replace(/'/g,"\\'")}')">${esc(name)} ✕</span>`).join('');
  const availableOptions = intxData.drugs
    .filter(d => !intxSelected.includes(d.generic_name))
    .sort((a, b) => a.generic_name.localeCompare(b.generic_name))
    .map(d => `<option value="${esc(d.generic_name)}">${esc(d.generic_name)}${d.category ? ' — ' + esc(d.category) : ''}</option>`).join('');
  area.innerHTML = `
    <div class="pharma-box" style="background:var(--bg2);border-color:var(--border);">
      <div class="ecg-field" style="margin-bottom:10px;">
        <label class="ecg-label">🔎 اختر دواءين أو أكثر للفحص</label>
        <select class="form-input" id="intxAddSelect" onchange="if(this.value){intxToggleDrug(this.value);}">
          <option value="">➕ أضف دواء من القائمة...</option>
          ${availableOptions}
        </select>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;min-height:32px;">${chips || '<span style="color:var(--text2);font-size:0.85rem;">لم تختر أي دواء بعد</span>'}</div>
      <div class="hx-save-bar" style="margin-top:14px;">
        <button class="btn btn-primary" onclick="intxCheckInteractions()" ${intxSelected.length < 2 ? 'disabled' : ''}>🔀 Check Interactions</button>
        <button class="btn btn-ghost" onclick="intxSelected=[];intxSaveLastSelection();renderIntxChecker();document.getElementById('intxResultsArea').innerHTML='';">مسح الاختيار</button>
      </div>
    </div>
    <div id="intxResultsArea" style="margin-top:20px;"></div>`;
}

function intxToggleDrug(name) {
  const idx = intxSelected.indexOf(name);
  if (idx >= 0) intxSelected.splice(idx, 1); else intxSelected.push(name);
  intxSaveLastSelection();
  renderIntxChecker();
  if (intxSelected.length >= 2) intxCheckInteractions();
  else { const r = document.getElementById('intxResultsArea'); if (r) r.innerHTML = ''; }
}

const INTX_SEVERITY_STYLE = {
  RED:    { bg: 'linear-gradient(135deg,#7f1d1d,#450a0a)', border: '#ef4444', label: '🔴 Critical Warning' },
  YELLOW: { bg: 'linear-gradient(135deg,#78350f,#451a03)', border: '#f59e0b', label: '🟡 Caution / Monitor' },
  GREEN:  { bg: 'linear-gradient(135deg,#14532d,#052e16)', border: '#22c55e', label: '🟢 Safe Combo' },
};

function intxFindInteraction(a, b) {
  return intxData.interactions.find(i =>
    (i.drug_a.toLowerCase() === a.toLowerCase() && i.drug_b.toLowerCase() === b.toLowerCase()) ||
    (i.drug_a.toLowerCase() === b.toLowerCase() && i.drug_b.toLowerCase() === a.toLowerCase()));
}

function intxCheckInteractions() {
  const resultsArea = document.getElementById('intxResultsArea');
  const pairs = [];
  for (let i = 0; i < intxSelected.length; i++) {
    for (let j = i + 1; j < intxSelected.length; j++) pairs.push([intxSelected[i], intxSelected[j]]);
  }
  resultsArea.innerHTML = pairs.map(([a, b]) => {
    const found = intxFindInteraction(a, b);
    if (!found) {
      return `<div class="pharma-box" style="border:1px solid var(--border);background:var(--bg2);">
        <div class="pharma-box-title">⚪ ${esc(a)} × ${esc(b)}</div>
        <div class="pharma-box-body" style="color:var(--text2);">لا يوجد تفاعل مسجّل بين هذين الدوائين بقاعدة البيانات الحالية.</div>
      </div>`;
    }
    const style = INTX_SEVERITY_STYLE[found.severity_level] || INTX_SEVERITY_STYLE.YELLOW;
    return `<div class="pharma-box" style="background:${style.bg};border:1px solid ${style.border};color:#fff;">
      <div class="pharma-box-title" style="color:#fff;">${style.label} — ${esc(a)} × ${esc(b)}</div>
      <div style="font-weight:700;margin-bottom:6px;">${esc(found.title || '')}</div>
      ${found.mechanism ? `<div style="margin-bottom:6px;"><strong>Mechanism:</strong> ${esc(found.mechanism)}</div>` : ''}
      ${found.clinical_effect ? `<div style="margin-bottom:6px;"><strong>Clinical Effect:</strong> ${esc(found.clinical_effect)}</div>` : ''}
      ${found.action_required ? `<div><strong>Action Required:</strong> ${esc(found.action_required)}</div>` : ''}
      ${found.last_reviewed ? `<div style="margin-top:8px;font-size:0.75rem;opacity:0.85;">${esc(timeAgo(found.last_reviewed))}</div>` : ''}
    </div>`;
  }).join('');
}

function intxOpenAdmin() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.classList.add('open');
  const drugsListHtml = intxData.drugs.map(d => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">
      <span>${esc(d.generic_name)} <span style="color:var(--text2);font-size:0.78rem;">(${esc(d.category || '')})</span></span>
      <button class="btn btn-ghost btn-sm" style="padding:2px 8px;color:var(--red);" onclick="intxDeleteDrug('${d.id}')">🗑️</button>
    </div>`).join('') || '<div style="color:var(--text2);">لا يوجد أدوية بعد</div>';
  const interactionsListHtml = intxData.interactions.map(i => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">
      <span>${esc(i.drug_a)} × ${esc(i.drug_b)} — ${i.severity_level} ${i.last_reviewed ? '· ' + esc(timeAgo(i.last_reviewed)) : ''}</span>
      <button class="btn btn-ghost btn-sm" style="padding:2px 8px;color:var(--red);" onclick="intxDeleteInteraction('${i.id}')">🗑️</button>
    </div>`).join('') || '<div style="color:var(--text2);">لا يوجد تفاعلات مسجّلة بعد</div>';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:720px;max-height:85vh;overflow-y:auto;">
      <h3 style="margin-bottom:12px;">⚙️ إدارة بيانات التفاعلات الدوائية</h3>

      <div class="ecg-field"><label class="ecg-label">➕ إضافة دواء</label>
        <div style="display:flex;gap:8px;">
          <input class="form-input" id="intxNewDrugName" placeholder="Generic Name" />
          <input class="form-input" id="intxNewDrugCategory" placeholder="Category" />
          <button class="btn btn-primary btn-sm" onclick="intxAddDrug()">إضافة</button>
        </div>
      </div>

      <div class="ecg-field"><label class="ecg-label">➕ ربط تفاعل بين دواءين</label>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;gap:8px;">
            <input class="form-input" id="intxNewA" placeholder="Drug A" />
            <input class="form-input" id="intxNewB" placeholder="Drug B" />
            <select class="xray-category-select" id="intxNewSeverity">
              <option value="RED">🔴 RED</option>
              <option value="YELLOW">🟡 YELLOW</option>
              <option value="GREEN">🟢 GREEN</option>
            </select>
          </div>
          <input class="form-input" id="intxNewTitle" placeholder="Title (e.g. Severe Hyperkalemia Risk 🩸)" />
          <textarea class="form-textarea" id="intxNewMechanism" rows="2" placeholder="Mechanism"></textarea>
          <textarea class="form-textarea" id="intxNewEffect" rows="2" placeholder="Clinical Effect"></textarea>
          <textarea class="form-textarea" id="intxNewAction" rows="2" placeholder="Action Required"></textarea>
          <button class="btn btn-primary btn-sm" onclick="intxAddInteraction()">إضافة التفاعل</button>
        </div>
      </div>

      <div class="ecg-field"><label class="ecg-label">📁 رفع ملف JSON أو CSV (يدمج مع البيانات الحالية)</label>
        <p style="color:var(--text2);font-size:0.78rem;margin-bottom:6px;">أعمدة الـ CSV المتوقعة: <code>${INTX_CSV_HEADERS}</code></p>
        <input type="file" accept=".json,.csv" onchange="intxHandleFileUpload(this.files)" />
      </div>

      <h4 style="margin-top:16px;">💊 الأدوية المسجّلة (${intxData.drugs.length})</h4>
      <div style="max-height:160px;overflow-y:auto;">${drugsListHtml}</div>

      <h4 style="margin-top:16px;">🔀 التفاعلات المسجّلة (${intxData.interactions.length})</h4>
      <div style="max-height:200px;overflow-y:auto;">${interactionsListHtml}</div>

      <div class="hx-save-bar"><button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove();renderIntxChecker();">إغلاق</button></div>
    </div>`;
  document.body.appendChild(modal);
}

function intxAddDrug() {
  const name = document.getElementById('intxNewDrugName').value.trim();
  if (!name) return;
  intxData.drugs.push({ id: genId(), generic_name: name, category: document.getElementById('intxNewDrugCategory').value.trim() });
  intxSaveData();
  showToast('✅ تمت إضافة الدواء');
  document.querySelector('.modal-overlay')?.remove();
  intxOpenAdmin();
}

function intxDeleteDrug(id) {
  intxData.drugs = intxData.drugs.filter(d => d.id !== id);
  intxSaveData();
  document.querySelector('.modal-overlay')?.remove();
  intxOpenAdmin();
}

function intxAddInteraction() {
  const drug_a = document.getElementById('intxNewA').value.trim();
  const drug_b = document.getElementById('intxNewB').value.trim();
  if (!drug_a || !drug_b) return;
  intxData.interactions.push({
    id: genId(), drug_a, drug_b,
    severity_level: document.getElementById('intxNewSeverity').value,
    title: document.getElementById('intxNewTitle').value.trim(),
    mechanism: document.getElementById('intxNewMechanism').value.trim(),
    clinical_effect: document.getElementById('intxNewEffect').value.trim(),
    action_required: document.getElementById('intxNewAction').value.trim(),
    last_reviewed: new Date().toISOString(),
  });
  intxSaveData();
  showToast('✅ تمت إضافة التفاعل');
  document.querySelector('.modal-overlay')?.remove();
  intxOpenAdmin();
}

function intxDeleteInteraction(id) {
  intxData.interactions = intxData.interactions.filter(i => i.id !== id);
  intxSaveData();
  document.querySelector('.modal-overlay')?.remove();
  intxOpenAdmin();
}

function intxHandleFileUpload(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        const obj = JSON.parse(e.target.result);
        (obj.drugs || []).forEach(d => {
          if (!intxData.drugs.some(x => x.generic_name.toLowerCase() === (d.generic_name || '').toLowerCase())) {
            intxData.drugs.push({ id: d.id || genId(), generic_name: d.generic_name, category: d.category || '' });
          }
        });
        (obj.interactions || []).forEach(i => {
          intxData.interactions.push({ ...i, id: i.id || genId(), last_reviewed: i.last_reviewed || new Date().toISOString() });
        });
      } else {
        const rows = parseCSV(e.target.result);
        rows.forEach(r => {
          intxData.interactions.push({
            id: genId(), drug_a: r.drug_a, drug_b: r.drug_b,
            severity_level: (r.severity_level || 'YELLOW').toUpperCase(),
            severity_label: r.severity_label || '', title: r.title || '',
            mechanism: r.mechanism || '', clinical_effect: r.clinical_effect || '',
            action_required: r.action_required || '', last_reviewed: new Date().toISOString(),
          });
          [r.drug_a, r.drug_b].forEach(name => {
            if (name && !intxData.drugs.some(x => x.generic_name.toLowerCase() === name.toLowerCase())) {
              intxData.drugs.push({ id: genId(), generic_name: name, category: '' });
            }
          });
        });
      }
      intxSaveData();
      showToast('✅ تم استيراد البيانات');
      document.querySelector('.modal-overlay')?.remove();
      intxOpenAdmin();
    } catch (err) {
      showToast('⚠️ تعذّرت قراءة الملف — تأكد من الصيغة');
    }
  };
  reader.readAsText(file);
}

