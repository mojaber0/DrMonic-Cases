// ════════════════════════════════════════════════
//  STORAGE ENGINE
//  Cases are no longer kept in localStorage (5-10MB limit, easy to
//  overflow with embedded images/voice notes and fail silently).
//  Primary store: IndexedDB (hundreds of MB+, works in every browser
//  including Safari/mobile — this alone removes the "saved but not
//  saved" bug everywhere).
//  Optional extra: on Chrome/Edge desktop only, the File System Access
//  API lets the user link a real folder on disk; every case is then
//  also written there as its own <id>.json file, and that folder
//  becomes the source of truth on load. Safari and mobile browsers do
//  not expose this API at all, so there this stays IndexedDB-only.
// ════════════════════════════════════════════════
const FS_FOLDER_SUPPORTED = 'showDirectoryPicker' in window;
let folderHandle = null;
let folderConnected = false;

function genId() {
  return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

const IDB_NAME = 'drmonic_db';
const IDB_STORE_CASES = 'cases';
const IDB_STORE_META = 'meta';
const IDB_STORE_NOTE_VIDEOS = 'noteVideos';
const IDB_STORE_NOTE_IMAGES = 'noteImages';
const IDB_STORE_ECG = 'ecgCases';
const IDB_STORE_SOUNDS = 'clinicalSounds';
const IDB_STORE_XRAY = 'xrayCases';
const IDB_STORE_PE = 'peSteps';
const IDB_STORE_PHARMA = 'pharmaCards';
const IDB_STORE_TTS_CACHE = 'ttsCache';
const IDB_STORE_FS_HANDLES = 'peFsHandles';
let _idbPromise = null;
function openIDB() {
  if (_idbPromise) return _idbPromise;
  _idbPromise = new Promise((resolve) => {
    let settled = false;
    const req = indexedDB.open(IDB_NAME, DRMONIC_IDB_VERSION);
    // Safety net: if another tab/window is holding an older connection open,
    // the versioned open() above can sit blocked forever with NO error and
    // NO timeout of its own — that silent hang is what froze the whole app
    // (cases included) last time, not just Physical Exam. So: give it a few
    // seconds, and if it hasn't resolved, fall back to opening the database
    // at whatever version it's already at (no upgrade requested = can never
    // block) so the app stays usable. The only thing lost until a clean
    // reload is the PE category-index speed-up.
    const fallbackTimer = setTimeout(() => {
      if (settled) return;
      showToast('⚠️ الموقع مفتوح بمكان تاني وبيمنع تحديث التخزين — بيتابع الآن بدون التحديث، سكّر كل التبويبات التانية وحدّث الصفحة لتفعيله بالكامل');
      const fallbackReq = indexedDB.open(IDB_NAME);
      fallbackReq.onsuccess = () => { if (!settled) { settled = true; resolve(fallbackReq.result); } };
      fallbackReq.onerror = () => { if (!settled) { settled = true; console.error('IDB fallback open failed', fallbackReq.error); resolve(null); } };
    }, 3000);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      const tx = e.target.transaction;
      if (!db.objectStoreNames.contains(IDB_STORE_CASES)) db.createObjectStore(IDB_STORE_CASES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(IDB_STORE_META)) db.createObjectStore(IDB_STORE_META);
      if (!db.objectStoreNames.contains(IDB_STORE_NOTE_VIDEOS)) db.createObjectStore(IDB_STORE_NOTE_VIDEOS);
      if (!db.objectStoreNames.contains(IDB_STORE_NOTE_IMAGES)) db.createObjectStore(IDB_STORE_NOTE_IMAGES);
      if (!db.objectStoreNames.contains(IDB_STORE_ECG)) db.createObjectStore(IDB_STORE_ECG, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(IDB_STORE_SOUNDS)) db.createObjectStore(IDB_STORE_SOUNDS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(IDB_STORE_XRAY)) db.createObjectStore(IDB_STORE_XRAY, { keyPath: 'id' });
      // peSteps: add a 'category' index (v11) so the PE module can pull just
      // the active category's rows — including their embedded base64 images —
      // instead of scanning/loading the whole store on every open.
      const peStore = db.objectStoreNames.contains(IDB_STORE_PE)
        ? tx.objectStore(IDB_STORE_PE)
        : db.createObjectStore(IDB_STORE_PE, { keyPath: 'id' });
      if (!peStore.indexNames.contains('category')) peStore.createIndex('category', 'category');
      if (!db.objectStoreNames.contains(IDB_STORE_PHARMA)) db.createObjectStore(IDB_STORE_PHARMA, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(IDB_STORE_TTS_CACHE)) db.createObjectStore(IDB_STORE_TTS_CACHE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(IDB_STORE_FS_HANDLES)) db.createObjectStore(IDB_STORE_FS_HANDLES);
      if (!db.objectStoreNames.contains(DRMONIC_APP_STATE_STORE)) db.createObjectStore(DRMONIC_APP_STATE_STORE, { keyPath: 'key' });
    };
    req.onblocked = () => {
      showToast('⚠️ الموقع مفتوح بتبويب أو نافذة ثانية — أغلقها كلها ثم أعد تحميل هذه الصفحة');
    };
    req.onsuccess = () => {
      if (settled) { try { req.result.close(); } catch (e) {} return; } // fallback already won the race
      settled = true;
      clearTimeout(fallbackTimer);
      const db = req.result;
      // So THIS tab doesn't later become the thing blocking a future
      // upgrade in another tab: release the connection and ask for a
      // reload when a newer version shows up.
      db.onversionchange = () => {
        db.close();
        _idbPromise = null;
        showToast('⚠️ في تحديث جديد للموقع — أعد تحميل الصفحة لتفعيله');
      };
      resolve(db);
    };
    req.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(fallbackTimer);
      console.error('IDB open failed', req.error);
      resolve(null);
    };
  });
  return _idbPromise;
}
// Cached generated audio per case: { id: caseId, text, chunks: [Blob...], createdAt }
// Re-used automatically as long as the case's reading text hasn't changed.
async function idbGetTtsCache(caseId) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_TTS_CACHE, 'readonly');
    const req = tx.objectStore(IDB_STORE_TTS_CACHE).get(caseId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function idbPutTtsCache(entry) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_TTS_CACHE, 'readwrite');
    tx.objectStore(IDB_STORE_TTS_CACHE).put(entry);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetAllCases() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_CASES, 'readonly');
    const req = tx.objectStore(IDB_STORE_CASES).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function idbPutCase(c) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_CASES, 'readwrite');
    tx.objectStore(IDB_STORE_CASES).put(c);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDeleteCase(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_CASES, 'readwrite');
    tx.objectStore(IDB_STORE_CASES).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbClearCases() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_CASES, 'readwrite');
    tx.objectStore(IDB_STORE_CASES).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbPutNoteVideo(id, blob) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NOTE_VIDEOS, 'readwrite');
    tx.objectStore(IDB_STORE_NOTE_VIDEOS).put(blob, id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetNoteVideo(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NOTE_VIDEOS, 'readonly');
    const req = tx.objectStore(IDB_STORE_NOTE_VIDEOS).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
/* File System Access API handles (PC only): lets a media item point at a file
   still living on disk instead of copying its bytes into browser storage. */
async function idbPutFsHandle(id, handle) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_FS_HANDLES, 'readwrite');
    tx.objectStore(IDB_STORE_FS_HANDLES).put(handle, id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetFsHandle(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_FS_HANDLES, 'readonly');
    const req = tx.objectStore(IDB_STORE_FS_HANDLES).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function idbDeleteNoteVideo(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NOTE_VIDEOS, 'readwrite');
    tx.objectStore(IDB_STORE_NOTE_VIDEOS).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbPutNoteImage(id, blob) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NOTE_IMAGES, 'readwrite');
    tx.objectStore(IDB_STORE_NOTE_IMAGES).put(blob, id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetNoteImage(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NOTE_IMAGES, 'readonly');
    const req = tx.objectStore(IDB_STORE_NOTE_IMAGES).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function idbDeleteNoteImage(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NOTE_IMAGES, 'readwrite');
    tx.objectStore(IDB_STORE_NOTE_IMAGES).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAllNoteVideoEntries() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NOTE_VIDEOS, 'readonly');
    const store = tx.objectStore(IDB_STORE_NOTE_VIDEOS);
    const keysReq = store.getAllKeys();
    const valsReq = store.getAll();
    tx.oncomplete = () => resolve(keysReq.result.map((k, i) => [k, valsReq.result[i]]));
    tx.onerror = () => reject(tx.error);
  });
}
async function idbClearNoteVideos() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NOTE_VIDEOS, 'readwrite');
    tx.objectStore(IDB_STORE_NOTE_VIDEOS).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetAllNoteImageEntries() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NOTE_IMAGES, 'readonly');
    const store = tx.objectStore(IDB_STORE_NOTE_IMAGES);
    const keysReq = store.getAllKeys();
    const valsReq = store.getAll();
    tx.oncomplete = () => resolve(keysReq.result.map((k, i) => [k, valsReq.result[i]]));
    tx.onerror = () => reject(tx.error);
  });
}
async function idbClearNoteImages() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NOTE_IMAGES, 'readwrite');
    tx.objectStore(IDB_STORE_NOTE_IMAGES).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetAllEcgCases() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_ECG, 'readonly');
    const req = tx.objectStore(IDB_STORE_ECG).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function idbPutEcgCase(entry) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_ECG, 'readwrite');
    tx.objectStore(IDB_STORE_ECG).put(entry);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDeleteEcgCase(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_ECG, 'readwrite');
    tx.objectStore(IDB_STORE_ECG).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbClearEcgCases() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_ECG, 'readwrite');
    tx.objectStore(IDB_STORE_ECG).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetAllSounds() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_SOUNDS, 'readonly');
    const req = tx.objectStore(IDB_STORE_SOUNDS).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function idbPutSound(entry) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_SOUNDS, 'readwrite');
    tx.objectStore(IDB_STORE_SOUNDS).put(entry);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDeleteSound(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_SOUNDS, 'readwrite');
    tx.objectStore(IDB_STORE_SOUNDS).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbClearSounds() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_SOUNDS, 'readwrite');
    tx.objectStore(IDB_STORE_SOUNDS).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetAllXrayCases() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_XRAY, 'readonly');
    const req = tx.objectStore(IDB_STORE_XRAY).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function idbPutXrayCase(entry) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_XRAY, 'readwrite');
    tx.objectStore(IDB_STORE_XRAY).put(entry);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDeleteXrayCase(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_XRAY, 'readwrite');
    tx.objectStore(IDB_STORE_XRAY).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbClearXrayCases() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_XRAY, 'readwrite');
    tx.objectStore(IDB_STORE_XRAY).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetAllPharmaCards() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_PHARMA, 'readonly');
    const req = tx.objectStore(IDB_STORE_PHARMA).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function idbPutPharmaCard(entry) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_PHARMA, 'readwrite');
    tx.objectStore(IDB_STORE_PHARMA).put(entry);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDeletePharmaCard(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_PHARMA, 'readwrite');
    tx.objectStore(IDB_STORE_PHARMA).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbClearPharmaCards() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_PHARMA, 'readwrite');
    tx.objectStore(IDB_STORE_PHARMA).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetAllPeSteps() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_PE, 'readonly');
    const req = tx.objectStore(IDB_STORE_PE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
// Loads just one category's steps (incl. their media) via the 'category' index —
// this is what the flowchart view uses day-to-day so opening PE never has to
// pull every category's images into memory at once. Falls back to a manual
// scan if the index isn't present yet (e.g. the blocked-tab fallback path
// opened an older DB version without triggering the upgrade).
async function idbGetPeStepsByCategory(cat) {
  const db = await openIDB();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    const store = db.transaction(IDB_STORE_PE, 'readonly').objectStore(IDB_STORE_PE);
    if (!store.indexNames.contains('category')) {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).filter(s => s.category === cat));
      req.onerror = () => reject(req.error);
      return;
    }
    const req = store.index('category').getAll(IDBKeyRange.only(cat));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
