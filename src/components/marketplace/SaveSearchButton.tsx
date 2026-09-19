"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSavedSearch } from "@/app/(dashboard)/alerts/actions";

interface SaveSearchButtonProps {
  listingType: "grapes" | "bulk_wine";
  /** The sanitized filter query string for the results being viewed. */
  query: string;
  defaultName: string;
  isLoggedIn: boolean;
  /** Where to send a logged-out visitor back to after they log in. */
  returnTo: string;
}

/** "Save this search" for the browse pages: one click for a name, then a daily email when new lots match. */
export function SaveSearchButton({ listingType, query, defaultName, isLoggedIn, returnTo }: SaveSearchButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!isLoggedIn) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={`/login?redirect_to=${encodeURIComponent(returnTo)}`}>
          <Bell /> Log in to get email alerts
        </Link>
      </Button>
    );
  }

  if (saved) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-700">
        <Check className="size-4" /> Saved. We will email you when new lots match.{" "}
        <Link href="/alerts" className="font-medium underline">
          Manage alerts
        </Link>
      </p>
    );
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = await createSavedSearch({ listingType, query, name });
    setSaving(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Bell /> Save this search
      </Button>
    );
  }

  return (
    <form onSubmit={save} className="w-full max-w-sm space-y-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
      <Label htmlFor="alert-name" className="text-xs">
        Name this alert. We email you once a day, only when something new matches.
      </Label>
      <Input id="alert-name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} autoFocus />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving || !name.trim()}>
          {saving ? "Saving…" : "Save alert"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
