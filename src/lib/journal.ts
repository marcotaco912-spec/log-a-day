export type Mood = "amazing" | "good" | "okay" | "low" | "sad";

export const MOODS: { id: Mood; emoji: string; label: string }[] = [
  { id: "amazing", emoji: "😄", label: "Amazing" },
  { id: "good", emoji: "😊", label: "Good" },
  { id: "okay", emoji: "😐", label: "Okay" },
  { id: "low", emoji: "😔", label: "Low" },
  { id: "sad", emoji: "😢", label: "Sad" },
];

export type JournalLink = { id: string; url: string; label?: string };

export type JournalEntry = {
  date: string; // YYYY-MM-DD
  text: string;
  mood: Mood | null;
  tags: string[];
  photos: string[]; // data URLs
  links: JournalLink[];
  updatedAt: number;
};

export const STORAGE_KEY = "daylog.entries.v1";
export const SETTINGS_KEY = "daylog.settings.v1";

export type Settings = {
  reminder: boolean;
  reminderTime: string;
  appLock: boolean;
  darkMode: boolean;
};

export const defaultSettings: Settings = {
  reminder: false,
  reminderTime: "20:00",
  appLock: false,
  darkMode: false,
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptyEntry(date: string): JournalEntry {
  return { date, text: "", mood: null, tags: [], photos: [], links: [], updatedAt: Date.now() };
}

export function moodOf(id: Mood | null) {
  return MOODS.find((m) => m.id === id);
}

export function formatLongDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatHeroDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const wd = dt.toLocaleDateString(undefined, { weekday: "long" });
  const md = dt.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  return `${wd}, ${md} · ${y}`;
}

export function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trim() + "…" : s;
}

export function wordCount(s: string) {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function faviconFor(url: string): string | null {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return null;
  }
}

export function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}
