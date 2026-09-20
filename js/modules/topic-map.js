// ════════════════════════════════════════════════
//  خريطة المراجعة — TOPIC MAP
//  A standalone section: one review-card per Topic, built as the final
//  output of the Golden Algorithm. Each card = "Day 1 of a topic" turned
//  into a compact, scannable page for pre-exam review.
//  Storage key: drmonic_topicmap_cards → { id: TopicCard }
// ════════════════════════════════════════════════

const TM_KEY = 'drmonic_topicmap_cards';
let tmCards = {};
let tmOpenCardId = null;
let tmSearchQuery = '';
let tmFilterTag = 'all';

function tmLoad() {
  try { tmCards = JSON.parse(localStorage.getItem(TM_KEY)) || {}; } catch (e) { tmCards = {}; }
}
function tmSave() { safeLocalSet(TM_KEY, JSON.stringify(tmCards)); }

function tmDefaultCard() {
  return {
    id: genId(),
    title: '',
    tag: '',
    createdAt: Date.now(),
    mustKnow: [],       // Must know — من السلايدات
    doctorEmphasis: [],  // Doctor emphasis 🔥 — من الراوند والفيدباك
    oral: [],            // Oral
    miniOsce: [],        // Mini-OSCE
    weakPoints: [],      // My weak points
    sources: ''          // Sources — نص حر
  };
}

// ── Entry point ──────────────────────────────────────────────
function showTopicMapView() {
  hideAllViews();
  document.getElementById('topicMapView').classList.add('active');
  tmLoad();
  tmRenderList();
}

function tmTagInfo(key) {
  // Reuses the same color legend as the Study Planner (SP_TAGS) so
  // specialty colors stay consistent across the two modules.
  return (typeof SP_TAGS !== 'undefined' ? SP_TAGS.find(t => t.key === key) : null) || { key, label: key, color: '#64748B' };
}

// ── List view ────────────────────────────────────────────────
function tmRenderList() {
  const wrap = document.getElementById('tmListArea');
  if (!wrap) return;

  const filterChips = (typeof SP_TAGS !== 'undefined' ? SP_TAGS : []).map(t => `
    <span class="sp-tag-chip ${tmFilterTag === t.key ? 'active' : ''}" style="--chip-color:${t.color};" onclick="tmSetFilter('${t.key}')">
      <span class="sp-tag-chip-dot" style="background:${t.color};"></span>${esc(t.label)}
    </span>`).join('');

  let cards = Object.values(tmCards);
  if (tmFilterTag !== 'all') cards = cards.filter(c => c.tag === tmFilterTag);
  if (tmSearchQuery.trim()) {
    const q = tmSearchQuery.trim().toLowerCase();
    cards = cards.filter(c => (c.title || '').toLowerCase().includes(q));
  }
  cards.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const cardsHtml = cards.length
    ? cards.map(c => {
        const tag = c.tag ? tmTagInfo(c.tag) : null;
        const hot = (c.doctorEmphasis || []).length;
        return `<div class="tm-card" style="${tag ? `border-color:${tag.color}55;` : ''}" onclick="tmOpenCard('${c.id}')">
          <div class="tm-card-top">
            ${tag ? `<span class="sp-tag-dot" style="background:${tag.color};"></span>` : ''}
            <span class="tm-card-title">${esc(c.title || 'بدون عنوان')}</span>
          </div>
          <div class="tm-card-stats">
            ${(c.mustKnow || []).length ? `<span class="sp-mini-badge">📌 ${c.mustKnow.length}</span>` : ''}
            ${hot ? `<span class="sp-mini-badge" style="color:#f87171;">🔥 ${hot}</span>` : ''}
            ${(c.weakPoints || []).length ? `<span class="sp-mini-badge" style="color:#fbbf24;">⚠️ ${c.weakPoints.length}</span>` : ''}
          </div>
        </div>`;
      }).join('')
    : `<div class="gam-empty">ما في بطاقات بعد — اضغط "بطاقة جديدة" وابدأ أول Topic</div>`;

  wrap.innerHTML = `
    <div class="notes-toolbar">
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="btn btn-ghost btn-sm" onclick="showHome()">← الرجوع</button>
        <span style="font-weight:800;">🗺️ خريطة المراجعة</span>
      </div>
      <div class="notes-toolbar-right">
        <button class="btn btn-primary btn-sm" onclick="tmNewCard()">➕ بطاقة جديدة</button>
      </div>
    </div>
    <p style="color:var(--text2);font-size:0.85rem;margin:0 0 16px;">
      صفحة واحدة لكل Topic — ناتج نهائي لتطبيق الخوارزمية الذهبية عليه. ارجعلها قبل الامتحان بدل ما تعيد قراءة كل شي من الصفر.
    </p>
    <input class="form-input" id="tmSearchInput" placeholder="🔍 ابحث عن Topic..." value="${esc(tmSearchQuery)}" oninput="tmSetSearch(this.value)" style="margin-bottom:12px;" />
    <div class="sp-tag-chip-wrap" style="margin-bottom:16px;">
      <span class="sp-tag-chip ${tmFilterTag === 'all' ? 'active' : ''}" style="--chip-color:#2dd4bf;" onclick="tmSetFilter('all')">الكل</span>
      ${filterChips}
    </div>
    <div class="tm-cards-grid">${cardsHtml}</div>`;
}

function tmSetSearch(value) {
  tmSearchQuery = value;
  tmRenderList();
  // restore focus + caret since the input was just rebuilt
  const input = document.getElementById('tmSearchInput');
  if (input) { input.focus(); input.selectionStart = input.selectionEnd = input.value.length; }
}

