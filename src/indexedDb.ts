const DB_NAME = 'GalleryCacheDB';
const DB_VERSION = 1;

// In-memory fallback if all storage mechanisms are blocked or fail
const memoryCache: Record<string, any> = {};

// Helper to check if indexedDB is supported and not blocked
function isIndexedDBSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== undefined;
  } catch (e) {
    return false;
  }
}

export async function openDB(): Promise<IDBDatabase | null> {
  if (!isIndexedDBSupported()) {
    return null;
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache');
          }
        } catch (err) {
          console.warn("[IndexedDB Setup Error]", err);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("[IndexedDB Open Error]", request.error);
        resolve(null);
      };
    } catch (err) {
      console.warn("[IndexedDB Open Exception]", err);
      resolve(null);
    }
  });
}

export async function setCache(key: string, value: any): Promise<void> {
  // Always update memory cache as a backup
  memoryCache[key] = value;

  // 1. Try IndexedDB
  try {
    const db = await openDB();
    if (db) {
      return new Promise<void>((resolve) => {
        try {
          const transaction = db.transaction('cache', 'readwrite');
          const store = transaction.objectStore('cache');
          store.put(value, key);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => {
            console.warn("[IndexedDB write transaction error]", transaction.error);
            resolve();
          };
        } catch (txErr) {
          console.warn("[IndexedDB write session error]", txErr);
          resolve();
        }
      });
    }
  } catch (dbErr) {
    console.warn("[IndexedDB setCache error]", dbErr);
  }

  // 2. Try LocalStorage fallback
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (lsErr) {
    console.warn("[LocalStorage setCache fallback limit/blocked]", lsErr);
  }
}

export async function getCache(key: string): Promise<any> {
  // 1. Try memory cache first
  if (memoryCache[key] !== undefined) {
    return memoryCache[key];
  }

  // 2. Try IndexedDB
  try {
    const db = await openDB();
    if (db) {
      const result = await new Promise<any>((resolve) => {
        try {
          const transaction = db.transaction('cache', 'readonly');
          const store = transaction.objectStore('cache');
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => {
            console.warn("[IndexedDB read request error]", request.error);
            resolve(undefined);
          };
        } catch (txErr) {
          console.warn("[IndexedDB read transaction error]", txErr);
          resolve(undefined);
        }
      });
      if (result !== undefined) {
        // Hydrate memory cache
        memoryCache[key] = result;
        return result;
      }
    }
  } catch (dbErr) {
    console.warn("[IndexedDB getCache error]", dbErr);
  }

  // 3. Try LocalStorage fallback
  try {
    const lsItem = localStorage.getItem(key);
    if (lsItem) {
      const parsed = JSON.parse(lsItem);
      // Hydrate memory cache
      memoryCache[key] = parsed;
      return parsed;
    }
  } catch (lsErr) {
    console.warn("[LocalStorage getCache fallback blocked/error]", lsErr);
  }

  return undefined;
}

export async function deleteCache(key: string): Promise<void> {
  // 1. Delete from memory cache
  delete memoryCache[key];

  // 2. Delete from IndexedDB
  try {
    const db = await openDB();
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const transaction = db.transaction('cache', 'readwrite');
          const store = transaction.objectStore('cache');
          store.delete(key);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => {
            console.warn("[IndexedDB delete transaction error]", transaction.error);
            resolve();
          };
        } catch (txErr) {
          console.warn("[IndexedDB delete session error]", txErr);
          resolve();
        }
      });
    }
  } catch (dbErr) {
    console.warn("[IndexedDB deleteCache error]", dbErr);
  }

  // 3. Delete from LocalStorage
  try {
    localStorage.removeItem(key);
  } catch (lsErr) {
    console.warn("[LocalStorage deleteCache error]", lsErr);
  }
}

