"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { closeWantedRequest, deleteWantedRequest, renewWantedRequest } from "@/app/(dashboard)/requests/actions";

/** Renew, mark filled, close and delete for one of the member's own requests. */
export function RequestActions({ id, open }: { id: string; open: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<{ error?: string } | { success: true }>) {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if ("error" in result && result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {open && (
          <>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => renewWantedRequest(id))}>
              Renew 60 days
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => closeWantedRequest(id, "filled"))}>
              Mark as filled
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => closeWantedRequest(id, "closed"))}>
              Close
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          className="text-red-700 hover:bg-red-50"
          onClick={() => {
            if (window.confirm("Delete this request and its conversations? This can't be undone.")) void run(() => deleteWantedRequest(id));
          }}
        >
          Delete
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
