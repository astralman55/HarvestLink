"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChooseUsernameSchema, type ChooseUsernameInput } from "@/lib/validation/auth";
import { setUsername } from "./actions";
import { Button } from "@/components/ui/button";
import { UsernameField } from "@/components/shared/UsernameField";

export function ChooseUsernameForm({ destination }: { destination: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChooseUsernameInput>({
    resolver: zodResolver(ChooseUsernameSchema),
    defaultValues: { username: "" },
  });

  async function onSubmit(data: ChooseUsernameInput) {
    if (usernameAvailable === false) {
      setServerError("Please choose an available username before continuing.");
      return;
    }
    setServerError(null);
    const result = await setUsername(data);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    router.push(destination);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <UsernameField
            id="username"
            value={field.value}
            onChange={field.onChange}
            onAvailabilityChange={setUsernameAvailable}
            autoFocus
          />
        )}
      />
      {errors.username && <p className="text-xs text-red-600">{errors.username.message}</p>}

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