// Cheap per-category counts for the category chip row: walks index KEYS only
// (openKeyCursor never touches the actual records, so base64 media is never
// read off disk) — this is what makes the counts fast even with huge media.
// Falls back to a manual scan if the index isn't present yet.
async function idbGetPeCategoryCounts() {
  const db = await openIDB();
  if (!db) return {};
  return new Promise((resolve, reject) => {
    const counts = {};
    const store = db.transaction(IDB_STORE_PE, 'readonly').objectStore(IDB_STORE_PE);
    if (!store.indexNames.contains('category')) {
      const req = store.getAll();
      req.onsuccess = () => {
        (req.result || []).forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
        resolve(counts);
      };
      req.onerror = () => reject(req.error);
      return;
    }
    const req = store.index('category').openKeyCursor();
    req.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) { counts[cursor.key] = (counts[cursor.key] || 0) + 1; cursor.continue(); }
      else resolve(counts);
    };
    req.onerror = () => reject(req.error);
  });
}
async function idbPutPeStep(entry) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_PE, 'readwrite');
    tx.objectStore(IDB_STORE_PE).put(entry);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDeletePeStep(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_PE, 'readwrite');
    tx.objectStore(IDB_STORE_PE).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbClearPeSteps() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_PE, 'readwrite');
    tx.objectStore(IDB_STORE_PE).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbSetMeta(key, value) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_META, 'readwrite');
    tx.objectStore(IDB_STORE_META).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGetMeta(key) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_META, 'readonly');
    const req = tx.objectStore(IDB_STORE_META).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function writeCaseFile(c) {
  if (!folderConnected || !folderHandle || !c?.id || c.id === 'undefined' || c.id === 'null') return false;
  try {
    const dir = await folderHandle.getDirectoryHandle('cases', { create: true });
    const fh = await dir.getFileHandle(`${c.id}.json`, { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(c, null, 2));
    await w.close();
    return true;
  } catch (err) {
    console.error('writeCaseFile failed:', err);
    return false;
  }
}
async function deleteCaseFile(id) {
  if (!folderConnected || !folderHandle) return;
  try {
    const dir = await folderHandle.getDirectoryHandle('cases', { create: true });
    await dir.removeEntry(`${id}.json`);
  } catch (err) { /* file may not exist — fine */ }
}
async function loadCasesFromFolder() {
  if (!folderConnected || !folderHandle) return null;
  try {
    const dir = await folderHandle.getDirectoryHandle('cases', { create: true });
    const loaded = [];
    for await (const entry of dir.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.json')) {
        if (entry.name === 'undefined.json' || entry.name === 'null.json') continue;
        try {
          const text = await (await entry.getFile()).text();
          const c = JSON.parse(text);
          if (!c.id) c.id = entry.name.replace(/\.json$/, '');
          if (c.id && c.id !== 'undefined' && c.id !== 'null') loaded.push(c);
        } catch (e) { /* skip corrupt file */ }
      }
    }
    // MERGE, never overwrite: a case that exists in memory/IndexedDB (e.g. created on a
    // device without folder-sync support, like Android tablets) but isn't in this folder
    // yet must NOT disappear. Union by id — folder version wins on conflict (assumed newer
    // export), everything else already in `cases` is kept and gets written back to the folder.
    const byId = new Map();
    for (const c of cases) if (c?.id) byId.set(c.id, c);
    for (const c of loaded) if (c?.id) byId.set(c.id, c);
    const merged = Array.from(byId.values());
    merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    cases = merged;
    for (const c of cases) {
      await idbPutCase(c);           // mirror into IndexedDB as fast local cache
      await writeCaseFile(c);        // and make sure the folder has everything too (fills gaps)
    }
    return cases;
  } catch (err) {
    console.error('loadCasesFromFolder failed:', err);
    return null;
  }
}
async function syncAllCasesToFolder() {
  for (const c of cases) await writeCaseFile(c);
}

