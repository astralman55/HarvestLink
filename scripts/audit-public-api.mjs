// Probes the LIVE Supabase REST API with only the public anon key and fails
// if any NDA-identifying column is readable (Decision 46 / migration 0008).
//
//   node --env-file=.env.local scripts/audit-public-api.mjs
//
// Run it after applying migration 0008, and again before promoting
// confidential listings. It only reads; it writes nothing.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon || url.includes("your-project-id")) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (e.g. --env-file=.env.local).");
  process.exit(2);
}

// [table, columns that must NOT be readable with the anon key, strict].
// strict = locked by column grants (migration 0008): ANY 2xx answer is a leak,
// even an empty one, because a revoked column errors before rows are looked
// at. Non-strict tables are only RLS-gated, so an empty 2xx is fine and only
// returned rows count as a leak.
const FORBIDDEN = [
  ["listings", ["*", "user_id", "vineyard_name", "vineyard_name_normalized", "sub_ava", "region_ava", "title", "is_nda", "single_vineyard", "nda_location_precision", "updated_at"], true],
  ["bulk_wine_details", ["*", "wine_location_county", "wine_location_state", "price_per_gallon"], true],
  ["listing_inquiries", ["*", "seller_id"], true],
  ["listing_inquiry_messages", ["*", "sender_id"], true],
  ["saved_searches", ["*", "user_id", "unsubscribe_token", "query"], true],
  ["login_events", ["*", "city", "ip_network", "user_id"], true],
  ["listing_winemakers", ["*", "winemaker_name"]],
  ["profiles", ["*", "phone", "address", "full_name"]],
  ["nda_audit_log", ["*"]],
  ["admin_identity_view_log", ["*"]],
];

async function probe(table, column, strict) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${encodeURIComponent(column)}&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  const body = await res.json().catch(() => null);
  const leaked = res.ok && Array.isArray(body) && (strict || body.length > 0);
  return { status: res.status, leaked };
}

let failures = 0;
for (const [table, columns, strict = false] of FORBIDDEN) {
  for (const column of columns) {
    const { status, leaked } = await probe(table, column, strict);
    if (leaked) {
      failures++;
      console.log(`LEAK    ${table}.${column} is readable with the anon key (HTTP ${status})`);
    } else {
      console.log(`locked  ${table}.${column} (HTTP ${status})`);
    }
  }
}

// The one thing that MUST still work: the marketplace's public key column.
const idProbe = await probe("listings", "id", false);
console.log(`info    listings.id readable by anon: ${idProbe.leaked ? "yes (expected)" : "no rows / no access"}`);

if (failures > 0) {
  console.error(`\n${failures} identifying column(s) are readable through the public API.`);
  process.exit(1);
}
console.log("\nOK: no identifying column is readable through the public API.");
