import { useState } from "react";
import { X } from "lucide-react";

export function TagInput({
  tags,
  onAdd,
  onRemove,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}) {
  const [val, setVal] = useState("");

  const submit = () => {
    const cleaned = val.trim().replace(/^#+/, "").toLowerCase();
    if (!cleaned) return;
    onAdd(cleaned);
    setVal("");
  };

  return (
    <div className="rounded-2xl bg-card p-3 shadow-card">
      <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
        <span className="text-muted-foreground">#</span>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              submit();
            } else if (e.key === "Backspace" && !val && tags.length) {
              onRemove(tags[tags.length - 1]);
            }
          }}
          placeholder="add a tag"
          className="flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {val && (
          <button
            onClick={submit}
            className="text-xs font-medium text-primary"
          >
            Add
          </button>
        )}
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary"
            >
              #{t}
              <button
                onClick={() => onRemove(t)}
                className="text-primary/70 hover:text-primary"
                aria-label={`Remove ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
