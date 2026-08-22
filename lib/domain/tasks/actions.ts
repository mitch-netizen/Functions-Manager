"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/domain/shared";

const createTaskSchema = z.object({
  enquiryId: z.string().uuid(),
  title: z.string().min(1),
  dueDate: z.string().min(1), // yyyy-mm-dd
  assigneeUserId: z.string().uuid().optional(),
});

export async function createTask(input: z.infer<typeof createTaskSchema>): Promise<ActionResult<null>> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };

  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    venue_id: ctx.activeVenueId,
    enquiry_id: parsed.data.enquiryId,
    title: parsed.data.title,
    due_date: parsed.data.dueDate,
    assignee_user_id: parsed.data.assigneeUserId ?? ctx.userId,
    source: "manual",
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  revalidatePath(`/enquiries/${parsed.data.enquiryId}`);
  return { ok: true, data: null };
}

export async function completeTask(taskId: string, enquiryId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/tasks");
  revalidatePath(`/enquiries/${enquiryId}`);
  return { ok: true, data: null };
}
