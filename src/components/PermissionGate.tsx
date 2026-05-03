import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useAppSettings } from "@/lib/store";

export function PermissionGate() {
  const [settings, setSettings] = useAppSettings();
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  });

  // Onboarding screen
  if (!settings.onboarded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-primary text-primary-foreground shadow-fab">
          <Bell className="h-12 w-12" />
        </div>
        <h1 className="mt-6 text-3xl font-bold">RemindMe</h1>
        <p className="mt-3 max-w-xs text-muted-foreground">
          Reminders that <span className="font-semibold text-foreground">actually alarm</span>.
          We need notification permission so we can wake you when something is due.
        </p>
        <button
          onClick={async () => {
            if (typeof Notification !== "undefined" && Notification.permission === "default") {
              try {
                const result = await Notification.requestPermission();
                setPerm(result);
              } catch {}
            }
            await setSettings({ onboarded: true });
          }}
          className="mt-8 w-full max-w-xs rounded-2xl bg-gradient-primary py-4 text-base font-semibold text-primary-foreground shadow-fab"
        >
          Allow notifications
        </button>
        <button
          onClick={() => setSettings({ onboarded: true })}
          className="mt-3 text-sm text-muted-foreground"
        >
          Maybe later
        </button>
      </div>
    );
  }

  // Persistent banner if denied
  if (perm === "denied") {
    return (
      <div className="sticky top-0 z-40 flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
        <BellOff className="h-4 w-4 shrink-0" />
        <span>Notifications are off — reminders won't alert you. Enable in browser/system settings.</span>
      </div>
    );
  }

  return null;
}
