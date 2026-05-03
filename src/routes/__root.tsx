import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { BottomNav } from "@/components/BottomNav";
import { useApplyTheme } from "@/lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
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
      { name: "theme-color", content: "#6C63FF" },
      { title: "Daylog — Your daily journal" },
      { name: "description", content: "A beautiful, minimal personal journal. Capture moments, photos, links, and reflections — every day." },
      { property: "og:title", content: "Daylog — Your daily journal" },
      { property: "og:description", content: "A beautiful, minimal personal journal. Capture moments, photos, links, and reflections — every day." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Daylog — Your daily journal" },
      { name: "twitter:description", content: "A beautiful, minimal personal journal. Capture moments, photos, links, and reflections — every day." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e6b07759-fcdc-49cc-96ae-35479d43e31d/id-preview-3c76b97a--dd3e4163-127e-416c-ba7c-43f3768318ee.lovable.app-1777833235269.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e6b07759-fcdc-49cc-96ae-35479d43e31d/id-preview-3c76b97a--dd3e4163-127e-416c-ba7c-43f3768318ee.lovable.app-1777833235269.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
