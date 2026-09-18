"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";

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

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "listings" },
        (payload) => {
          const newRow = payload.new as {
            estimated_tons: number;
            variety: string;
            region_ava: string;
          };
          setAlertMessage(
            `New Yield Alert: ${newRow.estimated_tons} tons of ${newRow.variety} just listed in ${newRow.region_ava}!`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { alertMessage, setAlertMessage };
}
