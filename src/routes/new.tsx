import { createFileRoute } from "@tanstack/react-router";
import { ReminderEditor } from "@/components/ReminderEditor";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "New reminder — RemindMe" },
      { name: "description", content: "Create a new reminder with date, time, photos, and links." },
    ],
  }),
  component: () => <ReminderEditor />,
});
