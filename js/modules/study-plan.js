// ════════════════════════════════════════════════
//  STUDY PLANNER — الخطة الذهبية
//  A dedicated calendar for planning clinical-year study: color-coded
//  rotations, per-day checklist, per-day video-recorded checklist, and
//  per-day PDF attachments (all base64 in localStorage — no server).
//  Storage key: drmonic_studyplan_days      → { "YYYY-MM-DD": DayData }
//  Storage key: drmonic_studyplan_multisel  → array of "YYYY-MM-DD" (transient UI state, not persisted across reload)
// ════════════════════════════════════════════════

const SP_DAYS_KEY = 'drmonic_studyplan_days';
const SP_MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const SP_WEEKDAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

// Specialty color legend — تلوين حسب التخصص/الروتيشن
const SP_TAGS = [
  { key: 'surgery',   label: 'جراحة',              color: '#38BDF8' },
  { key: 'medicine',  label: 'باطني',               color: '#F87171' },
  { key: 'neuro',     label: 'أعصاب',                color: '#A78BFA' },
  { key: 'radiology', label: 'أشعة',                 color: '#FBBF24' },
  { key: 'forensic',  label: 'شرعي',                 color: '#4ADE80' },
  { key: 'peds',      label: 'أطفال',                color: '#F472B6' },
  { key: 'obgyn',     label: 'نسائية وتوليد',        color: '#FB923C' },
  { key: 'psych',     label: 'نفسي',                 color: '#2DD4BF' },
  { key: 'family',    label: 'طب أسرة',              color: '#94A3B8' },
  { key: 'er',        label: 'طوارئ',                color: '#EF4444' },
  { key: 'anesth',    label: 'تخدير',                color: '#C084FC' },
  { key: 'review',    label: 'مراجعة',               color: '#22D3EE' },
  { key: 'exam',      label: 'امتحان',               color: '#DC2626' },
  { key: 'seminar',   label: 'سيمنار',               color: '#EAB308' }
];

// الخوارزمية الذهبية — النظام الأسبوعي: خطوتين كل يوم دوام + 5 خطوات جمعة/سبت
// group: 'daily' (تتكرر كل يوم دوام) أو 'weekend' (تصير مرة بالأسبوع، جمعة/سبت)
const SP_ALGO_STEPS = [
  { group: 'daily', title: 'داوم واكتب ملاحظات الدكتور + سجّل الـ Cases', desc: 'بالراوند: ركّز مع الدكتور بس، اكتب الـ High-Yield فقط، وحط ⭐ على أي شي شدد عليه.' },
  { group: 'daily', title: 'فرّغ بالبيت: Cases بالموقع + ملاحظات وتريكات', desc: 'فرّغ الـ Cases وكلام الدكتور بخانة الملاحظات. ادرس موضوع اليوم بعمق خفيف من السلايدات والسيمينارات وسوّي مسودة.' },
  { group: 'weekend', title: 'Gather doctor/rotation feedback FIRST', desc: 'اجمع أسئلة السنوات وملاحظات الدفعات السابقة لكل مواضيع الأسبوع. هاد يوجهك وين بالضبط الفجوة المهمة.' },
  { group: 'weekend', title: 'What is missing? (موجّه بالفيدباك)', desc: 'قارن مسودات الأسبوع مع الفيدباك، وحدد بس الفجوات اللي فعلاً بتنسأل عنها.' },
  { group: 'weekend', title: 'أسئلة MonicQbank', desc: 'حل أسئلة لكل مواضيع الأسبوع لتثبيت نمط السؤال، مش بس المعلومة.' },
  { group: 'weekend', title: '🗺️ خريطة المراجعة', desc: 'اعمل بطاقة Topic Map لكل موضوع أخذته بالأسبوع — الناتج النهائي الجاهز للمراجعة قبل الامتحان.' },
  { group: 'weekend', title: 'تصوير فيديو سريع (اختياري)', desc: 'شاشة بيضاء، اشرح بخط يدك. لو ما في وقت لها — سكيب بدون ذنب، بتصير لأسبوع تاني.' }
];
let spAlgoActiveStep = 0;