function updateFolderStatusUI() {
  const btn = document.getElementById('folderSyncBtn');
  if (!btn) return;
  if (!FS_FOLDER_SUPPORTED) {
    btn.style.display = 'none';
    return;
  }
  btn.style.display = '';
  if (folderConnected) {
    btn.innerHTML = '📁 متصل بمجلد الحفظ ✅';
    btn.title = 'كل حالة تتسيف تلقائي كملف بهذا المجلد';
  } else if (folderHandle) {
    btn.innerHTML = '🔄 إعادة الاتصال بمجلد الحفظ';
    btn.title = 'المتصفح يحتاج تأكيد الصلاحية من جديد كل جلسة';
  } else {
    btn.innerHTML = '🔗 ربط مجلد للحفظ التلقائي';
    btn.title = 'اختر مجلد على جهازك — كل حالة بتتسيف فيه كملف مستقل';
  }
}

async function connectSaveFolder() {
  if (!FS_FOLDER_SUPPORTED) {
    alert('⚠️ ربط مجلد تلقائي متوفر بس على Chrome أو Edge بالكمبيوتر. بهذا المتصفح، الحالات محفوظة بأمان جوا التطبيق (IndexedDB) بدون حد الـ5-10 ميجا القديم، وتقدر تستخدم "Backup JSON" للنسخ الاحتياطي اليدوي.');
    return;
  }
  if (folderHandle && !folderConnected) return reconfirmFolderAccess();
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    folderHandle = handle;
    folderConnected = true;
    await idbSetMeta('folderHandle', handle);
    updateFolderStatusUI();
    await syncAllCasesToFolder();
    await loadCasesFromFolder();
    renderCases();
    showToast('✅ اترابط المجلد — كل حالة بتتسيف فيه من الحين');
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error(err);
      alert('⚠️ ما قدر يربط المجلد.');
    }
  }
}

