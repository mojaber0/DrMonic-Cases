// ════════════════════════════════════════════════
//  LAB VALUES ANALYZER  (محلل الفحوصات الطبية التفاعلي)
// ════════════════════════════════════════════════
//
// Expected JSON schema — ONE FILE PER PANEL, e.g. "electrolytes.json":
// {
//   "category": "Electrolytes",
//   "category_ar": "الأملاح والشوارد",
//   "tests": [
//     {
//       "id": "potassium",
//       "name_ar": "البوتاسيوم",
//       "name_en": "Potassium (K+)",
//       "unit": "mmol/L",
//       "gender_specific": false,
//       "ranges": { "default": { "normal_low":3.5, "normal_high":5.0, "critical_low":2.5, "critical_high":6.5 } },
//       "high_causes": ["...", "..."],
//       "low_causes": ["...", "..."],
//       "critical_high_msg": "خطر ...",
//       "critical_low_msg": "خطر ..."
//     },
//     {
//       "id": "hemoglobin", "name_ar": "الهيموغلوبين", "name_en": "Hemoglobin (Hb)", "unit": "g/dL",
//       "gender_specific": true,
//       "ranges": {
//         "male":   { "normal_low":13.5, "normal_high":17.5, "critical_low":7, "critical_high":20 },
//         "female": { "normal_low":12.0, "normal_high":15.5, "critical_low":7, "critical_high":20 }
//       },
//       "high_causes": [...], "low_causes": [...]
//     }
//   ]
// }
//
// Combined/cross-test rules — separate file, e.g. "combined_rules.json":
// {
//   "category": "Combined",
//   "rules": [
//     {
//       "id": "bun_cr_ratio", "name_ar": "نسبة BUN / الكرياتينين",
//       "inputs": [ {"id":"bun","label_ar":"BUN","unit":"mg/dL"}, {"id":"creatinine","label_ar":"الكرياتينين","unit":"mg/dL"} ],
//       "compute": "bun / creatinine",
//       "interpretations": [
//         { "min": 20, "result_ar": "سبب ما قبل الكلية (Pre-renal)", "explanation_ar": "..." },
//         { "max": 10, "result_ar": "سبب كلوي داخلي (Intrinsic renal)", "explanation_ar": "..." },
//         { "min": 10, "max": 20, "result_ar": "ضمن الطبيعي", "explanation_ar": "..." }
//       ]
//     }
//   ]
// }

let labPanels = {};
let labCombinedRules = [];
let labGender = localStorage.getItem('drmonic_lab_gender') || 'male';
let labActivePanel = 'all';
let labSelected = null; // { panelKey, testId }

function labSlug(s) { return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_'); }

function loadLabDataFromStorage() {
  labPanels = {};
  Object.keys(localStorage).forEach(k => {
    if (!k.startsWith('drmonic_labdata_')) return;
    try {
      const parsed = JSON.parse(localStorage.getItem(k));
      if (parsed && parsed.category) labPanels[parsed.category] = parsed;
    } catch (e) { /* ignore corrupt entry */ }
  });
  try {
    labCombinedRules = JSON.parse(localStorage.getItem('drmonic_lab_combined') || '[]');
  } catch (e) { labCombinedRules = []; }
}

function normalizeDigits(str) {
  const map = { 'Ù ':'0','Ù¡':'1','Ù¢':'2','Ù£':'3','Ù¤':'4','Ù¥':'5','Ù¦':'6','Ù§':'7','Ù¨':'8','Ù©':'9','Ù«':'.' };
  return String(str).replace(/[٠-٩٫]/g, d => map[d] ?? d);
}

function showLabValuesView() {
  hideAllViews();
  document.getElementById('labValuesView').classList.add('active');
  loadLabDataFromStorage();
  labSelected = null;
  document.getElementById('labSearchInput').value = '';
  const mBtn = document.getElementById('labGenderMaleBtn');
  const fBtn = document.getElementById('labGenderFemaleBtn');
  mBtn.classList.toggle('active', labGender === 'male');
  fBtn.classList.toggle('active', labGender === 'female');
  renderLabImportStatus();
  renderLabPanelsRow();
  renderLabTestsGrid();
  document.getElementById('labSelectedTestArea').innerHTML = '';
  renderLabCombinedArea();
}

function setLabGender(g) {
  labGender = g;
  localStorage.setItem('drmonic_lab_gender', g);
  document.getElementById('labGenderMaleBtn').classList.toggle('active', g === 'male');
  document.getElementById('labGenderFemaleBtn').classList.toggle('active', g === 'female');
  if (labSelected) renderLabSelectedTest(labSelected.panelKey, labSelected.testId);
}

function importLabJsonFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  let loadedPanels = 0, loadedRuleFiles = 0, failed = 0;
  const readers = files.map(file => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (Array.isArray(parsed.tests)) {
          const category = parsed.category || file.name.replace(/\.json$/i, '');
          parsed.category = category;
          labPanels[category] = parsed;
          localStorage.setItem('drmonic_labdata_' + labSlug(category), JSON.stringify(parsed));
          loadedPanels++;
        } else if (Array.isArray(parsed.rules)) {
          const existingIds = new Set(labCombinedRules.map(r => r.id));
          parsed.rules.forEach(r => { if (!existingIds.has(r.id)) labCombinedRules.push(r); });
          localStorage.setItem('drmonic_lab_combined', JSON.stringify(labCombinedRules));
          loadedRuleFiles++;
        } else {
          failed++;
        }
      } catch (e) { failed++; }
      resolve();
    };
    reader.onerror = () => { failed++; resolve(); };
    reader.readAsText(file);
  }));
  Promise.all(readers).then(() => {
    renderLabImportStatus();
    renderLabPanelsRow();
    renderLabTestsGrid();
    renderLabCombinedArea();
    document.getElementById('labImportFiles').value = '';
    if (loadedPanels || loadedRuleFiles) {
      showToast(`✅ تم استيراد ${loadedPanels} بانل${loadedRuleFiles ? ' + قواعد ربط' : ''}`);
    }
    if (failed) showToast('⚠️ ' + failed + ' ملف ما انقرأ صح (تأكد إنه JSON صحيح)');
  });
}