function spRenderAlgoTrack() {
  const track = document.getElementById('spAlgoTrack');
  if (!track) return;
  const dailySteps = SP_ALGO_STEPS.filter(s => s.group === 'daily');
  const weekendSteps = SP_ALGO_STEPS.filter(s => s.group === 'weekend');

  const circleHtml = (step, globalIdx, isLast) => `
    <div class="sp-algo-circle-wrap">
      <span class="sp-algo-circle ${globalIdx === spAlgoActiveStep ? 'active' : ''}" onclick="spSelectAlgoStep(${globalIdx})">${globalIdx + 1}</span>
      ${!isLast ? '<span class="sp-algo-line"></span>' : ''}
    </div>`;

  track.innerHTML = `
    <div class="sp-algo-group">
      <div class="sp-algo-group-label">📅 كل يوم دوام</div>
      <div class="sp-algo-group-track">${dailySteps.map((s, i) => circleHtml(s, i, i === dailySteps.length - 1)).join('')}</div>
    </div>
    <div class="sp-algo-group">
      <div class="sp-algo-group-label">🗓️ جمعة / سبت</div>
      <div class="sp-algo-group-track">${weekendSteps.map((s, i) => circleHtml(s, dailySteps.length + i, i === weekendSteps.length - 1)).join('')}</div>
    </div>`;
  spRenderAlgoDetail();
}

function spSelectAlgoStep(i) {
  spAlgoActiveStep = i;
  spRenderAlgoTrack();
}

function spRenderAlgoDetail() {
  const detail = document.getElementById('spAlgoDetail');
  if (!detail) return;
  const step = SP_ALGO_STEPS[spAlgoActiveStep];
  const groupLabel = step.group === 'daily' ? '📅 يومي' : '🗓️ جمعة/سبت';
  detail.innerHTML = `<span class="sp-algo-detail-badge">${groupLabel}</span><strong>${spAlgoActiveStep + 1}. ${esc(step.title)}</strong><br>${esc(step.desc)}`;
}

let spCurrentMonth = new Date();
let spMultiSelect = new Set();      // selected date-keys for bulk tagging
let spMultiSelectMode = false;
let spOpenDayKey = null;

function spLoadDays() {
  try { return JSON.parse(localStorage.getItem(SP_DAYS_KEY)) || {}; } catch (e) { return {}; }
}
function spSaveDays(data) { safeLocalSet(SP_DAYS_KEY, JSON.stringify(data)); }
function spDateKey(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }

function spDefaultDay() {
  // pdfs holds only lightweight references {id, name} — the actual base64
  // file content lives in IndexedDB (store: studyPlanPdfs) so a handful of
  // attached PDFs can never blow the localStorage quota and wipe the plan.
  return { title: '', tags: [], checklist: [], videos: [], pdfs: [] };
}

function spGetDay(key) {
  const days = spLoadDays();
  return days[key] || spDefaultDay();
}

// In-memory cache of loaded PDF blobs for the currently-open day modal:
// { pdfId: dataUrl }
let spPdfCache = {};

async function spLoadPdfCacheForDay(dayData) {
  spPdfCache = {};
  const ids = (dayData.pdfs || []).map(p => p.id);
  if (!ids.length) return;
  try {
    const all = await idbGetAllStudyPlanPdfs();
    all.forEach(rec => { if (ids.includes(rec.id)) spPdfCache[rec.id] = rec.dataUrl; });
  } catch (e) {
    console.error('Failed loading study-plan PDFs from IndexedDB', e);
  }
}

function spTagInfo(key) {
  return SP_TAGS.find(t => t.key === key) || { key, label: key, color: '#64748B' };
}

// ── Entry point ──────────────────────────────────────────────
function showStudyPlanView() {
  hideAllViews();
  document.getElementById('studyPlanView').classList.add('active');
  spRenderAlgoTrack();
  spRenderCalendar();
}

