import { describe, expect, it } from "vitest";
import { VerifyCodeSchema, safeRedirectPath, sanitizeCodeInput } from "./verification";

describe("VerifyCodeSchema", () => {
  it("accepts 6-10 digit codes and normalizes whitespace", () => {
    expect(VerifyCodeSchema.safeParse({ email: "a@b.co", code: "123456" }).success).toBe(true);
    expect(VerifyCodeSchema.safeParse({ email: "a@b.co", code: "1234 5678" }).data?.code).toBe("12345678");
    expect(VerifyCodeSchema.safeParse({ email: "a@b.co", code: "1234567890" }).success).toBe(true);
  });

  it("rejects short, long, and non-numeric codes and bad emails", () => {
    expect(VerifyCodeSchema.safeParse({ email: "a@b.co", code: "12345" }).success).toBe(false);
    expect(VerifyCodeSchema.safeParse({ email: "a@b.co", code: "12345678901" }).success).toBe(false);
    expect(VerifyCodeSchema.safeParse({ email: "a@b.co", code: "12ab56" }).success).toBe(false);
    expect(VerifyCodeSchema.safeParse({ email: "not-an-email", code: "123456" }).success).toBe(false);
  });
});

describe("sanitizeCodeInput", () => {
  it("keeps digits only and caps the length", () => {
    expect(sanitizeCodeInput("12 34-56")).toBe("123456");
    expect(sanitizeCodeInput("abc")).toBe("");
    expect(sanitizeCodeInput("123456789012")).toBe("1234567890");
  });
});

describe("safeRedirectPath", () => {
  it("allows same-site relative paths", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/inquiries/abc?x=1")).toBe("/inquiries/abc?x=1");
  });

  it("falls back for anything that could leave the site", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "evil", "", null, undefined, "/ok\nbad"]) {
      expect(safeRedirectPath(bad as string | null | undefined)).toBe("/dashboard");
    }
    expect(safeRedirectPath("//evil.example", "/home")).toBe("/home");
  });
});
