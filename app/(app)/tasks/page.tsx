import Link from "next/link";
import { requireSessionContext } from "@/lib/auth/session";
import { listMyTasks } from "@/lib/domain/tasks/queries";
import { CompleteTaskButton } from "./complete-button";

export default async function TasksPage() {
  const ctx = await requireSessionContext();
  const tasks = await listMyTasks(ctx.userId);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-lg font-semibold">My tasks</h1>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className={`flex items-center justify-between rounded border p-3 text-sm ${
              t.isOverdue ? "border-red-200 bg-red-50" : "border-neutral-200 bg-white"
            }`}
          >
            <div>
              <Link href={`/enquiries/${t.enquiryId}`} className="font-medium hover:underline">
                {t.title}
              </Link>
              <div className="text-xs text-neutral-400">
                {t.enquiryReferenceNumber} · due {t.dueDate}
                {t.isOverdue && !t.completed && <span className="ml-1 text-red-600">overdue</span>}
              </div>
            </div>
            {!t.completed && <CompleteTaskButton taskId={t.id} enquiryId={t.enquiryId} />}
          </li>
        ))}
        {tasks.length === 0 && <li className="text-sm text-neutral-400">Nothing due.</li>}
      </ul>
    </div>
  );
}
