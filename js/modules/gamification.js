// ════════════════════════════════════════════════
//  GAMIFICATION & CUSTOMIZABLE REWARDS STORE
//  Fully user-defined: the user creates their own rewards and sets
//  their own XP cost, and sets their own XP-earning rule values.
//  Nothing here is hardcoded as a "correct" reward or price.
// ════════════════════════════════════════════════
const GAM_KEYS = {
  rules: 'drmonic_gam_rules',
  rewards: 'drmonic_gam_rewards',
  balance: 'drmonic_gam_balance',
  redemptions: 'drmonic_gam_redemptions',
  streak: 'drmonic_gam_streak',
  awardedMicro: 'drmonic_gam_awarded_micro',
  awardedPharma: 'drmonic_gam_awarded_pharma',
};
let gamRules = { new_case: 20, micro_branch: 10, pharma_branch: 10, streak_day: 15 };
let gamRewards = [];
let gamBalance = 0;
let gamRedemptions = [];
let gamStreak = { lastDate: null, count: 0 };
let gamAwardedMicro = new Set();
let gamAwardedPharma = new Set();

function gamLoadData() {
  try { gamRules = { ...gamRules, ...(JSON.parse(localStorage.getItem(GAM_KEYS.rules)) || {}) }; } catch (e) {}
  try { gamRewards = JSON.parse(localStorage.getItem(GAM_KEYS.rewards)) || []; } catch (e) { gamRewards = []; }
  try { gamBalance = Number(localStorage.getItem(GAM_KEYS.balance)) || 0; } catch (e) { gamBalance = 0; }
  try { gamRedemptions = JSON.parse(localStorage.getItem(GAM_KEYS.redemptions)) || []; } catch (e) { gamRedemptions = []; }
  try { gamStreak = JSON.parse(localStorage.getItem(GAM_KEYS.streak)) || { lastDate: null, count: 0 }; } catch (e) { gamStreak = { lastDate: null, count: 0 }; }
  try { gamAwardedMicro = new Set(JSON.parse(localStorage.getItem(GAM_KEYS.awardedMicro)) || []); } catch (e) { gamAwardedMicro = new Set(); }
  try { gamAwardedPharma = new Set(JSON.parse(localStorage.getItem(GAM_KEYS.awardedPharma)) || []); } catch (e) { gamAwardedPharma = new Set(); }
}
function gamSaveRules() { safeLocalSet(GAM_KEYS.rules, JSON.stringify(gamRules)); }
function gamSaveRewards() { safeLocalSet(GAM_KEYS.rewards, JSON.stringify(gamRewards)); }
function gamSaveBalance() { safeLocalSet(GAM_KEYS.balance, String(gamBalance)); }
function gamSaveRedemptions() { safeLocalSet(GAM_KEYS.redemptions, JSON.stringify(gamRedemptions)); }
function gamSaveStreak() { safeLocalSet(GAM_KEYS.streak, JSON.stringify(gamStreak)); }
function gamSaveAwardedMicro() { safeLocalSet(GAM_KEYS.awardedMicro, JSON.stringify([...gamAwardedMicro])); }
function gamSaveAwardedPharma() { safeLocalSet(GAM_KEYS.awardedPharma, JSON.stringify([...gamAwardedPharma])); }

function gamUpdateBalanceBadges() {
  const txt = `⭐ ${gamBalance} XP`;
  const header = document.getElementById('gamHeaderBadge');
  const store = document.getElementById('gamBalanceBadge');
  [header, store].forEach(el => {
    if (!el) return;
    el.textContent = txt;
    el.classList.remove('gam-xp-pulse');
    void el.offsetWidth; // restart animation
    el.classList.add('gam-xp-pulse');
  });
  const streakEl = document.getElementById('gamStreakBadge');
  if (streakEl) streakEl.textContent = `🔥 ${gamStreak.count || 0}`;
}

