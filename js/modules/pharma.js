// ════════════════════════════════════════════════
//  PHARMACOLOGY QUICK-CARDS MODULE
//  Each card = fixed structure (drug_name, drug_class, trade_names,
//  main_indication, clinical_case, mechanism_of_action, visual story
//  image/YouTube link, side_effects, contraindications, tricks).
//  "وضع الاختبار" (test mode) blurs every section except the drug name;
//  tapping a section reveals it progressively. A bulk-paste parser reads
//  a labeled text block and auto-fills the whole form.
// ════════════════════════════════════════════════
const PHARMA_FIELD_DEFS = [
  { key: 'drug_class',       label: 'Drug Family / Class',      icon: '🧬' },
  { key: 'trade_names',      label: 'Trade Names',              icon: '🏷️' },
  { key: 'main_indication',  label: 'Main Indication',          icon: '🎯' },
  { key: 'clinical_case',    label: 'Clinical Scenario / Case',  icon: '🩺' },
  { key: 'mechanism',        label: 'Mechanism of Action (MoA)', icon: '⚙️' },
  { key: 'side_effects',     label: 'High-Yield Side Effects',   icon: '⚠️' },
  { key: 'contraindications',label: 'Contraindications & Warnings', icon: '🚫' },
  { key: 'tricks',           label: 'تريكات مهمة',               icon: '💡' },
];

let pharmaCards = [];
let pharmaLoaded = false;
let pharmaCurrentId = null;
let pharmaTestMode = false;
let pharmaPendingImage = null; // visual mnemonic image (dataURL)
let pharmaMcqCount = 0;

async function loadPharmaCards() {
  try { pharmaCards = await idbGetAllPharmaCards(); } catch (e) { pharmaCards = []; }
  pharmaLoaded = true;
}

async function showPharmaLibraryView() {
  hideAllViews();
  document.getElementById('pharmaLibraryView').classList.add('active');
  if (!pharmaLoaded) {
    const grid = document.getElementById('pharmaListArea');
    if (grid) grid.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';
    await loadPharmaCards();
  }
  pharmaShowList();
}

function pharmaShowList() {
  pharmaCurrentId = null;
  pharmaPendingImage = null;
  document.getElementById('pharmaFormArea').style.display = 'none';
  document.getElementById('pharmaDetailArea').style.display = 'none';
  document.getElementById('pharmaListArea').style.display = 'flex';
  document.getElementById('pharmaListToolbar').style.display = 'flex';
  document.getElementById('pharmaBackBtn').textContent = '← الرجوع';
  document.getElementById('pharmaBackBtn').onclick = showHome;
  renderPharmaList();
}

function pharmaToggleTestMode() {
  pharmaTestMode = !pharmaTestMode;
  document.getElementById('pharmaTestModeBtn').textContent = pharmaTestMode ? '👁️ إظهار الكل' : '🙈 وضع الاختبار';
  document.getElementById('pharmaTestModeBtn').classList.toggle('active', pharmaTestMode);
}

function pharmaClassColor(str) {
  const palette = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) % 1000;
  return palette[h % palette.length];
}

