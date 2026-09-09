// ════════════════════════════════════════════════
//  X-RAY ATLAS MODULE
//  Fields: title, category (chest/abdomen/msk), image_normal (for the
//  compare slider), image_abnormal (main image), image_highlighted
//  (pathology-toggle image), key_points.
// ════════════════════════════════════════════════
const XRAY_CATEGORIES = { chest: 'الصدر (Chest)', abdomen: 'البطن (Abdomen)', msk: 'العظام والكسور (MSK)' };
let xrayCases = [];
let xrayLoaded = false;
let xrayCurrentId = null;
let xrayActiveCategory = 'all';
let xrayPendingImages = { normal: null, abnormal: null, highlighted: null };
let xrayPasteTarget = 'abnormal';

async function loadXrayCases() {
  try { xrayCases = await idbGetAllXrayCases(); } catch (e) { xrayCases = []; }
  xrayLoaded = true;
}

async function showXrayLibraryView() {
  hideAllViews();
  document.getElementById('xrayLibraryView').classList.add('active');
  if (!xrayLoaded) await loadXrayCases();
  xrayShowList();
}

function xrayShowList() {
  xrayCurrentId = null;
  xrayPendingImages = { normal: null, abnormal: null, highlighted: null };
  document.getElementById('xrayFormArea').style.display = 'none';
  document.getElementById('xrayDetailArea').style.display = 'none';
  document.getElementById('xrayListArea').style.display = 'grid';
  document.getElementById('xrayListToolbar').style.display = 'flex';
  document.getElementById('xrayCategoryRow').style.display = 'flex';
  document.getElementById('xrayBackBtn').textContent = '← الرجوع';
  document.getElementById('xrayBackBtn').onclick = showHome;
  renderXrayCategoryRow();
  renderXrayList();
}

function renderXrayCategoryRow() {
  const row = document.getElementById('xrayCategoryRow');
  const cats = ['all', ...Object.keys(XRAY_CATEGORIES)];
  row.innerHTML = cats.map(cat => {
    const count = cat === 'all' ? xrayCases.length : xrayCases.filter(x => x.category === cat).length;
    const label = cat === 'all' ? 'الكل (All)' : XRAY_CATEGORIES[cat];
    return `<button class="lab-panel-chip ${xrayActiveCategory === cat ? 'active' : ''}" onclick="xraySetCategory('${cat}')">${label} <span class="count">${count}</span></button>`;
  }).join('');
}

function xraySetCategory(cat) {
  xrayActiveCategory = cat;
  renderXrayCategoryRow();
  renderXrayList();
}

function renderXrayList() {
  const grid = document.getElementById('xrayListArea');
  const countEl = document.getElementById('xrayListCount');
  const q = (document.getElementById('xraySearch')?.value || '').trim().toLowerCase();
  let filtered = xrayActiveCategory === 'all' ? xrayCases : xrayCases.filter(x => x.category === xrayActiveCategory);
  if (q) filtered = filtered.filter(x => `${x.title||''} ${x.key_points||''}`.toLowerCase().includes(q));
  countEl.textContent = `${xrayCases.length} حالة أشعة`;
  if (!filtered.length) {
    grid.innerHTML = `<div class="notes-empty" style="grid-column:1/-1;"><div class="icon">🩻</div><h3>${q ? 'لا توجد نتائج' : 'لا توجد حالات أشعة بعد'}</h3><p>${q ? 'جرب كلمة أخرى' : 'اضغط "➕ حالة أشعة جديدة" لإضافة أول حالة'}</p></div>`;
    return;
  }
  grid.innerHTML = filtered.slice().reverse().map(x => `
    <div class="ecg-tile" onclick="xrayOpenDetail('${x.id}')">
      <div class="xray-tile-img-wrap">
        ${x.category ? `<span class="xray-tile-category">${esc(XRAY_CATEGORIES[x.category] || x.category)}</span>` : ''}
        ${x.image_abnormal ? `<img class="ecg-tile-img" src="${x.image_abnormal}" alt="" />` : `<div class="ecg-tile-img-placeholder">🩻</div>`}
      </div>
      <div class="ecg-tile-body">
        <div class="ecg-tile-diagnosis">${esc(x.title || 'حالة بدون اسم')}</div>
        <div class="ecg-tile-meta">${esc(x.createdAt || '')}</div>
      </div>
      <div class="ecg-tile-actions">
        <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;" onclick="event.stopPropagation();xrayOpenForm('${x.id}')">✏️ تعديل</button>
        <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;color:var(--red);" onclick="event.stopPropagation();xrayDeleteEntry('${x.id}')">🗑️</button>
      </div>
    </div>`).join('');
}

