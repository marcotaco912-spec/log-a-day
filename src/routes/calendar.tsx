import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Link2 } from "lucide-react";
import { useEntries } from "@/lib/store";
import { formatLongDate, moodOf, todayKey, truncate } from "@/lib/journal";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Daylog" },
      { name: "description", content: "Browse your journal entries by month." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const entries = useEntries();
  const navigate = useNavigate();
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const grid = useMemo(() => buildMonthGrid(view.y, view.m), [view]);
  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const recent = useMemo(() => {
    return Object.values(entries)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 30);
  }, [entries]);

  const todayK = todayKey();

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Calendar
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight">{monthLabel}</h1>
      </header>

      <section className="rounded-3xl bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() =>
              setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }))
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setView({ y: today.getFullYear(), m: today.getMonth() })}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Today
          </button>
          <button
            onClick={() =>
              setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }))
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
          {grid.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const has = !!entries[cell.key];
            const isToday = cell.key === todayK;
            return (
              <button
                key={i}
                onClick={() => navigate({ to: "/entry/$date", params: { date: cell.key } })}
                className={[
                  "relative flex aspect-square items-center justify-center rounded-xl text-sm transition-colors",
                  isToday
                    ? "bg-primary text-primary-foreground font-semibold"
                    : has
                    ? "bg-primary-soft text-foreground hover:bg-primary-soft/80"
                    : "text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {cell.day}
                {has && !isToday && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
                {has && isToday && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent entries
        </h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-card">
            No entries yet. Start writing today.
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((e) => {
              const m = moodOf(e.mood);
              return (
                <li key={e.date}>
                  <Link
                    to="/entry/$date"
                    params={{ date: e.date }}
                    className="flex gap-3 rounded-2xl bg-card p-3 shadow-card active:scale-[0.99] transition-transform"
                  >
                    {e.photos[0] ? (
                      <img
                        src={e.photos[0]}
                        alt=""
                        className="h-16 w-16 flex-none rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-primary-soft text-2xl">
                        {m?.emoji ?? "📝"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">
                          {formatLongDate(e.date)}
                        </p>
                        {m && <span className="text-base">{m.emoji}</span>}
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
                        {e.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-primary">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: ({ day: number; key: string } | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, key });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
