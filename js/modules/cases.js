// ════════════════════════════════════════════════
//  RENDER CASES
// ════════════════════════════════════════════════
function renderCases() {
  ensureHomeModeBar();
  const grid = document.getElementById('casesGrid');
  let bySpec = currentFilter === 'all' ? cases : cases.filter(c => c.specialty === currentFilter);
  if (homeMode === 'favorites') bySpec = bySpec.filter(c => isCaseFavorite(c, cases.indexOf(c)));
  const terms = searchQuery.split(/\s+/).filter(Boolean);
  const filtered = terms.length ? bySpec.filter(c => {
    const text = caseSearchText(c);
    return terms.every(term => text.includes(term));
  }) : bySpec;
  const countEl = document.getElementById('searchCount');
  if (countEl) {
    const modeLabel = homeMode === 'rapid' ? 'Rapid Review' : (homeMode === 'favorites' ? 'Favorites' : (homeMode === 'exam' ? 'وضع الامتحان' : 'Flashcards'));
    countEl.textContent = searchQuery ? `تم العثور على ${filtered.length} من ${bySpec.length} حالة · ${modeLabel}` : `${bySpec.length} من ${cases.length} حالة · ${modeLabel}`;
  }
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="icon">🏥</div>
        <h3>لا توجد حالات بعد</h3>
        <p>اضغط "حالة جديدة" لإضافة أول حالة طبية</p>
      </div>`;
    return;
  }

  if (homeMode === 'exam') {
    renderExamMode(filtered);
    return;
  }

  if (homeMode === 'rapid') {
    if (rapidIndex >= filtered.length) rapidIndex = 0;
    if (rapidIndex < 0) rapidIndex = filtered.length - 1;
    const c = filtered[rapidIndex];
    const realIdx = cases.indexOf(c);
    const isDone = isCaseDone(c, realIdx < 0 ? rapidIndex : realIdx);
    const isFav = isCaseFavorite(c, realIdx < 0 ? rapidIndex : realIdx);
    const safeRecap = hl(esc(c.recap || c.bigpicture || c.scenario || c.complaint || 'لا يوجد ملخص مكتوب لهذه الحالة.'));
    const recapSizeClass = safeRecap.length > 380 ? 'recap-sm' : (safeRecap.length > 160 ? 'recap-md' : '');
    const enterClass = rapidDirection < 0 ? 'enter-left' : 'enter-right';
    const pct = Math.round(((rapidIndex + 1) / filtered.length) * 100);
    grid.innerHTML = `
      <div class="rapid-solo-wrap">
        <div class="rapid-progress-track"><div class="rapid-progress-fill" style="width:${pct}%"></div></div>
        <div class="rapid-progress-label">حالة ${rapidIndex + 1} من ${filtered.length}</div>
        <div class="rapid-solo-card ${isDone ? 'is-done' : ''} ${enterClass}" onclick="advanceRapid(event)">
          <div class="rapid-solo-emoji-bg">${esc(c.emoji || '🩺')}</div>
          <button class="favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, ${realIdx})" title="Favorite">${isFav ? '★' : '☆'}</button>
          ${isDone ? '<div class="case-done-badge">✅ تمت المراجعة</div>' : ''}
          <div class="rapid-solo-recap ${recapSizeClass}">${safeRecap}</div>
          <div class="rapid-solo-hint">اضغط في أي مكان للحالة التالية <span class="arrow">←</span></div>
        </div>
        <div class="rapid-solo-actions">
          <button class="btn btn-ghost btn-sm" onclick="advanceRapid(event, -1)">→ السابقة</button>
          ${isDone
            ? `<button class="btn btn-ghost btn-sm" onclick="clearCaseReviewedByIdx(event, ${realIdx})">إزالة المراجعة</button>`
            : `<button class="btn btn-primary btn-sm" onclick="markCaseReviewedFromCard(event, ${realIdx})">تمت</button>`}
          <button class="btn btn-ghost btn-sm" onclick="openCaseDetailsFromCard(event, ${realIdx})">فتح التفاصيل</button>
          <button class="btn btn-ghost btn-sm" onclick="advanceRapid(event, 1)">التالية ←</button>
        </div>
      </div>`;
    return;
  }
  grid.innerHTML = filtered.map((c, i) => {
    const realIdx = cases.indexOf(c);
    const isDone = isCaseDone(c, realIdx < 0 ? i : realIdx);
    const isFav = isCaseFavorite(c, realIdx < 0 ? i : realIdx);
    const safeName = esc(c.name || 'حالة بدون اسم');
    const safeComplaint = esc(c.complaint || '');
    const safeDiagnosis = esc(c.diagnosis || c.complaint || 'غير محدد');
    const safeRecap = hl(esc(c.recap || c.bigpicture || c.scenario || c.complaint || 'لا يوجد ملخص مكتوب لهذه الحالة.'));
    const safeSpecialty = esc(c.specialty || '');
    const safeAge = esc(c.age || '');
    const toneClass = `tone-${i % 6}`;
    const cKey = caseKey(c, realIdx < 0 ? i : realIdx);
    const notOpened = !openedCases.has(cKey);
    return `
    <div class="case-card fade-in ${toneClass} ${isDone ? 'is-done' : ''} ${notOpened ? 'not-opened' : ''}" tabindex="0" data-case-key="${cKey}" onclick="flipCaseCard(event, this)" style="animation-delay:${i*0.05}s">
      <button class="favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, ${realIdx})" title="Favorite">${isFav ? '★' : '☆'}</button>
      ${isDone ? '<div class="case-done-badge">✅ تمت المراجعة</div>' : ''}
      <div class="case-card-inner">
        <div class="case-card-face case-card-front">
          <div class="case-card-header">
            <div class="patient-avatar">${esc(c.emoji || '👤')}</div>
            <div class="case-meta">
              <div class="case-name">${safeName}</div>
              <div class="case-complaint">${safeComplaint}</div>
            </div>
          </div>
          <div class="case-tags">
            <span class="tag">${safeSpecialty}</span>
            ${c.dontmiss ? "<span class=\"tag amber\">⚠️ Don't Miss</span>" : ''}
            ${c.mcqs && c.mcqs.filter(q=>q.q).length ? `<span class="tag purple">🏥 MCQ ×${c.mcqs.filter(q=>q.q).length}</span>` : ''}
          </div>
          <div class="case-card-footer">
            <div class="case-age">${safeAge ? `العمر: <strong>${safeAge}</strong>` : ''}${c.caseDate ? ` · ${esc(c.caseDate)}` : ''}</div>
            <div class="case-action">اقلب للإجابة ←</div>
          </div>
        </div>
        <div class="case-card-face case-card-back">
          <div class="case-card-back-scroll">
            <div class="case-diagnosis"><span class="case-diagnosis-label">الإجابة / التشخيص:</span> ${safeDiagnosis}</div>
            <div class="rapid-recap">${safeRecap}</div>
          </div>
          <div class="case-card-actions">
            ${isDone ? `<button class="btn btn-ghost btn-sm" onclick="clearCaseReviewedByIdx(event, ${realIdx})">إزالة المراجعة</button>` : `<button class="btn btn-primary btn-sm" onclick="markCaseReviewedFromCard(event, ${realIdx})">تمت</button>`}
            <button class="btn btn-ghost btn-sm" onclick="openCaseDetailsFromCard(event, ${realIdx})">فتح التفاصيل</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function filterSpec(el, spec) {
  document.querySelectorAll('.spec-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentFilter = spec;
  rapidIndex = 0;
  renderCases();
}

function advanceRapid(event, dir) {
  if (event?.target.closest('button')) return;
  event?.stopPropagation();
  dir = dir || 1;
  rapidDirection = dir;
  rapidIndex += dir;
  renderCases();
}

function flipCaseCard(event, card) {
  if (event.target.closest('button')) return;
  card.classList.toggle('flipped');
  const key = card.dataset.caseKey;
  if (key && !openedCases.has(key)) {
    openedCases.add(key);
    localStorage.setItem('drmonic_opened', JSON.stringify([...openedCases]));
    card.classList.remove('not-opened');
  }
}

// ════════════════════════════════════════════════
//  IMPORTANT-WORD HIGHLIGHTING  (wrap text in **word** to highlight)
// ════════════════════════════════════════════════
function hl(txt) {
  if (!txt) return txt;
  return fixArrows(String(txt)).replace(/\*\*(.+?)\*\*/g, '<strong class="hl-word">$1</strong>');
}

// ════════════════════════════════════════════════
//  KEYBOARD: Space to flip the focused/hovered flashcard
// ════════════════════════════════════════════════
let lastHoveredFlipCard = null;
document.addEventListener('mouseover', (e) => {
  const card = e.target.closest('.case-card, .review-flip-card');
  if (card) lastHoveredFlipCard = card;
});
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space') return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
  const active = document.activeElement?.closest?.('.case-card, .review-flip-card');
  const target = active || lastHoveredFlipCard;
  if (!target) return;
  e.preventDefault();
  target.classList.toggle('flipped');
  if (target.classList.contains('case-card')) {
    const key = target.dataset.caseKey;
    if (key && !openedCases.has(key)) {
      openedCases.add(key);
      localStorage.setItem('drmonic_opened', JSON.stringify([...openedCases]));
      target.classList.remove('not-opened');
    }
  }
});

// ════════════════════════════════════════════════
//  EXAM MODE — shows complaint/history/exam, hides diagnosis & treatment
// ════════════════════════════════════════════════
function saveExamStats() {
  localStorage.setItem('drmonic_exam_stats', JSON.stringify(examStats));
}

function renderExamMode(filtered) {
  const grid = document.getElementById('casesGrid');
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">📝</div><h3>لا توجد حالات</h3></div>`;
    return;
  }
  if (examIndex >= filtered.length) examIndex = 0;
  if (examIndex < 0) examIndex = filtered.length - 1;
  const c = filtered[examIndex];
  const realIdx = cases.indexOf(c);
  const cKey = caseKey(c, realIdx < 0 ? examIndex : realIdx);
  const stat = examStats[cKey];
  const pct = Math.round(((examIndex + 1) / filtered.length) * 100);

  const stemBits = [];
  if (c.history) stemBits.push(...c.history.split('\n').filter(l => l.trim()));
  if (c.exam) stemBits.push(...c.exam.split('\n').filter(l => l.trim()));

  grid.innerHTML = `
    <div class="exam-solo-wrap">
      <div class="rapid-progress-track"><div class="rapid-progress-fill" style="width:${pct}%"></div></div>
      <div class="rapid-progress-label">حالة ${examIndex + 1} من ${filtered.length}</div>
      <div class="exam-card">
        <div class="exam-label">الشكوى الرئيسية / Chief Complaint</div>
        <div class="exam-complaint">${hl(esc(c.complaint || c.name || '—'))}</div>
        ${stemBits.length ? `<div class="exam-stem-list"><ul>${stemBits.map(l => `<li>${hl(esc(l))}</li>`).join('')}</ul></div>` : ''}
        <div class="exam-divider"></div>
        <div style="text-align:center;">
          <button class="btn btn-primary" id="examRevealBtn" onclick="revealExamAnswer()" ${examRevealed ? 'style="display:none;"' : ''}>👁️ اظهر التشخيص والعلاج</button>
        </div>
        <div class="exam-answer-block ${examRevealed ? 'show' : ''}" id="examAnswerBlock">
          <div class="exam-answer-label">التشخيص:</div>
          <div class="exam-answer-diag">${hl(esc(c.diagnosis || c.complaint || '—'))}</div>
          ${c.management ? `<div class="exam-answer-label">العلاج:</div><div class="sec-card-reading">${renderExamList(c.management)}</div>` : ''}
          <div class="exam-feedback-row">
            <button class="btn exam-know-btn ${stat==='known'?'is-active':''}" onclick="examMark(true)">✅ أعرفها</button>
            <button class="btn exam-dontknow-btn ${stat==='unknown'?'is-active':''}" onclick="examMark(false)">❌ لا أعرفها</button>
          </div>
        </div>
      </div>
      <div class="exam-stats-row">
        <span class="ok">✅ ${Object.values(examStats).filter(v=>v==='known').length}</span>
        <span class="no">❌ ${Object.values(examStats).filter(v=>v==='unknown').length}</span>
      </div>
      <div class="exam-actions-row">
        <button class="btn btn-ghost btn-sm" onclick="advanceExam(-1)">→ السابقة</button>
        <button class="btn btn-ghost btn-sm" onclick="openCaseDetailsFromCard(event, ${realIdx})">فتح التفاصيل</button>
        <button class="btn btn-ghost btn-sm" onclick="advanceExam(1)">التالية ←</button>
      </div>
    </div>`;
}

function renderExamList(txt) {
  if (!txt) return '—';
  const lines = txt.split('\n').filter(l => l.trim());
  if (lines.length <= 1) return `<p>${hl(esc(txt))}</p>`;
  return '<ul>' + lines.map(l => `<li>${hl(esc(l))}</li>`).join('') + '</ul>';
}

