import { describe, expect, it, vi } from "vitest";
import { describeSearch, queryToFilters, sanitizeSearchParams, searchResultsPath } from "./query";
import { buildDigest, MAX_LISTINGS_PER_SEARCH } from "./digest";
import { runSavedSearchAlerts, type AlertDeps, type SavedSearchRow } from "./run";
import { ANONYMOUS_VIEWER, serializeListing, type PublicListing } from "@/lib/serializers/listing";
import { CANARY_STRINGS, anonymousCanaryBulkWine, anonymousCanaryGrapes } from "@/lib/serializers/canary-fixtures";

describe("saved search query handling", () => {
  it("keeps only allowlisted, non-empty filters and drops everything else", () => {
    const query = sanitizeSearchParams({
      variety: "Pinot Noir",
      region_ava: "Sonoma County",
      sort: "price_asc",
      page: "3",
      utm_source: "x",
      max_price: "  ",
      listing_type: "grapes",
    });
    expect(new URLSearchParams(query).get("variety")).toBe("Pinot Noir");
    expect(new URLSearchParams(query).get("region_ava")).toBe("Sonoma County");
    for (const dropped of ["sort", "page", "utm_source", "max_price", "listing_type"]) expect(query).not.toContain(dropped);
  });

  it("rejects oversized values, and round-trips through queryToFilters", () => {
    expect(sanitizeSearchParams({ variety: "x".repeat(101) })).toBe("");
    const filters = queryToFilters("variety=Merlot&sort=abv&evil=1&min_tons=5");
    expect(filters).toEqual({ variety: "Merlot", min_tons: "5" });
  });

  it("describes searches in plain words and builds results links", () => {
    expect(describeSearch("grapes", {})).toBe("All new grape lots");
    expect(describeSearch("grapes", { variety: "Chardonnay", region_ava: "Napa County", max_price: "3000" })).toBe(
      "Chardonnay, Napa County, under $3,000/ton (grape lots)"
    );
    expect(describeSearch("bulk_wine", { variety: "Zinfandel", max_price: "6.5" })).toBe("Zinfandel, under $6.50/gal (bulk wine)");
    expect(searchResultsPath("bulk_wine", "variety=Merlot")).toBe("/bulk-wine?variety=Merlot");
    expect(searchResultsPath("grapes", "")).toBe("/grapes");
  });
});

