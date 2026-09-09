// ════════════════════════════════════════════════
//  COMPARE HEAD-TO-HEAD (DIFFERENTIALS)
//  Two searchable pickers + "Compare Head-to-Head ⚔️" → clean comparison
//  table. Content is supplied entirely by the user via CSV upload
//  (differential_comparisons_comprehensive.csv) or manual entry.
// ════════════════════════════════════════════════
const CMP_STORAGE_KEY = 'drmonic_cmp_data';
const CMP_CSV_HEADERS = 'Category,Item A,Item B,Key Differentiator,Pathology Location,Clinical Features,Diagnostic Test,Management Difference';
let cmpData = { rows: [] };
let cmpPickA = null;
let cmpPickB = null;

function cmpLoadData() {
  try { cmpData = JSON.parse(localStorage.getItem(CMP_STORAGE_KEY)) || { rows: [] }; }
  catch (e) { cmpData = { rows: [] }; }
  if (!Array.isArray(cmpData.rows)) cmpData.rows = [];
}
function cmpSaveData() {
  return safeLocalSet(CMP_STORAGE_KEY, JSON.stringify(cmpData));
}

function showCompareView() {
  hideAllViews();
  document.getElementById('compareView').classList.add('active');
  cmpLoadData();
  const saved = cmpLoadLastPick();
  cmpPickA = saved.a || null;
  cmpPickB = saved.b || null;
  renderCmpPicker();
  if (cmpPickA && cmpPickB) cmpRunCompare();
}

function cmpLoadLastPick() {
  try { return JSON.parse(localStorage.getItem('drmonic_cmp_last_pick')) || {}; }
  catch (e) { return {}; }
}
function cmpSaveLastPick() {
  safeLocalSet('drmonic_cmp_last_pick', JSON.stringify({ a: cmpPickA, b: cmpPickB }));
}

function cmpAllItemNames() {
  const set = new Set();
  cmpData.rows.forEach(r => { if (r.item_a) set.add(r.item_a); if (r.item_b) set.add(r.item_b); });
  return [...set].sort();
}

function cmpOptionsHtml(selected) {
  const byCategory = {};
  cmpData.rows.forEach(r => {
    [r.item_a, r.item_b].forEach(name => {
      if (!name) return;
      const cat = r.category || 'أخرى';
      if (!byCategory[cat]) byCategory[cat] = new Set();
      byCategory[cat].add(name);
    });
  });
  const cats = Object.keys(byCategory).sort();
  let html = `<option value="">— اختر —</option>`;
  cats.forEach(cat => {
    html += `<optgroup label="${esc(cat)}">`;
    [...byCategory[cat]].sort().forEach(name => {
      html += `<option value="${esc(name)}" ${selected === name ? 'selected' : ''}>${esc(name)}</option>`;
    });
    html += `</optgroup>`;
  });
  return html;
}

function renderCmpPicker() {
  const area = document.getElementById('cmpArea');
  if (!cmpData.rows.length) {
    area.innerHTML = `<div class="notes-empty"><div class="icon">⚔️</div><h3>لا توجد مقارنات محفوظة بعد</h3><p>ارفع ملف CSV من "⚙️ إدارة البيانات" لتفعيل قائمة المقارنة</p></div>`;
    return;
  }
  area.innerHTML = `
    <div class="pharma-box" style="background:var(--bg2);border-color:var(--border);">
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">
        <div class="ecg-field" style="flex:1;min-width:220px;margin-bottom:0;">
          <label class="ecg-label">العنصر الأول</label>
          <select class="form-input" id="cmpInputA" onchange="cmpPickA=this.value;cmpSaveLastPick();">${cmpOptionsHtml(cmpPickA)}</select>
        </div>
        <div style="font-size:1.6rem;padding-bottom:10px;">⚔️</div>
        <div class="ecg-field" style="flex:1;min-width:220px;margin-bottom:0;">
          <label class="ecg-label">العنصر الثاني</label>
          <select class="form-input" id="cmpInputB" onchange="cmpPickB=this.value;cmpSaveLastPick();">${cmpOptionsHtml(cmpPickB)}</select>
        </div>
        <button class="btn btn-primary" onclick="cmpRunCompare()">Compare Head-to-Head ⚔️</button>
      </div>
    </div>
    <div id="cmpResultArea"></div>`;
}

