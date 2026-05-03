import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Check, Clock, ExternalLink, X } from "lucide-react";
import type { Reminder } from "@/lib/types";
import { formatLongDateTime } from "@/lib/types";
import { startAlarm, stopAlarm, haptic } from "@/lib/alarm";
import { completeAndMaybeRepeat, snoozeReminder, useAppSettings } from "@/lib/store";

type Props = {
  reminder: Reminder | null;
  onClose: () => void;
};

export function AlarmModal({ reminder, onClose }: Props) {
  const nav = useNavigate();
  const [settings] = useAppSettings();

  useEffect(() => {
    if (!reminder) return;
    if (settings.alarmSound) startAlarm();
    haptic([100, 50, 100, 50, 100]);
    return () => stopAlarm();
  }, [reminder, settings.alarmSound]);

  if (!reminder) return null;

  const onDismiss = async () => {
    stopAlarm();
    await completeAndMaybeRepeat(reminder.id);
    onClose();
  };
  const onSnooze = async () => {
    stopAlarm();
    await snoozeReminder(reminder.id, settings.snoozeMinutes);
    onClose();
  };
  const onEdit = () => {
    stopAlarm();
    onClose();
    nav({ to: "/edit/$id", params: { id: reminder.id } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onSnooze}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-up w-full max-w-md rounded-t-3xl bg-card p-6 shadow-soft safe-bottom"
      >
        {/* Pulsing icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute h-20 w-20 rounded-full bg-primary/30 pulse-ring" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-fab">
            <Bell className="h-7 w-7" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl font-bold leading-tight">{reminder.title}</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">{formatLongDateTime(reminder)}</p>

        {reminder.notes && (
          <p className="mt-4 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted px-3 py-2 text-sm">
            {reminder.notes}
          </p>
        )}

        {reminder.photos[0] && (
          <img
            src={reminder.photos[0]}
            alt=""
            className="mt-3 h-32 w-full rounded-xl object-cover"
          />
        )}

        {reminder.links.length > 0 && (
          <div className="mt-3 space-y-2">
            {reminder.links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <span className="truncate">{l.label || l.url}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onSnooze}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-background py-4 text-base font-semibold"
          >
            <Clock className="h-5 w-5" />
            Snooze {settings.snoozeMinutes}m
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-4 text-base font-semibold text-primary-foreground shadow-fab"
          >
            <Check className="h-5 w-5" />
            Dismiss
          </button>
        </div>

        <button
          onClick={onEdit}
          className="mt-3 w-full text-center text-xs font-medium text-muted-foreground"
        >
          Edit reminder
        </button>
      </div>
    </div>
  );
}
