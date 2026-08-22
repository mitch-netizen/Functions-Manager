import { createClient } from "@/lib/supabase/server";

export interface MyTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  enquiryId: string;
  enquiryReferenceNumber: string;
  isOverdue: boolean;
}

/** Powers "My tasks" (brief view 6) — overdue first. */
export async function listMyTasks(userId: string): Promise<MyTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_date, completed, enquiry_id, enquiries(reference_number)")
    .eq("assignee_user_id", userId)
    .order("due_date", { ascending: true })
    .returns<{ id: string; title: string; due_date: string; completed: boolean; enquiry_id: string; enquiries: { reference_number: string } | null }[]>();

  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);

  const tasks = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    completed: row.completed,
    enquiryId: row.enquiry_id,
    enquiryReferenceNumber: row.enquiries?.reference_number ?? "",
    isOverdue: !row.completed && row.due_date < today,
  }));

  return tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

export interface EnquiryTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export async function listTasksForEnquiry(enquiryId: string): Promise<EnquiryTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_date, completed")
    .eq("enquiry_id", enquiryId)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, title: r.title, dueDate: r.due_date, completed: r.completed }));
}
