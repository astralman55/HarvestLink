import type { PublicListing } from "@/lib/serializers/listing";
import { buildDigest, type DigestSection } from "@/lib/alerts/digest";
import { queryToFilters } from "@/lib/alerts/query";
import type { ListingSearchFilters } from "@/types";

export interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string;
  listing_type: "grapes" | "bulk_wine";
  query: string;
  unsubscribe_token: string;
  last_checked_at: string;
}

/** Everything the job touches, injected so it can be tested without a database or an email provider. */
export interface AlertDeps {
  now: Date;
  appUrl: string;
  loadActiveSearches(): Promise<SavedSearchRow[]>;
  /** Listings matching the search created in (after, before], as the anonymous public sees them. */
  findNewListings(filters: ListingSearchFilters, search: SavedSearchRow, excludeUserId: string): Promise<PublicListing[]>;
  getEmail(userId: string): Promise<string | null>;
  sendEmail(message: { to: string; subject: string; text: string; html: string; headers: Record<string, string> }): Promise<boolean>;
  markChecked(searchIds: string[], checkedAt: string, notifiedIds: string[]): Promise<void>;
}

export interface AlertRunResult {
  searches: number;
  users: number;
  emailsSent: number;
  listingsSent: number;
  errors: number;
}

/**
 * A listing row is created a beat before its bulk wine details row, so the job
 * looks only at listings at least this old. That way a half-created lot is
 * never emailed (and never skipped): it is picked up by the next run.
 */
const SETTLE_MINUTES = 10;

export async function runSavedSearchAlerts(deps: AlertDeps): Promise<AlertRunResult> {
  const result: AlertRunResult = { searches: 0, users: 0, emailsSent: 0, listingsSent: 0, errors: 0 };
  const searches = await deps.loadActiveSearches();
  result.searches = searches.length;

  const cutoff = new Date(deps.now.getTime() - SETTLE_MINUTES * 60_000).toISOString();
  const byUser = new Map<string, SavedSearchRow[]>();
  for (const search of searches) byUser.set(search.user_id, [...(byUser.get(search.user_id) ?? []), search]);
  result.users = byUser.size;

  for (const [userId, userSearches] of byUser) {
    const sections: DigestSection[] = [];
    const checkedOk: string[] = [];
    const withMatches: string[] = [];

    for (const search of userSearches) {
      try {
        const filters: ListingSearchFilters = {
          ...queryToFilters(search.query),
          listing_type: search.listing_type,
          created_after: search.last_checked_at,
          created_before: cutoff,
        };
        const listings = await deps.findNewListings(filters, search, userId);
        checkedOk.push(search.id);
        if (listings.length > 0) {
          withMatches.push(search.id);
          sections.push({ searchName: search.name, listingType: search.listing_type, query: search.query, unsubscribeToken: search.unsubscribe_token, listings });
        }
      } catch (error) {
        // One bad search must not stop the others, and it is left unmarked so it retries next run.
        result.errors++;
        console.error("Saved search check failed:", search.id, error);
      }
    }

    if (sections.length === 0) {
      if (checkedOk.length > 0) await deps.markChecked(checkedOk, cutoff, []);
      continue;
    }

    const to = await deps.getEmail(userId);
    if (!to) {
      result.errors++;
      continue;
    }
    const digest = buildDigest(sections, deps.appUrl);
    const sent = await deps.sendEmail({
      to,
      subject: digest.subject,
      text: digest.text,
      html: digest.html,
      headers: {
        "List-Unsubscribe": `<${digest.unsubscribeUrl.replace("/alerts/unsubscribe", "/api/alerts/unsubscribe")}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (!sent) {
      // Leave every search unmarked so tomorrow's run retries these listings.
      result.errors++;
      continue;
    }
    result.emailsSent++;
    result.listingsSent += sections.reduce((sum, section) => sum + section.listings.length, 0);
    await deps.markChecked(checkedOk, cutoff, withMatches);
  }

  return result;
}
