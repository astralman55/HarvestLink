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
import { UsernameField } from "@/components/shared/UsernameField";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { flags } from "@/lib/flags";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { role: "buyer", username: "" },
  });

  const role = watch("role");

  async function onSubmit(data: RegisterInput) {
    if (usernameAvailable === false) {
      setServerError("Please choose an available username before continuing.");
      return;
    }
    setServerError(null);
    const result = await handleSignUp(data);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    if (result?.needsVerification) {
      router.push(`/verify-email?email=${encodeURIComponent(result.email ?? data.email)}`);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Create your account</h1>
      <p className="mt-1 text-sm text-stone-500">Join as a grower or a buyer.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* A plain div, not a button -- it has no click handler of its
              own (the radio input inside is the real control), and a
              <button> wrapping an <input> is an invalid nested-interactive
              pattern that breaks assistive tech (Phase 7 a11y pass,
              Decision 40). */}
          <div className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-medium text-stone-700 has-[:checked]:border-[var(--color-brand)] has-[:checked]:bg-[var(--color-brand-50)] has-[:checked]:text-[var(--color-brand-dark)]">
            <label className="flex cursor-pointer items-center justify-center gap-2">
              <input type="radio" value="buyer" className="sr-only" {...register("role")} />
              I&apos;m a Buyer
            </label>
          </div>
          <div className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-medium text-stone-700 has-[:checked]:border-[var(--color-brand)] has-[:checked]:bg-[var(--color-brand-50)] has-[:checked]:text-[var(--color-brand-dark)]">
            <label className="flex cursor-pointer items-center justify-center gap-2">
              <input type="radio" value="grower" className="sr-only" {...register("role")} />
              I&apos;m a Grower
            </label>
          </div>
        </div>

        {role === "grower" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" placeholder="Stagecoach Ridge Vineyards" {...register("companyName")} />
              {errors.companyName && <p className="text-xs text-red-600">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="regionAva">Operational Region</Label>
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
          <Input id="email" type="email" autoComplete="email" placeholder="you@vineyard.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>

        {flags.usernames && (
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Controller
              control={control}
              name="username"
              render={({ field }) => (
                <UsernameField
                  id="username"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onAvailabilityChange={setUsernameAvailable}
                  helperText="This is your public handle. It may be visible to other members in the future. If you plan to sell confidentially, don't use your winery or vineyard name."
                />
              )}
            />
            {errors.username && <p className="text-xs text-red-600">{errors.username.message}</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="new-password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <p className="text-xs text-stone-500">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="font-medium text-[var(--color-brand)] underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-[var(--color-brand)] underline">
            Privacy Policy
          </Link>
          .
        </p>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--color-brand)]">
          Log in
        </Link>
      </p>
    </div>
  );
}
