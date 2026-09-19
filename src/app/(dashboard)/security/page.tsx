import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConnectSupabaseNotice } from "@/components/shared/ConnectSupabaseNotice";
import { createClient } from "@/lib/supabase/server";
import { describeLocation } from "@/lib/security/request-context";

interface EventRow {
  id: string;
  created_at: string;
  method: "password" | "signup_code" | "email_link" | "password_reset";
  country: string | null;
  region: string | null;
  city: string | null;
  device: string | null;
}

const METHOD_LABEL: Record<EventRow["method"], string> = {
  password: "Password",
  signup_code: "Account confirmation code",
  email_link: "Email link",
  password_reset: "Password reset",
};

async function getEvents(): Promise<{ connected: boolean; events: EventRow[]; unavailable: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { connected: true, events: [], unavailable: false };
    const { data, error } = await supabase
      .from("login_events")
      .select("id, created_at, method, country, region, city, device")
      .order("created_at", { ascending: false })
      .limit(25);
    // Table missing (migration 0010 not run yet) or any other read problem.
    if (error) return { connected: true, events: [], unavailable: true };
    return { connected: true, events: (data ?? []) as EventRow[], unavailable: false };
  } catch {
    return { connected: false, events: [], unavailable: false };
  }
}

/** Marks the oldest sign-in we can see from each place, so an unfamiliar location stands out. */
function firstSeenIds(events: EventRow[]): Set<string> {
  const seen = new Set<string>();
  const first = new Set<string>();
  for (const event of [...events].reverse()) {
    const key = [event.country, event.region, event.city].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      first.add(event.id);
    }
  }
  return first;
}

export default async function SecurityPage() {
  const { connected, events, unavailable } = await getEvents();
  const firstSeen = firstSeenIds(events);
  const locations = new Set(events.map((event) => [event.country, event.region, event.city].join("|")));

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-stone-900">Security</h1>
      <p className="mt-1 text-sm text-stone-500">
        Your recent sign-ins, with an approximate location and device. If you see one you don&apos;t recognize,{" "}
        <Link href="/forgot-password" className="font-medium text-[var(--color-brand)] underline">
          reset your password
        </Link>{" "}
        right away.
      </p>

      {!connected && (
        <div className="mt-6">
          <ConnectSupabaseNotice />
        </div>
      )}

      {unavailable && (
        <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">Sign-in history is not switched on for this site yet.</p>
      )}

      {connected && !unavailable && events.length === 0 && (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-stone-300 py-14 text-center">
          <ShieldCheck className="size-10 text-stone-300" />
          <p className="mt-4 font-medium text-stone-700">No sign-ins recorded yet</p>
          <p className="mt-1 max-w-sm text-sm text-stone-500">Your next sign-in will show up here.</p>
        </div>
      )}

      {events.length > 0 && (
        <>
          <p className="mt-6 text-sm text-stone-600">
            {events.length} recent sign-in{events.length === 1 ? "" : "s"} from {locations.size} location{locations.size === 1 ? "" : "s"}.
          </p>
          <ul className="mt-3 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
            {events.map((event) => (
              <li key={event.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-stone-900">
                    <MapPin className="size-4 shrink-0 text-stone-400" />
                    <span className="truncate">{describeLocation(event)}</span>
                    {firstSeen.has(event.id) && events.length > 1 && <Badge variant="outline">First seen here</Badge>}
                  </p>
                  <p className="mt-0.5 text-sm text-stone-500">
                    {event.device ?? "Unknown device"} · {METHOD_LABEL[event.method]}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-stone-500">
                  {new Date(event.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 text-xs text-stone-500">
        Location is estimated from your IP address, so it can be off by a city or be your internet provider&apos;s location, and it may be
        blank on some networks. We keep only a shortened network address, not your full IP, and we delete this history after 180 days.
      </p>
    </div>
  );
}
