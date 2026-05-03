import { useEffect, useRef } from "react";

type Props<T extends string | number> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  width?: number;
};

const ITEM_H = 40;

export function WheelPicker<T extends string | number>({
  options,
  value,
  onChange,
  width,
}: Props<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const settling = useRef<number | null>(null);

  // Sync scroll to selected
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = options.findIndex((o) => o.value === value);
    if (idx < 0) return;
    el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  }, [value, options]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    if (settling.current) window.clearTimeout(settling.current);
    settling.current = window.setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_H);
      const opt = options[Math.max(0, Math.min(options.length - 1, idx))];
      if (opt && opt.value !== value) onChange(opt.value);
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }, 120);
  };

  return (
    <div
      className="relative h-[160px] overflow-hidden"
      style={{ width: width ?? "100%" }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 rounded-lg bg-primary/10"
        aria-hidden
      />
      <div
        ref={ref}
        onScroll={onScroll}
        className="scrollbar-hide h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollPaddingBlock: ITEM_H * 2 }}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {options.map((o) => (
          <div
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={`flex h-10 snap-center items-center justify-center text-base ${
              o.value === value ? "font-semibold text-foreground" : "text-muted-foreground"
            }`}
          >
            {o.label}
          </div>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}
