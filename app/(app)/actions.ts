"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setActiveVenue } from "@/lib/auth/session";

export async function switchVenue(formData: FormData) {
  const venueId = formData.get("venueId");
  if (typeof venueId !== "string" || !venueId) return;
  await setActiveVenue(venueId);
  redirect("/pipeline");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
