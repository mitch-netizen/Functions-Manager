"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTask, completeTask } from "@/lib/domain/tasks/actions";
import type { EnquiryTask } from "@/lib/domain/tasks/queries";

export function TaskPanel({ enquiryId, tasks }: { enquiryId: string; tasks: EnquiryTask[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleAdd(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const dueDate = String(formData.get("dueDate") ?? "");
    if (!title || !dueDate) return;
    setPending(true);
    await createTask({ enquiryId, title, dueDate });
    setPending(false);
    router.refresh();
  }

  async function handleComplete(taskId: string) {
    await completeTask(taskId, enquiryId);
    router.refresh();
  }

  return (
    <div className="rounded border border-neutral-200 bg-white p-3">
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">Tasks</h2>
      <ul className="mb-3 space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={t.completed} onChange={() => !t.completed && handleComplete(t.id)} />
            <span className={t.completed ? "flex-1 text-neutral-400 line-through" : "flex-1"}>{t.title}</span>
            <span className="text-xs text-neutral-400">{t.dueDate}</span>
          </li>
        ))}
        {tasks.length === 0 && <li className="text-sm text-neutral-400">No tasks yet.</li>}
      </ul>
      <form action={handleAdd} className="space-y-2">
        <input name="title" placeholder="New task…" className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
        <input name="dueDate" type="date" className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" />
        <button type="submit" disabled={pending} className="w-full rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50">
          Add task
        </button>
      </form>
    </div>
  );
}
