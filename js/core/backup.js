// ════════════════════════════════════════════════
//  FULL BACKUP & RESTORE (everything: cases + all app localStorage data —
//  settings, notes, review cards, lab panels/combined rules, exam stats,
//  opened cards, theme, gender, favorites, done — in one file)
// ════════════════════════════════════════════════
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function exportFullBackup() {
  await migrateLocalStorageToAppState();
  const payload = {
    app: 'DrMonic Cases - Full Backup',
    version: 7,
    exportedAt: new Date().toISOString(),
    cases,
    localStorageData: {},
    appState: {},
    noteVideos: {},
    noteImages: {},
    ecgCases: [],
    soundsCases: [],
    xrayCases: [],
    peSteps: [],
    physicalExam: {
      steps: [],
      heroImage: null,
      heroRegions: [],
      activeCategory: localStorage.getItem('drmonic_pe_active_category') || '',
      completed: [],
      completedByCategory: {}
    },
    pharmaCards: [],
    studyPlanPdfs: []
  };
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('drmonic_')) payload.localStorageData[k] = localStorage.getItem(k);
  });
  try {
    const appStateRows = await idbAppStateGetAll();
    appStateRows.forEach(row => {
      if (row?.key?.startsWith('drmonic_')) payload.appState[row.key] = row.value;
    });
    payload.localStorageData = { ...payload.appState, ...payload.localStorageData };
  } catch (e) { /* appState mirror is best-effort; localStorageData still exported */ }
  try {
    const entries = await idbGetAllNoteVideoEntries();
    for (const [id, blob] of entries) {
      payload.noteVideos[id] = await blobToBase64(blob);
    }
  } catch (e) { /* videos are best-effort — backup still proceeds without them */ }
  try {
    const imgEntries = await idbGetAllNoteImageEntries();
    for (const [id, blob] of imgEntries) {
      payload.noteImages[id] = await blobToBase64(blob);
    }
  } catch (e) { /* note images best-effort too */ }
  try {
    payload.ecgCases = await idbGetAllEcgCases();
  } catch (e) { /* ECG cases best-effort too */ }
  try {
    const rawSounds = await idbGetAllSounds();
    for (const s of rawSounds) {
      const { audioBlob, ...meta } = s;
      payload.soundsCases.push({ ...meta, audioBase64: audioBlob ? await blobToBase64(audioBlob) : null });
    }
  } catch (e) { /* sounds best-effort too */ }
  try {
    payload.xrayCases = await idbGetAllXrayCases();
  } catch (e) { /* X-Ray cases best-effort too */ }
  try {
    payload.peSteps = await idbGetAllPeSteps();
    payload.physicalExam.steps = payload.peSteps;
  } catch (e) { /* PE steps best-effort too */ }
  try {
    payload.physicalExam.heroImage = await idbGetMeta('pe_hero_image') || null;
  } catch (e) { /* PE hero image best-effort too */ }
  try {
    payload.physicalExam.heroRegions = JSON.parse(localStorage.getItem('drmonic_pe_hero_regions') || '[]');
    payload.physicalExam.completed = JSON.parse(localStorage.getItem('drmonic_pe_completed') || '[]');
    payload.physicalExam.completedByCategory = JSON.parse(localStorage.getItem('drmonic_pe_completed_by_cat') || '{}');
  } catch (e) { /* PE local state already included in localStorageData; this field is just explicit */ }
  try {
    payload.pharmaCards = await idbGetAllPharmaCards();
  } catch (e) { /* Pharmacology cards best-effort too */ }
  try {
    payload.studyPlanPdfs = await idbGetAllStudyPlanPdfs();
  } catch (e) { /* Study Plan PDF attachments best-effort too */ }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `medical_app_backup_${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  const videoCount = Object.keys(payload.noteVideos).length;
  const imageCount = Object.keys(payload.noteImages).length;
  const peHotspotCount = (payload.peSteps || []).reduce((sum, step) => sum + (step.media_items || []).reduce((m, item) => m + (Array.isArray(item.hotspots) ? item.hotspots.length : 0), 0), 0);
  const peHeroRegionCount = Array.isArray(payload.physicalExam.heroRegions) ? payload.physicalExam.heroRegions.length : 0;
  const statusEl = document.getElementById('fullBackupStatus');
  if (statusEl) statusEl.textContent = `✅ آخر تصدير: ${new Date().toLocaleString('ar-EG')} — ${cases.length} حالة، ${Object.keys(payload.localStorageData).length} عنصر مخزّن${videoCount ? '، ' + videoCount + ' فيديو' : ''}${imageCount ? '، ' + imageCount + ' صورة ملاحظة' : ''}${payload.ecgCases.length ? '، ' + payload.ecgCases.length + ' ECG' : ''}${payload.soundsCases.length ? '، ' + payload.soundsCases.length + ' صوت' : ''}${payload.xrayCases.length ? '، ' + payload.xrayCases.length + ' أشعة' : ''}${payload.peSteps.length ? '، ' + payload.peSteps.length + ' خطوة فحص' : ''}${peHotspotCount ? '، ' + peHotspotCount + ' هوتسبوت فحص' : ''}${peHeroRegionCount ? '، ' + peHeroRegionCount + ' تحديد بالصورة الكبيرة' : ''}${payload.physicalExam.heroImage ? '، صورة الفحص الكبيرة' : ''}${payload.pharmaCards.length ? '، ' + payload.pharmaCards.length + ' بطاقة دواء' : ''}${payload.studyPlanPdfs.length ? '، ' + payload.studyPlanPdfs.length + ' ملف PDF بالخطة الذهبية' : ''}`;
  showToast('✅ تم تصدير النسخة الاحتياطية الكاملة');
}

async function writeAutoBackupToFolder(payload) {
  if (!folderConnected || !folderHandle) return false;
  try {
    const dir = await folderHandle.getDirectoryHandle('backups', { create: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fh = await dir.getFileHandle(`drmonic-auto-backup-${stamp}.json`, { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(payload, null, 2));
    await w.close();
    return true;
  } catch (e) {
    console.error('auto backup folder write failed', e);
    return false;
  }
}

async function buildFullBackupPayload() {
  await migrateLocalStorageToAppState();
  const payload = {
    app: 'DrMonic Cases - Full Backup',
    version: 7,
    exportedAt: new Date().toISOString(),
    cases,
    localStorageData: {},
    appState: {},
    noteVideos: {},
    noteImages: {},
    ecgCases: [],
    soundsCases: [],
    xrayCases: [],
    peSteps: [],
    physicalExam: { steps: [], heroImage: null, heroRegions: [], activeCategory: localStorage.getItem('drmonic_pe_active_category') || '', completed: [], completedByCategory: {} },
    pharmaCards: [],
    studyPlanPdfs: []
  };
  Object.keys(localStorage).forEach(k => { if (k.startsWith('drmonic_')) payload.localStorageData[k] = localStorage.getItem(k); });
  (await idbAppStateGetAll()).forEach(row => { if (row?.key?.startsWith('drmonic_')) payload.appState[row.key] = row.value; });
  payload.localStorageData = { ...payload.appState, ...payload.localStorageData };
  try { for (const [id, blob] of await idbGetAllNoteVideoEntries()) payload.noteVideos[id] = await blobToBase64(blob); } catch (e) {}
  try { for (const [id, blob] of await idbGetAllNoteImageEntries()) payload.noteImages[id] = await blobToBase64(blob); } catch (e) {}
  try { payload.ecgCases = await idbGetAllEcgCases(); } catch (e) {}
  try {
    for (const s of await idbGetAllSounds()) {
      const { audioBlob, ...meta } = s;
      payload.soundsCases.push({ ...meta, audioBase64: audioBlob ? await blobToBase64(audioBlob) : null });
    }
  } catch (e) {}
  try { payload.xrayCases = await idbGetAllXrayCases(); } catch (e) {}
  try { payload.peSteps = await idbGetAllPeSteps(); payload.physicalExam.steps = payload.peSteps; } catch (e) {}
  try { payload.physicalExam.heroImage = await idbGetMeta('pe_hero_image') || null; } catch (e) {}
  try {
    payload.physicalExam.heroRegions = JSON.parse(localStorage.getItem('drmonic_pe_hero_regions') || '[]');
    payload.physicalExam.completed = JSON.parse(localStorage.getItem('drmonic_pe_completed') || '[]');
    payload.physicalExam.completedByCategory = JSON.parse(localStorage.getItem('drmonic_pe_completed_by_cat') || '{}');
  } catch (e) {}
  try { payload.pharmaCards = await idbGetAllPharmaCards(); } catch (e) {}
  try { payload.studyPlanPdfs = await idbGetAllStudyPlanPdfs(); } catch (e) {}
  return payload;
}

async function runAutoBackup(forceDownload = false) {
  try {
    const payload = await buildFullBackupPayload();
    const wroteFolder = !forceDownload && await writeAutoBackupToFolder(payload);
    if (!wroteFolder) {
      prepareAutoBackupDownload(payload);
      if (forceDownload) downloadPendingAutoBackup();
      else showAutoBackupReadyBanner();
    } else {
      localStorage.setItem('drmonic_last_auto_backup_at', new Date().toISOString());
    }
  } catch (e) {
    console.error('auto backup failed', e);
  }
}

let pendingAutoBackupBlob = null;
let pendingAutoBackupName = '';

function prepareAutoBackupDownload(payload) {
  pendingAutoBackupBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  pendingAutoBackupName = `drmonic-auto-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function showAutoBackupReadyBanner() {
  let bar = document.getElementById('autoBackupReadyBanner');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'autoBackupReadyBanner';
    bar.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:99999;display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:var(--card);color:var(--text);border:1px solid var(--border);box-shadow:var(--shadow);border-radius:12px;padding:10px 12px;font-size:0.85rem;max-width:min(520px,calc(100vw - 32px));';
    document.body.appendChild(bar);
  }
  bar.innerHTML = `
    <span>☁️ نسخة احتياطية جاهزة للتنزيل ورفعها على Google Drive.</span>
    <button class="btn btn-primary btn-sm" onclick="downloadPendingAutoBackup()">تنزيل الآن</button>
    <button class="btn btn-ghost btn-sm" onclick="dismissAutoBackupReadyBanner()">لاحقاً</button>
  `;
  showToast('☁️ نسخة احتياطية جاهزة — اضغط تنزيل الآن');
}

