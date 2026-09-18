import { DatabaseZap } from "lucide-react";

export function ConnectSupabaseNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <DatabaseZap className="mt-0.5 size-4 shrink-0" />
      <p>
        This area needs a live Supabase project. Add your project URL and keys to{" "}
        <code className="rounded bg-amber-100 px-1 py-0.5">.env.local</code>, then run the
        migration in <code className="rounded bg-amber-100 px-1 py-0.5">supabase/migrations</code>{" "}
        — see the README for the full setup steps.
      </p>
    </div>
  );
}
