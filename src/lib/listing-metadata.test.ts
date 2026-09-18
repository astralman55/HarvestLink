import { describe, expect, it, vi } from "vitest";
import { buildListingMetadata } from "./listing-metadata";
import { anonymousCanaryGrapes, anonymousCanaryBulkWine, CANARY_STRINGS } from "@/lib/serializers/canary-fixtures";

/**
 * Phase 7: Section 8.1's canary test extended to the per-listing metadata
 * Phase 6 added (NDA-5 -- title/description/canonical/OG/Twitter tags).
 * `getListingById` already returns data that's passed through the central
 * serializer (src/lib/data/listings.ts), so this asserts the metadata
 * builder doesn't introduce a second, unguarded path to the same fields.
 */
vi.mock("@/lib/data/listings", () => ({
  getListingById: vi.fn(),
}));

function assertNoCanaryLeak(value: unknown) {
  const json = JSON.stringify(value);
  for (const canary of CANARY_STRINGS) {
    expect(json).not.toContain(canary);
  }
}

describe("buildListingMetadata -- NDA canary", () => {
  it("never leaks the canary seller through a grapes NDA listing's metadata", async () => {
    const { getListingById } = await import("@/lib/data/listings");
    vi.mocked(getListingById).mockResolvedValue(anonymousCanaryGrapes());

    const metadata = await buildListingMetadata("some-slug-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "grapes");
    assertNoCanaryLeak(metadata);
    expect(metadata.title).toBe("Cabernet Sauvignon (Clone 337) — Napa County");
  });

  it("never leaks the canary seller through a bulk-wine NDA listing's metadata, including the withheld county", async () => {
    const { getListingById } = await import("@/lib/data/listings");
    vi.mocked(getListingById).mockResolvedValue(anonymousCanaryBulkWine({ nda_location_precision: "state" }));

    const metadata = await buildListingMetadata("some-slug-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "bulk-wine");
    assertNoCanaryLeak(metadata);
  });

  it("returns empty metadata for a listing that doesn't exist, not an error", async () => {
    const { getListingById } = await import("@/lib/data/listings");
    vi.mocked(getListingById).mockResolvedValue(null);

    const metadata = await buildListingMetadata("nonexistent", "grapes");
    expect(metadata).toEqual({});
  });
});
