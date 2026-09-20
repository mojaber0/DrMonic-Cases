// ════════════════════════════════════════════════
//  RANDOM MCQ QUIZ  (from all cases)
// ════════════════════════════════════════════════
function showMcqQuizView() {
  hideAllViews();
  document.getElementById('mcqQuizView').classList.add('active');
  mcqQuizCurrent = null;
  nextRandomMcq();
}

function allQuizMcqs() {
  const all = [];
  cases.forEach(c => {
    (c.mcqs || []).forEach(q => {
      if (q.q) all.push({ q: q.q, a: q.a, caseName: c.name, specialty: c.specialty });
    });
  });
  return all;
}

function nextRandomMcq() {
  const all = allQuizMcqs();
  const countEl = document.getElementById('mcqQuizCount');
  if (countEl) countEl.textContent = `${all.length} سؤال من ${cases.filter(c=>c.mcqs && c.mcqs.some(q=>q.q)).length} حالة`;
  const wrap = document.getElementById('mcqQuizWrap');
  if (!all.length) {
    wrap.innerHTML = `
      <div class="notes-empty">
        <div class="icon">🎲</div>
        <h3>لا توجد أسئلة MCQ بعد</h3>
        <p>أضف أسئلة لحالاتك من خلال تعديلها</p>
      </div>`;
    return;
  }
  let pick = all[Math.floor(Math.random() * all.length)];
  if (all.length > 1) {
    while (mcqQuizCurrent && pick.q === mcqQuizCurrent.q) {
      pick = all[Math.floor(Math.random() * all.length)];
    }
  }
  mcqQuizCurrent = pick;
  wrap.innerHTML = `
    <div class="mcq-quiz-card">
      <div class="mcq-quiz-tag">${esc(pick.caseName)} · ${esc(pick.specialty || '')}</div>
      <div class="mcq-quiz-question">${hl(esc(pick.q))}</div>
      <button class="mcq-answer-btn" onclick="mcqRevealAndShowAssess(this)">🔍 اظهر الإجابة</button>
      <div class="mcq-answer-reveal">${hl(esc(pick.a || 'لا يوجد إجابة'))}</div>
      <div class="mcq-quiz-actions" id="mcqSelfAssessActions" style="display:none;">
        <button class="btn btn-primary btn-sm" style="background:#22C55E;border-color:#22C55E;" onclick="mcqSelfAssess(true)">✅ عرفتها</button>
        <button class="btn btn-ghost btn-sm" onclick="mcqSelfAssess(false)">❌ ما عرفتها</button>
      </div>
      <div class="mcq-quiz-actions">
        <button class="btn btn-primary btn-sm" onclick="nextRandomMcq()">🎲 سؤال عشوائي آخر</button>
      </div>
    </div>`;
}

function mcqRevealAndShowAssess(btn) {
  revealAnswer(btn);
  const actions = document.getElementById('mcqSelfAssessActions');
  if (actions) actions.style.display = actions.style.display === 'none' ? 'flex' : 'none';
}

// Light positive-reinforcement feedback (sound + vibration) when the student
// marks a revealed MCQ answer as "known" — no external audio files needed.
function mcqPlayPositiveChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [880, 1174.66]; // a quick bright two-note "ding"
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.09 + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.09);
      osc.stop(ctx.currentTime + i * 0.09 + 0.24);
    });
  } catch (e) { /* Web Audio unsupported — silently skip */ }
  if (navigator.vibrate) navigator.vibrate(35);
}
function mcqSelfAssess(knewIt) {
  let stats;
  try { stats = JSON.parse(localStorage.getItem('drmonic_mcq_stats')) || { correct: 0, incorrect: 0 }; }
  catch (e) { stats = { correct: 0, incorrect: 0 }; }
  if (knewIt) {
    stats.correct++;
    mcqPlayPositiveChime();
    showToast('✅ رائع! استمر هيك 🔥');
  } else {
    stats.incorrect++;
    showToast('📌 لا بأس، راجعها كمان مرة لاحقاً');
  }
  localStorage.setItem('drmonic_mcq_stats', JSON.stringify(stats));
  const actions = document.getElementById('mcqSelfAssessActions');
  if (actions) actions.style.display = 'none';
}

