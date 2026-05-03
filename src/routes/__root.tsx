import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import appCss from "../styles.css?url";
import { BottomNav } from "@/components/BottomNav";
import { AlarmHost } from "@/components/AlarmHost";
import { PermissionGate } from "@/components/PermissionGate";
import { useApplyTheme } from "@/lib/store";
import { registerServiceWorker } from "@/lib/sw-register";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#FF6B4A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "RemindMe" },
      { title: "RemindMe — Reminders that actually alarm" },
      { name: "description", content: "A beautiful reminder app with real alarm notifications. Installable on iPhone and Android." },
      { property: "og:title", content: "RemindMe — Reminders that actually alarm" },
      { property: "og:description", content: "A beautiful reminder app with real alarm notifications." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/icon-192.png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useApplyTheme();
  useEffect(() => { registerServiceWorker(); }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PermissionGate />
      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <BottomNav />
      <AlarmHost />
    </div>
  );
}
