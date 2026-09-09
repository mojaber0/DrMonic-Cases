// ════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════
let cases = [];
let settings = JSON.parse(localStorage.getItem('drmonic_settings') || '{}');
let doneCases = new Set(JSON.parse(localStorage.getItem('drmonic_done') || '[]'));
let favoriteCases = new Set(JSON.parse(localStorage.getItem('drmonic_favorites') || '[]'));
let homeMode = localStorage.getItem('drmonic_home_mode') || 'study';
let rapidIndex = 0;
let rapidDirection = 1;
let examIndex = 0;
let examRevealed = false;
let examStats = JSON.parse(localStorage.getItem('drmonic_exam_stats') || '{}');
let openedCases = new Set(JSON.parse(localStorage.getItem('drmonic_opened') || '[]'));
let reviewCards = JSON.parse(localStorage.getItem('drmonic_review_cards') || '[]');
let reviewCardsKnown = new Set(JSON.parse(localStorage.getItem('drmonic_review_known') || '[]'));
let mcqQuizCurrent = null;
let activeNoteId = null;
let currentFilter = 'all';
let searchQuery = '';
let editingIndex = null;
let pendingCaseIndex = null;
let caseImages = [];
let voiceNotes = [];
let voiceRecorder = null;
let voiceChunks = [];
const defaultSpecialties = ['طوارئ','باطني','أطفال','جراحة','نسائية وتوليد','قلبية','عصبية','أخرى'];

// Default messages
if (!settings.msg1) settings.msg1 = 'بسم الله الرحمن الرحيم\n\n"وَقُل رَّبِّ زِدْنِي عِلْمًا"\n\nابدأ بنية التعلم والعطاء، وتذكر أن كل حالة تتعلمها اليوم ستنقذ حياة غداً.';
if (!settings.msg2) settings.msg2 = '🎉 أحسنت يا بطل!\n\nأكملت الحالة بنجاح. كل خطوة في التعلم تقربك من أن تكون طبيباً أفضل وأكثر تأثيراً.\n\nاستمر ولا تتوقف! 💪';

if (!Array.isArray(settings.customSpecialties)) settings.customSpecialties = [];

// MCQ counter
let mcqCount = 0;

function fixArrows(str) {
  return str
    .replace(/\$?\\rightarrow\$?/g, '→')
    .replace(/\$?\\leftarrow\$?/g, '←')
    .replace(/\$?\\Rightarrow\$?/g, '⇒')
    .replace(/\$?\\Leftarrow\$?/g, '⇐');
}

function esc(value) {
  const str = fixArrows(String(value ?? ''));
  return str.replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
}

