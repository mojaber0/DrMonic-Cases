// ════════════════════════════════════════════════
//  VIEWS
// ════════════════════════════════════════════════
/* ══════════════════════════════════════════════════════════════
   📊 Storage usage indicator (Settings)
   ══════════════════════════════════════════════════════════════ */
async function renderStorageUsage() {
  const area = document.getElementById('storageUsageArea');
  if (!area) return;
  area.innerHTML = `<div class="magic-hint">جاري الحساب...</div>`;
  if (!navigator.storage || !navigator.storage.estimate) {
    area.innerHTML = `<div class="magic-hint">⚠️ متصفحك ما بيدعم عرض مساحة التخزين مباشرة.</div>`;
    return;
  }
  try {
    const { usage, quota } = await navigator.storage.estimate();
    const usedMB = (usage / 1024 / 1024);
    const quotaMB = (quota / 1024 / 1024);
    const pct = quota ? Math.min(100, (usage / quota) * 100) : 0;
    const cls = pct >= 85 ? 'danger' : (pct >= 60 ? 'warn' : 'ok');
    let persistedLine = '';
    if (navigator.storage.persisted) {
      try {
        const isPersisted = await navigator.storage.persisted();
        persistedLine = isPersisted
          ? `<div class="magic-hint">✅ التخزين محمي من الحذف التلقائي (persistent).</div>`
          : `<div class="magic-hint">ℹ️ التخزين داخل IndexedDB والنسخ الاحتياطي التلقائي مفعّلان. المتصفح لم يمنح بعد حماية persistent، لذلك اضغط الزر لتقليل احتمال حذف بيانات الموقع عند ضغط المساحة. <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.72rem;" onclick="requestPersistentStorage()">🔒 اطلب حماية دائمة</button></div>`;
      } catch (e) { /* not critical */ }
    }
    area.innerHTML = `
      <div class="storage-bar-label"><span>${usedMB.toFixed(1)} MB مستخدمة</span><span>من ${quotaMB >= 1024 ? (quotaMB/1024).toFixed(1) + ' GB' : quotaMB.toFixed(0) + ' MB'} متاحة</span></div>
      <div class="storage-bar-track"><div class="storage-bar-fill ${cls}" style="width:${pct.toFixed(1)}%;"></div></div>
      <div class="magic-hint">${pct.toFixed(1)}% مستخدم${pct >= 85 ? ' — ⚠️ قريب من الحد! صور/فيديوهات الحالات ممكن تفشل بالحفظ. صدّر نسخة احتياطية وامسح صور/فيديوهات قديمة.' : (pct >= 60 ? ' — تحت مراقبة، ابدأ فكر بتصدير نسخة احتياطية.' : '')}</div>
      ${persistedLine}`;
  } catch (e) {
    console.error('storage estimate failed', e);
    area.innerHTML = `<div class="magic-hint">⚠️ تعذّر حساب مساحة التخزين.</div>`;
  }
}
async function requestPersistentStorage() {
  if (!navigator.storage || !navigator.storage.persist) {
    showToast('⚠️ متصفحك ما بيدعم هالميزة');
    return;
  }
  try {
    const granted = await navigator.storage.persist();
    showToast(granted ? '✅ تم تفعيل الحماية الدائمة' : '⚠️ المتصفح رفض الطلب (بعض المتصفحات بتقرر تلقائيًا)');
    renderStorageUsage();
  } catch (e) {
    showToast('⚠️ تعذّر تنفيذ الطلب');
  }
}

/* ══════════════════════════════════════════════════════════════
   📦 Per-module backup export/import (merge by id, never overwrites
   what's already here — for moving one section between devices)
   ══════════════════════════════════════════════════════════════ */
