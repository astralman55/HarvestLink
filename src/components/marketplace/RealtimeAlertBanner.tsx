"use client";

import { Bell, X } from "lucide-react";
import { useRealtimeListings } from "@/lib/supabase/useRealtimeListings";

export function RealtimeAlertBanner() {
  const { alertMessage, setAlertMessage } = useRealtimeListings();

  if (!alertMessage) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-stone-900 px-4 py-2.5 text-sm text-white">
      <Bell className="size-4 shrink-0 text-amber-400" />
      <span className="text-center">{alertMessage}</span>
      <button onClick={() => setAlertMessage(null)} aria-label="Dismiss">
        <X className="size-4 text-stone-500 hover:text-white" />
      </button>
    </div>
  );
}
