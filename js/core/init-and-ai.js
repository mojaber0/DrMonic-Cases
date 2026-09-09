// ════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════
// AI Medical Assistant
const AI_ASSISTANT_STORAGE_KEY = 'drmonic_ai_chat_session';
const AI_ASSISTANT_API_KEY_STORAGE_KEY = 'drmonic_gemini_api_key';
const AI_ASSISTANT_MODEL = 'gemini-3.6-flash';
/* Legitimate medical-education content (STIs, trauma, psych, etc.) shouldn't get
   over-blocked by generic safety filters — relax thresholds for this platform's use case. */
const AI_MEDICAL_SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
];
const AI_ASSISTANT_SYSTEM_INSTRUCTION = `
أنت مساعد ذكاء اصطناعي طبي داخل موقع DrMonic Cases.
تصرّف كطبيب ومعلم مبسّط لطلاب الطب: اشرح بالعربية الواضحة، اربط الإجابة بسياق الحالة المفتوحة، وعلّم الطالب طريقة التفكير السريري.
لا تعطي تشخيصاً أو علاجاً شخصياً لمريض حقيقي، وذكّر أن المحتوى للتعليم الطبي فقط عند الحاجة.
إذا كان السؤال خارج سياق الصفحة، أجب طبياً بشكل عام وباختصار مفيد، واطلب تفاصيل إضافية إذا كانت لازمة.
اجعل إجاباتك مختصرة ومباشرة قدر الإمكان: 3 إلى 6 نقاط أو فقرة قصيرة، ولا تطل إلا إذا طلب الطالب التفصيل.
`;
let aiAssistantMessages = [];
let aiAssistantBusy = false;
let aiAssistantTypingTimer = null;
let aiAssistantTypingFallback = null;
let aiAssistantPendingImagePart = null;
function aiAssistantLoadSession() {
  try { aiAssistantMessages = JSON.parse(sessionStorage.getItem(AI_ASSISTANT_STORAGE_KEY) || '[]'); }
  catch (e) { aiAssistantMessages = []; }
  if (!aiAssistantMessages.length) aiAssistantMessages = [{ role: 'assistant', text: 'أهلاً! افتح أي حالة أو ECG أو X-Ray واسألني عنها، أو اختار زر سريع من تحت.' }];
}
function aiAssistantSaveSession() {
  sessionStorage.setItem(AI_ASSISTANT_STORAGE_KEY, JSON.stringify(aiAssistantMessages.slice(-30)));
}
function aiAssistantRender() {
  const box = document.getElementById('aiAssistantMessages');
  if (!box) return;
  box.innerHTML = aiAssistantMessages.map((m, i) => `<div class="ai-message ${m.role === 'user' ? 'user' : 'assistant'}" data-ai-msg-index="${i}">${aiAssistantFormatMessage(m.text || '')}</div>`).join('');
  requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
  aiAssistantSaveSession();
}
function aiAssistantFormatMessage(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n{3,}/g, '\n\n');
}
function aiAssistantAddMessage(role, text) {
  aiAssistantMessages.push({ role, text });
  aiAssistantRender();
}
function aiAssistantTypeMessage(index, fullText) {
  clearInterval(aiAssistantTypingTimer);
  clearTimeout(aiAssistantTypingFallback);
  let i = 0;
  const step = Math.max(3, Math.ceil(fullText.length / 180));
  const box = document.getElementById('aiAssistantMessages');
  aiAssistantMessages[index].text = fullText;
  aiAssistantRender();
  const bubble = document.querySelector(`[data-ai-msg-index="${index}"]`);
  if (!bubble) {
    aiAssistantSaveSession();
    return;
  }
  bubble.innerHTML = '';
  aiAssistantTypingFallback = setTimeout(() => {
    if (!aiAssistantTypingTimer || !aiAssistantMessages[index]) return;
    clearInterval(aiAssistantTypingTimer);
    aiAssistantTypingTimer = null;
    aiAssistantMessages[index].text = fullText;
    bubble.innerHTML = aiAssistantFormatMessage(fullText);
    aiAssistantSaveSession();
    if (box) box.scrollTop = box.scrollHeight;
  }, Math.max(2500, fullText.length * 45));
  aiAssistantTypingTimer = setInterval(() => {
    if (!aiAssistantMessages[index]) {
      clearInterval(aiAssistantTypingTimer);
      clearTimeout(aiAssistantTypingFallback);
      aiAssistantTypingTimer = null;
      aiAssistantTypingFallback = null;
      return;
    }
    i = Math.min(fullText.length, i + step);
    bubble.innerHTML = aiAssistantFormatMessage(fullText.slice(0, i));
    if (box) box.scrollTop = box.scrollHeight;
    if (i >= fullText.length) {
      clearInterval(aiAssistantTypingTimer);
      aiAssistantTypingTimer = null;
      aiAssistantMessages[index].text = fullText;
      aiAssistantSaveSession();
      bubble.innerHTML = aiAssistantFormatMessage(fullText);
      if (box) box.scrollTop = box.scrollHeight;
    }
  }, 24);
}
function aiAssistantClearChat() {
  clearInterval(aiAssistantTypingTimer);
  clearTimeout(aiAssistantTypingFallback);
  aiAssistantTypingTimer = null;
  aiAssistantTypingFallback = null;
  sessionStorage.removeItem(AI_ASSISTANT_STORAGE_KEY);
  aiAssistantMessages = [{ role: 'assistant', text: 'تم مسح المحادثة. افتح أي حالة واسألني عنها.' }];
  aiAssistantRender();
}
function aiAssistantGetApiKey() {
  return (localStorage.getItem(AI_ASSISTANT_API_KEY_STORAGE_KEY) || '').trim();
}
function aiAssistantSaveApiKey() {
  const input = document.getElementById('aiAssistantApiKey');
  const key = (input?.value || '').trim();
  if (!key) {
    localStorage.removeItem(AI_ASSISTANT_API_KEY_STORAGE_KEY);
    aiAssistantAddMessage('assistant', 'تم مسح مفتاح Gemini من هذا المتصفح.');
    return;
  }
  if (!(key.startsWith('AIza') || key.startsWith('AQ.'))) {
    aiAssistantAddMessage('assistant', 'تنبيه: مفاتيح Gemini تكون غالباً إما AIza للمفاتيح القديمة أو AQ. للمفاتيح الجديدة من AI Studio. المفتاح محفوظ، لكن إذا فشل الاتصال تأكد منه من AI Studio.');
  }
  localStorage.setItem(AI_ASSISTANT_API_KEY_STORAGE_KEY, key);
  if (input) input.value = '';
  aiAssistantAddMessage('assistant', 'تم حفظ مفتاح Gemini محلياً على هذا المتصفح. الآن اسألني عن الحالة.');
}
function aiAssistantCurrentContext() {
  const parts = [];
  if (document.getElementById('caseView')?.classList.contains('active')) {
    const title = document.getElementById('cvTitle')?.innerText?.trim();
    const content = document.getElementById('caseViewContent')?.innerText?.trim();
    if (title) parts.push('الحالة السريرية المفتوحة: ' + title);
    if (content) parts.push(content);
  }
  ['ecgLibraryView', 'xrayAtlasView', 'studyNotesView', 'tricksView', 'reviewCardsView', 'mcqQuizView', 'labView', 'historyTakingView'].forEach(id => {
    const el = document.getElementById(id);
    const visible = el && getComputedStyle(el).display !== 'none' && !el.hidden;
    const txt = visible ? el.innerText?.trim() : '';
    if (txt) parts.push(txt);
  });
  if (!parts.length) {
    const homeText = document.getElementById('casesGrid')?.innerText?.trim();
    if (homeText) parts.push('الطالب موجود في قائمة الحالات. النص الظاهر: ' + homeText.slice(0, 2500));
  }
  return parts.join('\n\n---\n\n').slice(0, 12000);
}
function aiAssistantBuildGeminiPrompt(question) {
  const recentHistory = aiAssistantMessages
    .filter(m => !m.text.startsWith('ثواني...') && !m.text.startsWith('ثواني...'))
    .slice(-12)
    .map(m => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.text || ''}`)
    .join('\n');
  return `
سياق الصفحة الحالي:
${aiAssistantCurrentContext() || 'لا يوجد سياق محدد.'}

آخر المحادثة:
${recentHistory || 'لا توجد محادثة سابقة.'}

سؤال الطالب:
${question}
`;
}
function aiAssistantVisibleImageElements() {
  const selectors = [
    '#caseView.active img.case-image',
    '#caseView.active img.ecg-detail-img',
    '#caseView.active .compare-slider img',
    '#ecgLibraryView img.ecg-detail-img',
    '#ecgLibraryView .compare-slider img',
    '#xrayAtlasView img.ecg-detail-img',
    '#xrayAtlasView .compare-slider img',
    '#imgLightbox[style*="display: block"] img',
    '.img-lightbox img'
  ];
  const seen = new Set();
  return selectors.flatMap(sel => [...document.querySelectorAll(sel)]).filter(img => {
    const src = img.currentSrc || img.src || '';
    if (!src || seen.has(src)) return false;
    const rect = img.getBoundingClientRect();
    const visible = rect.width > 80 && rect.height > 80 && getComputedStyle(img).display !== 'none' && getComputedStyle(img).visibility !== 'hidden';
    if (!visible) return false;
    seen.add(src);
    return true;
  }).slice(0, 2);
}
function aiAssistantDataUrlToImagePart(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/(?:png|jpeg|jpg|webp|gif|bmp));base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
  return { type: 'image', data: match[2], mime_type: mime, resolution: 'high' };
}
async function aiAssistantImageElementToPart(img) {
  const src = img.currentSrc || img.src || '';
  const direct = aiAssistantDataUrlToImagePart(src);
  if (direct) return direct;
  try {
    const canvas = document.createElement('canvas');
    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return aiAssistantDataUrlToImagePart(canvas.toDataURL('image/jpeg', 0.86));
  } catch (err) {
    console.warn('AI assistant could not attach image:', err);
    return null;
  }
}
async function aiAssistantBuildInput(question) {
  const input = [{ type: 'text', text: aiAssistantBuildGeminiPrompt(question) }];
  if (aiAssistantPendingImagePart) input.push(aiAssistantPendingImagePart);
  if (input.length > 1) {
    input[0].text += aiAssistantPendingImagePart.source === 'screenshot'
      ? '\n\nملاحظة: أرفقت لك لقطة شاشة (Screenshot) لما يشوفه الطالب حالياً بالصفحة. اقرأها بصرياً واربط إجابتك بمحتواها.'
      : '\n\nملاحظة: أرفقت لك صورة اختارها المستخدم من الصفحة الحالية. إذا كانت ECG أو X-Ray، اقرأها بصرياً واربط إجابتك بالصورة.';
  }
  return input;
}
function aiAssistantUpdateAttachUi(message) {
  const btn = document.getElementById('aiAssistantAttachBtn');
  const shotBtn = document.getElementById('aiAssistantScreenshotBtn');
  const status = document.getElementById('aiAssistantAttachStatus');
  if (btn) btn.classList.toggle('has-image', !!aiAssistantPendingImagePart && aiAssistantPendingImagePart.source !== 'screenshot');
  if (shotBtn) shotBtn.classList.toggle('has-image', !!aiAssistantPendingImagePart && aiAssistantPendingImagePart.source === 'screenshot');
  if (status) {
    status.textContent = message || (aiAssistantPendingImagePart ? 'تم إرفاق صورة مع السؤال القادم.' : '');
    status.classList.toggle('show', !!status.textContent);
  }
}
async function aiAssistantAttachVisibleImage() {
  if (aiAssistantPendingImagePart && aiAssistantPendingImagePart.source !== 'screenshot') {
    aiAssistantPendingImagePart = null;
    aiAssistantUpdateAttachUi('تم إلغاء إرفاق الصورة — رح يترسل سؤال عادي بدون صورة.');
    return;
  }
  const images = aiAssistantVisibleImageElements()
    .sort((a, b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height));
  if (!images.length) {
    aiAssistantPendingImagePart = null;
    aiAssistantUpdateAttachUi('لم أجد صورة طبية ظاهرة لإرفاقها.');
    return;
  }
  const part = await aiAssistantImageElementToPart(images[0]);
  if (!part) {
    aiAssistantPendingImagePart = null;
    aiAssistantUpdateAttachUi('تعذر التقاط الصورة. جرّب صورة مرفوعة داخل الموقع أو افتحها داخل الحالة.');
    return;
  }
  aiAssistantPendingImagePart = part;
  aiAssistantUpdateAttachUi('تم إرفاق الصورة الظاهرة مع السؤال القادم. اضغط 📎 مرة ثانية لإلغائها.');
}

// Loads html2canvas from CDN once (shared with the "export case as image" feature)
function ensureHtml2Canvas() {
  return new Promise((res, rej) => {
    if (window.html2canvas) { res(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = res;
    s.onerror = () => rej(new Error('html2canvas failed to load from CDN'));
    document.head.appendChild(s);
  });
}

// Picks whichever content area is actually visible right now, to screenshot it
function aiAssistantCurrentVisibleContainer() {
  const isShown = el => !!el && el.style.display !== 'none' && el.offsetParent !== null;
  const candidates = [
    document.querySelector('#caseView.active') ? document.getElementById('caseViewContent') : null,
    isShown(document.getElementById('ecgDetailArea')) ? document.getElementById('ecgDetailArea') : null,
    isShown(document.getElementById('xrayDetailArea')) ? document.getElementById('xrayDetailArea') : null,
    isShown(document.getElementById('soundsDetailArea')) ? document.getElementById('soundsDetailArea') : null,
    isShown(document.getElementById('hxFormArea')) ? document.getElementById('hxFormArea') : null,
  ];
  return candidates.find(Boolean) || document.getElementById('homeView') || document.body;
}

// Fallback screen-capture using the browser's native Screen Capture API. This grabs the
// literal rendered pixels, so it works even when html2canvas chokes on modern CSS
// (color-mix(), etc.) that its older parser doesn't understand.
async function aiAssistantCaptureViaDisplayMedia() {
  if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('getDisplayMedia unsupported');
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: false });
  const track = stream.getVideoTracks()[0];
  const video = document.createElement('video');
  video.srcObject = stream;
  await video.play();
  await new Promise(r => setTimeout(r, 250)); // let the frame stabilize before grabbing it
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  track.stop();
  return canvas.toDataURL('image/jpeg', 0.85);
}

// Screenshot button next to Send — takes a real screenshot of whatever the student is
// currently looking at (not just grabbing an <img> element) and attaches it as an image
// for the NEXT message only. Nothing is sent automatically — only when this is clicked.
async function aiAssistantCaptureScreenshot() {
  if (aiAssistantPendingImagePart && aiAssistantPendingImagePart.source === 'screenshot') {
    aiAssistantPendingImagePart = null;
    aiAssistantUpdateAttachUi('تم إلغاء لقطة الشاشة — رح يترسل سؤال عادي بدون صورة.');
    return;
  }
  const btn = document.getElementById('aiAssistantScreenshotBtn');
  if (btn) btn.disabled = true;
  aiAssistantUpdateAttachUi('⏳ جاري التقاط لقطة الشاشة...');
  let dataUrl = null;
  try {
    await ensureHtml2Canvas();
    const target = aiAssistantCurrentVisibleContainer();
    const bg = getComputedStyle(document.body).getPropertyValue('--navy')?.trim() || '#0A1628';
    const canvas = await html2canvas(target, { backgroundColor: bg, scale: 1.5, useCORS: true, logging: false });
    dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.error('html2canvas screenshot failed, falling back to screen share:', err);
    try {
      aiAssistantUpdateAttachUi('⏳ الطريقة الأولى ما اشتغلت، بجرب طريقة بديلة — اختر التبويب/الشاشة من نافذة المتصفح...');
      dataUrl = await aiAssistantCaptureViaDisplayMedia();
    } catch (fallbackErr) {
      console.error('Screen Capture API fallback also failed:', fallbackErr);
      aiAssistantUpdateAttachUi('⚠️ تعذّر أخذ لقطة الشاشة بالطريقتين. جرّب زر 📎 لإرفاق صورة موجودة بالصفحة بدالها.');
      if (btn) btn.disabled = false;
      return;
    }
  }
  const part = aiAssistantDataUrlToImagePart(dataUrl);
  if (!part) { aiAssistantPendingImagePart = null; aiAssistantUpdateAttachUi('⚠️ تعذّر أخذ لقطة الشاشة.'); if (btn) btn.disabled = false; return; }
  part.source = 'screenshot';
  aiAssistantPendingImagePart = part;
  aiAssistantUpdateAttachUi('📸 تم إرفاق لقطة شاشة مع السؤال القادم. اضغط 📸 مرة ثانية لإلغائها.');
  if (btn) btn.disabled = false;
}
function aiAssistantToggleSettings() {
  document.getElementById('aiAssistantSettings')?.classList.toggle('open');
}
function initAiAssistantDrag() {
  const panel = document.getElementById('aiAssistantPanel');
  const header = panel?.querySelector('.ai-assistant-header');
  if (!panel || !header) return;
  let drag = null;
  header.addEventListener('pointerdown', e => {
    if (e.target.closest('button, input, textarea')) return;
    const rect = panel.getBoundingClientRect();
    drag = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
    panel.classList.add('dragging');
    header.setPointerCapture(e.pointerId);
  });
  header.addEventListener('pointermove', e => {
    if (!drag) return;
    const nextLeft = Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, drag.left + e.clientX - drag.x));
    const nextTop = Math.max(8, Math.min(window.innerHeight - panel.offsetHeight - 8, drag.top + e.clientY - drag.y));
    panel.style.left = nextLeft + 'px';
    panel.style.top = nextTop + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  });
  const endDrag = e => {
    if (!drag) return;
    drag = null;
    panel.classList.remove('dragging');
    try { header.releasePointerCapture(e.pointerId); } catch (err) {}
  };
  header.addEventListener('pointerup', endDrag);
  header.addEventListener('pointercancel', endDrag);
}
function aiAssistantExtractInteractionText(data) {
  const parts = [];
  const visit = value => {
    if (!value) return;
    if (typeof value === 'string') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === 'object') {
      if (typeof value.text === 'string') parts.push(value.text);
      if (typeof value.content === 'string') parts.push(value.content);
      if (value.content && typeof value.content === 'object') visit(value.content);
      if (value.output && typeof value.output === 'object') visit(value.output);
      if (value.steps) visit(value.steps);
      if (value.parts) visit(value.parts);
    }
  };
  visit(data?.steps);
  visit(data?.output);
  return [...new Set(parts)].join('\n').trim();
}
async function aiAssistantAsk(prompt) {
  const input = document.getElementById('aiAssistantInput');
  const text = (prompt || input?.value || '').trim();
  if (!text || aiAssistantBusy) return;
  const apiKey = aiAssistantGetApiKey();
  if (!apiKey) {
    document.getElementById('aiAssistantPanel')?.classList.add('open');
    document.getElementById('aiAssistantSettings')?.classList.add('open');
    aiAssistantAddMessage('assistant', 'أدخل Gemini API Key من زر الإعدادات ⚙ داخل الشات، ثم اضغط حفظ المفتاح.');
    document.getElementById('aiAssistantApiKey')?.focus();
    return;
  }
  const send = document.getElementById('aiAssistantSend');
  if (input) input.value = '';
  aiAssistantBusy = true;
  if (send) send.disabled = true;
  aiAssistantAddMessage('user', text);
  const hasVisibleImages = aiAssistantVisibleImageElements().length > 0;
  const thinkingIndex = aiAssistantMessages.push({ role: 'assistant', text: hasVisibleImages ? 'ثواني... أقرأ سياق الصفحة وأرفق الصورة الظاهرة للـ AI.' : 'ثواني... أقرأ سياق الصفحة وأحضّر الشرح.' }) - 1;
  aiAssistantRender();
  try {
    const assistantInput = await aiAssistantBuildInput(text);
    if (aiAssistantPendingImagePart) {
      aiAssistantPendingImagePart = null;
      aiAssistantUpdateAttachUi('');
    }
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        model: AI_ASSISTANT_MODEL,
        system_instruction: AI_ASSISTANT_SYSTEM_INSTRUCTION,
        input: assistantInput,
        generation_config: {
          temperature: 0.45,
          max_output_tokens: 1200,
          thinking_level: 'low'
        }
      })
    });
    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorData = await response.json();
        errorDetail = errorData?.error?.message || '';
      } catch (e) {}
      throw new Error('Gemini API returned ' + response.status + (errorDetail ? ': ' + errorDetail : ''));
    }
    const data = await response.json();
    aiAssistantMessages[thinkingIndex].text = data.output_text || aiAssistantExtractInteractionText(data) || 'وصلني رد فارغ من خدمة الذكاء الاصطناعي.';
    aiAssistantRender();
  } catch (err) {
    aiAssistantMessages[thinkingIndex].text = 'تعذر الاتصال بـ Gemini. افتح Console لمعرفة كود الخطأ. مفاتيح AI Studio الجديدة قد تبدأ بـ AQ. وهذا طبيعي، لكن يجب أن تكون مفعّلة لخدمة Gemini API وأن لا تكون محظورة أو منسوخة ناقصة.';
    aiAssistantRender();
    console.error('AI assistant error:', err);
  } finally {
    aiAssistantBusy = false;
    if (send) send.disabled = false;
    aiAssistantRender();
  }
}
function initAiAssistant() {
  aiAssistantLoadSession();
  aiAssistantRender();
  const keyInput = document.getElementById('aiAssistantApiKey');
  if (keyInput && aiAssistantGetApiKey()) keyInput.placeholder = 'Gemini API Key محفوظ محلياً';
  document.getElementById('aiAssistantSaveKey')?.addEventListener('click', aiAssistantSaveApiKey);
  document.getElementById('aiAssistantClearBtn')?.addEventListener('click', aiAssistantClearChat);
  document.getElementById('aiAssistantSettingsBtn')?.addEventListener('click', aiAssistantToggleSettings);
  document.getElementById('aiAssistantAttachBtn')?.addEventListener('click', aiAssistantAttachVisibleImage);
  document.getElementById('aiAssistantScreenshotBtn')?.addEventListener('click', aiAssistantCaptureScreenshot);
  initAiAssistantDrag();
  document.getElementById('aiAssistantFab')?.addEventListener('click', () => {
    document.getElementById('aiAssistantPanel')?.classList.toggle('open');
    requestAnimationFrame(() => {
      const box = document.getElementById('aiAssistantMessages');
      if (box) box.scrollTop = box.scrollHeight;
    });
  });
  document.getElementById('aiAssistantClose')?.addEventListener('click', () => document.getElementById('aiAssistantPanel')?.classList.remove('open'));
  document.getElementById('aiAssistantForm')?.addEventListener('submit', e => { e.preventDefault(); aiAssistantAsk(); });
  document.getElementById('aiAssistantInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); aiAssistantAsk(); }
  });
  document.getElementById('aiQuickActions')?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-prompt]');
    if (btn) aiAssistantAsk(btn.dataset.prompt);
  });
}

