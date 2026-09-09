// ════════════════════════════════════════════════
//  ECG LIBRARY
//  Field order (both form entry and read-only view) is fixed:
//  ecg_image → ecg_analysis → diagnosis → management_and_treatment →
//  common_pitfalls → summary_recap
// ════════════════════════════════════════════════
let ecgCases = [];
let ecgLoaded = false;
let ecgCurrentId = null;
let ecgPendingImage = null; // holds the compressed base64 image while editing, before save
let ecgPendingImageNormal = null; // optional "normal ECG" reference image for the comparison slider
let ecgPasteTarget = 'case'; // which image slot (case/normal) receives a Ctrl+V paste

async function loadEcgCases() {
  try { ecgCases = await idbGetAllEcgCases(); } catch (e) { ecgCases = []; }
  ecgLoaded = true;
}

async function showEcgLibraryView() {
  hideAllViews();
  document.getElementById('ecgLibraryView').classList.add('active');
  if (!ecgLoaded) await loadEcgCases();
  ecgShowList();
}

function ecgShowList() {
  ecgCurrentId = null;
  ecgPendingImage = null;
  document.getElementById('ecgFormArea').style.display = 'none';
  document.getElementById('ecgDetailArea').style.display = 'none';
  document.getElementById('ecgListArea').style.display = 'grid';
  document.getElementById('ecgListToolbar').style.display = 'flex';
  document.getElementById('ecgBackBtn').textContent = '← الرجوع';
  document.getElementById('ecgBackBtn').onclick = showHome;
  renderEcgList();
}

function renderEcgList() {
  const grid = document.getElementById('ecgListArea');
  const countEl = document.getElementById('ecgListCount');
  const q = (document.getElementById('ecgSearch')?.value || '').trim().toLowerCase();
  const filtered = q
    ? ecgCases.filter(c => `${c.title||''} ${c.diagnosis||''} ${c.ecg_analysis||''}`.toLowerCase().includes(q))
    : ecgCases;
  countEl.textContent = `${ecgCases.length} حالة ECG`;
  if (!filtered.length) {
    grid.innerHTML = `<div class="notes-empty" style="grid-column:1/-1;"><div class="icon">🫀</div><h3>${q ? 'لا توجد نتائج' : 'لا توجد حالات ECG بعد'}</h3><p>${q ? 'جرب كلمة أخرى' : 'اضغط "➕ حالة ECG جديدة" لإضافة أول حالة'}</p></div>`;
    return;
  }
  grid.innerHTML = filtered.slice().reverse().map(c => `
    <div class="ecg-tile" onclick="ecgOpenDetail('${c.id}')">
      ${c.ecg_image ? `<img class="ecg-tile-img" src="${c.ecg_image}" alt="" />` : `<div class="ecg-tile-img-placeholder">🫀</div>`}
      <div class="ecg-tile-body">
        <div class="ecg-tile-diagnosis">${esc(c.diagnosis || c.title || 'حالة بدون تشخيص')}</div>
        <div class="ecg-tile-meta">${esc(c.createdAt || '')}</div>
      </div>
      <div class="ecg-tile-actions">
        <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;" onclick="event.stopPropagation();ecgOpenForm('${c.id}')">✏️ تعديل</button>
        <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;color:var(--red);" onclick="event.stopPropagation();ecgDeleteEntry('${c.id}')">🗑️</button>
      </div>
    </div>`).join('');
}

function ecgDeleteEntry(id) {
  const idx = ecgCases.findIndex(c => c.id === id);
  if (idx < 0) return;
  const removed = ecgCases[idx];
  ecgCases.splice(idx, 1);
  idbDeleteEcgCase(id);
  renderEcgList();
  showUndoToast('تم حذف حالة الـ ECG', async () => {
    ecgCases.splice(idx, 0, removed);
    await idbPutEcgCase(removed);
    renderEcgList();
  });
}

function ecgNewEntry() {
  ecgOpenForm(null);
}