function gamAwardXp(amount, reasonLabel) {
  if (!amount || amount <= 0) return;
  gamBalance += amount;
  gamSaveBalance();
  const lifetime = Number(localStorage.getItem('drmonic_gam_lifetime_xp')) || 0;
  localStorage.setItem('drmonic_gam_lifetime_xp', String(lifetime + amount));
  gamUpdateBalanceBadges();
  showToast(`⭐ +${amount} XP${reasonLabel ? ' — ' + reasonLabel : ''}`);
}

function gamTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function gamCheckDailyStreak() {
  const today = gamTodayStr();
  if (gamStreak.lastDate === today) return; // already counted today
  const yesterday = new Date(Date.now() - 86400000);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  gamStreak.count = (gamStreak.lastDate === yStr) ? (gamStreak.count + 1) : 1;
  gamStreak.lastDate = today;
  gamSaveStreak();
  if (gamRules.streak_day > 0) gamAwardXp(gamRules.streak_day, `التزام يومي 🔥 (يوم ${gamStreak.count})`);
}

// Called whenever a bacteria/virus/fungi/parasite branch detail is opened for the first time
function gamNotifyMicroBranchOpened(nodeId) {
  if (gamAwardedMicro.has(nodeId)) return;
  gamAwardedMicro.add(nodeId);
  gamSaveAwardedMicro();
  if (gamRules.micro_branch > 0) gamAwardXp(gamRules.micro_branch, 'إنهاء فرع بشجرة الميكرو');
}

// Called whenever a pharma card is checked as "Mastered" for the first time
function gamNotifyPharmaMastered(cardId) {
  if (gamAwardedPharma.has(cardId)) return;
  gamAwardedPharma.add(cardId);
  gamSaveAwardedPharma();
  if (gamRules.pharma_branch > 0) gamAwardXp(gamRules.pharma_branch, 'دواء "تمت دراسته" بالفارماكولوجي');
}

function gamResetBalance() {
  if (!confirm('متأكد إنك بدك تصفّر رصيدك من الـ XP؟ هاد الإجراء ما إله رجعة (سجل المشتريات ورموز إنجازاتك السابقة رح تضل محفوظة، بس رصيدك الحالي بس رح يصير صفر).')) return;
  gamBalance = 0;
  gamSaveBalance();
  gamUpdateBalanceBadges();
  showToast('🔄 تم تصفير رصيد الـ XP');
  gamRenderStore();
}

function gamClearHistory() {
  if (!gamRedemptions.length) { showToast('السجل فاضي أصلاً'); return; }
  if (!confirm('متأكد إنك بدك تمسح سجل المشتريات بالكامل؟ هاد الإجراء ما إله رجعة (رصيدك الحالي من الـ XP رح يضل زي ما هو، بس السجل بس رح يمسح).')) return;
  gamRedemptions = [];
  gamSaveRedemptions();
  showToast('🗑️ تم مسح سجل المشتريات');
  gamRenderStore();
}

function gamDeleteHistoryEntry(id) {
  gamRedemptions = gamRedemptions.filter(h => h.id !== id);
  gamSaveRedemptions();
  showToast('🗑️ تم حذف العنصر من السجل');
  gamRenderStore();
}

function showGamificationView() {
  hideAllViews();
  document.getElementById('gamificationView').classList.add('active');
  gamLoadData();
  microLoadData();
  gamUpdateBalanceBadges();
  gamRenderStore();
}

