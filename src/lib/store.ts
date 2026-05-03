import { useCallback, useEffect, useRef, useState } from "react";
import {
  STORAGE_KEY,
  SETTINGS_KEY,
  type JournalEntry,
  type Settings,
  defaultSettings,
  emptyEntry,
} from "./journal";

type EntriesMap = Record<string, JournalEntry>;

function loadEntries(): EntriesMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EntriesMap) : {};
  } catch {
    return {};
  }
}

function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

let memEntries: EntriesMap | null = null;
const listeners = new Set<() => void>();

function ensureLoaded() {
  if (memEntries === null) memEntries = loadEntries();
  return memEntries;
}

function notify() {
  listeners.forEach((l) => l());
}

function persist() {
  if (memEntries) localStorage.setItem(STORAGE_KEY, JSON.stringify(memEntries));
}

export function useEntries() {
  const [, force] = useState(0);
  useEffect(() => {
    ensureLoaded();
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return ensureLoaded();
}

export function useEntry(date: string) {
  const entries = useEntries();
  const entry = entries[date] ?? emptyEntry(date);

  const update = useCallback(
    (patch: Partial<JournalEntry> | ((e: JournalEntry) => JournalEntry)) => {
      const map = ensureLoaded();
      const current = map[date] ?? emptyEntry(date);
      const next =
        typeof patch === "function" ? patch(current) : { ...current, ...patch };
      next.updatedAt = Date.now();
      const isEmpty =
        !next.text.trim() &&
        !next.mood &&
        next.tags.length === 0 &&
        next.photos.length === 0 &&
        next.links.length === 0;
      if (isEmpty) {
        delete map[date];
      } else {
        map[date] = next;
      }
      persist();
      notify();
    },
    [date],
  );

  return { entry, update };
}

let memSettings: Settings | null = null;
const settingsListeners = new Set<() => void>();

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [, force] = useState(0);
  useEffect(() => {
    if (memSettings === null) memSettings = loadSettings();
    const fn = () => force((n) => n + 1);
    settingsListeners.add(fn);
    return () => {
      settingsListeners.delete(fn);
    };
  }, []);
  if (memSettings === null) memSettings = loadSettings();

  const set = useCallback((patch: Partial<Settings>) => {
    memSettings = { ...(memSettings ?? defaultSettings), ...patch };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(memSettings));
    settingsListeners.forEach((l) => l());
  }, []);

  return [memSettings, set];
}

// Apply dark mode class to <html> based on settings.
export function useApplyTheme() {
  const [settings] = useSettings();
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode]);
}

// Debounced auto-save helper (not strictly needed since we write synchronously,
// but kept for parity / future use).
export function useDebouncedRef<T>(value: T, delay = 300) {
  const ref = useRef(value);
  useEffect(() => {
    const t = setTimeout(() => {
      ref.current = value;
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return ref;
}
