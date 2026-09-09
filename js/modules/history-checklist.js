// ════════════════════════════════════════════════
//  HISTORY TAKING CHECKLIST  (dynamic, schema-driven form)
//  Schema comes from a <script type="application/json"> block (default,
//  authored by Mohammad) or an overridden version imported via Settings.
//  Supported item types: checkbox, text_input, number_input, text_area_input,
//  single_choice, single_choice_with_conditional, multiple_choice,
//  checkbox_with_subfields, auto_calculated_field, rating_scale_1_to_10,
//  interactive_anatomy_map, history_type_selector, info_note.
//  Section containers vary: section.items[], or section.systems[].items[]
//  or section.systems[].questions[] — all handled generically below.
//  A section may carry visible_if:{field, values:[...]} to only render when
//  hxState[field] matches — used for the pediatric-only sections below.
// ════════════════════════════════════════════════
let hxSchema = null;
let hxState = {};
let hxEntries = JSON.parse(localStorage.getItem('drmonic_history_entries') || '[]');
let hxCurrentEntryId = null;
let hxFormulas = {}; // containerId -> [{id, formula}]

async function loadHxSchema() {
  const override = localStorage.getItem('drmonic_history_schema');
  if (override) {
    try { hxSchema = JSON.parse(override); return; } catch (e) { /* fall through to default */ }
  }
  try {
    const res = await fetch('data/hxDefaultSchemaData.json');
    hxSchema = await res.json();
  } catch (e) { hxSchema = { sections: [] }; }
}

async function resetHxSchemaToDefault() {
  localStorage.removeItem('drmonic_history_schema');
  hxSchema = null;
  await loadHxSchema();
  showToast('✅ تم الرجوع لنسخة الـ Schema الافتراضية (الأحدث)');
  hxRefreshSchemaOverrideStatus();
}

function hxRefreshSchemaOverrideStatus() {
  const el = document.getElementById('hxSchemaOverrideStatus');
  if (!el) return;
  const hasOverride = !!localStorage.getItem('drmonic_history_schema');
  el.textContent = hasOverride
    ? '⚠️ حاليًا شغّال على schema مرفوعة يدويًا (override) — مو النسخة الافتراضية المدمجة بالكود.'
    : '✅ حاليًا شغّال على النسخة الافتراضية المدمجة بالكود (الأحدث).';
}

function importHxSchema(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.sections)) throw new Error('missing sections');
      localStorage.setItem('drmonic_history_schema', JSON.stringify(parsed));
      hxSchema = parsed;
      showToast('✅ تم تحديث Schema فورم التاريخ المرضي');
      hxRefreshSchemaOverrideStatus();
    } catch (e) {
      showToast('⚠️ ملف الـ schema غير صالح');
    } finally {
      document.getElementById('hxSchemaFile').value = '';
    }
  };
  reader.readAsText(file);
}

function hxGetSiteImage() {
  return localStorage.getItem('drmonic_history_site_image') || 'assets/images/hx-default-site-image.webp';
}

function uploadHxSiteImage(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem('drmonic_history_site_image', reader.result);
    const preview = document.getElementById('hxSiteImgPreview');
    if (preview) { preview.src = reader.result; preview.style.display = 'inline-block'; }
    showToast('✅ تم حفظ صورة التشريح');
    document.getElementById('hxSiteImgFile').value = '';
  };
  reader.readAsDataURL(file);
}

function saveHxEntries() {
  safeLocalSet('drmonic_history_entries', JSON.stringify(hxEntries));
}

// ── Navigation ──
async function showHistoryView() {
  hideAllViews();
  document.getElementById('historyView').classList.add('active');
  if (!hxSchema) await loadHxSchema();
  hxShowList();
}

function hxShowList() {
  hxCurrentEntryId = null;
  document.getElementById('hxFormArea').style.display = 'none';
  document.getElementById('hxListArea').style.display = 'grid';
  document.getElementById('hxListToolbar').style.display = 'flex';
  document.getElementById('hxBackBtn').textContent = '← الرجوع';
  document.getElementById('hxBackBtn').onclick = showHome;
  renderHxList();
}

