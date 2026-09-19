import { describe, expect, it } from "vitest";
import { decodeGeoHeader, describeLocation, parseDevice, readRequestContext, truncateIp } from "./request-context";

describe("truncateIp", () => {
  it("keeps only the network part of an IPv4 address", () => {
    expect(truncateIp("203.0.113.42")).toBe("203.0.113.0/24");
    expect(truncateIp("10.20.30.255")).toBe("10.20.30.0/24");
  });

  it("uses the first address of a forwarded list and unwraps IPv4-mapped IPv6", () => {
    expect(truncateIp("198.51.100.7, 10.0.0.1, 10.0.0.2")).toBe("198.51.100.0/24");
    expect(truncateIp("::ffff:192.0.2.9")).toBe("192.0.2.0/24");
  });

  it("keeps only the /48 of an IPv6 address, including compressed forms", () => {
    expect(truncateIp("2001:db8:abcd:12:1:2:3:4")).toBe("2001:db8:abcd::/48");
    expect(truncateIp("2001:DB8:abcd:12::1")).toBe("2001:db8:abcd::/48");
    expect(truncateIp("2001:db8::1")).toBe("2001:db8:0::/48");
    expect(truncateIp("[2001:db8:1::5]")).toBe("2001:db8:1::/48");
  });

  it("never returns the full address, and rejects anything that is not an IP", () => {
    for (const bad of [null, undefined, "", "unknown", "999.1.1.1", "1.2.3", "not-an-ip", "2001:::1", "1:2:3:4:5:6:7:8:9"]) {
      expect(truncateIp(bad as string | null | undefined), String(bad)).toBeNull();
    }
    expect(truncateIp("203.0.113.42")).not.toContain("42");
  });
});

describe("decodeGeoHeader", () => {
  it("decodes Vercel's URL-encoded place names and strips junk", () => {
    expect(decodeGeoHeader("San%20Francisco")).toBe("San Francisco");
    expect(decodeGeoHeader("S%C3%A3o%20Paulo")).toBe("São Paulo");
    expect(decodeGeoHeader("  <b>Napa</b>\n ")).toBe("bNapa/b");
    expect(decodeGeoHeader("x".repeat(500))?.length).toBe(120);
    expect(decodeGeoHeader("%E0%A4%A")).toBe("%E0%A4%A"); // malformed encoding is kept as-is, not thrown
    expect(decodeGeoHeader("")).toBeNull();
    expect(decodeGeoHeader(null)).toBeNull();
  });
});

describe("parseDevice", () => {
  it.each([
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", "Chrome on Windows"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Edg/124.0", "Edge on Windows"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15", "Safari on macOS"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1", "Safari on iOS"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0 Mobile/15E148 Safari/604.1", "Chrome on iOS"],
    ["Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36", "Chrome on Android"],
    ["Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0", "Firefox on Linux"],
    ["curl/8.5.0", "Unknown device"],
    ["", "Unknown device"],
  ])("labels %s", (ua, label) => {
    expect(parseDevice(ua)).toBe(label);
  });

  it("never echoes the raw user-agent string", () => {
    expect(parseDevice("Mozilla/5.0 (Windows NT 10.0) Chrome/124.0 Safari/537.36 secret-token-abc")).toBe("Chrome on Windows");
  });
});

describe("readRequestContext", () => {
  const headers = (h: Record<string, string>) => ({ get: (name: string) => h[name.toLowerCase()] ?? null });

  it("reads Vercel's geo headers and shortens the IP", () => {
    const ctx = readRequestContext(
      headers({
        "x-vercel-ip-country": "US",
        "x-vercel-ip-country-region": "CA",
        "x-vercel-ip-city": "Santa%20Rosa",
        "x-forwarded-for": "203.0.113.42",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15",
      })
    );
    expect(ctx).toEqual({ country: "US", region: "CA", city: "Santa Rosa", ipNetwork: "203.0.113.0/24", device: "Safari on macOS" });
  });

  it("degrades to empty values when nothing is present (local development)", () => {
    expect(readRequestContext(headers({}))).toEqual({ country: null, region: null, city: null, ipNetwork: null, device: "Unknown device" });
  });
});

describe("describeLocation", () => {
  it("spells out the country and skips missing parts", () => {
    expect(describeLocation({ city: "Napa", region: "CA", country: "US" })).toBe("Napa, CA, United States");
    expect(describeLocation({ city: null, region: null, country: "FR" })).toBe("France");
    expect(describeLocation({ city: null, region: null, country: null })).toBe("Location unavailable");
  });
});
