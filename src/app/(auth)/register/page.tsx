"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, type RegisterInput } from "@/lib/validation/auth";
import { handleSignUp } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RegionOptionGroups } from "@/components/shared/SelectOptionGroups";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { role: "buyer" },
  });

  const role = watch("role");

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    const result = await handleSignUp(data);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1200);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Create your account</h1>
      <p className="mt-1 text-sm text-stone-500">Join as a grower or a buyer.</p>

      {success ? (
        <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
          Account created — redirecting to your dashboard…
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-medium text-stone-700 has-[:checked]:border-[var(--color-brand)] has-[:checked]:bg-[var(--color-brand-50)] has-[:checked]:text-[var(--color-brand-dark)]"
            >
              <label className="flex cursor-pointer items-center justify-center gap-2">
                <input type="radio" value="buyer" className="sr-only" {...register("role")} />
                I&apos;m a Buyer
              </label>
            </button>
            <button
              type="button"
              className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-medium text-stone-700 has-[:checked]:border-[var(--color-brand)] has-[:checked]:bg-[var(--color-brand-50)] has-[:checked]:text-[var(--color-brand-dark)]"
            >
              <label className="flex cursor-pointer items-center justify-center gap-2">
                <input type="radio" value="grower" className="sr-only" {...register("role")} />
                I&apos;m a Grower
              </label>
            </button>
          </div>

          {role === "grower" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" placeholder="Stagecoach Ridge Vineyards" {...register("companyName")} />
                {errors.companyName && <p className="text-xs text-red-600">{errors.companyName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="regionAva">Operational AVA Region</Label>
                <Select id="regionAva" {...register("regionAva")}>
                  <option value="">Select a region</option>
                  <RegionOptionGroups />
                </Select>
                {errors.regionAva && <p className="text-xs text-red-600">{errors.regionAva.message}</p>}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Name</Label>
                <Input id="fullName" placeholder="Jamie Rivera" {...register("fullName")} />
                {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companyName">Company Name (if applicable)</Label>
                <Input id="companyName" placeholder="Rivera Wine Imports" {...register("companyName")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Controller
                  control={control}
                  name="address"
                  render={({ field }) => (
                    <AddressAutocomplete
                      id="address"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Start typing your address…"
                    />
                  )}
                />
                {errors.address && <p className="text-xs text-red-600">{errors.address.message}</p>}
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@vineyard.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create Account"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--color-brand)]">
          Log in
        </Link>
      </p>
    </div>
  );
}
