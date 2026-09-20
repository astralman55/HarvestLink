import { afterEach, describe, expect, it, vi } from "vitest";
import {
  WantedInputSchema,
  checkWantedNotes,
  formatQuantityRange,
  wantedSearchQueries,
  wantedTitle,
  type WantedInput,
} from "./schema";
import { ANONYMOUS_POSTER, serializeWanted, type WantedRow } from "./data";
import { MAX_SELLERS_PER_REQUEST, buildSellerEmail, runWantedSellerAlerts, type AlertRequest, type SellerAlertDeps } from "./seller-alerts";
import { isValidWantedOptOut, wantedOptOutUrl } from "./unsubscribe";
import { queryToFilters } from "@/lib/alerts/query";

const valid = (over: Partial<Record<keyof WantedInput, unknown>> = {}) => ({
  request_type: "grapes",
  variety: "Pinot Noir",
  regions: ["Sonoma County"],
  quantity_min: 20,
  quantity_max: 40,
  max_price: null,
  show_price: false,
  year: 2026,
  farming_practice: null,
  notes: "",
  is_anonymous: true,
  alert_me: true,
  ...over,
});

describe("wanted request validation", () => {
  it("accepts a normal request", () => {
    expect(WantedInputSchema.safeParse(valid()).success).toBe(true);
  });

  it("rejects bad input", () => {
    for (const bad of [
      valid({ variety: "Unicorn Grape" }),
      valid({ regions: ["Atlantis County"] }),
      valid({ regions: ["Napa County", "Sonoma County", "Mendocino County", "Yolo County", "Lake County", "Marin County"] }),
      valid({ quantity_min: 0 }),
      valid({ quantity_min: "abc" }),
      valid({ quantity_min: 50, quantity_max: 10 }),
      valid({ year: 1850 }),
      valid({ notes: "x".repeat(501) }),
      valid({ farming_practice: "magic" }),
      valid({ request_type: "juice" }),
    ]) {
      expect(WantedInputSchema.safeParse(bad).success, JSON.stringify(bad).slice(0, 80)).toBe(false);
    }
  });

  it("treats blank optional numbers as none", () => {
    const parsed = WantedInputSchema.parse(valid({ quantity_max: "", max_price: "", year: "" }));
    expect(parsed.quantity_max).toBeNull();
    expect(parsed.max_price).toBeNull();
    expect(parsed.year).toBeNull();
  });
});

describe("request notes", () => {
  const anon = { anonymous: true, companyName: "Stagecoach Ridge Vineyards", fullName: "Jamie Rivera", username: "jrivera" };
  it("blocks contact details and links", () => {
    for (const text of ["call me at 707-555-1234", "write to buyer@example.com", "see www.example.com", "https://x.test/lot"]) {
      expect(checkWantedNotes(text, anon).blocked, text).toBe(true);
    }
  });
  it("blocks the poster's own name only on an anonymous request", () => {
    expect(checkWantedNotes("We are Stagecoach Ridge Vineyards and need fruit", anon).blocked).toBe(true);
    expect(checkWantedNotes("from jrivera", anon).blocked).toBe(true);
    expect(checkWantedNotes("We are Stagecoach Ridge Vineyards", { ...anon, anonymous: false }).blocked).toBe(false);
  });
  it("allows ordinary notes", () => {
    expect(checkWantedNotes("Need delivery to the North Coast in late September, 23 to 25 brix.", anon).blocked).toBe(false);
    expect(checkWantedNotes("vintages 1998 1999 2000 are fine", anon).blocked).toBe(false);
  });
});

