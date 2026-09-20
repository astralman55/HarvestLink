import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getListings } from "@/lib/data/listings";
import { sendNotificationEmail } from "@/lib/email";
import { runSavedSearchAlerts, type SavedSearchRow } from "@/lib/alerts/run";
import { ANONYMOUS_VIEWER } from "@/lib/serializers/listing";
import { SITE_URL } from "@/lib/seo";
import { runWantedAlertsJob } from "@/lib/wanted/cron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily saved-search digest, triggered by Vercel Cron (see vercel.json).
 * Vercel sends "Authorization: Bearer $CRON_SECRET" when that env var is set,
 * and this refuses everything else, so the endpoint can't be used to spam
 * members or to probe the service key.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
  }

  try {
    const result = await runSavedSearchAlerts({
      now: new Date(),
      appUrl: SITE_URL,
      async loadActiveSearches() {
        const { data, error } = await admin
          .from("saved_searches")
          .select("id, user_id, name, listing_type, query, unsubscribe_token, last_checked_at")
          .eq("is_active", true)
          .order("created_at", { ascending: true })
          .limit(1000);
        if (error) throw error;
        return (data ?? []) as SavedSearchRow[];
      },
      // Serialized for the anonymous public: the strictest view, so a confidential
      // listing's identity can never reach an email, whoever the recipient is.
      findNewListings: (filters, _search, excludeUserId) =>
        getListings(filters, { viewer: ANONYMOUS_VIEWER, excludeUserId, throwOnError: true }),
      async getEmail(userId) {
        const { data } = await admin.auth.admin.getUserById(userId);
        return data.user?.email ?? null;
      },
      sendEmail: (message) => sendNotificationEmail(message),
      async markChecked(searchIds, checkedAt, notifiedIds) {
        if (searchIds.length === 0) return;
        await admin.from("saved_searches").update({ last_checked_at: checkedAt }).in("id", searchIds);
        if (notifiedIds.length > 0) await admin.from("saved_searches").update({ last_notified_at: new Date().toISOString() }).in("id", notifiedIds);
      },
    });
    // Housekeeping on the same daily run: keep sign-in activity for 180 days.
    // Best-effort; if the table does not exist yet this is simply a no-op.
    try {
      await admin.from("login_events").delete().lt("created_at", new Date(Date.now() - 180 * 24 * 3600_000).toISOString());
    } catch {
      // ignore
    }
    // Tell sellers about new "wanted" requests that match their lots. Best-effort and
    // independent of the digest above: if migration 0011 has not been run this is a no-op.
    let wanted: Awaited<ReturnType<typeof runWantedAlertsJob>> | { skipped: true } = { skipped: true };
    try {
      wanted = await runWantedAlertsJob(admin);
    } catch (error) {
      console.error("Wanted alerts skipped:", error);
    }
    return NextResponse.json({ ...result, wanted });
  } catch (error) {
    console.error("Saved search job failed:", error);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