function revealExamAnswer() {
  examRevealed = true;
  const btn = document.getElementById('examRevealBtn');
  const block = document.getElementById('examAnswerBlock');
  if (btn) btn.style.display = 'none';
  if (block) block.classList.add('show');
}

function examMark(known) {
  const bySpec = currentFilter === 'all' ? cases : cases.filter(c => c.specialty === currentFilter);
  const terms = searchQuery.split(/\s+/).filter(Boolean);
  const filtered = terms.length ? bySpec.filter(c => terms.every(t => caseSearchText(c).includes(t))) : bySpec;
  const c = filtered[examIndex];
  if (!c) return;
  const realIdx = cases.indexOf(c);
  const cKey = caseKey(c, realIdx < 0 ? examIndex : realIdx);
  examStats[cKey] = known ? 'known' : 'unknown';
  saveExamStats();
  advanceExam(1);
}

function advanceExam(dir) {
  examIndex += dir;
  examRevealed = false;
  renderCases();
}

function toggleFavorite(event, idx) {
  event.stopPropagation();
  const c = cases[idx];
  if (!c) return;
  const key = caseKey(c, idx);
  if (favoriteCases.has(key) || favoriteCases.has(String(idx))) {
    favoriteCases.delete(key);
    favoriteCases.delete(String(idx));
  } else {
    favoriteCases.add(key);
  }
  saveFavoriteCases();
  renderCases();
}

function markCaseReviewedFromCard(event, idx) {
  event.stopPropagation();
  const c = cases[idx];
  if (!c) return;
  doneCases.add(caseKey(c, idx));
  saveDoneCases();
  renderSpecialtyControls();
  renderCases();
}

function clearCaseReviewedByIdx(event, idx) {
  event?.stopPropagation?.();
  const c = cases[idx];
  if (!c) return;
  doneCases.delete(caseKey(c, idx));
  doneCases.delete(String(idx));
  saveDoneCases();
  renderSpecialtyControls();
  renderCases();
  showToast('تمت إزالة علامة المراجعة');
}

// ════════════════════════════════════════════════
//  MOTIVATIONAL POPUP → CASE VIEW
// ════════════════════════════════════════════════
function openCasePrompt(idx) {
  pendingCaseIndex = idx;
  const c = cases[idx] || {};
  document.getElementById('mot1Text').innerText = c.startMsg || settings.msg1 || 'بسم الله، ابدأ بنية التعلم والعطاء';
  openModal('motModal1');
}
function openCaseDetailsFromCard(event, idx) {
  if (event) event.stopPropagation();
  openCasePrompt(idx);
}
function startCase() {
  closeModal('motModal1');
  renderCaseView(pendingCaseIndex);
}
function finishCase() {
  // Mark as done
  const c = cases[pendingCaseIndex] || {};
  doneCases.add(caseKey(c, pendingCaseIndex));
  saveDoneCases();
  renderSpecialtyControls();
  const endMsg = c.endMsg || settings.msg2 || 'أحسنت! أكملت الحالة بنجاح';
  document.getElementById('mot2Text').innerText = endMsg;
  openModal('motModal2');
}

