import Link from "next/link";
import { Package, CalendarRange, PlusCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectSupabaseNotice } from "@/components/shared/ConnectSupabaseNotice";
import { createClient } from "@/lib/supabase/server";

async function getCounts() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { connected: true, listings: 0, cropPlans: 0 };

    const [{ count: listings }, { count: cropPlans }] = await Promise.all([
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("crop_plans").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    return { connected: true, listings: listings ?? 0, cropPlans: cropPlans ?? 0 };
  } catch {
    return { connected: false, listings: 0, cropPlans: 0 };
  }
}

export default async function DashboardPage() {
  const { connected, listings, cropPlans } = await getCounts();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-stone-900">Overview</h1>
      <p className="mt-1 text-sm text-stone-500">Your listings, crop plans, and next steps.</p>

      {!connected && (
        <div className="mt-6">
          <ConnectSupabaseNotice />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <Link href="/listings/mine" className="block">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand)]">
                <Package className="size-5" />
              </span>
              <CardTitle>My Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-stone-900">{listings}</p>
            </CardContent>
          </Link>
          <CardContent className="pt-0">
            <Button asChild variant="link" className="h-auto p-0">
              <Link href="/sell">
                <PlusCircle className="size-3.5" /> Create a new listing
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <Link href="/planning" className="block">
            <CardHeader className="flex flex-row items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-brand-50)] text-[var(--color-brand)]">
                <CalendarRange className="size-5" />
              </span>
              <CardTitle>Crop Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-stone-900">{cropPlans}</p>
            </CardContent>
          </Link>
          <CardContent className="pt-0">
            <Button asChild variant="link" className="h-auto p-0">
              <Link href="/planning">
                <PlusCircle className="size-3.5" /> Forecast a future block
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