function cmpFindRow(a, b) {
  return cmpData.rows.find(r =>
    (r.item_a.toLowerCase() === a.toLowerCase() && r.item_b.toLowerCase() === b.toLowerCase()) ||
    (r.item_a.toLowerCase() === b.toLowerCase() && r.item_b.toLowerCase() === a.toLowerCase()));
}

function cmpRunCompare() {
  const a = (document.getElementById('cmpInputA').value || '').trim();
  const b = (document.getElementById('cmpInputB').value || '').trim();
  const resultArea = document.getElementById('cmpResultArea');
  if (!a || !b) { resultArea.innerHTML = `<div style="color:var(--text2);padding:14px 4px;">اختر عنصرين للمقارنة</div>`; return; }
  const row = cmpFindRow(a, b);
  if (!row) {
    resultArea.innerHTML = `<div class="pharma-box" style="border:1px solid var(--border);background:var(--bg2);margin-top:16px;"><div class="pharma-box-body" style="color:var(--text2);">ما في مقارنة محفوظة بين "${esc(a)}" و"${esc(b)}" — أضفها من "⚙️ إدارة البيانات".</div></div>`;
    return;
  }
  const flip = row.item_a.toLowerCase() !== a.toLowerCase();
  const left = flip ? row.item_b : row.item_a;
  const right = flip ? row.item_a : row.item_b;
  const rows = [
    ['⚔️ الفرق الفاصل (Key Differentiator)', row.key_differentiator],
    ['📍 مكان المرض / الآلية', row.location],
    ['🩺 الأعراض والمظاهر السريرية', row.features],
    ['🧪 الفحص التشخيصي الفاصل', row.diagnostic_test],
    ['💊 الفرق بالعلاج', row.management],
  ];
  resultArea.innerHTML = `
    <div style="overflow-x:auto;background:var(--bg2);border:1px solid var(--border);border-radius:18px;padding:18px 20px;margin-top:16px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:right;padding:10px;border-bottom:2px solid var(--border);width:22%;">${row.category ? esc(row.category) : ''}</th>
            <th style="text-align:right;padding:10px;border-bottom:2px solid var(--border);color:var(--purple);">${esc(left)}</th>
            <th style="text-align:right;padding:10px;border-bottom:2px solid var(--border);color:#ec4899;">${esc(right)}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(([label, val]) => {
            if (!val) return '';
            const parts = val.split(/\s+VS\s+/i);
            const leftVal = parts[0] || '';
            const rightVal = parts[1] || '';
            return `<tr>
              <td style="padding:10px;border-bottom:1px solid var(--border);font-weight:700;">${label}</td>
              <td style="padding:10px;border-bottom:1px solid var(--border);">${esc(leftVal)}</td>
              <td style="padding:10px;border-bottom:1px solid var(--border);">${esc(rightVal)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      ${row.last_reviewed ? `<div style="margin-top:10px;color:var(--text2);font-size:0.8rem;">${esc(timeAgo(row.last_reviewed))}</div>` : ''}
    </div>`;
}

function cmpOpenAdmin() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.classList.add('open');
  const rowsHtml = cmpData.rows.map(r => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">
      <span>${esc(r.item_a)} × ${esc(r.item_b)} ${r.last_reviewed ? '· ' + esc(timeAgo(r.last_reviewed)) : ''}</span>
      <button class="btn btn-ghost btn-sm" style="padding:2px 8px;color:var(--red);" onclick="cmpDeleteRow('${r.id}')">🗑️</button>
    </div>`).join('') || '<div style="color:var(--text2);">لا توجد مقارنات محفوظة بعد</div>';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:720px;max-height:85vh;overflow-y:auto;">
      <h3 style="margin-bottom:12px;">⚙️ إدارة بيانات المقارنات (Differentials)</h3>
      <div class="ecg-field"><label class="ecg-label">📁 رفع ملف CSV (يُضاف للبيانات الحالية)</label>
        <p style="color:var(--text2);font-size:0.78rem;margin-bottom:6px;">أعمدة الـ CSV المتوقعة: <code>${CMP_CSV_HEADERS}</code><br/>ملاحظة: كل عمود يقدر يحتوي القيمتين مفصولتين بكلمة <code>VS</code> ليتوزعوا تلقائيًا يمين/يسار الجدول.</p>
        <input type="file" accept=".csv" onchange="cmpHandleFileUpload(this.files)" />
      </div>
      <div class="ecg-field"><label class="ecg-label">➕ إضافة مقارنة يدويًا</label>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;gap:8px;">
            <input class="form-input" id="cmpNewCategory" placeholder="Category" />
            <input class="form-input" id="cmpNewA" placeholder="Item A" />
            <input class="form-input" id="cmpNewB" placeholder="Item B" />
          </div>
          <input class="form-input" id="cmpNewDiff" placeholder="Key Differentiator (A ... VS B ...)" />
          <input class="form-input" id="cmpNewLoc" placeholder="Pathology Location (A ... VS B ...)" />
          <input class="form-input" id="cmpNewFeat" placeholder="Clinical Features (A ... VS B ...)" />
          <input class="form-input" id="cmpNewTest" placeholder="Diagnostic Test (A ... VS B ...)" />
          <input class="form-input" id="cmpNewMgmt" placeholder="Management Difference (A ... VS B ...)" />
          <button class="btn btn-primary btn-sm" onclick="cmpAddRow()">إضافة المقارنة</button>
        </div>
      </div>
      <h4 style="margin-top:16px;">⚔️ المقارنات المحفوظة (${cmpData.rows.length})</h4>
      <div style="max-height:220px;overflow-y:auto;">${rowsHtml}</div>
      <div class="hx-save-bar"><button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove();renderCmpPicker();">إغلاق</button></div>
    </div>`;
  document.body.appendChild(modal);
}

function cmpAddRow() {
  const item_a = document.getElementById('cmpNewA').value.trim();
  const item_b = document.getElementById('cmpNewB').value.trim();
  if (!item_a || !item_b) return;
  cmpData.rows.push({
    id: genId(),
    category: document.getElementById('cmpNewCategory').value.trim(),
    item_a, item_b,
    key_differentiator: document.getElementById('cmpNewDiff').value.trim(),
    location: document.getElementById('cmpNewLoc').value.trim(),
    features: document.getElementById('cmpNewFeat').value.trim(),
    diagnostic_test: document.getElementById('cmpNewTest').value.trim(),
    management: document.getElementById('cmpNewMgmt').value.trim(),
    last_reviewed: new Date().toISOString(),
  });
  cmpSaveData();
  showToast('✅ تمت إضافة المقارنة');
  document.querySelector('.modal-overlay')?.remove();
  cmpOpenAdmin();
}

function cmpDeleteRow(id) {
  cmpData.rows = cmpData.rows.filter(r => r.id !== id);
  cmpSaveData();
  document.querySelector('.modal-overlay')?.remove();
  cmpOpenAdmin();
}

function cmpHandleFileUpload(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const rows = parseCSV(e.target.result);
      rows.forEach(r => {
        cmpData.rows.push({
          id: genId(),
          category: r['Category'] || '',
          item_a: r['Item A'] || '',
          item_b: r['Item B'] || '',
          key_differentiator: r['Key Differentiator ⚔️ (الفرق الفاصل)'] || r['Key Differentiator'] || '',
          location: r['Pathology Location (مكان المرض)'] || r['Pathology Location'] || '',
          features: r['Clinical Features (الأعراض والمظاهر السريرية)'] || r['Clinical Features'] || '',
          diagnostic_test: r['Diagnostic Test (الفحص التشخيصي الفاصل)'] || r['Diagnostic Test'] || '',
          management: r['Management Difference (الفرق بالعلاج)'] || r['Management Difference'] || '',
          last_reviewed: new Date().toISOString(),
        });
      });
      cmpSaveData();
      showToast('✅ تم استيراد المقارنات');
      document.querySelector('.modal-overlay')?.remove();
      cmpOpenAdmin();
    } catch (err) {
      showToast('⚠️ تعذّرت قراءة الملف — تأكد من الصيغة');
    }
  };
  reader.readAsText(file);
}