async function reconfirmFolderAccess() {
  if (!folderHandle) return false;
  try {
    const perm = await folderHandle.requestPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      folderConnected = true;
      updateFolderStatusUI();
      await loadCasesFromFolder();
      renderCases();
      showToast('✅ اترجع الاتصال بالمجلد');
      return true;
    }
  } catch (err) { console.error(err); }
  return false;
}

async function tryReconnectFolderSilently() {
  if (!FS_FOLDER_SUPPORTED) return;
  try {
    const handle = await idbGetMeta('folderHandle');
    if (!handle) return;
    folderHandle = handle;
    const perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      folderConnected = true;
      await loadCasesFromFolder();
    }
  } catch (err) { /* handle may be stale/revoked — user can reconnect manually */ }
}

// Persist one case (create or update) to whichever stores are active.
// Returns true if it was saved somewhere durable.
async function persistCase(c) {
  let ok = false;
  try { await idbPutCase(c); ok = true; } catch (err) { console.error('IndexedDB save failed:', err); }
  if (folderConnected) {
    const wroteFile = await writeCaseFile(c);
    ok = ok || wroteFile;
  }
  return ok;
}
async function persistDelete(id) {
  try { await idbDeleteCase(id); } catch (err) { console.error(err); }
  if (folderConnected) await deleteCaseFile(id);
}