describe("titles and search queries", () => {
  const base = { request_type: "grapes" as const, variety: "Pinot Noir", regions: ["Sonoma County"], quantity_min: 20, quantity_max: 40, year: 2026 };
  it("builds a plain title from controlled fields only", () => {
    expect(wantedTitle(base)).toBe("Wanted: 20 to 40 tons of Pinot Noir grapes, 2026 harvest from Sonoma County");
    expect(wantedTitle({ ...base, request_type: "bulk_wine", quantity_min: 5000, quantity_max: null, year: null, regions: [] })).toBe("Wanted: 5,000+ gallons of Pinot Noir bulk wine");
    expect(wantedTitle({ ...base, regions: ["A County", "B County", "C County"] })).toContain("from A County and 2 other regions");
    expect(formatQuantityRange("grapes", 10, 10)).toBe("10 tons");
  });
  it("turns a request into saved-search queries the alerts understand", () => {
    const queries = wantedSearchQueries({ ...valid({ regions: ["Napa County", "Sonoma County"], max_price: 3000 }) } as unknown as WantedInput);
    expect(queries).toHaveLength(2);
    expect(queryToFilters(queries[0])).toMatchObject({ variety: "Pinot Noir", region_ava: "Napa County", harvest_year: "2026", max_price: "3000" });
    const bulk = wantedSearchQueries({ ...valid({ request_type: "bulk_wine", regions: [] }) } as unknown as WantedInput);
    expect(bulk).toHaveLength(1);
    expect(queryToFilters(bulk[0])).toMatchObject({ vintage_year: "2026" });
  });
});

describe("serializer: an anonymous poster is never identifiable", () => {
  const row: WantedRow = {
    id: "5f1b1c1e-8a0b-4e77-9c1e-2f7a4d1b3c55",
    user_id: "9a9a9a9a-1111-2222-3333-444455556666",
    request_type: "grapes",
    variety: "Merlot",
    regions: ["Napa County"],
    quantity_min: 10,
    quantity_max: null,
    max_price: 4200,
    show_price: false,
    year: null,
    farming_practice: null,
    notes: "Delivered to the valley floor.",
    is_anonymous: true,
    status: "open",
    expires_at: "2099-01-01T00:00:00Z",
    created_at: "2026-09-01T00:00:00Z",
  };
  it("hides user id, name and a price the poster kept private", () => {
    const view = serializeWanted(row, "Stagecoach Ridge Vineyards");
    const json = JSON.stringify(view);
    expect(view.poster).toBe(ANONYMOUS_POSTER);
    expect(json).not.toContain(row.user_id);
    expect(json).not.toContain("Stagecoach");
    expect(json).not.toContain("4200");
    expect(view).not.toHaveProperty("user_id");
    expect(view).not.toHaveProperty("show_price");
    expect(view.max_price).toBeNull();
  });
  it("shows the company and the price only when the poster chose to", () => {
    const view = serializeWanted({ ...row, is_anonymous: false, show_price: true }, "Stagecoach Ridge Vineyards");
    expect(view.poster).toBe("Stagecoach Ridge Vineyards");
    expect(view.max_price).toBe(4200);
    expect(JSON.stringify(view)).not.toContain(row.user_id);
  });
  it("copies only allowlisted fields, so a new column is private by default", () => {
    const view = serializeWanted({ ...row, secret_new_column: "leak" } as unknown as WantedRow, null);
    expect(JSON.stringify(view)).not.toContain("leak");
  });
});

const request = (over: Partial<AlertRequest> = {}): AlertRequest => ({
  id: "r1",
  user_id: "poster",
  request_type: "grapes",
  variety: "Merlot",
  regions: [],
  quantity_min: 10,
  quantity_max: null,
  max_price: 4200,
  show_price: false,
  year: null,
  created_at: "2026-09-01T00:00:00Z",
  ...over,
});

function deps(over: Partial<SellerAlertDeps> = {}): SellerAlertDeps & { sent: { to: string; subject: string; text: string; html: string; headers: Record<string, string> }[]; announced: string[] } {
  const sent: { to: string; subject: string; text: string; html: string; headers: Record<string, string> }[] = [];
  const announced: string[] = [];
  return {
    now: new Date("2026-09-02T00:00:00Z"),
    appUrl: "https://bulkwinegrapes.com",
    loadUnannounced: async () => [request()],
    findMatchingSellers: async () => ["s1", "s2"],
    loadOptOuts: async () => new Set<string>(),
    getEmail: async (id) => `${id}@example.com`,
    optOutUrl: (id) => `https://bulkwinegrapes.com/wanted/unsubscribe?u=${id}&t=abc`,
    sendEmail: async (message) => {
      sent.push(message);
      return true;
    },
    markAnnounced: async (ids) => {
      announced.push(...ids);
    },
    ...over,
    sent,
    announced,
  };
}

