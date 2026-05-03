export type Priority = "low" | "medium" | "high";
export type Category =
  | "personal"
  | "work"
  | "health"
  | "shopping"
  | "finance"
  | "family";
export type RepeatMode = "none" | "daily" | "weekly" | "monthly" | "yearly";

export type ReminderLink = { url: string; label?: string };

export type Reminder = {
  id: string;
  title: string;
  notes: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  allDay: boolean;
  repeat: RepeatMode;
  priority: Priority;
  category: Category;
  photos: string[]; // base64 data urls
  links: ReminderLink[];
  completed: boolean;
  createdAt: number;
  snoozedUntil?: number | null;
  notifiedAt?: number | null;
};

export type AppSettings = {
  defaultTime: string; // HH:MM
  alarmSound: boolean;
  snoozeMinutes: 5 | 10 | 30 | 60;
  darkMode: boolean;
  onboarded: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  defaultTime: "09:00",
  alarmSound: true,
  snoozeMinutes: 10,
  darkMode: false,
  onboarded: false,
};

export const CATEGORIES: { id: Category; label: string; tokenVar: string }[] = [
  { id: "personal", label: "Personal", tokenVar: "--cat-personal" },
  { id: "work", label: "Work", tokenVar: "--cat-work" },
  { id: "health", label: "Health", tokenVar: "--cat-health" },
  { id: "shopping", label: "Shopping", tokenVar: "--cat-shopping" },
  { id: "finance", label: "Finance", tokenVar: "--cat-finance" },
  { id: "family", label: "Family", tokenVar: "--cat-family" },
];

export const PRIORITIES: { id: Priority; label: string; cls: string }[] = [
  { id: "low", label: "Low", cls: "bg-muted text-muted-foreground" },
  { id: "medium", label: "Medium", cls: "bg-warning/20 text-warning-foreground" },
  { id: "high", label: "High", cls: "bg-destructive/15 text-destructive" },
];

export function categoryColor(cat: Category): string {
  return `var(--cat-${cat})`;
}

export function reminderTimestamp(r: Pick<Reminder, "date" | "time" | "allDay">): number {
  const [y, m, d] = r.date.split("-").map(Number);
  if (r.allDay) return new Date(y, m - 1, d, 9, 0, 0).getTime();
  const [hh, mm] = r.time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0).getTime();
}

export function effectiveTimestamp(r: Reminder): number {
  return r.snoozedUntil && r.snoozedUntil > Date.now()
    ? r.snoozedUntil
    : reminderTimestamp(r);
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatLongDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const wd = dt.toLocaleDateString("en-US", { weekday: "long" });
  const mo = dt.toLocaleDateString("en-US", { month: "long" });
  return `${wd} · ${mo} ${d} · ${y}`;
}

export function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatLongDateTime(r: Reminder): string {
  const base = formatLongDate(r.date);
  if (r.allDay) return `${base} · All day`;
  return `${base} at ${formatTime12(r.time)}`;
}

export function newId(): string {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
