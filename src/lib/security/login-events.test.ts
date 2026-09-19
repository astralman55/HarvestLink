import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const headerMap: Record<string, string> = {};

vi.mock("next/headers", () => ({ headers: async () => ({ get: (name: string) => headerMap[name.toLowerCase()] ?? null }) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from }) }));

import { recordLoginEvent } from "./login-events";

beforeEach(() => {
  insert.mockReset();
  insert.mockResolvedValue({ error: null });
  from.mockClear();
  for (const key of Object.keys(headerMap)) delete headerMap[key];
});

describe("recordLoginEvent", () => {
  it("stores approximate place, a shortened IP and a device label, never the full IP or raw user-agent", async () => {
    Object.assign(headerMap, {
      "x-vercel-ip-country": "US",
      "x-vercel-ip-country-region": "CA",
      "x-vercel-ip-city": "Santa%20Rosa",
      "x-forwarded-for": "203.0.113.42, 10.0.0.1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36 private-marker",
    });
    await recordLoginEvent("user-1", "password");

    expect(from).toHaveBeenCalledWith("login_events");
    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      method: "password",
      country: "US",
      region: "CA",
      city: "Santa Rosa",
      ip_network: "203.0.113.0/24",
      device: "Chrome on Windows",
    });
    const stored = JSON.stringify(insert.mock.calls[0][0]);
    expect(stored).not.toContain("203.0.113.42");
    expect(stored).not.toContain("private-marker");
  });

  it("records an event with empty location when no geo headers exist (local development)", async () => {
    await recordLoginEvent("user-2", "signup_code");
    expect(insert).toHaveBeenCalledWith({ user_id: "user-2", method: "signup_code", country: null, region: null, city: null, ip_network: null, device: "Unknown device" });
  });

  it("never throws, even if the insert rejects or the table is missing", async () => {
    insert.mockRejectedValueOnce(new Error('relation "login_events" does not exist'));
    await expect(recordLoginEvent("user-3", "email_link")).resolves.toBeUndefined();
    insert.mockResolvedValueOnce({ error: { message: "permission denied" } });
    await expect(recordLoginEvent("user-3", "password_reset")).resolves.toBeUndefined();
  });
});
