// ════════════════════════════════════════════════
//  PERFORMANCE ANALYTICS + STUDY CALENDAR
// ════════════════════════════════════════════════
const CAL_KEY = 'drmonic_calendar_events';
const CAL_COLORS = ['#F87171', '#FBBF24', '#4ADE80', '#38BDF8', '#A78BFA', '#F472B6', '#FB923C'];
let calCurrentMonth = new Date();
let calSelectedDate = null;
let calSelectedColor = CAL_COLORS[0];

async function showAnalyticsView() {
  hideAllViews();
  document.getElementById('analyticsView').classList.add('active');
  if (!pharmaLoaded) await loadPharmaCards();
  microLoadData();
  gamLoadData();
  anSwitchTab('stats');
}

function anSwitchTab(tab) {
  document.getElementById('anTabStats').classList.toggle('active', tab === 'stats');
  document.getElementById('anTabCal').classList.toggle('active', tab === 'cal');
  document.getElementById('anStatsPanel').style.display = tab === 'stats' ? 'block' : 'none';
  document.getElementById('anCalPanel').style.display = tab === 'cal' ? 'block' : 'none';
  if (tab === 'stats') anRenderStats();
  else calRender();
}

function anRenderStats() {
  const totalCases = cases.length;
  const specCounts = {};
  cases.forEach(c => { const sp = c.specialty || 'غير محدد'; specCounts[sp] = (specCounts[sp] || 0) + 1; });
  const topSpecEntry = Object.entries(specCounts).sort((a, b) => b[1] - a[1])[0];
  const topSpec = topSpecEntry ? specialtyLabel(topSpecEntry[0]) : '—';

  const pharmaMastered = pharmaCards.filter(c => c.mastered).length;
  const microBugsTotal = (microData.nodes || []).filter(n => n.node_type === 'bacteria_bug').length;
  const microBugsDone = gamAwardedMicro ? gamAwardedMicro.size : 0;

  let mcqStats = { correct: 0, incorrect: 0 };
  try { mcqStats = JSON.parse(localStorage.getItem('drmonic_mcq_stats')) || mcqStats; } catch (e) {}
  const mcqTotal = mcqStats.correct + mcqStats.incorrect;
  const mcqPct = mcqTotal ? Math.round((mcqStats.correct / mcqTotal) * 100) : 0;

  const lifetimeXp = Number(localStorage.getItem('drmonic_gam_lifetime_xp')) || 0;
  const streak = gamStreak.count || 0;

  // Composite "creativity/mastery" score out of 100 — blends four normalized signals
  const caseScore = Math.min(100, totalCases * 4);
  const pharmaScore = pharmaCards.length ? (pharmaMastered / pharmaCards.length) * 100 : 0;
  const microScore = microBugsTotal ? (microBugsDone / microBugsTotal) * 100 : 0;
  const mcqScore = mcqTotal ? mcqPct : 0;
  const composite = Math.round((caseScore + pharmaScore + microScore + mcqScore) / 4);

  const specBars = Object.entries(specCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([sp, n]) => {
    const pct = totalCases ? Math.round((n / totalCases) * 100) : 0;
    return `<div class="an-bar-row">
      <span class="an-bar-label">${esc(specialtyLabel(sp))}</span>
      <span class="an-bar-track"><span class="an-bar-fill" style="width:${pct}%;"></span></span>
      <span class="an-bar-count">${n}</span>
    </div>`;
  }).join('') || `<div class="gam-empty">ما في حالات بعد</div>`;

  const radius = 72, circumference = 2 * Math.PI * radius;
  const offset = circumference - (composite / 100) * circumference;

  const panel = document.getElementById('anStatsPanel');
  panel.innerHTML = `
    <div class="an-stats-grid">
      <div class="an-stat-card"><div class="an-stat-icon">📋</div><div class="an-stat-value">${totalCases}</div><div class="an-stat-label">إجمالي الحالات</div></div>
      <div class="an-stat-card"><div class="an-stat-icon">🏆</div><div class="an-stat-value" style="font-size:1.1rem;">${esc(topSpec)}</div><div class="an-stat-label">أكثر تخصص راجعته</div></div>
      <div class="an-stat-card"><div class="an-stat-icon">💊</div><div class="an-stat-value">${pharmaMastered}</div><div class="an-stat-label">دواء "تمت دراسته"</div></div>
      <div class="an-stat-card"><div class="an-stat-icon">🦠</div><div class="an-stat-value">${microBugsDone}</div><div class="an-stat-label">ميكروب تمت مراجعته</div></div>
      <div class="an-stat-card"><div class="an-stat-icon">❓</div><div class="an-stat-value">${mcqPct}%</div><div class="an-stat-label">دقة الإجابة (${mcqTotal} سؤال)</div></div>
      <div class="an-stat-card"><div class="an-stat-icon">🔥</div><div class="an-stat-value">${streak}</div><div class="an-stat-label">أيام التزام متتالية</div></div>
      <div class="an-stat-card"><div class="an-stat-icon">⭐</div><div class="an-stat-value">${lifetimeXp}</div><div class="an-stat-label">إجمالي XP المكتسب</div></div>
    </div>

    <div class="an-section">
      <div class="an-section-title">🎯 مؤشر التميّز الشامل</div>
      <div class="an-panel">
        <div class="an-panel-flex">
          <div class="an-radial-wrap">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="${radius}" fill="none" stroke="var(--navy)" stroke-width="14" />
              <circle cx="90" cy="90" r="${radius}" fill="none" stroke="url(#anGrad)" stroke-width="14"
                stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                transform="rotate(-90 90 90)" style="transition:stroke-dashoffset .6s ease;" />
              <defs>
                <linearGradient id="anGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#8B5CF6" />
                  <stop offset="100%" stop-color="#38BDF8" />
                </linearGradient>
              </defs>
            </svg>
            <div class="an-radial-center">
              <div class="an-radial-score">${composite}</div>
              <div class="an-radial-caption">من 100</div>
            </div>
          </div>
          <div class="an-donut-legend">
            <div class="an-donut-legend-item"><span class="an-donut-dot" style="background:#8B5CF6;"></span> الحالات (${Math.round(caseScore)}%)</div>
            <div class="an-donut-legend-item"><span class="an-donut-dot" style="background:#38BDF8;"></span> الفارماكولوجي (${Math.round(pharmaScore)}%)</div>
            <div class="an-donut-legend-item"><span class="an-donut-dot" style="background:#4ADE80;"></span> الميكروبيولوجي (${Math.round(microScore)}%)</div>
            <div class="an-donut-legend-item"><span class="an-donut-dot" style="background:#FBBF24;"></span> دقة الأسئلة (${Math.round(mcqScore)}%)</div>
          </div>
        </div>
      </div>
    </div>

    <div class="an-section">
      <div class="an-section-title">📚 توزيع الحالات حسب التخصص</div>
      <div class="an-panel">${specBars}</div>
    </div>`;
}

