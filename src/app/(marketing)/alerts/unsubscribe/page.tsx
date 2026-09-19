import type { Metadata } from "next";
import Link from "next/link";
import { BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NOINDEX_METADATA } from "@/lib/seo";
import { isValidUnsubscribeToken } from "@/lib/alerts/unsubscribe";
import { confirmUnsubscribe } from "./actions";

export const metadata: Metadata = { ...NOINDEX_METADATA, title: "Stop email alerts" };

/**
 * The link in an alert email lands here and needs one click to confirm. It is
 * deliberately not a GET that changes anything: email scanners and link
 * previewers fetch links automatically and would otherwise cancel alerts.
 */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token, done } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-600">
        <BellOff className="size-6" />
      </span>
      {done === "1" ? (
        <>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900">Alert stopped</h1>
          <p className="mt-2 text-stone-600">You will not get emails for that saved search any more. You can turn it back on any time from your alerts page.</p>
        </>
      ) : done === "0" || !isValidUnsubscribeToken(token) ? (
        <>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900">That link did not work</h1>
          <p className="mt-2 text-stone-600">It may be incomplete or the search may already be deleted. Log in to manage your alerts directly.</p>
        </>
      ) : (
        <>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900">Stop this email alert?</h1>
          <p className="mt-2 text-stone-600">HarvestLink will stop emailing you about this saved search. Your other alerts are not affected.</p>
          <form action={confirmUnsubscribe} className="mt-6">
            <input type="hidden" name="token" value={token} />
            <Button type="submit" size="lg">
              Yes, stop this alert
            </Button>
          </form>
        </>
      )}
      <p className="mt-8 text-sm">
        <Link href="/alerts" className="font-medium text-[var(--color-brand)] underline">
          Manage all alerts
        </Link>
      </p>
    </div>
  );
}