function tmSetFilter(tagKey) {
  tmFilterTag = tagKey;
  tmRenderList();
}

function tmNewCard() {
  const card = tmDefaultCard();
  tmCards[card.id] = card;
  tmSave();
  tmOpenCard(card.id);
}

function tmDeleteCard(id) {
  if (!confirm('متأكد إنك بدك تحذف هاي البطاقة؟')) return;
  delete tmCards[id];
  tmSave();
  tmCloseCard();
  tmRenderList();
  showToast('🗑️ تم الحذف');
}

// ── Card detail / edit modal ─────────────────────────────────
function tmOpenCard(id) {
  tmOpenCardId = id;
  const modal = document.getElementById('tmCardModal');
  modal.style.display = 'flex';
  tmRenderCardModal();
}

function tmCloseCard() {
  document.getElementById('tmCardModal').style.display = 'none';
  tmRenderList();
}

function tmListSectionHtml(card, field, placeholder) {
  const items = card[field] || [];
  const rows = items.map((text, i) => `
    <div class="sp-check-row">
      <span>${esc(text)}</span>
      <button class="sp-mini-del" onclick="tmRemoveItem('${field}', ${i})">✕</button>
    </div>`).join('') || `<div class="gam-empty" style="padding:6px 0;">فاضي</div>`;
  return `
    <div id="tmSection_${field}">${rows}</div>
    <div class="sp-add-row">
      <input class="form-input" id="tmInput_${field}" placeholder="${esc(placeholder)}" onkeydown="if(event.key==='Enter')tmAddItem('${field}')" />
      <button class="btn btn-primary btn-sm" onclick="tmAddItem('${field}')">➕</button>
    </div>`;
}

function tmRenderCardModal() {
  const card = tmCards[tmOpenCardId];
  if (!card) return;

  const tagChips = (typeof SP_TAGS !== 'undefined' ? SP_TAGS : []).map(t => `
    <span class="sp-tag-chip ${card.tag === t.key ? 'active' : ''}" style="--chip-color:${t.color};" onclick="tmSetCardTag('${t.key}')">
      <span class="sp-tag-chip-dot" style="background:${t.color};"></span>${esc(t.label)}
    </span>`).join('');

  document.getElementById('tmCardModalBody').innerHTML = `
    <div class="sp-modal-header">
      <div style="flex:1;">
        <input class="form-input" id="tmTitleInput" value="${esc(card.title)}" placeholder="اسم الـ Topic (مثلاً: Thyroid — Day 1)" oninput="tmUpdateTitle(this.value)" style="font-weight:800;font-size:1.05rem;" />
      </div>
      <button class="btn btn-ghost btn-sm" onclick="tmCloseCard()">✔️ تم</button>
    </div>

    <div class="ecg-field">
      <label class="ecg-label">🎨 التخصص</label>
      <div class="sp-tag-chip-wrap">${tagChips}</div>
    </div>

    <div class="sp-modal-section">
      <div class="sp-modal-section-title">📌 Must know</div>
      ${tmListSectionHtml(card, 'mustKnow', 'مثلاً: Thyroid nodule approach')}
    </div>

    <div class="sp-modal-section">
      <div class="sp-modal-section-title">🔥 Doctor emphasis</div>
      ${tmListSectionHtml(card, 'doctorEmphasis', 'مثلاً: Post-op hypocalcemia')}
    </div>

    <div class="sp-modal-section">
      <div class="sp-modal-section-title">🗣️ Oral</div>
      ${tmListSectionHtml(card, 'oral', 'مثلاً: Diagnosis / Investigation / Management')}
    </div>

    <div class="sp-modal-section">
      <div class="sp-modal-section-title">🖼️ Mini-OSCE</div>
      ${tmListSectionHtml(card, 'miniOsce', 'مثلاً: Thyroid ultrasound image')}
    </div>

    <div class="sp-modal-section">
      <div class="sp-modal-section-title">⚠️ My weak points</div>
      ${tmListSectionHtml(card, 'weakPoints', 'مثلاً: Indications for surgery')}
    </div>

    <div class="sp-modal-section">
      <div class="sp-modal-section-title">📚 Sources</div>
      <textarea class="form-textarea" id="tmSourcesInput" rows="2" placeholder="مثلاً: Washington — استخدمته بس لـ hypocalcemia + surgery indications" oninput="tmUpdateSources(this.value)">${esc(card.sources)}</textarea>
    </div>

    <div class="sp-modal-section" style="border-top:1px dashed var(--border);">
      <button class="btn btn-ghost btn-sm" style="color:#f87171;" onclick="tmDeleteCard('${card.id}')">🗑️ حذف هاي البطاقة</button>
    </div>`;
}

function tmUpdateTitle(value) {
  tmCards[tmOpenCardId].title = value;
  tmSave();
}
function tmUpdateSources(value) {
  tmCards[tmOpenCardId].sources = value;
  tmSave();
}
function tmSetCardTag(tagKey) {
  const card = tmCards[tmOpenCardId];
  card.tag = card.tag === tagKey ? '' : tagKey;
  tmSave();
  tmRenderCardModal();
}

function tmAddItem(field) {
  const input = document.getElementById('tmInput_' + field);
  const text = input.value.trim();
  if (!text) return;
  tmCards[tmOpenCardId][field].push(text);
  tmSave();
  input.value = '';
  tmRenderCardModal();
  document.getElementById('tmInput_' + field)?.focus();
}

function tmRemoveItem(field, i) {
  tmCards[tmOpenCardId][field].splice(i, 1);
  tmSave();
  tmRenderCardModal();
}