function dismissAutoBackupReadyBanner() {
  document.getElementById('autoBackupReadyBanner')?.remove();
}

function downloadPendingAutoBackup() {
  if (!pendingAutoBackupBlob) {
    showToast('⚠️ ما في نسخة جاهزة حالياً');
    return;
  }
  const url = URL.createObjectURL(pendingAutoBackupBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = pendingAutoBackupName || `drmonic-auto-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  pendingAutoBackupBlob = null;
  pendingAutoBackupName = '';
  localStorage.setItem('drmonic_last_auto_backup_at', new Date().toISOString());
  dismissAutoBackupReadyBanner();
  showToast('✅ تم تنزيل النسخة الاحتياطية');
}

function scheduleAutoBackup() {
  const last = Date.parse(localStorage.getItem('drmonic_last_auto_backup_at') || '0') || 0;
  if (Date.now() - last >= DRMONIC_AUTOBACKUP_INTERVAL_MS) setTimeout(() => runAutoBackup(), 5000);
  setInterval(() => runAutoBackup(), DRMONIC_AUTOBACKUP_INTERVAL_MS);
}

function importFullBackup(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const data = JSON.parse(e.target.result);
      const lsData = data.appState || data.localStorageData || data.localStorage;
      const hasCases = Array.isArray(data.cases);
      const noteVideos = data.noteVideos && typeof data.noteVideos === 'object' ? data.noteVideos : null;
      const ecgList = Array.isArray(data.ecgCases) ? data.ecgCases : null;
      const soundsList = Array.isArray(data.soundsCases) ? data.soundsCases : null;
      const xrayList = Array.isArray(data.xrayCases) ? data.xrayCases : null;
      const peBackup = data.physicalExam && typeof data.physicalExam === 'object' ? data.physicalExam : null;
      const peList = Array.isArray(peBackup?.steps) ? peBackup.steps : (Array.isArray(data.peSteps) ? data.peSteps : null);
      const pharmaList = Array.isArray(data.pharmaCards) ? data.pharmaCards : null;
      const studyPlanPdfList = Array.isArray(data.studyPlanPdfs) ? data.studyPlanPdfs : null;
      const noteImages = data.noteImages && typeof data.noteImages === 'object' ? data.noteImages : null;
      const keyCount = lsData ? Object.keys(lsData).length : 0;
      const videoCount = noteVideos ? Object.keys(noteVideos).length : 0;
      const peHotspotCount = (peList || []).reduce((sum, step) => sum + (step.media_items || []).reduce((m, item) => m + (Array.isArray(item.hotspots) ? item.hotspots.length : 0), 0), 0);
      const peHeroRegionCount = Array.isArray(peBackup?.heroRegions) ? peBackup.heroRegions.length : 0;
      if (!hasCases && !keyCount && !videoCount && !ecgList && !soundsList && !xrayList && !peList && !pharmaList && !noteImages && !studyPlanPdfList) throw new Error('Empty backup file');

      const ok = confirm(
        `سيتم استبدال كل بيانات التطبيق الحالية بـ${hasCases ? ' ' + data.cases.length + ' حالة و' : ''} ${keyCount} عنصر مخزّن${videoCount ? ' و' + videoCount + ' فيديو' : ''}${ecgList ? ' و' + ecgList.length + ' حالة ECG' : ''}${soundsList ? ' و' + soundsList.length + ' صوت' : ''}${xrayList ? ' و' + xrayList.length + ' حالة أشعة' : ''}${peList ? ' و' + peList.length + ' خطوة فحص سريري' : ''}${peHotspotCount ? ' و' + peHotspotCount + ' هوتسبوت فحص' : ''}${peHeroRegionCount ? ' و' + peHeroRegionCount + ' تحديد بالصورة الكبيرة' : ''}${peBackup?.heroImage ? ' وصورة الفحص الكبيرة' : ''}${pharmaList ? ' و' + pharmaList.length + ' بطاقة دواء' : ''}${studyPlanPdfList ? ' و' + studyPlanPdfList.length + ' ملف PDF بالخطة الذهبية' : ''} من ملف النسخة الاحتياطية.\nهل تريد المتابعة؟`
      );
      if (!ok) return;

      if (lsData) {
        Object.keys(localStorage).forEach(k => { if (k.startsWith('drmonic_')) localStorage.removeItem(k); });
        for (const [k, v] of Object.entries(lsData)) {
          if (!k.startsWith('drmonic_')) continue;
          localStorage.setItem(k, v);
          await idbAppStateSet(k, v);
        }
      }

      if (hasCases) {
        const importedCases = data.cases;
        importedCases.forEach(c => { if (!c.id) c.id = genId(); });
        await idbClearCases();
        for (const c of importedCases) await idbPutCase(c);
        if (folderConnected) await syncAllCasesToFolder();
      }

      if (noteVideos) {
        await idbClearNoteVideos();
        for (const [id, b64] of Object.entries(noteVideos)) {
          try {
            const vblob = await (await fetch(b64)).blob();
            await idbPutNoteVideo(id, vblob);
          } catch (e) { /* skip a corrupt entry, keep restoring the rest */ }
        }
      }

      if (ecgList) {
        await idbClearEcgCases();
        for (const entry of ecgList) {
          if (!entry.id) entry.id = genId();
          await idbPutEcgCase(entry);
        }
      }

      if (soundsList) {
        await idbClearSounds();
        for (const entry of soundsList) {
          if (!entry.id) entry.id = genId();
          const { audioBase64, ...meta } = entry;
          try {
            meta.audioBlob = audioBase64 ? await (await fetch(audioBase64)).blob() : null;
          } catch (e) { meta.audioBlob = null; }
          await idbPutSound(meta);
        }
      }

      if (xrayList) {
        await idbClearXrayCases();
        for (const entry of xrayList) {
          if (!entry.id) entry.id = genId();
          await idbPutXrayCase(entry);
        }
      }

      if (peList) {
        await idbClearPeSteps();
        for (const entry of peList) {
          if (!entry.id) entry.id = genId();
          await idbPutPeStep(entry);
        }
      }

      if (peBackup) {
        if (peBackup.heroImage) await idbSetMeta('pe_hero_image', peBackup.heroImage);
        if (Array.isArray(peBackup.heroRegions)) localStorage.setItem('drmonic_pe_hero_regions', JSON.stringify(peBackup.heroRegions));
        if (Array.isArray(peBackup.completed)) localStorage.setItem('drmonic_pe_completed', JSON.stringify(peBackup.completed));
        if (peBackup.completedByCategory && typeof peBackup.completedByCategory === 'object') localStorage.setItem('drmonic_pe_completed_by_cat', JSON.stringify(peBackup.completedByCategory));
        if (peBackup.activeCategory) localStorage.setItem('drmonic_pe_active_category', peBackup.activeCategory);
      }

      if (pharmaList) {
        await idbClearPharmaCards();
        for (const entry of pharmaList) {
          if (!entry.id) entry.id = genId();
          await idbPutPharmaCard(entry);
        }
      }

      if (studyPlanPdfList) {
        await idbClearStudyPlanPdfs();
        for (const entry of studyPlanPdfList) {
          if (!entry.id) entry.id = genId();
          await idbPutStudyPlanPdf(entry);
        }
      }

      if (noteImages) {
        await idbClearNoteImages();
        for (const [id, b64] of Object.entries(noteImages)) {
          try {
            const iblob = await (await fetch(b64)).blob();
            await idbPutNoteImage(id, iblob);
          } catch (e) { /* skip a corrupt entry, keep restoring the rest */ }
        }
      }

      showToast('✅ تم استيراد النسخة الكاملة — جاري إعادة تحميل الموقع...');
      setTimeout(() => location.reload(), 900);
    } catch (err) {
      showToast('⚠️ ملف النسخة الاحتياطية غير صالح أو تالف');
    } finally {
      input.value = '';
    }
  };
  reader.readAsText(file);
}

