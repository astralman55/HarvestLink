// Scope addendum feature flags. Env-driven (see docs/scope-addendum-decisions.md,
// Decision 4) so each phase can be merged dark and enabled per environment
// without a database-backed config system.

function isEnabled(value: string | undefined): boolean {
  return value === "true";
}

export const flags = {
  usernames: isEnabled(process.env.NEXT_PUBLIC_FEATURE_USERNAMES),
  ndaListings: isEnabled(process.env.NEXT_PUBLIC_FEATURE_NDA_LISTINGS),
  bulkWine: isEnabled(process.env.NEXT_PUBLIC_FEATURE_BULK_WINE),
} as const;
