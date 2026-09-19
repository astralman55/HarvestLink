"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";

interface NewListingBroadcast {
  variety: string;
  /** null for a confidential listing (migration 0008) -- the alert then just omits the region. */
  region_ava: string | null;
  listing_type?: "grapes" | "bulk_wine";
  estimated_tons?: number;
  quantity_gallons?: number;
}

export function useRealtimeListings() {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    // Skip entirely in demo mode (no real Supabase project configured) —
    // otherwise the browser retries a doomed websocket connection forever.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || url.includes("your-project-id")) return;

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    // Two DB triggers broadcast a hand-picked, always-safe payload on
    // insert (migrations 0005/0006) -- not postgres_changes, which sends
    // the entire raw row (including user_id, and vineyard_name) to every
    // subscribed browser tab regardless of what this hook reads from it
    // (Phase 0 audit, Flag #8). Grapes broadcasts from `listings` itself;
    // bulk wine broadcasts from `bulk_wine_details` once quantity/price
    // actually exist (a beat after the parent listing row is created).
    const channel = supabase
      .channel("public-listings")
      .on("broadcast", { event: "new_listing" }, ({ payload }) => {
        const newRow = payload as NewListingBroadcast;
        const where = newRow.region_ava ? ` in ${newRow.region_ava}` : "";
        const message =
          newRow.listing_type === "bulk_wine"
            ? `New Yield Alert: ${newRow.quantity_gallons ?? 0} gal of ${newRow.variety} just listed${where}!`
            : `New Yield Alert: ${newRow.estimated_tons ?? 0} tons of ${newRow.variety} just listed${where}!`;
        setAlertMessage(message);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { alertMessage, setAlertMessage };
}