function renderLabImportStatus() {
  const bar = document.getElementById('labImportStatusBar');
  const panelKeys = Object.keys(labPanels);
  if (!panelKeys.length && !labCombinedRules.length) {
    bar.innerHTML = `<span>📂 لسا ما ضفت أي بيانات تحاليل — اضغط "استيراد بيانات JSON" بالأعلى وارفع ملفاتك (ملف لكل بانل).</span>`;
    return;
  }
  const statusHtml = panelKeys.map(k => `<span class="loaded">✅ ${esc(labPanels[k].category_ar || k)} (${labPanels[k].tests.length})</span>`).join('');
  const rulesHtml = labCombinedRules.length ? `<span class="loaded">✅ حاسبات مركّبة (${labCombinedRules.length})</span>` : `<span class="empty">لا توجد حاسبات مركّبة مستوردة</span>`;
  bar.innerHTML = `<div class="lab-import-status">${statusHtml}${rulesHtml}</div>`;
}

function renderLabPanelsRow() {
  const row = document.getElementById('labPanelsRow');
  const keys = Object.keys(labPanels);
  let html = `<button class="lab-panel-chip ${labActivePanel==='all'?'active':''}" onclick="setLabActivePanel('all')">الكل</button>`;
  html += keys.map(k => `<button class="lab-panel-chip ${labActivePanel===k?'active':''}" onclick="setLabActivePanel('${k.replace(/'/g,"\\'")}')">${esc(labPanels[k].category_ar || k)} <span class="count">${labPanels[k].tests.length}</span></button>`).join('');
  if (labCombinedRules.length) {
    html += `<button class="lab-panel-chip ${labActivePanel==='combined'?'active':''}" onclick="setLabActivePanel('combined')">🧮 حاسبات مركّبة</button>`;
  }
  row.innerHTML = html;
}

function setLabActivePanel(key) {
  labActivePanel = key;
  renderLabPanelsRow();
  const grid = document.getElementById('labTestsGrid');
  const combinedArea = document.getElementById('labCombinedArea');
  if (key === 'combined') {
    grid.style.display = 'none';
    document.getElementById('labSelectedTestArea').innerHTML = '';
    combinedArea.style.display = 'block';
  } else {
    grid.style.display = 'grid';
    combinedArea.style.display = 'none';
    renderLabTestsGrid();
  }
}

function renderLabTestsGrid() {
  const grid = document.getElementById('labTestsGrid');
  if (labActivePanel === 'combined') { grid.style.display = 'none'; return; }
  grid.style.display = 'grid';
  const query = (document.getElementById('labSearchInput').value || '').trim().toLowerCase();
  const rows = [];
  Object.entries(labPanels).forEach(([panelKey, panel]) => {
    const panelMatches = labActivePanel === 'all' || labActivePanel === panelKey;
    if (!panelMatches && !query) return; // panel filter active with no search: skip other panels
    (panel.tests || []).forEach(t => {
      if (!panelMatches && !query) return;
      const hay = `${t.name_ar || ''} ${t.name_en || ''} ${t.unit || ''}`.toLowerCase();
      if (query && !hay.includes(query)) return;
      if (!query && !panelMatches) return;
      rows.push({ panelKey, t });
    });
  });
  if (!rows.length) {
    grid.innerHTML = `<div class="notes-empty" style="grid-column:1/-1;"><div class="icon">🧪</div><h3>لا توجد نتائج</h3><p>${Object.keys(labPanels).length ? 'جرّب كلمة بحث ثانية' : 'استورد ملفات JSON أولاً'}</p></div>`;
    return;
  }
  grid.innerHTML = rows.map(({panelKey, t}) => `
    <div class="lab-test-tile ${labSelected && labSelected.panelKey===panelKey && labSelected.testId===t.id ? 'active':''}" onclick="renderLabSelectedTest('${panelKey.replace(/'/g,"\\'")}','${String(t.id).replace(/'/g,"\\'")}')">
      <div class="lab-test-name">${esc(t.name_ar || t.name_en)}</div>
      <div class="lab-test-unit">${esc(t.name_en && t.name_ar ? t.name_en : '')} ${t.unit ? '· ' + esc(t.unit) : ''}</div>
    </div>`).join('');
}

