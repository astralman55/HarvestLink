import Link from "next/link";
import { Grape, LayoutDashboard, PlusCircle, CalendarRange, ShieldCheck } from "lucide-react";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/listings/create", label: "Create Listing", icon: PlusCircle },
  { href: "/planning", label: "Crop Planning", icon: CalendarRange },
];

async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    return data as Profile | null;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white px-4 py-6 md:flex">
        <Link href="/" className="flex items-center gap-2 px-2 font-semibold text-stone-900">
          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--color-brand)] text-white">
            <Grape className="size-4.5" />
          </span>
          <span className="text-lg tracking-tight">HarvestLink</span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-stone-100 pt-4">
          <div className="px-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-stone-900">
              {profile?.company_name ?? "Your Account"}
              {profile?.is_verified && <ShieldCheck className="size-3.5 text-emerald-600" />}
            </p>
            <p className="text-xs capitalize text-stone-500">{profile?.role ?? "member"}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
    </div>
  );
}