// ── Calendar grid ────────────────────────────────────────────
function spRenderCalendar() {
  const grid = document.getElementById('spCalendarGrid');
  if (!grid) return;
  const y = spCurrentMonth.getFullYear(), m = spCurrentMonth.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const days = spLoadDays();
  const today = new Date();
  const todayKey = spDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += `<div class="sp-day sp-day-empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const key = spDateKey(y, m, d);
    const data = days[key];
    const isToday = key === todayKey;
    const isSelected = spMultiSelect.has(key);
    const tags = (data && data.tags) || [];
    const chips = tags.slice(0, 3).map(tk => {
      const t = spTagInfo(tk);
      return `<span class="sp-tag-dot" style="background:${t.color};" title="${esc(t.label)}"></span>`;
    }).join('');

    const checklist = (data && data.checklist) || [];
    const doneCount = checklist.filter(c => c.done).length;
    const checklistBadge = checklist.length ? `<span class="sp-mini-badge">${doneCount}/${checklist.length}</span>` : '';
    const MAX_VISIBLE_ITEMS = 3;
    const checklistPreview = checklist.length
      ? `<div class="sp-day-checklist">${checklist.slice(0, MAX_VISIBLE_ITEMS).map(c => `
          <div class="sp-day-check-item ${c.done ? 'done' : ''}">
            <span class="sp-day-check-box">${c.done ? '✔' : ''}</span>
            <span class="sp-day-check-text">${esc(c.text)}</span>
          </div>`).join('')}
          ${checklist.length > MAX_VISIBLE_ITEMS ? `<div class="sp-day-check-more">+${checklist.length - MAX_VISIBLE_ITEMS} أكتر...</div>` : ''}
        </div>`
      : '';

    const videos = (data && data.videos) || [];
    const videoBadge = videos.length ? `<span class="sp-mini-badge sp-mini-badge-video">🎬${videos.filter(v=>v.done).length}/${videos.length}</span>` : '';

    const pdfBadge = (data && data.pdfs && data.pdfs.length) ? `<span class="sp-mini-badge sp-mini-badge-pdf">📎${data.pdfs.length}</span>` : '';

    const titleLine = data && data.title ? `<div class="sp-day-title">${esc(data.title)}</div>` : '';

    cells += `<div class="sp-day ${isToday ? 'sp-day-today' : ''} ${isSelected ? 'sp-day-selected' : ''}"
        style="${tags[0] ? `border-color:${spTagInfo(tags[0]).color}66;` : ''}"
        onclick="spHandleDayClick('${key}', event)">
      <div class="sp-day-top">
        <span class="sp-day-num">${d}</span>
        <span class="sp-day-tags">${chips}</span>
      </div>
      ${titleLine}
      ${checklistPreview}
      <div class="sp-day-badges">${checklistBadge}${videoBadge}${pdfBadge}</div>
    </div>`;
  }

  grid.innerHTML = `
    <div class="sp-weekdays">${SP_WEEKDAYS_AR.map(w => `<div class="sp-weekday">${w}</div>`).join('')}</div>
    <div class="sp-days">${cells}</div>`;

  document.getElementById('spMonthTitle').textContent = `${SP_MONTHS_AR[m]} ${y}`;
  spRenderLegend();
  spRenderMultiSelectBar();
}

function spChangeMonth(delta) {
  spCurrentMonth = new Date(spCurrentMonth.getFullYear(), spCurrentMonth.getMonth() + delta, 1);
  spRenderCalendar();
}

function spGoToToday() {
  spCurrentMonth = new Date();
  spRenderCalendar();
}

function spRenderLegend() {
  const el = document.getElementById('spLegend');
  if (!el) return;
  el.innerHTML = SP_TAGS.map(t => `<span class="sp-legend-item"><span class="sp-legend-dot" style="background:${t.color};"></span>${esc(t.label)}</span>`).join('');
}

// ── Multi-select mode ────────────────────────────────────────
function spToggleMultiSelect() {
  spMultiSelectMode = !spMultiSelectMode;
  if (!spMultiSelectMode) spMultiSelect.clear();
  spRenderCalendar();
}

function spHandleDayClick(key, evt) {
  if (spMultiSelectMode) {
    if (spMultiSelect.has(key)) spMultiSelect.delete(key);
    else spMultiSelect.add(key);
    spRenderCalendar();
  } else {
    spOpenDayModal(key);
  }
}

function spRenderMultiSelectBar() {
  const bar = document.getElementById('spMultiBar');
  if (!bar) return;
  if (!spMultiSelectMode) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  bar.innerHTML = `
    <span class="sp-multi-count">${spMultiSelect.size} يوم محدد</span>
    <div class="sp-multi-swatches">
      ${SP_TAGS.map(t => `<span class="sp-color-swatch" style="background:${t.color};" title="${esc(t.label)}" onclick="spApplyTagToSelection('${t.key}')"></span>`).join('')}
    </div>
    <button class="btn btn-ghost btn-sm" onclick="spClearTagFromSelection()">🧹 مسح التلوين</button>
    <button class="btn btn-ghost btn-sm" onclick="spToggleMultiSelect()">✔️ تم</button>`;
}

function spApplyTagToSelection(tagKey) {
  if (!spMultiSelect.size) { showToast('⚠️ حدد أيام أولاً'); return; }
  const days = spLoadDays();
  spMultiSelect.forEach(key => {
    if (!days[key]) days[key] = spDefaultDay();
    if (!days[key].tags.includes(tagKey)) days[key].tags = [tagKey, ...days[key].tags].slice(0, 3);
  });
  spSaveDays(days);
  showToast('🎨 تم التلوين');
  spRenderCalendar();
}

function spClearTagFromSelection() {
  if (!spMultiSelect.size) { showToast('⚠️ حدد أيام أولاً'); return; }
  const days = spLoadDays();
  spMultiSelect.forEach(key => { if (days[key]) days[key].tags = []; });
  spSaveDays(days);
  showToast('🧹 تم مسح التلوين');
  spRenderCalendar();
}

// ── Day detail modal ─────────────────────────────────────────
async function spOpenDayModal(key) {
  spOpenDayKey = key;
  const modal = document.getElementById('spDayModal');
  modal.style.display = 'flex';
  document.getElementById('spDayModalBody').innerHTML = `<div class="gam-empty">⏳ تحميل...</div>`;
  await spLoadPdfCacheForDay(spGetDay(key));
  spRenderDayModal();
}

function spCloseDayModal() {
  document.getElementById('spDayModal').style.display = 'none';
  spRenderCalendar();
}

function spRenderDayModal() {
  const key = spOpenDayKey;
  const data = spGetDay(key);
  const [y, m, d] = key.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const weekdayAr = SP_WEEKDAYS_AR[dateObj.getDay()];

  const tagChips = SP_TAGS.map(t => `
    <span class="sp-tag-chip ${data.tags.includes(t.key) ? 'active' : ''}" style="--chip-color:${t.color};" onclick="spToggleDayTag('${t.key}')">
      <span class="sp-tag-chip-dot" style="background:${t.color};"></span>${esc(t.label)}
    </span>`).join('');

  const checklistHtml = data.checklist.length
    ? data.checklist.map((item, i) => `
      <div class="sp-check-row">
        <input type="checkbox" ${item.done ? 'checked' : ''} onchange="spToggleChecklistItem(${i})" />
        <span class="${item.done ? 'sp-check-done' : ''}">${esc(item.text)}</span>
        <button class="sp-mini-del" onclick="spRemoveChecklistItem(${i})">✕</button>
      </div>`).join('')
    : `<div class="gam-empty" style="padding:8px 0;">ما في عناصر بعد</div>`;

  const videosHtml = data.videos.length
    ? data.videos.map((v, i) => `
      <div class="sp-check-row">
        <input type="checkbox" ${v.done ? 'checked' : ''} onchange="spToggleVideoItem(${i})" />
        <span class="${v.done ? 'sp-check-done' : ''}">🎬 ${esc(v.text)}</span>
        <button class="sp-mini-del" onclick="spRemoveVideoItem(${i})">✕</button>
      </div>`).join('')
    : `<div class="gam-empty" style="padding:8px 0;">ما في فيديوهات مسجلة لهاليوم بعد</div>`;

  const pdfsHtml = data.pdfs.length
    ? data.pdfs.map((p, i) => `
      <div class="sp-pdf-row">
        <span class="sp-pdf-icon" onclick="spOpenPdf(${i})" title="فتح الملف">📄</span>
        <span class="sp-pdf-name" onclick="spOpenPdf(${i})">${esc(p.name)}</span>
        <button class="sp-mini-del" onclick="spRemovePdf(${i})">✕</button>
      </div>`).join('')
    : `<div class="gam-empty" style="padding:8px 0;">ما في ملفات مرفوعة</div>`;

  document.getElementById('spDayModalBody').innerHTML = `
    <div class="sp-modal-header">
      <div>
        <div class="sp-modal-weekday">${weekdayAr}</div>
        <div class="sp-modal-date">${d} ${SP_MONTHS_AR[m - 1]} ${y}</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="spCloseDayModal()">✔️ تم</button>
    </div>

    <div class="ecg-field">
      <label class="ecg-label">عنوان اليوم</label>
      <input class="form-input" id="spTitleInput" value="${esc(data.title)}" placeholder="مثلاً: جراحة — Appendix + Hernias" oninput="spUpdateTitle(this.value)" />
    </div>

    <div class="ecg-field">
      <label class="ecg-label">🎨 تصنيف اليوم</label>
      <div class="sp-tag-chip-wrap">${tagChips}</div>
    </div>

    <div class="sp-modal-section">
      <div class="sp-modal-section-title">✅ Checklist اليوم</div>
      <div id="spChecklistList">${checklistHtml}</div>
      <div class="sp-add-row">
        <input class="form-input" id="spChecklistInput" placeholder="أضف عنصر... (مثلاً: راجع سلايدات الـ Thyroid)" onkeydown="if(event.key==='Enter')spAddChecklistItem()" />
        <button class="btn btn-primary btn-sm" onclick="spAddChecklistItem()">➕</button>
      </div>
    </div>

    <div class="sp-modal-section">
      <div class="sp-modal-section-title">🎬 فيديوهات مسجلة</div>
      <div id="spVideosList">${videosHtml}</div>
      <div class="sp-add-row">
        <input class="form-input" id="spVideoInput" placeholder="أضف موضوع مسجّل... (مثلاً: Thyroglossal cyst)" onkeydown="if(event.key==='Enter')spAddVideoItem()" />
        <button class="btn btn-primary btn-sm" onclick="spAddVideoItem()">➕</button>
      </div>
    </div>

    <div class="sp-modal-section">
      <div class="sp-modal-section-title">📎 ملفات PDF مرفقة</div>
      <div id="spPdfList">${pdfsHtml}</div>
      <div class="sp-add-row">
        <input type="file" id="spPdfFileInput" accept="application/pdf" onchange="spUploadPdf(this)" style="flex:1;" />
      </div>
    </div>`;
}

function spUpdateTitle(value) {
  const days = spLoadDays();
  if (!days[spOpenDayKey]) days[spOpenDayKey] = spDefaultDay();
  days[spOpenDayKey].title = value;
  spSaveDays(days);
}

function spToggleDayTag(tagKey) {
  const days = spLoadDays();
  if (!days[spOpenDayKey]) days[spOpenDayKey] = spDefaultDay();
  const tags = days[spOpenDayKey].tags;
  const idx = tags.indexOf(tagKey);
  if (idx >= 0) tags.splice(idx, 1);
  else tags.unshift(tagKey);
  days[spOpenDayKey].tags = tags.slice(0, 3);
  spSaveDays(days);
  spRenderDayModal();
}

function spAddChecklistItem() {
  const input = document.getElementById('spChecklistInput');
  const text = input.value.trim();
  if (!text) return;
  const days = spLoadDays();
  if (!days[spOpenDayKey]) days[spOpenDayKey] = spDefaultDay();
  days[spOpenDayKey].checklist.push({ id: genId(), text, done: false });
  spSaveDays(days);
  input.value = '';
  spRenderDayModal();
}
function spToggleChecklistItem(i) {
  const days = spLoadDays();
  days[spOpenDayKey].checklist[i].done = !days[spOpenDayKey].checklist[i].done;
  spSaveDays(days);
  spRenderDayModal();
}
function spRemoveChecklistItem(i) {
  const days = spLoadDays();
  days[spOpenDayKey].checklist.splice(i, 1);
  spSaveDays(days);
  spRenderDayModal();
}

function spAddVideoItem() {
  const input = document.getElementById('spVideoInput');
  const text = input.value.trim();
  if (!text) return;
  const days = spLoadDays();
  if (!days[spOpenDayKey]) days[spOpenDayKey] = spDefaultDay();
  days[spOpenDayKey].videos.push({ id: genId(), text, done: false });
  spSaveDays(days);
  input.value = '';
  spRenderDayModal();
}
function spToggleVideoItem(i) {
  const days = spLoadDays();
  days[spOpenDayKey].videos[i].done = !days[spOpenDayKey].videos[i].done;
  spSaveDays(days);
  spRenderDayModal();
}
function spRemoveVideoItem(i) {
  const days = spLoadDays();
  days[spOpenDayKey].videos.splice(i, 1);
  spSaveDays(days);
  spRenderDayModal();
}

function spUploadPdf(inputEl) {
  const file = inputEl.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') { showToast('⚠️ لازم يكون الملف PDF'); return; }
  if (file.size > 15 * 1024 * 1024) { showToast('⚠️ الملف كبير أكتر من 15MB'); return; }
  const reader = new FileReader();
  reader.onload = async function (e) {
    const pdfId = genId();
    try {
      // Blob content goes to IndexedDB (studyPlanPdfs store) — never to
      // localStorage — so attaching PDFs can never hit the quota that
      // would otherwise silently corrupt the whole plan.
      await idbPutStudyPlanPdf({ id: pdfId, name: file.name, dataUrl: e.target.result });
    } catch (err) {
      console.error('Failed saving PDF to IndexedDB', err);
      showToast('⚠️ تعذر حفظ الملف بالتخزين — جرب ملف أصغر');
      return;
    }
    const days = spLoadDays();
    if (!days[spOpenDayKey]) days[spOpenDayKey] = spDefaultDay();
    days[spOpenDayKey].pdfs.push({ id: pdfId, name: file.name }); // lightweight reference only
    spSaveDays(days);
    spPdfCache[pdfId] = e.target.result;
    showToast('📎 تم إرفاق الملف');
    inputEl.value = '';
    spRenderDayModal();
  };
  reader.onerror = function () { showToast('⚠️ تعذر قراءة الملف'); };
  reader.readAsDataURL(file);
}

function spOpenPdf(i) {
  const days = spLoadDays();
  const pdf = days[spOpenDayKey] && days[spOpenDayKey].pdfs[i];
  if (!pdf) return;
  const dataUrl = spPdfCache[pdf.id];
  if (!dataUrl) { showToast('⚠️ الملف لسا عم يتحمّل، جرب كمان ثانية'); return; }
  const w = window.open();
  if (w) {
    w.document.write(`<iframe src="${dataUrl}" style="width:100%;height:100vh;border:none;"></iframe>`);
  } else {
    showToast('⚠️ فعّل النوافذ المنبثقة لفتح الملف');
  }
}

async function spRemovePdf(i) {
  const days = spLoadDays();
  const pdf = days[spOpenDayKey].pdfs[i];
  days[spOpenDayKey].pdfs.splice(i, 1);
  spSaveDays(days);
  delete spPdfCache[pdf.id];
  spRenderDayModal();
  try { await idbDeleteStudyPlanPdf(pdf.id); } catch (e) { console.error('Failed deleting PDF from IndexedDB', e); }
}
