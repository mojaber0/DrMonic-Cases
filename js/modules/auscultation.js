// ════════════════════════════════════════════════
//  CLINICAL SOUNDS LIBRARY (Auscultation)
//  Each entry: an uploaded audio clip + its name + expected diagnoses +
//  a sound-interpretation write-up. Audio is stored as a Blob directly
//  inside the IndexedDB entry (structured clone supports Blobs natively).
// ════════════════════════════════════════════════
let soundsCases = [];
let soundsLoaded = false;
let soundsCurrentId = null;
let soundsPendingAudioBlob = null;
let soundsPendingAudioName = '';

async function loadSounds() {
  try { soundsCases = await idbGetAllSounds(); } catch (e) { soundsCases = []; }
  soundsLoaded = true;
}

async function showSoundsLibraryView() {
  hideAllViews();
  document.getElementById('soundsLibraryView').classList.add('active');
  if (!soundsLoaded) await loadSounds();
  soundsShowList();
}

function soundsShowList() {
  soundsCurrentId = null;
  soundsPendingAudioBlob = null;
  document.getElementById('soundsFormArea').style.display = 'none';
  document.getElementById('soundsDetailArea').style.display = 'none';
  document.getElementById('soundsListArea').style.display = 'grid';
  document.getElementById('soundsListToolbar').style.display = 'flex';
  document.getElementById('soundsBackBtn').textContent = '← الرجوع';
  document.getElementById('soundsBackBtn').onclick = showHome;
  renderSoundsList();
}

function renderSoundsList() {
  const grid = document.getElementById('soundsListArea');
  const countEl = document.getElementById('soundsListCount');
  const q = (document.getElementById('soundsSearch')?.value || '').trim().toLowerCase();
  const filtered = q
    ? soundsCases.filter(s => `${s.title||''} ${s.expected_diagnoses||''} ${s.interpretation||''}`.toLowerCase().includes(q))
    : soundsCases;
  countEl.textContent = `${soundsCases.length} صوت`;
  if (!filtered.length) {
    grid.innerHTML = `<div class="notes-empty" style="grid-column:1/-1;"><div class="icon">🩺</div><h3>${q ? 'لا توجد نتائج' : 'لا توجد أصوات بعد'}</h3><p>${q ? 'جرب كلمة أخرى' : 'اضغط "➕ صوت جديد" لإضافة أول صوت'}</p></div>`;
    return;
  }
  grid.innerHTML = filtered.slice().reverse().map(s => `
    <div class="ecg-tile" onclick="soundsOpenDetail('${s.id}')">
      <div class="sound-tile-icon">🩺</div>
      <div class="ecg-tile-body">
        <div class="ecg-tile-diagnosis">${esc(s.title || 'صوت بدون اسم')}</div>
        <div class="ecg-tile-meta">${esc(s.createdAt || '')}</div>
      </div>
      <div class="ecg-tile-actions">
        <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;" onclick="event.stopPropagation();soundsOpenForm('${s.id}')">✏️ تعديل</button>
        <button class="btn btn-ghost btn-sm" style="padding:4px 10px;font-size:0.75rem;color:var(--red);" onclick="event.stopPropagation();soundsDeleteEntry('${s.id}')">🗑️</button>
      </div>
    </div>`).join('');
}

function soundsDeleteEntry(id) {
  const idx = soundsCases.findIndex(s => s.id === id);
  if (idx < 0) return;
  const removed = soundsCases[idx];
  soundsCases.splice(idx, 1);
  idbDeleteSound(id);
  renderSoundsList();
  showUndoToast('تم حذف الصوت', async () => {
    soundsCases.splice(idx, 0, removed);
    await idbPutSound(removed);
    renderSoundsList();
  });
}

function soundsNewEntry() { soundsOpenForm(null); }

