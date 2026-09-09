// ════════════════════════════════════════════════
//  TEXT-TO-SPEECH (read a case aloud) — real cloud API (Google Gemini TTS)
//  You supply your own Google AI (Gemini) API key + optional voice name
//  from "⚙️" next to the listen button. If the key is missing, invalid,
//  or the account runs out of credits/quota, the feature simply fails
//  quietly with a toast — nothing else on the site is affected.
// ════════════════════════════════════════════════
const TTS_API_KEY_STORAGE = 'drmonic_tts_api';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
let ttsAudioEl = null;
let ttsLoading = false;

function ttsGetSettings() {
  let s;
  try { s = JSON.parse(localStorage.getItem(TTS_API_KEY_STORAGE)) || {}; }
  catch (e) { s = {}; }
  // Migrate the old single-key shape { apiKey, voiceId } to the new multi-key shape.
  if (s.apiKey && !Array.isArray(s.apiKeys)) s.apiKeys = [s.apiKey];
  if (!Array.isArray(s.apiKeys)) s.apiKeys = [];
  if (typeof s.activeIndex !== 'number') s.activeIndex = 0;
  return s;
}
function ttsSaveSettings(s) { safeLocalSet(TTS_API_KEY_STORAGE, JSON.stringify(s)); }

function ttsOpenSettings() {
  const s = ttsGetSettings();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.classList.add('open');
  modal.innerHTML = `
    <div class="modal-box" style="max-width:460px;">
      <h3 style="margin-bottom:14px;">⚙️ إعدادات القراءة الصوتية (Google Gemini TTS)</h3>
      <div class="ecg-field"><label class="ecg-label">🔑 مفاتيح Google AI API (سطر لكل مفتاح)</label>
        <textarea class="form-textarea" id="ttsFormKeys" rows="4" placeholder="AQ....&#10;AQ.... (مفتاح ثاني اختياري)">${esc((s.apiKeys || []).join('\n'))}</textarea>
      </div>
      <div class="ecg-field"><label class="ecg-label">🎙️ اسم الصوت (اختياري — بيستخدم صوت افتراضي إذا فاضي)</label>
        <input class="form-input" id="ttsFormVoice" placeholder="Kore" value="${esc(s.voiceId || '')}" />
      </div>
      <div style="color:var(--text2);font-size:0.8rem;margin-bottom:14px;line-height:1.7;">
        خذ مفاتيحك من aistudio.google.com. لو حطيت أكتر من مفتاح (من أكتر من حساب مثلاً)، الموقع بيبدل تلقائياً للمفتاح التالي بمجرد ما وحد يخلص كوتته اليومية — بدون ما تحتاج تعدل شي يدوياً كل مرة. أسماء أصوات ثانية ممكن تجربها: Puck, Charon, Fenrir, Aoede, Leda, Orus.
      </div>
      <div class="hx-save-bar">
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove();">إلغاء</button>
        <button class="btn btn-primary" onclick="ttsSaveSettingsFromForm()">💾 حفظ</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}
function ttsSaveSettingsFromForm() {
  const apiKeys = document.getElementById('ttsFormKeys').value.split('\n').map(k => k.trim()).filter(Boolean);
  const voiceId = document.getElementById('ttsFormVoice').value.trim();
  ttsSaveSettings({ apiKeys, voiceId, activeIndex: 0 });
  showToast(apiKeys.length > 1 ? `✅ تم الحفظ — رح يبدل تلقائياً بين ${apiKeys.length} مفاتيح` : '✅ تم حفظ إعدادات القراءة الصوتية');
  document.querySelector('.modal-overlay')?.remove();
}

// Gemini TTS returns raw 16-bit PCM (mono, 24kHz) as base64 — browsers can't
// play raw PCM directly, so we wrap it in a minimal WAV header first.
function ttsPcmBase64ToWavBlob(base64, sampleRate = 24000) {
  const binary = atob(base64);
  const len = binary.length;
  const pcm = new Uint8Array(len);
  for (let i = 0; i < len; i++) pcm[i] = binary.charCodeAt(i);

  const numChannels = 1, bitsPerSample = 16;
  const blockAlign = numChannels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44 + pcm.length);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, pcm.length, true);
  new Uint8Array(buffer, 44).set(pcm);

  return new Blob([buffer], { type: 'audio/wav' });
}

// Builds a clean, COMPLETE reading script directly from the case's data —
// not from the rendered page — so collapsed sections, hidden MCQ answers,
// and button/icon labels never get lost or bloat the audio.
function ttsBuildCaseText(c, idx) {
  if (!c) return '';
  const parts = [];
  const add = (label, val) => { if (val && String(val).trim()) parts.push(`${label}. ${String(val).trim()}`); };
  add('اسم الحالة', c.name);
  add('الشكوى الرئيسية', c.complaint);
  add('التشخيص', c.diagnosis);
  add('نبذة عامة', c.bigpicture);
  add('السيناريو', c.scenario);
  add('الفيزيولوجيا المرضية', c.patho);
  add('التاريخ المرضي', c.history);
  add('الفحص السريري', c.exam);
  add('التشخيص التفريقي', c.diffdx);
  add('خطأ شائع', c.mistake);
  add('خطة العلاج', c.management);
  add('علامات يجب الانتباه لها', c.dontmiss);
  add('تريكات', c.tricks);
  add('ملخص الحالة', c.recap);
  add('ملاحظات', c.notes);
  if (Array.isArray(c.mcqs)) {
    c.mcqs.filter(q => q.q).forEach((q, i) => add(`سؤال ${i + 1}`, `${q.q}. الإجابة: ${q.a || 'لا يوجد'}`));
  }
  // Personal study notes (the "✎ ملاحظاتي وشروحاتي الخاصة" box at the bottom of the
  // case) live in their own localStorage key, separate from the case object itself.
  const notesKey = 'drmonic_notes_' + (c.createdAt || idx);
  add('ملاحظاتي الخاصة', localStorage.getItem(notesKey) || '');
  return parts.join('.\n');
}

function ttsSplitChunks(text, maxLen = 5000) {
  const bits = text.split(/\n+/).filter(Boolean);
  const chunks = [];
  let cur = '';
  bits.forEach(bit => {
    if ((cur + ' ' + bit).length > maxLen && cur) { chunks.push(cur.trim()); cur = bit; }
    else cur = cur ? cur + ' ' + bit : bit;
  });
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

// Fetches one chunk of speech audio from Gemini TTS and returns a playable Blob.
async function ttsFetchOne(apiKey, voiceName, text) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    const isQuota = res.status === 429;
    let msg = '❌ تعذّرت القراءة الصوتية — تأكد من مفتاح الـ API';
    if (isQuota) msg = '❌ خلصت الكوتا اليومية المجانية لهاد المفتاح (10 طلبات/يوم بالخطة المجانية)';
    else if (data?.error?.message) msg = `❌ ${data.error.message}`;
    const err = new Error(msg);
    err.isQuota = isQuota;
    throw err;
  }
  const audioPart = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!audioPart) throw new Error('❌ ما رجعت الخدمة صوت — جرب مرة كمان');
  return ttsPcmBase64ToWavBlob(audioPart.inlineData.data);
}

// Tries the currently "active" key first; on a quota/rate-limit error it
// automatically moves to the next stored key and remembers that choice for
// next time — so the student doesn't have to manually swap keys each day.
async function ttsFetchChunkBlob(voiceName, text) {
  const s = ttsGetSettings();
  const keys = s.apiKeys || [];
  if (!keys.length) throw new Error('⚠️ ما في مفتاح API محفوظ');
  let startIdx = Math.min(s.activeIndex || 0, keys.length - 1);
  let lastErr = null;
  for (let i = 0; i < keys.length; i++) {
    const idx = (startIdx + i) % keys.length;
    try {
      const blob = await ttsFetchOne(keys[idx], voiceName, text);
      if (idx !== s.activeIndex) { s.activeIndex = idx; ttsSaveSettings(s); } // remember the working key
      return blob;
    } catch (e) {
      lastErr = e;
      if (!e.isQuota) throw e; // a non-quota error (bad key, network, etc.) isn't solved by switching keys
      // quota error — silently try the next key in the list
    }
  }
  lastErr.message = keys.length > 1
    ? '❌ خلصت الكوتا اليومية لكل المفاتيح المحفوظة — جرب بكرة أو ضيف مفتاح جديد'
    : '❌ خلصت الكوتا اليومية المجانية لـ Gemini TTS (10 طلبات/يوم) — جرب بكرة، فعّل الفوترة، أو ضيف مفتاح ثاني بالإعدادات ⚙️';
  throw lastErr;
}

let ttsQueueToken = 0; // bumps on every new play request so an old queue stops itself

// Plays an already-known list of audio blobs in order (used for cached playback).
async function ttsPlayBlobs(blobs, btn) {
  const myToken = ++ttsQueueToken;
  for (let i = 0; i < blobs.length; i++) {
    if (myToken !== ttsQueueToken) return;
    const url = URL.createObjectURL(blobs[i]);
    ttsAudioEl = new Audio(url);
    if (btn) btn.textContent = '⏸️ إيقاف مؤقت';
    await new Promise(resolve => {
      ttsAudioEl.onended = () => { URL.revokeObjectURL(url); resolve(); };
      ttsAudioEl.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      ttsAudioEl.play().catch(() => resolve());
    });
    if (myToken !== ttsQueueToken) return;
  }
  ttsAudioEl = null;
  if (btn && myToken === ttsQueueToken) btn.textContent = '🔊 استماع';
}

// Fetches + plays fresh audio chunk-by-chunk, then — if every chunk succeeded —
// saves the finished audio to IndexedDB so next time it plays instantly with
// zero API calls (until the case text changes and invalidates the cache).
async function ttsPlayQueue(chunks, voiceName, btn, caseId, fullText) {
  const myToken = ++ttsQueueToken;
  let nextPromise = ttsFetchChunkBlob(voiceName, chunks[0]);
  const collected = [];
  for (let i = 0; i < chunks.length; i++) {
    if (myToken !== ttsQueueToken) return; // a newer request (or stop) took over
    let blob;
    try { blob = await nextPromise; }
    catch (e) { showToast(e.message || '❌ صار خطأ أثناء القراءة الصوتية'); break; }
    if (myToken !== ttsQueueToken) return;
    collected.push(blob);
    if (i + 1 < chunks.length) nextPromise = ttsFetchChunkBlob(voiceName, chunks[i + 1]); // prefetch while this one plays
    const url = URL.createObjectURL(blob);
    ttsAudioEl = new Audio(url);
    if (btn) btn.textContent = '⏸️ إيقاف مؤقت';
    await new Promise(resolve => {
      ttsAudioEl.onended = () => { URL.revokeObjectURL(url); resolve(); };
      ttsAudioEl.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      ttsAudioEl.play().catch(() => resolve());
    });
    if (myToken !== ttsQueueToken) return;
  }
  ttsAudioEl = null;
  if (btn && myToken === ttsQueueToken) btn.textContent = '🔊 استماع';

  if (collected.length === chunks.length && caseId) {
    try { await idbPutTtsCache({ id: caseId, text: fullText, chunks: collected, createdAt: Date.now() }); }
    catch (e) { /* cache save is best-effort — playback already worked either way */ }
  }
}

async function ttsToggleCase() {
  const btn = document.getElementById('ttsBtn');

  // Already have audio loaded — just toggle play/pause
  if (ttsAudioEl && !ttsAudioEl.ended) {
    if (ttsAudioEl.paused) { ttsAudioEl.play(); if (btn) btn.textContent = '⏸️ إيقاف مؤقت'; }
    else { ttsAudioEl.pause(); if (btn) btn.textContent = '▶️ استكمال'; }
    return;
  }

  const c = cases[pendingCaseIndex];
  const text = ttsBuildCaseText(c, pendingCaseIndex);
  if (!text) { showToast('ما في محتوى لقراءته'); return; }
  const caseId = c && c.id;

  // If this exact case text was already read before, play the saved audio —
  // no API call, no wait, and no credit spent — unless the text changed.
  if (caseId) {
    try {
      const cached = await idbGetTtsCache(caseId);
      if (cached && cached.text === text && Array.isArray(cached.chunks) && cached.chunks.length) {
        ttsPlayBlobs(cached.chunks, btn);
        return;
      }
    } catch (e) { /* ignore cache errors, fall through to live generation */ }
  }

  const s = ttsGetSettings();
  if (!s.apiKeys || !s.apiKeys.length) {
    showToast('⚠️ لازم تضيف مفتاح API أول — اضغط ⚙️ بجانب زر الاستماع');
    ttsOpenSettings();
    return;
  }

  const chunks = ttsSplitChunks(text);
  if (btn) btn.textContent = '⏳ جاري التحضير...';
  const voiceName = s.voiceId || 'Kore'; // Gemini default voice
  ttsPlayQueue(chunks, voiceName, btn, caseId, text);
}
function ttsStop() {
  ttsQueueToken++; // invalidates any in-flight queue so it stops itself
  if (ttsAudioEl) { ttsAudioEl.pause(); ttsAudioEl = null; }
  const btn = document.getElementById('ttsBtn');
  if (btn) btn.textContent = '🔊 استماع';
}
// Note: ttsStop() is also called from showHome() so audio doesn't keep
// playing after the student navigates away from the case.

