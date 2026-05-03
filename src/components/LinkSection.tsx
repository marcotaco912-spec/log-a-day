import { useRef, useState } from "react";
import { ArrowUpRight, Link2, Plus, Trash2 } from "lucide-react";
import { faviconFor, prettyUrl, type JournalLink } from "@/lib/journal";

export function LinkSection({
  links,
  onAdd,
  onRemove,
}: {
  links: JournalLink[];
  onAdd: (link: JournalLink) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  const submit = () => {
    let cleaned = url.trim();
    if (!cleaned) return;
    if (!/^https?:\/\//i.test(cleaned)) cleaned = "https://" + cleaned;
    onAdd({
      id: Math.random().toString(36).slice(2),
      url: cleaned,
      label: label.trim() || undefined,
    });
    setUrl("");
    setLabel("");
    setOpen(false);
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Links
        </h2>
        {links.length > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {links.length} link{links.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {links.map((l) => (
          <SwipeRow key={l.id} onDelete={() => onRemove(l.id)}>
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-xl bg-muted">
                {faviconFor(l.url) ? (
                  <img
                    src={faviconFor(l.url)!}
                    alt=""
                    className="h-6 w-6"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {l.label ?? prettyUrl(l.url)}
                </p>
                {l.label && (
                  <p className="truncate text-[11px] text-muted-foreground">
                    {prettyUrl(l.url)}
                  </p>
                )}
              </div>
              <ArrowUpRight className="h-4 w-4 flex-none text-muted-foreground" />
            </a>
          </SwipeRow>
        ))}

        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card p-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Add Link
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-soft animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
            <h3 className="text-lg font-semibold">Save a link</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Capture a URL with an optional label.
            </p>

            <div className="mt-4 space-y-3">
              <input
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                inputMode="url"
                className="w-full rounded-xl bg-muted/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (optional)"
                className="w-full rounded-xl bg-muted/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-muted px-4 py-3 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!url.trim()}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Save Link
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SwipeRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-destructive">
        <button
          onClick={onDelete}
          className="flex h-full w-full items-center justify-center text-destructive-foreground"
          aria-label="Delete"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      <div
        style={{ transform: `translateX(${dx}px)` }}
        className="relative transition-transform"
        onTouchStart={(e) => {
          start.current = e.touches[0].clientX;
        }}
        onTouchMove={(e) => {
          if (start.current === null) return;
          const delta = e.touches[0].clientX - start.current;
          setDx(Math.max(-80, Math.min(0, delta + (dx === -80 ? -80 : 0))));
        }}
        onTouchEnd={() => {
          setDx(dx < -40 ? -80 : 0);
          start.current = null;
        }}
      >
        {children}
      </div>
    </div>
  );
}