// ════════════════════════════════════════════════
//  CASE VIEW RENDER
// ════════════════════════════════════════════════
function renderCaseView(idx) {
  const c = cases[idx];
  pendingCaseIndex = idx;
  document.getElementById('homeView').style.display = 'none';
  document.getElementById('adminPanel').classList.remove('active');
  document.getElementById('caseView').classList.add('active');
  const rcv = document.getElementById('reviewCardsView'); if (rcv) rcv.classList.remove('active');
  const mqv = document.getElementById('mcqQuizView'); if (mqv) mqv.classList.remove('active');
  document.getElementById('cvBreadcrumb').textContent = c.name;
  
  const sections = [
    { key:'bigpicture', title:'مقدمة علمية سريعة', sub:'The Big Picture', icon:'🌍', cls:'icon-teal' },
    { key:'scenario',   title:'السيناريو القصصي', sub:'The Scenario',   icon:'📖', cls:'icon-blue' },
    { key:'patho',      title:'ليش صار هيك؟',     sub:'Pathophysiology', icon:'🧬', cls:'icon-purple' },
    { key:'management', title:'خطة العلاج',         sub:'Management',      icon:'💊', cls:'icon-green' },
    { key:'history',    title:'التاريخ المرضي',     sub:'History Checklist',icon:'📋',cls:'icon-teal' },
    { key:'exam',       title:'الفحص السريري',      sub:'Physical Exam',   icon:'🩺', cls:'icon-blue' },
    { key:'labs',       title:'الفحوصات والأشعة',   sub:'Labs / Imaging',  icon:'🧪', cls:'icon-teal' },
    { key:'dontmiss',   title:'تريكات لازم تدير بالك',sub:"Don't Miss!", icon:'⚠️', cls:'icon-amber' },
    { key:'diffdx',     title:'الفرق بينها وبين مرض مشابه', sub:'Differential', icon:'🔀', cls:'icon-purple' },
    { key:'mistake',    title:'خطأ شائع',           sub:'Common Mistake',  icon:'🚫', cls:'icon-red' },
    { key:'tricks',     title:'تريكات التشخيص السريع', sub:'Tricks',      icon:'💡', cls:'icon-amber' },
    { key:'recap',      title:'ملخص الحالة',        sub:'The Recap',       icon:'📝', cls:'icon-teal' },
  ];

  const accentOf = cls => cls.replace('icon-', '');

  // Renders a field's text preserving: blank-line paragraph breaks, "1. **Title**"
  // numbered items (each becomes its own block with a bold header), and "* sub-point"
  // lines under a numbered item (rendered as a nested sub-list). Falls back to the
  // old flat bullet-list behavior for simple one-line-per-point fields.
  const renderList = (txt) => {
    if (!txt) return '<p style="color:var(--text2)">—</p>';
    const rawLines = txt.replace(/\r\n/g, '\n').split('\n');
    // Group into paragraph blocks separated by one-or-more blank lines
    const blocks = [];
    let current = [];
    rawLines.forEach(line => {
      if (!line.trim()) {
        if (current.length) { blocks.push(current); current = []; }
      } else current.push(line);
    });
    if (current.length) blocks.push(current);
    if (!blocks.length) return '<p style="color:var(--text2)">—</p>';

    const numberedRe = /^\s*\d+[.)]\s+(.*)$/;
    const subBulletRe = /^\s*[*\-•]\s+(.*)$/;

    const renderBlock = (lines) => {
      // A numbered block: first line matches "1. ..." — render as a titled item,
      // with any following "* ..." lines as a nested sub-list under it.
      if (numberedRe.test(lines[0])) {
        const title = lines[0].match(numberedRe)[1];
        const subLines = lines.slice(1);
        const subItems = subLines.filter(l => subBulletRe.test(l) || l.trim());
        const subHtml = subItems.length
          ? '<ul class="sec-sub-list">' + subItems.map(l => {
              const m = l.match(subBulletRe);
              return `<li>${hl(m ? m[1] : l)}</li>`;
            }).join('') + '</ul>'
          : '';
        return `<div class="sec-numbered-item"><p class="sec-numbered-title">${hl(title)}</p>${subHtml}</div>`;
      }
      // A plain multi-line block with no numbering: each line is its own bullet
      if (lines.length > 1) {
        return '<ul>' + lines.map(l => {
          const m = l.match(subBulletRe);
          return `<li>${hl(m ? m[1] : l)}</li>`;
        }).join('') + '</ul>';
      }
      // Single-line block: a plain paragraph
      const m = lines[0].match(subBulletRe);
      return `<p>${hl(m ? m[1] : lines[0])}</p>`;
    };

    if (blocks.length === 1) return renderBlock(blocks[0]);
    return '<div class="sec-block-group">' + blocks.map(renderBlock).join('') + '</div>';
  };

  const mcqHtml = (c.mcqs && c.mcqs.filter(q=>q.q).length) ? `
    <div class="sec-card" data-accent="purple" id="mcqCard">
      <div class="sec-card-header" onclick="toggleSection(this)">
        <div class="sec-card-icon icon-purple">🏥</div>
        <div class="sec-card-title">أسئلة الجامعة الهاشمية <small style="color:var(--text2)">High-Yield MCQ</small></div>
        <button class="sec-card-copy" title="نسخ الأسئلة" onclick="copySection(this,event)">📋</button>
        <div class="sec-card-arrow">▼</div>
      </div>
      <div class="sec-card-body">
        ${c.mcqs.filter(q=>q.q).map((q,i)=>`
          <div class="mcq-item">
            <div class="mcq-question">س${i+1}: ${hl(q.q)}</div>
            <button class="mcq-answer-btn" onclick="revealAnswer(this)">🔍 اظهر الإجابة</button>
            <div class="mcq-answer-reveal">${q.a ? hl(q.a) : 'لا يوجد إجابة'}</div>
          </div>`).join('')}
      </div>
    </div>` : '';

  const images = Array.isArray(c.images) && c.images.length ? c.images : (c.img ? [c.img] : []);
  const imagesHtml = images.length ? `
    <div class="sec-card" data-accent="blue">
      <div class="sec-card-header" onclick="toggleSection(this)">
        <div class="sec-card-icon icon-blue">🖼️</div>
        <div class="sec-card-title">الصور <small style="color:var(--text2)">Images</small></div>
        <div class="sec-card-arrow">▼</div>
      </div>
      <div class="sec-card-body">
        <div class="case-images-grid">
          ${images.map(src => `<img src="${src}" class="case-image" alt="صورة توضيحية" onclick="openLightbox('${src.replace(/'/g, "\\'")}')" />`).join('')}
        </div>
      </div>
    </div>` : '';
  const notesHtml = c.notes ? `
    <div class="sec-card" data-accent="teal" data-copy="${(c.notes||'').replace(/"/g,'&quot;')}">
      <div class="sec-card-header" onclick="toggleSection(this)">
        <div class="sec-card-icon icon-teal">🗒️</div>
        <div class="sec-card-title">ملاحظات جانبية</div>
        <button class="sec-card-copy" title="نسخ" onclick="copySection(this,event)">📋</button>
        <div class="sec-card-arrow">▼</div>
      </div>
      <div class="sec-card-body">
        <div class="sec-card-reading"><p>${hl(c.notes)}</p></div>
      </div>
    </div>` : '';
  const voices = Array.isArray(c.voices) && c.voices.length ? c.voices : (c.voice ? [c.voice] : []);
  const voiceHtml = voices.length ? `
    <div class="sec-card" data-accent="purple">
      <div class="sec-card-header" onclick="toggleSection(this)">
        <div class="sec-card-icon icon-purple">🎙️</div>
        <div class="sec-card-title">فويس الحالة <small style="color:var(--text2)">Voice Note</small></div>
        <div class="sec-card-arrow">▼</div>
      </div>
      <div class="sec-card-body">
        ${voices.map((src, i) => `
          <div class="mcq-item">
            <div class="mcq-question">فويس ${i + 1}</div>
            <audio class="case-audio" src="${src}" controls></audio>
          </div>
        `).join('')}
      </div>
    </div>` : '';

  const sectionCardHtml = (s) => `
        <div class="sec-card" data-accent="${accentOf(s.cls)}" data-copy="${(c[s.key]||'').replace(/"/g,'&quot;')}">
          <div class="sec-card-header" onclick="toggleSection(this)">
            <div class="sec-card-icon ${s.cls}">${s.icon}</div>
            <div class="sec-card-title">${s.title} <small style="color:var(--text2); font-weight:400; font-size:0.78rem; margin-right:6px">${s.sub}</small></div>
            <button class="sec-card-copy" title="نسخ" onclick="copySection(this,event)">📋</button>
            <div class="sec-card-arrow">▼</div>
          </div>
          <div class="sec-card-body">
            <div class="sec-card-reading">${renderList(c[s.key])}</div>
          </div>
        </div>`;

  document.getElementById('caseViewContent').innerHTML = `
    <div class="cv-hero fade-in">
      <div class="cv-hero-inner">
        <div class="cv-avatar">${c.emoji || '👤'}</div>
        <div class="cv-info">
          <div class="cv-name">${c.name}</div>
          <div class="cv-diagnosis">التشخيص: ${c.diagnosis || c.complaint}</div>
          <div class="cv-complaint">📍 ${c.complaint}</div>
          <div class="cv-meta-row">
            <div class="cv-meta-item">🎂 العمر: <strong>${c.age} سنة</strong></div>
            <div class="cv-meta-item">🏷️ <strong>${c.specialty}</strong></div>
            ${c.caseDate ? `<div class="cv-meta-item">📅 <strong>${c.caseDate}</strong></div>` : ''}
          </div>
        </div>
      </div>
    </div>
    <div class="sections-list fade-in">
      ${sections.filter(s => c[s.key]).map(sectionCardHtml).join('')}
      ${mcqHtml}
      ${imagesHtml}
      ${voiceHtml}
      ${notesHtml}
    </div>`;

  document.querySelectorAll('#caseViewContent .sec-card .sec-card-body').forEach(b => {
    b.style.maxHeight = '0px';
  });

  // Set MCQ copy text safely via JS (avoids HTML escaping issues)
  if (c.mcqs && c.mcqs.filter(q=>q.q).length) {
    const mcqCard = document.getElementById('mcqCard');
    if (mcqCard) mcqCard.dataset.copy = c.mcqs.filter(q=>q.q).map((q,i)=>`س${i+1}: ${q.q}\nج: ${q.a||''}`).join('\n\n');
  }

  window.addEventListener('scroll', updateProgress);
  updateProgress();

  // Load study notes for this case
  const notesKey = 'drmonic_notes_' + (c.createdAt || pendingCaseIndex);
  const savedNotes = localStorage.getItem(notesKey) || '';
  const notesImagesKey = 'drmonic_notes_images_' + (c.createdAt || pendingCaseIndex);
  const savedNotesImages = JSON.parse(localStorage.getItem(notesImagesKey) || '[]');

  const footer = document.getElementById('caseViewFooter');
  footer.innerHTML = `
    <div class="study-notes-view" id="studyNotesPanel">
      <div class="study-notes-header">
        <div class="study-notes-title">✎ ملاحظاتي وشروحاتي الخاصة</div>
        <span class="notes-saved-indicator" id="notesSavedIndicator">✅ تم الحفظ</span>
      </div>
      <textarea class="study-notes-textarea" id="studyNotesArea"
        placeholder="اكتب هنا ملاحظاتك الخاصة، شروحاتك، روابط مهمة، أو أي معلومة تبيها تتذكرها لهذه الحالة..."
        oninput="autoSaveStudyNotes()">${savedNotes}</textarea>
      <div class="case-card-actions" style="justify-content:flex-start;">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('studyNotesImageFile').click()">📎 إضافة صورة</button>
        <span class="magic-hint">أو الصق صورة مباشرة بـ Ctrl+V هنا.</span>
      </div>
      <input type="file" id="studyNotesImageFile" accept="image/*" multiple style="display:none;" onchange="addStudyNoteImagesFromFiles(this.files)" />
      <div class="study-note-images" id="studyNotesImages"></div>
    </div>
    <div style="text-align:center; padding: 10px 0 40px;">
      <button class="btn btn-primary" onclick="finishCase()" style="padding:14px 40px; font-size:1rem;">
        ✅ تم — إنهاء الحالة
      </button>
    </div>`;

  const notesArea = document.getElementById('studyNotesArea');
  if (notesArea) notesArea._notesKey = notesKey;
  const notesImagesEl = document.getElementById('studyNotesImages');
  if (notesImagesEl) {
    notesImagesEl._imagesKey = notesImagesKey;
    notesImagesEl._images = savedNotesImages;
    renderStudyNoteImages();
  }
}

function toggleSection(header) {
  const card = header.closest('.sec-card');
  const body = card.querySelector('.sec-card-body');
  const isOpen = card.classList.contains('open');
  if (isOpen) {
    body.style.maxHeight = body.scrollHeight + 'px';
    requestAnimationFrame(() => {
      card.classList.remove('open');
      body.style.maxHeight = '0px';
    });
  } else {
    card.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
    body.addEventListener('transitionend', function handler() {
      if (card.classList.contains('open')) body.style.maxHeight = 'none';
      body.removeEventListener('transitionend', handler);
    });
  }
}

function revealAnswer(btn) {
  const reveal = btn.nextElementSibling;
  reveal.classList.toggle('show');
  btn.textContent = reveal.classList.contains('show') ? '🙈 إخفاء الإجابة' : '🔍 اظهر الإجابة';
}

function updateProgress() {
  const el = document.getElementById('caseView');
  const total = el.scrollHeight - window.innerHeight;
  const curr = window.scrollY;
  document.getElementById('readProgress').style.width = Math.min(100, (curr/total)*100) + '%';
}

// ════════════════════════════════════════════════
//  CREATE / EDIT CASE
// ════════════════════════════════════════════════
function openCreateModal(idx = null) {
  editingIndex = idx;
  mcqCount = 0;
  document.getElementById('mcqContainer').innerHTML = '';
  caseImages = [];
  voiceNotes = [];
  document.getElementById('imagesContainer').innerHTML = '';
  addImageField();
  renderSpecialtyControls();
  updateVoicePreview();

  const fields = ['name','age','caseDate','specialty','complaint','diagnosis','startMsg','endMsg','bigpicture','scenario','patho','management','history','exam','labs','dontmiss','diffdx','mistake','tricks','recap','notes'];
  fields.forEach(f => {
    const el = document.getElementById('f_' + f);
    if (el) el.value = '';
  });
  // Reset emoji
  document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
  document.querySelector('.emoji-opt[data-emoji="👦"]').classList.add('selected');

  if (idx !== null) {
    const c = cases[idx];
    document.getElementById('createModalTitle').textContent = '✏️ تعديل الحالة';
    fields.forEach(f => {
      const el = document.getElementById('f_' + f);
      if (el && c[f] !== undefined) el.value = c[f];
    });
    // emoji
    document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
    const emojiEl = document.querySelector(`.emoji-opt[data-emoji="${c.emoji}"]`);
    if (emojiEl) emojiEl.classList.add('selected');
    // MCQs
    if (c.mcqs) c.mcqs.forEach(q => addMCQ(q.q, q.a));
    // Images
    caseImages = Array.isArray(c.images) && c.images.length ? [...c.images] : (c.img ? [c.img] : []);
    renderImageFields();
    voiceNotes = Array.isArray(c.voices) && c.voices.length ? [...c.voices] : (c.voice ? [c.voice] : []);
    updateVoicePreview();
  } else {
    document.getElementById('createModalTitle').textContent = '✚ إنشاء حالة جديدة';
    document.getElementById('f_caseDate').valueAsDate = new Date();
    document.getElementById('f_specialty').value = 'طوارئ';
  }
  openModal('createModal');
}

function cleanParsedText(txt) {
  return (txt || '')
    .replace(/\r/g, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function compactLines(txt) {
  return cleanParsedText(txt).split('\n').map(l => l.trim()).filter(Boolean);
}

function isMagicHeading(line) {
  const s = cleanParsedText(line).replace(/[:":]+$/,'').trim();
  const patterns = [
    /^(case name|اسم مقترح|عنوان الحالة)/i,
    /^(اسم المريض|patient|patient name)/i,
    /^(chief complaint|الشكوى الرئيسية)/i,
    /^(diagnosis|التشخيص)/i,
    /^(the big picture|big picture|الصورة الكبيرة|مقدمة علمية)/i,
    /^(the scenario|scenario|السيناريو)/i,
    /^(شرح الحالة|pathophysiology|ليش صار|why did)/i,
    /^(management|خطة العلاج|شو بنعمل علاج|treatment)/i,
    /^(the history checklist|history checklist|التاريخ المرضي)/i,
    /^(the physical exam|physical exam|الفحص السريري)/i,
    /^(don't miss|dont miss|لازم تدير بالك)/i,
    /^(differential|الفرق بينها وبين|تشخيص تفريقي)/i,
    /^(common mistake|خطأ شائع)/i,
    /^(tricks|تريكات التشخيص السريع)/i,
    /^(high-yield mcq|mcq|أسئلة|اسئلة الجامعة|تريكات الهاشمية)/i,
    /^(the recap|recap|الزبدة|ملخص)/i,
    /^(ربط الموضوع|عظمة خلق الله|notes|ملاحظات)/i
  ];
  return patterns.some(rx => rx.test(s));
}

function headingKey(line) {
  const s = cleanParsedText(line).replace(/[:":]+$/,'').trim();
  const defs = [
    ['caseName', /^(case name|اسم مقترح|عنوان الحالة)/i],
    ['patient', /^(اسم المريض|patient|patient name)/i],
    ['complaint', /^(chief complaint|الشكوى الرئيسية)/i],
    ['diagnosis', /^(diagnosis|التشخيص)/i],
    ['bigpicture', /^(the big picture|big picture|الصورة الكبيرة|مقدمة علمية)/i],
    ['scenario', /^(the scenario|scenario|السيناريو)/i],
    ['patho', /^(شرح الحالة|pathophysiology|ليش صار|why did)/i],
    ['management', /^(management|خطة العلاج|شو بنعمل علاج|treatment)/i],
    ['history', /^(the history checklist|history checklist|التاريخ المرضي)/i],
    ['exam', /^(the physical exam|physical exam|الفحص السريري)/i],
    ['dontmiss', /^(don't miss|dont miss|لازم تدير بالك)/i],
    ['diffdx', /^(differential|الفرق بينها وبين|تشخيص تفريقي)/i],
    ['mistake', /^(common mistake|خطأ شائع)/i],
    ['tricks', /^(tricks|تريكات التشخيص السريع)/i],
    ['mcq', /^(high-yield mcq|mcq|أسئلة|اسئلة الجامعة|تريكات الهاشمية)/i],
    ['recap', /^(the recap|recap|الزبدة|ملخص)/i],
    ['notes', /^(ربط الموضوع|عظمة خلق الله|notes|ملاحظات)/i]
  ];
  return defs.find(([, rx]) => rx.test(s))?.[0] || null;
}

function splitMagicSections(raw) {
  const lines = (raw || '').replace(/\r/g, '').split('\n');
  const sections = {};
  let current = 'startMsg';
  sections[current] = [];

  lines.forEach(line => {
    const key = headingKey(line);
    if (key) {
      current = key;
      if (!sections[current]) sections[current] = [];
      return;
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(line);
  });

  Object.keys(sections).forEach(key => {
    sections[key] = cleanParsedText(sections[key].join('\n'));
  });
  return sections;
}

function firstUsefulLine(txt) {
  return compactLines(txt)
    .map(l => l.replace(/^["'""]+|["'""]+$/g, '').trim())
    .find(l => l && !/^أو$/i.test(l)) || '';
}

function parsePatientInfo(txt) {
  const lines = compactLines(txt);
  const ageLine = lines.find(l => /العمر|age/i.test(l)) || '';
  const ageMatch = ageLine.match(/\d{1,3}/) || txt.match(/\b\d{1,3}\b/);
  const ageText = ageLine.replace(/^(?:العمر|age)\s*[::-]?\s*/i, '').trim();
  const nameLine = lines.find(l => !/العمر|age/i.test(l) && !isMagicHeading(l)) || '';
  return {
    name: nameLine.replace(/\(.*?\)/g, '').replace(/^[::-]+|[::-]+$/g, '').trim(),
    age: ageText || (ageMatch ? ageMatch[0] : '')
  };
}

function parseMcqs(txt) {
  const normalized = cleanParsedText(txt).replace(/➡️|➜|→|=>/g, 'ANSWER_MARK:');
  const chunks = normalized.split(/(?:^|\n)\s*(?:سؤال|Question|Q)\s*\d+[^\n]*\n/gi).map(s => s.trim()).filter(Boolean);
  return chunks.map(chunk => {
    const parts = chunk.split(/ANSWER_MARK:/);
    if (parts.length > 1) {
      return { q: cleanParsedText(parts[0]), a: cleanParsedText(parts.slice(1).join(' ')) };
    }
    const lines = compactLines(chunk);
    return { q: lines.slice(0, -1).join('\n') || lines[0] || '', a: lines.slice(-1)[0] || '' };
  }).filter(item => item.q);
}

function guessDiagnosis(sections) {
  const direct = firstUsefulLine(sections.diagnosis);
  if (direct) return direct;
  const haystack = [sections.complaint, sections.dontmiss, sections.mcq, sections.recap, sections.scenario].join('\n');
  const common = ['Adrenal Crisis', 'Adrenal Insufficiency', 'CAH', 'Hypoglycemia', 'Hyperkalemia', 'Hyponatremia'];
  return common.find(term => new RegExp(term, 'i').test(haystack)) || firstUsefulLine(sections.caseName) || '';
}

function setParsedField(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.value = value;
}

function toggleMcqBulkArea() {
  const el = document.getElementById('mcqBulkArea');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// Parses text formatted as alternating "سؤال: ..." / "الجواب: ..." blocks
// (each starting on its own line) into { q, a } pairs.
function parseMcqBulkText(text) {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, '\n');
  const chunks = normalized.split(/(?:^|\n)\s*سؤال\s*[::]/).map(s => s.trim()).filter(Boolean);
  return chunks.map(chunk => {
    const m = chunk.match(/سؤال\s*[::]/); // in case a stray one remains inline, ignore
    const idx = chunk.search(/\n?\s*الجواب\s*[::]/);
    if (idx === -1) return null;
    const q = chunk.slice(0, idx).trim();
    const a = chunk.slice(idx).replace(/^\s*الجواب\s*[::]/, '').trim();
    if (!q || !a) return null;
    return { q, a };
  }).filter(Boolean);
}

function applyMcqBulkFill() {
  const text = document.getElementById('mcqBulkText').value;
  const pairs = parseMcqBulkText(text);
  if (!pairs.length) {
    showToast('⚠️ ما قدرت ألاقي أسئلة بصيغة "سؤال:" / "الجواب:" — تأكد من الصيغة');
    return;
  }
  pairs.forEach(p => addMCQ(p.q, p.a));
  document.getElementById('mcqBulkText').value = '';
  document.getElementById('mcqBulkArea').style.display = 'none';
  showToast(`✅ تمت إضافة ${pairs.length} سؤال تلقائيًا`);
}

function addMCQ(q='', a='') {
  mcqCount++;
  const n = mcqCount;
  const div = document.createElement('div');
  div.className = 'mcq-block';
  div.id = 'mcq_' + n;
  div.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
      <span style="font-size:0.8rem; font-weight:700; color:var(--text2)">سؤال ${n}</span>
      <button class="btn btn-ghost btn-sm" style="padding:2px 8px;" onclick="this.closest('.mcq-block').remove()">✕</button>
    </div>
    <div class="form-group" style="margin-bottom:8px;">
      <input class="form-input" placeholder="نص السؤال..." value="${q.replace(/"/g,'&quot;')}" data-mcq-q="${n}" />
    </div>
    <div class="form-group">
      <textarea class="form-textarea" placeholder="الإجابة الصحيحة والشرح..." rows="2" data-mcq-a="${n}">${a}</textarea>
    </div>`;
  document.getElementById('mcqContainer').appendChild(div);
}