const MODULE_BACKUP_DEFS = [
  { key: 'cases', label: '🗂️ الحالات السريرية', getData: () => cases,
    merge: async (incoming) => {
      let added = 0, skippedDup = 0;
      // Signature = name + complaint + diagnosis, normalized. Catches the same case
      // re-imported under a different id (from the old folder-overwrite bug) so it
      // never gets duplicated, even though ids differ.
      const sig = c => [c.name, c.complaint, c.diagnosis].map(v => (v || '').trim().toLowerCase()).join('|');
      const existingSigs = new Set(cases.map(sig));
      for (const c of incoming) {
        if (!c || !c.id) continue;
        if (cases.some(e => e.id === c.id)) continue;
        if (existingSigs.has(sig(c))) { skippedDup++; continue; }
        try { await idbPutCase(c); cases.push(c); existingSigs.add(sig(c)); added++; }
        catch (e) { console.error('import case failed', e); }
      }
      if (added && typeof renderCases === 'function') { try { renderCases(); } catch (e) {} }
      if (skippedDup) console.log(`تجاهلنا ${skippedDup} حالة مكررة (نفس المحتوى بـid مختلف)`);
      return added;
    } },
  { key: 'study_notes', label: '📝 ملاحظاتي — مراجعة منظمة وسهلة القراءة', getData: () => studyNotes,
    merge: async (incoming) => {
      let added = 0;
      const noteSignature = note => [note.title, note.content, note.color].map(value => (value || '').toString().trim().toLowerCase()).join('|');
      const existingSignatures = new Set(studyNotes.map(noteSignature));
      for (const note of incoming) {
        if (!note || note.id == null || studyNotes.some(existing => existing.id === note.id)) continue;
        if (existingSignatures.has(noteSignature(note))) continue;
        studyNotes.push(note);
        existingSignatures.add(noteSignature(note));
        added++;
      }
      if (added) {
        saveStudyNotes();
        if (document.getElementById('notesView')?.classList.contains('active')) renderNotes();
      }
      return added;
    } },
  { key: 'pe_library', label: '🩺 الفحص السريري', ensureLoaded: async () => { if (!peLoaded) await loadPeSteps(); }, getData: () => peSteps,
    merge: async (incoming) => {
      let added = 0;
      for (const step of incoming) {
        if (!step || !step.id || peSteps.some(s => s.id === step.id)) continue;
        try { await idbPutPeStep(step); peSteps.push(step); added++; }
        catch (e) { console.error('import pe step failed', e); }
      }
      if (document.getElementById('peLibraryView')?.classList.contains('active')) peShowFlowchart();
      return added;
    } },
  { key: 'history_checklist', label: '📋 أخذ التاريخ المرضي', getData: () => hxEntries,
    merge: async (incoming) => {
      let added = 0;
      incoming.forEach(entry => {
        if (!entry || entry.id == null || hxEntries.some(e => e.id === entry.id)) return;
        hxEntries.push(entry); added++;
      });
      saveHxEntries();
      return added;
    } },
  { key: 'ecg_library', label: '📈 مكتبة الـ ECG', ensureLoaded: async () => { if (!ecgLoaded) await loadEcgCases(); }, getData: () => ecgCases,
    merge: async (incoming) => {
      let added = 0;
      for (const c of incoming) {
        if (!c || !c.id || ecgCases.some(e => e.id === c.id)) continue;
        try { await idbPutEcgCase(c); ecgCases.push(c); added++; } catch (e) { console.error(e); }
      }
      return added;
    } },
  { key: 'sounds_library', label: '🔊 الأصوات السريرية', ensureLoaded: async () => { if (!soundsLoaded) await loadSounds(); }, getData: () => soundsCases,
    merge: async (incoming) => {
      let added = 0;
      for (const c of incoming) {
        if (!c || !c.id || soundsCases.some(e => e.id === c.id)) continue;
        try { await idbPutSound(c); soundsCases.push(c); added++; } catch (e) { console.error(e); }
      }
      return added;
    } },
  { key: 'xray_library', label: '🩻 مكتبة الأشعة', ensureLoaded: async () => { if (!xrayLoaded) await loadXrayCases(); }, getData: () => xrayCases,
    merge: async (incoming) => {
      let added = 0;
      for (const c of incoming) {
        if (!c || !c.id || xrayCases.some(e => e.id === c.id)) continue;
        try { await idbPutXrayCase(c); xrayCases.push(c); added++; } catch (e) { console.error(e); }
      }
      return added;
    } },
  { key: 'pharma_cards', label: '💊 بطاقات الأدوية', ensureLoaded: async () => { if (!pharmaLoaded) await loadPharmaCards(); }, getData: () => pharmaCards,
    merge: async (incoming) => {
      let added = 0;
      for (const c of incoming) {
        if (!c || !c.id || pharmaCards.some(e => e.id === c.id)) continue;
        try { await idbPutPharmaCard(c); pharmaCards.push(c); added++; } catch (e) { console.error(e); }
      }
      return added;
    } },
  { key: 'micro_tree', label: '🦠 شجرة الميكروبيولوجي', ensureLoaded: async () => { microLoadData(); }, getData: () => microData.nodes,
    merge: async (incoming) => {
      let added = 0;
      incoming.forEach(n => {
        if (!n || !n.id || microData.nodes.some(x => x.id === n.id)) return;
        microData.nodes.push(n); added++;
      });
      if (added) microSaveData();
      return added;
    } },
];

