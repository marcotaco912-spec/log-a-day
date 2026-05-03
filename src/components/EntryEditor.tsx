import { useState } from "react";
import { useEntry } from "@/lib/store";
import { MOODS, formatHeroDate, todayKey, wordCount, type Mood } from "@/lib/journal";
import { TagInput } from "./TagInput";
import { PhotoSection } from "./PhotoSection";
import { LinkSection } from "./LinkSection";

export function EntryEditor({ date, hero = false }: { date: string; hero?: boolean }) {
  const { entry, update } = useEntry(date);
  const [text, setText] = useState(entry.text);

  // Sync if external entry changes (e.g. switching dates)
  if (entry.text !== text && entry.date !== date) {
    setText(entry.text);
  }

  return (
    <div className="space-y-6">
      <header className="pt-2">
        {hero ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {date === todayKey() ? "Today" : "Entry"}
            </p>
            <h1 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight">
              {formatHeroDate(date)}
            </h1>
          </>
        ) : (
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">
            {formatHeroDate(date)}
          </h1>
        )}
      </header>

      <section className="rounded-2xl bg-card p-4 shadow-card">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              update({ text: e.target.value });
            }}
            placeholder="What happened today?"
            rows={6}
            className="w-full resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="mt-2 flex justify-end text-[11px] text-muted-foreground">
            {wordCount(text)} words
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          How was it?
        </h2>
        <div className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-card">
          {MOODS.map((m) => {
            const active = entry.mood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => update({ mood: active ? null : (m.id as Mood) })}
                className={[
                  "flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-all active:scale-95",
                  active ? "bg-primary-soft scale-110" : "hover:bg-muted",
                ].join(" ")}
                aria-label={m.label}
              >
                {m.emoji}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tags
        </h2>
        <TagInput
          tags={entry.tags}
          onAdd={(t) => update({ tags: Array.from(new Set([...entry.tags, t])) })}
          onRemove={(t) => update({ tags: entry.tags.filter((x) => x !== t) })}
        />
      </section>

      <PhotoSection
        photos={entry.photos}
        onAdd={(url) => update({ photos: [...entry.photos, url] })}
        onRemove={(i) => update({ photos: entry.photos.filter((_, idx) => idx !== i) })}
      />

      <LinkSection
        links={entry.links}
        onAdd={(l) => update({ links: [...entry.links, l] })}
        onRemove={(id) => update({ links: entry.links.filter((l) => l.id !== id) })}
      />

      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        Last edited{" "}
        {new Date(entry.updatedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
    </div>
  );
}
