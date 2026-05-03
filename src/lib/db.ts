import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Reminder, AppSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

interface RemindMeDB extends DBSchema {
  reminders: {
    key: string;
    value: Reminder;
    indexes: { "by-date": string; "by-completed": string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = "remindme-v1";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<RemindMeDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<RemindMeDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RemindMeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("reminders")) {
          const store = db.createObjectStore("reminders", { keyPath: "id" });
          store.createIndex("by-date", "date");
          store.createIndex("by-completed", "completed" as never);
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllReminders(): Promise<Reminder[]> {
  const db = await getDB();
  return db.getAll("reminders");
}

export async function putReminder(r: Reminder): Promise<void> {
  const db = await getDB();
  await db.put("reminders", r);
}

export async function deleteReminder(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("reminders", id);
}

export async function getReminder(id: string): Promise<Reminder | undefined> {
  const db = await getDB();
  return db.get("reminders", id);
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const s = await db.get("settings", "app");
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
}

export async function putSettings(s: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put("settings", s, "app");
}
