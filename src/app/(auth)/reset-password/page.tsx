"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { OTP_LENGTH, RESEND_COOLDOWN_SECONDS, sanitizeCodeInput } from "@/lib/auth/verification";
import { requestPasswordReset } from "../forgot-password/actions";
import { setNewPassword, verifyResetCode } from "./actions";

function NewPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setError(null);
    setSaving(true);
    const result = await setNewPassword(password);
    if (result.error) {
      setError(result.error);
      setExpired(!!result.expired);
      setSaving(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand)]">
        <KeyRound className="size-5" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-stone-900">Choose a new password</h1>
      <p className="mt-1 text-sm text-stone-600">Use at least 10 characters. A long phrase works well.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            autoFocus
            required
            placeholder="••••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            required
            placeholder="••••••••••"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>

        <div aria-live="polite" className="min-h-5 text-sm">
          {error && <p className="text-red-600">{error}</p>}
        </div>

        {expired ? (
          <Button asChild className="w-full" size="lg">
            <Link href="/forgot-password">Request a new code</Link>
          </Button>
        ) : (
          <Button type="submit" className="w-full" size="lg" disabled={saving || password.length < 10 || !confirm}>
            {saving ? "Saving…" : "Update password"}
          </Button>
        )}
      </form>
    </div>
  );
}

function CodeForm({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const submitting = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit(value: string) {
    if (submitting.current) return;
    submitting.current = true;
    setVerifying(true);
    setError(null);
    const result = await verifyResetCode(email, value);
    if (result.error) {
      setError(result.error);
      setVerifying(false);
      submitting.current = false;
      return;
    }
    setVerified(true);
  }

  async function resend() {
    setResending(true);
    setError(null);
    setNotice(null);
    const result = await requestPasswordReset(email);
    setResending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNotice("If that address has an account, we sent a new code.");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  if (verified) return <NewPasswordForm />;

  return (
    <div>
      <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand)]">
        <MailCheck className="size-5" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-stone-900">Check your email</h1>
      <p className="mt-1 text-sm text-stone-600">
        If there&apos;s an account for <span className="font-medium text-stone-900">{email}</span>, we sent a code to it. Enter
        it below.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(code);
        }}
        className="mt-6 space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="code">Reset code</Label>
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
          {verifying ? "Verifying…" : "Continue"}
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
        <Link href="/forgot-password" className="font-medium text-[var(--color-brand)]">
          Use a different email
        </Link>
        .
      </p>
    </div>
  );
}

function ResetPasswordFlow() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";

  // The email's button lands here with step=new, already holding a recovery
  // session from /auth/confirm; setNewPassword() checks that session itself.
  if (searchParams.get("step") === "new") return <NewPasswordForm />;
  if (email) return <CodeForm email={email} />;

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Reset your password</h1>
      <p className="mt-2 text-sm text-stone-600">Start by telling us which account it is, and we&apos;ll email you a code.</p>
      <Button asChild className="mt-6 w-full" size="lg">
        <Link href="/forgot-password">Send me a reset code</Link>
      </Button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordFlow />
    </Suspense>
  );
}
