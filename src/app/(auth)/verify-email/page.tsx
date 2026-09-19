"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTP_LENGTH, RESEND_COOLDOWN_SECONDS, safeRedirectPath, sanitizeCodeInput } from "@/lib/auth/verification";
import { resendSignupCode, verifySignupCode } from "./actions";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";
  const redirectTo = safeRedirectPath(searchParams.get("redirect_to"));
  // ?sent=1 when the login screen already triggered a fresh code for us.
  const alreadySent = searchParams.get("sent") === "1";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(alreadySent ? "We sent you a new code." : null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  // Both a fresh signup and the login redirect have just sent an email, so
  // start the resend button on cooldown instead of inviting a double send.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const submitting = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit(value: string) {
    if (submitting.current || !email) return;
    submitting.current = true;
    setVerifying(true);
    setError(null);
    const result = await verifySignupCode(email, value);
    if (result.error) {
      setError(result.error);
      setVerifying(false);
      submitting.current = false;
      return;
    }
    // Keep the spinner up through the navigation.
    router.replace(result.needsUsername ? `/choose-username?redirect_to=${encodeURIComponent(redirectTo)}` : redirectTo);
    router.refresh();
  }

  async function resend() {
    setResending(true);
    setError(null);
    setNotice(null);
    const result = await resendSignupCode(email);
    setResending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNotice("We sent you a new code. It can take a minute to arrive.");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  if (!email) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-stone-900">Verify your email</h1>
        <p className="mt-2 text-sm text-stone-600">
          We couldn&apos;t tell which email address to verify. Log in and we&apos;ll send you a fresh code, or create an account
          if you haven&apos;t yet.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild className="flex-1">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand)]">
        <MailCheck className="size-5" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-stone-900">Check your email</h1>
      <p className="mt-1 text-sm text-stone-600">
        Enter the code we sent to <span className="font-medium text-stone-900">{email}</span>.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(code);
        }}
        className="mt-6 space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="code">Confirmation code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={12}
            placeholder={"0".repeat(OTP_LENGTH)}
            value={code}
            aria-invalid={error ? true : undefined}
            aria-describedby="code-feedback"
            className="h-14 text-center font-mono text-2xl tracking-[0.4em]"
            onChange={(event) => {
              const next = sanitizeCodeInput(event.target.value);
              setCode(next);
              if (next.length === OTP_LENGTH) void submit(next);
            }}
          />
        </div>

        <div id="code-feedback" aria-live="polite" className="min-h-5 text-sm">
          {error && <p className="text-red-600">{error}</p>}
          {!error && notice && <p className="text-emerald-700">{notice}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={verifying || code.length < 6}>
          {verifying ? "Verifying…" : "Verify and continue"}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-stone-500">
        <span>Didn&apos;t get it?</span>
        <button
          type="button"
          onClick={resend}
          disabled={resending || cooldown > 0}
          className="font-medium text-[var(--color-brand)] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-stone-400 disabled:no-underline"
        >
          {resending ? "Sending…" : cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
        </button>
      </div>
      <p className="mt-3 text-xs text-stone-500">
        Check your spam folder too. The email also has a button you can click instead of typing the code. Wrong address?{" "}
        <Link href="/register" className="font-medium text-[var(--color-brand)]">
          Start over
        </Link>
        .
      </p>
      <p className="mt-3 text-xs text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--color-brand)]">
          Log in
        </Link>{" "}
        or{" "}
        <Link href="/forgot-password" className="font-medium text-[var(--color-brand)]">
          reset your password
        </Link>
        .
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