function renderPharmaList() {
  const grid = document.getElementById('pharmaListArea');
  const countEl = document.getElementById('pharmaListCount');
  const q = (document.getElementById('pharmaSearch')?.value || '').trim().toLowerCase();
  let filtered = pharmaCards;
  if (q) filtered = filtered.filter(c => `${c.drug_name||''} ${c.drug_class||''} ${c.trade_names||''}`.toLowerCase().includes(q));
  countEl.textContent = `${pharmaCards.length} دواء`;
  if (!filtered.length) {
    grid.innerHTML = `<div class="notes-empty"><div class="icon">💊</div><h3>${q ? 'لا توجد نتائج' : 'لا توجد بطاقات أدوية بعد'}</h3><p>${q ? 'جرب كلمة أخرى' : 'اضغط "➕ دواء جديد" أو "🪄 لصق تلقائي" لإضافة أول بطاقة'}</p></div>`;
    return;
  }
  grid.innerHTML = filtered.slice().reverse().map(c => {
    const accent = pharmaClassColor(c.drug_class || c.drug_name || '');
    const thumb = c.visual_image
      ? `<img class="pharma-list-thumb" src="${c.visual_image}" alt="" />`
      : `<div class="pharma-list-thumb-fallback" style="background:linear-gradient(135deg,${accent},${accent}99);">💊</div>`;
    const tradeFirst = (c.trade_names || '').split(',').map(t => t.trim()).filter(Boolean)[0];
    return `
    <div class="pharma-list-card" style="border-inline-start:4px solid ${accent};position:relative;" onclick="pharmaOpenDetail('${c.id}')">
      ${c.mastered ? `<span class="pharma-mastered-badge" title="تمت الدراسة">🎯</span>` : ''}
      ${thumb}
      <div class="pharma-list-body">
        <div class="pharma-list-name">${esc(c.drug_name || 'دواء بدون اسم')}</div>
        <div class="pharma-list-class">${c.drug_class ? esc(c.drug_class) : ''}${c.drug_class && tradeFirst ? ' · ' : ''}${tradeFirst ? esc(tradeFirst) + (c.trade_names.includes(',') ? '…' : '') : ''}</div>
        <div class="pharma-list-meta">${esc(timeAgo(c.updatedAt || c.createdAt))}</div>
      </div>
      <div class="pharma-list-actions">
        <button class="btn btn-ghost btn-sm" style="padding:6px 10px;font-size:0.75rem;" onclick="event.stopPropagation();pharmaOpenForm('${c.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm" style="padding:6px 10px;font-size:0.75rem;color:var(--red);" onclick="event.stopPropagation();pharmaDeleteEntry('${c.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function pharmaDeleteEntry(id) {
  const idx = pharmaCards.findIndex(c => c.id === id);
  if (idx < 0) return;
  const removed = pharmaCards[idx];
  pharmaCards.splice(idx, 1);
  idbDeletePharmaCard(id);
  renderPharmaList();
  showUndoToast('تم حذف بطاقة الدواء', async () => {
    pharmaCards.splice(idx, 0, removed);
    await idbPutPharmaCard(removed);
    renderPharmaList();
  });
}

function pharmaNewEntry() { pharmaOpenForm(null); }

function togglePharmaMcqBulkArea() {
  const el = document.getElementById('pharmaMcqBulkArea');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function applyPharmaMcqBulkFill() {
  const text = document.getElementById('pharmaMcqBulkText').value;
  const pairs = parseMcqBulkText(text);
  if (!pairs.length) {
    showToast('⚠️ ما قدرت ألاقي أسئلة بصيغة "سؤال:" / "الجواب:" — تأكد من الصيغة');
    return;
  }
  pairs.forEach(p => pharmaAddMCQ(p.q, p.a));
  document.getElementById('pharmaMcqBulkText').value = '';
  document.getElementById('pharmaMcqBulkArea').style.display = 'none';
  showToast(`✅ تمت إضافة ${pairs.length} سؤال تلقائيًا`);
}

function pharmaAddMCQ(q = '', a = '') {
  pharmaMcqCount++;
  const n = pharmaMcqCount;
  const div = document.createElement('div');
  div.className = 'mcq-block';
  div.id = 'pharma_mcq_' + n;
  div.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
      <span style="font-size:0.8rem; font-weight:700; color:var(--text2)">سؤال ${n}</span>
      <button type="button" class="btn btn-ghost btn-sm" style="padding:2px 8px;" onclick="this.closest('.mcq-block').remove()">✕</button>
    </div>
    <div class="form-group" style="margin-bottom:8px;">
      <input class="form-input" placeholder="نص السؤال..." value="${q.replace(/"/g,'&quot;')}" data-pharma-mcq-q="${n}" />
    </div>
    <div class="form-group">
      <textarea class="form-textarea" placeholder="الإجابة الصحيحة والشرح..." rows="2" data-pharma-mcq-a="${n}">${a}</textarea>
    </div>`;
  document.getElementById('pharmaMcqContainer').appendChild(div);
}

function pharmaOpenForm(id, prefill) {
  pharmaCurrentId = id;
  const entry = id ? pharmaCards.find(c => c.id === id) : (prefill || null);
  pharmaPendingImage = entry?.visual_image || null;
  pharmaMcqCount = 0;
  document.getElementById('pharmaListArea').style.display = 'none';
  document.getElementById('pharmaListToolbar').style.display = 'none';
  document.getElementById('pharmaDetailArea').style.display = 'none';
  document.getElementById('pharmaBackBtn').textContent = '← رجوع للقائمة';
  document.getElementById('pharmaBackBtn').onclick = pharmaShowList;
  document.getElementById('pharmaListCount').textContent = '';
  const area = document.getElementById('pharmaFormArea');
  area.style.display = 'block';
  const fieldRow = (key, label, icon, multiline) => `
    <div class="ecg-field">
      <label class="ecg-label">${icon} ${label}</label>
      ${multiline
        ? `<textarea class="form-textarea" id="pharma_${key}" rows="3">${esc(entry?.[key] || '')}</textarea>`
        : `<input class="form-input" id="pharma_${key}" value="${(entry?.[key] || '').toString().replace(/"/g,'&quot;')}" />`}
    </div>`;
  area.innerHTML = `
    <div class="ecg-field">
      <label class="ecg-label">💊 Generic Name (اسم الدواء العلمي)</label>
      <input class="form-input" id="pharma_drug_name" placeholder="مثال: Lisinopril" value="${(entry?.drug_name || '').replace(/"/g,'&quot;')}" />
    </div>
    ${fieldRow('drug_class', 'Drug Family / Class', '🧬', false)}
    ${fieldRow('trade_names', 'Trade Names (افصل بينها بفاصلة)', '🏷️', false)}
    ${fieldRow('main_indication', 'Main Indication', '🎯', true)}
    ${fieldRow('clinical_case', 'Clinical Scenario / Case', '🩺', true)}
    ${fieldRow('mechanism', 'Mechanism of Action (MoA)', '⚙️', true)}
    ${fieldRow('side_effects', 'High-Yield Side Effects', '⚠️', true)}
    ${fieldRow('contraindications', 'Contraindications & Warnings', '🚫', true)}
    ${fieldRow('tricks', 'تريكات مهمة', '💡', true)}
    <div class="form-divider"></div>
    <div class="section-title">🏥 أسئلة عالية العائد (High-Yield MCQ)</div>
    <div class="form-group">
      <button type="button" class="btn btn-ghost btn-sm" style="align-self:start;" onclick="togglePharmaMcqBulkArea()">⚡ إدخال تلقائي / Bulk Auto-Fill</button>
      <div id="pharmaMcqBulkArea" style="display:none;margin-top:10px;">
        <textarea class="form-textarea" id="pharmaMcqBulkText" rows="8" placeholder="الصق هون نص الأسئلة والأجوبة بصيغة:&#10;سؤال: ...&#10;&#10;الجواب: ...&#10;&#10;سؤال: ...&#10;&#10;الجواب: ..."></textarea>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button type="button" class="btn btn-primary btn-sm" onclick="applyPharmaMcqBulkFill()">✅ فرّغ الأسئلة بالبوكسات</button>
          <button type="button" class="btn btn-ghost btn-sm" onclick="togglePharmaMcqBulkArea()">إلغاء</button>
        </div>
        <div class="magic-hint">لازم كل سؤال يبدأ بكلمة "سؤال:" وكل جواب يبدأ بكلمة "الجواب:" — البرنامج بيفصلهم تلقائيًا ويضيفهم كبوكسات جديدة.</div>
      </div>
    </div>
    <div id="pharmaMcqContainer"></div>
    <button type="button" class="btn btn-ghost btn-sm" onclick="pharmaAddMCQ()" style="align-self:start;margin-bottom:14px;">+ إضافة سؤال</button>
    <div class="ecg-field">
      <label class="ecg-label">🎨 Dr. Monic Visual Story — صورة</label>
      <input type="file" id="pharmaImageFile" accept="image/*" style="display:none;" onchange="pharmaHandleImageUpload(this.files)" />
      <div id="pharmaImagePreviewWrap">
        ${pharmaPendingImage
          ? `<img class="ecg-image-preview" src="${pharmaPendingImage}" onclick="document.getElementById('pharmaImageFile').click()" alt="" />`
          : `<div class="ecg-image-drop" onclick="document.getElementById('pharmaImageFile').click()">📁 اضغط لرفع صورة، أو الصقها (Ctrl+V)</div>`}
      </div>
    </div>
    <div class="ecg-field">
      <label class="ecg-label">🎬 رابط يوتيوب أو Google Drive للقصة البصرية (اختياري)</label>
      <input class="form-input" id="pharma_visual_youtube" placeholder="رابط يوتيوب أو Google Drive..." value="${(entry?.visual_youtube || '').replace(/"/g,'&quot;')}" />
    </div>
    <div class="hx-save-bar">
      <button class="btn btn-primary" onclick="pharmaSaveEntry()">💾 حفظ بطاقة الدواء</button>
      <button class="btn btn-ghost" onclick="pharmaShowList()">إلغاء</button>
    </div>`;
  if (entry?.mcqs) entry.mcqs.forEach(q => pharmaAddMCQ(q.q, q.a));
}

function pharmaHandleImageUpload(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => pharmaSetPendingImage(e.target.result);
  reader.readAsDataURL(file);
  document.getElementById('pharmaImageFile').value = '';
}

function pharmaSetPendingImage(dataUrl) {
  compressImageDataUrl(dataUrl, compressed => {
    pharmaPendingImage = compressed;
    const wrap = document.getElementById('pharmaImagePreviewWrap');
    if (wrap) wrap.innerHTML = `<img class="ecg-image-preview" src="${compressed}" onclick="document.getElementById('pharmaImageFile').click()" alt="" />`;
  }, 1600, 0.85);
}

document.addEventListener('paste', (e) => {
  const pharmaArea = document.getElementById('pharmaFormArea');
  if (!pharmaArea || pharmaArea.style.display === 'none') return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = ev => {
        pharmaSetPendingImage(ev.target.result);
        showToast('✅ تم لصق الصورة');
      };
      reader.readAsDataURL(file);
      break;
    }
  }
});

async function pharmaSaveEntry() {
  const drug_name = document.getElementById('pharma_drug_name').value.trim();
  const mcqBlocks = document.querySelectorAll('#pharmaMcqContainer .mcq-block');
  const mcqs = Array.from(mcqBlocks).map(block => ({
    q: block.querySelector('[data-pharma-mcq-q]')?.value.trim() || '',
    a: block.querySelector('[data-pharma-mcq-a]')?.value.trim() || '',
  }));
  const entry = {
    id: pharmaCurrentId || genId(),
    drug_name,
    createdAt: (pharmaCards.find(c => c.id === pharmaCurrentId)?.createdAt) || new Date().toLocaleString('ar-EG'),
    updatedAt: new Date().toISOString(),
    visual_image: pharmaPendingImage || '',
    visual_youtube: document.getElementById('pharma_visual_youtube').value.trim(),
    mcqs,
  };
  PHARMA_FIELD_DEFS.forEach(f => { entry[f.key] = document.getElementById('pharma_' + f.key).value; });
  try {
    await idbPutPharmaCard(entry);
  } catch (e) {
    console.error('pharmaSaveEntry failed', e);
    showToast('⚠️ فشل الحفظ فعليًا (الصورة كبيرة جدًا على الأغلب) — بطاقة الدواء ما انحفظت');
    return;
  }
  if (pharmaCurrentId) {
    const idx = pharmaCards.findIndex(c => c.id === pharmaCurrentId);
    if (idx >= 0) pharmaCards[idx] = entry; else pharmaCards.push(entry);
  } else {
    pharmaCards.push(entry);
  }
  showToast('✅ تم حفظ بطاقة الدواء فعليًا');
  pharmaShowList();
}

function pharmaOpenDetail(id) {
  const entry = pharmaCards.find(c => c.id === id);
  if (!entry) return;
  pharmaCurrentId = id;
  document.getElementById('pharmaListArea').style.display = 'none';
  document.getElementById('pharmaListToolbar').style.display = 'none';
  document.getElementById('pharmaFormArea').style.display = 'none';
  document.getElementById('pharmaBackBtn').textContent = '← رجوع للقائمة';
  document.getElementById('pharmaBackBtn').onclick = pharmaShowList;
  document.getElementById('pharmaListCount').textContent = '';
  const area = document.getElementById('pharmaDetailArea');
  area.style.display = 'block';

  const yt = entry.visual_youtube ? extractYoutubeId(entry.visual_youtube) : null;
  const dr = (!yt && entry.visual_youtube) ? extractDriveFileId(entry.visual_youtube) : null;
  const tradeChips = (entry.trade_names || '').split(',').map(t => t.trim()).filter(Boolean)
    .map(t => `<span class="pharma-trade-chip">${esc(t)}</span>`).join('');

  const mediaHtml = (entry.visual_image || yt || dr) ? `
    <div class="pharma-box pharma-box-visual" data-section="visual">
      <div class="pharma-box-title">🎨 Dr. Monic Visual Story</div>
      <div class="pharma-box-media" onclick="pharmaRevealSection(this)">
        ${entry.visual_image ? `<img class="ecg-detail-img" style="cursor:pointer;border-radius:12px;" src="${entry.visual_image}" onclick="event.stopPropagation();openLightbox('${entry.visual_image}')" alt="" />` : ''}
        ${yt ? `<iframe class="note-youtube-embed" src="https://www.youtube.com/embed/${yt}?rel=0" title="YouTube" allowfullscreen></iframe><a class="note-youtube-fallback" href="https://www.youtube.com/watch?v=${yt}" target="_blank" rel="noopener">▶️ افتح على يوتيوب</a>` : ''}
        ${dr ? `<iframe class="note-youtube-embed" src="https://drive.google.com/file/d/${dr}/preview" title="Google Drive" allowfullscreen></iframe>` : ''}
      </div>
      <div class="pharma-reveal-hint">👆 اضغط للكشف</div>
    </div>` : '';

  const boxClassMap = {
    main_indication: 'pharma-box-indication',
    clinical_case: 'pharma-box-case',
    mechanism: 'pharma-box-moa',
    side_effects: 'pharma-box-side',
    contraindications: 'pharma-box-contra',
    tricks: 'pharma-box-tricks',
  };

  const sectionsHtml = PHARMA_FIELD_DEFS.filter(f => f.key !== 'drug_class' && f.key !== 'trade_names').map(f => {
    const val = entry[f.key];
    if (!val) return '';
    return `
    <div class="pharma-box ${boxClassMap[f.key] || ''}" data-section="${f.key}">
      <div class="pharma-box-title">${f.icon} ${f.label}</div>
      <div class="pharma-box-body" onclick="pharmaRevealSection(this)">${hl(esc(val))}</div>
      <div class="pharma-reveal-hint">👆 اضغط للكشف</div>
    </div>`;
  }).join('');

  const mcqHtml = (entry.mcqs && entry.mcqs.filter(q => q.q).length) ? `
    <div class="sec-card" data-accent="purple" id="pharmaMcqCard">
      <div class="sec-card-header" onclick="toggleSection(this)">
        <div class="sec-card-icon icon-purple">🏥</div>
        <div class="sec-card-title">أسئلة عالية العائد <small style="color:var(--text2)">High-Yield MCQ</small></div>
        <button class="sec-card-copy" title="نسخ الأسئلة" onclick="copySection(this,event)">📋</button>
        <div class="sec-card-arrow">▼</div>
      </div>
      <div class="sec-card-body">
        ${entry.mcqs.filter(q => q.q).map((q, i) => `
          <div class="mcq-item">
            <div class="mcq-question">س${i + 1}: ${hl(q.q)}</div>
            <button class="mcq-answer-btn" onclick="revealAnswer(this)">🔍 اظهر الإجابة</button>
            <div class="mcq-answer-reveal">${q.a ? hl(q.a) : 'لا يوجد إجابة'}</div>
          </div>`).join('')}
      </div>
    </div>` : '';

  area.innerHTML = `
    <div class="ecg-detail-header">
      <div>
        <div class="ecg-detail-title">💊 ${esc(entry.drug_name || 'دواء')}</div>
        <div class="ecg-detail-meta">${entry.drug_class ? esc(entry.drug_class) + ' · ' : ''}${esc(timeAgo(entry.updatedAt || entry.createdAt))}</div>
      </div>
      <button class="btn ${entry.mastered ? 'btn-primary' : 'btn-ghost'} btn-sm" style="${entry.mastered ? 'background:#22C55E;border-color:#22C55E;' : ''}" onclick="pharmaToggleMastered('${entry.id}')">${entry.mastered ? '🎯 تمت الدراسة ✓' : '🎯 تمت الدراسة'}</button>
      <button class="btn btn-primary btn-sm" onclick="pharmaOpenForm('${entry.id}')">✏️ تعديل</button>
    </div>
    ${tradeChips ? `<div style="margin-top:8px;">${tradeChips}</div>` : ''}
    <div class="pharma-cards-wrap ${pharmaTestMode ? 'pharma-blurred' : ''}" id="pharmaDetailSections" style="margin-top:16px;">
      ${mediaHtml}
      ${sectionsHtml}
    </div>
    ${pharmaTestMode ? `<div class="pharma-reveal-all-bar"><button class="btn btn-ghost btn-sm" onclick="pharmaRevealAll()">👁️ اكشف الكل</button></div>` : ''}
    ${mcqHtml}
  `;
}

async function pharmaToggleMastered(id) {
  const entry = pharmaCards.find(c => c.id === id);
  if (!entry) return;
  entry.mastered = !entry.mastered;
  await idbPutPharmaCard(entry);
  if (entry.mastered) {
    gamNotifyPharmaMastered(id);
    showToast('🎯 تم تحديد الدواء كـ "تمت الدراسة"');
  } else {
    showToast('↩️ تم إلغاء العلامة');
  }
  renderPharmaList();
  pharmaOpenDetail(id);
}

function pharmaRevealSection(el) {
  const wrap = document.getElementById('pharmaDetailSections');
  if (!wrap || !wrap.classList.contains('pharma-blurred')) return; // only relevant in test mode
  const section = el.closest('.pharma-box');
  if (section) section.classList.add('revealed');
}

function pharmaRevealAll() {
  const wrap = document.getElementById('pharmaDetailSections');
  if (!wrap) return;
  wrap.querySelectorAll('.pharma-box').forEach(s => s.classList.add('revealed'));
}

// ── Bulk auto-fill paste parser ──────────────────────────────────────
// Expected pasted format (one field per labeled line/block); a field's
// text continues until the next recognized emoji-label starts:
//   💊 Generic Name: Lisinopril
//   🧬 Drug Family / Class: ACE Inhibitors (-pril family)
//   🏷️ Trade Names: Zestril, Prinivil
//   🎯 Main Indication: ...
//   🩺 Clinical Scenario / Case: ...
//   ⚙️ Mechanism of Action: ...
//   ⚠️ High-Yield Side Effects: ...
//   🚫 Contraindications & Warnings: ...
//   💡 تريكات مهمة: ...
const PHARMA_BULK_MARKERS = [
  { key: 'drug_name',        re: /^💊.*?[:：]?\s*/i },
  { key: 'drug_class',       re: /^🧬.*?[:：]?\s*/i },
  { key: 'trade_names',      re: /^🏷️?.*?[:：]?\s*/i },
  { key: 'main_indication',  re: /^🎯.*?[:：]?\s*/i },
  { key: 'clinical_case',    re: /^🩺.*?[:：]?\s*/i },
  { key: 'mechanism',        re: /^⚙️?.*?[:：]?\s*/i },
  { key: 'side_effects',     re: /^⚠️?.*?[:：]?\s*/i },
  { key: 'contraindications',re: /^🚫.*?[:：]?\s*/i },
  { key: 'tricks',           re: /^💡.*?[:：]?\s*/i },
];

function pharmaOpenBulkPaste() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.classList.add('open');
  modal.innerHTML = `
    <div class="modal-box" style="max-width:640px;">
      <h3 style="margin-bottom:10px;">🪄 لصق تلقائي لبطاقة دواء</h3>
      <p style="color:var(--text2);font-size:0.85rem;margin-bottom:10px;">
        الصق فقرة بنفس تنسيق القالب (كل حقل ببداية سطر برمزه: 💊 🧬 🏷️ 🎯 🩺 ⚙️ ⚠️ 🚫 💡)، وراح تتوزع تلقائيًا على الحقول المناسبة — بعدها فقط راجع وعدّل واحفظ.
      </p>
      <textarea class="pharma-bulk-modal-textarea" id="pharmaBulkPasteText" placeholder="💊 Generic Name: ...\n🧬 Drug Family / Class: ...\n🏷️ Trade Names: ...\n🎯 Main Indication: ...\n🩺 Clinical Scenario / Case: ...\n⚙️ Mechanism of Action: ...\n⚠️ High-Yield Side Effects: ...\n🚫 Contraindications & Warnings: ...\n💡 تريكات مهمة: ..."></textarea>
      <div class="hx-save-bar">
        <button class="btn btn-primary" onclick="pharmaRunBulkPaste(this)">✅ توزيع تلقائي وفتح النموذج</button>
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function pharmaParseBulkText(text) {
  const lines = text.split('\n');
  const result = {};
  let currentKey = null;
  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) return;
    const marker = PHARMA_BULK_MARKERS.find(m => m.re.test(line));
    if (marker) {
      currentKey = marker.key;
      const stripped = line.replace(marker.re, '').trim();
      result[currentKey] = result[currentKey] ? result[currentKey] + '\n' + stripped : stripped;
    } else if (currentKey) {
      result[currentKey] = (result[currentKey] ? result[currentKey] + '\n' : '') + line;
    }
  });
  return result;
}

function pharmaRunBulkPaste(btn) {
  const text = document.getElementById('pharmaBulkPasteText').value;
  const parsed = pharmaParseBulkText(text);
  btn.closest('.modal-overlay').remove();
  if (!Object.keys(parsed).length) { showToast('⚠️ ما انلقى أي حقول متوافقة بالنص الملصوق'); return; }
  pharmaOpenForm(null, parsed);
  showToast('✅ تم توزيع الحقول — راجعها واحفظ');
}

