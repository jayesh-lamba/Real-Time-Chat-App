const DB_NAME = "ChatAppCryptoDB";
const STORE_NAME = "private_keys";
const DB_VERSION = 1;

/**
 * Opens the IndexedDB database.
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

/**
 * Saves the hex-encoded X25519 private key for a user.
 */
export const savePrivateKey = async (userId, privateKeyHex) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(privateKeyHex, userId);

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error("savePrivateKey IndexedDB error:", error);
  }
};

/**
 * Retrieves the hex-encoded X25519 private key for a user.
 */
export const getPrivateKey = async (userId) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(userId);

      request.onsuccess = (event) => resolve(event.target.result || null);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error("getPrivateKey IndexedDB error:", error);
    return null;
  }
};
