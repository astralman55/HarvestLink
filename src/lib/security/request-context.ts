/**
 * Turns a request's headers into the small, privacy-limited summary we keep
 * for a sign-in: approximate place, a shortened network, and a device label.
 *
 * On Vercel the platform already resolves the client IP to a place and sends it
 * as x-vercel-ip-* headers, so no paid IP-lookup service is needed. Locally
 * (or anywhere those headers are absent) the place is simply left empty.
 */

export interface RequestContext {
  country: string | null;
  region: string | null;
  city: string | null;
  /** Shortened network (IPv4 /24 or IPv6 /48). The full address is never kept. */
  ipNetwork: string | null;
  device: string;
}

/** Vercel URL-encodes place names ("San%20Francisco"); strip control characters and cap the length. */
export function decodeGeoHeader(value: string | null | undefined, max = 120): string | null {
  if (!value) return null;
  let text = value;
  try {
    text = decodeURIComponent(value);
  } catch {
    // keep the raw value
  }
  text = text.replace(/[\u0000-\u001f\u007f<>]/g, "").trim();
  return text ? text.slice(0, max) : null;
}

function expandIpv6(address: string): string[] | null {
  const halves = address.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 0) return null;
  const groups = halves.length === 1 ? head : [...head, ...Array(missing).fill("0"), ...tail];
  return groups.every((g) => /^[0-9a-fA-F]{1,4}$/.test(g)) ? groups.map((g) => g.toLowerCase().replace(/^0+(?=.)/, "")) : null;
}

/**
 * Keeps only the network part of an IP: 203.0.113.42 -> 203.0.113.0/24, and
 * 2001:db8:abcd:12::1 -> 2001:db8:abcd::/48. Takes the first entry of an
 * x-forwarded-for list. Returns null for anything that isn't an IP.
 */
export function truncateIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let ip = raw.split(",")[0].trim().replace(/^\[|\]$/g, "");
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) ip = mapped[1];

  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const octets = v4.slice(1).map(Number);
    return octets.every((n) => n >= 0 && n <= 255) ? `${octets[0]}.${octets[1]}.${octets[2]}.0/24` : null;
  }
  if (ip.includes(":")) {
    const groups = expandIpv6(ip.split("%")[0]);
    return groups ? `${groups[0]}:${groups[1]}:${groups[2]}::/48` : null;
  }
  return null;
}

/** "Chrome on Windows" from a user-agent string. Only this label is stored, never the raw string. */
export function parseDevice(userAgent: string | null | undefined): string {
  const ua = userAgent ?? "";
  if (!ua) return "Unknown device";

  const browser = /Edg(e|A|iOS)?\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\/|FxiOS\//.test(ua)
        ? "Firefox"
        : /Chrome\/|CriOS\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : null;

  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Windows NT/.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /CrOS/.test(ua)
            ? "ChromeOS"
            : /Linux|X11/.test(ua)
              ? "Linux"
              : null;

  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os ?? "Unknown device";
}

type HeaderReader = { get(name: string): string | null };

export function readRequestContext(headers: HeaderReader): RequestContext {
  return {
    country: decodeGeoHeader(headers.get("x-vercel-ip-country"), 8),
    region: decodeGeoHeader(headers.get("x-vercel-ip-country-region"), 80),
    city: decodeGeoHeader(headers.get("x-vercel-ip-city"), 120),
    ipNetwork: truncateIp(headers.get("x-forwarded-for") ?? headers.get("x-real-ip")),
    device: parseDevice(headers.get("user-agent")),
  };
}

/** "Napa, CA, United States" for display; falls back gracefully when parts are missing. */
export function describeLocation(event: { city: string | null; region: string | null; country: string | null }): string {
  let countryName = event.country;
  if (event.country && /^[A-Za-z]{2}$/.test(event.country)) {
    try {
      countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(event.country.toUpperCase()) ?? event.country;
    } catch {
      countryName = event.country;
    }
  }
  const parts = [event.city, event.region, countryName].filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join(", ") : "Location unavailable";
}
