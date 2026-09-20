// ════════════════════════════════════════════════
//  DHIKR REMINDER BUBBLE
//  A small corner popup that cycles through authentic adhkar/du'as
//  every so often, on/off + interval controlled from ⚙️ الإعدادات.
//  Storage key: drmonic_dhikr_settings  →  { enabled, intervalSec }
// ════════════════════════════════════════════════

const DHIKR_SETTINGS_KEY = 'drmonic_dhikr_settings';
const DHIKR_DEFAULT_SETTINGS = { enabled: true, intervalSec: 60 };
const DHIKR_DURATION_MS = 4200; // how long the bubble stays visible

const DHIKR_BANK = [
  { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ", source: "كلمتان خفيفتان على اللسان، ثقيلتان في الميزان" },
  { text: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ", source: "له الملك وله الحمد وهو على كل شيء قدير" },
  { text: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", source: "من صلى عليّ صلاة صلى الله عليه بها عشراً" },
  { text: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", source: "استغفار دائم يفتح أبواب الرزق والفرج" },
  { text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", source: "كنز من كنوز الجنة" },
  { text: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", source: "قالها إبراهيم عليه السلام حين أُلقي في النار" },
  { text: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي", source: "دعاء موسى عليه السلام" },
  { text: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ", source: "ما سُئل الله شيئاً أحب إليه من العافية" },
  { text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", source: "من أجمع الأدعية القرآنية" },
  { text: "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ", source: "شكر يجدد النعمة" }
];

let dhikrSettings = Object.assign({}, DHIKR_DEFAULT_SETTINGS);
let dhikrIdx = -1;
let dhikrTimer = null;
let dhikrHideTimer = null;

function dhikrLoadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(DHIKR_SETTINGS_KEY));
    dhikrSettings = Object.assign({}, DHIKR_DEFAULT_SETTINGS, saved || {});
  } catch (e) {
    dhikrSettings = Object.assign({}, DHIKR_DEFAULT_SETTINGS);
  }
}
function dhikrSaveSettings() {
  safeLocalSet(DHIKR_SETTINGS_KEY, JSON.stringify(dhikrSettings));
}

function dhikrNext() {
  dhikrIdx = (dhikrIdx + 1) % DHIKR_BANK.length;
  return DHIKR_BANK[dhikrIdx];
}

function dhikrShowNow() {
  if (!dhikrSettings.enabled) return;
  const bubble = document.getElementById('dhikrBubble');
  if (!bubble) return;
  const item = dhikrNext();
  document.getElementById('dhikrText').textContent = item.text;
  document.getElementById('dhikrSource').textContent = item.source;

  bubble.classList.remove('show');
  void bubble.offsetWidth; // reflow to restart the progress-bar animation
  bubble.classList.add('show');

  clearTimeout(dhikrHideTimer);
  dhikrHideTimer = setTimeout(() => {
    bubble.classList.remove('show');
  }, DHIKR_DURATION_MS);
}

function dhikrRestartLoop() {
  clearInterval(dhikrTimer);
  if (!dhikrSettings.enabled) return;
  const ms = Math.max(15, dhikrSettings.intervalSec || DHIKR_DEFAULT_SETTINGS.intervalSec) * 1000;
  dhikrTimer = setInterval(dhikrShowNow, ms);
}

function dhikrInit() {
  dhikrLoadSettings();
  if (!document.getElementById('dhikrBubble')) return; // markup not present yet
  dhikrRestartLoop();
  if (dhikrSettings.enabled) {
    setTimeout(dhikrShowNow, 3000); // gentle first appearance after load
  }
}

// ── Settings panel (⚙️ الإعدادات) wiring ──────────────────────
function dhikrRenderSettingsUI() {
  const toggle = document.getElementById('dhikrEnabledToggle');
  const select = document.getElementById('dhikrIntervalSelect');
  if (!toggle || !select) return;
  toggle.checked = !!dhikrSettings.enabled;
  select.value = String(dhikrSettings.intervalSec || DHIKR_DEFAULT_SETTINGS.intervalSec);
  select.disabled = !dhikrSettings.enabled;
}

function dhikrToggleEnabled(checked) {
  dhikrSettings.enabled = checked;
  dhikrSaveSettings();
  dhikrRenderSettingsUI();
  dhikrRestartLoop();
  showToast(checked ? '🔔 تفعّل تذكير الذكر' : '🔕 تم إيقاف تذكير الذكر');
}

function dhikrChangeInterval(value) {
  dhikrSettings.intervalSec = parseInt(value, 10) || DHIKR_DEFAULT_SETTINGS.intervalSec;
  dhikrSaveSettings();
  dhikrRestartLoop();
  showToast('⏱️ تم تحديث توقيت التذكير');
}

function dhikrPreviewNow() {
  if (!dhikrSettings.enabled) { showToast('⚠️ التذكير موقوف حالياً — فعّله أولاً'); return; }
  dhikrShowNow();
}

// boot once the page + other core scripts are ready
document.addEventListener('DOMContentLoaded', dhikrInit);
