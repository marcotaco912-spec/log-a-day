import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { ReminderCard } from "@/components/ReminderCard";
import { SwipeRow } from "@/components/SwipeRow";
import { FAB } from "@/components/FAB";
import { useReminders, completeAndMaybeRepeat, deleteReminderById, snoozeReminder, useAppSettings } from "@/lib/store";
import type { Category, Reminder } from "@/lib/types";
import { CATEGORIES, reminderTimestamp, todayKey } from "@/lib/types";

export const Route = createFileRoute("/all")({
  head: () => ({
    meta: [
      { title: "All reminders — RemindMe" },
      { name: "description", content: "Browse, search, and filter every reminder." },
    ],
  }),
  component: AllPage,
});

type Filter = "all" | "today" | "week" | "category";

function AllPage() {
  const reminders = useReminders();
  const [settings] = useAppSettings();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [cat, setCat] = useState<Category | null>(null);
  const [showDone, setShowDone] = useState(false);

  const filtered = useMemo(() => {
    const now = Date.now();
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
    const endWeek = new Date(); endWeek.setDate(endWeek.getDate() + 7); endWeek.setHours(23, 59, 59, 999);
    const lq = q.trim().toLowerCase();

    return reminders.filter((r) => {
      if (lq && !`${r.title} ${r.notes}`.toLowerCase().includes(lq)) return false;
      if (filter === "today") {
        const ts = reminderTimestamp(r);
        return ts >= startToday.getTime() && ts <= endToday.getTime();
      }
      if (filter === "week") {
        const ts = reminderTimestamp(r);
        return ts >= now && ts <= endWeek.getTime();
      }
      if (filter === "category" && cat) return r.category === cat;
      return true;
    });
  }, [reminders, q, filter, cat]);

  const open = filtered.filter((r) => !r.completed).sort((a, b) => reminderTimestamp(a) - reminderTimestamp(b));
  const done = filtered.filter((r) => r.completed).sort((a, b) => (b.notifiedAt ?? 0) - (a.notifiedAt ?? 0));

  const renderRow = (r: Reminder) => (
    <SwipeRow
      key={r.id}
      onComplete={() => completeAndMaybeRepeat(r.id)}
      onDelete={() => deleteReminderById(r.id)}
      onSnooze={() => snoozeReminder(r.id, settings.snoozeMinutes)}
    >
      <ReminderCard reminder={r} onClick={() => nav({ to: "/edit/$id", params: { id: r.id } })} />
    </SwipeRow>
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">All reminders</h1>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reminders…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {[
          { id: "all", label: "All" },
          { id: "today", label: "Today" },
          { id: "week", label: "This week" },
          { id: "category", label: "By category" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as Filter)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              filter === f.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "category" && (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(cat === c.id ? null : c.id as Category)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                cat === c.id ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `var(--cat-${c.id})` }} />
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {open.length === 0 && done.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No reminders match.</p>
        ) : open.map(renderRow)}
      </div>

      {done.length > 0 && (
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="flex w-full items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-medium"
          >
            {showDone ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Done ({done.length})
          </button>
          {showDone && <div className="space-y-2">{done.map(renderRow)}</div>}
        </div>
      )}

      <FAB />
    </div>
  );
}
