import { Image as ImageIcon, Link as LinkIcon, Repeat, Mail } from "lucide-react";
import type { Reminder } from "@/lib/types";
import { CATEGORIES, PRIORITIES, formatTime12, reminderTimestamp } from "@/lib/types";

type Props = {
  reminder: Reminder;
  onClick?: () => void;
  variant?: "default" | "overdue";
};

export function ReminderCard({ reminder: r, onClick, variant = "default" }: Props) {
  const cat = CATEGORIES.find((c) => c.id === r.category);
  const prio = PRIORITIES.find((p) => p.id === r.priority);
  const overdue = variant === "overdue" || reminderTimestamp(r) < Date.now();
  const completed = r.completed;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
        overdue && !completed ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
      } ${completed ? "opacity-60" : ""} shadow-card active:scale-[0.99]`}
    >
      <span
        className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: `var(--cat-${r.category})` }}
        aria-label={cat?.label}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`truncate text-base font-semibold ${completed ? "line-through" : ""}`}>
            {r.title || "Untitled"}
          </h3>
          {prio && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${prio.cls}`}>
              {prio.label}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className={overdue && !completed ? "font-medium text-destructive" : ""}>
            {r.allDay ? "All day" : formatTime12(r.time)}
          </span>
          {cat && <span>· {cat.label}</span>}
          {r.repeat !== "none" && (
            <span className="inline-flex items-center gap-1">
              <Repeat className="h-3 w-3" /> {r.repeat}
            </span>
          )}
          {r.photos.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> {r.photos.length}
            </span>
          )}
          {r.links.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <LinkIcon className="h-3 w-3" /> {r.links.length}
            </span>
          )}
          {r.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" />
            </span>
          )}
        </div>
        {r.notes && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.notes}</p>
        )}
      </div>
    </button>
  );
}
