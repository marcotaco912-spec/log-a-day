import { createFileRoute } from "@tanstack/react-router";
import { useSettings } from "@/lib/store";
import { STORAGE_KEY } from "@/lib/journal";
import type { JournalEntry } from "@/lib/journal";
import { formatLongDate, moodOf } from "@/lib/journal";
import { Bell, Lock, Moon, FileText, FileDown } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Daylog" },
      { name: "description", content: "Customize Daylog: reminders, app lock, dark mode, and exports." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useSettings();

  const exportText = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, JournalEntry>) : {};
    const entries = Object.values(data).sort((a, b) => (a.date < b.date ? -1 : 1));
    let out = "Daylog — Journal Export\n\n";
    for (const e of entries) {
      const m = moodOf(e.mood);
      out += `${formatLongDate(e.date)}\n`;
      if (m) out += `Mood: ${m.emoji} ${m.label}\n`;
      if (e.tags.length) out += `Tags: ${e.tags.map((t) => "#" + t).join(" ")}\n`;
      out += `\n${e.text || "(no text)"}\n`;
      if (e.links.length) {
        out += `\nLinks:\n` + e.links.map((l) => `  • ${l.label ?? l.url} — ${l.url}`).join("\n") + "\n";
      }
      out += `\n${"─".repeat(40)}\n\n`;
    }
    download(out, "daylog-export.txt", "text/plain");
  };

  const exportPdf = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) as Record<string, JournalEntry>) : {};
    const entries = Object.values(data).sort((a, b) => (a.date < b.date ? -1 : 1));
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Daylog Export</title>
<style>
  body{font-family:-apple-system,Inter,system-ui,sans-serif;color:#1a1a2e;max-width:680px;margin:40px auto;padding:0 24px;line-height:1.55}
  h1{font-size:32px;margin:0 0 8px}
  .sub{color:#666;margin-bottom:32px}
  article{padding:24px 0;border-top:1px solid #eee}
  h2{font-size:18px;margin:0 0 6px}
  .meta{font-size:12px;color:#6C63FF;margin-bottom:8px}
  .text{white-space:pre-wrap}
  .tag{display:inline-block;background:#eee;color:#333;padding:2px 8px;border-radius:999px;font-size:11px;margin-right:4px}
  ul{padding-left:18px;font-size:13px}
  @media print{ article{page-break-inside:avoid} }
</style></head><body>
<h1>Daylog Journal</h1>
<p class="sub">${entries.length} ${entries.length === 1 ? "entry" : "entries"} · exported ${new Date().toLocaleDateString()}</p>
${entries.map((e) => {
  const m = moodOf(e.mood);
  return `<article>
    <div class="meta">${formatLongDate(e.date)}${m ? ` · ${m.emoji} ${m.label}` : ""}</div>
    <div class="text">${escape(e.text || "(no text)")}</div>
    ${e.tags.length ? `<p>${e.tags.map((t) => `<span class="tag">#${escape(t)}</span>`).join("")}</p>` : ""}
    ${e.links.length ? `<ul>${e.links.map((l) => `<li><a href="${escape(l.url)}">${escape(l.label ?? l.url)}</a></li>`).join("")}</ul>` : ""}
  </article>`;
}).join("")}
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Settings
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Preferences</h1>
      </header>

      <section className="overflow-hidden rounded-2xl bg-card shadow-card">
        <Row
          icon={<Bell className="h-4 w-4" />}
          title="Daily reminder"
          description="Get a nudge to log your day."
        >
          <Toggle
            checked={settings.reminder}
            onChange={(v) => setSettings({ reminder: v })}
          />
        </Row>
        {settings.reminder && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-sm text-muted-foreground">Reminder time</span>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => setSettings({ reminderTime: e.target.value })}
              className="rounded-lg bg-muted px-3 py-1.5 text-sm outline-none"
            />
          </div>
        )}
        <Divider />
        <Row
          icon={<Lock className="h-4 w-4" />}
          title="App lock"
          description="Require Face ID or passcode."
        >
          <Toggle
            checked={settings.appLock}
            onChange={(v) => setSettings({ appLock: v })}
          />
        </Row>
        <Divider />
        <Row
          icon={<Moon className="h-4 w-4" />}
          title="Dark mode"
          description="Easier on the eyes at night."
        >
          <Toggle
            checked={settings.darkMode}
            onChange={(v) => setSettings({ darkMode: v })}
          />
        </Row>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Export
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={exportPdf}
            className="flex flex-col items-start gap-2 rounded-2xl bg-card p-4 text-left shadow-card active:scale-[0.98] transition-transform"
          >
            <FileDown className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Export as PDF</p>
              <p className="text-[11px] text-muted-foreground">Print-ready</p>
            </div>
          </button>
          <button
            onClick={exportText}
            className="flex flex-col items-start gap-2 rounded-2xl bg-card p-4 text-left shadow-card active:scale-[0.98] transition-transform"
          >
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Export as Text</p>
              <p className="text-[11px] text-muted-foreground">Plain .txt</p>
            </div>
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          About
        </h2>
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <p className="text-sm font-semibold">Daylog</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Version 1.0.0</p>
          <p className="mt-3 text-xs text-muted-foreground">
            A quiet space for daily reflection. Your entries live on this device.
          </p>
        </div>
      </section>
    </div>
  );
}

function Row({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-7 w-12 flex-none rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-card transition-all",
          checked ? "left-[22px]" : "left-0.5",
        ].join(" ")}
      />
    </button>
  );
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
