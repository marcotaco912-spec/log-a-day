import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { Check, Trash2, Clock } from "lucide-react";

type Props = {
  children: ReactNode;
  onComplete?: () => void;
  onDelete?: () => void;
  onSnooze?: () => void;
  disabled?: boolean;
};

const ACTION_THRESHOLD = 80;

export function SwipeRow({ children, onComplete, onDelete, onSnooze, disabled }: Props) {
  const [dx, setDx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (!animating) return;
    const t = setTimeout(() => {
      setDx(0);
      setAnimating(false);
    }, 260);
    return () => clearTimeout(t);
  }, [animating]);

  const onStart = (e: TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
  };
  const onMove = (e: TouchEvent) => {
    if (disabled || startX.current === null) return;
    const delta = e.touches[0].clientX - startX.current;
    setDx(Math.max(-160, Math.min(160, delta)));
  };
  const onEnd = () => {
    if (disabled) { startX.current = null; return; }
    const v = dx;
    startX.current = null;
    if (v > ACTION_THRESHOLD && onComplete) {
      setDx(400);
      setAnimating(true);
      setTimeout(() => onComplete(), 200);
      return;
    }
    if (v < -ACTION_THRESHOLD) {
      // Left swipe revealed: keep open at -140 so user can pick action
      setDx(-140);
      return;
    }
    setDx(0);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Right action background (complete) */}
      {dx > 0 && (
        <div className="absolute inset-0 flex items-center justify-start bg-success px-6 text-success-foreground">
          <Check className="h-6 w-6" />
        </div>
      )}
      {/* Left action background (snooze + delete) */}
      {dx < 0 && (
        <div className="absolute inset-y-0 right-0 flex items-stretch">
          {onSnooze && (
            <button
              onClick={() => { onSnooze(); setDx(0); }}
              className="flex w-[70px] items-center justify-center bg-warning text-warning-foreground"
              aria-label="Snooze"
            >
              <Clock className="h-5 w-5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => { onDelete(); setDx(0); }}
              className="flex w-[70px] items-center justify-center bg-destructive text-destructive-foreground"
              aria-label="Delete"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
      <div
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onClick={() => { if (dx !== 0) setDx(0); }}
        style={{
          transform: `translateX(${dx}px)`,
          transition: startX.current === null ? "transform 0.25s cubic-bezier(0.16,1,0.3,1)" : "none",
        }}
        className="relative bg-card"
      >
        {children}
      </div>
    </div>
  );
}