function getLabTest(panelKey, testId) {
  const panel = labPanels[panelKey];
  if (!panel) return null;
  return (panel.tests || []).find(t => String(t.id) === String(testId)) || null;
}

function getLabRange(test) {
  if (!test.ranges) return null;
  if (test.gender_specific) return test.ranges[labGender] || test.ranges.default || Object.values(test.ranges)[0];
  return test.ranges.default || Object.values(test.ranges)[0];
}

function renderLabSelectedTest(panelKey, testId) {
  labSelected = { panelKey, testId };
  renderLabTestsGrid();
  const test = getLabTest(panelKey, testId);
  const area = document.getElementById('labSelectedTestArea');
  if (!test) { area.innerHTML = ''; return; }
  const range = getLabRange(test);
  area.innerHTML = `
    <div class="lab-input-panel">
      <div class="lab-test-name" style="font-size:1.1rem;margin-bottom:10px;">${esc(test.name_ar || test.name_en)} ${test.name_en && test.name_ar ? `<span style="color:var(--text2);font-weight:500;font-size:0.85rem;">(${esc(test.name_en)})</span>` : ''}</div>
      <div class="lab-input-row">
        <input type="text" inputmode="decimal" class="lab-value-input" id="labValueInput" placeholder="اكتب القيمة..." oninput="evaluateLabTest()" />
        <div class="lab-input-unit">${esc(test.unit || '')}</div>
      </div>
      ${range ? `<div class="lab-normal-hint">المدى الطبيعي: ${range.normal_low ?? '—'} – ${range.normal_high ?? '—'} ${esc(test.unit||'')}${test.gender_specific ? ' · ' + (labGender==='male'?'♂ Male':'♀ Female') : ''}</div>` : '<div class="lab-normal-hint">⚠️ ما في مدى مرجعي محدد لهذا التحليل بملف الـ JSON</div>'}
      <div id="labResultArea"></div>
    </div>`;
  document.getElementById('labValueInput').focus();
}

function evaluateLabTest() {
  if (!labSelected) return;
  const test = getLabTest(labSelected.panelKey, labSelected.testId);
  const resultArea = document.getElementById('labResultArea');
  const raw = normalizeDigits(document.getElementById('labValueInput').value);
  const value = parseFloat(raw);
  if (!test || raw.trim() === '' || isNaN(value)) { resultArea.innerHTML = ''; return; }
  const range = getLabRange(test);
  if (!range) { resultArea.innerHTML = '<div class="lab-result-card status-normal">⚠️ لا يمكن التقييم — لا يوجد مدى مرجعي بالبيانات</div>'; return; }

  let status, icon, title;
  if (range.critical_low != null && value <= range.critical_low) { status = 'critical'; icon = '🚨'; title = 'قيمة حرجة (منخفضة جدًا) — Critical Low'; }
  else if (range.critical_high != null && value >= range.critical_high) { status = 'critical'; icon = '🚨'; title = 'قيمة حرجة (مرتفعة جدًا) — Critical High'; }
  else if (range.normal_low != null && value < range.normal_low) { status = 'low'; icon = '🟡'; title = 'أقل من الطبيعي — Low'; }
  else if (range.normal_high != null && value > range.normal_high) { status = 'high'; icon = '🟡'; title = 'أعلى من الطبيعي — High'; }
  else { status = 'normal'; icon = '🟢'; title = 'ضمن المعدل الطبيعي — Normal'; }

  const isLowDirection = status === 'low' || (status === 'critical' && range.critical_low != null && value <= range.critical_low);
  const causes = isLowDirection ? test.low_causes : test.high_causes;
  const critMsg = isLowDirection ? test.critical_low_msg : test.critical_high_msg;

  let html = `<div class="lab-result-card status-${status}">
    <div class="lab-result-head"><span class="lab-result-icon">${icon}</span><span class="lab-result-title">${title}</span></div>
    <div class="lab-result-range">القيمة المدخلة: <strong>${value}</strong> ${esc(test.unit||'')} — المدى الطبيعي: ${range.normal_low ?? '—'}–${range.normal_high ?? '—'}</div>`;
  if (status === 'critical' && critMsg) {
    html += `<div class="lab-critical-msg">🚨 ${esc(critMsg)}</div>`;
  }
  if (status !== 'normal' && Array.isArray(causes) && causes.length) {
    html += `<div class="lab-result-section-title">${isLowDirection ? 'أسباب الانخفاض (Low Differentials)' : 'أسباب الارتفاع (High Differentials)'}</div>
      <ul>${causes.map(c => `<li>${hl(esc(c))}</li>`).join('')}</ul>`;
  }
  html += `</div>`;
  resultArea.innerHTML = html;
}

