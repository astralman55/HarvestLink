"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSending(true);
    const result = await requestPasswordReset(email.trim());
    if (result.error) {
      setError(result.error);
      setSending(false);
      return;
    }
    router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Forgot your password?</h1>
      <p className="mt-1 text-sm text-stone-500">
        Enter your account email and we&apos;ll send you a code to choose a new one.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="you@vineyard.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={sending || !email.trim()}>
          {sending ? "Sending…" : "Send reset code"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-[var(--color-brand)]">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
