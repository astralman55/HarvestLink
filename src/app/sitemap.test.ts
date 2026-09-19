import { describe, expect, it, vi } from "vitest";
import sitemap from "./sitemap";
import { anonymousCanaryGrapes, anonymousCanaryBulkWine, CANARY_STRINGS } from "@/lib/serializers/canary-fixtures";

/**
 * Phase 7: Section 8.1's canary test extended to the sitemap Phase 6 added
 * (6.6/NDA-5). Every listing URL is built from `buildListingSlugPath`,
 * which slugifies `listing.title` -- server-generated, never seller text
 * (Decision 17) -- so this proves that invariant holds for real, rather
 * than resting on the comment in src/app/sitemap.ts alone.
 */
vi.mock("@/lib/data/listings", () => ({
  getListings: vi.fn(),
}));

describe("sitemap -- NDA canary", () => {
  it("never leaks the canary seller through a listing URL, for either listing type", async () => {
    const { getListings } = await import("@/lib/data/listings");
    vi.mocked(getListings).mockResolvedValue([anonymousCanaryGrapes(), anonymousCanaryBulkWine()]);

    const entries = await sitemap();
    const json = JSON.stringify(entries);
    for (const canary of CANARY_STRINGS) {
      expect(json).not.toContain(canary);
    }

    // A listing URL ends in the listing's UUID; static pages don't.
    const listingEntries = entries.filter((entry) => /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.url));
    expect(listingEntries).toHaveLength(2);
    expect(listingEntries.some((entry) => entry.url.includes("/grapes/"))).toBe(true);
    expect(listingEntries.some((entry) => entry.url.includes("/bulk-wine/"))).toBe(true);
  });

  it("falls back to just the static routes if the listings query fails", async () => {
    const { getListings } = await import("@/lib/data/listings");
    vi.mocked(getListings).mockRejectedValue(new Error("boom"));

    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => !entry.url.match(/[a-f0-9]{8}-[a-f0-9]{4}/))).toBe(true);
  });
});