function ecgOpenForm(id) {
  ecgCurrentId = id;
  const entry = id ? ecgCases.find(c => c.id === id) : null;
  ecgPendingImage = entry?.ecg_image || null;
  ecgPendingImageNormal = entry?.ecg_image_normal || null;
  ecgPasteTarget = 'case';
  document.getElementById('ecgListArea').style.display = 'none';
  document.getElementById('ecgListToolbar').style.display = 'none';
  document.getElementById('ecgDetailArea').style.display = 'none';
  document.getElementById('ecgBackBtn').textContent = '← رجوع للقائمة';
  document.getElementById('ecgBackBtn').onclick = ecgShowList;
  document.getElementById('ecgListCount').textContent = '';
  const area = document.getElementById('ecgFormArea');
  area.style.display = 'block';
  area.innerHTML = `
    <div class="ecg-field">
      <label class="ecg-label">🖼️ صورة الـ ECG (الحالة)</label>
      <input type="file" id="ecgImageFile" accept="image/*" style="display:none;" onchange="ecgHandleImageUpload(this.files)" />
      <div id="ecgImagePreviewWrap" onclick="ecgPasteTarget='case'" tabindex="0">
        ${ecgPendingImage
          ? `<img class="ecg-image-preview" src="${ecgPendingImage}" onclick="ecgPasteTarget='case';document.getElementById('ecgImageFile').click()" alt="" />`
          : `<div class="ecg-image-drop" onclick="ecgPasteTarget='case';document.getElementById('ecgImageFile').click()">📁 اضغط لرفع صورة الـ ECG، أو الصقها مباشرة (Ctrl+V)</div>`}
      </div>
    </div>
    <div class="ecg-field">
      <label class="ecg-label">🖼️ صورة ECG طبيعية للمقارنة (اختياري — Before/After Slider)</label>
      <input type="file" id="ecgImageFileNormal" accept="image/*" style="display:none;" onchange="ecgHandleImageUpload(this.files, true)" />
      <div id="ecgImagePreviewWrapNormal" onclick="ecgPasteTarget='normal'" tabindex="0">
        ${ecgPendingImageNormal
          ? `<img class="ecg-image-preview" src="${ecgPendingImageNormal}" onclick="ecgPasteTarget='normal';document.getElementById('ecgImageFileNormal').click()" alt="" />`
          : `<div class="ecg-image-drop" onclick="ecgPasteTarget='normal';document.getElementById('ecgImageFileNormal').click()">📁 اضغط لرفع صورة ECG طبيعية، أو الصقها (Ctrl+V) — إذا ضفتها بيطلع Slider مقارنة تلقائي بصفحة العرض</div>`}
      </div>
    </div>
    <div class="ecg-field">
      <label class="ecg-label">🔬 تحليل الـ ECG (Analysis)</label>
      <textarea class="form-textarea" id="ecgAnalysisInput" rows="5" placeholder="Rate, Rhythm, Axis, ST-segment changes...">${esc(entry?.ecg_analysis || '')}</textarea>
    </div>
    <div class="ecg-field">
      <label class="ecg-label">🎯 التشخيص (Diagnosis)</label>
      <input class="form-input" id="ecgDiagnosisInput" placeholder="مثال: Acute Inferior STEMI - RCA occlusion" value="${(entry?.diagnosis || '').replace(/"/g,'&quot;')}" />
    </div>
    <div class="ecg-field">
      <label class="ecg-label">💊 العلاج (Management & Treatment)</label>
      <textarea class="form-textarea" id="ecgTreatmentInput" rows="4" placeholder="خطة العلاج والتصرف السريع...">${esc(entry?.management_and_treatment || '')}</textarea>
    </div>
    <div class="ecg-field">
      <label class="ecg-label">🚫 الأخطاء الشائعة (Common Pitfalls)</label>
      <textarea class="form-textarea" id="ecgPitfallsInput" rows="4" placeholder="الفخاخ، ألغام الامتحانات، الفرق بينها وبين حالات مشابهة...">${esc(entry?.common_pitfalls || '')}</textarea>
    </div>
    <div class="ecg-field">
      <label class="ecg-label">📝 الملخص (Summary Recap)</label>
      <textarea class="form-textarea" id="ecgSummaryInput" rows="3" placeholder="ملخص الحالة السريع...">${esc(entry?.summary_recap || '')}</textarea>
    </div>
    <div class="hx-save-bar">
      <button class="btn btn-primary" onclick="ecgSaveEntry()">💾 حفظ حالة الـ ECG</button>
      <button class="btn btn-ghost" onclick="ecgShowList()">إلغاء</button>
    </div>`;
}

