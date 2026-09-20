import type { Metadata } from "next";
import Link from "next/link";
import { BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NOINDEX_METADATA } from "@/lib/seo";
import { isValidWantedOptOut } from "@/lib/wanted/unsubscribe";
import { confirmWantedOptOut } from "./actions";

export const metadata: Metadata = { ...NOINDEX_METADATA, title: "Stop request emails" };

/** Needs one click to confirm: email scanners fetch links automatically and must not opt anyone out. */
export default async function WantedOptOutPage({ searchParams }: { searchParams: Promise<{ u?: string; t?: string; done?: string }> }) {
  const { u, t, done } = await searchParams;
  const valid = isValidWantedOptOut(u, t);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-600">
        <BellOff className="size-6" />
      </span>
      {done === "1" ? (
        <>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900">You are unsubscribed</h1>
          <p className="mt-2 text-stone-600">You will not get emails when a buyer posts a request that matches one of your lots. Your other emails are not affected.</p>
        </>
      ) : done === "0" || !valid ? (
        <>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900">That link did not work</h1>
          <p className="mt-2 text-stone-600">It may be incomplete. You can still browse open requests any time.</p>
        </>
      ) : (
        <>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900">Stop these emails?</h1>
          <p className="mt-2 text-stone-600">We will stop emailing you when a buyer posts a request that matches one of your lots.</p>
          <form action={confirmWantedOptOut} className="mt-6">
            <input type="hidden" name="u" value={u} />
            <input type="hidden" name="t" value={t} />
            <Button type="submit" size="lg">
              Yes, stop these emails
            </Button>
          </form>
        </>
      )}
      <p className="mt-8 text-sm">
        <Link href="/wanted" className="font-medium text-[var(--color-brand)] underline">
          Browse open requests
        </Link>
      </p>
    </div>
  );
}
