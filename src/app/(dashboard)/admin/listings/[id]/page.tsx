import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Listing, Profile } from "@/types";

async function loadAdminView(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { redirectToLogin: true as const };

  const { data: viewerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (viewerProfile?.role !== "admin") return { forbidden: true as const };

  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).single();
  if (!listing) return { notFound: true as const };

  const { data: seller } = await supabase.from("profiles").select("*").eq("id", (listing as Listing).user_id).single();

  // NDA-11: every admin view of an NDA listing's real identity is logged.
  if ((listing as Listing).is_nda) {
    await supabase.from("admin_identity_view_log").insert({ admin_id: user.id, listing_id: id });
  }

  return { ok: true as const, listing: listing as Listing, seller: seller as Profile | null };
}

export default async function AdminListingIdentityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadAdminView(id);

  if ("redirectToLogin" in result) redirect(`/login?redirect_to=${encodeURIComponent(`/admin/listings/${id}`)}`);
  if ("forbidden" in result) redirect("/dashboard");
  if ("notFound" in result) notFound();

  const { listing, seller } = result;

  return (
    <div className="max-w-2xl">
      <Link href={`/listings/${id}`} className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900">
        <ArrowLeft className="size-4" /> Back to public listing
      </Link>

      <div className="mt-4 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-stone-900">{listing.title}</h1>
        {listing.is_nda && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">NDA</Badge>}
      </div>

      {listing.is_nda ? (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <ShieldAlert className="size-4" /> NDA listing: seller identity visible to admins only
          </p>
          <p className="mt-1 text-xs text-amber-800">This view was just recorded in the admin identity audit log.</p>

          <Separator className="my-4 bg-amber-200" />

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-amber-700">Company</dt>
              <dd className="mt-0.5 font-medium text-stone-900">{seller?.company_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-amber-700">Full Name</dt>
              <dd className="mt-0.5 font-medium text-stone-900">{seller?.full_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-amber-700">Username</dt>
              <dd className="mt-0.5 font-medium text-stone-900">{seller?.username ? `@${seller.username}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-amber-700">Phone</dt>
              <dd className="mt-0.5 font-medium text-stone-900">{seller?.contact_phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-amber-700">Operational Region</dt>
              <dd className="mt-0.5 font-medium text-stone-900">{seller?.region_ava ?? "—"}</dd>
            </div>
            {listing.single_vineyard && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-amber-700">Vineyard Name</dt>
                <dd className="mt-0.5 font-medium text-stone-900">{listing.vineyard_name ?? "—"}</dd>
              </div>
            )}
          </dl>
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">This listing isn&apos;t under NDA -- its seller is already public.</p>
      )}
    </div>
  );
}