function selectEmoji(el) {
  document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}

function addImageField(value = '') {
  caseImages.push(value);
  renderImageFields();
}

function renderImageFields() {
  const container = document.getElementById('imagesContainer');
  container.innerHTML = caseImages.map((src, i) => `
    <div class="image-row">
      <div>
        <input class="form-input" placeholder="https://... أو ارفع صورة" value="${(src || '').replace(/"/g,'&quot;')}" data-image-index="${i}" oninput="caseImages[${i}] = this.value.trim(); renderImagePreview(${i})" />
        <img id="imagePreview_${i}" class="image-preview" src="${src || ''}" style="${src ? 'display:block;' : 'display:none;'}" />
      </div>
      <button class="btn btn-ghost btn-sm" onclick="caseImages.splice(${i},1); if(!caseImages.length) caseImages.push(''); renderImageFields();">✕</button>
    </div>
  `).join('');
}

function renderImagePreview(i) {
  const src = caseImages[i] || '';
  const prev = document.getElementById('imagePreview_' + i);
  if (!prev) return;
  prev.src = src;
  prev.style.display = src ? 'block' : 'none';
}

function previewImg(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  readImageFiles(files, images => {
    caseImages.push(...images);
    renderImageFields();
    showToast('✅ تمت إضافة الصور');
  });
  input.value = '';
}

function updateVoicePreview() {
  const list = document.getElementById('voicePreviewList');
  const status = document.getElementById('voiceStatus');
  const startBtn = document.getElementById('voiceStartBtn');
  const stopBtn = document.getElementById('voiceStopBtn');
  if (!list || !status) return;
  list.innerHTML = voiceNotes.map((src, i) => `
    <div class="image-row">
      <audio class="case-audio" src="${src}" controls></audio>
      <button class="btn btn-ghost btn-sm" onclick="removeVoiceNote(${i})">✕</button>
    </div>
  `).join('');
  status.textContent = voiceNotes.length ? `تم حفظ ${voiceNotes.length} فويس لهذه الحالة` : 'لا يوجد تسجيل محفوظ لهذه الحالة';
  status.classList.remove('recording');
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
}

async function startVoiceRecording() {
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    showToast('⚠️ المتصفح لا يدعم تسجيل الصوت');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    voiceChunks = [];
    voiceRecorder = new MediaRecorder(stream);
    voiceRecorder.ondataavailable = e => {
      if (e.data && e.data.size) voiceChunks.push(e.data);
    };
    voiceRecorder.onstop = () => {
      const blob = new Blob(voiceChunks, { type: voiceRecorder.mimeType || 'audio/webm' });
      const reader = new FileReader();
      reader.onload = e => {
        voiceNotes.push(e.target.result);
        updateVoicePreview();
        showToast('✅ تم إضافة الفويس للقائمة');
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(track => track.stop());
    };
    voiceRecorder.start();
    document.getElementById('voiceStatus').textContent = 'جاري التسجيل...';
    document.getElementById('voiceStatus').classList.add('recording');
    document.getElementById('voiceStartBtn').disabled = true;
    document.getElementById('voiceStopBtn').disabled = false;
  } catch (err) {
    showToast('⚠️ لم يتم السماح بالمايكروفون');
  }
}

function stopVoiceRecording() {
  if (voiceRecorder && voiceRecorder.state !== 'inactive') {
    voiceRecorder.stop();
  }
}

function removeVoiceNote(i) {
  voiceNotes.splice(i, 1);
  updateVoicePreview();
  showToast('🗑️ تم حذف الفويس');
}

function clearVoiceNotes() {
  if (voiceRecorder && voiceRecorder.state !== 'inactive') voiceRecorder.stop();
  voiceNotes = [];
  updateVoicePreview();
  showToast('🗑️ تم حذف كل الفويسات');
}

async function saveCase() {
  const get = id => (document.getElementById(id)?.value || '').trim();
  const name = get('f_name') || 'حالة بدون اسم';
  const complaint = get('f_complaint') || 'لم تُكتب الشكوى الرئيسية';
  const diagnosis = get('f_diagnosis') || 'تشخيص غير محدد';
  const age = get('f_age');
  const emoji = document.querySelector('.emoji-opt.selected')?.dataset.emoji || '👤';
  const mcqInputs = document.querySelectorAll('#mcqContainer .mcq-block');
  const mcqs = Array.from(mcqInputs).map(block => ({
    q: block.querySelector('[data-mcq-q]')?.value.trim() || '',
    a: block.querySelector('[data-mcq-a]')?.value.trim() || '',
  }));

  const images = caseImages.map(src => (src || '').trim()).filter(Boolean);
  const wasEditing = editingIndex !== null;
  const existing = wasEditing ? cases[editingIndex] : null;

  const obj = {
    id:         existing?.id || genId(),
    name, complaint, diagnosis, age,
    caseDate:   get('f_caseDate'),
    specialty: get('f_specialty'),
    emoji,
    startMsg:   get('f_startMsg'),
    endMsg:     get('f_endMsg'),
    bigpicture: get('f_bigpicture'),
    scenario:   get('f_scenario'),
    patho:      get('f_patho'),
    management: get('f_management'),
    history:    get('f_history'),
    exam:       get('f_exam'),
    labs:       get('f_labs'),
    dontmiss:   get('f_dontmiss'),
    diffdx:     get('f_diffdx'),
    mistake:    get('f_mistake'),
    tricks:     get('f_tricks'),
    recap:      get('f_recap'),
    img:        images[0] || '',
    images,
    voice:      voiceNotes[0] || '',
    voices:     voiceNotes,
    notes:      get('f_notes'),
    mcqs,
    createdAt:  existing ? existing.createdAt : Date.now(),
  };

  let previousEntry;
  if (wasEditing) {
    previousEntry = cases[editingIndex];
    cases[editingIndex] = obj;
  } else {
    cases.unshift(obj);
  }

  const ok = await persistCase(obj);

  if (ok) {
    showToast(wasEditing ? '✅ تم تحديث الحالة' : '✅ تم حفظ الحالة');
    if (!wasEditing) {
      gamAwardXp(gamRules.new_case, 'حالة جديدة بالـ Logbook');
      // A new case can be invisible if a specialty filter or search term (or
      // Favorites/Exam mode) from before is still active, making the screen
      // look empty even though the save succeeded. Reset to the full list so
      // the new case is guaranteed to show up right away.
      currentFilter = 'all';
      searchQuery = '';
      const searchInput = document.getElementById('consultantSearch');
      if (searchInput) searchInput.value = '';
      if (homeMode === 'favorites' || homeMode === 'exam') homeMode = 'study';
    }
    closeModal('createModal');
    showHome();
  } else {
    // Roll back the in-memory change so the UI doesn't show a case that isn't actually saved
    if (wasEditing) {
      cases[editingIndex] = previousEntry;
    } else {
      cases.shift();
    }
    alert('⚠️ ما قدر يحفظ الحالة! جرب تحدّث الصفحة وتعيد المحاولة، أو تأكد إن المتصفح مو بوضع التصفح الخفي (خزين البيانات ما يشتغل فيه).');
  }
}

function editCurrentCase() {
  closeModal('motModal1');
  openCreateModal(pendingCaseIndex);
}

function deleteCurrentCase() {
  const deletedIndex = pendingCaseIndex;
  const deletedCase = cases[deletedIndex];
  if (!deletedCase) return;
  cases.splice(deletedIndex, 1);
  persistDelete(deletedCase.id);
  showHome();
  showUndoToast('تم حذف الحالة', async () => {
    cases.splice(deletedIndex, 0, deletedCase);
    const ok = await persistCase(deletedCase);
    if (!ok) {
      alert('⚠️ ما قدر يرجّع الحالة.');
    }
    showHome();
  });
}

// ════════════════════════════════════════════════
//  STUDY NOTES
// ════════════════════════════════════════════════
let _notesSaveTimer = null;
function autoSaveStudyNotes() {
  clearTimeout(_notesSaveTimer);
  _notesSaveTimer = setTimeout(() => {
    const area = document.getElementById('studyNotesArea');
    if (!area || !area._notesKey) return;
    localStorage.setItem(area._notesKey, area.value);
    const ind = document.getElementById('notesSavedIndicator');
    if (ind) {
      ind.classList.add('show');
      setTimeout(() => ind.classList.remove('show'), 1800);
    }
  }, 600);
}

function readImageFiles(files, done) {
  const list = Array.from(files || []).filter(file => file.type && file.type.startsWith('image/'));
  if (!list.length) return;
  const results = [];
  let remaining = list.length;
  list.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      compressImageDataUrl(e.target.result, compressed => {
        results.push(compressed);
        remaining--;
        if (remaining === 0) done(results);
      });
    };
    reader.onerror = () => {
      remaining--;
      if (remaining === 0) done(results);
    };
    reader.readAsDataURL(file);
  });
}

// Resizes/re-encodes an image data URL (e.g. a full-resolution phone photo) down to a
// reasonable size before it gets stored as base64 in localStorage — full-size photos
// were blowing past the localStorage quota and silently breaking saves after 1-2 images.
function compressImageDataUrl(dataUrl, cb, maxDim = 1280, quality = 0.78) {
  const img = new Image();
  img.onload = () => {
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      cb(canvas.toDataURL('image/jpeg', quality));
    } catch (e) {
      cb(dataUrl); // fallback to original if canvas export fails for any reason
    }
  };
  img.onerror = () => cb(dataUrl);
  img.src = dataUrl;
}

function addStudyNoteImagesFromFiles(files) {
  const input = document.getElementById('studyNotesImageFile');
  readImageFiles(files, images => {
    const box = document.getElementById('studyNotesImages');
    if (!box || !box._imagesKey) return;
    box._images = [...(box._images || []), ...images];
    localStorage.setItem(box._imagesKey, JSON.stringify(box._images));
    renderStudyNoteImages();
    showToast('✅ تمت إضافة الصورة للملاحظات');
  });
  if (input) input.value = '';
}

function renderStudyNoteImages() {
  const box = document.getElementById('studyNotesImages');
  if (!box) return;
  const images = box._images || [];
  box.innerHTML = images.map((src, i) => `
    <div class="note-image-wrap">
      <img class="study-note-image" src="${src}" onclick="openLightbox('${src.replace(/'/g, "\\'")}')" alt="" />
      <button class="note-image-remove" onclick="removeStudyNoteImage(${i})">×</button>
    </div>
  `).join('');
}

function removeStudyNoteImage(i) {
  const box = document.getElementById('studyNotesImages');
  if (!box || !box._imagesKey) return;
  box._images.splice(i, 1);
  localStorage.setItem(box._imagesKey, JSON.stringify(box._images));
  renderStudyNoteImages();
}

function removeCurrentReviewed() {
  clearCaseReviewedByIdx(null, pendingCaseIndex);
}

// ════════════════════════════════════════════════
//  DUPLICATE CASE
// ════════════════════════════════════════════════
function duplicateCurrentCase() {
  const c = cases[pendingCaseIndex];
  if (!c) return;
  const copy = JSON.parse(JSON.stringify(c));
  copy.id = genId();
  copy.name = copy.name + ' (نسخة)';
  copy.createdAt = Date.now();
  cases.unshift(copy);
  persistCase(copy);
  showToast('📋 تم نسخ الحالة — ستجدها أول القائمة');
}

function base64EncodeUnicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64DecodeUnicode(str) {
  return decodeURIComponent(escape(atob(str)));
}

