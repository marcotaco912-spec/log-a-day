import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bell, Download, Moon, Trash2, Volume2 } from "lucide-react";
import { useAppSettings, useReminders, deleteReminderById } from "@/lib/store";
import { formatTime12 } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — RemindMe" },
      { name: "description", content: "Configure default time, alarm sound, snooze, and theme." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [s, setS] = useAppSettings();
  const reminders = useReminders();
  const completedCount = useMemo(() => reminders.filter((r) => r.completed).length, [reminders]);

  const exportCsv = () => {
    const rows = [
      ["id", "title", "date", "time", "category", "priority", "completed", "notes"],
      ...reminders.map((r) => [r.id, r.title, r.date, r.time, r.category, r.priority, String(r.completed), r.notes.replace(/\n/g, " ")]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "remindme-export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    // Print-friendly: open a window with HTML and trigger print
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>RemindMe export</title>
      <style>body{font-family:Inter,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin:0 0 16px}
      .r{border-bottom:1px solid #eee;padding:10px 0}.t{font-weight:600}.m{color:#666;font-size:12px}</style></head><body>
      <h1>RemindMe — ${reminders.length} reminders</h1>
      ${reminders.map((r) => `<div class="r"><div class="t">${escapeHtml(r.title)}</div><div class="m">${r.date} ${r.allDay ? "(all day)" : r.time} · ${r.category} · ${r.priority}${r.completed ? " · DONE" : ""}</div>${r.notes ? `<div>${escapeHtml(r.notes)}</div>` : ""}</div>`).join("")}
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const clearCompleted = async () => {
    if (!confirm(`Delete ${completedCount} completed reminders?`)) return;
    for (const r of reminders.filter((x) => x.completed)) {
      await deleteReminderById(r.id);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <section className="space-y-1 rounded-2xl border border-border bg-card shadow-card">
        <Row icon={<Bell className="h-5 w-5" />} label="Default reminder time" value={formatTime12(s.defaultTime)}>
          <input
            type="time"
            value={s.defaultTime}
            onChange={(e) => setS({ defaultTime: e.target.value })}
            className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
          />
        </Row>
        <Row icon={<Volume2 className="h-5 w-5" />} label="Alarm sound" value={s.alarmSound ? "On" : "Off"}>
          <Toggle checked={s.alarmSound} onChange={(v) => setS({ alarmSound: v })} />
        </Row>
        <Row icon={<Bell className="h-5 w-5" />} label="Snooze duration" value={`${s.snoozeMinutes} min`}>
          <select
            value={s.snoozeMinutes}
            onChange={(e) => setS({ snoozeMinutes: Number(e.target.value) as 5 | 10 | 30 | 60 })}
            className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
          >
            <option value={5}>5 min</option>
            <option value={10}>10 min</option>
            <option value={30}>30 min</option>
            <option value={60}>1 hour</option>
          </select>
        </Row>
        <Row icon={<Moon className="h-5 w-5" />} label="Dark mode" value={s.darkMode ? "On" : "Off"}>
          <Toggle checked={s.darkMode} onChange={(v) => setS({ darkMode: v })} />
        </Row>
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</h2>
        <button onClick={exportPdf} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card">
          <Download className="h-5 w-5 text-primary" />
          <span className="flex-1 text-sm font-medium">Export as PDF</span>
        </button>
        <button onClick={exportCsv} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card">
          <Download className="h-5 w-5 text-primary" />
          <span className="flex-1 text-sm font-medium">Export as CSV</span>
        </button>
        <button onClick={clearCompleted} disabled={completedCount === 0} className="flex w-full items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-left shadow-card disabled:opacity-50">
          <Trash2 className="h-5 w-5 text-destructive" />
          <span className="flex-1 text-sm font-medium text-destructive">Clear completed ({completedCount})</span>
        </button>
      </section>

      <p className="px-2 pt-4 text-center text-xs text-muted-foreground">
        RemindMe · Install to your home screen for the best experience
      </p>
    </div>
  );
}

function Row({ icon, label, value, children }: { icon: React.ReactNode; label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {value && <div className="text-xs text-muted-foreground">{value}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
      aria-pressed={checked}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
