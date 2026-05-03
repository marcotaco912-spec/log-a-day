import { Link, useLocation } from "@tanstack/react-router";
import { Home, CalendarDays, Search, Settings as SettingsIcon } from "lucide-react";

const tabs = [
  { to: "/", label: "Today", icon: Home, exact: true },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, exact: false },
  { to: "/search", label: "Search", icon: Search, exact: false },
  { to: "/settings", label: "Settings", icon: SettingsIcon, exact: false },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
        {tabs.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className="group flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 transition-colors"
              >
                <span
                  className={[
                    "flex h-8 w-12 items-center justify-center rounded-full transition-all",
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={[
                    "text-[10px] font-medium tracking-wide transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
