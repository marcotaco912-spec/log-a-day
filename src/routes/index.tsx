import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ReminderCard } from "@/components/ReminderCard";
import { SwipeRow } from "@/components/SwipeRow";
import { FAB } from "@/components/FAB";
import { useReminders, classifyReminders, completeAndMaybeRepeat, deleteReminderById, snoozeReminder, useAppSettings } from "@/lib/store";
import { formatLongDate, todayKey } from "@/lib/types";
import type { Reminder } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — RemindMe" },
      { name: "description", content: "Your reminders for today, due, and upcoming." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const reminders = useReminders();
  const [settings] = useAppSettings();
  const nav = useNavigate();
  const groups = useMemo(() => classifyReminders(reminders), [reminders]);

  const summary = `${groups.dueToday.length} due today · ${groups.overdue.length} overdue · ${groups.upcoming.length} upcoming`;

  const Section = ({ title, items, variant }: { title: string; items: Reminder[]; variant?: "default" | "overdue" }) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-2">
        <h2 className={`px-1 text-xs font-semibold uppercase tracking-wider ${variant === "overdue" ? "text-destructive" : "text-muted-foreground"}`}>
          {title}
        </h2>
        <div className="space-y-2">
          {items.map((r) => (
            <SwipeRow
              key={r.id}
              onComplete={() => completeAndMaybeRepeat(r.id)}
              onDelete={() => deleteReminderById(r.id)}
              onSnooze={() => snoozeReminder(r.id, settings.snoozeMinutes)}
            >
              <ReminderCard reminder={r} variant={variant} onClick={() => nav({ to: "/edit/$id", params: { id: r.id } })} />
            </SwipeRow>
          ))}
        </div>
      </section>
    );
  };

  const empty =
    groups.overdue.length + groups.dueToday.length + groups.upcoming.length === 0;

  return (
    <div className="space-y-6">
      <header className="pb-1">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Today</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight">{formatLongDate(todayKey())}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
      </header>

      {empty ? (
        <div className="mt-12 rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-base font-semibold">All clear</p>
          <p className="mt-1 text-sm text-muted-foreground">Tap + to add your first reminder.</p>
        </div>
      ) : (
        <>
          <Section title="Overdue" items={groups.overdue} variant="overdue" />
          <Section title="Due today" items={groups.dueToday} />
          <Section title="Upcoming this week" items={groups.upcoming} />
        </>
      )}

      <FAB />
    </div>
  );
}
