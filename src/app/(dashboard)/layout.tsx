import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { NOINDEX_METADATA } from "@/lib/seo";
import { Wordmark } from "@/components/shared/Wordmark";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { Footer } from "@/components/shared/Footer";
import { DashboardMobileNav } from "@/components/shared/DashboardMobileNav";
import { DASHBOARD_NAV, siteLinks } from "@/components/shared/dashboard-nav";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export const metadata: Metadata = NOINDEX_METADATA;

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
  const name = profile?.company_name || profile?.full_name || "Your Account";
  const subtitle = `${profile?.role ?? "member"}${profile?.username ? ` · @${profile.username}` : ""}`;
  const site = siteLinks();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      {/* Phones and tablets: a top bar with the logo and a full menu (the sidebar below is desktop-only). */}
      <DashboardMobileNav name={name} subtitle={subtitle} />

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white px-4 py-6 md:flex">
          <Link href="/" className="flex items-center px-2" aria-label="bulkwinegrapes.com home">
            <Wordmark className="h-6 w-auto" />
          </Link>

          <nav aria-label="Your account" className="mt-8 flex flex-col gap-1">
            {DASHBOARD_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                {item.icon && <item.icon className="size-4" />}
                {item.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="BWG" className="mt-6 flex flex-1 flex-col gap-0.5 border-t border-stone-100 pt-4">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">BWG</p>
            {site.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-stone-100 pt-4">
            <div className="px-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-stone-900">
                {name}
                {profile?.is_verified && <ShieldCheck className="size-3.5 text-emerald-600" />}
              </p>
              <p className="text-xs capitalize text-stone-500">
                {profile?.role ?? "member"}
                {profile?.username && <span className="normal-case"> · @{profile.username}</span>}
              </p>
            </div>
            <SignOutButton />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>

      <Footer />
    </div>
  );
}
