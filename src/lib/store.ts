import { useCallback, useEffect, useState } from "react";
import {
  getAllReminders,
  putReminder,
  deleteReminder as dbDelete,
  getSettings,
  putSettings,
} from "./db";
import type { Reminder, AppSettings, RepeatMode } from "./types";
import { DEFAULT_SETTINGS, reminderTimestamp } from "./types";

// ---------- Reminders ----------
const reminderListeners = new Set<() => void>();
let cachedReminders: Reminder[] | null = null;

async function refresh() {
  cachedReminders = await getAllReminders();
  reminderListeners.forEach((l) => l());
}

export function useReminders(): Reminder[] {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    reminderListeners.add(fn);
    if (cachedReminders === null) refresh();
    return () => {
      reminderListeners.delete(fn);
    };
  }, []);
  return cachedReminders ?? [];
}

export async function saveReminder(r: Reminder) {
  await putReminder(r);
  await refresh();
  // Notify the SW that schedules changed.
  if (typeof navigator !== "undefined" && navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "SCHEDULES_UPDATED" });
  }
}

export async function deleteReminderById(id: string) {
  await dbDelete(id);
  await refresh();
}

export async function toggleComplete(id: string, completed: boolean) {
  const r = (cachedReminders ?? []).find((x) => x.id === id);
  if (!r) return;
  const next: Reminder = {
    ...r,
    completed,
    snoozedUntil: completed ? null : r.snoozedUntil,
    notifiedAt: completed ? Date.now() : r.notifiedAt,
  };
  await saveReminder(next);
}

export async function snoozeReminder(id: string, minutes: number) {
  const r = (cachedReminders ?? []).find((x) => x.id === id);
  if (!r) return;
  const next: Reminder = {
    ...r,
    snoozedUntil: Date.now() + minutes * 60 * 1000,
    notifiedAt: null,
  };
  await saveReminder(next);
}

export function nextOccurrence(r: Reminder): Reminder {
  // Move date forward by repeat unit.
  const [y, m, d] = r.date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const advance = (mode: RepeatMode) => {
    switch (mode) {
      case "daily": dt.setDate(dt.getDate() + 1); break;
      case "weekly": dt.setDate(dt.getDate() + 7); break;
      case "monthly": dt.setMonth(dt.getMonth() + 1); break;
      case "yearly": dt.setFullYear(dt.getFullYear() + 1); break;
      default: break;
    }
  };
  advance(r.repeat);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return {
    ...r,
    date: `${yy}-${mm}-${dd}`,
    completed: false,
    notifiedAt: null,
    snoozedUntil: null,
  };
}

export async function completeAndMaybeRepeat(id: string) {
  const r = (cachedReminders ?? []).find((x) => x.id === id);
  if (!r) return;
  if (r.repeat !== "none") {
    await saveReminder(nextOccurrence(r));
  } else {
    await toggleComplete(id, true);
  }
}

// ---------- Settings ----------
const settingsListeners = new Set<() => void>();
let cachedSettings: AppSettings | null = null;

async function refreshSettings() {
  cachedSettings = await getSettings();
  settingsListeners.forEach((l) => l());
}

export function useAppSettings(): [AppSettings, (patch: Partial<AppSettings>) => Promise<void>] {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    settingsListeners.add(fn);
    if (cachedSettings === null) refreshSettings();
    return () => {
      settingsListeners.delete(fn);
    };
  }, []);
  const set = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...(cachedSettings ?? DEFAULT_SETTINGS), ...patch };
    await putSettings(next);
    cachedSettings = next;
    settingsListeners.forEach((l) => l());
  }, []);
  return [cachedSettings ?? DEFAULT_SETTINGS, set];
}

export function useApplyTheme() {
  const [s] = useAppSettings();
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", s.darkMode);
  }, [s.darkMode]);
}

export function classifyReminders(items: Reminder[]) {
  const now = Date.now();
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
  const endWeek = new Date(); endWeek.setDate(endWeek.getDate() + 7); endWeek.setHours(23, 59, 59, 999);

  const overdue: Reminder[] = [];
  const dueToday: Reminder[] = [];
  const upcoming: Reminder[] = [];
  const completed: Reminder[] = [];

  for (const r of items) {
    if (r.completed) { completed.push(r); continue; }
    const ts = reminderTimestamp(r);
    if (ts < startToday.getTime()) overdue.push(r);
    else if (ts <= endToday.getTime()) dueToday.push(r);
    else if (ts <= endWeek.getTime()) upcoming.push(r);
    else upcoming.push(r);
  }
  // Snoozed reminders that are due now should be in dueToday.
  for (const r of items) {
    if (r.completed) continue;
    if (r.snoozedUntil && r.snoozedUntil <= now) {
      // already classified — fine
    }
  }

  const sortByTs = (a: Reminder, b: Reminder) => reminderTimestamp(a) - reminderTimestamp(b);
  overdue.sort(sortByTs);
  dueToday.sort(sortByTs);
  upcoming.sort(sortByTs);
  completed.sort((a, b) => (b.notifiedAt ?? 0) - (a.notifiedAt ?? 0));

  return { overdue, dueToday, upcoming, completed };
}
