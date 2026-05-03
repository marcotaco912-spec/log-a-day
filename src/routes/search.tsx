import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon, Image as ImageIcon, Link2 } from "lucide-react";
import { useEntries } from "@/lib/store";
import { MOODS, formatLongDate, moodOf, truncate, type Mood } from "@/lib/journal";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — Daylog" },
      { name: "description", content: "Search across your journal entries by text, tag, or mood." },
    ],
  }),
  component: SearchPage,
});

type Filter = "all" | "photos" | "links" | "tag" | "mood";

function SearchPage() {
  const entries = useEntries();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [moodFilter, setMoodFilter] = useState<Mood | null>(null);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    Object.values(entries).forEach((e) => e.tags.forEach((t) => s.add(t)));
    return Array.from(s);
  }, [entries]);

  const results = useMemo(() => {
    const list = Object.values(entries).sort((a, b) => (a.date < b.date ? 1 : -1));
    const term = q.trim().toLowerCase();
    return list.filter((e) => {
      if (term) {
        const hay = (e.text + " " + e.tags.join(" ") + " " + e.links.map((l) => l.label ?? l.url).join(" ")).toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (filter === "photos" && e.photos.length === 0) return false;
      if (filter === "links" && e.links.length === 0) return false;
      if (filter === "tag" && tagFilter && !e.tags.includes(tagFilter)) return false;
      if (filter === "mood" && moodFilter && e.mood !== moodFilter) return false;
      return true;
    });
  }, [entries, q, filter, tagFilter, moodFilter]);

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Search
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Find a memory</h1>
      </header>

      <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-card">
        <SearchIcon className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search entries, tags, links…"
          className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide">
        {(["all", "photos", "links", "tag", "mood"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              "flex-none rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground shadow-card",
            ].join(" ")}
          >
            {f === "photos" ? "Has Photos" : f === "links" ? "Has Links" : f === "tag" ? "By Tag" : f === "mood" ? "By Mood" : "All"}
          </button>
        ))}
      </div>

      {filter === "tag" && (
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-hide">
          {allTags.length === 0 && (
            <span className="text-xs text-muted-foreground">No tags yet.</span>
          )}
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
              className={[
                "flex-none rounded-full px-3 py-1 text-xs font-medium",
                tagFilter === t ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary",
              ].join(" ")}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {filter === "mood" && (
        <div className="flex justify-between rounded-2xl bg-card p-2 shadow-card">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMoodFilter(moodFilter === m.id ? null : m.id)}
              className={[
                "flex h-11 w-11 items-center justify-center rounded-full text-xl transition-all",
                moodFilter === m.id ? "bg-primary-soft scale-110" : "hover:bg-muted",
              ].join(" ")}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      )}

      <ul className="space-y-2">
        {results.length === 0 && (
          <li className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
            No entries match.
          </li>
        )}
        {results.map((e) => {
          const m = moodOf(e.mood);
          return (
            <li key={e.date}>
              <Link
                to="/entry/$date"
                params={{ date: e.date }}
                className="flex gap-3 rounded-2xl bg-card p-3 shadow-card"
              >
                {e.photos[0] ? (
                  <img src={e.photos[0]} alt="" className="h-16 w-16 flex-none rounded-xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-primary-soft text-2xl">
                    {m?.emoji ?? "📝"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold">{formatLongDate(e.date)}</p>
                    {m && <span>{m.emoji}</span>}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {truncate(e.text || "—", 80)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                    {e.photos.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {e.photos.length}
                      </span>
                    )}
                    {e.links.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        {e.links.length}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