function shareCurrentCase() {
  const c = cases[pendingCaseIndex];
  if (!c) return;
  const fullPayload = {
    app: 'DrMonic Cases',
    type: 'single-case',
    exportedAt: new Date().toISOString(),
    case: c
  };
  const blob = new Blob([JSON.stringify(fullPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `drmonic-case-${(c.name || 'case').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 60)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  const compactCase = JSON.parse(JSON.stringify(c));
  delete compactCase.images;
  delete compactCase.img;
  delete compactCase.voices;
  delete compactCase.voice;
  const linkPayload = { app: 'DrMonic Cases', type: 'single-case-link', case: compactCase };
  const shareUrl = location.href.split('#')[0] + '#case=' + base64EncodeUnicode(JSON.stringify(linkPayload));
  if (navigator.clipboard && shareUrl.length < 120000) {
    navigator.clipboard.writeText(shareUrl).then(
      () => showToast('✅ تم تنزيل ملف الحالة ونسخ رابط مختصر'),
      () => showToast('✅ تم تنزيل ملف الحالة')
    );
  } else {
    showToast('✅ تم تنزيل ملف الحالة');
  }
}

function importSharedCaseFromHash() {
  if (!location.hash.startsWith('#case=')) return false;
  try {
    const payload = JSON.parse(base64DecodeUnicode(location.hash.slice(6)));
    const sharedCase = payload.case;
    if (!sharedCase || typeof sharedCase !== 'object') return false;
    const originalKey = sharedCase.createdAt?.toString();
    const existingIdx = originalKey ? cases.findIndex(c => c.createdAt?.toString() === originalKey) : -1;
    if (existingIdx >= 0) {
      renderCaseView(existingIdx);
      return true;
    }
    sharedCase.createdAt = sharedCase.createdAt || Date.now();
    if (!sharedCase.id) sharedCase.id = genId();
    cases.unshift(sharedCase);
    persistCase(sharedCase);
    history.replaceState(null, '', location.pathname + location.search);
    renderCaseView(0);
    showToast('✅ تم استيراد الحالة من الرابط');
    return true;
  } catch (err) {
    showToast('⚠️ رابط الحالة غير صالح');
    return false;
  }
}

// ════════════════════════════════════════════════
//  PRINT / PDF
// ════════════════════════════════════════════════
function expandAllCaseSections() {
  document.querySelectorAll('.sec-card').forEach(card => {
    card.classList.add('open');
    const body = card.querySelector('.sec-card-body');
    if (body) body.style.maxHeight = 'none';
  });
}

function printCurrentCase() {
  // Expand all sections before printing
  expandAllCaseSections();
  window.print();
}

// ════════════════════════════════════════════════
//  EXPORT AS IMAGE (html2canvas via CDN)
// ════════════════════════════════════════════════
function exportCaseAsImage() {
  const c = cases[pendingCaseIndex];
  if (!c) return;
  showToast('⏳ جاري تحضير الصورة...');

  // Dynamically load html2canvas if not loaded
  const load = () => new Promise(res => {
    if (window.html2canvas) { res(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = res;
    document.head.appendChild(s);
  });

  load().then(() => {
    // Expand all sections
    expandAllCaseSections();
    const el = document.getElementById('caseViewContent');
    const hero = document.querySelector('.cv-hero');
    // Wrap hero + content in a temp container
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      background: var(--navy, #0A1628); padding: 24px; border-radius: 16px;
      font-family: Tajawal, sans-serif; direction: rtl;
      max-width: 900px; position: absolute; left: -9999px; top: 0;
    `;
    wrapper.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(0,212,170,0.2)">
        <div style="font-size:28px;background:linear-gradient(135deg,#00D4AA,#3B82F6);width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;">🏥</div>
        <div style="color:#fff;font-size:1.1rem;font-weight:800">Dr.<span style="color:#00D4AA">Monic</span> Cases</div>
      </div>
      ${el.outerHTML}
    `;
    document.body.appendChild(wrapper);
    const bgColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#0A1628' : '#F0F4FF';
    html2canvas(wrapper, {
      backgroundColor: bgColor,
      scale: 2,
      useCORS: true,
      logging: false,
    }).then(canvas => {
      document.body.removeChild(wrapper);
      const link = document.createElement('a');
      link.download = `case-${c.name || 'drmonic'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('✅ تم تحميل الصورة');
    }).catch(() => {
      document.body.removeChild(wrapper);
      showToast('⚠️ فشل التصدير، جرب الطباعة');
    });
  });
}

function copySection(btn, e) {
  e.stopPropagation();
  const card = btn.closest('.sec-card');
  const text = card.dataset.copy || '';
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    btn.textContent = '✓';
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '📋'; }, 1600);
  });
}

function openLightbox(src) {
  const box = document.getElementById('imgLightbox');
  if (box && !document.getElementById('imgLightboxImg')) {
    box.innerHTML = '<img id="imgLightboxImg" src="" alt="" />';
  }
  document.getElementById('imgLightboxImg').src = src;
  document.getElementById('imgLightbox').classList.add('open');
}
function closeLightbox() {
  const box = document.getElementById('imgLightbox');
  box.classList.remove('open');
  box.innerHTML = '<img id="imgLightboxImg" src="" alt="" />';
}

// ════════════════════════════════════════════════
//  MODAL HELPERS
// ════════════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
// Close on overlay click — EXCLUDES createModal so typed case data is never
// lost by an accidental click on the dark backdrop. Only an explicit
// "إلغاء" / "✕" / save action closes the data-entry form.
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay
        && overlay.id !== 'motModal1'
        && overlay.id !== 'motModal2'
        && overlay.id !== 'createModal') {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});

// ════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════
document.addEventListener('paste', e => {
  const files = Array.from(e.clipboardData?.items || [])
    .filter(item => item.type && item.type.startsWith('image/'))
    .map(item => item.getAsFile())
    .filter(Boolean);
  if (!files.length) return;

  const createOpen = document.getElementById('createModal')?.classList.contains('open');
  if (createOpen) {
    e.preventDefault();
    readImageFiles(files, images => {
      caseImages.push(...images);
      renderImageFields();
      showToast('✅ تم لصق الصورة للحالة');
    });
    return;
  }

  const studyImagesBox = document.getElementById('studyNotesImages');
  if (document.getElementById('caseView')?.classList.contains('active') && studyImagesBox) {
    e.preventDefault();
    addStudyNoteImagesFromFiles(files);
    return;
  }

  if (document.getElementById('notesView')?.classList.contains('active')) {
    e.preventDefault();
    let targetId = activeNoteId || studyNotes[0]?.id;
    if (!targetId) {
      addNote();
      targetId = studyNotes[0]?.id;
    }
    if (targetId) addNoteImagesFromFiles(targetId, files);
  }
});

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// Attempts to persist the cases array to localStorage.
// Returns true on success, false if the browser storage quota was exceeded
// (this happens most often when a case has large embedded images/voice notes).

let undoToastTimer = null;
function showUndoToast(msg, undoFn) {
  const t = document.getElementById('toast');
  clearTimeout(undoToastTimer);
  t.innerHTML = `<span class="undo-toast"><span>${esc(msg)}</span><button type="button" id="undoToastBtn">Undo</button></span>`;
  t.classList.add('show');
  document.getElementById('undoToastBtn').onclick = () => {
    undoFn();
    t.classList.remove('show');
    showToast('تم التراجع');
  };
  undoToastTimer = setTimeout(() => t.classList.remove('show'), 6500);
}

// ════════════════════════════════════════════════
//  STUDY NOTES (standalone cards)
// ════════════════════════════════════════════════
let studyNotes = JSON.parse(localStorage.getItem('drmonic_studynotes') || '[]');

// One-time migration: older versions stored note images as full base64 strings directly
// inside drmonic_studynotes, which is what was blowing past the localStorage quota even
// after new images moved to IndexedDB. Move any leftover legacy images out too.
(async function migrateLegacyNoteImagesToIDB() {
  let changed = false;
  for (const note of studyNotes) {
    if (!Array.isArray(note.images) || !note.images.length) continue;
    for (let i = 0; i < note.images.length; i++) {
      const src = note.images[i];
      if (typeof src === 'string' && src.startsWith('data:')) {
        try {
          const imgId = 'nimg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
          await idbPutNoteImage(imgId, dataUrlToBlob(src));
          note.images[i] = imgId;
          changed = true;
        } catch (e) { /* leave as-is if it fails, better than losing the image */ }
      }
    }
  }
  if (changed) {
    try { localStorage.setItem('drmonic_studynotes', JSON.stringify(studyNotes)); } catch (e) { /* ignore */ }
    if (document.getElementById('notesGrid')) renderNotes();
  }
})();

const NOTE_ICONS = { amber:'✎', teal:'🧪', blue:'📘', purple:'🧬', red:'⚠️', green:'🌿' };

function saveStudyNotes() {
  try {
    localStorage.setItem('drmonic_studynotes', JSON.stringify(studyNotes));
    return true;
  } catch (e) {
    showToast('⚠️ تخطينا مساحة التخزين المتاحة مؤقتًا — جرّب إعادة تحميل الصفحة (F5) ثم أعد المحاولة، الصور الآن تترحّل تلقائيًا لمساحة تخزين أوسع');
    return false;
  }
}

function showNotesView() {
  hideAllViews();
  document.getElementById('notesView').classList.add('active');
  renderNotes();
}

function addNote() {
  const note = {
    id: Date.now(),
    title: '',
    content: '',
    images: [],
    color: 'amber',
    tags: [], // تصنيفات الملاحظة — تخصصات جاهزة و/أو كلمات حرة يكتبها المستخدم؛ فاضي = "عام"
    createdAt: new Date().toLocaleDateString('ar-EG')
  };
  studyNotes.unshift(note);
  saveStudyNotes();
  renderNotes();
  // focus the new card's title
  setTimeout(() => {
    const input = document.querySelector('.note-card-title-input');
    if (input) input.focus();
  }, 50);
}

function toggleNoteFlip(cardEl) {
  const flipping = !cardEl.classList.contains('flipped');
  cardEl.classList.toggle('flipped');
  if (flipping) {
    const back = cardEl.querySelector('.review-flip-face.back');
    const h = (back?.scrollHeight || 0) + 44;
    cardEl.style.height = Math.max(h, 170) + 'px';
  } else {
    cardEl.style.height = '';
  }
}

function autoGrowTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight + 2) + 'px';
}

function openNoteAutoFillModal() {
  const ta = document.getElementById('noteAutoFillInput');
  if (ta) ta.value = '';
  openModal('noteAutoFillModal');
  setTimeout(() => ta?.focus(), 100);
}

