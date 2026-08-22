"use server";

import { redirect } from "next/navigation";
import { setActiveVenue } from "@/lib/auth/session";

export async function chooseVenue(formData: FormData) {
  const venueId = formData.get("venueId");
  if (typeof venueId !== "string" || !venueId) return;
  await setActiveVenue(venueId);
  redirect("/pipeline");
}