// ── Calendar ──
function calLoad() {
  try { return JSON.parse(localStorage.getItem(CAL_KEY)) || {}; } catch (e) { return {}; }
}
function calSave(data) { safeLocalSet(CAL_KEY, JSON.stringify(data)); }
function calDateKey(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }

function calRender() {
  const panel = document.getElementById('anCalPanel');
  const y = calCurrentMonth.getFullYear(), m = calCurrentMonth.getMonth();
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const events = calLoad();
  const todayKey = calDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += `<div class="cal-day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = calDateKey(y, m, d);
    const dayEvents = events[key] || [];
    const dots = dayEvents.slice(0, 4).map(ev => `<span class="cal-dot" style="background:${ev.color};"></span>`).join('');
    const more = dayEvents.length > 4 ? `<span class="cal-day-more">+${dayEvents.length - 4}</span>` : '';
    cells += `<div class="cal-day ${key === todayKey ? 'today' : ''}" onclick="calOpenDay('${key}')">
      <span class="cal-day-num">${d}</span>
      <div class="cal-day-dots">${dots}${more}</div>
    </div>`;
  }

  panel.innerHTML = `
    <div class="cal-header">
      <button class="cal-nav-btn" onclick="calChangeMonth(-1)">‹</button>
      <span class="cal-month-title">${monthNames[m]} ${y}</span>
      <button class="cal-nav-btn" onclick="calChangeMonth(1)">›</button>
    </div>
    <div class="cal-grid-wrap">
      <div class="cal-weekdays">${['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'].map(w => `<div class="cal-weekday">${w}</div>`).join('')}</div>
      <div class="cal-days">${cells}</div>
    </div>`;
}
function calChangeMonth(delta) {
  calCurrentMonth = new Date(calCurrentMonth.getFullYear(), calCurrentMonth.getMonth() + delta, 1);
  calRender();
}
function calOpenDay(key) {
  calSelectedDate = key;
  const events = calLoad();
  const dayEvents = events[key] || [];
  const modal = document.createElement('div');
  modal.className = 'modal-overlay'; modal.style.display = 'flex'; modal.classList.add('open');
  modal.innerHTML = `
    <div class="modal-box" style="max-width:440px;">
      <h3 style="margin-bottom:14px;">📅 ${key}</h3>
      <div id="calEventsListWrap">${calBuildEventsListHtml(dayEvents, key)}</div>
      <div class="pharma-box pharma-box-visual" style="margin-top:14px;">
        <div class="ecg-field"><label class="ecg-label">عنوان المهمة</label>
          <input class="form-input" id="calFormTitle" placeholder="مثلاً: امتحان فارماكولوجي" />
        </div>
        <div style="display:flex;gap:14px;margin-bottom:12px;flex-wrap:wrap;">
          <div>
            <label class="ecg-label">اللون</label>
            <div style="display:flex;gap:6px;">
              ${CAL_COLORS.map(c => `<span class="cal-color-swatch ${c === calSelectedColor ? 'selected' : ''}" style="background:${c};" onclick="calPickColor(this,'${c}')"></span>`).join('')}
            </div>
          </div>
          <div class="ecg-field" style="flex:1;min-width:120px;"><label class="ecg-label">الأولوية</label>
            <select class="form-input" id="calFormPriority">
              <option value="low">🟢 منخفضة</option>
              <option value="med" selected>🟡 متوسطة</option>
              <option value="high">🔴 عالية</option>
            </select>
          </div>
          <div class="ecg-field" style="flex:1;min-width:120px;"><label class="ecg-label">النوع</label>
            <select class="form-input" id="calFormType">
              <option value="task">📝 مهمة</option>
              <option value="exam">📚 امتحان</option>
              <option value="other">🔖 غيره</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="calAddEvent()">➕ إضافة</button>
      </div>
      <div class="hx-save-bar">
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove();calRender();">إغلاق</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}
function calPickColor(el, color) {
  calSelectedColor = color;
  el.parentElement.querySelectorAll('.cal-color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
}
function calBuildEventsListHtml(dayEvents, key) {
  if (!dayEvents.length) return `<div class="gam-empty">ما في مهام باليوم هاد</div>`;
  const typeIcon = { task: '📝', exam: '📚', other: '🔖' };
  return dayEvents.map(ev => `
    <div class="cal-event-item">
      <span class="cal-event-color" style="background:${ev.color};"></span>
      <span class="cal-event-title">${typeIcon[ev.type] || '🔖'} ${esc(ev.title)}</span>
      <span class="cal-priority-badge cal-priority-${ev.priority}">${ev.priority === 'high' ? 'عالية' : ev.priority === 'low' ? 'منخفضة' : 'متوسطة'}</span>
      <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.7rem;" onclick="calDeleteEvent('${key}','${ev.id}')">🗑️</button>
    </div>`).join('');
}
function calAddEvent() {
  const title = document.getElementById('calFormTitle').value.trim();
  if (!title) { showToast('⚠️ اكتب عنوان المهمة'); return; }
  const priority = document.getElementById('calFormPriority').value;
  const type = document.getElementById('calFormType').value;
  const events = calLoad();
  if (!events[calSelectedDate]) events[calSelectedDate] = [];
  events[calSelectedDate].push({ id: genId(), title, color: calSelectedColor, priority, type });
  calSave(events);
  showToast('✅ تمت الإضافة');
  document.getElementById('calEventsListWrap').innerHTML = calBuildEventsListHtml(events[calSelectedDate], calSelectedDate);
  document.getElementById('calFormTitle').value = '';
}
function calDeleteEvent(key, id) {
  const events = calLoad();
  events[key] = (events[key] || []).filter(e => e.id !== id);
  if (!events[key].length) delete events[key];
  calSave(events);
  document.getElementById('calEventsListWrap').innerHTML = calBuildEventsListHtml(events[key] || [], key);
  calRender();
}

