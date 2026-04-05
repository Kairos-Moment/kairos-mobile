// Stores audio file blobs in IndexedDB keyed by track id
const DB_NAME = 'kairos-offline-audio';
const STORE = 'tracks';
const VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function storeAudioBlob(trackId, file) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(file, String(trackId));
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

export async function getAudioBlobUrl(trackId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(String(trackId));
    req.onsuccess = (e) => {
      const blob = e.target.result;
      resolve(blob ? URL.createObjectURL(blob) : null);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function removeAudioBlob(trackId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(String(trackId));
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}