function renderModuleBackupList() {
  const wrap = document.getElementById('moduleBackupList');
  if (!wrap) return;
  wrap.innerHTML = MODULE_BACKUP_DEFS.map(def => `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid var(--border,rgba(255,255,255,0.08));">
      <span style="flex:1;min-width:140px;font-size:0.88rem;">${def.label}</span>
      <button class="btn btn-ghost btn-sm" onclick="exportModuleBackup('${def.key}')">⬇️ تصدير</button>
      <button class="btn btn-ghost btn-sm" onclick="document.getElementById('modImport_${def.key}').click()">⬆️ استيراد ودمج</button>
      <input type="file" id="modImport_${def.key}" accept="application/json,.json" style="display:none;" onchange="importModuleBackup('${def.key}', this.files)" />
    </div>`).join('');
}

async function exportModuleBackup(key) {
  const def = MODULE_BACKUP_DEFS.find(d => d.key === key);
  if (!def) return;
  if (def.ensureLoaded) await def.ensureLoaded();
  const data = def.getData() || [];
  const payload = { drmonic_module: key, exportedAt: new Date().toISOString(), count: data.length, data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `drmonic_${key}_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
  showToast(`📤 اتصدّر (${data.length} عنصر)`);
}

function importModuleBackup(key, fileList) {
  const def = MODULE_BACKUP_DEFS.find(d => d.key === key);
  const file = fileList?.[0];
  if (!def || !file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    let payload;
    try { payload = JSON.parse(e.target.result); }
    catch (err) { showToast('⚠️ ملف غير صالح أو تالف'); return; }
    if (payload.drmonic_module !== key) {
      const proceed = confirm(`⚠️ هاد الملف تصدير لقسم "${payload.drmonic_module || 'غير معروف'}" مش "${def.label}" — متأكد تكمل؟`);
      if (!proceed) return;
    }
    const incoming = Array.isArray(payload.data) ? payload.data : [];
    if (!incoming.length) { showToast('⚠️ الملف فاضي، ما فيه شي نستورده'); return; }
    if (def.ensureLoaded) await def.ensureLoaded();
    const added = await def.merge(incoming);
    const skipped = incoming.length - added;
    showToast(`✅ استيراد: ${added} عنصر جديد${skipped > 0 ? `، تجاهلنا ${skipped} موجود أصلًا` : ''}`);
  };
  reader.readAsText(file);
}

// One-time cleanup: merges any cases that share the same name+complaint+diagnosis
// signature but ended up with different ids (leftover from the old folder-overwrite
// bug or a repeated import). Keeps the oldest (by createdAt) copy of each, deletes the rest.
async function cleanupDuplicateCases() {
  const sig = c => [c.name, c.complaint, c.diagnosis].map(v => (v || '').trim().toLowerCase()).join('|');
  const groups = new Map();
  cases.forEach(c => {
    const s = sig(c);
    if (!groups.has(s)) groups.set(s, []);
    groups.get(s).push(c);
  });
  const toDelete = [];
  const keep = [];
  for (const group of groups.values()) {
    if (group.length <= 1) { keep.push(...group); continue; }
    group.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    keep.push(group[0]);
    toDelete.push(...group.slice(1));
  }
  if (!toDelete.length) { showToast('✅ ما في تكرار — كل شي نظيف'); return; }
  const proceed = confirm(`لقيت ${toDelete.length} حالة مكررة. رح نحذفهم ونخلي وحدة بس من كل حالة (الأقدم). متأكد تكمل؟`);
  if (!proceed) return;
  for (const c of toDelete) {
    try { await idbDeleteCase(c.id); } catch (e) { console.error('cleanup delete failed', e); }
  }
  keep.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  cases = keep;
  renderCases();
  showToast(`🧹 اتشالت ${toDelete.length} حالة مكررة`);
}

function hideAllViews() {
  document.getElementById('homeView').style.display = 'none';
  document.getElementById('caseView').classList.remove('active');
  document.getElementById('adminPanel').classList.remove('active');
  document.getElementById('notesView').classList.remove('active');
  document.getElementById('tricksView').classList.remove('active');
  document.getElementById('reviewCardsView').classList.remove('active');
  document.getElementById('mcqQuizView').classList.remove('active');
  document.getElementById('labValuesView').classList.remove('active');
  document.getElementById('historyView').classList.remove('active');
  document.getElementById('ecgLibraryView').classList.remove('active');
  document.getElementById('soundsLibraryView').classList.remove('active');
  document.getElementById('xrayLibraryView').classList.remove('active');
  document.getElementById('peLibraryView').classList.remove('active');
  document.getElementById('pharmaLibraryView').classList.remove('active');
  document.getElementById('interactionsView').classList.remove('active');
  document.getElementById('compareView').classList.remove('active');
  document.getElementById('microTreeView').classList.remove('active');
  document.getElementById('gamificationView').classList.remove('active');
  document.getElementById('redFlagsView').classList.remove('active');
  document.getElementById('analyticsView').classList.remove('active');
  document.getElementById('abbrevView').classList.remove('active');
  document.getElementById('monicQbankView')?.classList.remove('active');
  document.getElementById('roundPrepView')?.classList.remove('active');
  document.getElementById('studyPlanView')?.classList.remove('active');
  document.getElementById('topicMapView')?.classList.remove('active');
}
function showHome() {
  ttsStop();
  if (typeof qbankTimerInterval !== 'undefined') clearInterval(qbankTimerInterval);
  hideAllViews();
  document.getElementById('homeView').style.display = 'block';
  window.removeEventListener('scroll', updateProgress);
  document.getElementById('readProgress').style.width = '0%';
  renderSpecialtyControls();
  renderCases();
}
function showAdmin() {
  hideAllViews();
  document.getElementById('adminPanel').classList.add('active');
  const hxv = document.getElementById('historyView'); if (hxv) hxv.classList.remove('active');
  document.getElementById('msg1Text').value = settings.msg1;
  document.getElementById('msg2Text').value = settings.msg2;
  renderProfileSettingsSection();
  renderStorageUsage();
  renderModuleBackupList();
  const lightIconsBox = document.getElementById('lightIconsToggle');
  if (lightIconsBox) lightIconsBox.checked = localStorage.getItem('drmonic_light_icons') === '1';
  const siteImg = hxGetSiteImage();
  const preview = document.getElementById('hxSiteImgPreview');
  if (preview) { if (siteImg) { preview.src = siteImg; preview.style.display = 'inline-block'; } else { preview.style.display = 'none'; } }
  hxRefreshSchemaOverrideStatus();
  dhikrRenderSettingsUI();
}
function saveAdminSettings() {
  settings.msg1 = document.getElementById('msg1Text').value;
  settings.msg2 = document.getElementById('msg2Text').value;
  localStorage.setItem('drmonic_settings', JSON.stringify(settings));
  showToast('✅ تم حفظ الإعدادات');
  showHome();
}

function allSpecialties() {
  const caseSpecs = cases.map(c => c.specialty).filter(Boolean);
  return [...new Set([...defaultSpecialties, ...(settings.customSpecialties || []), ...caseSpecs])];
}

function specialtyLabel(spec) {
  const icons = {
    'طوارئ':'🚨', 'باطني':'💊', 'أطفال':'👶', 'جراحة':'🔪',
    'نسائية وتوليد':'🌸', 'قلبية':'❤️', 'عصبية':'🧠', 'أخرى':'📂'
  };
  return `${icons[spec] || '🏷️'} ${spec}`;
}

function renderSpecialtyControls() {
  const specs = allSpecialties();
  const bar = document.getElementById('specialtyBar');
  if (bar) {
    bar.innerHTML = `
      <span class="specialty-label">التخصص:</span>
      <button class="spec-chip ${currentFilter === 'all' ? 'active' : ''}" onclick="filterSpec(this,'all')">🔬 الكل <span class="specialty-progress">${specProgress('all')}%</span></button>
      ${specs.map(spec => `<button class="spec-chip ${currentFilter === spec ? 'active' : ''}" onclick="filterSpec(this,'${spec.replace(/'/g, "\\'")}')">${specialtyLabel(spec)} <span class="specialty-progress">${specProgress(spec)}%</span></button>`).join('')}
    `;
  }
  const select = document.getElementById('f_specialty');
  if (select) {
    const selected = select.value || 'طوارئ';
    select.innerHTML = specs.map(spec => `<option value="${spec}">${specialtyLabel(spec)}</option>`).join('');
    select.value = specs.includes(selected) ? selected : specs[0];
  }
}

function addCustomSpecialty() {
  const input = document.getElementById('newSpecialtyInput');
  const value = (input?.value || '').trim();
  if (!value) {
    showToast('⚠️ اكتب اسم التخصص أولاً');
    return;
  }
  if (!settings.customSpecialties.includes(value) && !defaultSpecialties.includes(value)) {
    settings.customSpecialties.push(value);
    localStorage.setItem('drmonic_settings', JSON.stringify(settings));
  }
  if (input) input.value = '';
  renderSpecialtyControls();
  document.getElementById('f_specialty').value = value;
  showToast('✅ تم إضافة التخصص');
}

/* ══════════════════════════════════════════════════════════════
   🪄 SMART BULK AUTO-FILL + scientific-symbol cleanup
   ══════════════════════════════════════════════════════════════ */

/* Cleans LaTeX / math markup pasted from AI tools or references into
   plain, readable medical text (K^+ -> K⁺, \rightarrow -> →, FEV_1 -> FEV₁...) */
function cleanScientificText(input) {
  if (!input) return input;
  let s = String(input);
  const SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','n':'ⁿ' };
  const SUB = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','+':'₊','-':'₋','a':'ₐ','x':'ₓ' };
  const toMap = (str, map) => str.split('').map(ch => map[ch] || ch).join('');

  // \frac{a}{b} -> a/b  (run before other brace stripping)
  s = s.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2');
  // \text{...} \mathrm{...} \mathbf{...} -> inner content
  s = s.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\s*\{([^{}]*)\}/g, '$1');
  // common LaTeX arrows / operators -> unicode
  const SYMS = {
    '\\rightarrow':'→', '\\leftarrow':'←', '\\Rightarrow':'⇒', '\\Leftarrow':'⇐',
    '\\leftrightarrow':'↔', '\\uparrow':'↑', '\\downarrow':'↓',
    '\\geq':'≥', '\\leq':'≤', '\\neq':'≠', '\\approx':'≈', '\\times':'×', '\\div':'÷',
    '\\pm':'±', '\\cdot':'·', '\\infty':'∞', '\\sim':'~', '\\%':'%',
    '\\alpha':'α', '\\beta':'β', '\\gamma':'γ', '\\delta':'Δ', '\\mu':'μ', '\\lambda':'λ',
  };
  Object.entries(SYMS).forEach(([k, v]) => { s = s.split(k).join(v); });
  // X^{...} or X^c  -> superscript unicode where possible, else keep as-is without ^/{}
  s = s.replace(/\^\{([^{}]+)\}/g, (m, g) => /^[0-9+\-n]+$/.test(g) ? toMap(g, SUP) : g);
  s = s.replace(/\^([0-9+\-n])/g, (m, g) => SUP[g] || g);
  // X_{...} or X_c -> subscript unicode where possible
  s = s.replace(/_\{([^{}]+)\}/g, (m, g) => /^[0-9+\-ax]+$/.test(g) ? toMap(g, SUB) : g);
  s = s.replace(/_([0-9+\-ax])/g, (m, g) => SUB[g] || g);
  // strip $...$ / $$...$$ math delimiters, keep the (already-cleaned) inner text
  s = s.replace(/\$\$?([^$]*)\$\$?/g, '$1');
  // remove any remaining unknown LaTeX commands like \text \mathbb etc, keep their argument
  s = s.replace(/\\([a-zA-Z]+)\s*\{([^{}]*)\}/g, '$2');
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');
  // leftover stray braces
  s = s.replace(/[{}]/g, '');
  // collapse extra spaces created by the cleanup, but keep newlines
  s = s.replace(/[ \t]{2,}/g, ' ').replace(/ *\n */g, '\n').trim();
  return s;
}

// Auto-clean scientific symbols on paste anywhere inside the create-case form,
// even outside the bulk-fill flow (a single field pasted by itself).
document.addEventListener('paste', e => {
  const el = e.target;
  if (!el || !el.closest || !el.closest('#createModal')) return;
  if (!(el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text'))) return;
  setTimeout(() => { el.value = cleanScientificText(el.value); }, 0);
});

function toggleSmartFillArea() {
  const area = document.getElementById('smartFillArea');
  area.style.display = area.style.display === 'none' ? 'block' : 'none';
  if (area.style.display === 'block') document.getElementById('smartFillText')?.focus();
}

const SMART_FILL_FIELDS = {
  name:       { el:'f_name',       kind:'text', synonyms:['اسم المريض','اسم الطفل','اسم','patient name','name'] },
  age:        { el:'f_age',        kind:'text', synonyms:['العمر','عمر المريض','age'] },
  specialty:  { el:'f_specialty',  kind:'select', synonyms:['التخصص','القسم','specialty','department'] },
  complaint:  { el:'f_complaint',  kind:'text', synonyms:['الشكوى الرئيسية','الشكوى','chief complaint','complaint'] },
  bigpicture: { el:'f_bigpicture', kind:'area', synonyms:['مقدمة علمية سريعة','the big picture','big picture','نظرة عامة'] },
  scenario:   { el:'f_scenario',   kind:'area', synonyms:['السيناريو القصصي','السيناريو','the scenario','scenario'] },
  patho:      { el:'f_patho',      kind:'area', synonyms:['ليش صار هيك','pathophysiology','الفيزيولوجيا المرضية','patho'] },
  diagnosis:  { el:'f_diagnosis',  kind:'text', synonyms:['التشخيص','diagnosis'] },
  diffdx:     { el:'f_diffdx',     kind:'area', synonyms:['الفرق بينها وبين مرض مشابه','differential','diffdx','التشخيص التفريقي'] },
  mistake:    { el:'f_mistake',    kind:'area', synonyms:['خطأ شائع','common mistake','mistake'] },
  management: { el:'f_management',kind:'area', synonyms:['خطة العلاج','management','العلاج'] },
  history:    { el:'f_history',    kind:'area', synonyms:['التاريخ المرضي','history checklist','history'] },
  exam:       { el:'f_exam',       kind:'area', synonyms:['الفحص السريري','physical exam','exam'] },
  labs:       { el:'f_labs',       kind:'area', synonyms:['الفحوصات والأشعة','labs','imaging','labs / imaging'] },
  dontmiss:   { el:'f_dontmiss',   kind:'area', synonyms:['تريكات لازم تدير بالك منها',"don't miss",'dont miss'] },
  tricks:     { el:'f_tricks',     kind:'area', synonyms:['تريكات التشخيص السريع','tricks'] },
  recap:      { el:'f_recap',      kind:'area', synonyms:['ملخص الكيس','the recap','recap','ملخص'] },
  startMsg:   { el:'f_startMsg',   kind:'area', synonyms:['رسالة البداية','start message'] },
  endMsg:     { el:'f_endMsg',     kind:'area', synonyms:['رسالة النهاية','end message'] },
  notes:      { el:'f_notes',      kind:'area', synonyms:['ملاحظات جانبية','notes'] },
};

// Strips leading emoji/markdown/bullets so headers match regardless of the
// icons or symbols a given user happens to prefix their text with.
function stripLabelNoise(line) {
  return line
    .replace(/^[\s\u2022\-\*#>•·]+/, '')
    .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]+/gu, '')
    .replace(/\*\*/g, '')
    .trim();
}

function heuristicGuessEmoji(raw) {
  const t = raw;
  const has = re => re.test(t);
  if (has(/رضيع|طفلة? حديثة الولادة|newborn|infant/)) return '👶';
  if (has(/عجوز|مسنة|جدة|elderly woman|grandmother/)) return '👵';
  if (has(/عجوز|مسن|جد\b|elderly man|grandfather/)) return '👴';
  if (has(/بنت|طفلة|فتاة صغيرة|little girl/)) return '🎀';
  if (has(/شابة|امرأة|مريضة|سيدة|فتاة|she\b|her\b|woman|female/)) return '👩';
  if (has(/صبي|ولد صغير|little boy/)) return '👦';
  if (has(/شاب|رجل|مريض\b|he\b|his\b|man\b|male/)) return '🧑';
  return '';
}

function heuristicParseBulkText(raw) {
  const lines = raw.split('\n');
  const hits = []; // {key, lineIdx, sameLineValue}
  lines.forEach((line, idx) => {
    const stripped = stripLabelNoise(line);
    if (!stripped || stripped.length > 70) return;
    for (const [key, def] of Object.entries(SMART_FILL_FIELDS)) {
      for (const syn of def.synonyms) {
        const synNorm = syn.toLowerCase();
        const low = stripped.toLowerCase();
        if (low.startsWith(synNorm)) {
          const rest = stripped.slice(syn.length).replace(/^[:\-–—]\s*/, '').trim();
          hits.push({ key, lineIdx: idx, sameLineValue: rest });
          break;
        }
      }
    }
  });
  hits.sort((a, b) => a.lineIdx - b.lineIdx);
  const result = {};
  hits.forEach((hit, i) => {
    const nextIdx = i + 1 < hits.length ? hits[i + 1].lineIdx : lines.length;
    let blockLines = lines.slice(hit.lineIdx + 1, nextIdx);
    let value = hit.sameLineValue;
    const blockText = blockLines.join('\n').trim();
    if (blockText) value = value ? value + '\n' + blockText : blockText;
    if (value) result[hit.key] = (result[hit.key] ? result[hit.key] + '\n' : '') + value;
  });
  return result;
}

async function llmParseBulkText(raw) {
  const apiKey = aiAssistantGetApiKey();
  if (!apiKey) return null;
  const properties = {};
  Object.keys(SMART_FILL_FIELDS).forEach(k => { properties[k] = { type: 'string' }; });
  properties.mcqs = {
    type: 'array',
    items: { type: 'object', properties: { q: { type:'string' }, a: { type:'string' } }, required: ['q','a'] }
  };
  properties.emoji = {
    type: 'string',
    enum: ['👦','👧','👶','🎀','👴','👵','🧑','👩'],
    description: 'إيموجي المريض الأنسب حسب الجنس والعمر المذكورين بالنص: 👦 صبي، 👧 بنت، 👶 رضيع، 🎀 بنت صغيرة، 👴 رجل مسن، 👵 امرأة مسنة، 🧑 رجل بالغ، 👩 امرأة بالغة. إذا مافي معلومة واضحة عن الجنس/العمر خليه فارغ "".'
  };
  const schema = { type: 'object', properties };
  const prompt = `النص التالي فيه تفاصيل حالة طبية تعليمية مكتوبة بأسلوب حر (عربي/إنجليزي، بإيموجي أو بدون، بأي ترتيب).
مهمتك حصراً: التوزيع (Routing) — إنك تاخد كل جزء من النص وتحطه بالحقل المناسب إله بالضبط بنفس شكله الأصلي، مش إعادة الصياغة أو التلخيص.

⛔️ قواعد صارمة ممنوع كسرها:
1. ممنوع تختصر، تلخص، تعيد صياغة، أو تحذف أي جزء من النص الأصلي — احتفظ بكل الكلمات، الإيموجيات (🌸💊🚨...إلخ)، علامات **bold**، والفواصل --- تماماً متل ما هي بالنص الأصلي، حرفياً كوبي-بيست، لكل حقل تحطه فيه.
2. الاستثناء الوحيد المسموح للتعديل: رموز LaTeX/رياضية زي $K^+$ أو \\rightarrow أو FEV_1 أو \\frac{a}{b} — حوّلها فقط لـ Unicode مقروء (K⁺، →، FEV₁، a/b) وما تسيب $ ولا \\ بالنتيجة. غير هيك، ولا حرف واحد ينتغير.
3. لا تخترع أو تستنتج محتوى لحقل مالوش نص واضح ومطابق إله بالمصدر. مثال: إذا ما في قسم "فحص سريري" واضح بالنص، خلي حقل exam فاضي "" — لا تاخد جملة من قسم تاني (متل السيناريو) وتحطها هناك كتخمين. نفس الشي لباقي الحقول: لو مو موجود صراحة، خليه "".
4. لو حقل معين تكرر أو انذكر بأكثر من مكان بالنص، اجمعه كامل بنفس الحقل بدون حذف أي جزء.

📌 تعريف الحقول التي تحتاج انتباه خاص بالتفريق بينها:
- startMsg = فقط الجزء الافتتاحي/الترحيبي/التمهيدي اللي قبل ما تبلش بيانات الحالة نفسها (الترحيب، الخطبة، تعليل سبب الدراسة... أي إنشاء تمهيدي قبل "اسم المريض" أو "الشكوى الرئيسية").
- endMsg = الفقرة الختامية اللي بآخر النص تماماً، غالباً بعد الـ MCQ، زي فقرة "ربط الموضوع بعظمة خلق الله" أو أي كلام ختامي/وداعي للطالب يجي بأنهاية النص.
- notes = ملاحظات جانبية إضافية مستقلة عن كل ما سبق (إذا موجودة بشكل منفصل واضح)، وليست نفس محتوى endMsg. لا تكرر نفس الفقرة بحقلين.

النص:
${raw}

رجّع JSON فقط مطابق للـ schema، بدون أي شرح أو نص خارج الـ JSON.
${getAiCriteria() ? '\nملاحظة إضافية:\n' + getAiCriteria() : ''}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI_ASSISTANT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.05, maxOutputTokens: 16384 }
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || ('HTTP ' + res.status));
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.warn('Smart fill LLM parse failed, falling back to heuristic:', err);
    return null;
  }
}

