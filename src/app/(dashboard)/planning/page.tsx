import { CalendarRange } from "lucide-react";
import { CropPlanDialog } from "@/components/planning/CropPlanDialog";
import { Badge } from "@/components/ui/badge";
import { ConnectSupabaseNotice } from "@/components/shared/ConnectSupabaseNotice";
import { createClient } from "@/lib/supabase/server";
import { formatTons } from "@/lib/utils";
import type { CropPlan } from "@/types";

const STATUS_VARIANT: Record<CropPlan["current_status"], "neutral" | "brand" | "success"> = {
  dormant: "neutral",
  flowering: "brand",
  veraison: "brand",
  harvested: "success",
};

async function getCropPlans(): Promise<{ connected: boolean; plans: CropPlan[] }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { connected: true, plans: [] };

    const { data, error } = await supabase
      .from("crop_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("harvest_year", { ascending: true });
    if (error) throw error;
    return { connected: true, plans: (data as CropPlan[]) ?? [] };
  } catch {
    return { connected: false, plans: [] };
  }
}

export default async function PlanningPage() {
  const { connected, plans } = await getCropPlans();

  const grouped = plans.reduce<Record<number, CropPlan[]>>((acc, plan) => {
    (acc[plan.harvest_year] ??= []).push(plan);
    return acc;
  }, {});
  const years = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Crop Planning</h1>
          <p className="mt-1 text-sm text-stone-500">
            Forecast future blocks and align them with buyers ahead of harvest.
          </p>
        </div>
        <CropPlanDialog />
      </div>

      {!connected && (
        <div className="mt-6">
          <ConnectSupabaseNotice />
        </div>
      )}

      {connected && years.length === 0 && (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-stone-300 py-16 text-center">
          <CalendarRange className="size-10 text-stone-300" />
          <p className="mt-4 font-medium text-stone-700">No crop plans yet</p>
          <p className="mt-1 text-sm text-stone-500">Forecast your first future block to get started.</p>
        </div>
      )}

      <div className="mt-8 space-y-10">
        {years.map((year) => (
          <div key={year}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              {year} Harvest
            </h2>
            <div className="mt-3 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
              {grouped[year].map((plan) => (
                <div key={plan.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium text-stone-900">
                      {plan.variety}
                      {plan.block_identifier ? ` — ${plan.block_identifier}` : ""}
                    </p>
                    <p className="text-sm text-stone-500">{formatTons(plan.projected_tons)} projected</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[plan.current_status]} className="capitalize">
                      {plan.current_status}
                    </Badge>
                    <CropPlanDialog cropPlan={plan} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
