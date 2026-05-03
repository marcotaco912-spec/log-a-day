import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { EntryEditor } from "@/components/EntryEditor";

export const Route = createFileRoute("/entry/$date")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.date} — Daylog` },
      { name: "description", content: `Journal entry for ${params.date}.` },
    ],
  }),
  component: EntryPage,
});

function EntryPage() {
  const { date } = Route.useParams();
  return (
    <div>
      <Link
        to="/calendar"
        className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>
      <EntryEditor date={date} />
    </div>
  );
}
