import { useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";

export function PhotoSection({
  photos,
  onAdd,
  onRemove,
}: {
  photos: string[];
  onAdd: (dataUrl: string) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewer, setViewer] = useState<number | null>(null);
  const [pressTarget, setPressTarget] = useState<number | null>(null);
  const pressTimer = useRef<number | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") onAdd(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  const startPress = (i: number) => {
    pressTimer.current = window.setTimeout(() => setPressTarget(i), 500);
  };
  const cancelPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Photos
        </h2>
        {photos.length > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {photos.length} photo{photos.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {photos.map((src, i) => (
          <div
            key={i}
            className="relative h-24 w-24 flex-none overflow-hidden rounded-2xl bg-muted shadow-card"
            onTouchStart={() => startPress(i)}
            onTouchEnd={cancelPress}
            onMouseDown={() => startPress(i)}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
          >
            <button
              onClick={() => setViewer(i)}
              className="block h-full w-full"
              aria-label="View photo"
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
            {pressTarget === i && (
              <button
                onClick={() => {
                  onRemove(i);
                  setPressTarget(null);
                }}
                className="absolute inset-0 flex items-center justify-center bg-destructive/85 text-destructive-foreground"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-24 w-24 flex-none flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-5 w-5" />
          <span className="text-[10px] font-medium uppercase tracking-wide">Add</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {viewer !== null && photos[viewer] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setViewer(null)}
        >
          <button
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-white/15 p-2 text-white"
            onClick={() => setViewer(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={photos[viewer]}
            alt=""
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </section>
  );
}
