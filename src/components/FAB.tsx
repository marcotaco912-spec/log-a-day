import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { haptic } from "@/lib/alarm";

export function FAB({ onClick }: { onClick?: () => void }) {
  const nav = useNavigate();
  return (
    <button
      onClick={() => {
        haptic(15);
        if (onClick) onClick();
        else nav({ to: "/new" });
      }}
      aria-label="Create reminder"
      className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-fab transition-transform active:scale-90"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <Plus className="h-7 w-7" />
    </button>
  );
}
