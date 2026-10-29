/* Raayan Quizz — tiny IndexedDB store for things the user uploads (quiz JSON, PDF books).
 * Everything stays on this device; nothing is sent anywhere (GitHub Pages is static). */
(() => {
  "use strict";
  const DB = "raayan-quizz", VER = 1;
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!("indexedDB" in window)) { rej(new Error("IndexedDB unavailable")); return; }
      const r = indexedDB.open(DB, VER);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains("quizzes")) d.createObjectStore("quizzes", { keyPath: "id" });
        if (!d.objectStoreNames.contains("books")) d.createObjectStore("books", { keyPath: "id" });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const tx = (store, mode, fn) => open().then((d) => new Promise((res, rej) => {
    const t = d.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => res(req && req.result);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  }));
  window.RQStore = {
    get: (store, id) => tx(store, "readonly", (s) => s.get(id)),
    all: (store) => tx(store, "readonly", (s) => s.getAll()).catch(() => []),
    put: (store, obj) => tx(store, "readwrite", (s) => s.put(obj)),
    del: (store, id) => tx(store, "readwrite", (s) => s.delete(id)),
    usage: async () => { try { const e = await navigator.storage.estimate(); return { used: e.usage || 0, quota: e.quota || 0 }; } catch { return null; } },
  };
})();
