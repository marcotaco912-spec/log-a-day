import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Camera, Link2, Trash2, Plus, X } from "lucide-react";
import type { Reminder, Category, Priority, RepeatMode, ReminderLink } from "@/lib/types";
import { CATEGORIES, PRIORITIES, newId, formatTime12 } from "@/lib/types";
import { useAppSettings, saveReminder, deleteReminderById } from "@/lib/store";
import { WheelPicker } from "./WheelPicker";
import { haptic } from "@/lib/alarm";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const REPEATS: { id: RepeatMode; label: string }[] = [
  { id: "none", label: "None" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

function defaultReminder(defaultTime: string): Reminder {
  const now = new Date();
  return {
    id: newId(),
    title: "",
    notes: "",
    date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    time: defaultTime,
    allDay: false,
    repeat: "none",
    priority: "medium",
    category: "personal",
    photos: [],
    links: [],
    completed: false,
    createdAt: Date.now(),
  };
}

type Props = { existing?: Reminder };

export function ReminderEditor({ existing }: Props) {
  const nav = useNavigate();
  const [settings] = useAppSettings();
  const [r, setR] = useState<Reminder>(() => existing ?? defaultReminder(settings.defaultTime));
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Parse date pieces
  const [yy, mm, dd] = r.date.split("-").map(Number);
  const [hh, min] = r.time.split(":").map(Number);
  const ampm: "AM" | "PM" = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;

  const setDate = (y: number, m: number, d: number) => {
    const lastDay = new Date(y, m, 0).getDate();
    const safeD = Math.min(d, lastDay);
    setR((prev) => ({ ...prev, date: `${y}-${String(m).padStart(2, "0")}-${String(safeD).padStart(2, "0")}` }));
  };
  const setTime12 = (h12n: number, mn: number, am: "AM" | "PM") => {
    let h24 = h12n % 12;
    if (am === "PM") h24 += 12;
    setR((prev) => ({ ...prev, time: `${String(h24).padStart(2, "0")}:${String(mn).padStart(2, "0")}` }));
  };

  const onAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          })
      )
    ).then((datas) => {
      setR((prev) => ({ ...prev, photos: [...prev.photos, ...datas] }));
    });
    e.target.value = "";
  };

  const onAddLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const link: ReminderLink = { url, label: linkLabel.trim() || undefined };
    setR((prev) => ({ ...prev, links: [...prev.links, link] }));
    setLinkUrl("");
    setLinkLabel("");
  };

  const onSave = async () => {
    haptic(20);
    const titled = r.title.trim() || "Untitled reminder";
    await saveReminder({ ...r, title: titled, notifiedAt: null });
    nav({ to: "/" });
  };

  const onDelete = async () => {
    if (!existing) { nav({ to: "/" }); return; }
    haptic([20, 40, 20]);
    await deleteReminderById(existing.id);
    nav({ to: "/" });
  };

  // Year range
  const years = Array.from({ length: 8 }, (_, i) => yy - 2 + i);
  const days = Array.from({ length: new Date(yy, mm, 0).getDate() }, (_, i) => i + 1);

  return (
    <div className="space-y-5 pb-8">
      <header className="flex items-center justify-between">
        <button onClick={() => nav({ to: "/" })} className="-ml-2 flex items-center gap-1 rounded-lg p-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" /> Cancel
        </button>
        <h1 className="text-base font-semibold">{existing ? "Edit reminder" : "New reminder"}</h1>
        <button onClick={onSave} className="rounded-lg px-3 py-2 text-sm font-semibold text-primary">
          Save
        </button>
      </header>

      {/* Title */}
      <input
        autoFocus={!existing}
        value={r.title}
        onChange={(e) => setR((p) => ({ ...p, title: e.target.value }))}
        placeholder="What's the reminder?"
        className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-xl font-semibold placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-card"
      />

      {/* Date / Time */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Date & time</h2>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">All day</span>
            <input
              type="checkbox"
              checked={r.allDay}
              onChange={(e) => setR((p) => ({ ...p, allDay: e.target.checked }))}
              className="h-5 w-9 appearance-none rounded-full bg-muted transition-all checked:bg-primary relative cursor-pointer
              before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-all checked:before:translate-x-4"
            />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <WheelPicker
            options={MONTHS.map((label, i) => ({ value: i + 1, label }))}
            value={mm}
            onChange={(v) => setDate(yy, v, dd)}
          />
          <WheelPicker
            options={days.map((d) => ({ value: d, label: String(d) }))}
            value={dd}
            onChange={(v) => setDate(yy, mm, v)}
          />
          <WheelPicker
            options={years.map((y) => ({ value: y, label: String(y) }))}
            value={yy}
            onChange={(v) => setDate(v, mm, dd)}
          />
        </div>
        {!r.allDay && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <WheelPicker
              options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
              value={h12}
              onChange={(v) => setTime12(v, min, ampm)}
            />
            <WheelPicker
              options={Array.from({ length: 12 }, (_, i) => ({ value: i * 5, label: String(i * 5).padStart(2, "0") }))}
              value={Math.round(min / 5) * 5}
              onChange={(v) => setTime12(h12, v, ampm)}
            />
            <WheelPicker
              options={[{ value: "AM" as const, label: "AM" }, { value: "PM" as const, label: "PM" }]}
              value={ampm}
              onChange={(v) => setTime12(h12, min, v)}
            />
          </div>
        )}
        {!r.allDay && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {formatTime12(r.time)}
          </p>
        )}
      </section>

      {/* Repeat */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Repeat</h2>
        <div className="flex flex-wrap gap-2">
          {REPEATS.map((rp) => (
            <button
              key={rp.id}
              onClick={() => setR((p) => ({ ...p, repeat: rp.id }))}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                r.repeat === rp.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"
              }`}
            >
              {rp.label}
            </button>
          ))}
        </div>
      </section>

      {/* Priority */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Priority</h2>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.id}
              onClick={() => setR((prev) => ({ ...prev, priority: p.id as Priority }))}
              className={`flex-1 rounded-xl border py-2 text-sm font-medium transition-colors ${
                r.priority === p.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* Category */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Category</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setR((prev) => ({ ...prev, category: c.id as Category }))}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                r.category === c.id ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `var(--cat-${c.id})` }} />
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h2>
        <textarea
          value={r.notes}
          onChange={(e) => setR((p) => ({ ...p, notes: e.target.value }))}
          rows={3}
          placeholder="Add details…"
          className="w-full resize-none bg-transparent text-base placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </section>

      {/* Photos */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Photos</h2>
          {r.photos.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.photos.length} {r.photos.length === 1 ? "photo" : "photos"}</span>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {r.photos.map((src, i) => (
            <div key={i} className="relative shrink-0">
              <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover" />
              <button
                onClick={() => setR((p) => ({ ...p, photos: p.photos.filter((_, idx) => idx !== i) }))}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Camera className="h-5 w-5" />
            <span className="mt-1 text-[10px]">Add</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={onAddPhoto} />
        </div>
      </section>

      {/* Links */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Links</h2>
          {r.links.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.links.length} {r.links.length === 1 ? "link" : "links"}</span>
          )}
        </div>
        <div className="space-y-2">
          {r.links.map((l, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{l.label || l.url}</div>
                {l.label && <div className="truncate text-xs text-muted-foreground">{l.url}</div>}
              </div>
              <button onClick={() => setR((p) => ({ ...p, links: p.links.filter((_, idx) => idx !== i) }))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://…"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Label"
              className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button onClick={onAddLink} className="rounded-lg bg-primary px-3 text-primary-foreground">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Save / Delete */}
      <div className="space-y-2 pt-2">
        <button onClick={onSave} className="w-full rounded-2xl bg-gradient-primary py-4 text-base font-semibold text-primary-foreground shadow-fab active:scale-[0.99]">
          Save reminder
        </button>
        {existing && (
          <button onClick={onDelete} className="w-full rounded-2xl border border-destructive/40 py-3 text-sm font-medium text-destructive">
            Delete reminder
          </button>
        )}
      </div>
    </div>
  );
}
