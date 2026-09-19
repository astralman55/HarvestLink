// Live smoke test for NDA privacy: creates a throwaway confidential listing
// full of canary strings, fetches the public pages as an anonymous visitor,
// and fails if any canary shows up. Cleans up after itself.
//
//   node --env-file=.env.local scripts/smoke-nda-live.mjs [baseUrl]
//
// Needs SUPABASE_SERVICE_ROLE_KEY (writes a temporary seller + listing).

import { createClient } from "@supabase/supabase-js";

const base = (process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}
const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

const CANARIES = ["Zzcanary Vineyard", "Zzcanary Hillside", "Zzcanary Winemaker", "Zzcanary Cellars", "zzcanary-seller"];
const stamp = Date.now();
const email = `zzcanary-seller-${stamp}@example.invalid`;

let userId = null;
let listingId = null;
let failures = 0;

async function cleanup() {
  if (listingId) await admin.from("listings").delete().eq("id", listingId);
  if (userId) await admin.auth.admin.deleteUser(userId);
}

try {
  const created = await admin.auth.admin.createUser({
    email,
    password: `Zz-${stamp}-pw!`,
    email_confirm: true,
    user_metadata: { role: "grower", company_name: "Zzcanary Cellars", full_name: "Zzcanary Owner" },
  });
  if (created.error) throw created.error;
  userId = created.data.user.id;
  await admin.from("profiles").update({ username: `zzcanary-seller-${String(stamp).slice(-6)}` }).eq("id", userId);

  const { data: listing, error } = await admin
    .from("listings")
    .insert({
      user_id: userId,
      listing_type: "bulk_wine",
      title: "Cabernet Sauvignon 2024 — Zzcanary Hillside",
      variety: "Cabernet Sauvignon",
      region_ava: "Napa Valley",
      sub_ava: "Zzcanary Hillside",
      estimated_tons: 0,
      minimum_tons: 0,
      price_per_ton: 0,
      farming_practice: "conventional",
      harvest_year: 2024,
      is_nda: true,
      nda_location_precision: "state",
      single_vineyard: true,
      vineyard_name: "Zzcanary Vineyard",
      status: "available",
    })
    .select("id")
    .single();
  if (error) throw error;
  listingId = listing.id;

  const details = await admin.from("bulk_wine_details").insert({
    listing_id: listingId,
    quantity_gallons: 1234,
    price_per_gallon: 9.5,
    abv: 14.2,
    vintage_year: 2024,
    wine_location_state: "CA",
    wine_location_county: "Zzcanary Hillside",
  });
  if (details.error) throw details.error;
  // Present only once migration 0007 has been run; the smoke test still works without it.
  await admin.from("listing_winemakers").insert({ listing_id: listingId, winemaker_name: "Zzcanary Winemaker" });

  const pages = ["/", "/bulk-wine", `/bulk-wine/${listingId}`, `/listings/${listingId}`, "/grapes", "/sitemap.xml"];
  for (const path of pages) {
    const res = await fetch(base + path, { redirect: "follow" });
    const text = await res.text();
    const hits = CANARIES.filter((c) => text.toLowerCase().includes(c.toLowerCase()));
    const showsLot = text.includes("Cabernet Sauvignon");
    if (hits.length > 0) {
      failures++;
      console.log(`LEAK  ${path} (HTTP ${res.status}) contains: ${hits.join(", ")}`);
    } else {
      console.log(`clean ${path} (HTTP ${res.status})${path.startsWith("/bulk-wine") && showsLot ? " — lot is listed" : ""}`);
    }
  }
} catch (err) {
  failures++;
  console.error("Smoke test could not run:", err?.message ?? err);
} finally {
  await cleanup();
  console.log("cleaned up test seller and listing");
}

if (failures > 0) {
  console.error(`\n${failures} problem(s).`);
  process.exit(1);
}
console.log("\nOK: no canary string appeared on any public page.");