function xrayDeleteEntry(id) {
  const idx = xrayCases.findIndex(x => x.id === id);
  if (idx < 0) return;
  const removed = xrayCases[idx];
  xrayCases.splice(idx, 1);
  idbDeleteXrayCase(id);
  renderXrayCategoryRow();
  renderXrayList();
  showUndoToast('تم حذف حالة الأشعة', async () => {
    xrayCases.splice(idx, 0, removed);
    await idbPutXrayCase(removed);
    renderXrayCategoryRow();
    renderXrayList();
  });
}

function xrayNewEntry() { xrayOpenForm(null); }

function xrayImageFieldHtml(key, label, hint) {
  const img = xrayPendingImages[key];
  return `
    <div class="ecg-field">
      <label class="ecg-label">${label}</label>
      <input type="file" id="xrayImageFile_${key}" accept="image/*" style="display:none;" onchange="xrayHandleImageUpload(this.files,'${key}')" />
      <div id="xrayImagePreviewWrap_${key}" onclick="xrayPasteTarget='${key}'" tabindex="0">
        ${img
          ? `<img class="ecg-image-preview" src="${img}" onclick="xrayPasteTarget='${key}';document.getElementById('xrayImageFile_${key}').click()" alt="" />`
          : `<div class="ecg-image-drop" onclick="xrayPasteTarget='${key}';document.getElementById('xrayImageFile_${key}').click()">📁 اضغط لرفع الصورة، أو الصقها (Ctrl+V)${hint ? '<br><small>' + hint + '</small>' : ''}</div>`}
      </div>
    </div>`;
}

