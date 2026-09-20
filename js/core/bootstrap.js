// Durable app-state mirror: all drmonic_* localStorage writes are copied to
// IndexedDB so browser cleanup/eviction of localStorage can be repaired.
const DRMONIC_IDB_NAME = 'drmonic_db';
const DRMONIC_IDB_VERSION = 13;
const DRMONIC_APP_STATE_STORE = 'appState';
const DRMONIC_AUTOBACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
let _appStateDbPromise = null;
let _appStateHydrated = false;

function openAppStateDB() {
  if (_appStateDbPromise) return _appStateDbPromise;
  _appStateDbPromise = new Promise((resolve) => {
    const req = indexedDB.open(DRMONIC_IDB_NAME, DRMONIC_IDB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      const tx = e.target.transaction;
      if (!db.objectStoreNames.contains('cases')) db.createObjectStore('cases', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      if (!db.objectStoreNames.contains('noteVideos')) db.createObjectStore('noteVideos');
      if (!db.objectStoreNames.contains('noteImages')) db.createObjectStore('noteImages');
      if (!db.objectStoreNames.contains('ecgCases')) db.createObjectStore('ecgCases', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('clinicalSounds')) db.createObjectStore('clinicalSounds', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('xrayCases')) db.createObjectStore('xrayCases', { keyPath: 'id' });
      const peStore = db.objectStoreNames.contains('peSteps')
        ? tx.objectStore('peSteps')
        : db.createObjectStore('peSteps', { keyPath: 'id' });
      if (!peStore.indexNames.contains('category')) peStore.createIndex('category', 'category');
      if (!db.objectStoreNames.contains('pharmaCards')) db.createObjectStore('pharmaCards', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('ttsCache')) db.createObjectStore('ttsCache', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('peFsHandles')) db.createObjectStore('peFsHandles');
      if (!db.objectStoreNames.contains('studyPlanPdfs')) db.createObjectStore('studyPlanPdfs', { keyPath: 'id' });
      if (!db.objectStoreNames.contains(DRMONIC_APP_STATE_STORE)) db.createObjectStore(DRMONIC_APP_STATE_STORE, { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { console.error('appState IndexedDB open failed', req.error); resolve(null); };
    req.onblocked = () => { console.warn('appState IndexedDB upgrade blocked by another open tab'); };
  });
  return _appStateDbPromise;
}

async function idbAppStateSet(key, value) {
  if (!key || !key.startsWith('drmonic_')) return;
  const db = await openAppStateDB();
  if (!db || !db.objectStoreNames.contains(DRMONIC_APP_STATE_STORE)) return;
  return new Promise(resolve => {
    const tx = db.transaction(DRMONIC_APP_STATE_STORE, 'readwrite');
    tx.objectStore(DRMONIC_APP_STATE_STORE).put({ key, value, updatedAt: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => { console.error('appState save failed', key, tx.error); resolve(false); };
  });
}

async function idbAppStateDelete(key) {
  if (!key || !key.startsWith('drmonic_')) return;
  const db = await openAppStateDB();
  if (!db || !db.objectStoreNames.contains(DRMONIC_APP_STATE_STORE)) return;
  return new Promise(resolve => {
    const tx = db.transaction(DRMONIC_APP_STATE_STORE, 'readwrite');
    tx.objectStore(DRMONIC_APP_STATE_STORE).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}

async function idbAppStateGetAll() {
  const db = await openAppStateDB();
  if (!db || !db.objectStoreNames.contains(DRMONIC_APP_STATE_STORE)) return [];
  return new Promise(resolve => {
    const tx = db.transaction(DRMONIC_APP_STATE_STORE, 'readonly');
    const req = tx.objectStore(DRMONIC_APP_STATE_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

async function migrateLocalStorageToAppState() {
  const jobs = [];
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('drmonic_')) jobs.push(idbAppStateSet(k, localStorage.getItem(k)));
  });
  await Promise.allSettled(jobs);
}

async function hydrateLocalStorageFromAppState() {
  if (_appStateHydrated) return false;
  _appStateHydrated = true;
  const rows = await idbAppStateGetAll();
  let restored = 0;
  rows.forEach(row => {
    if (!row?.key?.startsWith('drmonic_') || row.value == null) return;
    if (localStorage.getItem(row.key) == null) {
      localStorage.setItem(row.key, row.value);
      restored++;
    }
  });
  if (restored) sessionStorage.setItem('drmonic_restored_from_idb', String(Date.now()));
  return restored > 0;
}

(function mirrorLocalStorageWritesToIndexedDB() {
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const originalClear = Storage.prototype.clear;
  Storage.prototype.setItem = function(key, value) {
    const result = originalSetItem.apply(this, arguments);
    if (this === localStorage && String(key).startsWith('drmonic_')) idbAppStateSet(String(key), String(value));
    return result;
  };
  Storage.prototype.removeItem = function(key) {
    const oldValue = this === localStorage ? localStorage.getItem(key) : null;
    const result = originalRemoveItem.apply(this, arguments);
    if (this === localStorage && String(key).startsWith('drmonic_')) idbAppStateDelete(String(key));
    return result;
  };
  Storage.prototype.clear = function() {
    if (this === localStorage) console.warn('localStorage.clear() called; IndexedDB appState mirror is intentionally kept intact');
    return originalClear.apply(this, arguments);
  };
})();

