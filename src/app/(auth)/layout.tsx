import Link from "next/link";
import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = NOINDEX_METADATA;
import { Wordmark } from "@/components/shared/Wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center" aria-label="bulkwinegrapes.com home">
        <Wordmark className="h-9 w-auto" />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