// Strips paste artifacts that make pasted text look broken/highlighted:
// markdown blockquote markers ("> "), and **bold** wrapping that spans a long
// or multi-line chunk (which should never have been wrapped in the first
// place — ** is meant for a short key term, not a whole paragraph).
function cleanNoteContent(text) {
  if (!text) return '';
  let cleaned = text
    .split('\n')
    .map(l => l.replace(/^\s*>+\s?/, ''))
    .join('\n')
    .trim();
  cleaned = cleaned.replace(/\*\*([\s\S]*?)\*\*/g, (m, inner) => (inner.includes('\n') || inner.trim().length > 50) ? inner : m);
  // Strip stray LaTeX-style $...$ wrapping some AI models add around technical
  // terms/abbreviations (e.g. "($Vaginitis$)") — this app never renders math,
  // so unwrap it and keep the plain text underneath.
  cleaned = cleaned.replace(/\$([^$\n]{1,120})\$/g, '$1');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

function parseTrickPasteText(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  // Only treat a 💡 line as a "why" heading if it actually reads like one
  // (e.g. "💡 ليش هيك وكيف بصير؟") — not an incidental 💡 used as a plain
  // bullet marker inside regular content (e.g. "💡 أنواعه الشهيرة...").
  const whyHeadingRe = /💡.{0,25}(ليش|لماذا|كيف|why|how)/i;
  let idxT = -1, idxW = -1;
  lines.forEach((l, i) => {
    if (idxT === -1 && l.includes('🚨')) idxT = i;
    if (idxW === -1 && whyHeadingRe.test(l)) idxW = i;
  });

  // No 🚨/💡 markers at all: treat the first non-empty line as the title
  // and everything after it as the content, so plain unlabeled blocks still split cleanly.
  if (idxT === -1 && idxW === -1) {
    const nonEmpty = lines.map((l, i) => ({ l: l.trim(), i })).filter(x => x.l);
    if (!nonEmpty.length) return { title: '', content: '' };
    const title = nonEmpty[0].l;
    const content = cleanNoteContent(lines.slice(nonEmpty[0].i + 1).join('\n'));
    return { title, content };
  }

  const titleEnd = idxT !== -1 ? idxT : idxW;
  const title = lines.slice(0, titleEnd).map(l => l.trim()).filter(Boolean).join(' ').trim();

  // Merge the trick + why sections into one plain content block, stripping
  // only the heading emoji/label itself (not the actual content after it).
  const parts = [];
  if (idxT !== -1) {
    const trickEnd = idxW !== -1 ? idxW : lines.length;
    const block = lines.slice(idxT, trickEnd);
    block[0] = block[0].replace(/^[^\n]*?🚨[^:：]*[:：]?\s*/, '').trim();
    parts.push(block.join('\n').trim());
  }
  if (idxW !== -1) {
    const block = lines.slice(idxW);
    block[0] = block[0].replace(/^[^\n]*?💡[^:：؟?]*[:：؟?]?\s*/, '').trim();
    parts.push(block.join('\n').trim());
  }
  const content = cleanNoteContent(parts.filter(Boolean).join('\n\n'));

  return { title, content };
}

// Local smart splitter — no AI/API call needed, used only as a fallback when no
// AI key is configured or the AI call fails. Detects the separator style used in
// the pasted text and splits into per-card chunks accordingly, trying several
// strategies in order of confidence:
//  0) Markdown headers: "### Title" (or any # level) — most reliable when present
//  1) Numbered markers at line-start: "1)", "1.", "1-", "١)" (Arabic-Indic digits)
//  2) Repeated 🚨 markers with no headers/numbering — splits right before each
//     🚨 line, backing up to include any header/title line directly above it
//  3) Blank-line-separated blocks (two or more consecutive newlines)
//  4) Fallback: the whole text as a single card
function heuristicSplitTrickPasteText(raw) {
  const text = raw.replace(/\r/g, '');
  const lines = text.split('\n');

  const headerRe = /^\s*#{1,6}\s+\S/;
  const numberedRe = /^\s*(?:\d+|[\u0660-\u0669]+)\s*[\)\.\-\u06D4]\s*\S/;
  const isHeader = l => headerRe.test(l);
  const startsNewItem = l => numberedRe.test(l);

  const splitByPredicate = (predicate) => {
    const chunks = [];
    let cur = [];
    lines.forEach(l => {
      if (predicate(l) && cur.length) { chunks.push(cur.join('\n')); cur = [l]; }
      else cur.push(l);
    });
    if (cur.length) chunks.push(cur.join('\n'));
    return chunks;
  };

  let chunks = [];

  // Strategy 0: markdown headers
  const headerCount = lines.filter(isHeader).length;
  if (headerCount >= 2) {
    chunks = splitByPredicate(isHeader);
  }

  // Strategy 1: explicit numbering
  if (chunks.length < 2) {
    const numberedCount = lines.filter(startsNewItem).length;
    if (numberedCount >= 2) chunks = splitByPredicate(startsNewItem);
  }

  // Strategy 2: repeated 🚨 markers with no headers/numbering — split right
  // before each 🚨 line, but back up to the start of any short header/title
  // line(s) directly above it so the title stays with its own card.
  if (chunks.length < 2) {
    const trickLineIdx = lines.map((l, i) => l.includes('🚨') ? i : -1).filter(i => i !== -1);
    if (trickLineIdx.length >= 2) {
      const boundaries = trickLineIdx.map((idx, k) => {
        if (k === 0) return 0;
        let start = idx;
        // walk upward past blank lines and one short title-ish line
        let j = idx - 1;
        while (j >= 0 && lines[j].trim() === '') j--;
        if (j >= 0 && lines[j].trim().length > 0 && lines[j].trim().length < 120 && !lines[j].includes('🚨')) {
          start = j;
        }
        return start;
      });
      chunks = [];
      boundaries.forEach((start, k) => {
        const end = k + 1 < boundaries.length ? boundaries[k + 1] : lines.length;
        chunks.push(lines.slice(start, end).join('\n'));
      });
    }
  }

  // Strategy 3: blank-line-separated blocks (two+ items after trimming empties)
  if (chunks.length < 2) {
    const blockRe = /\n\s*\n+/;
    const blankBlocks = text.split(blockRe).map(b => b.trim()).filter(Boolean);
    if (blankBlocks.length >= 2) chunks = blankBlocks;
  }

  if (!chunks.length) chunks = [text];

  return chunks.map(parseTrickPasteText).filter(c => c.title || c.content);
}

// AI-powered split — reuses the same Gemini key/model already configured for the
// smart-fill feature. Produces one plain "content" block per card (no separate
// trick/why fields — the site shows a single plain box, not a labeled template).
async function llmSplitTricksText(raw) {
  const apiKey = aiAssistantGetApiKey();
  if (!apiKey) return null;
  const schema = {
    type: 'object',
    properties: {
      cards: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' }
          },
          required: ['title', 'content']
        }
      }
    },
    required: ['cards']
  };
  const prompt = `النص التالي فيه بطاقة دراسية طبية واحدة أو أكتر، ممكن تكون مرقّمة (1) 2) 3)...) أو تحت عناوين ### أو مفصولة بأسطر فاضية أو معلّمة بإيموجي 🚨/💡 أو أي شكل تاني.

مهمتك: (1) تقسيم النص لعناصر منفصلة كل عنصر بياخد title / content، و(2) تنظيف كل عنصر عشان يطلع محتوى نظيف بحقل content — بدون أي تصنيف أو عناوين قسم جواته (يعني لا "🚨 التريك اللي لازم تحفظه:" ولا "💡 ليش هيك وكيف بصير؟" ولا "💊 العلاج" ولا أي عنوان قسم مشابه — احذف سطر العنوان هاد بس، واحتفظ بكل المحتوى اللي بعده بالضبط متل ما هو).

قاعدة النسخ الحرفي صارمة جداً — نفس قاعدة "كوبي-بيست حرفي" المستخدمة بميزة الحالات: المصطلحات والكلمات والأرقام والنسب والإيموجيات (غير عناوين الأقسام المذكورة فوق) لازم تبقى بالضبط متل ما هي بالنص الأصلي، حرفياً بدون أي تغيير. ممنوع تعيد الصياغة، تلخص، تختصر، تترجم، تدمج عنصرين ببعض، أو تفصّل عنصر واحد لعنصرين.

تنظيف شكلي إلزامي بحقل content — هاي أهم نقطة وممنوع تخالفها:
- **حافظ على بنية النص الأصلي بالكامل**: فقرات، نقاط مرقّمة (1. 2. 3.)، أو bullet points (* أو -) — كل نقطة أو فقرة تضل بسطرها الخاص (\n) متل ما كانت بالمصدر، تمامًا متل ما بتشوفهم بحقل title. ممنوع نهائيًا تدمج كل شي بفقرة وحدة متواصلة أو تشيل فواصل الأسطر — هاد أكبر غلطة ممكن تصير.
- ممنوع نهائيًا استخدام رمز $ أو أي صيغة LaTeX/Math حول أي كلمة أو مصطلح إنجليزي أو اختصار (متل $Vaginitis$) — هالموقع ما بيدعم أي رياضيات، خلي أي مصطلح إنجليزي بقوسين عاديين بس ( ) بدون $ أبداً.
- احذف أي رمز ">" أو "> " بداية أي سطر (بقايا تنسيق ماركداون / اقتباس)، خلي السطر عادي.
- ممنوع تحط ** ** (bold) حول فقرة كاملة أو جملة طويلة أو أكتر من سطر — استخدم ** فقط حول كلمة أو مصطلح قصير مهم جداً (كحد أقصى 3-4 كلمات)، أو لا تستخدمها إطلاقاً إذا مش متأكد.
- ممنوع تكرار عنوان البطاقة أو عنوان القسم (🚨/💡/💊) جوا نص الـ content نفسه.
- إذا واجهت سطر مقطوع بمنتصف كلمة أو مسافات زايدة أو تكرار أسطر فاضية، صلحها بشكل بسيط وواضح فقط.

- title: العنوان (بعد إزالة رمز # إذا كان عنوان ماركداون، وبدون رقم الترقيم التسلسلي إذا كان مجرد رقم متتالي، بس احتفظ بباقي الإيموجيات والنص كما هو حرفياً).

كل عنصر بالمصدر لازم يطلع عنصر واحد بالمخرجات (لا تدمج عنصرين، ولا تفصّل عنصر واحد لعنصرين).

النص:
${raw}

رجّع JSON فقط مطابق للـ schema، بدون أي شرح أو نص خارج الـ JSON.`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
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
    const parsed = text ? JSON.parse(text) : null;
    const cards = Array.isArray(parsed?.cards) ? parsed.cards : null;
    return cards ? cards.map(c => ({ title: c.title || '', content: cleanNoteContent(c.content || '') })) : null;
  } catch (err) {
    console.warn('AI trick split failed, falling back to local splitter:', err);
    return null;
  }
}

async function applyNoteAutoFill() {
  const raw = document.getElementById('noteAutoFillInput')?.value || '';
  const status = document.getElementById('noteAutoFillStatus');
  const btn = document.getElementById('noteAutoFillRunBtn');
  if (!raw.trim()) { showToast('⚠️ الصق النص أولاً'); return; }
  btn.disabled = true;
  if (status) status.textContent = '⏳ عم يحلل ويفصّل النص...';
  try {
    let items = await llmSplitTricksText(raw);
    let usedLlm = !!items && items.length > 0;
    if (!items || !items.length) items = heuristicSplitTrickPasteText(raw);
    if (!items.length) { showToast('⚠️ ما قدرت أفصّل أي بطاقة من النص'); return; }

    items.forEach(({ title, content }) => {
      addNote();
      const note = studyNotes[0];
      if (note) { note.title = title || ''; note.content = content || ''; }
    });
    saveStudyNotes();
    renderNotes();
    closeModal('noteAutoFillModal');
    document.getElementById('noteAutoFillInput').value = '';
    if (status) status.textContent = '';
    showToast(usedLlm
      ? `✅ اتفصّلت ${items.length} بطاقة عبر AI`
      : `✅ اتفصّلت ${items.length} بطاقة محلياً (بدون مفتاح Gemini أو تعذّر الاتصال)`);
  } catch (err) {
    console.error('applyNoteAutoFill failed', err);
    if (status) status.textContent = '⚠️ صار خطأ أثناء التحليل';
    showToast('⚠️ تعذّرت التعبئة التلقائية');
  } finally {
    btn.disabled = false;
  }
}

function deleteNote(id) {
  const deletedIndex = studyNotes.findIndex(n => n.id === id);
  if (deletedIndex < 0) return;
  const deletedNote = studyNotes[deletedIndex];
  studyNotes.splice(deletedIndex, 1);
  saveStudyNotes();
  renderNotes();
  showUndoToast('تم حذف البطاقة', () => {
    studyNotes.splice(deletedIndex, 0, deletedNote);
    saveStudyNotes();
    renderNotes();
  });
}

function updateNoteField(id, field, value) {
  const note = studyNotes.find(n => n.id === id);
  if (note) { note[field] = value; saveStudyNotes(); }
}

// Returns the note's display/edit text as one plain block. Prefers the new
// unified `content` field; falls back to combining legacy trick/why/body
// fields (for notes created before the single-box redesign) so old notes
// keep showing correctly without needing a data migration.
function noteContentText(n) {
  if (n.content != null && n.content !== '') return n.content;
  return [n.trick, n.why, n.body].filter(Boolean).join('\n\n').trim();
}

// خيارات تصنيف/تخصص الملاحظة — تُستخدم لكل من محدد التخصص بالبطاقة وشريط الفلترة.
// ملاحظة ممكن يكون إلها أكثر من تصنيف (مثلاً "باطني" + "امتحان ميد" اللي المستخدم كتبها بنفسه).
// n.tags فاضية = تُعامل كـ "عام" بالعرض والفلترة، بدون ما نخزن 'general' فعلياً بكل ملاحظة.
const NOTE_SPECIALTIES = [
  { key: 'er_anesth', label: 'طوارئ وتخدير' },
  { key: 'medicine',  label: 'باطني' },
  { key: 'peds',      label: 'أطفال' },
  { key: 'surgery',   label: 'جراحة' },
  { key: 'obgyn',     label: 'نسائية وتوليد' },
  { key: 'forensic',  label: 'شرعي وسموم' },
  { key: 'psych',     label: 'نفسي' },
  { key: 'radiology', label: 'أشعة' },
  { key: 'internal_diseases', label: 'أمراض باطنية' },
  { key: 'neuro',     label: 'أمراض عصبية' },
  { key: 'neurosurg', label: 'جراحة أعصاب' },
  { key: 'family',    label: 'طب الأسرة' }
];
let noteActiveSpecialtyFilter = 'all';

function noteSpecialtyLabel(key) {
  const preset = NOTE_SPECIALTIES.find(s => s.key === key);
  return preset ? preset.label : key; // custom free-text tags render as typed
}

function noteTagsOf(n) {
  return (n.tags && n.tags.length) ? n.tags : [];
}

