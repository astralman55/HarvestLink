"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CreateCropPlanSchema, type CreateCropPlanInput } from "@/lib/validation/cropPlan";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CROP_STATUSES, currentHarvestYearOptions } from "@/lib/constants/viticulture";
import { GrapeVarietyOptionGroups } from "@/components/shared/SelectOptionGroups";
import type { CropPlan } from "@/types";

interface CropPlanDialogProps {
  /** Pass an existing plan to edit it in place; omit to create a new one. */
  cropPlan?: CropPlan;
}

export function CropPlanDialog({ cropPlan }: CropPlanDialogProps) {
  const isEdit = !!cropPlan;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCropPlanInput>({
    resolver: zodResolver(CreateCropPlanSchema),
    defaultValues: cropPlan
      ? {
          variety: cropPlan.variety,
          block_identifier: cropPlan.block_identifier ?? undefined,
          projected_tons: cropPlan.projected_tons,
          harvest_year: cropPlan.harvest_year,
          current_status: cropPlan.current_status,
          notes: cropPlan.notes ?? undefined,
        }
      : { current_status: "dormant" },
  });

  async function onSubmit(data: CreateCropPlanInput) {
    setServerError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setServerError("You need to be signed in to save a crop plan.");
        return;
      }

      const { error } = isEdit
        ? await supabase.from("crop_plans").update(data).eq("id", cropPlan.id).eq("user_id", user.id)
        : await supabase.from("crop_plans").insert({ user_id: user.id, ...data });

      if (error) {
        setServerError(error.message);
        return;
      }

      reset();
      setOpen(false);
      router.refresh();
    } catch {
      setServerError(
        "Couldn't reach Supabase. Connect a real project in .env.local (see README) to save crop plans."
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <button
            type="button"
            aria-label="Edit crop plan"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            <Pencil className="size-3.5" /> Edit
          </button>
        ) : (
          <Button>
            <PlusCircle className="size-4" />
            Forecast a Block
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Crop Plan" : "Forecast Next Harvest Crop Cycle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="variety">Variety</Label>
            <Select id="variety" {...register("variety")}>
              <option value="">Select variety</option>
              <GrapeVarietyOptionGroups />
            </Select>
            {errors.variety && <p className="text-xs text-red-600">{errors.variety.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="block_identifier">Block Identifier</Label>
            <Input id="block_identifier" placeholder="e.g. North Block Hillside" {...register("block_identifier")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="projected_tons">Projected Tons</Label>
              <Input id="projected_tons" type="number" min={0} step={0.1} {...register("projected_tons")} />
              {errors.projected_tons && <p className="text-xs text-red-600">{errors.projected_tons.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="harvest_year">Harvest Year</Label>
              <Select id="harvest_year" {...register("harvest_year")}>
                {currentHarvestYearOptions().map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="current_status">Lifecycle Status</Label>
            <Select id="current_status" {...register("current_status")}>
              {CROP_STATUSES.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Optional notes for aligned buyers…" {...register("notes")} />
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Save Futures Allocation Block"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
