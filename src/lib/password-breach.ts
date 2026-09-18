import { createHash } from "crypto";

/**
 * USR-5 (SHOULD): reject passwords found in known-breach lists, via the
 * Have I Been Pwned k-anonymity range API. Only the first 5 characters of
 * the password's SHA-1 hash are ever sent -- the password itself never
 * leaves the server, and HIBP can't reconstruct it from a 5-char prefix
 * shared by ~equally many other hashes.
 *
 * Best-effort: any network/API failure fails OPEN (returns false, i.e.
 * "not known to be breached") so an outage never blocks signup.
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;

    const body = await res.text();
    return body.split("\n").some((line) => line.split(":")[0].trim() === suffix);
  } catch {
    return false;
  }
}