function renderHxList() {
  const grid = document.getElementById('hxListArea');
  const countEl = document.getElementById('hxListCount');
  countEl.textContent = `${hxEntries.length} فحص محفوظ`;
  if (!hxEntries.length) {
    grid.innerHTML = `<div class="notes-empty" style="grid-column:1/-1;"><div class="icon">📋</div><h3>لا يوجد فحوصات محفوظة بعد</h3><p>اضغط "➕ فحص جديد" لتبدأ</p></div>`;
    return;
  }
  grid.innerHTML = hxEntries.slice().reverse().map(entry => {
    const name = entry.payload?.introduction_and_consent?.patient_name || 'مريض بدون اسم';
    const age = entry.payload?.introduction_and_consent?.patient_age;
    return `
    <div class="hx-entry-tile" onclick="hxViewSummary(${entry.id})">
      <div class="hx-entry-name">${esc(name)}${age ? ' · ' + esc(String(age)) + ' سنة' : ''}</div>
      <div class="hx-entry-meta">${esc(entry.savedAt || '')}</div>
      <div class="hx-entry-actions">
        <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;" onclick="event.stopPropagation();hxViewSummary(${entry.id})">👁️ عرض الخلاصة</button>
        <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;" onclick="event.stopPropagation();hxOpenEntry(${entry.id})">✏️ تعديل</button>
        <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;color:var(--red);" onclick="event.stopPropagation();hxDeleteEntry(${entry.id})">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function hxViewSummary(id) {
  const entry = hxEntries.find(e => e.id === id);
  if (!entry) return;
  const name = entry.payload?.introduction_and_consent?.patient_name || 'مريض بدون اسم';
  const age = entry.payload?.introduction_and_consent?.patient_age;
  const summary = entry.payload?.case_summary_writeup?.case_summary_text;
  document.getElementById('hxSummaryHeader').innerHTML = `
    <div class="hx-summary-patient">${esc(name)}${age ? ' · ' + esc(String(age)) + ' سنة' : ''}</div>
    <div class="hx-summary-meta">${esc(entry.savedAt || '')}</div>`;
  document.getElementById('hxSummaryBody').innerHTML = summary && summary.trim()
    ? hl(esc(summary))
    : `<span class="hx-summary-empty">لسا ما انكتبت خلاصة لهذا الفحص. افتحه بوضع التعديل واكتبها بقسم "12. الخلاصة المنظمة".</span>`;
  openModal('hxSummaryModal');
}

function hxDeleteEntry(id) {
  hxEntries = hxEntries.filter(e => e.id !== id);
  saveHxEntries();
  renderHxList();
}

function hxNewEntry() {
  hxCurrentEntryId = null;
  hxState = {};
  hxOpenForm();
}

function hxOpenEntry(id) {
  const entry = hxEntries.find(e => e.id === id);
  if (!entry) return;
  hxCurrentEntryId = id;
  hxState = hxFlattenPayload(entry.payload);
  hxOpenForm();
}

// Flatten a nested {section:{item:value}} payload back into a flat state map for editing
function hxFlattenPayload(payload) {
  const flat = {};
  Object.values(payload || {}).forEach(section => {
    Object.entries(section || {}).forEach(([k, v]) => { flat[k] = v; });
  });
  return flat;
}

function hxOpenForm() {
  document.getElementById('hxListArea').style.display = 'none';
  document.getElementById('hxListToolbar').style.display = 'none';
  document.getElementById('hxBackBtn').textContent = '← رجوع لقائمة الفحوصات';
  document.getElementById('hxBackBtn').onclick = hxShowList;
  document.getElementById('hxListCount').textContent = '';
  const area = document.getElementById('hxFormArea');
  area.style.display = 'block';
  hxFormulas = {};
  hxRenderFormBody();
}

// Re-renders the whole form body (used on open, and again whenever history_type
// changes so that pediatric/gynecological-only sections appear or disappear).
function hxRenderFormBody() {
  const area = document.getElementById('hxFormArea');
  area.innerHTML = (hxSchema.sections || []).filter(hxSectionVisible).map(hxRenderSection).join('') + `
    <div class="hx-save-bar">
      <button class="btn btn-primary" onclick="hxSaveEntry()">💾 حفظ الفحص</button>
      <button class="btn btn-ghost" onclick="hxShowList()">إلغاء</button>
    </div>`;
}

// Section-level visibility: a section can declare visible_if:{field, values:[...]}
// so it only renders when hxState[field] is one of the listed values (e.g. the
// pediatric-only history sections only show once history_type === 'pediatric').
function hxSectionVisible(section) {
  if (!section.visible_if) return true;
  const { field, values } = section.visible_if;
  return values.includes(hxState[field]);
}

// Special handler for the history-type selector pills at the top of the form.
// Unlike a normal single_choice field, changing this needs to re-render the
// whole form body so that type-specific sections (pediatric, etc.) appear/disappear.
function hxSetHistoryType(value) {
  hxState.history_type = value;
  hxRenderFormBody();
}

function hxRenderSection(section) {
  let bodyHtml = '';
  if (Array.isArray(section.items)) {
    bodyHtml = section.items.map(it => hxRenderItem(it, section.section_id)).join('');
  } else if (Array.isArray(section.systems)) {
    bodyHtml = section.systems.map(sys => {
      const qs = sys.items || sys.questions || [];
      return `<div class="hx-system-block">
        <div class="hx-system-title">${esc(sys.system_name_ar || sys.system_id)}</div>
        ${qs.map(it => hxRenderItem(it, section.section_id)).join('')}
      </div>`;
    }).join('');
  }
  return `<div class="hx-section"><div class="hx-section-title">${esc(section.section_title_ar || section.section_id)}</div>${bodyHtml}</div>`;
}

function hxSymbolBadge(symbol) {
  return ''; // internal schema notation only — intentionally not shown in the UI
}

function hxRenderItem(item, containerId) {
  const id = item.id;
  const label = `${esc(item.label_ar || item.label_en || '')}${hxSymbolBadge(item.symbol)}`;
  switch (item.type) {
    case 'text_input':
    case 'number_input': {
      const inputType = 'text';
      const inputMode = 'text';
      const val = hxState[id] ?? '';
      return `<div class="hx-field">
        <label class="hx-label">${label}</label>
        <input type="${inputType}" inputmode="${inputMode}" class="hx-input" value="${esc(val)}"
          autocomplete="off" autocorrect="off" spellcheck="false"
          placeholder="${esc(item.placeholder_ar || '')}" oninput="hxSetVal('${id}', this.value);hxRecalcFormulas('${containerId}')" />
      </div>`;
    }
    case 'text_area_input': {
      const val = hxState[id] ?? '';
      return `<div class="hx-field">
        <label class="hx-label">${label}</label>
        <textarea class="hx-textarea" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="${esc(item.placeholder_ar || '')}" oninput="hxSetVal('${id}', this.value)">${esc(val)}</textarea>
      </div>`;
    }
    case 'checkbox': {
      const checked = !!hxState[id];
      return `<label class="hx-checkbox-row">
        <input type="checkbox" onchange="hxSetVal('${id}', this.checked)" ${checked ? 'checked' : ''} />
        <span>${label}</span>
      </label>`;
    }
    case 'checkbox_with_subfields': {
      const checked = !!hxState[id];
      const subHtml = (item.subfields || []).map(sf => hxRenderItem(sf, id)).join('');
      const formulas = (item.subfields || []).filter(sf => sf.type === 'auto_calculated_field').map(sf => ({ id: sf.id, formula: sf.formula }));
      if (formulas.length) hxFormulas[id] = formulas;
      return `<div class="hx-block">
        <label class="hx-checkbox-row">
          <input type="checkbox" onchange="hxToggleSubfields('${id}', this.checked)" ${checked ? 'checked' : ''} />
          <span>${label}</span>
        </label>
        <div class="hx-subfields ${checked ? 'show' : ''}" id="hxSub_${id}">${subHtml}</div>
      </div>`;
    }
    case 'auto_calculated_field': {
      const val = hxState[id] ?? '';
      return `<div class="hx-field">
        <label class="hx-label">${label} <span class="hx-auto-badge">(تلقائي)</span></label>
        <input type="text" class="hx-input" id="hxVal_${id}" readonly value="${esc(val)}" />
      </div>`;
    }
    case 'single_choice': {
      return `<div class="hx-field">
        <label class="hx-label">${label}</label>
        <div class="hx-options">
          ${(item.options || []).map(o => `
            <label class="hx-radio-pill ${hxState[id] === o.value ? 'active' : ''}" onclick="hxSetRadio('${id}','${String(o.value).replace(/'/g,"\\'")}', this)">
              <input type="radio" name="hxr_${id}" ${hxState[id] === o.value ? 'checked' : ''} />
              <span>${esc(o.label_ar)}</span>
            </label>`).join('')}
        </div>
      </div>`;
    }
    case 'history_type_selector': {
      // Drives which type-specific sections (pediatric/gynecological) appear below.
      return `<div class="hx-field">
        <label class="hx-label">${label}</label>
        <div class="hx-options">
          ${(item.options || []).map(o => `
            <label class="hx-radio-pill ${hxState[id] === o.value ? 'active' : ''}" onclick="hxSetHistoryType('${String(o.value).replace(/'/g,"\\'")}')">
              <input type="radio" name="hxr_${id}" ${hxState[id] === o.value ? 'checked' : ''} />
              <span>${esc(o.label_ar)}</span>
            </label>`).join('')}
        </div>
      </div>`;
    }
    case 'info_note': {
      // Static explanatory note, e.g. the Triadic Consultation guidance — not a form field.
      return `<div class="hx-field hx-info-note">
        <div class="hx-info-note-title">${esc(item.title_ar || '')}</div>
        <div class="hx-info-note-body">${esc(item.body_ar || '').replace(/\n/g, '<br>')}</div>
      </div>`;
    }
    case 'single_choice_with_conditional': {
      return `<div class="hx-field">
        <label class="hx-label">${label}</label>
        <div class="hx-options">
          ${(item.options || []).map(o => `
            <label class="hx-radio-pill ${hxState[id] === o.value ? 'active' : ''}" onclick="hxSetRadioConditional('${id}','${String(o.value).replace(/'/g,"\\'")}', this)">
              <input type="radio" name="hxr_${id}" ${hxState[id] === o.value ? 'checked' : ''} />
              <span>${esc(o.label_ar)}</span>
            </label>`).join('')}
        </div>
        ${(item.options || []).filter(o => o.has_extra_input).map(o => `
          <div class="hx-extra-input ${hxState[id] === o.value ? 'show' : ''}" data-extra-parent="${id}" id="hxExtra_${id}_${o.value}">
            <input type="text" class="hx-input" placeholder="${esc(o.extra_input_label_ar || '')}" value="${esc(hxState[id + '__' + o.value] ?? '')}"
              oninput="hxSetVal('${id}__${o.value}', this.value)" />
          </div>`).join('')}
      </div>`;
    }
    case 'multiple_choice': {
      const arr = Array.isArray(hxState[id]) ? hxState[id] : [];
      return `<div class="hx-field">
        <label class="hx-label">${label}</label>
        <div class="hx-options">
          ${(item.options || []).map(o => `
            <label class="hx-check-pill ${arr.includes(o.value) ? 'active' : ''}">
              <input type="checkbox" ${arr.includes(o.value) ? 'checked' : ''} onchange="hxToggleMulti('${id}','${String(o.value).replace(/'/g,"\\'")}', this)" />
              <span>${esc(o.label_ar)}</span>
            </label>`).join('')}
        </div>
      </div>`;
    }
    case 'rating_scale_1_to_10': {
      const min = item.min_value ?? 1, max = item.max_value ?? 10;
      const nums = [];
      for (let n = min; n <= max; n++) nums.push(n);
      return `<div class="hx-field">
        <label class="hx-label">${label}</label>
        <div class="hx-rating-row" id="hxRating_${id}">
          ${nums.map(n => `<button type="button" class="hx-rating-btn ${hxState[id] === n ? 'active' : ''}" onclick="hxSetRating('${id}',${n},this)">${n}</button>`).join('')}
        </div>
        <div class="hx-rating-labels"><span>${esc(item.min_label || min)}</span><span>${esc(item.max_label || max)}</span></div>
      </div>`;
    }
    case 'interactive_anatomy_map': {
      const siteImg = hxGetSiteImage();
      const spots = Array.isArray(hxState[id + '_spots']) ? hxState[id + '_spots'] : [];
      const pinsHtml = spots.map(p => `<div class="hx-spot-pin" style="left:${p.x}%;top:${p.y}%;"></div>`).join('');
      const mapHtml = siteImg
        ? `<div class="hx-anatomy-wrap" onclick="hxAnatomyClick(event,'${id}')">
             <img src="${siteImg}" alt="anatomy" />
             ${pinsHtml}
           </div>`
        : `<div class="hx-anatomy-placeholder">⚠️ لسا ما انرفعت صورة site.png<br><button class="btn btn-ghost btn-sm" style="margin-top:10px;" onclick="showAdmin()">ارفعها من الإعدادات</button></div>`;
      return `<div class="hx-field">
        <label class="hx-label">${label}</label>
        <div style="color:var(--text2);font-size:0.82rem;margin-bottom:10px;">${esc(item.instructions_ar || '')}</div>
        ${mapHtml}
        ${siteImg ? `<div style="margin-top:8px;"><button class="btn btn-ghost btn-sm" onclick="hxClearSpots('${id}')">🗑️ امسح كل النقاط</button></div>` : ''}
        ${item.allow_free_text ? `<div style="margin-top:12px;">
          <label class="hx-label">${esc(item.text_label_ar || '')}</label>
          <textarea class="hx-textarea" oninput="hxSetVal('${id}_text', this.value)">${esc(hxState[id + '_text'] ?? '')}</textarea>
        </div>` : ''}
      </div>`;
    }
    default:
      return '';
  }
}

// ── State setters / interaction handlers ──
function hxSetVal(id, value) { hxState[id] = value; }

function hxToggleSubfields(id, checked) {
  hxState[id] = checked;
  const el = document.getElementById('hxSub_' + id);
  if (el) el.classList.toggle('show', checked);
}

function hxSetRadio(id, value, el) {
  hxState[id] = value;
  el.parentElement.querySelectorAll('.hx-radio-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

function hxSetRadioConditional(id, value, el) {
  hxSetRadio(id, value, el);
  document.querySelectorAll(`[data-extra-parent="${id}"]`).forEach(e => e.classList.remove('show'));
  const target = document.getElementById(`hxExtra_${id}_${value}`);
  if (target) target.classList.add('show');
}

function hxToggleMulti(id, value, el) {
  const arr = Array.isArray(hxState[id]) ? hxState[id].slice() : [];
  const idx = arr.indexOf(value);
  if (idx === -1) arr.push(value); else arr.splice(idx, 1);
  hxState[id] = arr;
  el.parentElement.classList.toggle('active', arr.includes(value));
}

function hxSetRating(id, n, el) {
  hxState[id] = n;
  el.parentElement.querySelectorAll('.hx-rating-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function hxRecalcFormulas(containerId) {
  const formulas = hxFormulas[containerId];
  if (!formulas) return;
  formulas.forEach(f => {
    const computed = safeCompute(f.formula, hxState);
    if (computed != null) {
      hxState[f.id] = computed;
      const el = document.getElementById('hxVal_' + f.id);
      if (el) el.value = computed;
    }
  });
}

function hxAnatomyClick(evt, id) {
  const wrap = evt.currentTarget;
  const rect = wrap.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * 100;
  const y = ((evt.clientY - rect.top) / rect.height) * 100;
  const key = id + '_spots';
  if (!Array.isArray(hxState[key])) hxState[key] = [];
  hxState[key].push({ x: +x.toFixed(1), y: +y.toFixed(1) });
  const pin = document.createElement('div');
  pin.className = 'hx-spot-pin';
  pin.style.left = x + '%';
  pin.style.top = y + '%';
  wrap.appendChild(pin);
}

function hxClearSpots(id) {
  hxState[id + '_spots'] = [];
  const area = document.getElementById('hxFormArea');
  const wrap = area.querySelector('.hx-anatomy-wrap');
  if (wrap) wrap.querySelectorAll('.hx-spot-pin').forEach(p => p.remove());
}

// ── Save: build nested payload grouped by section_id (and system_id) ──
function hxBuildPayload() {
  const payload = {};
  (hxSchema.sections || []).forEach(section => {
    const bucket = {};
    const collectItem = it => {
      if (it.id in hxState) bucket[it.id] = hxState[it.id];
      if (it.type === 'checkbox_with_subfields') {
        (it.subfields || []).forEach(sf => { if (sf.id in hxState) bucket[sf.id] = hxState[sf.id]; });
      }
      if (it.type === 'single_choice_with_conditional') {
        (it.options || []).forEach(o => { const k = it.id + '__' + o.value; if (k in hxState) bucket[k] = hxState[k]; });
      }
      if (it.type === 'interactive_anatomy_map') {
        if ((it.id + '_spots') in hxState) bucket[it.id + '_spots'] = hxState[it.id + '_spots'];
        if ((it.id + '_text') in hxState) bucket[it.id + '_text'] = hxState[it.id + '_text'];
      }
    };
    if (Array.isArray(section.items)) section.items.forEach(collectItem);
    if (Array.isArray(section.systems)) section.systems.forEach(sys => (sys.items || sys.questions || []).forEach(collectItem));
    payload[section.section_id] = bucket;
  });
  return payload;
}

function hxSaveEntry() {
  // recalc all formulas one final time before saving
  Object.keys(hxFormulas).forEach(hxRecalcFormulas);
  const payload = hxBuildPayload();
  if (hxCurrentEntryId) {
    const entry = hxEntries.find(e => e.id === hxCurrentEntryId);
    if (entry) { entry.payload = payload; entry.savedAt = new Date().toLocaleString('ar-EG'); }
  } else {
    hxEntries.push({ id: Date.now(), payload, savedAt: new Date().toLocaleString('ar-EG') });
  }
  saveHxEntries();
  showToast('✅ تم حفظ الفحص');
  hxShowList();
}

function renderTricks() {
  const q = (document.getElementById('tricksSearch')?.value || '').trim().toLowerCase();
  const countEl = document.getElementById('tricksCount');
  const list = document.getElementById('tricksList');

  // Collect all tricks from all cases
  const allTricks = [];
  cases.forEach(c => {
    if (!c.tricks) return;
    const lines = c.tricks.split('\n').map(l => l.trim()).filter(Boolean);
    lines.forEach(line => {
      allTricks.push({ text: line, caseName: c.name, specialty: c.specialty, diagnosis: c.diagnosis });
    });
  });

  const filtered = q
    ? allTricks.filter(t => t.text.toLowerCase().includes(q) || t.caseName.toLowerCase().includes(q))
    : allTricks;

  if (countEl) countEl.textContent = `${filtered.length} تريكة من ${cases.filter(c => c.tricks).length} حالة`;

  if (!filtered.length) {
    list.innerHTML = `
      <div class="tricks-empty">
        <div class="icon">💡</div>
        <h3>${q ? 'لا توجد نتائج' : 'لا توجد تريكات بعد'}</h3>
        <p>${q ? 'جرب كلمة أخرى' : 'أضف تريكات لحالاتك من خلال تعديلها'}</p>
      </div>`;
    return;
  }

  // If searching — flat list
  if (q) {
    list.innerHTML = `<div class="tricks-list">${
      filtered.map(t => `
        <div class="trick-item">
          <div class="trick-bullet">💡</div>
          <div class="trick-text">${t.text}</div>
          <div class="trick-case-tag">${t.caseName}</div>
        </div>`).join('')
    }</div>`;
    return;
  }

  // Group by case
  const byCaseName = {};
  allTricks.forEach(t => {
    if (!byCaseName[t.caseName]) byCaseName[t.caseName] = { items: [], specialty: t.specialty };
    byCaseName[t.caseName].items.push(t.text);
  });

  list.innerHTML = Object.entries(byCaseName).map(([name, data]) => `
    <div class="tricks-group">
      <div class="tricks-group-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display==='none' ? 'flex' : 'none'">
        <span style="font-size:1.1rem;">💡</span>
        <div class="tricks-group-name">${name}</div>
        <span style="font-size:0.78rem;color:var(--text2);margin-left:8px;">${data.specialty || ''}</span>
        <div class="tricks-group-count">${data.items.length} تريكة</div>
        <span style="color:var(--text2);font-size:0.8rem;margin-right:4px;">▼</span>
      </div>
      <div class="tricks-list" style="display:flex;">
        ${data.items.map(text => `
          <div class="trick-item">
            <div class="trick-bullet">💡</div>
            <div class="trick-text">${text}</div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