function ecgHandleImageUpload(fileList, isNormal) {
  const file = fileList?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => ecgSetPendingImageFromDataUrl(e.target.result, isNormal);
  reader.readAsDataURL(file);
  document.getElementById(isNormal ? 'ecgImageFileNormal' : 'ecgImageFile').value = '';
}

function ecgSetPendingImageFromDataUrl(dataUrl, isNormal) {
  compressImageDataUrl(dataUrl, compressed => {
    if (isNormal) {
      ecgPendingImageNormal = compressed;
      const wrap = document.getElementById('ecgImagePreviewWrapNormal');
      if (wrap) wrap.innerHTML = `<img class="ecg-image-preview" src="${compressed}" onclick="ecgPasteTarget='normal';document.getElementById('ecgImageFileNormal').click()" alt="" />`;
    } else {
      ecgPendingImage = compressed;
      const wrap = document.getElementById('ecgImagePreviewWrap');
      if (wrap) wrap.innerHTML = `<img class="ecg-image-preview" src="${compressed}" onclick="ecgPasteTarget='case';document.getElementById('ecgImageFile').click()" alt="" />`;
    }
  }, 1600, 0.85);
}

// Lets the user paste an ECG image straight from the clipboard (Ctrl+V) while the form is open —
// goes into whichever image slot (case/normal) was last clicked, via ecgPasteTarget.
document.addEventListener('paste', (e) => {
  const ecgArea = document.getElementById('ecgFormArea');
  if (!ecgArea || ecgArea.style.display === 'none') return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      e.preventDefault();
      const isNormal = ecgPasteTarget === 'normal';
      const reader = new FileReader();
      reader.onload = ev => {
        ecgSetPendingImageFromDataUrl(ev.target.result, isNormal);
        showToast('✅ تم لصق الصورة');
      };
      reader.readAsDataURL(file);
      break;
    }
  }
});

async function ecgSaveEntry() {
  const diagnosis = document.getElementById('ecgDiagnosisInput').value.trim();
  const entry = {
    id: ecgCurrentId || genId(),
    title: diagnosis,
    createdAt: new Date().toLocaleString('ar-EG'),
    ecg_image: ecgPendingImage || '',
    ecg_image_normal: ecgPendingImageNormal || '',
    ecg_analysis: document.getElementById('ecgAnalysisInput').value,
    diagnosis: diagnosis,
    management_and_treatment: document.getElementById('ecgTreatmentInput').value,
    common_pitfalls: document.getElementById('ecgPitfallsInput').value,
    summary_recap: document.getElementById('ecgSummaryInput').value,
  };
  try {
    await idbPutEcgCase(entry);
  } catch (e) {
    console.error('ecgSaveEntry failed', e);
    showToast('⚠️ فشل الحفظ فعليًا (الصور كبيرة جدًا على الأغلب) — الحالة ما انحفظت');
    return;
  }
  if (ecgCurrentId) {
    const idx = ecgCases.findIndex(c => c.id === ecgCurrentId);
    if (idx >= 0) ecgCases[idx] = entry; else ecgCases.push(entry);
  } else {
    ecgCases.push(entry);
  }
  showToast('✅ تم حفظ حالة الـ ECG فعليًا');
  ecgShowList();
}