function gamRenderStore() {
  const grid = document.getElementById('gamRewardsGrid');
  if (!gamRewards.length) {
    grid.innerHTML = `<div class="gam-empty" style="grid-column:1/-1;">🎁 ما أضفت أي مكافأة بعد — اضغط "⚙️ إعدادات التحفيز" لإضافة أول مكافأة (مثلاً: ساعة جيمنج، كاسة قهوة...)</div>`;
  } else {
    grid.innerHTML = gamRewards.map(r => {
      const canAfford = gamBalance >= r.cost;
      return `<div class="gam-reward-card ${canAfford ? '' : 'locked'}">
        <div class="gam-reward-icon">${esc(r.icon || '🎁')}</div>
        <div class="gam-reward-name">${esc(r.name)}</div>
        <div class="gam-reward-cost">${r.cost} XP</div>
        <button class="btn ${canAfford ? 'btn-primary' : 'btn-ghost'} btn-sm" ${canAfford ? '' : 'disabled'} onclick="gamRedeem('${r.id}')">
          ${canAfford ? '🛍️ شراء / Redeem' : '🔒 غير كافي'}
        </button>
      </div>`;
    }).join('');
  }

  const histWrap = document.getElementById('gamHistoryWrap');
  if (!gamRedemptions.length) {
    histWrap.innerHTML = `<div class="gam-empty">لسا ما اشتريت أي مكافأة</div>`;
  } else {
    histWrap.innerHTML = gamRedemptions.slice().reverse().map(h => `
      <div class="gam-history-row">
        <span>${esc(h.icon || '🎁')} ${esc(h.name)}</span>
        <span style="color:var(--text2);">${new Date(h.date).toLocaleString('ar')}</span>
        <span class="gam-reward-cost">-${h.cost} XP</span>
        <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.7rem;color:var(--red);" onclick="gamDeleteHistoryEntry('${h.id}')">🗑️</button>
      </div>`).join('');
  }
}

function gamRedeem(rewardId) {
  const reward = gamRewards.find(r => r.id === rewardId);
  if (!reward) return;
  if (gamBalance < reward.cost) { showToast('⚠️ رصيدك من الـ XP ما يكفي لهاي المكافأة'); return; }
  gamBalance -= reward.cost;
  gamSaveBalance();
  gamRedemptions.push({ id: genId(), rewardId: reward.id, name: reward.name, icon: reward.icon, cost: reward.cost, date: Date.now() });
  gamSaveRedemptions();
  gamUpdateBalanceBadges();
  showToast(`🎉 مبروك! استبدلت "${reward.name}" — استمتع فيها 🎁`);
  gamRenderStore();
}

function gamOpenSettings() {
  gamLoadData();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.classList.add('open');
  modal.innerHTML = `
    <div class="modal-box" style="max-width:680px;max-height:88vh;overflow-y:auto;">
      <h3 style="margin-bottom:14px;">⚙️ إعدادات التحفيز والمكافآت</h3>

      <div class="pharma-box pharma-box-visual">
        <div class="pharma-box-title">⭐ كم XP تكسب؟ (حدد الأرقام يلي تناسبك)</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div class="ecg-field" style="flex:1;min-width:170px;"><label class="ecg-label">📋 عند إضافة حالة جديدة</label>
            <input type="number" min="0" class="form-input" id="gamRuleNewCase" value="${gamRules.new_case}" />
          </div>
          <div class="ecg-field" style="flex:1;min-width:170px;"><label class="ecg-label">🦠 عند إنهاء فرع بشجرة الميكرو</label>
            <input type="number" min="0" class="form-input" id="gamRuleMicro" value="${gamRules.micro_branch}" />
          </div>
          <div class="ecg-field" style="flex:1;min-width:170px;"><label class="ecg-label">💊 عند تحديد دواء "تمت دراسته"</label>
            <input type="number" min="0" class="form-input" id="gamRulePharma" value="${gamRules.pharma_branch}" />
          </div>
          <div class="ecg-field" style="flex:1;min-width:170px;"><label class="ecg-label">🔥 عند الالتزام اليومي (Streak)</label>
            <input type="number" min="0" class="form-input" id="gamRuleStreak" value="${gamRules.streak_day}" />
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="gamSaveRulesFromForm()">💾 حفظ قيم الـ XP</button>
      </div>

      <div class="pharma-box pharma-box-visual" style="margin-top:16px;">
        <div class="pharma-box-title">🎁 مكافآتك (أضف/عدّل/احذف)</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div class="ecg-field" style="flex:2;min-width:180px;"><label class="ecg-label">اسم المكافأة</label>
            <input class="form-input" id="gamRewardName" placeholder="مثلاً: ساعة جيمنج" />
          </div>
          <div class="ecg-field" style="flex:1;min-width:100px;"><label class="ecg-label">الكلفة (XP)</label>
            <input type="number" min="1" class="form-input" id="gamRewardCost" placeholder="150" />
          </div>
          <div class="ecg-field" style="flex:0 0 90px;min-width:80px;"><label class="ecg-label">إيموجي</label>
            <input class="form-input" id="gamRewardIcon" placeholder="🎮" maxlength="4" />
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="gamAddRewardFromForm()">➕ إضافة المكافأة</button>
        <div id="gamRewardsAdminList" style="margin-top:14px;max-height:240px;overflow-y:auto;">${gamBuildRewardsAdminListHtml()}</div>
      </div>

      <div class="hx-save-bar">
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove();gamRenderStore();">إغلاق</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function gamBuildRewardsAdminListHtml() {
  if (!gamRewards.length) return '<div style="color:var(--text2);">ما في مكافآت مضافة بعد</div>';
  return gamRewards.map(r => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 4px;border-bottom:1px solid var(--border);">
      <span>${esc(r.icon || '🎁')} ${esc(r.name)} — <span style="color:#FACC15;">${r.cost} XP</span></span>
      <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.72rem;color:var(--red);" onclick="gamDeleteReward('${r.id}')">🗑️</button>
    </div>`).join('');
}