/** The digest is built from what the anonymous public can see, so it must be free of every canary. */
describe("alert digest (NDA canary)", () => {
  const publicGrapes = anonymousCanaryGrapes();
  const publicWine = anonymousCanaryBulkWine();
  const token = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  it("never contains a confidential seller's identifying details, in text or HTML", () => {
    const digest = buildDigest(
      [
        { searchName: "Cab lots", listingType: "grapes", query: "variety=Cabernet+Sauvignon", unsubscribeToken: token, listings: [publicGrapes] },
        { searchName: "Bulk reds", listingType: "bulk_wine", query: "", unsubscribeToken: token, listings: [publicWine] },
      ],
      "https://example.test"
    );
    const everything = [digest.subject, digest.text, digest.html, digest.unsubscribeUrl].join("\n");
    for (const canary of CANARY_STRINGS) expect(everything, canary).not.toContain(canary);
    expect(digest.text).toContain("confidential seller");
    expect(digest.text).toContain("https://example.test/grapes/");
    expect(digest.text).toContain("https://example.test/bulk-wine/");
  });

  it("links every section to its results and a one-click stop link", () => {
    const digest = buildDigest([{ searchName: "Cab lots", listingType: "grapes", query: "variety=Cabernet+Sauvignon", unsubscribeToken: token, listings: [publicGrapes] }], "https://example.test/");
    expect(digest.text).toContain("https://example.test/grapes?variety=Cabernet+Sauvignon");
    expect(digest.text).toContain(`https://example.test/alerts/unsubscribe?token=${token}`);
    expect(digest.text).toContain("https://example.test/alerts");
    expect(digest.subject).toMatch(/^New match:/);
  });

  it("escapes HTML in listing titles and caps how many listings one search shows", () => {
    const many: PublicListing[] = Array.from({ length: MAX_LISTINGS_PER_SEARCH + 4 }, (_, i) => ({ ...publicGrapes, id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`, title: `<b>Lot ${i}</b>` }));
    const digest = buildDigest([{ searchName: "<script>x</script>", listingType: "grapes", query: "", unsubscribeToken: token, listings: many }], "https://example.test");
    expect(digest.html).not.toContain("<script>");
    expect(digest.html).not.toContain("<b>Lot");
    expect(digest.text).toContain("and 4 more");
    expect(digest.subject).toBe(`${MAX_LISTINGS_PER_SEARCH + 4} new listings match your saved searches`);
  });

  it("the anonymous serializer view of a real NDA row has no canary in it (guards the fixtures themselves)", () => {
    const serialized = JSON.stringify(serializeListing(anonymousCanaryGrapes() as never, null, ANONYMOUS_VIEWER));
    expect(serialized.length).toBeGreaterThan(10);
  });
});

function search(overrides: Partial<SavedSearchRow> = {}): SavedSearchRow {
  return {
    id: "s1",
    user_id: "u1",
    name: "Cab",
    listing_type: "grapes",
    query: "variety=Cabernet+Sauvignon",
    unsubscribe_token: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    last_checked_at: "2026-09-18T00:00:00.000Z",
    ...overrides,
  };
}

function makeDeps(overrides: Partial<AlertDeps> & { searches: SavedSearchRow[]; matches?: PublicListing[] }) {
  const sent: { to: string; subject: string; text: string; html: string; headers: Record<string, string> }[] = [];
  const marked: { ids: string[]; at: string; notified: string[] }[] = [];
  const deps: AlertDeps = {
    now: new Date("2026-09-19T12:00:00.000Z"),
    appUrl: "https://example.test",
    loadActiveSearches: async () => overrides.searches,
    findNewListings: vi.fn(async () => overrides.matches ?? []),
    getEmail: async (userId) => (userId === "nomail" ? null : `${userId}@example.test`),
    sendEmail: async (message) => {
      sent.push(message);
      return true;
    },
    markChecked: async (ids, at, notified) => {
      marked.push({ ids, at, notified });
    },
    ...overrides,
  };
  return { deps, sent, marked };
}

describe("runSavedSearchAlerts", () => {
  it("emails one digest per member and advances every checked search to the settle cutoff", async () => {
    const { deps, sent, marked } = makeDeps({ searches: [search(), search({ id: "s2", name: "Chard", query: "variety=Chardonnay" })], matches: [anonymousCanaryGrapes()] });
    const result = await runSavedSearchAlerts(deps);
    expect(result).toMatchObject({ searches: 2, users: 1, emailsSent: 1, listingsSent: 2, errors: 0 });
    expect(sent).toHaveLength(1);
    expect(sent[0].headers["List-Unsubscribe"]).toContain("/api/alerts/unsubscribe?token=");
    expect(sent[0].headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    // 10 minutes before "now": a listing still being created is never emailed or skipped.
    expect(marked[0]).toEqual({ ids: ["s1", "s2"], at: "2026-09-19T11:50:00.000Z", notified: ["s1", "s2"] });
  });

  it("asks only for listings inside the search's window and excludes the member's own listings", async () => {
    const { deps } = makeDeps({ searches: [search()], matches: [] });
    await runSavedSearchAlerts(deps);
    const [filters, , excludeUserId] = vi.mocked(deps.findNewListings).mock.calls[0];
    expect(filters).toMatchObject({ variety: "Cabernet Sauvignon", listing_type: "grapes", created_after: "2026-09-18T00:00:00.000Z", created_before: "2026-09-19T11:50:00.000Z" });
    expect(excludeUserId).toBe("u1");
  });

  it("sends nothing but still advances the window when nothing matches", async () => {
    const { deps, sent, marked } = makeDeps({ searches: [search()], matches: [] });
    const result = await runSavedSearchAlerts(deps);
    expect(sent).toHaveLength(0);
    expect(result.emailsSent).toBe(0);
    expect(marked).toEqual([{ ids: ["s1"], at: "2026-09-19T11:50:00.000Z", notified: [] }]);
  });

  it("does NOT advance the window when the email fails, so the listings are retried tomorrow", async () => {
    const { deps, marked } = makeDeps({ searches: [search()], matches: [anonymousCanaryGrapes()], sendEmail: async () => false });
    const result = await runSavedSearchAlerts(deps);
    expect(result.errors).toBe(1);
    expect(marked).toHaveLength(0);
  });

  it("isolates a failing search, and skips members with no email address", async () => {
    let calls = 0;
    const { deps, sent, marked } = makeDeps({
      searches: [search({ id: "bad" }), search({ id: "good", name: "Good" }), search({ id: "x", user_id: "nomail" })],
      matches: [anonymousCanaryGrapes()],
      findNewListings: async () => {
        calls++;
        if (calls === 1) throw new Error("query failed");
        return [anonymousCanaryGrapes()];
      },
    });
    const result = await runSavedSearchAlerts(deps);
    expect(sent).toHaveLength(1);
    expect(marked[0].ids).toEqual(["good"]); // "bad" stays unmarked and retries
    expect(result.errors).toBe(2); // the failing search + the member with no email
  });
});