async function applySmartBulkFill() {
  const raw = document.getElementById('smartFillText').value.trim();
  const status = document.getElementById('smartFillStatus');
  const btn = document.getElementById('smartFillRunBtn');
  if (!raw) { showToast('⚠️ الصق نص فيه تفاصيل الحالة أولاً'); return; }
  btn.disabled = true;
  status.textContent = '⏳ عم يحلل النص...';
  try {
    let parsed = await llmParseBulkText(raw);
    let usedLlm = !!parsed;
    if (!parsed) parsed = heuristicParseBulkText(raw);

    let filledCount = 0;
    Object.entries(SMART_FILL_FIELDS).forEach(([key, def]) => {
      const val = parsed[key];
      if (!val) return;
      const cleaned = cleanScientificText(val);
      const el = document.getElementById(def.el);
      if (!el) return;
      if (def.kind === 'select') {
        const specs = allSpecialties();
        const match = specs.find(s => s.includes(cleaned) || cleaned.includes(s));
        if (match) { el.value = match; }
        else if (cleaned) {
          if (!settings.customSpecialties.includes(cleaned)) { settings.customSpecialties.push(cleaned); localStorage.setItem('drmonic_settings', JSON.stringify(settings)); }
          renderSpecialtyControls();
          el.value = cleaned;
        }
      } else {
        el.value = cleaned;
      }
      filledCount++;
    });

    if (!parsed.emoji) parsed.emoji = heuristicGuessEmoji(raw);
    if (parsed.emoji) {
      const opt = document.querySelector(`.emoji-opt[data-emoji="${parsed.emoji}"]`);
      if (opt) selectEmoji(opt);
    }

    if (Array.isArray(parsed.mcqs) && parsed.mcqs.length) {
      parsed.mcqs.forEach(mcq => { if (mcq.q) addMCQ(cleanScientificText(mcq.q), cleanScientificText(mcq.a || '')); });
    }

    status.textContent = usedLlm
      ? `✅ عبّينا ${filledCount} حقل عبر Gemini — راجعهم قبل الحفظ`
      : `✅ عبّينا ${filledCount} حقل بالتحليل المحلي (بدون مفتاح Gemini) — راجعهم قبل الحفظ`;
    showToast(`✅ تمت التعبئة التلقائية (${filledCount} حقل)`);
  } catch (err) {
    console.error('applySmartBulkFill failed', err);
    status.textContent = '⚠️ صار خطأ أثناء التحليل — جرب مرة تانية أو عبّي الحقول يدويًا';
    showToast('⚠️ تعذّرت التعبئة التلقائية');
  } finally {
    btn.disabled = false;
  }
}