// كل التصنيفات المستخدمة فعلياً عبر كل الملاحظات (جاهزة + حرة)، لبناء شريط الفلترة ديناميكياً
function noteAllUsedTags() {
  const counts = {};
  let generalCount = 0;
  studyNotes.forEach(n => {
    const tags = noteTagsOf(n);
    if (!tags.length) { generalCount++; return; }
    tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  });
  return { counts, generalCount };
}

// شريط فلترة التخصصات فوق شبكة الملاحظات — ضغطة وحدة تحول العرض لتخصص محدد
function renderNoteSpecialtyFilterBar() {
  const bar = document.getElementById('notesSpecialtyFilterBar');
  if (!bar) return;
  const { counts, generalCount } = noteAllUsedTags();
  const allChip = `<span class="note-spec-chip ${noteActiveSpecialtyFilter === 'all' ? 'active' : ''}" onclick="setNoteSpecialtyFilter('all')">الكل (${studyNotes.length})</span>`;
  const generalChip = generalCount ? `<span class="note-spec-chip ${noteActiveSpecialtyFilter === 'general' ? 'active' : ''}" onclick="setNoteSpecialtyFilter('general')">عام (${generalCount})</span>` : '';
  // rank tags: preset specialties first (in defined order), then custom free-text tags, both only if actually used
  const presetChips = NOTE_SPECIALTIES
    .filter(s => counts[s.key])
    .map(s => `<span class="note-spec-chip ${noteActiveSpecialtyFilter === s.key ? 'active' : ''}" onclick="setNoteSpecialtyFilter('${esc(s.key)}')">${esc(s.label)} (${counts[s.key]})</span>`)
    .join('');
  const customKeys = Object.keys(counts).filter(k => !NOTE_SPECIALTIES.some(s => s.key === k));
  const customChips = customKeys
    .map(k => `<span class="note-spec-chip ${noteActiveSpecialtyFilter === k ? 'active' : ''}" onclick="setNoteSpecialtyFilter('${esc(k).replace(/'/g,"\\'")}')">${esc(k)} (${counts[k]})</span>`)
    .join('');
  bar.innerHTML = allChip + generalChip + presetChips + customChips;
}

function setNoteSpecialtyFilter(key) {
  noteActiveSpecialtyFilter = key;
  renderNotes();
}

// ── محرر تصنيفات البطاقة: شرائح قابلة للحذف + إدخال حر لإضافة تصنيف مخصص ──
function noteTagEditorHtml(n) {
  const tags = noteTagsOf(n);
  const chips = tags.map(t => `
    <span class="note-tag-chip">
      ${esc(noteSpecialtyLabel(t))}
      <button class="note-tag-remove" onclick="removeNoteTag(${n.id}, '${esc(t).replace(/'/g,"\\'")}')">×</button>
    </span>`).join('');
  return `
    <div class="note-tags-editor">
      <div class="note-tags-current">${chips}</div>
      <div class="note-tags-add-row">
        <select class="note-specialty-select" onchange="if(this.value){addNoteTag(${n.id}, this.value); this.value='';}" title="إضافة تصنيف جاهز">
          <option value="">+ تخصص جاهز</option>
          ${NOTE_SPECIALTIES.filter(s => !tags.includes(s.key)).map(s => `<option value="${s.key}">${esc(s.label)}</option>`).join('')}
        </select>
        <input type="text" class="note-tag-input" placeholder="اكتب تصنيف... (مثلاً: امتحان ميد)"
          onkeydown="if(event.key==='Enter'){addNoteTag(${n.id}, this.value.trim()); this.value=''; event.preventDefault();}" />
      </div>
    </div>`;
}

function addNoteTag(id, tag) {
  tag = (tag || '').trim();
  if (!tag) return;
  const note = studyNotes.find(n => n.id === id);
  if (!note) return;
  if (!note.tags) note.tags = [];
  // avoid case-insensitive duplicates (covers both preset keys and free text)
  const exists = note.tags.some(t => t.toLowerCase() === tag.toLowerCase());
  if (!exists) note.tags.push(tag);
  saveStudyNotes();
  renderNotes();
}

function removeNoteTag(id, tag) {
  const note = studyNotes.find(n => n.id === id);
  if (!note || !note.tags) return;
  note.tags = note.tags.filter(t => t !== tag);
  saveStudyNotes();
  renderNotes();
}

function setNoteColor(id, color) {
  const note = studyNotes.find(n => n.id === id);
  if (!note) return;
  note.color = color;
  saveStudyNotes();
  // update card in place
  const card = document.querySelector(`.note-card[data-id="${id}"]`);
  if (card) {
    card.dataset.color = color;
    card.querySelector('.note-card-icon').textContent = NOTE_ICONS[color] || '✎';
    card.querySelectorAll('.ncp-dot').forEach(d => d.classList.toggle('active', d.dataset.c === color));
  }
}

// تحديث تخصص الملاحظة — تُستبدل بـ addNoteTag/removeNoteTag أعلاه (نظام متعدد التصنيفات)

