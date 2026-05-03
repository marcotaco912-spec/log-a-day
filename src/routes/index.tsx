import { createFileRoute } from "@tanstack/react-router";
import { EntryEditor } from "@/components/EntryEditor";
import { todayKey } from "@/lib/journal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Daylog" },
      { name: "description", content: "Capture today's journal entry, mood, photos, and links." },
    ],
  }),
  component: Index,
});

function Index() {
  return <EntryEditor date={todayKey()} hero />;
}