function gamSaveRulesFromForm() {
  gamRules.new_case = Math.max(0, Number(document.getElementById('gamRuleNewCase').value) || 0);
  gamRules.micro_branch = Math.max(0, Number(document.getElementById('gamRuleMicro').value) || 0);
  gamRules.pharma_branch = Math.max(0, Number(document.getElementById('gamRulePharma').value) || 0);
  gamRules.streak_day = Math.max(0, Number(document.getElementById('gamRuleStreak').value) || 0);
  gamSaveRules();
  showToast('✅ تم حفظ قيم الـ XP');
}

function gamAddRewardFromForm() {
  const name = document.getElementById('gamRewardName').value.trim();
  const cost = Math.max(1, Number(document.getElementById('gamRewardCost').value) || 0);
  const icon = document.getElementById('gamRewardIcon').value.trim() || '🎁';
  if (!name || !cost) { showToast('⚠️ لازم اسم وكلفة صحيحة للمكافأة'); return; }
  gamRewards.push({ id: genId(), name, cost, icon });
  gamSaveRewards();
  document.getElementById('gamRewardName').value = '';
  document.getElementById('gamRewardCost').value = '';
  document.getElementById('gamRewardIcon').value = '';
  document.getElementById('gamRewardsAdminList').innerHTML = gamBuildRewardsAdminListHtml();
  showToast('✅ أضيفت المكافأة');
}

function gamDeleteReward(id) {
  gamRewards = gamRewards.filter(r => r.id !== id);
  gamSaveRewards();
  const listEl = document.getElementById('gamRewardsAdminList');
  if (listEl) listEl.innerHTML = gamBuildRewardsAdminListHtml();
  showToast('🗑️ تم حذف المكافأة');
}

(async function boot() {
  const restoredFromIndexedDB = await hydrateLocalStorageFromAppState();
  await migrateLocalStorageToAppState();
  if (restoredFromIndexedDB && !sessionStorage.getItem('drmonic_reloaded_after_restore')) {
    sessionStorage.setItem('drmonic_reloaded_after_restore', '1');
    location.reload();
    return;
  }
  if (!restoredFromIndexedDB) sessionStorage.removeItem('drmonic_reloaded_after_restore');
  await initCasesStorage();
  gamLoadData();
  gamUpdateBalanceBadges();
  gamCheckDailyStreak();
  renderSpecialtyControls();
  if (!importSharedCaseFromHash()) renderCases();
  renderQotd();
  initAiAssistant();
  initIconDock();
  initOnboarding();
  const __existingProfile = getUserProfile();
  if (__existingProfile) showWelcomeSplash(__existingProfile);
  scheduleAutoBackup();
})();