function handleSearchInput() {
  searchQuery = document.getElementById('consultantSearch').value.trim().toLowerCase();
  rapidIndex = 0;
  renderCases();
}

function caseSearchText(c) {
  return [
    c.name, c.complaint, c.diagnosis, c.age, c.caseDate, c.specialty, c.bigpicture,
    c.scenario, c.patho, c.management, c.history, c.exam, c.dontmiss, c.diffdx, c.mistake,
    c.recap, c.notes, c.startMsg, c.endMsg,
    ...(c.mcqs || []).flatMap(q => [q.q, q.a])
  ].filter(Boolean).join(' ').toLowerCase();
}

function exportCases() {
  const payload = {
    app: 'DrMonic Cases',
    version: 2,
    exportedAt: new Date().toISOString(),
    cases,
    settings,
    done: [...doneCases],
    favorites: [...favoriteCases],
    theme: localStorage.getItem('drmonic_theme') || 'dark'
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `drmonic-cases-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('✅ تم تصدير النسخة الاحتياطية');
}

function importCases(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.type === 'single-case' && data.case) {
        const importedCase = data.case;
        importedCase.createdAt = importedCase.createdAt || Date.now();
        if (!importedCase.id) importedCase.id = genId();
        cases.unshift(importedCase);
        await persistCase(importedCase);
        showToast('✅ تم استيراد الحالة الواحدة');
        showHome();
        return;
      }
      const importedCases = Array.isArray(data) ? data : data.cases;
      if (!Array.isArray(importedCases)) throw new Error('Invalid backup');
      const ok = confirm(`سيتم استبدال الحالات الحالية بـ ${importedCases.length} حالة من ملف النسخة الاحتياطية. هل تريد المتابعة؟`);
      if (!ok) return;
      importedCases.forEach(c => { if (!c.id) c.id = genId(); });
      cases = importedCases;
      if (data.settings && typeof data.settings === 'object') settings = data.settings;
      if (Array.isArray(data.done)) doneCases = new Set(data.done);
      if (Array.isArray(data.favorites)) favoriteCases = new Set(data.favorites);
      if (!Array.isArray(settings.customSpecialties)) settings.customSpecialties = [];
      await idbClearCases();
      for (const c of cases) await idbPutCase(c);
      if (folderConnected) await syncAllCasesToFolder();
      localStorage.setItem('drmonic_settings', JSON.stringify(settings));
      saveDoneCases();
      saveFavoriteCases();
      if (data.theme) localStorage.setItem('drmonic_theme', data.theme);
      showToast('✅ تم استيراد النسخة الاحتياطية');
      showHome();
    } catch (err) {
      showToast('⚠️ ملف JSON غير صالح');
    } finally {
      input.value = '';
    }
  };
  reader.readAsText(file);
}

