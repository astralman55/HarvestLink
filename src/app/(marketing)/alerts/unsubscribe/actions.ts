"use server";

import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/rate-limit";
import { unsubscribeByToken } from "@/lib/alerts/unsubscribe";

export async function confirmUnsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const { allowed } = await checkRateLimit("alert-unsubscribe", { limit: 20, windowMs: 60_000 });
  let ok = false;
  if (allowed) {
    try {
      ok = await unsubscribeByToken(token, "one");
    } catch {
      ok = false;
    }
  }
  redirect(`/alerts/unsubscribe?done=${ok ? "1" : "0"}`);
}
