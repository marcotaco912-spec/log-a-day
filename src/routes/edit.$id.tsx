import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ReminderEditor } from "@/components/ReminderEditor";
import { getReminder } from "@/lib/db";
import type { Reminder } from "@/lib/types";

export const Route = createFileRoute("/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit reminder — RemindMe" },
      { name: "description", content: "Edit reminder details." },
    ],
  }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [r, setR] = useState<Reminder | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    getReminder(id).then((res) => {
      if (!alive) return;
      setR(res ?? null);
    });
    return () => { alive = false; };
  }, [id]);

  if (r === undefined) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (r === null) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">Reminder not found.</p>
        <button onClick={() => nav({ to: "/" })} className="mt-3 text-sm font-semibold text-primary">Back to today</button>
      </div>
    );
  }
  return <ReminderEditor existing={r} />;
}
