import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectSupabaseNotice } from "@/components/shared/ConnectSupabaseNotice";
import { createClient } from "@/lib/supabase/server";
import { searchResultsPath } from "@/lib/alerts/query";
import { AlertRow, type AlertRowData } from "./AlertRow";

async function getAlerts(): Promise<{ connected: boolean; alerts: AlertRowData[]; missingTable: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { connected: true, alerts: [], missingTable: false };

    const { data, error } = await supabase
      .from("saved_searches")
      .select("id, name, listing_type, query, is_active, last_notified_at")
      .order("created_at", { ascending: false });
    // 42P01 = the table doesn't exist yet (migration 0009 not run).
    if (error) return { connected: true, alerts: [], missingTable: error.code === "42P01" || /saved_searches/.test(error.message) };

    return {
      connected: true,
      missingTable: false,
      alerts: (data ?? []).map((row) => ({
        id: row.id as string,
        name: row.name as string,
        typeLabel: row.listing_type === "bulk_wine" ? "Bulk wine" : "Wine grapes",
        resultsHref: searchResultsPath(row.listing_type as "grapes" | "bulk_wine", row.query as string),
        isActive: row.is_active as boolean,
        lastNotified: row.last_notified_at ? new Date(row.last_notified_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null,
      })),
    };
  } catch {
    return { connected: false, alerts: [], missingTable: false };
  }
}

export default async function AlertsPage() {
  const { connected, alerts, missingTable } = await getAlerts();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-stone-900">Email Alerts</h1>
      <p className="mt-1 text-sm text-stone-500">
        Save a search and HarvestLink emails you a daily digest when new listings match. Alerts never reveal the identity of a
        confidential seller.
      </p>

      {!connected && (
        <div className="mt-6">
          <ConnectSupabaseNotice />
        </div>
      )}

      {missingTable && (
        <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">Email alerts are not switched on for this site yet.</p>
      )}

      {connected && !missingTable && alerts.length === 0 && (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-stone-300 py-14 text-center">
          <Bell className="size-10 text-stone-300" />
          <p className="mt-4 font-medium text-stone-700">No alerts yet</p>
          <p className="mt-1 max-w-sm text-sm text-stone-500">
            Set your filters on a browse page and choose Save this search. You will get one email a day, only when something new
            matches.
          </p>
          <div className="mt-5 flex gap-3">
            <Button asChild>
              <Link href="/grapes">Browse wine grapes</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/bulk-wine">Browse bulk wine</Link>
            </Button>
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <ul className="mt-8 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </ul>
      )}
    </div>
  );
}
