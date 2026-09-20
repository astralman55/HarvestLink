import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/seo";
import { wantedOptOutUrl } from "@/lib/wanted/unsubscribe";
import { runWantedSellerAlerts, type AlertRequest, type SellerAlertDeps } from "@/lib/wanted/seller-alerts";

type Admin = ReturnType<typeof createAdminClient>;

/** The real database and email behind the seller-alert job. Everything is best-effort: a missing table just means "nothing to do". */
export async function runWantedAlertsJob(admin: Admin) {
  const deps: SellerAlertDeps = {
    now: new Date(),
    appUrl: SITE_URL,
    async loadUnannounced(cutoffIso) {
      const { data, error } = await admin
        .from("wanted_requests")
        .select("id, user_id, request_type, variety, regions, quantity_min, quantity_max, max_price, show_price, year, created_at")
        .eq("status", "open")
        .gt("expires_at", new Date().toISOString())
        .lte("created_at", cutoffIso)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      const rows = (data ?? []) as AlertRequest[];
      if (rows.length === 0) return [];
      const { data: done } = await admin.from("wanted_notifications").select("request_id").in("request_id", rows.map((r) => r.id));
      const announced = new Set((done ?? []).map((d: { request_id: string }) => d.request_id));
      return rows.filter((r) => !announced.has(r.id));
    },
    async findMatchingSellers(request) {
      let query = admin
        .from("listings")
        .select("user_id")
        .eq("status", "available")
        .eq("listing_type", request.request_type)
        .eq("variety", request.variety)
        .neq("user_id", request.user_id)
        .limit(500);
      if (request.regions.length > 0) query = query.in("region_ava", request.regions);
      // The harvest year is a listing column for grapes; a wine's vintage lives on another table, so it is not checked here.
      if (request.year && request.request_type === "grapes") query = query.eq("harvest_year", request.year);
      const { data, error } = await query;
      if (error) throw error;
      return [...new Set((data ?? []).map((row: { user_id: string }) => row.user_id))];
    },
    async loadOptOuts(userIds) {
      if (userIds.length === 0) return new Set<string>();
      const { data } = await admin.from("wanted_alert_optouts").select("user_id").in("user_id", userIds);
      return new Set((data ?? []).map((row: { user_id: string }) => row.user_id));
    },
    async getEmail(userId) {
      const { data } = await admin.auth.admin.getUserById(userId);
      return data.user?.email ?? null;
    },
    optOutUrl: (userId) => wantedOptOutUrl(userId),
    sendEmail: (message) => sendNotificationEmail(message),
    async markAnnounced(requestIds) {
      await admin.from("wanted_notifications").upsert(requestIds.map((request_id) => ({ request_id })), { onConflict: "request_id" });
    },
  };
  return runWantedSellerAlerts(deps);
}
