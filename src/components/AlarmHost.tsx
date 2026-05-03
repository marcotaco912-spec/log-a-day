import { useEffect, useRef, useState } from "react";
import { AlarmModal } from "./AlarmModal";
import type { Reminder } from "@/lib/types";
import { getReminder } from "@/lib/db";
import { useReminders, useAppSettings } from "@/lib/store";
import { effectiveTimestamp } from "@/lib/types";
import { putReminder } from "@/lib/db";

// Watches reminders + listens for SW messages, surfaces in-app modal.
export function AlarmHost() {
  const reminders = useReminders();
  const [settings] = useAppSettings();
  const [active, setActive] = useState<Reminder | null>(null);
  const lastFiredRef = useRef<Record<string, number>>({});

  // Listen for SW messages
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const handler = async (e: MessageEvent) => {
      if (e.data?.type === "FIRE_REMINDER" && e.data.id) {
        const r = await getReminder(e.data.id);
        if (r && !r.completed) setActive(r);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  // 60s polling fallback (also handles iOS where SW can't run in background).
  useEffect(() => {
    const tick = async () => {
      if (active) return;
      const now = Date.now();
      for (const r of reminders) {
        if (r.completed) continue;
        const ts = effectiveTimestamp(r);
        if (ts > now) continue;
        if (lastFiredRef.current[r.id] && now - lastFiredRef.current[r.id] < 5 * 60 * 1000) continue;
        if (r.notifiedAt && now - r.notifiedAt < 5 * 60 * 1000) continue;
        lastFiredRef.current[r.id] = now;
        // Try OS notification too if permission granted and document hidden.
        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted" &&
          document.visibilityState === "hidden"
        ) {
          try {
            const reg = await navigator.serviceWorker?.getRegistration();
            const opts: NotificationOptions = {
              body: r.notes.split("\n")[0] || "Tap to view",
              icon: "/icon-192.png",
              badge: "/icon-192.png",
              tag: r.id,
              data: { id: r.id },
              vibrate: [200, 100, 200],
            } as NotificationOptions;
            if (reg) await reg.showNotification(r.title, opts);
            else new Notification(r.title, opts);
          } catch {}
        }
        await putReminder({ ...r, notifiedAt: now });
        setActive(r);
        return;
      }
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    // Also tick when tab regains focus.
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reminders, active, settings.alarmSound]);

  return <AlarmModal reminder={active} onClose={() => setActive(null)} />;
}