function soundsOpenForm(id) {
  soundsCurrentId = id;
  const entry = id ? soundsCases.find(s => s.id === id) : null;
  soundsPendingAudioBlob = entry?.audioBlob || null;
  soundsPendingAudioName = entry?.title || '';
  document.getElementById('soundsListArea').style.display = 'none';
  document.getElementById('soundsListToolbar').style.display = 'none';
  document.getElementById('soundsDetailArea').style.display = 'none';
  document.getElementById('soundsBackBtn').textContent = '← رجوع للقائمة';
  document.getElementById('soundsBackBtn').onclick = soundsShowList;
  document.getElementById('soundsListCount').textContent = '';
  const area = document.getElementById('soundsFormArea');
  area.style.display = 'block';
  const audioUrl = soundsPendingAudioBlob ? URL.createObjectURL(soundsPendingAudioBlob) : '';
  area.innerHTML = `
    <div class="ecg-field">
      <label class="ecg-label">🎧 ملف الصوت</label>
      <input type="file" id="soundAudioFile" accept="audio/*" style="display:none;" onchange="soundsHandleAudioUpload(this.files)" />
      <div id="soundAudioPreviewWrap">
        ${audioUrl
          ? `<audio class="sound-audio-player" controls src="${audioUrl}"></audio><button class="btn btn-ghost btn-sm" onclick="document.getElementById('soundAudioFile').click()">🔄 استبدال الصوت</button>`
          : `<div class="ecg-image-drop" onclick="document.getElementById('soundAudioFile').click()">📁 اضغط لرفع ملف صوت (تسجيل سمّاعة، قلب، رئة...)</div>`}
      </div>
    </div>
    <div class="ecg-field">
      <label class="ecg-label">🏷️ اسم الصوت</label>
      <input class="form-input" id="soundNameInput" placeholder="مثال: S3 Gallop، Diastolic Murmur، Crackles..." value="${(entry?.title || '').replace(/"/g,'&quot;')}" />
    </div>
    <div class="ecg-field">
      <label class="ecg-label">🎯 التشخيصات المتوقعة</label>
      <textarea class="form-textarea" id="soundDiagnosesInput" rows="4" placeholder="الأمراض/الحالات اللي هالصوت بيوجهنا إلها...">${esc(entry?.expected_diagnoses || '')}</textarea>
    </div>
    <div class="ecg-field">
      <label class="ecg-label">📝 تفسير الصوت</label>
      <textarea class="form-textarea" id="soundInterpretationInput" rows="5" placeholder="اشرح آلية حدوث الصوت وكيف تميّزه عن أصوات مشابهة...">${esc(entry?.interpretation || '')}</textarea>
    </div>
    <div class="hx-save-bar">
      <button class="btn btn-primary" onclick="soundsSaveEntry()">💾 حفظ الصوت</button>
      <button class="btn btn-ghost" onclick="soundsShowList()">إلغاء</button>
    </div>`;
}

function soundsHandleAudioUpload(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  soundsPendingAudioBlob = file;
  const url = URL.createObjectURL(file);
  const wrap = document.getElementById('soundAudioPreviewWrap');
  if (wrap) wrap.innerHTML = `<audio class="sound-audio-player" controls src="${url}"></audio><button class="btn btn-ghost btn-sm" onclick="document.getElementById('soundAudioFile').click()">🔄 استبدال الصوت</button>`;
  document.getElementById('soundAudioFile').value = '';
}

async function soundsSaveEntry() {
  const title = document.getElementById('soundNameInput').value.trim();
  const entry = {
    id: soundsCurrentId || genId(),
    title,
    createdAt: new Date().toLocaleString('ar-EG'),
    audioBlob: soundsPendingAudioBlob || null,
    expected_diagnoses: document.getElementById('soundDiagnosesInput').value,
    interpretation: document.getElementById('soundInterpretationInput').value,
  };
  try {
    await idbPutSound(entry);
  } catch (e) {
    console.error('soundsSaveEntry failed', e);
    showToast('⚠️ فشل الحفظ فعليًا (الملف كبير جدًا على الأغلب) — الصوت ما انحفظ');
    return;
  }
  if (soundsCurrentId) {
    const idx = soundsCases.findIndex(s => s.id === soundsCurrentId);
    if (idx >= 0) soundsCases[idx] = entry; else soundsCases.push(entry);
  } else {
    soundsCases.push(entry);
  }
  showToast('✅ تم حفظ الصوت فعليًا');
  soundsShowList();
}

function soundsOpenDetail(id) {
  const entry = soundsCases.find(s => s.id === id);
  if (!entry) return;
  soundsCurrentId = id;
  document.getElementById('soundsListArea').style.display = 'none';
  document.getElementById('soundsListToolbar').style.display = 'none';
  document.getElementById('soundsFormArea').style.display = 'none';
  document.getElementById('soundsBackBtn').textContent = '← رجوع للقائمة';
  document.getElementById('soundsBackBtn').onclick = soundsShowList;
  document.getElementById('soundsListCount').textContent = '';
  const area = document.getElementById('soundsDetailArea');
  area.style.display = 'block';
  const audioUrl = entry.audioBlob ? URL.createObjectURL(entry.audioBlob) : '';
  area.innerHTML = `
    <div class="ecg-detail-header">
      <div>
        <div class="sound-detail-name">${esc(entry.title || 'صوت')}</div>
        <div class="ecg-detail-meta">${esc(entry.createdAt || '')}</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="soundsOpenForm('${entry.id}')">✏️ تعديل</button>
    </div>
    ${audioUrl ? `<audio class="sound-audio-player" controls src="${audioUrl}"></audio>` : ''}
    ${entry.expected_diagnoses ? `<div class="ecg-detail-section diagnosis"><div class="ecg-detail-section-title">🎯 التشخيصات المتوقعة</div><div class="ecg-detail-section-body">${hl(esc(entry.expected_diagnoses))}</div></div>` : ''}
    ${entry.interpretation ? `<div class="ecg-detail-section"><div class="ecg-detail-section-title">📝 تفسير الصوت</div><div class="ecg-detail-section-body">${hl(esc(entry.interpretation))}</div></div>` : ''}
  `;
}

