"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@/lib/validation/auth";
import { handleSignIn } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { flags } from "@/lib/flags";
import { safeRedirectPath } from "@/lib/auth/verification";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    const result = await handleSignIn(data);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    const redirectTo = safeRedirectPath(searchParams.get("redirect_to"));
    if (result.needsVerification) {
      router.push(`/verify-email?email=${encodeURIComponent(result.email)}&sent=1&redirect_to=${encodeURIComponent(redirectTo)}`);
      return;
    }
    if (result.needsUsername) {
      router.push(`/choose-username?redirect_to=${encodeURIComponent(redirectTo)}`);
      return;
    }
    router.push(redirectTo);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Welcome back</h1>
      <p className="mt-1 text-sm text-stone-500">Log in to manage your listings and crop plans.</p>

      {searchParams.get("error") === "link_expired" && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          That confirmation link has expired or was already used. Log in with your password and we&apos;ll send you a fresh code.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">{flags.usernames ? "Email or Username" : "Email"}</Label>
          <Input
            id="identifier"
            type={flags.usernames ? "text" : "email"}
            autoComplete="username"
            placeholder={flags.usernames ? "you@vineyard.com or grapeguy" : "you@vineyard.com"}
            {...register("identifier")}
          />
          {errors.identifier && <p className="text-xs text-red-600">{errors.identifier.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-[var(--color-brand)]">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" autoComplete="current-password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Log In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        New to BWG?{" "}
        <Link href="/register" className="font-medium text-[var(--color-brand)]">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