async function initCasesStorage() {
  try {
    let loaded = await idbGetAllCases();

    // One-time migration for existing users: pull any cases still sitting
    // in the old localStorage key so nothing gets lost in the switch-over.
    if (!loaded.length) {
      const legacy = JSON.parse(localStorage.getItem('drmonic_cases') || '[]');
      if (legacy.length) {
        for (const c of legacy) {
          if (!c.id) c.id = genId();
          await idbPutCase(c);
        }
        loaded = legacy;
      }
    }
    loaded.forEach(c => { if (!c.id) c.id = genId(); });
    loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    cases = loaded;
  } catch (err) {
    console.error('IndexedDB unavailable, falling back to localStorage:', err);
    cases = JSON.parse(localStorage.getItem('drmonic_cases') || '[]');
    cases.forEach(c => { if (!c.id) c.id = genId(); });
  }

  await tryReconnectFolderSilently();
  updateFolderStatusUI();
}

function caseKey(c, idx) {
  return c?.createdAt?.toString() || String(idx);
}

function isCaseDone(c, idx) {
  const key = caseKey(c, idx);
  return doneCases.has(key) || doneCases.has(String(idx));
}

function isCaseFavorite(c, idx) {
  const key = caseKey(c, idx);
  return favoriteCases.has(key) || favoriteCases.has(String(idx));
}

function saveDoneCases() {
  localStorage.setItem('drmonic_done', JSON.stringify([...doneCases]));
}

function saveFavoriteCases() {
  localStorage.setItem('drmonic_favorites', JSON.stringify([...favoriteCases]));
}

function setHomeMode(mode) {
  homeMode = mode;
  rapidIndex = 0;
  rapidDirection = 1;
  examIndex = 0;
  examRevealed = false;
  localStorage.setItem('drmonic_home_mode', mode);
  renderCases();
}

function specProgress(spec) {
  const list = spec === 'all' ? cases : cases.filter(c => c.specialty === spec);
  if (!list.length) return 0;
  const done = list.filter(c => isCaseDone(c, cases.indexOf(c))).length;
  return Math.round((done / list.length) * 100);
}

function ensureHomeModeBar() {
  if (document.getElementById('reviewModeBar')) {
    document.querySelectorAll('.review-mode-chip').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === homeMode));
    return;
  }
  const bar = document.createElement('div');
  bar.id = 'reviewModeBar';
  bar.className = 'review-mode-bar';
  bar.innerHTML = `
    <button class="review-mode-chip" data-mode="study" onclick="setHomeMode('study')">Flashcards</button>
    <button class="review-mode-chip" data-mode="rapid" onclick="setHomeMode('rapid')">Rapid Review</button>
    <button class="review-mode-chip" data-mode="favorites" onclick="setHomeMode('favorites')">★ Favorites</button>
    <button class="review-mode-chip" data-mode="exam" onclick="setHomeMode('exam')">📝 وضع الامتحان</button>
  `;
  const specialtyBar = document.getElementById('specialtyBar');
  specialtyBar?.parentNode?.insertBefore(bar, specialtyBar);
  document.querySelectorAll('.review-mode-chip').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === homeMode));
}

