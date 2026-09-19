import { formatCurrency, formatCurrencyPrecise, formatGallons, formatTons, buildListingSlugPath } from "@/lib/utils";
import type { PublicListing } from "@/lib/serializers/listing";
import { searchResultsPath } from "@/lib/alerts/query";

export const MAX_LISTINGS_PER_SEARCH = 8;

export interface DigestSection {
  searchName: string;
  listingType: "grapes" | "bulk_wine";
  query: string;
  unsubscribeToken: string;
  listings: PublicListing[];
}

export interface Digest {
  subject: string;
  text: string;
  html: string;
  /** For the List-Unsubscribe header: the first section's one-click link. */
  unsubscribeUrl: string;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function listingLine(listing: PublicListing): string {
  if (listing.listing_type === "bulk_wine" && listing.bulk_wine) {
    return `${formatGallons(listing.bulk_wine.quantity_gallons)} at ${formatCurrencyPrecise(listing.bulk_wine.price_per_gallon)}/gal, ${listing.bulk_wine.abv}% ABV`;
  }
  return `${formatTons(listing.estimated_tons)} at ${formatCurrency(listing.price_per_ton)}/ton`;
}

/**
 * Builds the daily alert email from PublicListing objects only, i.e. the
 * central NDA serializer's output for an anonymous viewer. It therefore
 * cannot contain a confidential seller's name, vineyard, winemaker, or any
 * hidden location detail. Nothing here ever touches a raw listing row.
 */
export function buildDigest(sections: DigestSection[], appUrl: string): Digest {
  const total = sections.reduce((sum, section) => sum + section.listings.length, 0);
  const url = (path: string) => `${appUrl.replace(/\/$/, "")}${path}`;
  const first = sections[0];

  const subject =
    total === 1 && first
      ? `New match: ${first.listings[0].title}`
      : `${total} new listings match your saved searches`;

  const textParts: string[] = ["New listings match your saved searches on HarvestLink.", ""];
  const htmlParts: string[] = [];

  for (const section of sections) {
    const shown = section.listings.slice(0, MAX_LISTINGS_PER_SEARCH);
    const extra = section.listings.length - shown.length;
    const resultsUrl = url(searchResultsPath(section.listingType, section.query));
    const unsubscribeUrl = url(`/alerts/unsubscribe?token=${section.unsubscribeToken}`);

    textParts.push(`${section.searchName}`, "");
    const items: string[] = [];
    for (const listing of shown) {
      const section_ = section.listingType === "bulk_wine" ? "bulk-wine" : "grapes";
      const link = url(`/${section_}/${buildListingSlugPath(listing.title, listing.id)}`);
      const tag = listing.is_confidential ? " (confidential seller)" : "";
      textParts.push(`  ${listing.title}${tag}`, `  ${listingLine(listing)}`, `  ${link}`, "");
      items.push(
        `<li style="margin:0 0 14px"><a href="${escapeHtml(link)}" style="color:#722545;font-weight:600;text-decoration:none">${escapeHtml(listing.title)}</a>${
          listing.is_confidential ? ' <span style="color:#78716c;font-size:12px">(confidential seller)</span>' : ""
        }<br><span style="color:#57534e">${escapeHtml(listingLine(listing))}</span></li>`
      );
    }
    if (extra > 0) {
      textParts.push(`  ...and ${extra} more.`, "");
      items.push(`<li style="margin:0 0 14px;color:#57534e">...and ${extra} more.</li>`);
    }
    textParts.push(`See all results: ${resultsUrl}`, `Stop this alert: ${unsubscribeUrl}`, "", "----", "");

    htmlParts.push(
      `<h2 style="font-size:16px;margin:24px 0 10px;color:#1c1917">${escapeHtml(section.searchName)}</h2><ul style="padding-left:18px;margin:0">${items.join("")}</ul><p style="margin:8px 0 0;font-size:13px"><a href="${escapeHtml(resultsUrl)}" style="color:#722545">See all results</a> &middot; <a href="${escapeHtml(unsubscribeUrl)}" style="color:#78716c">Stop this alert</a></p>`
    );
  }

  const manageUrl = url("/alerts");
  textParts.push(`Manage all of your alerts: ${manageUrl}`, "", "You are receiving this because you saved a search on HarvestLink. Sellers on confidential listings stay anonymous in alerts.");

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:28px 20px;color:#1c1917">
<h1 style="font-size:20px;margin:0 0 6px">New listings match your saved searches</h1>
${htmlParts.join("")}
<p style="margin:28px 0 0;font-size:12px;color:#78716c">You are receiving this because you saved a search on HarvestLink. <a href="${escapeHtml(manageUrl)}" style="color:#78716c">Manage all of your alerts</a>. Sellers on confidential listings stay anonymous in alerts.</p>
</div>`;

  return {
    subject,
    text: textParts.join("\n"),
    html,
    unsubscribeUrl: first ? url(`/alerts/unsubscribe?token=${first.unsubscribeToken}`) : manageUrl,
  };
}