const DOCK_LIBRARY = {
  home:     { icon:'🏠', title:'الرئيسية',       action:"window.scrollTo({top:0,behavior:'smooth'})" },
  search:   { icon:'🔍', title:'بحث',             action:"document.querySelector('.consultant-search')?.scrollIntoView({behavior:'smooth',block:'center'});document.querySelector('.consultant-search')?.focus()" },
  theme:    { icon:'🎨', title:'تبديل الثيم',      action:"toggleTheme()" },
  pomodoro: { icon:'⏱️', title:'بومودورو',        action:"pomodoroTogglePanel()" },
  note:     { icon:'🎙️', title:'ملاحظة سريعة (راوند)', action:"openRoundNoteRecorder()" },
  ai:       { icon:'🤖', title:'المساعد الذكي',    action:"document.getElementById('aiAssistantFab')?.click()" },
  newCase:  { icon:'✚',  title:'حالة جديدة',       action:"openCreateModal()" },
  notes:    { icon:'✎',  title:'ملاحظاتي',         action:"showNotesView()" },
  backup:   { icon:'💾', title:'تصدير نسخة احتياطية', action:"exportFullBackup()" },
  settings: { icon:'⚙️', title:'الإعدادات',        action:"showAdmin()" },
  qbank:    { icon:'🧠', title:'MonicQbank',        action:"showMonicQbankView()" },
  mcq:      { icon:'🎲', title:'MCQ عشوائي',        action:"showMcqQuizView()" },
  history:  { icon:'📋', title:'التاريخ المرضي',   action:"showHistoryView()" },
  lab:      { icon:'🧪', title:'قيم التحاليل',      action:"showLabValuesView()" },
  ecg:      { icon:'🫀', title:'ECG Library',       action:"showEcgLibraryView()" },
  xray:     { icon:'🩻', title:'أطلس الأشعة',       action:"showXrayLibraryView()" },
  pharma:   { icon:'💊', title:'Pharmacology Cards', action:"showPharmaLibraryView()" },
  interact: { icon:'🔀', title:'تفاعلات الأدوية',   action:"showInteractionsView()" },
  compare:  { icon:'⚔️', title:'قارن الاثنين',      action:"showCompareView()" },
  microTree:{ icon:'🦠', title:'شجرة الأحياء الدقيقة', action:"showMicroTreeView()" },
  gamify:   { icon:'🏆', title:'متجر المكافآت والتحفيز', action:"showGamificationView()" },
  redFlags: { icon:'🚩', title:'Red Flags Checklist', action:"showRedFlagsView()" },
  analytics:{ icon:'📊', title:'الإنجاز والتحليل الشخصي', action:"showAnalyticsView()" },
  abbrev:   { icon:'🩺', title:'بنك الاختصارات الطبية', action:"showAbbrevView()" },
};
const DOCK_DEFAULT_ORDER = ['home','theme','pomodoro','history','note'];

function getDockConfig() {
  let cfg = JSON.parse(localStorage.getItem('drmonic_dock_config') || 'null');
  if (!cfg) cfg = { order: DOCK_DEFAULT_ORDER.slice(), shape: 'circle', size: 'md', side: 'end' };
  if (!cfg.order || !cfg.order.length) cfg.order = DOCK_DEFAULT_ORDER.slice();
  return cfg;
}
function saveDockConfig(cfg) { safeLocalSet('drmonic_dock_config', JSON.stringify(cfg)); }