function xrayOpenForm(id) {
  xrayCurrentId = id;
  const entry = id ? xrayCases.find(x => x.id === id) : null;
  xrayPendingImages = {
    normal: entry?.image_normal || null,
    abnormal: entry?.image_abnormal || null,
    highlighted: entry?.image_highlighted || null,
  };
  xrayPasteTarget = 'abnormal';
  document.getElementById('xrayListArea').style.display = 'none';
  document.getElementById('xrayListToolbar').style.display = 'none';
  document.getElementById('xrayCategoryRow').style.display = 'none';
  document.getElementById('xrayDetailArea').style.display = 'none';
  document.getElementById('xrayBackBtn').textContent = '← رجوع للقائمة';
  document.getElementById('xrayBackBtn').onclick = xrayShowList;
  document.getElementById('xrayListCount').textContent = '';
  const area = document.getElementById('xrayFormArea');
  area.style.display = 'block';
  area.innerHTML = `
    <div class="ecg-field">
      <label class="ecg-label">🏷️ اسم الحالة</label>
      <input class="form-input" id="xrayTitleInput" placeholder="مثال: Pneumothorax, Bowel Obstruction, Colles Fracture..." value="${(entry?.title || '').replace(/"/g,'&quot;')}" />
    </div>
    <div class="ecg-field">
      <label class="ecg-label">📁 التصنيف</label>
      <select class="xray-category-select" id="xrayCategoryInput">
        ${Object.entries(XRAY_CATEGORIES).map(([val, label]) => `<option value="${val}" ${entry?.category === val ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
    </div>
    ${xrayImageFieldHtml('abnormal', '🩻 الصورة الأساسية (Abnormal X-Ray)')}
    ${xrayImageFieldHtml('normal', '🖼️ صورة طبيعية للمقارنة (Normal X-Ray — Slider)', 'اختياري — إذا ضفتها بيطلع سلايدر مقارنة تلقائي')}
    ${xrayImageFieldHtml('highlighted', '🎨 صورة ملوّنة/موضّحة (Highlighted Pathology)', 'اختياري — إذا ضفتها بيطلع زر Show/Hide Pathology')}
    <div class="ecg-field">
      <label class="ecg-label">💡 High-Yield Key Points / Tricks</label>
      <textarea class="form-textarea" id="xrayKeyPointsInput" rows="5" placeholder="أهم الملاحظات والتريكات لهذه الحالة...">${esc(entry?.key_points || '')}</textarea>
    </div>
    <div class="hx-save-bar">
      <button class="btn btn-primary" onclick="xraySaveEntry()">💾 حفظ حالة الأشعة</button>
      <button class="btn btn-ghost" onclick="xrayShowList()">إلغاء</button>
    </div>`;
}

function xrayHandleImageUpload(fileList, key) {
  const file = fileList?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => xraySetPendingImage(e.target.result, key);
  reader.readAsDataURL(file);
  document.getElementById('xrayImageFile_' + key).value = '';
}

function xraySetPendingImage(dataUrl, key) {
  compressImageDataUrl(dataUrl, compressed => {
    xrayPendingImages[key] = compressed;
    const wrap = document.getElementById('xrayImagePreviewWrap_' + key);
    if (wrap) wrap.innerHTML = `<img class="ecg-image-preview" src="${compressed}" onclick="xrayPasteTarget='${key}';document.getElementById('xrayImageFile_${key}').click()" alt="" />`;
  }, 1600, 0.85);
}

document.addEventListener('paste', (e) => {
  const xrayArea = document.getElementById('xrayFormArea');
  if (!xrayArea || xrayArea.style.display === 'none') return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      e.preventDefault();
      const target = xrayPasteTarget;
      const reader = new FileReader();
      reader.onload = ev => {
        xraySetPendingImage(ev.target.result, target);
        showToast('✅ تم لصق الصورة');
      };
      reader.readAsDataURL(file);
      break;
    }
  }
});

async function xraySaveEntry() {
  const title = document.getElementById('xrayTitleInput').value.trim();
  const entry = {
    id: xrayCurrentId || genId(),
    title,
    category: document.getElementById('xrayCategoryInput').value,
    createdAt: new Date().toLocaleString('ar-EG'),
    image_normal: xrayPendingImages.normal || '',
    image_abnormal: xrayPendingImages.abnormal || '',
    image_highlighted: xrayPendingImages.highlighted || '',
    key_points: document.getElementById('xrayKeyPointsInput').value,
  };
  try {
    await idbPutXrayCase(entry);
  } catch (e) {
    console.error('xraySaveEntry failed', e);
    showToast('⚠️ فشل الحفظ فعليًا (الصور كبيرة جدًا على الأغلب) — حالة الأشعة ما انحفظت');
    return;
  }
  if (xrayCurrentId) {
    const idx = xrayCases.findIndex(x => x.id === xrayCurrentId);
    if (idx >= 0) xrayCases[idx] = entry; else xrayCases.push(entry);
  } else {
    xrayCases.push(entry);
  }
  showToast('✅ تم حفظ حالة الأشعة فعليًا');
  xrayShowList();
}

function xrayOpenDetail(id) {
  const entry = xrayCases.find(x => x.id === id);
  if (!entry) return;
  xrayCurrentId = id;
  document.getElementById('xrayListArea').style.display = 'none';
  document.getElementById('xrayListToolbar').style.display = 'none';
  document.getElementById('xrayCategoryRow').style.display = 'none';
  document.getElementById('xrayFormArea').style.display = 'none';
  document.getElementById('xrayBackBtn').textContent = '← رجوع للقائمة';
  document.getElementById('xrayBackBtn').onclick = xrayShowList;
  document.getElementById('xrayListCount').textContent = '';
  const area = document.getElementById('xrayDetailArea');
  area.style.display = 'block';

  const hasSlider = entry.image_normal && entry.image_abnormal;
  const mainImg = entry.image_abnormal || entry.image_highlighted;
  const canTogglePathology = !!entry.image_highlighted && !!entry.image_abnormal;

  const mediaHtml = hasSlider ? `
    <div class="compare-slider" id="xrayCmp_${entry.id}" data-abnormal="${entry.image_abnormal.replace(/"/g,'&quot;')}" data-highlighted="${(entry.image_highlighted||'').replace(/"/g,'&quot;')}">
      <img class="compare-img-base" id="xrayCmpBase_${entry.id}" src="${entry.image_abnormal}" alt="" />
      <img class="compare-img-overlay" src="${entry.image_normal}" style="clip-path: inset(0 50% 0 0);" alt="" />
      <div class="compare-handle" style="left:50%;"></div>
      <input type="range" min="0" max="100" value="50" class="compare-range" oninput="ecgUpdateCompareSlider2('xrayCmp_${entry.id}', this.value)" />
    </div>
    <div class="compare-labels"><span>طبيعي (Normal)</span><span>الحالة (Case)</span></div>
  ` : (mainImg ? `<div class="ecg-detail-img-wrap"><img class="ecg-detail-img" id="xraySingleImg_${entry.id}" src="${mainImg}" onclick="openLightbox('${mainImg}')" alt="" /></div>` : '');

  area.innerHTML = `
    <div class="ecg-detail-header">
      <div>
        <div class="ecg-detail-title">${esc(entry.title || 'حالة أشعة')}</div>
        <div class="ecg-detail-meta">${entry.category ? esc(XRAY_CATEGORIES[entry.category] || entry.category) + ' · ' : ''}${esc(entry.createdAt || '')}</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="xrayOpenForm('${entry.id}')">✏️ تعديل</button>
    </div>
    ${mediaHtml}
    ${canTogglePathology ? `
    <div class="xray-pathology-toggle-row">
      <button class="xray-pathology-toggle" id="xrayPathToggle_${entry.id}" onclick="xrayTogglePathology('${entry.id}')">🎨 Show Pathology</button>
    </div>` : ''}
    ${entry.key_points ? `<div class="ecg-detail-section"><div class="ecg-detail-section-title">💡 High-Yield Key Points / Tricks</div><div class="ecg-detail-section-body">${hl(esc(entry.key_points))}</div></div>` : ''}
  `;
}

// Generic compare-slider updater (shared shape with ecgUpdateCompareSlider, kept separate
// since X-Ray sliders live inside a container keyed by a string id, not a bare entry id)
function ecgUpdateCompareSlider2(wrapId, val) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const overlay = wrap.querySelector('.compare-img-overlay');
  const handle = wrap.querySelector('.compare-handle');
  overlay.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
  handle.style.left = val + '%';
}

function xrayTogglePathology(id) {
  const wrap = document.getElementById('xrayCmp_' + id);
  const singleImg = document.getElementById('xraySingleImg_' + id);
  const btn = document.getElementById('xrayPathToggle_' + id);
  const isActive = btn.classList.toggle('active');
  btn.textContent = isActive ? '🙈 Hide Pathology' : '🎨 Show Pathology';
  if (wrap) {
    const base = document.getElementById('xrayCmpBase_' + id);
    if (base) base.src = isActive ? wrap.dataset.highlighted : wrap.dataset.abnormal;
  } else if (singleImg) {
    const entry = xrayCases.find(x => x.id === id);
    if (entry) singleImg.src = isActive ? (entry.image_highlighted || entry.image_abnormal) : entry.image_abnormal;
  }
}