function dataUrlToBlob(dataUrl) {
  const [header, b64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function addNoteImagesFromFiles(id, files) {
  readImageFiles(files, async images => {
    const note = studyNotes.find(n => n.id === id);
    if (!note) return;
    if (!Array.isArray(note.images)) note.images = [];
    for (const dataUrl of images) {
      const imgId = 'nimg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      try {
        await idbPutNoteImage(imgId, dataUrlToBlob(dataUrl));
        note.images.push(imgId);
      } catch (e) {
        console.error('note image store failed', e);
      }
    }
    const ok = saveStudyNotes();
    renderNotes();
    activeNoteId = id;
    if (ok) showToast('✅ تمت إضافة الصورة للملاحظة');
  });
  const input = document.getElementById('noteImageFile_' + id);
  if (input) input.value = '';
}

function removeNoteImage(id, imgIndex) {
  const note = studyNotes.find(n => n.id === id);
  if (!note || !Array.isArray(note.images)) return;
  const [removedId] = note.images.splice(imgIndex, 1);
  if (removedId && typeof removedId === 'string' && removedId.startsWith('nimg_')) {
    idbDeleteNoteImage(removedId).catch(() => {});
  }
  saveStudyNotes();
  renderNotes();
  activeNoteId = id;
}

let notesDisplayMode = localStorage.getItem('drmonic_notes_mode') || 'edit';

function toggleNotesDisplayMode() {
  notesDisplayMode = notesDisplayMode === 'edit' ? 'flashcard' : 'edit';
  localStorage.setItem('drmonic_notes_mode', notesDisplayMode);
  const btn = document.getElementById('notesModeToggleBtn');
  if (btn) btn.textContent = notesDisplayMode === 'edit' ? '🎴 عرض كفلاش كارد' : '✎ عرض للتعديل';
  renderNotes();
}

function noteImageThumbHtml(src) {
  if (typeof src === 'string' && src.startsWith('data:')) {
    return `<img class="note-image-thumb" src="${src}" onclick="event.stopPropagation();openLightbox('${src.replace(/'/g,"\\'")}')" alt="" />`;
  }
  return `<img class="note-image-thumb" data-image-id="${src}" onclick="event.stopPropagation();openLightbox(this.src)" alt="" />`;
}

function hydrateNoteVideos(scopeEl) {
  const root = scopeEl || document;
  root.querySelectorAll('video.note-video[data-video-id]').forEach(async video => {
    const id = video.dataset.videoId;
    if (!id || video.src) return;
    try {
      const blob = await idbGetNoteVideo(id);
      if (blob) video.src = URL.createObjectURL(blob);
    } catch (e) { /* ignore */ }
  });
  root.querySelectorAll('img.note-image-thumb[data-image-id]').forEach(async img => {
    const id = img.dataset.imageId;
    if (!id || img.src) return;
    try {
      const blob = await idbGetNoteImage(id);
      if (blob) img.src = URL.createObjectURL(blob);
    } catch (e) { /* ignore */ }
  });
}

function renderNotes() {
  const grid = document.getElementById('notesGrid');
  const countEl = document.getElementById('notesCount');
  const q = (document.getElementById('notesSearch')?.value || '').trim().toLowerCase();
  let filtered = q
    ? studyNotes.filter(n => (n.title + noteContentText(n)).toLowerCase().includes(q))
    : studyNotes;
  if (noteActiveSpecialtyFilter !== 'all') {
    filtered = noteActiveSpecialtyFilter === 'general'
      ? filtered.filter(n => !noteTagsOf(n).length)
      : filtered.filter(n => noteTagsOf(n).includes(noteActiveSpecialtyFilter));
  }

  if (countEl) countEl.textContent = `${filtered.length} بطاقة`;
  renderNoteSpecialtyFilterBar();
  updateNoteBulkUI();
  initNoteDragSelect();

  const btn = document.getElementById('notesModeToggleBtn');
  if (btn) btn.textContent = notesDisplayMode === 'edit' ? '🎴 عرض كفلاش كارد' : '✎ عرض للتعديل';
  grid.classList.toggle('notes-grid-flashcard', notesDisplayMode === 'flashcard');
  grid.classList.toggle('notes-bulk-active', noteBulkMode);

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="notes-empty">
        <div class="icon">✎</div>
        <h3>${q ? 'لا توجد نتائج' : 'لا توجد بطاقات بعد'}</h3>
        <p>${q ? 'جرب كلمة أخرى' : 'اضغط "بطاقة جديدة" لإضافة أول ملاحظة'}</p>
      </div>`;
    return;
  }

  if (notesDisplayMode === 'flashcard') {
    grid.innerHTML = filtered.map(n => `
      <div class="review-flip-card note-flip-card ${n.reviewed ? 'is-reviewed' : ''} ${selectedNoteIds.has(n.id) ? 'is-selected' : ''}" data-id="${n.id}" data-color="${n.color || 'amber'}" tabindex="0" onclick="handleNoteCardClick(${n.id}, event)">
        ${noteBulkMode ? `<div class="note-select-check ${selectedNoteIds.has(n.id) ? 'checked' : ''}">${selectedNoteIds.has(n.id) ? '✓' : ''}</div>` : `<button class="note-reviewed-btn ${n.reviewed ? 'active' : ''}" title="${n.reviewed ? 'تمت المراجعة' : 'علّم كمراجَعة'}" onclick="toggleNoteReviewed(${n.id}, event)">${n.reviewed ? '✅' : '⬜'}</button>`}
        <div class="review-flip-inner">
          <div class="review-flip-face front">
            <div class="note-flip-icon">${NOTE_ICONS[n.color] || '✎'}</div>
            ${noteTagsOf(n).length ? `<div class="note-spec-badges">${noteTagsOf(n).map(t => `<span class="note-spec-badge">${esc(noteSpecialtyLabel(t))}</span>`).join('')}</div>` : ''}
            <div class="review-flip-title">${esc(n.title || 'بطاقة بدون عنوان')}</div>
            <div class="review-flip-hint">${noteBulkMode ? 'اضغط للتحديد' : 'اضغط للتكبير ⤢'}</div>
          </div>
        </div>
      </div>`).join('');
    hydrateNoteVideos(grid);
    return;
  }

  grid.innerHTML = filtered.map(n => `
    <div class="note-card ${selectedNoteIds.has(n.id) ? 'is-selected' : ''}" data-id="${n.id}" data-color="${n.color || 'amber'}">
      ${noteBulkMode ? `<div class="note-select-check ${selectedNoteIds.has(n.id) ? 'checked' : ''}">${selectedNoteIds.has(n.id) ? '✓' : ''}</div>` : ''}
      <div class="note-card-top">
        <div class="note-card-icon">${NOTE_ICONS[n.color] || '✎'}</div>
        <input class="note-card-title-input" placeholder="عنوان البطاقة..."
          value="${(n.title || '').replace(/"/g,'&quot;')}"
          onfocus="activeNoteId=${n.id}"
          oninput="updateNoteField(${n.id},'title',this.value)" ${noteBulkMode ? 'disabled' : ''} />
      </div>
      <div class="note-content-box">
        <textarea class="note-content-input" rows="1"
          placeholder="اكتب ملاحظتك هنا..."
          onfocus="activeNoteId=${n.id}"
          oninput="updateNoteField(${n.id},'content',this.value);autoGrowTextarea(this)" ${noteBulkMode ? 'disabled' : ''}>${noteContentText(n)}</textarea>
      </div>
      <div class="note-images">
        ${(n.images || []).map((src, i) => `
          <div class="note-image-wrap">
            ${noteImageThumbHtml(src)}
            <button class="note-image-remove" onclick="removeNoteImage(${n.id},${i})">×</button>
          </div>`).join('')}
      </div>
      ${n.videoId ? `
      <div class="note-video-wrap">
        <video class="note-video" data-video-id="${n.videoId}" controls></video>
        <button class="note-image-remove" onclick="removeNoteVideo(${n.id})">×</button>
      </div>` : ''}
      ${n.youtubeId ? `
      <div class="note-video-wrap">
        <iframe class="note-youtube-embed" src="https://www.youtube.com/embed/${n.youtubeId}?rel=0" title="YouTube" allowfullscreen></iframe>
        <a class="note-youtube-fallback" href="https://www.youtube.com/watch?v=${n.youtubeId}" target="_blank" rel="noopener">▶️ إذا ما اشتغل الفيديو هون، افتحه على يوتيوب</a>
        <button class="note-image-remove" onclick="removeNoteYoutubeLink(${n.id})">×</button>
      </div>` : ''}
      ${n.driveFileId ? `
      <div class="note-video-wrap">
        <iframe class="note-youtube-embed" src="https://drive.google.com/file/d/${n.driveFileId}/preview" title="Google Drive" allowfullscreen></iframe>
        <button class="note-image-remove" onclick="removeNoteYoutubeLink(${n.id})">×</button>
      </div>` : ''}
      <div class="note-tags-row">${noteTagEditorHtml(n)}</div>
      <div class="note-card-footer">
        <div class="note-color-picker">
          ${['amber','teal','blue','purple','red','green'].map(c =>
            `<div class="ncp-dot ${n.color===c?'active':''}" data-c="${c}" onclick="setNoteColor(${n.id},'${c}')" title="${c}"></div>`
          ).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="note-card-date">${n.createdAt || ''}</span>
          <input type="file" id="noteImageFile_${n.id}" accept="image/*" multiple style="display:none;" onchange="addNoteImagesFromFiles(${n.id},this.files)" />
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;" onclick="activeNoteId=${n.id};document.getElementById('noteImageFile_${n.id}').click()">📎</button>
          <input type="file" id="noteVideoFile_${n.id}" accept="video/*" style="display:none;" onchange="addNoteVideoFromFile(${n.id},this.files)" />
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;" title="إضافة فيديو" onclick="activeNoteId=${n.id};document.getElementById('noteVideoFile_${n.id}').click()">${n.videoId ? '🎥' : '🎬'}</button>
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;" title="رابط يوتيوب أو Google Drive" onclick="addNoteYoutubeLink(${n.id})">🔗</button>
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;" title="${n.reviewed ? 'تمت المراجعة' : 'علّم كمراجَعة'}" onclick="toggleNoteReviewed(${n.id})">${n.reviewed ? '✅' : '⬜'}</button>
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;" title="حوّلها لبطاقة مراجعة" onclick="convertNoteToReviewCard(${n.id})">🔄</button>
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;color:var(--red);" onclick="deleteNote(${n.id})">🗑️</button>
        </div>
      </div>
    </div>`).join('');
  hydrateNoteVideos(grid);
  grid.querySelectorAll('.note-content-input').forEach(autoGrowTextarea);
}

// ══ Bulk select / delete ══
let noteBulkMode = false;
let selectedNoteIds = new Set();
let noteDragSelecting = false;
let noteDragAdd = true;

function toggleNoteBulkMode() {
  noteBulkMode = !noteBulkMode;
  if (!noteBulkMode) selectedNoteIds.clear();
  const btn = document.getElementById('notesBulkToggleBtn');
  if (btn) btn.textContent = noteBulkMode ? '✕ إلغاء التحديد الجماعي' : '☑️ تحديد جماعي';
  renderNotes();
}

function handleNoteCardClick(id, event) {
  if (event.target.closest('button')) return;
  if (noteBulkMode) return; // selection itself is handled by drag-select (mousedown/touchstart)
  openNoteZoom(id);
}

function setNoteSelected(id, shouldSelect) {
  const had = selectedNoteIds.has(id);
  if (shouldSelect === had) return;
  if (shouldSelect) selectedNoteIds.add(id); else selectedNoteIds.delete(id);
  updateNoteCardSelectedDOM(id);
  updateNoteBulkUI();
}

function updateNoteCardSelectedDOM(id) {
  const grid = document.getElementById('notesGrid');
  if (!grid) return;
  const card = grid.querySelector(`[data-id="${id}"]`);
  if (!card) return;
  const selected = selectedNoteIds.has(id);
  card.classList.toggle('is-selected', selected);
  const check = card.querySelector('.note-select-check');
  if (check) {
    check.classList.toggle('checked', selected);
    check.textContent = selected ? '✓' : '';
  }
}

// Click-and-drag (or touch-and-drag) multi-select: press down on a card to start,
// then glide over other cards to add/remove them from the selection in one gesture.
function initNoteDragSelect() {
  const grid = document.getElementById('notesGrid');
  if (!grid || grid.dataset.dragSelectInit) return;
  grid.dataset.dragSelectInit = '1';

  const cardIdFromEl = (el) => {
    const card = el?.closest?.('.note-card, .note-flip-card');
    if (!card) return null;
    const raw = card.dataset.id;
    return raw ? Number(raw) : null;
  };

  grid.addEventListener('mousedown', e => {
    if (!noteBulkMode || e.button !== 0) return;
    if (e.target.closest('button')) return;
    const id = cardIdFromEl(e.target);
    if (id == null) return;
    e.preventDefault();
    noteDragSelecting = true;
    noteDragAdd = !selectedNoteIds.has(id);
    setNoteSelected(id, noteDragAdd);
  });

  grid.addEventListener('mouseover', e => {
    if (!noteDragSelecting || !noteBulkMode) return;
    const id = cardIdFromEl(e.target);
    if (id == null) return;
    setNoteSelected(id, noteDragAdd);
  });

  grid.addEventListener('touchstart', e => {
    if (!noteBulkMode) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el?.closest?.('button')) return;
    const id = cardIdFromEl(el);
    if (id == null) return;
    noteDragSelecting = true;
    noteDragAdd = !selectedNoteIds.has(id);
    setNoteSelected(id, noteDragAdd);
  }, { passive: true });

  grid.addEventListener('touchmove', e => {
    if (!noteDragSelecting || !noteBulkMode) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const id = cardIdFromEl(el);
    if (id == null) return;
    setNoteSelected(id, noteDragAdd);
  }, { passive: true });
}

document.addEventListener('mouseup', () => { noteDragSelecting = false; });
document.addEventListener('touchend', () => { noteDragSelecting = false; });
document.addEventListener('touchcancel', () => { noteDragSelecting = false; });

function updateNoteBulkUI() {
  const delBtn = document.getElementById('notesBulkDeleteBtn');
  const countSpan = document.getElementById('notesBulkCount');
  if (countSpan) countSpan.textContent = selectedNoteIds.size;
  if (delBtn) delBtn.style.display = noteBulkMode ? 'inline-flex' : 'none';
}

function deleteSelectedNotes() {
  if (!selectedNoteIds.size) { showToast('⚠️ ما في بطاقات محددة'); return; }
  const count = selectedNoteIds.size;
  if (!confirm(`متأكد إنك بدك تحذف ${count} بطاقة؟ ما رح تقدر تتراجع عن هالحذف الجماعي.`)) return;
  const idsToDelete = new Set(selectedNoteIds);
  studyNotes = studyNotes.filter(n => !idsToDelete.has(n.id));
  saveStudyNotes();
  selectedNoteIds.clear();
  noteBulkMode = false;
  const btn = document.getElementById('notesBulkToggleBtn');
  if (btn) btn.textContent = '☑️ تحديد جماعي';
  renderNotes();
  showToast(`🗑️ اتحذفت ${count} بطاقة`);
}

async function addNoteVideoFromFile(id, fileList) {
  const file = fileList?.[0];
  const input = document.getElementById('noteVideoFile_' + id);
  if (input) input.value = '';
  if (!file) return;
  const note = studyNotes.find(n => n.id === id);
  if (!note) return;
  showToast('⏳ جاري رفع الفيديو...');
  try {
    if (note.videoId) { try { await idbDeleteNoteVideo(note.videoId); } catch (e) {} }
    const videoId = 'vid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
    await idbPutNoteVideo(videoId, file);
    note.videoId = videoId;
    saveStudyNotes();
    renderNotes();
    activeNoteId = id;
    showToast('✅ تمت إضافة الفيديو للملاحظة');
  } catch (e) {
    showToast('⚠️ تعذّر حفظ الفيديو — جرب فيديو أصغر حجمًا');
  }
}

async function removeNoteVideo(id) {
  const note = studyNotes.find(n => n.id === id);
  if (!note || !note.videoId) return;
  try { await idbDeleteNoteVideo(note.videoId); } catch (e) {}
  note.videoId = null;
  saveStudyNotes();
  renderNotes();
}

function toggleNoteReviewed(id, event) {
  if (event) event.stopPropagation();
  const note = studyNotes.find(n => n.id === id);
  if (!note) return;
  note.reviewed = !note.reviewed;
  saveStudyNotes();
  renderNotes();
}

// ══ Note fullscreen zoom viewer ══
let activeZoomNoteId = null;

function openNoteZoom(id) {
  const note = studyNotes.find(n => n.id === id);
  if (!note) return;
  activeZoomNoteId = id;

  const card = document.getElementById('noteZoomCard');
  const icon = document.getElementById('noteZoomIcon');
  const title = document.getElementById('noteZoomTitle');
  const body = document.getElementById('noteZoomBody');
  const doneBtn = document.getElementById('noteZoomDoneBtn');

  card.dataset.color = note.color || 'amber';
  icon.textContent = NOTE_ICONS[note.color] || '✎';
  title.textContent = note.title || 'بطاقة بدون عنوان';
  doneBtn.textContent = note.reviewed ? '↩️ إلغاء المراجعة — إغلاق' : '✅ تمت المراجعة — إغلاق';

  const contentText = noteContentText(note);
  body.innerHTML = `
    ${contentText ? `<div class="note-view-plain-box">${hl(esc(contentText))}</div>` : ''}
    ${(note.images && note.images.length) ? `<div class="note-images">${note.images.map(src => `<div class="note-image-wrap">${noteImageThumbHtml(src)}</div>`).join('')}</div>` : ''}
    ${note.videoId ? `<video class="note-video" data-video-id="${note.videoId}" controls></video>` : ''}
    ${note.youtubeId ? `<div><iframe class="note-youtube-embed" src="https://www.youtube.com/embed/${note.youtubeId}?rel=0" title="YouTube" allowfullscreen></iframe><a class="note-youtube-fallback" href="https://www.youtube.com/watch?v=${note.youtubeId}" target="_blank" rel="noopener">▶️ افتح على يوتيوب</a></div>` : ''}
    ${note.driveFileId ? `<div><iframe class="note-youtube-embed" src="https://drive.google.com/file/d/${note.driveFileId}/preview" title="Google Drive" allowfullscreen></iframe></div>` : ''}
    ${(!contentText && !(note.images && note.images.length) && !note.videoId && !note.youtubeId && !note.driveFileId) ? `<div style="color:var(--text2);text-align:center;padding:30px 0;">لا يوجد محتوى إضافي لهذه البطاقة</div>` : ''}
  `;

  document.getElementById('noteZoomOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  hydrateNoteVideos(body);
}

function closeNoteZoom() {
  document.getElementById('noteZoomOverlay').classList.remove('open');
  document.body.style.overflow = '';
  activeZoomNoteId = null;
}

function markNoteReviewedAndClose() {
  if (activeZoomNoteId == null) { closeNoteZoom(); return; }
  const note = studyNotes.find(n => n.id === activeZoomNoteId);
  if (note) {
    note.reviewed = !note.reviewed;
    saveStudyNotes();
    renderNotes();
  }
  closeNoteZoom();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('noteZoomOverlay')?.classList.contains('open')) {
    closeNoteZoom();
  }
});

function extractYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
// Detects a Google Drive share link and returns its file ID, so it can be
// rendered via Drive's official embeddable /preview endpoint (works for
// video and most other file types Drive can preview).
function extractDriveFileId(url) {
  if (!url) return null;
  const m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]{20,})/);
  return m ? m[1] : null;
}

function addNoteYoutubeLink(id) {
  const note = studyNotes.find(n => n.id === id);
  if (!note) return;
  const current = note.youtubeId ? `https://youtu.be/${note.youtubeId}` : (note.driveFileId ? `https://drive.google.com/file/d/${note.driveFileId}/view` : '');
  const url = prompt('الصق رابط فيديو يوتيوب أو Google Drive (أو امسح الحقل وأكّد لإزالته):', current);
  if (url === null) return; // cancelled
  if (!url.trim()) { note.youtubeId = null; note.driveFileId = null; saveStudyNotes(); renderNotes(); return; }
  const videoId = extractYoutubeId(url.trim());
  const driveId = videoId ? null : extractDriveFileId(url.trim());
  if (!videoId && !driveId) { showToast('⚠️ ما قدرت أعرف الرابط — تأكد إنه رابط يوتيوب أو Drive صحيح'); return; }
  note.youtubeId = videoId || null;
  note.driveFileId = driveId || null;
  saveStudyNotes();
  renderNotes();
  showToast('✅ تمت إضافة الفيديو');
}

function removeNoteYoutubeLink(id) {
  const note = studyNotes.find(n => n.id === id);
  if (!note) return;
  note.youtubeId = null;
  note.driveFileId = null;
  saveStudyNotes();
  renderNotes();
}