function initIconDock() {
  const dock = document.getElementById('iconDock');
  if (!dock) return;
  renderDock();

  let dragged = null;
  dock.addEventListener('dragstart', e => {
    if (!e.target.classList.contains('dock-btn')) return;
    dragged = e.target; dragged.style.opacity = '0.4';
  });
  dock.addEventListener('dragend', e => {
    if (!e.target.classList.contains('dock-btn')) return;
    e.target.style.opacity = '1';
    dock.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('dock-drag-over'));
    const cfg = getDockConfig();
    cfg.order = Array.from(dock.querySelectorAll('.dock-btn')).map(b => b.dataset.key);
    saveDockConfig(cfg);
  });
  dock.addEventListener('dragover', e => {
    const btn = e.target.closest('.dock-btn');
    if (!btn || btn === dragged) return;
    e.preventDefault(); btn.classList.add('dock-drag-over');
  });
  dock.addEventListener('dragleave', e => {
    const btn = e.target.closest('.dock-btn');
    if (btn) btn.classList.remove('dock-drag-over');
  });
  dock.addEventListener('drop', e => {
    const btn = e.target.closest('.dock-btn');
    if (!btn || !dragged || btn === dragged) return;
    e.preventDefault();
    btn.classList.remove('dock-drag-over');
    const all = Array.from(dock.children).filter(el => el.classList.contains('dock-btn'));
    const draggedIdx = all.indexOf(dragged), targetIdx = all.indexOf(btn);
    if (draggedIdx < targetIdx) btn.after(dragged); else btn.before(dragged);
    const cfg = getDockConfig();
    cfg.order = Array.from(dock.querySelectorAll('.dock-btn')).map(b => b.dataset.key);
    saveDockConfig(cfg);
  });
}

function renderDock() {
  const dock = document.getElementById('iconDock');
  if (!dock) return;
  const cfg = getDockConfig();
  dock.className = `icon-dock dock-shape-${cfg.shape} dock-size-${cfg.size} dock-side-${cfg.side}`;
  dock.innerHTML = '';
  cfg.order.forEach(key => {
    const item = DOCK_LIBRARY[key];
    if (!item) return;
    const btn = document.createElement('button');
    btn.className = 'dock-btn'; btn.draggable = true; btn.dataset.key = key; btn.title = item.title;
    btn.textContent = item.icon;
    btn.addEventListener('click', () => { try { (new Function(item.action))(); } catch(e) { console.warn(e); } });
    dock.appendChild(btn);
  });
  const gear = document.createElement('button');
  gear.className = 'dock-btn dock-gear'; gear.title = 'تخصيص الشريط';
  gear.textContent = '⚙️';
  gear.addEventListener('click', openDockCustomize);
  dock.appendChild(gear);
}

function openDockCustomize() {
  const cfg = getDockConfig();
  const list = document.getElementById('dockItemsList');
  list.innerHTML = Object.entries(DOCK_LIBRARY).map(([key, item]) => `
    <label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--border);border-radius:10px;cursor:pointer;">
      <input type="checkbox" ${cfg.order.includes(key) ? 'checked' : ''} onchange="toggleDockItem('${key}', this.checked)" />
      <span>${item.icon}</span><span>${item.title}</span>
    </label>`).join('');
  ['Circle','Square'].forEach(s => document.getElementById(`dockShape${s}Btn`)?.classList.toggle('btn-primary', cfg.shape === s.toLowerCase()));
  ['Sm','Md','Lg'].forEach(s => document.getElementById(`dockSize${s}Btn`)?.classList.toggle('btn-primary', cfg.size === s.toLowerCase()));
  ['End','Start'].forEach(s => document.getElementById(`dockSide${s}Btn`)?.classList.toggle('btn-primary', cfg.side === s.toLowerCase()));
  document.getElementById('dockCustomizeModal').classList.add('open');
}
function closeDockCustomize() { document.getElementById('dockCustomizeModal').classList.remove('open'); }
function toggleDockItem(key, checked) {
  const cfg = getDockConfig();
  if (checked && !cfg.order.includes(key)) cfg.order.push(key);
  if (!checked) cfg.order = cfg.order.filter(k => k !== key);
  saveDockConfig(cfg); renderDock();
}
function setDockShape(shape) { const cfg = getDockConfig(); cfg.shape = shape; saveDockConfig(cfg); renderDock(); openDockCustomize(); }
function setDockSize(size) { const cfg = getDockConfig(); cfg.size = size; saveDockConfig(cfg); renderDock(); openDockCustomize(); }
function setDockSide(side) { const cfg = getDockConfig(); cfg.side = side; saveDockConfig(cfg); renderDock(); openDockCustomize(); }

