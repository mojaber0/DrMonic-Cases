/* ══════════════════════════════════════════════════════════════
   🧠 MonicQbank — AI-generated USMLE Step 1-style vignettes
   ══════════════════════════════════════════════════════════════ */
const QBANK_STORAGE_KEY = 'drmonic_qbank_history';
let qbankSelectedDiff = 'Hard';
let qbankSelectedLang = 'English';
let qbankCurrent = null;

/* أذكار وخواطر — تُستخدم كرسائل تحميل بكل أماكن انتظار الذكاء الاصطناعي بالموقع */
const QBANK_REFLECTIONS = ["سبحان الله وبحمده، سبحان الله العظيم", "الدارُ جَنَّةُ خُلدٍ إِن عَمِلتَ بِما يُرضي الإِلَهَ وَإِن خالفت فَالنارُ", "استغفر الله العظيم وأتوب إليه", "اللهم صلِّ وسلم على نبينا محمد", "لا حول ولا قوة إلا بالله", "سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر", "ابتسم، فتبسمك في وجه أخيك صدقة", "احرص على صلاتك، فهي نجاتك", "لا تنسَ ذكر الله في كل حين، فهو نور القلب", "استغل وقتك في طاعة الله", "اللهم إني أعوذ بك من جهد البلاء، ودرك الشقاء، وسوء القضاء، وشماتة الأعداء", "اللهم إني أعوذ بك من العجز والكسل، والجبن والهرم والبخل، وأعوذ بك من عذاب القبر، ومن فتنة المحيا والممات", "اللهم عافني في بدني", "المسكين كل المسكين من ضاع عمره في علم لم يعمل به، ففاته لذات الدنيا وخيرات الآخرة", "من أحب أن لا ينقطع عمله بعد موته فلينشر العلم", "الدنيا سِحرٌ أخطر من سحر هاروت وماروت: سحرها يفرق العبد عن ربه", "اجعل نيتك خالصة لله", "يا ابن آدم إنما أنت أيام، كلما ذهب يوم ذهب بعضك", "اللهم اجعلني من الصالحين", "فَلَيسَت هَذِهِ الدُنيا بِشَيءٍ، تَسوؤُكَ حُقبَةً وَتَسُرُّ وَقتا", "الحمد لله على كل حال", "يا مقلب القلوب ثبت قلبي على دينك", "اللهم إني أسألك الهدى والتقى والعفاف والغنى", "اللهم أحسن عاقبتنا في الأمور كلها", "النية الصادقة أساس كل عمل صالح", "الوقت أنفاس لا تعود؛ اغتنمه بالطاعة", "لا تؤجل التوبة؛ فالموت يأتي بغتة", "اللهم إني وكلتُك أمري فكُن لي خير وكيل ودبر أمري فإني لا أحسن التدبير", "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، يحيي ويميت وهو على كل شيء قدير", "كُن سبباً في كثرة الصلاة على النبي ﷺ", "﴿وَذَكِّرْ فَإِنَّ الذِّكْرَىٰ تَنْفَعُ الْمُؤْمِنِينَ﴾", "إِنَّ أَكْرَمَكُمْ عِنْدَ اللَّهِ أَتْقَاكُمْ", "قال تعالى في الحديث القدسي: ولا يزال عبدي يتقرَّب إلي بالنوافل حتى أُحبَّه", "وإذا البشائر لم تحن أوقاتها، فلحكمةٍ عند الإلهِ تأخرت... وغدا سيجري دمع عينك فرحة، وترى السحائب بالأماني أمطرت", "لن ينسَ الله خيرًا قدمته، أو همًا فرّجته، أو عينًا كادت أن تبكي فأسعدتها!", "اللهم إني أسألك الجنة وأعوذ بك من النار", "اللهم آت نفسي تقواها وزكها أنت خير من زكاها", "اللهم أصلح لي ديني الذي هو عصمة أمري", "اللهم انفعني بما علمتني وعلمني ما ينفعني", "إذا قرأتَ القرآنَ فلا تجعَل همَّك بُلوغَ نهاية السُّورة، بل اجعل همَّك بلوغَ مُرَادِ الله منكَ في الآية التي تقرَؤُها", "قال تعالى: { يَا لَيْتَنِي قَدَّمْتُ لِحَيَاتِي } أُمنيات أهل القبور بين يديك فتداركها مادامت الروح في الجسد", "اللهم اغفر لي ذنبي كله، دقه وجله، أوله وآخره، علانيته وسره، ما علمتُ منه وما لم أعلم", "قال رسول الله ﷺ: من أصبح منكم آمناً في سربه، معافى في جسده، عنده قوت يومه، فكأنما حيزت له الدنيا", "أول ما يحاسب به العبد يوم القيامة الصلاة، فإن صلحت صلح سائر عمله، وإن فسدت فسد سائر عمله", "الراحمون يرحمهم الرحمن. ارحموا من في الأرض يرحمكم من في السماء", "اللهم إنك عفو كريم تحب العفو فاعفُ عني", "يا حي يا قيوم برحمتك أستغيث", "اللهم آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار", "اللهم مصرف القلوب صرف قلوبنا على طاعتك", "اللهم إني أعوذ بك من عذاب القبر، ومن عذاب النار", "اللهم إني أعوذ بك من فتنة المحيا والممات، ومن فتنة المسيح الدجال", "اللهم إني أعوذ بك من زوال نعمتك، وتحول عافيتك، وفجاءة نقمتك", "اللهم اغفر لي ذنبي كله، دِقّه وجِله، وأوله وآخره وعلانيته وسره", "اللهم إني ظلمت نفسي ظلماً كثيراً، ولا يغفر الذنوب إلا أنت، فاغفر لي", "اللهم اهدني وسددني", "اللهم إني أسألك علماً نافعاً، ورزقاً طيباً، وعملاً متقبلاً", "اللهم إني أعوذ بك من علم لا ينفع، ومن قلب لا يخشع", "اللهم إني أعوذ بك من عين لا تدمع، ومن نفس لا تشبع", "اللهم إني أعوذ بك من دعوة لا يستجاب لها", "اللهم أصلح لي دنياي التي فيها معاشي", "اللهم أصلح لي آخرتي التي فيها معادي", "اللهم اجعل الحياة زيادة لي في كل خير، والموت راحة لي من كل شر", "اللهم اغفر لي، وارحمني، واهدني، وعافني، وارزقني", "اللهم إني أعوذ بك من شر ما عملت، ومن شر ما لم أعمل", "اللهم أكثر مالي، وولدي، وبارك لي فيما أعطيتني", "لا إله إلا أنت سبحانك إني كنت من الظالمين", "اللهم رحمتك أرجو فلا تكلني إلى نفسي طرفة عين", "اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل", "اللهم بعلمك الغيب، وقدرتك على الخلق، أحيني ما علمت الحياة خيراً لي", "اللهم وأسألك خشيتك في الغيب والشهادة", "اللهم وأسألك كلمة الحق في الرضا والغضب", "اللهم وأسألك القصد في الفقر والغنى", "اللهم وأسألك نعيماً لا ينفد، وقرة عين لا تنقطع", "اللهم وأسألك الرضا بعد القضاء، وبرد العيش بعد الموت", "اللهم وأسألك لذة النظر إلى وجهك والشوق إلى لقائك", "اللهم زينا بزينة الإيمان، واجعلنا هداة مهتدين", "اللهم رب جبرائيل وميكائيل وإسرافيل، فاطر السموات والأرض، اهدني لما اختلف فيه من الحق", "اللهم إني أعوذ برضاك من سخطك، وبمعافاتك من عقوبتك", "اللهم لا مانع لما أعطيت، ولا معطي لما منعت، ولا ينفع ذا الجد منك الجد", "اللهم نقني من الخطايا كما ينقى الثوب الأبيض من الدنس", "اللهم اغسل خطاياي بالماء والثلج والبرد", "اللهم إني أعوذ بك من الجوع، فإنه بئس الضجيع", "اللهم إني أعوذ بك من الخيانة، فإنها بئست البطانة", "اللهم متّعني بسمعي وبصري، واجعلهما الوارث مني", "اللهم انصرني على من يظلمني، وخذ منه بثأري", "اللهم إني أعوذ بك من غلبة الدين، وغلبة العدو، وشماتة الأعداء", "اللهم اغفر لي خطيئتي، وجهلي، وإسرافي في أمري", "اللهم ارحم تضرعي بين يديك، وتقبل صلاتي", "اللهم إني أسألك الجنة وما قرب إليها من قول أو عمل", "اللهم إني أعوذ بك من النار وما قرب إليها من قول أو عمل", "يا حي يا قيوم برحمتك أستغيث، أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين", "اللهم إني أعوذ بك من منكرات الأخلاق، والأعمال، والأهواء", "اللهم إني أسألك العافية في الدنيا والآخرة", "اللهم أعني على ذكرك وشكرك وحسن عبادتك", "اللهم اغفر لي ما قدمت وما أخرت، وما أسررت وما أعلنت", "اللهم اجعل في قلبي نوراً، وفي بصري نوراً، وفي سمعي نوراً", "اللهم إني أسألك من الخير كله عاجله وآجله", "اللهم إني أعوذ بك من الشر كله عاجله وآجله", "اللهم احفظني بالإسلام قائماً، واحفظني بالإسلام قاعداً", "اللهم إني أسألك حُبّك، وحب من يحبك، والعمل الذي يبلغني حبك", "اللهم اجعل حبك أحب إلي من نفسي وأهلي ومن الماء البارد", "اللهم انفعني بما علمتني، وعلمني ما ينفعني، وزدني علماً", "اللهم إني أعوذ بك من البرص، والجنون، والجذام، ومن سيئ الأسقام", "اللهم إني أسألك الثبات في الأمر، والعزيمة على الرشد", "اللهم إني أسألك شكر نعمتك، وحسن عبادتك", "اللهم إني أسألك قلباً سليماً، ولساناً صادقاً", "اللهم اكفني بحلالك عن حرامك، وأغنني بفضلك عمن سواك", "اللهم استر عوراتي، وآمن روعاتي", "اللهم اجعل أوسع رزقك عليّ عند كبر سني، وانقطاع عمري", "اللهم إني أسألك فعل الخيرات، وترك المنكرات، وحب المساكين", "اللهم إني أعوذ بك من الخبث والخبائث", "رب اغفر لي وتب عليّ إنك أنت التواب الرحيم", "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت", "اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري", "اللهم إني أسألك الفردوس الأعلى من الجنة", "الدنيا دار ممر، والآخرة دار مقر؛ فخذوا من ممركم لمقركم", "عش في الدنيا كأنك غريب أو عابر سبيل", "الناس نيام، فإذا ماتوا انتبهوا", "ما من يوم ينشق فجره إلا وينادي: يا ابن آدم أنا خلق جديد، وعلى عملك شهيد", "اجعل الموت بين عينيك، فلن يطول المقام", "العمل الصالح هو الونيس الوحيد في وحشة القبر", "من أصلح ما بينه وبين الله، أصلح الله ما بينه وبين الناس", "كفى بالموت واعظاً", "الدنيا ساعة، فاجعلها طاعة", "ازرع في دنياك ما تحب أن تحصده في أخراك", "كل آتٍ قريب، وكل ما هو فانٍ بعيد", "أحبب ما شئت فإنك مفارقه، واعمل ما شئت فإنك مجزي به", "القبر أول منازل الآخرة؛ فإما روضة أو حفرة", "مكتوب على باب الدنيا: تزودوا فإن خير الزاد التقوى", "لا تنظر إلى صغر المعصية، ولكن انظر إلى عظمة من عصيت", "الندم على الذنب توبة، والعمل الصالح كفارة", "يوم القيامة تسفر الوجوه، فبأي وجه ستلقى ربك؟", "عمرك هو رأس مالك، فلا تضيعه في الباطل", "الصلاة عماد دينك، وبوابة نجاتك", "ذكر الله حياة للقلوب، ورفعة في الدرجات", "تصدق ولو بشق تمرة، فإنها تطفئ غضب الرب", "الدنيا ظل زائل، والآخرة بقاء دائم", "من خاف الوعيد، قَرُب عليه البعيد", "اجعل همك الآخرة، تأتك الدنيا وهي راغمة", "الخلق كلهم عيال الله، وأحبهم إليه أنفعهم لعياله", "لا تغرنك الصحة؛ فالموت يأتي بغتة", "اللسان رائد القلب؛ فاحفظه من الغيبة والنميمة", "بر الوالدين مفتاح من مفاتيح الجنة", "ركعتان في جوف الليل كنز من كنوز الآخرة", "استغفر الله، يفتح لك أبواب الرزق والرحمة", "طوبى لمن وجد في صحيفته استغفاراً كثيراً", "احذر طول الأمل، فإنه ينسي الآخرة", "الجنة مئة درجة، وأدناها لا يخطر على قلب بشر", "النار حُفت بالشهوات، والجنة حُفت بالمكاره", "الصبر عند الصدمة الأولى، والأجر عند الله", "التواضع رفعة، والكبر ذلة", "من ترك شيئاً لله، عوضه الله خيراً منه", "كن في الدنيا كالنحلة؛ لا تأكل إلا طيباً ولا تضع إلا طيباً", "الظلم ظلمات يوم القيامة", "صلة الرحم تزيد في العمر وتوسّع في الرزق", "اتقِ الله حيثما كنت، وأتبع السيئة الحسنة تمحها", "خالق الناس بخلق حسن، تملك قلوبهم", "إن الله طيب لا يقبل إلا طيباً", "الحياء شعبة من الإيمان", "كن يقظاً؛ فالعمر ينقص والذنوب تزيد", "غداً تُوفى النفوس ما كسبت", "يا مغرور بالأمل، الموت يقطع العمل", "أصدق الحديث كتاب الله، وخير الهدي هدي محمد ﷺ", "من سلك طريقاً يلتمس فيه علماً سهل الله له به طريقاً إلى الجنة", "استقم كما أُمرت، تنجُ مما حذرت"];
const QBANK_FUNCTIONAL_LOADING = [
  '📖 عم نراجع أحدث الـ Board-style Questions...',
  '🧬 عم نبني الـ Clinical Vignette خطوة خطوة...',
  '🧪 عم نصمم الـ Distractors الذكية...',
  '🩺 عم نتأكد إن كل تفصيلة إلها هدف...',
  '🎯 عم نضبط الـ High-Yield Clue الأساسي...',
  '⚡ عم نراجع الخيارات مرة أخيرة...',
  '🔍 عم نتأكد إن في إجابة واحدة صحيحة بس...',
  '📚 عم نجهز الشرح التفصيلي...'
];
/** رسائل تحميل عامة تُستخدم بأي مكان بالموقع فيه انتظار للذكاء الاصطناعي */
function aiLoadingMessages(n) {
  const pool = QBANK_FUNCTIONAL_LOADING.concat(QBANK_REFLECTIONS);
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function showMonicQbankView() {
  closeHeaderMoreMenu?.();
  hideAllViews();
  document.getElementById('monicQbankView').classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

function qbankOpenCustomize() {
  document.getElementById('qbankCustomizeModal').classList.add('open');
  qbankSyncToggleButtons();
}
function qbankCloseCustomize() { document.getElementById('qbankCustomizeModal').classList.remove('open'); }

function qbankSyncToggleButtons() {
  document.querySelectorAll('.qbank-diff-btn').forEach(b => {
    b.classList.toggle('btn-primary', b.dataset.v === qbankSelectedDiff);
    b.classList.toggle('btn-ghost', b.dataset.v !== qbankSelectedDiff);
    b.onclick = () => { qbankSelectedDiff = b.dataset.v; qbankSyncToggleButtons(); };
  });
  document.querySelectorAll('.qbank-lang-btn').forEach(b => {
    b.classList.toggle('btn-primary', b.dataset.v === qbankSelectedLang);
    b.classList.toggle('btn-ghost', b.dataset.v !== qbankSelectedLang);
    b.onclick = () => { qbankSelectedLang = b.dataset.v; qbankSyncToggleButtons(); };
  });
}

function qbankGetHistory() { return JSON.parse(localStorage.getItem(QBANK_STORAGE_KEY) || '[]'); }
function qbankSaveToHistory(q) {
  const list = qbankGetHistory();
  list.unshift({ id: 'q' + Date.now(), ts: Date.now(), topic: q.topic || 'عشوائي', data: q });
  if (list.length > 100) list.length = 100;
  localStorage.setItem(QBANK_STORAGE_KEY, JSON.stringify(list));
}
function qbankShowHistory() {
  const list = qbankGetHistory();
  const wrap = document.getElementById('qbankHistoryList');
  wrap.innerHTML = !list.length
    ? `<p style="text-align:center;color:var(--text2);font-size:0.85rem;">لسا ما ولّدت أي سؤال</p>`
    : list.map(item => `
      <div class="qbank-history-item" onclick="qbankOpenFromHistory('${item.id}')">
        <span>${esc(item.topic)}</span>
        <span style="color:var(--text2);font-size:0.72rem;">${new Date(item.ts).toLocaleDateString('ar')}</span>
      </div>`).join('');
  document.getElementById('qbankHistoryModal').classList.add('open');
}
function qbankCloseHistory() { document.getElementById('qbankHistoryModal').classList.remove('open'); }
function qbankOpenFromHistory(id) {
  const item = qbankGetHistory().find(x => x.id === id);
  if (!item) return;
  qbankCloseHistory();
  showMonicQbankView();
  qbankRenderQuestion(item.data);
}

// ══ MonicQbank prompt engine — NO AI call inside the site.
// The exact master prompt below is sent verbatim (unchanged) to whatever AI the user
// chooses (ChatGPT, Gemini, Claude...); only the JSON output-format instructions are
// appended so the AI returns structured data instead of free-text prose.
const QBANK_MASTER_PROMPT = `You are an expert USMLE Step 1 question writer and clinical reasoning designer.

Your task is NOT simply to write a difficult medical question.

Your task is to construct an original, high-quality USMLE Step 1-style clinical vignette that reproduces the reasoning architecture, information hierarchy, distractor design, and test-taking logic of high-yield board-style questions.

The question must feel like a real board-style question rather than a textbook recall question.

==================================================
CORE OBJECTIVE
==================================================

Build ONE single-best-answer clinical vignette that tests a specific high-yield medical concept.

The examinee should need to:

1. Recognize the clinical pattern.
2. Identify the highest-yield clue(s).
3. Connect multiple pieces of information.
4. Infer the underlying diagnosis/mechanism/pathophysiology/etc.
5. Distinguish the correct answer from closely related alternatives.
6. Use missing expected findings to eliminate distractors when appropriate.
7. Arrive at ONE clearly superior answer.

Do not make the question solvable merely by spotting an isolated keyword unless the concept is intentionally a classic buzzword association.

==================================================
QUESTION DESIGN PHILOSOPHY
==================================================

Think like a sophisticated USMLE item writer.

The vignette should contain:

- realistic clinical context
- a coherent patient
- purposeful demographic information
- relevant but not excessive history
- a small number of high-value clues
- appropriate timing when clinically meaningful
- carefully selected physical examination findings
- strategically selected laboratory/imaging/pathology findings
- a question stem that tests one precise learning objective

Not every sentence should reveal the answer.

Some information may serve as:
- context
- a distractor
- risk-factor support
- exclusion of a competing diagnosis
- setup for a mechanistic inference

However, NEVER add random details simply to make the vignette longer.

Every detail must have a reason to exist.

==================================================
CLINICAL VIGNETTE STRUCTURE
==================================================

Prefer the following architecture when appropriate:

A. PATIENT PROFILE
- Age
- Sex
- Relevant demographic/risk information
- Clinical setting

B. PRESENTING PROBLEM
- Main complaint
- Duration
- Progression
- Important associated symptoms

C. CONTEXTUAL CLUES
- PMH
- Medications
- Pregnancy status
- Exposure
- Recent procedure
- Infection
- Travel
- Family history
- Relevant social history

D. TARGETED EXAM
Include only findings that contribute to the intended reasoning pathway.

E. DATA
Use laboratories, imaging, pathology, ECG, microscopy, or other data when they strengthen the reasoning chain.

F. HIGH-VALUE CLUE
Include at least one major discriminator that should allow an expert examinee to identify the intended direction.

G. QUESTION
Ask ONE precise question.

==================================================
INFORMATION HIERARCHY
==================================================

Design the vignette so the information has different weights.

Create:

- 1–3 PRIMARY clues
- 1–3 SUPPORTING clues
- 0–3 realistic distractor/context clues

The correct answer must depend mainly on the primary clues.

Do NOT make every piece of information equally important.

The question should reward prioritizing high-yield information.

==================================================
REASONING CHAIN
==================================================

Before writing the final question, internally construct this chain:

CLUE 1
→ what does it suggest?

CLUE 2
→ what does it suggest?

CLUE 3
→ what does it suggest?

COMBINED PATTERN
→ what diagnosis/mechanism/process is most likely?

TESTED CONCEPT
→ what exact Step 1 knowledge is being tested?

ANSWER
→ why is the correct option the best answer?

Then construct the vignette so that this reasoning chain is inferable but not explicitly stated.

==================================================
QUESTION TYPE
==================================================

Choose ONE dominant question type:

- Most likely diagnosis
- Mechanism of disease
- Pathophysiology
- Mechanism of action
- Adverse drug reaction
- Receptor/pathogen interaction
- Next best diagnostic test
- Next best management step
- Treatment
- Complication
- Prognosis
- Epidemiology
- Anatomy
- Histopathology
- Laboratory interpretation
- Physiologic consequence
- Genetic association
- Pharmacologic association

Do not accidentally test multiple unrelated concepts.

A secondary concept may be required to solve the question, but one must be clearly dominant.

==================================================
TIMELINE ENGINEERING
==================================================

When the disease has an important temporal evolution, use timing deliberately.

Examples of useful temporal anchors include:

- minutes
- hours
- 24–72 hours
- several days
- weeks
- months
- first trimester
- postpartum period
- after surgery
- after starting a medication
- after stopping a medication
- after exposure

The time interval must change the differential diagnosis or the expected complication.

Never add a timeline merely for decoration.

==================================================
LABORATORY ENGINEERING
==================================================

Laboratory values must serve a purpose.

Use:

- clearly abnormal values for major abnormalities
- normal values when they actively exclude a distractor
- combinations of values when pattern recognition is important

Avoid borderline values unless the borderline value itself is the teaching point.

Do not create ambiguity by using values that could reasonably be interpreted in multiple ways.

When using labs, know exactly:
1. which abnormality matters,
2. which abnormalities are incidental,
3. why each included normal value is present.

==================================================
IMAGE / PATHOLOGY ENGINEERING
==================================================

When the selected concept commonly uses a visual clue, create the question around recognizable morphology.

The visual clue may represent:

- gross pathology
- histology
- peripheral smear
- dermatologic finding
- ophthalmologic finding
- radiology
- ECG
- microscopy

Do not simply name the diagnosis in the description.

Describe or imply the finding in the way a board-style question would present it.

The examinee should be able to connect:

IMAGE/MORPHOLOGY
→ recognizable pattern
→ disease
→ tested mechanism/association

==================================================
BUZZWORD CONTROL
==================================================

Use memorable clues strategically.

A high-yield clue should narrow the differential substantially.

Examples of clue types:

- characteristic symptom
- distinctive physical finding
- unique laboratory abnormality
- classic medication
- unusual exposure
- characteristic age/context
- highly specific timeline
- pathognomonic morphology

Do not overload the question with multiple buzzwords that make the answer trivial unless intentional.

The goal is recognition plus reasoning, not keyword scavenging.

==================================================
DISTRACTOR ENGINEERING
==================================================

Create four wrong answer choices that are medically plausible.

For EACH distractor, internally define:

1. What disease/concept does this option represent?
2. Why could a student reasonably choose it?
3. What clue would have made it correct?
4. Why is that clue absent or contradicted in this vignette?

Distractors should come from the SAME conceptual neighborhood.

Avoid obviously ridiculous answers.

BAD:
Correct = aminoglycoside
Wrong = myocardial infarction
Wrong = appendicitis
Wrong = hypothyroidism
Wrong = asthma

GOOD:
Correct = aminoglycoside
Wrong = tetracycline
Wrong = macrolide
Wrong = chloramphenicol
Wrong = trimethoprim

==================================================
THE "WHAT WOULD THEY HAVE TOLD ME?" RULE
==================================================

For every answer choice, ask:

"If the test writer wanted this option to be correct, what would they have put in the vignette?"

Use the answer to construct intelligent distractors.

Examples:

If a drug causes:
- nephrotoxicity
- hyperglycemia

then the vignette can distinguish it from another immunosuppressant by NOT providing those findings and instead providing the competing drug's characteristic adverse effect.

If a diagnosis usually requires:
- specific exposure
- characteristic physical finding
- characteristic laboratory pattern
- timing
- imaging feature

then that evidence should be included only when the diagnosis is intended to be correct.

Do not rely on pure absence when the absence would be unfair.
Use absence as a supportive discriminator, not the sole evidence, unless the underlying medical concept genuinely depends on exclusion.

==================================================
BAIT / TRAP DESIGN
==================================================

When appropriate, deliberately create one attractive "classic answer" trap.

Examples of trap logic:

- The famous drug is listed but was discontinued years ago.
- A medication suggests a syndrome, but the defining physical finding is absent.
- A common diagnosis fits one clue but conflicts with the timeline.
- A laboratory finding appears compatible with several diagnoses, but one additional clue makes only one answer best.
- A highly recognizable association is tempting, but the clinical context points elsewhere.

The trap must be fair.

Never create an answer choice that is technically correct under normal clinical reasoning but declare it wrong because of an arbitrary hidden rule.

==================================================
ANSWER CHOICE CONSTRUCTION
==================================================

All options must be grammatically parallel.

Keep options similar in:
- specificity
- length
- abstraction level
- medical category

Do not make the correct answer longer, more detailed, or linguistically different from the distractors.

Avoid:
- "All of the above"
- "None of the above"
- giveaway wording
- obviously wrong categories
- double answers
- overlapping choices

There must be ONE best answer.

==================================================
DIFFICULTY
==================================================

Target difficulty: HIGH but FAIR.

The question should challenge:
- pattern recognition
- integration of clues
- discrimination between similar concepts
- mechanism-based reasoning
- temporal reasoning
- answer-choice elimination

Do NOT increase difficulty by:
- using obscure trivia
- hiding essential information
- making the wording unnecessarily convoluted
- giving multiple technically correct answers
- relying on obscure exceptions unless that exception is the intended learning objective

Difficulty should come from reasoning, not ambiguity.

==================================================
TEST-TAKER RECOVERY PATH
==================================================

A strong question should allow multiple legitimate routes to the answer:

PATH A:
Direct knowledge → answer.

PATH B:
Clinical pattern recognition → answer.

PATH C:
Partial knowledge + answer-choice elimination → answer.

PATH D:
Work backwards from distractors → eliminate alternatives.

The question should remain solvable by an intelligent examinee who knows most, but not all, of the relevant facts.

==================================================
HIGH-YIELD KNOWLEDGE DENSITY
==================================================

Prefer uniquely discriminating facts over generic symptoms.

Do not waste the tested concept on:
- generic headache
- generic nausea
- generic fatigue
- generic pain

unless those symptoms matter in combination.

When testing adverse drug reactions, prioritize characteristic/high-yield adverse effects.

When testing pathogens, prioritize:
- transmission
- age/context
- characteristic syndrome
- receptor
- virulence factor
- laboratory pattern

When testing pathology, prioritize:
- morphology
- tissue
- location
- microscopic pattern
- molecular association

When testing physiology, prioritize:
- mechanism
- direction of change
- upstream/downstream relationship
- compensatory response

==================================================
ORIGINALITY
==================================================

Create a COMPLETELY ORIGINAL vignette.

Do not copy wording, numbers, character details, sentence structure, or answer-choice phrasing from existing questions.

You may reproduce the underlying educational architecture and reasoning style.

Do not imitate a copyrighted question verbatim.

==================================================
INTERNAL QUALITY CONTROL
==================================================

Before returning the question, silently perform this audit:

1. Is there exactly ONE best answer?
2. Is the intended diagnosis/concept actually inferable?
3. Are the most important clues clearly present?
4. Does every major clue serve a purpose?
5. Are distractors from the same conceptual neighborhood?
6. Does each distractor have a plausible rationale?
7. Would a knowledgeable examinee be able to explain why the wrong choices are wrong?
8. Is there a fair "what would they have told me?" distinction?
9. Is the timeline medically coherent?
10. Are the laboratory values internally coherent?
11. Is the question testing one dominant concept?
12. Is the difficulty caused by reasoning rather than ambiguity?
13. Is the correct answer not identifiable merely by wording or option length?
14. Could the question realistically appear on a Step 1-style exam?
15. Did you avoid unnecessary trivia?
16. Is the final answer defensible based ONLY on information available in the vignette and standard medical knowledge?

If any answer is NO, revise the question before presenting it.
`;

const QBANK_TOPIC_MODULE_TEMPLATE = `==================================================
TOPIC CONTROL MODULE
==================================================

Generate the question specifically around:

TOPIC:
[INSERT TOPIC]

SUBTOPIC:
[INSERT SUBTOPIC]

PRIMARY LEARNING OBJECTIVE:
[What exactly should the student be able to answer?]

QUESTION TYPE:
[Diagnosis / Mechanism / Pathophysiology / Treatment / Next best step / ADR / Receptor / etc.]

TARGET DIFFICULTY:
[Easy / Moderate / Hard / Very Hard]

TARGET STUDENT LEVEL:
[Basic Step 1 / Advanced Step 1]

CORE KNOWLEDGE TO TEST:
[Insert the specific fact or relationship]

IMPORTANT COMPETING CONCEPTS:
[List 2–5 closely related diagnoses/mechanisms/drugs that should become distractors]

DESIRED TRAP:
[Optional: specify the misconception you want to exploit]

DESIRED HIGH-YIELD CLUE:
[The major clue that should unlock the question]

DESIRED SECONDARY CLUE:
[Optional]

TIMELINE:
[Optional]

PATIENT CONTEXT:
[Age / sex / pregnancy / hospital / outpatient / surgery / infection / etc.]

DATA TYPE:
[None / labs / ECG / imaging / pathology / physical exam / medication list]

IMAGE-BASED:
[Yes / No]

IF YES:
Design the case so that the image itself supplies the key discriminator.

REASONING DEPTH:
[Single-step / Two-step / Multi-step]

ELIMINATION POTENTIAL:
[Low / Moderate / High]

DISTRactor STRATEGY:
Make the incorrect answers represent the most tempting neighboring concepts.

IMPORTANT:
Do not explicitly state the diagnosis in the vignette.
Do not make the answer obvious from a single trivial keyword unless that keyword is the intended teaching point.`;

const QBANK_SINGLE_SCHEMA_HINT = `{
  "specialty": "Hematology",
  "system": "USMLE Step 1 \u2022 Hematology",
  "vignette": "Paragraph 1 of the clinical case.\\n\\nParagraph 2 of the clinical case (physical exam etc.).",
  "labs": [
    {"name":"Hemoglobin","value":"8.8 g/dL","flag":"down","refRange":"12.0 - 17.5 g/dL","isClue":false},
    {"name":"Serum Ferritin","value":"9 ng/mL","flag":"critical","refRange":"20-200 ng/mL (Depleted Stores!)","isClue":true}
  ],
  "additionalFindings": "Optional closing finding, e.g. peripheral smear description (use \"\" if none).",
  "question": "The single precise question stem, separate from the vignette.",
  "options": [ {"letter":"A","text":"..."}, {"letter":"B","text":"..."}, {"letter":"C","text":"..."}, {"letter":"D","text":"..."}, {"letter":"E","text":"..."} ],
  "correctLetter": "C",
  "testedConcept": "One full sentence (or two): the exact Step 1 concept being tested, written with the same academic depth as a real NBME explanation.",
  "highYieldClues": ["exact substring copied verbatim from vignette or additionalFindings", "..."],
  "clueBreakdown": [
    {"clue": "short label of the clue, e.g. Iron Profile", "meaning": "what this clue means / what it points to, 1-3 sentences"},
    {"clue": "short label of another clue", "meaning": "..."}
  ],
  "reasoningChain": "The FULL step-by-step reasoning chain as a detailed paragraph or arrow-chain (clue \u2192 clue \u2192 combined pattern \u2192 diagnosis \u2192 mechanism \u2192 tested concept), at least 3-5 sentences long, same depth as a real explanation, not a one-liner.",
  "whyCorrect": "A full, detailed paragraph (3-6 sentences) explaining precisely why the correct option is the single best answer, referencing the underlying physiology/biochemistry.",
  "distractorAnalysis": [
    {"letter":"A","title":"short name of the wrong concept/diagnosis, e.g. Sideroblastic Anemia","why":"A full detailed paragraph (2-4 sentences) explaining the mechanism this option describes and why it does not fit this patient.","expectedFindings":"What findings/labs would be expected if this option were actually correct.","missingOrContradictory":"Which specific findings in this vignette are missing or contradict this option."},
    {"letter":"B","title":"...","why":"...","expectedFindings":"...","missingOrContradictory":"..."},
    {"letter":"D","title":"...","why":"...","expectedFindings":"...","missingOrContradictory":"..."},
    {"letter":"E","title":"...","why":"...","expectedFindings":"...","missingOrContradictory":"..."}
  ],
  "keyLesson": "A full, detailed key test-taking lesson (2-4 sentences) generalizing the principle beyond this one question.",
  "takeaway": "One dense, quote-style, one-to-two-sentence high-yield takeaway line.",
  "storySteps": ["short phrase 1 (cause)", "short phrase 2 (mechanism)", "short phrase 3 (result)"]
}`;

function qbankBuildPrompt() {
  const topic = document.getElementById('qbankTopicInput').value.trim();
  const qType = document.getElementById('qbankQType')?.value || '';
  const extraNotes = document.getElementById('qbankNotesInput')?.value.trim() || '';
  const count = Math.max(1, Math.min(50, parseInt(document.getElementById('qbankCountInput')?.value || '1', 10) || 1));

  let topicModule = QBANK_TOPIC_MODULE_TEMPLATE
    .replace('[INSERT TOPIC]', topic || '(no specific topic given \u2014 choose a high-yield Step 1 topic from any specialty)')
    .replace('[Diagnosis / Mechanism / Pathophysiology / Treatment / Next best step / ADR / Receptor / etc.]', qType || '(choose the most fitting question type for the topic)')
    .replace('[Easy / Moderate / Hard / Very Hard]', qbankSelectedDiff);
  if (extraNotes) {
    topicModule += `\n\nADDITIONAL INSTRUCTIONS FROM THE STUDENT:\n${extraNotes}`;
  }

  const outputBlock = count > 1
    ? `==================================================
OUTPUT FORMAT \u2014 JSON ONLY (MANDATORY)
==================================================

Do NOT return prose, headers, markdown, or the "QUESTION / ANSWER KEY / ..." text format described above.
Everything must be entirely in English \u2014 no other language, anywhere, in any field.
Generate exactly ${count} DIFFERENT original questions (different patients, different high-yield angles \u2014 do not repeat the same vignette). Return ONLY this JSON shape, nothing else, no markdown code fences, no commentary before or after it:

{"questions": [ ${QBANK_SINGLE_SCHEMA_HINT}, /* ...${count} objects total, same shape ... */ ]}`
    : `==================================================
OUTPUT FORMAT \u2014 JSON ONLY (MANDATORY)
==================================================

Do NOT return prose, headers, markdown, or the "QUESTION / ANSWER KEY / ..." text format described above.
Everything must be entirely in English \u2014 no other language, anywhere, in any field.
Return ONLY this exact JSON object, nothing else, no markdown code fences, no commentary before or after it:

${QBANK_SINGLE_SCHEMA_HINT}`;

  const fieldNotes = `FIELD NOTES (all mandatory, all English only, written left-to-right):
- "vignette": the clinical case narrative only (Card 1), split into paragraphs with \\n\\n \u2014 do NOT include the question stem here.
- "labs": 6-11 lab items exactly like a real board question labs panel, each with name/value/flag(up|down|critical|normal)/refRange. Include a "critical" one for the single most important abnormal value (e.g. ferritin) with isClue:true.
- "additionalFindings": one short closing sentence after labs if relevant (e.g. smear/imaging/histology description), else empty string.
- "question": the single precise question stem, kept separate from "vignette".
- "options": exactly 5 items, letters A-E, correct answer NOT longer/more detailed than distractors.
- "testedConcept", "reasoningChain", "whyCorrect", "keyLesson": these must be FULLY DETAILED, multi-sentence, real explanatory prose \u2014 the same depth, length and academic rigor as a genuine NBME/UWorld-style explanation. Do NOT write one-line summaries for these fields.
- "highYieldClues": 2-4 items, each an EXACT short substring copied verbatim from "vignette" or "additionalFindings" text (used for automatic highlighting) \u2014 do not paraphrase them.
- "clueBreakdown": 2-4 items explaining what each major clue means clinically, same depth as a real teaching explanation.
- "distractorAnalysis": one FULLY DETAILED entry per WRONG option only (never include the correct letter) \u2014 each entry needs "why" (the mechanism the wrong option describes and why it fails here), "expectedFindings" (what the vignette would need to show for this option to be correct), and "missingOrContradictory" (exactly which findings in this vignette rule it out). This is the most important part of the explanation \u2014 give it the same depth as a real board-review breakdown, not a one-line dismissal.
- "keyLesson" and "takeaway": keyLesson is a fuller generalizable lesson (2-4 sentences), takeaway is a short punchy one-liner \u2014 these are two different fields, both required.
- "storySteps": exactly 3 very short phrases (2-6 words each) summarizing the reasoning chain as a visual flow (cause \u2192 mechanism \u2192 result).
- "specialty": the medical specialty/system in 1-2 words.
- "system": short badge text like "USMLE Step 1 \u2022 <Specialty>".
`;

  return QBANK_MASTER_PROMPT + '\n\n' + topicModule + '\n\n' + fieldNotes + '\n' + outputBlock;
}

function qbankCopyPrompt(fromCustomModal) {
  if (fromCustomModal) qbankCloseCustomize();
  const prompt = qbankBuildPrompt();
  navigator.clipboard?.writeText(prompt).then(() => {
    showToast('\ud83d\udccb Prompt copied \u2014 paste it into any AI, then paste back the JSON it returns below');
  }).catch(() => {
    showToast('\u26a0\ufe0f Could not auto-copy, copy manually from the console');
    console.log(prompt);
  });
}

function qbankOpenChatGPT(fromCustomModal) {
  if (fromCustomModal) qbankCloseCustomize();
  const prompt = qbankBuildPrompt();
  navigator.clipboard?.writeText(prompt).catch(() => {});
  window.open('https://chatgpt.com/?q=' + encodeURIComponent(prompt), '_blank');
  showToast('\ud83d\ude80 Opened ChatGPT (prompt also copied as backup) \u2014 once it answers, copy the JSON and paste it back here to import');
}

function qbankValidateQuestion(q) {
  return q && typeof q === 'object' && typeof q.vignette === 'string' && Array.isArray(q.options) && q.options.length >= 2 && typeof q.correctLetter === 'string';
}

function qbankImportJson() {
  const raw = document.getElementById('qbankJsonInput').value.trim();
  const status = document.getElementById('qbankImportStatus');
  if (!raw) { showToast('⚠️ الصق الـJSON أولاً'); return; }
  let parsed;
  try {
    const cleaned = raw.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    status.textContent = '❌ الـJSON مش صحيح — تأكد إنك نسخت كل الرد بدون نقص';
    showToast('❌ فشل تحليل الـJSON');
    return;
  }

  if (parsed && Array.isArray(parsed.questions)) {
    const valid = parsed.questions.filter(qbankValidateQuestion);
    if (!valid.length) { status.textContent = '❌ ما في أي سؤال صالح جوا questions'; return; }
    valid.forEach(q => qbankSaveToHistory(q));
    status.textContent = `✅ تم استيراد ${valid.length} سؤال بنجاح — بتقدر تفتحهم من "🗂️ سجل الأسئلة"`;
    showToast(`✅ ${valid.length} أسئلة انضافت للسجل`);
    qbankRenderQuestion(valid[0]);
    document.getElementById('qbankJsonInput').value = '';
    return;
  }

  if (!qbankValidateQuestion(parsed)) {
    status.textContent = '❌ الـJSON ناقص حقول أساسية (vignette / options / correctLetter)';
    showToast('❌ الـJSON مش مطابق للصيغة المطلوبة');
    return;
  }
  const topic = document.getElementById('qbankTopicInput').value.trim();
  parsed.topic = topic || parsed.specialty || 'مستورد';
  qbankSaveToHistory(parsed);
  qbankRenderQuestion(parsed);
  status.textContent = '✅ تم الاستيراد والعرض بنجاح';
  document.getElementById('qbankJsonInput').value = '';
}

function qbankLabFlagClasses(flag) {
  if (flag === 'down') return 'text-red-600';
  if (flag === 'up') return 'text-amber-600';
  if (flag === 'critical') return 'text-amber-700';
  return 'text-slate-700';
}
function qbankLabArrow(flag) {
  if (flag === 'down') return ' ↓';
  if (flag === 'up') return ' ↑';
  if (flag === 'critical') return ' ⚠️';
  return '';
}
function qbankRenderLabs(labs) {
  if (!labs || !labs.length) return '';
  const items = labs.map(l => {
    const isCritical = l.flag === 'critical';
    const wrapClasses = isCritical
      ? 'relative group cursor-pointer bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1'
      : 'relative group cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between';
    const labelClass = isCritical ? 'text-xs font-semibold text-amber-900' : 'text-xs font-semibold text-slate-500';
    const valueHtml = l.isClue ? `<span class="qb-clue qb-clue-off">${esc(String(l.value))}</span>` : esc(String(l.value));
    return `
      <div class="${wrapClasses}">
        <span class="${labelClass}">${esc(l.name)}:</span>
        <span class="text-xs font-bold ${qbankLabFlagClasses(l.flag)}">${valueHtml}${qbankLabArrow(l.flag)}</span>
        ${l.refRange ? `<div class="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">Ref: ${esc(l.refRange)}</div>` : ''}
      </div>`;
  }).join('');
  return `<p class="text-slate-700 font-semibold text-sm mb-3 mt-4">Laboratory studies show:</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">${items}</div>`;
}

function qbankRenderQuestion(q) {
  qbankCurrent = q;
  qbankAnswered = false;
  const out = document.getElementById('qbankOutputArea');

  const clueSource = [q.vignette, q.additionalFindings].filter(Boolean).join('\n\n');
  const vignetteHtml = qbankHighlightClues(esc(q.vignette || ''), q.highYieldClues || []);
  const additionalHtml = q.additionalFindings ? qbankHighlightClues(esc(q.additionalFindings), q.highYieldClues || []) : '';
  const labsHtml = qbankRenderLabs(q.labs);
  const opts = (q.options || []).map(o => `
    <button onclick="qbankAnswer('${esc(o.letter)}')" data-letter="${esc(o.letter)}"
      class="qb-opt-btn w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between gap-3 bg-white">
      <span class="text-sm font-medium text-slate-700"><strong class="mr-2 text-slate-400">${esc(o.letter)})</strong> ${esc(o.text)}</span>
      <span class="opt-indicator text-xs font-bold text-slate-400"></span>
    </button>`).join('');

  out.innerHTML = `
    <div id="qbankArena" class="space-y-6">
      <!-- Toolbar: pacing timer + clues -->
      <div class="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">🩺 ${esc(q.specialty || 'Clinical')}</span>
        <div class="flex-1 max-w-xs mx-4 min-w-[140px]">
          <div class="flex justify-between text-xs font-semibold mb-1 text-slate-600">
            <span>⚡ Pacing Timer</span>
            <span id="qbankTimerText">90s</span>
          </div>
          <div class="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div id="qbankTimerBar" class="bg-emerald-500 h-full rounded-full transition-all duration-1000" style="width:100%"></div>
          </div>
        </div>
        <button onclick="qbankManualStartTimer(this)" id="qbankTimerStartBtn" class="px-3 py-2 text-xs font-semibold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all">▶ Start</button>
        <button onclick="qbankToggleClues()" id="qbankCluesBtn" class="px-3 py-2 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all">💡 Show Clues</button>
      </div>

      <!-- Card 1: Clinical Case -->
      <div class="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <span class="px-3 py-1 bg-slate-200/70 text-slate-700 text-xs font-bold rounded-lg uppercase tracking-wider">Card 1: Clinical Case</span>
          <span class="text-xs text-slate-400 font-medium">${esc(q.system || (q.specialty ? ('USMLE Step 1 • ' + q.specialty) : 'USMLE Step 1'))}</span>
        </div>
        <p class="text-slate-700 leading-relaxed text-base font-normal mb-4 whitespace-pre-wrap">${vignetteHtml}</p>
        ${labsHtml}
        ${additionalHtml ? `<p class="text-slate-700 leading-relaxed text-sm mt-4">${additionalHtml}</p>` : ''}
      </div>

      <!-- Card 2: Question & Options -->
      <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <span class="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg uppercase tracking-wider">Card 2: Question &amp; Options</span>
          <span class="text-xs font-medium text-slate-500">Single Best Answer</span>
        </div>
        <h2 class="text-lg font-bold text-slate-800 mb-4">${esc(q.question || '')}</h2>
        <div class="space-y-3" id="qbankOptionsWrap">${opts}</div>
      </div>

      <div id="qbankBreakdownWrap"></div>
    </div>`;

  qbankResetTimerDisplay();
}

let qbankAnswered = false;
let qbankTimerInterval = null;

// Resets the timer bar/text to a fresh 90s WITHOUT starting the countdown.
// The countdown only begins when the student explicitly clicks "▶ Start"
// (qbankManualStartTimer) — pasting/importing a question must never auto-start it.
function qbankResetTimerDisplay() {
  clearInterval(qbankTimerInterval);
  qbankTimerInterval = null;
  const bar = document.getElementById('qbankTimerBar');
  const txt = document.getElementById('qbankTimerText');
  const startBtn = document.getElementById('qbankTimerStartBtn');
  if (bar) { bar.style.width = '100%'; bar.className = 'bg-emerald-500 h-full rounded-full transition-all duration-1000'; }
  if (txt) txt.textContent = '90s';
  if (startBtn) { startBtn.disabled = false; startBtn.textContent = '▶ Start'; startBtn.classList.remove('opacity-60'); }
}

function qbankManualStartTimer(btn) {
  if (btn) { btn.disabled = true; btn.textContent = '⏱ جاري...'; btn.classList.add('opacity-60'); }
  qbankStartTimer();
}

function qbankStartTimer() {
  clearInterval(qbankTimerInterval);
  let t = 90;
  const total = 90;
  const bar = document.getElementById('qbankTimerBar');
  const txt = document.getElementById('qbankTimerText');
  if (!bar || !txt) return;
  qbankTimerInterval = setInterval(() => {
    t--;
    txt.textContent = t + 's';
    const pct = Math.max(0, (t / total) * 100);
    bar.style.width = pct + '%';
    bar.className = 'h-full rounded-full transition-all duration-1000 ' + (pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500');
    if (t <= 0) {
      clearInterval(qbankTimerInterval);
      if (!qbankAnswered) qbankRevealTimeout();
    }
  }, 1000);
}

function qbankRevealTimeout() {
  if (qbankAnswered) return;
  qbankAnswered = true;
  const wrap = document.getElementById('qbankOptionsWrap');
  if (!wrap) return;
  wrap.querySelectorAll('.qb-opt-btn').forEach(btn => {
    btn.disabled = true;
    btn.classList.add('pointer-events-none', 'opacity-70');
    if (btn.dataset.letter === qbankCurrent.correctLetter) {
      btn.classList.add('bg-emerald-50', 'border-emerald-400');
      btn.querySelector('.opt-indicator').textContent = '⏰ خلص الوقت — هاي الصح';
      btn.querySelector('.opt-indicator').className = 'opt-indicator text-xs font-bold text-emerald-600';
    }
  });
  showToast('⏰ خلص الوقت! شوف الشرح تحت');
  qbankRenderBreakdown(qbankCurrent);
}

function qbankToggleClues() {
  const btn = document.getElementById('qbankCluesBtn');
  const marks = document.querySelectorAll('#qbankArena .qb-clue');
  const active = btn.dataset.on === '1';
  marks.forEach(m => m.classList.toggle('qb-clue-off', active));
  btn.dataset.on = active ? '0' : '1';
  btn.textContent = active ? '💡 إظهار العلامات' : '💡 إخفاء العلامات';
  btn.className = 'px-3 py-2 text-xs font-semibold rounded-xl transition-all ' + (active ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-amber-500 text-white shadow-sm');
}

function qbankHighlightClues(escapedVignette, clues) {
  let html = escapedVignette;
  (clues || []).forEach(clue => {
    const escClue = esc(clue).trim();
    if (!escClue || escClue.length < 3) return;
    if (html.includes(escClue)) {
      html = html.replace(escClue, `<span class="qb-clue qb-clue-off">${escClue}</span>`);
    }
  });
  return html;
}

function qbankAnswer(letter) {
  const q = qbankCurrent;
  if (!q || qbankAnswered) return;
  qbankAnswered = true;
  clearInterval(qbankTimerInterval);
  const wrap = document.getElementById('qbankOptionsWrap');
  const correct = letter === q.correctLetter;
  wrap.querySelectorAll('.qb-opt-btn').forEach(btn => {
    btn.disabled = true;
    btn.classList.add('pointer-events-none');
    const ind = btn.querySelector('.opt-indicator');
    if (btn.dataset.letter === q.correctLetter) {
      btn.classList.add('bg-emerald-50', 'border-emerald-400');
      ind.textContent = btn.dataset.letter === letter ? '✅ صح!' : '✨ الجواب الصح';
      ind.className = 'opt-indicator text-xs font-bold text-emerald-600';
    } else if (btn.dataset.letter === letter) {
      btn.classList.add('bg-red-50', 'border-red-300');
      ind.textContent = '❌ غلط';
      ind.className = 'opt-indicator text-xs font-bold text-red-500';
    } else {
      btn.classList.add('opacity-60');
    }
  });
  if (correct) qbankConfetti(); else showToast('💡 مش هاي — شوف الشرح تحت لتفهم ليش');
  qbankRenderBreakdown(q);
}

function qbankConfetti() {
  const colors = ['#6366f1','#ec4899','#22c55e','#f59e0b','#3b82f6'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'qbank-confetti-piece';
    const size = 5 + Math.random() * 6;
    el.style.width = size + 'px';
    el.style.height = (size * 0.4) + 'px';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (1.6 + Math.random() * 1.4) + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
}

function qbankRenderBreakdown(q) {
  const wrap = document.getElementById('qbankBreakdownWrap');
  const clueBreakdownHtml = (q.clueBreakdown || []).map(c => `
    <p class="mb-2"><strong class="text-slate-800">${esc(c.clue || '')}:</strong> ${esc(c.meaning || '')}</p>`).join('');

  const distractorHtml = (q.distractorAnalysis || []).map(d => `
    <div class="pb-3 mb-3 border-b border-slate-100 last:border-0 last:pb-0 last:mb-0">
      <p class="mb-1"><strong class="text-slate-800">${esc(d.letter)}${d.title ? ' (' + esc(d.title) + ')' : ''}:</strong> ${esc(d.why || d.explanation || '')}</p>
      ${d.expectedFindings ? `<p class="mb-1 text-slate-500"><em>Expected if correct:</em> ${esc(d.expectedFindings)}</p>` : ''}
      ${d.missingOrContradictory ? `<p class="text-slate-500"><em>Missing/contradictory here:</em> ${esc(d.missingOrContradictory)}</p>` : ''}
    </div>`).join('') || '<p>—</p>';

  wrap.innerHTML = `
    <!-- Card 3: High-Yield Clues & Magic Breakdown -->
    <div id="card-3" class="qb-fade bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span class="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg uppercase tracking-wider">Card 3: Magic Breakdown</span>
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-emerald-600">Unlocked 🔓</span>
          <button onclick="qbankOpenStoryModal()" class="px-3 py-2 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100 transition-all">🎨 Show Story</button>
          <button onclick="document.getElementById('qbankInputCard').scrollIntoView({behavior:'smooth'})" class="px-3 py-2 text-xs font-semibold bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all">🔁 New Question</button>
        </div>
      </div>

      <div class="space-y-4">
        <div class="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <h3 class="text-sm font-bold text-emerald-900 mb-1">🎯 Tested Concept</h3>
          <p class="text-xs text-emerald-800 leading-relaxed">${esc(q.testedConcept || '')}</p>
        </div>

        ${clueBreakdownHtml ? `<div class="p-4 bg-amber-50/60 rounded-xl border border-amber-100">
          <h3 class="text-sm font-bold text-amber-900 mb-2">🔑 High-Yield Clues</h3>
          <div class="text-xs text-amber-900 leading-relaxed">${clueBreakdownHtml}</div>
        </div>` : ''}

        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h3 class="text-sm font-bold text-slate-800 mb-2">🧩 Reasoning Chain</h3>
          <p class="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">${esc(q.reasoningChain || '')}</p>
        </div>

        <div class="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
          <h3 class="text-sm font-bold text-blue-900 mb-2">✅ Why the Correct Answer Is Best</h3>
          <p class="text-xs text-blue-900 leading-relaxed">${esc(q.whyCorrect || '')}</p>
        </div>

        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <button onclick="qbankToggleAccordion(this)" class="w-full p-3.5 bg-slate-50 text-left text-xs font-bold text-slate-700 flex justify-between items-center hover:bg-slate-100">
            <span>🔍 Why other options are wrong (Click to expand)</span>
            <span class="qb-acc-icon">▼</span>
          </button>
          <div class="qb-acc-body p-4 bg-white text-xs text-slate-600 border-t border-slate-200">${distractorHtml}</div>
        </div>
      </div>
    </div>

    <!-- Card 4: USMLE Key Lesson & Takeaway -->
    <div class="qb-fade bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md mt-6">
      <div class="flex items-center justify-between mb-3">
        <span class="px-3 py-1 bg-indigo-500/30 text-indigo-200 text-xs font-bold rounded-lg uppercase tracking-wider">Card 4: Key Lesson &amp; Takeaway</span>
        <span class="text-xs text-indigo-300">💡 Golden Rule</span>
      </div>
      <p class="text-sm text-indigo-100 leading-relaxed font-medium mb-2">${esc(q.keyLesson || '')}</p>
      <p class="text-sm text-white font-bold leading-relaxed">💡 ${esc(q.takeaway || '')}</p>
    </div>`;
}

function qbankToggleAccordion(headEl) {
  const body = headEl.nextElementSibling;
  const icon = headEl.querySelector('.qb-acc-icon');
  const isOpen = body.classList.toggle('open');
  icon.textContent = isOpen ? '▲' : '▼';
}

function qbankOpenStoryModal() {
  const q = qbankCurrent;
  if (!q) return;
  const colors = ['bg-purple-100 text-purple-800','bg-red-100 text-red-800','bg-amber-100 text-amber-800','bg-blue-100 text-blue-800'];
  const steps = (q.storySteps && q.storySteps.length ? q.storySteps : [q.testedConcept]).slice(0, 4);
  const flow = document.getElementById('qbankStoryFlow');
  flow.innerHTML = steps.map((s, i) => `
    ${i > 0 ? '<div class="text-slate-400 font-bold text-xs">⬇️</div>' : ''}
    <div class="px-4 py-2 ${colors[i % colors.length]} rounded-xl text-xs font-bold shadow-sm">${esc(s)}</div>
  `).join('');
  const caption = document.getElementById('qbankStoryCaption');
  const quote = QBANK_REFLECTIONS[Math.floor(Math.random() * QBANK_REFLECTIONS.length)];
  caption.textContent = quote;
  const modal = document.getElementById('qbankStoryModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}
function qbankCloseStoryModal() {
  const modal = document.getElementById('qbankStoryModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}


function renderRoundNotesList() {
  const notes = JSON.parse(localStorage.getItem('drmonic_round_notes') || '[]');
  const list = document.getElementById('roundNotesList');
  if (!notes.length) { list.innerHTML = `<p style="text-align:center;color:var(--text2);font-size:0.8rem;">لسا ما في ملاحظات محفوظة</p>`; return; }
  list.innerHTML = notes.map((n, i) => {
    const time = new Date(n.ts).toLocaleString('ar-EG', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' });
    const body = n.type === 'audio'
      ? `<audio controls src="${n.data}" style="width:100%;height:32px;"></audio>`
      : `<p style="margin:0;font-size:0.85rem;">${n.data.replace(/</g,'&lt;')}</p>`;
    return `<div style="border:1px solid var(--border);border-radius:10px;padding:8px 10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-size:0.72rem;color:var(--text2);">${n.type === 'audio' ? '🎙️' : '📝'} ${time}</span>
        <button class="btn btn-ghost btn-sm" style="padding:2px 8px;" onclick="deleteRoundNote(${i})">🗑️</button>
      </div>
      ${body}
    </div>`;
  }).join('');
}

