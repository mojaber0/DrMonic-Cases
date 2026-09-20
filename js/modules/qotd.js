// ════════════════════════════════════════════════
//  QUESTION OF THE DAY
//  Picks one random MCQ (from allQuizMcqs, same pool as the MCQ quiz)
//  and keeps showing the SAME question all day, rotating at midnight.
// ════════════════════════════════════════════════
const QOTD_KEY = 'drmonic_qotd';
function renderQotd() {
  const wrap = document.getElementById('qotdWrap');
  if (!wrap) return;
  const all = allQuizMcqs();
  if (!all.length) { wrap.innerHTML = ''; return; }
  const today = gamTodayStr ? gamTodayStr() : new Date().toISOString().slice(0, 10);
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(QOTD_KEY)); } catch (e) {}
  let pick;
  if (saved && saved.date === today && saved.q) {
    pick = saved;
  } else {
    const chosen = all[Math.floor(Math.random() * all.length)];
    pick = { date: today, q: chosen.q, a: chosen.a, caseName: chosen.caseName, specialty: chosen.specialty };
    localStorage.setItem(QOTD_KEY, JSON.stringify(pick));
  }
  wrap.innerHTML = `
    <div class="qotd-card">
      <div class="qotd-title">❓ سؤال اليوم — ${esc(pick.caseName)} · ${esc(pick.specialty || '')}</div>
      <div class="qotd-question">${hl(esc(pick.q))}</div>
      <button class="mcq-answer-btn" onclick="this.nextElementSibling.classList.toggle('show')">🔍 اظهر الإجابة</button>
      <div class="qotd-answer">${hl(esc(pick.a || 'لا يوجد إجابة'))}</div>
    </div>`;
}