/* ── Quick Round Note Recorder ── */
let roundNoteRecorder = null, roundNoteChunks = [], roundNoteStream = null, roundNoteTimerInt = null, roundNoteSeconds = 0;
function openRoundNoteRecorder() {
  document.getElementById('roundNoteModal').classList.add('open');
  renderRoundNotesList();
}
function closeRoundNoteRecorder() {
  document.getElementById('roundNoteModal').classList.remove('open');
  if (roundNoteRecorder && roundNoteRecorder.state === 'recording') toggleRoundNoteRecording();
}
async function toggleRoundNoteRecording() {
  const btn = document.getElementById('roundNoteRecBtn');
  const hint = document.getElementById('roundNoteHint');
  if (roundNoteRecorder && roundNoteRecorder.state === 'recording') {
    roundNoteRecorder.stop();
    roundNoteStream?.getTracks().forEach(t => t.stop());
    clearInterval(roundNoteTimerInt);
    btn.textContent = '🎙️'; btn.classList.remove('btn-danger'); hint.textContent = 'جاري الحفظ...';
    return;
  }
  try {
    roundNoteStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    roundNoteChunks = [];
    roundNoteRecorder = new MediaRecorder(roundNoteStream);
    roundNoteRecorder.ondataavailable = e => roundNoteChunks.push(e.data);
    roundNoteRecorder.onstop = async () => {
      const blob = new Blob(roundNoteChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        saveRoundNote({ type:'audio', data: reader.result, ts: Date.now(), duration: roundNoteSeconds });
        hint.textContent = 'اضغط عالمايك عشان تسجل ملاحظة صوتية سريعة';
      };
      reader.readAsDataURL(blob);
    };
    roundNoteRecorder.start();
    roundNoteSeconds = 0;
    document.getElementById('roundNoteTimer').textContent = '00:00';
    roundNoteTimerInt = setInterval(() => {
      roundNoteSeconds++;
      const m = String(Math.floor(roundNoteSeconds/60)).padStart(2,'0');
      const s = String(roundNoteSeconds%60).padStart(2,'0');
      document.getElementById('roundNoteTimer').textContent = `${m}:${s}`;
    }, 1000);
    btn.textContent = '⏹️'; btn.classList.add('btn-danger'); hint.textContent = '🔴 عم يسجل الآن... اضغط للإيقاف';
  } catch (err) {
    showToast('⚠️ ما قدرنا نوصل للمايك — تأكد من صلاحية المتصفح');
  }
}
function saveRoundTextNote() {
  const text = document.getElementById('roundNoteText').value.trim();
  if (!text) return;
  saveRoundNote({ type:'text', data: text, ts: Date.now() });
  document.getElementById('roundNoteText').value = '';
}
function saveRoundNote(note) {
  const notes = JSON.parse(localStorage.getItem('drmonic_round_notes') || '[]');
  notes.unshift(note);
  localStorage.setItem('drmonic_round_notes', JSON.stringify(notes));
  renderRoundNotesList();
  showToast('✅ تم حفظ الملاحظة');
}
function deleteRoundNote(idx) {
  const notes = JSON.parse(localStorage.getItem('drmonic_round_notes') || '[]');
  notes.splice(idx, 1);
  localStorage.setItem('drmonic_round_notes', JSON.stringify(notes));
  renderRoundNotesList();
}
