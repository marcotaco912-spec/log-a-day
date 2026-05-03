// RemindMe service worker
// Schedules notifications by polling IndexedDB every 30s.
// Note: This works best on Android. iOS Safari does not run SWs in background reliably.

const DB_NAME = "remindme-v1";
const DB_VERSION = 1;
const STORE = "reminders";
const POLL_MS = 30 * 1000;

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
  schedulePoll();
});

self.addEventListener("message", (e) => {
  const data = e.data || {};
  if (data.type === "SCHEDULES_UPDATED" || data.type === "PING") {
    checkAndFire();
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const id = e.notification.tag;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const url = `/?fire=${encodeURIComponent(id || "")}`;
    for (const c of all) {
      if ("focus" in c) {
        try { c.postMessage({ type: "FIRE_REMINDER", id }); } catch {}
        return c.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      // The main app handles upgrades. If SW activates first, we just create the store.
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("by-date", "date");
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings");
      }
    };
  });
}

async function readAll() {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function writeOne(r) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(r);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
}

function reminderTimestamp(r) {
  const [y, m, d] = r.date.split("-").map(Number);
  if (r.allDay) return new Date(y, m - 1, d, 9, 0, 0).getTime();
  const [hh, mm] = r.time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0).getTime();
}

function effectiveTs(r) {
  return r.snoozedUntil && r.snoozedUntil > 0 ? r.snoozedUntil : reminderTimestamp(r);
}

async function checkAndFire() {
  const all = await readAll();
  const now = Date.now();
  for (const r of all) {
    if (r.completed) continue;
    const ts = effectiveTs(r);
    if (ts > now) continue;
    // Avoid re-firing within 5 minutes
    if (r.notifiedAt && now - r.notifiedAt < 5 * 60 * 1000) continue;

    const body = (r.notes && r.notes.split("\n")[0]) || "Tap to view";
    try {
      await self.registration.showNotification(r.title || "Reminder", {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: r.id,
        renotify: true,
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: { id: r.id },
      });
      // Notify any open clients to fire the in-app alarm too.
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of clients) {
        try { c.postMessage({ type: "FIRE_REMINDER", id: r.id }); } catch {}
      }
      r.notifiedAt = now;
      await writeOne(r);
    } catch (err) {
      // ignore
    }
  }
}

function schedulePoll() {
  checkAndFire();
  setInterval(checkAndFire, POLL_MS);
}

// Cache shell for offline (basic network-first).
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("/") || new Response("Offline", { status: 503 }))
    );
  }
});
