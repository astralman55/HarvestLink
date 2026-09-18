"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";

interface NewListingBroadcast {
  variety: string;
  estimated_tons: number;
  region_ava: string;
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

    // A DB trigger (migration 0005) broadcasts a hand-picked, always-safe
    // payload on insert -- not postgres_changes, which sends the entire
    // raw row (including user_id, and eventually vineyard_name) to every
    // subscribed browser tab regardless of what this hook reads from it
    // (Phase 0 audit, Flag #8).
    const channel = supabase
      .channel("public-listings")
      .on("broadcast", { event: "new_listing" }, ({ payload }) => {
        const newRow = payload as NewListingBroadcast;
        setAlertMessage(
          `New Yield Alert: ${newRow.estimated_tons} tons of ${newRow.variety} just listed in ${newRow.region_ava}!`
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { alertMessage, setAlertMessage };
}
