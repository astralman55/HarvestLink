import Link from "next/link";
import { Grape } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold text-stone-900">
        <span className="flex size-8 items-center justify-center rounded-full bg-[var(--color-brand)] text-white">
          <Grape className="size-4.5" />
        </span>
        <span className="text-lg tracking-tight">HarvestLink</span>
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
