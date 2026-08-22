"use client";

import { useRouter } from "next/navigation";
import { completeTask } from "@/lib/domain/tasks/actions";

export function CompleteTaskButton({ taskId, enquiryId }: { taskId: string; enquiryId: string }) {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await completeTask(taskId, enquiryId);
        router.refresh();
      }}
      className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
    >
      Mark done
    </button>
  );
}