function ecgEntryDetailHtml(entry, opts) {
  opts = opts || {};
  const sections = [
    ['analysis', '🔬 تحليل الـ ECG', entry.ecg_analysis],
    ['diagnosis', '🎯 التشخيص', entry.diagnosis],
    ['treatment', '💊 العلاج', entry.management_and_treatment],
    ['pitfalls', '🚫 الأخطاء الشائعة', entry.common_pitfalls],
    ['summary', '📝 الملخص', entry.summary_recap],
  ];
  return `
    <div class="ecg-detail-header">
      <div>
        <div class="ecg-detail-title">${esc(entry.diagnosis || 'حالة ECG')}</div>
        <div class="ecg-detail-meta">${esc(entry.createdAt || '')}</div>
      </div>
      ${opts.hideEditBtn ? '' : `<button class="btn btn-primary btn-sm" onclick="ecgOpenForm('${entry.id}')">✏️ تعديل</button>`}
    </div>
    ${entry.ecg_image && entry.ecg_image_normal ? `
    <div class="compare-slider" id="cmp_${entry.id}">
      <img class="compare-img-base" src="${entry.ecg_image}" alt="" />
      <img class="compare-img-overlay" src="${entry.ecg_image_normal}" style="clip-path: inset(0 50% 0 0);" alt="" />
      <div class="compare-handle" style="left:50%;"></div>
      <input type="range" min="0" max="100" value="50" class="compare-range" oninput="ecgUpdateCompareSlider('${entry.id}', this.value)" />
    </div>
    <div class="compare-labels"><span>طبيعي (Normal)</span><span>الحالة (Case)</span></div>
    ` : (entry.ecg_image ? `<div class="ecg-detail-img-wrap"><img class="ecg-detail-img" src="${entry.ecg_image}" onclick="openLightbox('${entry.ecg_image}')" alt="" /></div>` : '')}
    ${sections.filter(([,,body]) => body && body.trim()).map(([key, title, body]) => `
      <div class="ecg-detail-section ${key}">
        <div class="ecg-detail-section-title">${title}</div>
        <div class="ecg-detail-section-body">${hl(esc(body)).split('\n').filter(Boolean).length > 1 ? hl(esc(body)).split('\n').map(l=>`<div>${l}</div>`).join('') : hl(esc(body))}</div>
      </div>`).join('')}
  `;
}

function ecgUpdateCompareSlider(id, val) {
  const wrap = document.getElementById('cmp_' + id);
  if (!wrap) return;
  const overlay = wrap.querySelector('.compare-img-overlay');
  const handle = wrap.querySelector('.compare-handle');
  overlay.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
  handle.style.left = val + '%';
}

function ecgOpenDetail(id) {
  const entry = ecgCases.find(c => c.id === id);
  if (!entry) return;
  ecgCurrentId = id;
  document.getElementById('ecgListArea').style.display = 'none';
  document.getElementById('ecgListToolbar').style.display = 'none';
  document.getElementById('ecgFormArea').style.display = 'none';
  document.getElementById('ecgBackBtn').textContent = '← رجوع للقائمة';
  document.getElementById('ecgBackBtn').onclick = ecgShowList;
  document.getElementById('ecgListCount').textContent = '';
  const area = document.getElementById('ecgDetailArea');
  area.style.display = 'block';
  area.innerHTML = ecgEntryDetailHtml(entry);
}

function ecgViewAll() {
  if (!ecgCases.length) { showToast('⚠️ لا توجد حالات ECG بعد'); return; }
  document.getElementById('ecgListArea').style.display = 'none';
  document.getElementById('ecgListToolbar').style.display = 'none';
  document.getElementById('ecgFormArea').style.display = 'none';
  document.getElementById('ecgBackBtn').textContent = '← رجوع للقائمة';
  document.getElementById('ecgBackBtn').onclick = ecgShowList;
  document.getElementById('ecgListCount').textContent = `عرض ${ecgCases.length} حالة`;
  const area = document.getElementById('ecgDetailArea');
  area.style.display = 'block';
  area.innerHTML = ecgCases.slice().reverse().map(entry => `
    <div class="ecg-viewall-entry">${ecgEntryDetailHtml(entry, { hideEditBtn: true })}</div>
  `).join('<div class="ecg-viewall-divider"></div>');
}