describe("seller alerts", () => {
  it("emails each matching seller once and marks the request announced", async () => {
    const d = deps();
    const result = await runWantedSellerAlerts(d);
    expect(result).toEqual({ requests: 1, emailsSent: 2, errors: 0 });
    expect(d.sent.map((m) => m.to).sort()).toEqual(["s1@example.com", "s2@example.com"]);
    expect(d.announced).toEqual(["r1"]);
  });

  it("puts several matching requests into one email per seller", async () => {
    const d = deps({ loadUnannounced: async () => [request({ id: "r1" }), request({ id: "r2", variety: "Merlot" })], findMatchingSellers: async () => ["s1"] });
    const result = await runWantedSellerAlerts(d);
    expect(result.emailsSent).toBe(1);
    expect(d.sent[0].subject).toBe("2 buyers are looking for lots like yours");
    expect(d.announced.sort()).toEqual(["r1", "r2"]);
  });

  it("never emails the poster, opted-out members, or more than the fan-out cap", async () => {
    const d = deps({
      findMatchingSellers: async () => ["poster", "optout", ...Array.from({ length: 300 }, (_, i) => `seller${i}`)],
      loadOptOuts: async () => new Set(["optout"]),
    });
    const result = await runWantedSellerAlerts(d);
    const recipients = d.sent.map((m) => m.to);
    expect(recipients).not.toContain("poster@example.com");
    expect(recipients).not.toContain("optout@example.com");
    expect(result.emailsSent).toBeLessThanOrEqual(MAX_SELLERS_PER_REQUEST);
  });

  it("does nothing when there is nothing new", async () => {
    const d = deps({ loadUnannounced: async () => [] });
    expect(await runWantedSellerAlerts(d)).toEqual({ requests: 0, emailsSent: 0, errors: 0 });
    expect(d.announced).toEqual([]);
  });

  it("leaves a request unannounced when matching it failed, so the next run retries", async () => {
    const d = deps({ findMatchingSellers: async () => { throw new Error("db down"); } });
    const result = await runWantedSellerAlerts(d);
    expect(result.errors).toBe(1);
    expect(d.announced).toEqual([]);
  });

  it("sends a one-click List-Unsubscribe header pointing at the API endpoint", async () => {
    const d = deps();
    await runWantedSellerAlerts(d);
    expect(d.sent[0].headers["List-Unsubscribe"]).toContain("/api/wanted/unsubscribe?u=");
    expect(d.sent[0].headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("keeps the poster and a private price out of the email", () => {
    const email = buildSellerEmail([request({ user_id: "SECRET-POSTER-ID", max_price: 4200, show_price: false })], "https://bulkwinegrapes.com", null);
    const all = email.subject + email.text + email.html;
    expect(all).not.toContain("SECRET-POSTER-ID");
    expect(all).not.toContain("4,200");
    expect(all).not.toContain("4200");
    const shown = buildSellerEmail([request({ show_price: true })], "https://bulkwinegrapes.com", null);
    expect(shown.text).toContain("$4,200 per ton");
  });
});

describe("opt-out links", () => {
  const original = process.env.CRON_SECRET;
  afterEach(() => {
    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
    vi.restoreAllMocks();
  });
  const user = "11111111-2222-3333-4444-555555555555";

  it("verifies its own signed link and rejects a forged or changed one", () => {
    process.env.CRON_SECRET = "test-secret";
    const url = new URL(wantedOptOutUrl(user)!);
    const token = url.searchParams.get("t");
    expect(isValidWantedOptOut(user, token)).toBe(true);
    expect(isValidWantedOptOut(user, "0".repeat(32))).toBe(false);
    expect(isValidWantedOptOut("99999999-2222-3333-4444-555555555555", token)).toBe(false);
    expect(isValidWantedOptOut("not-a-uuid", token)).toBe(false);
  });

  it("issues no link at all when no secret is configured", () => {
    delete process.env.CRON_SECRET;
    expect(wantedOptOutUrl(user)).toBeNull();
    expect(isValidWantedOptOut(user, "anything")).toBe(false);
  });
});
