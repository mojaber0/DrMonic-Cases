// ════════════════════════════════════════════════
//  TRICKS VIEW
// ════════════════════════════════════════════════
function showTricksView() {
  hideAllViews();
  document.getElementById('tricksView').classList.add('active');
  renderTricks();
}

// ════════════════════════════════════════════════
//  REVIEW CARDS  (converted from study notes)
// ════════════════════════════════════════════════
function showReviewCardsView() {
  hideAllViews();
  document.getElementById('reviewCardsView').classList.add('active');
  renderReviewCards();
}

function saveReviewCards() {
  localStorage.setItem('drmonic_review_cards', JSON.stringify(reviewCards));
}
function saveReviewCardsKnown() {
  localStorage.setItem('drmonic_review_known', JSON.stringify([...reviewCardsKnown]));
}

function convertNoteToReviewCard(noteId) {
  const note = studyNotes.find(n => n.id === noteId);
  if (!note) return;
  reviewCards.push({
    id: Date.now(),
    title: note.title || 'بطاقة بدون عنوان',
    body: noteContentText(note),
    createdAt: new Date().toLocaleDateString('ar-EG'),
  });
  saveReviewCards();
  showToast('✅ تم تحويل الملاحظة إلى بطاقة مراجعة');
}

function renderReviewCards() {
  const grid = document.getElementById('reviewCardsGrid');
  const countEl = document.getElementById('reviewCardsCount');
  if (countEl) countEl.textContent = `${reviewCards.length} بطاقة مراجعة`;
  if (!reviewCards.length) {
    grid.innerHTML = `
      <div class="notes-empty">
        <div class="icon">🔁</div>
        <h3>لا توجد بطاقات مراجعة بعد</h3>
        <p>من صفحة "ملاحظاتي" حوّل أي ملاحظة إلى بطاقة مراجعة</p>
      </div>`;
    return;
  }
  grid.innerHTML = reviewCards.map(rc => {
    const known = reviewCardsKnown.has(String(rc.id));
    return `
    <div class="review-flip-card ${known ? 'review-card-known' : ''}" tabindex="0" onclick="if(!event.target.closest('button')) this.classList.toggle('flipped')">
      <div class="review-flip-inner">
        <div class="review-flip-face front">
          <div class="review-flip-title">${esc(rc.title)}</div>
          <div class="review-flip-hint">اضغط أو Space لرؤية المحتوى ←</div>
        </div>
        <div class="review-flip-face back">
          <div class="review-flip-body">${hl(esc(rc.body))}</div>
          <div class="review-card-actions">
            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();toggleReviewCardKnown(${rc.id})">${known ? '↩️ إزالة العلامة' : '✅ أعرفها'}</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="event.stopPropagation();deleteReviewCard(${rc.id})">🗑️</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleReviewCardKnown(id) {
  const key = String(id);
  if (reviewCardsKnown.has(key)) reviewCardsKnown.delete(key); else reviewCardsKnown.add(key);
  saveReviewCardsKnown();
  renderReviewCards();
}

function deleteReviewCard(id) {
  reviewCards = reviewCards.filter(rc => rc.id !== id);
  saveReviewCards();
  renderReviewCards();
}

