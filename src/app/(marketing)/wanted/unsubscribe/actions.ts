"use server";

import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/rate-limit";
import { optOutOfWantedAlerts } from "@/lib/wanted/unsubscribe";

export async function confirmWantedOptOut(formData: FormData) {
  const userId = String(formData.get("u") ?? "");
  const token = String(formData.get("t") ?? "");
  const { allowed } = await checkRateLimit("wanted-optout", { limit: 20, windowMs: 60_000 });
  let ok = false;
  if (allowed) {
    try {
      ok = await optOutOfWantedAlerts(userId, token);
    } catch {
      ok = false;
    }
  }
  redirect(`/wanted/unsubscribe?done=${ok ? "1" : "0"}`);
}