// ── Combined / cross-test rules (BUN/Cr, ABG, etc.) ──
function safeCompute(formula, values) {
  if (!formula || typeof formula !== 'string') return null;
  const argNames = Object.keys(values);
  const allowedTokens = new RegExp('^[0-9a-zA-Z_ .+\\-*/()]+$');
  if (!allowedTokens.test(formula)) return null;
  try {
    const fn = new Function(...argNames, 'return (' + formula + ');');
    const result = fn(...argNames.map(k => values[k]));
    return (typeof result === 'number' && isFinite(result)) ? result : null;
  } catch (e) { return null; }
}

function matchInterpretation(rule, value) {
  if (value == null) return null;
  return (rule.interpretations || []).find(itp => {
    const okMin = itp.min == null || value >= itp.min;
    const okMax = itp.max == null || value < itp.max;
    return okMin && okMax;
  }) || null;
}

function renderLabCombinedArea() {
  const area = document.getElementById('labCombinedArea');
  const showing = labActivePanel === 'combined';
  area.style.display = showing ? 'block' : 'none';
  if (!showing) return;
  if (!labCombinedRules.length) {
    area.innerHTML = `<div class="notes-empty"><div class="icon">🧮</div><h3>لا توجد حاسبات مركّبة بعد</h3><p>استورد ملف الـ JSON الخاص بالحاسبات المركّبة (مثل BUN/Cr أو ABG) من زر "استيراد بيانات JSON"</p></div>`;
    return;
  }
  area.innerHTML = labCombinedRules.map(rule => `
    <div class="lab-combined-card">
      <div class="lab-test-name" style="font-size:1.05rem;margin-bottom:4px;">${esc(rule.name_ar || rule.id)}</div>
      <div class="lab-combined-inputs">
        ${(rule.inputs || []).map(inp => `<input type="text" inputmode="decimal" placeholder="${esc(inp.label_ar || inp.id)}${inp.unit ? ' ('+esc(inp.unit)+')' : ''}" id="labRule_${esc(rule.id)}_${esc(inp.id)}" />`).join('')}
      </div>
      <button class="btn btn-primary btn-sm" onclick="calcCombinedRule('${String(rule.id).replace(/'/g,"\\'")}')">احسب</button>
      <div id="labRuleResult_${esc(rule.id)}" style="margin-top:12px;"></div>
    </div>`).join('');
}

function calcCombinedRule(ruleId) {
  const rule = labCombinedRules.find(r => String(r.id) === String(ruleId));
  const resultEl = document.getElementById('labRuleResult_' + ruleId);
  if (!rule) return;
  const values = {};
  let missing = false;
  (rule.inputs || []).forEach(inp => {
    const raw = normalizeDigits(document.getElementById(`labRule_${ruleId}_${inp.id}`)?.value || '');
    const v = parseFloat(raw);
    if (raw.trim() === '' || isNaN(v)) missing = true;
    values[inp.id] = v;
  });
  if (missing) { resultEl.innerHTML = `<div style="color:var(--text2);font-size:0.85rem;">أدخل كل القيم أولاً</div>`; return; }
  const computed = safeCompute(rule.compute, values);
  if (computed == null) { resultEl.innerHTML = `<div style="color:var(--red);font-size:0.85rem;">تعذّر الحساب — تحقق من صيغة المعادلة بملف الـ JSON</div>`; return; }
  const itp = matchInterpretation(rule, computed);
  resultEl.innerHTML = `
    <div class="lab-result-card status-${itp ? 'high' : 'normal'}" style="margin:0;">
      <div class="lab-result-head"><span class="lab-result-icon">🧮</span><span class="lab-result-title">${computed.toFixed(2)}</span></div>
      ${itp ? `<div class="lab-result-range"><strong>${esc(itp.result_ar || '')}</strong></div>${itp.explanation_ar ? `<div style="color:var(--text2);font-size:0.88rem;">${hl(esc(itp.explanation_ar))}</div>` : ''}` : '<div class="lab-result-range">لا يوجد تفسير مطابق بملف الـ JSON لهذه القيمة</div>'}
    </div>`;
}

