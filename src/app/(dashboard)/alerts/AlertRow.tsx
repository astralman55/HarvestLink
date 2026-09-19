"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteSavedSearch, setSavedSearchActive } from "./actions";

export interface AlertRowData {
  id: string;
  name: string;
  typeLabel: string;
  resultsHref: string;
  isActive: boolean;
  lastNotified: string | null;
}

export function AlertRow({ alert }: { alert: AlertRowData }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-stone-900">{alert.name}</p>
          <Badge variant="outline">{alert.typeLabel}</Badge>
          <Badge variant={alert.isActive ? "success" : "neutral"}>{alert.isActive ? "Active" : "Paused"}</Badge>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          Daily email when new lots match.{" "}
          {alert.lastNotified ? `Last email: ${alert.lastNotified}.` : "No emails sent yet."}{" "}
          <Link href={alert.resultsHref} className="font-medium text-[var(--color-brand)] underline">
            See current results
          </Link>
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => setSavedSearchActive(alert.id, !alert.isActive))}>
          {alert.isActive ? (
            <>
              <BellOff /> Pause
            </>
          ) : (
            <>
              <Bell /> Resume
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          aria-label={`Delete alert ${alert.name}`}
          onClick={() => {
            if (window.confirm("Delete this alert?")) run(() => deleteSavedSearch(alert.id));
          }}
        >
          <Trash2 /> Delete
        </Button>
      </div>
    </li>
  );
}
