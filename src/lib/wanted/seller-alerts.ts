import { buildListingSlugPath } from "@/lib/utils";
import { formatQuantityRange, wantedPriceUnit, wantedTitle, type WantedType } from "@/lib/wanted/schema";

/** What the job needs to know about a request; never includes who posted it. */
export interface AlertRequest {
  id: string;
  user_id: string;
  request_type: WantedType;
  variety: string;
  regions: string[];
  quantity_min: number;
  quantity_max: number | null;
  max_price: number | null;
  show_price: boolean;
  year: number | null;
  created_at: string;
}

export interface SellerAlertDeps {
  now: Date;
  appUrl: string;
  /** Open, unexpired requests created before `cutoff` that have not been announced yet. */
  loadUnannounced(cutoffIso: string): Promise<AlertRequest[]>;
  /** Owners of available lots that match the request, excluding the poster. */
  findMatchingSellers(request: AlertRequest): Promise<string[]>;
  /** Of these members, the ones who turned these emails off. */
  loadOptOuts(userIds: string[]): Promise<Set<string>>;
  getEmail(userId: string): Promise<string | null>;
  optOutUrl(userId: string): string | null;
  sendEmail(message: { to: string; subject: string; text: string; html: string; headers: Record<string, string> }): Promise<boolean>;
  markAnnounced(requestIds: string[]): Promise<void>;
}

export interface SellerAlertResult {
  requests: number;
  emailsSent: number;
  errors: number;
}

/** A request is announced a few minutes after it is posted, so a half-saved one is never emailed. */
const SETTLE_MINUTES = 10;
/** No request fans out to more sellers than this in one go. */
export const MAX_SELLERS_PER_REQUEST = 100;
const MAX_REQUESTS_PER_EMAIL = 5;

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function requestLine(request: AlertRequest): string {
  const parts = [formatQuantityRange(request.request_type, Number(request.quantity_min), request.quantity_max == null ? null : Number(request.quantity_max))];
  if (request.show_price && request.max_price != null) parts.push(`up to $${Number(request.max_price).toLocaleString("en-US")} per ${wantedPriceUnit(request.request_type)}`);
  return parts.join(", ");
}

export function requestPath(request: AlertRequest): string {
  return `/wanted/${buildListingSlugPath(wantedTitle({ ...request, quantity_min: Number(request.quantity_min), quantity_max: request.quantity_max == null ? null : Number(request.quantity_max) }), request.id)}`;
}

export function buildSellerEmail(requests: AlertRequest[], appUrl: string, optOutUrl: string | null) {
  const url = (path: string) => `${appUrl.replace(/\/$/, "")}${path}`;
  const shown = requests.slice(0, MAX_REQUESTS_PER_EMAIL);
  const extra = requests.length - shown.length;
  const titleOf = (r: AlertRequest) => wantedTitle({ ...r, quantity_min: Number(r.quantity_min), quantity_max: r.quantity_max == null ? null : Number(r.quantity_max) });

  const subject =
    requests.length === 1
      ? `A buyer is looking for ${titleOf(requests[0]).replace(/^Wanted: /, "")}`
      : `${requests.length} buyers are looking for lots like yours`;

  const text = [
    "Someone is looking for a lot that matches one of your listings on bulkwinegrapes.com.",
    "",
    ...shown.flatMap((r) => [titleOf(r), `  ${requestLine(r)}`, `  ${url(requestPath(r))}`, ""]),
    ...(extra > 0 ? [`...and ${extra} more: ${url("/wanted")}`, ""] : []),
    "You can offer a lot or send a message from the request page. The buyer may be anonymous.",
    ...(optOutUrl ? ["", `Stop these emails: ${optOutUrl}`] : []),
  ].join("\n");

  const items = shown
    .map(
      (r) =>
        `<li style="margin:0 0 14px"><a href="${escapeHtml(url(requestPath(r)))}" style="color:#722545;font-weight:600;text-decoration:none">${escapeHtml(titleOf(r))}</a><br><span style="color:#57534e">${escapeHtml(requestLine(r))}</span></li>`
    )
    .join("");
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:28px 20px;color:#1c1917">
<h1 style="font-size:20px;margin:0 0 10px">A buyer is looking for a lot like yours</h1>
<p style="margin:0 0 16px;color:#57534e">Someone is looking for a lot that matches one of your listings on bulkwinegrapes.com.</p>
<ul style="padding-left:18px;margin:0">${items}</ul>${extra > 0 ? `<p style="margin:8px 0 0;color:#57534e">...and ${extra} more on <a href="${escapeHtml(url("/wanted"))}" style="color:#722545">the Wanted page</a>.</p>` : ""}
<p style="margin:22px 0 0;font-size:13px;color:#57534e">You can offer a lot or send a message from the request page. The buyer may be anonymous.</p>
${optOutUrl ? `<p style="margin:18px 0 0;font-size:12px;color:#78716c"><a href="${escapeHtml(optOutUrl)}" style="color:#78716c">Stop these emails</a></p>` : ""}
</div>`;

  return { subject, text, html };
}

/**
 * Announces each new request once, to the sellers whose available lots match it.
 * One email per seller per run, however many requests match. A request is marked
 * announced only after its sellers were handled, so a crash retries it next run.
 */
export async function runWantedSellerAlerts(deps: SellerAlertDeps): Promise<SellerAlertResult> {
  const result: SellerAlertResult = { requests: 0, emailsSent: 0, errors: 0 };
  const cutoff = new Date(deps.now.getTime() - SETTLE_MINUTES * 60_000).toISOString();
  const requests = await deps.loadUnannounced(cutoff);
  result.requests = requests.length;
  if (requests.length === 0) return result;

  const bySeller = new Map<string, AlertRequest[]>();
  const handled: string[] = [];
  for (const request of requests) {
    try {
      const sellers = (await deps.findMatchingSellers(request)).filter((id) => id !== request.user_id).slice(0, MAX_SELLERS_PER_REQUEST);
      for (const id of sellers) bySeller.set(id, [...(bySeller.get(id) ?? []), request]);
      handled.push(request.id);
    } catch (error) {
      result.errors++;
      console.error("Wanted matching failed:", request.id, error);
    }
  }

  const optedOut = await deps.loadOptOuts([...bySeller.keys()]);
  for (const [sellerId, matched] of bySeller) {
    if (optedOut.has(sellerId)) continue;
    try {
      const email = await deps.getEmail(sellerId);
      if (!email) continue;
      const optOutUrl = deps.optOutUrl(sellerId);
      const message = buildSellerEmail(matched, deps.appUrl, optOutUrl);
      const sent = await deps.sendEmail({
        to: email,
        ...message,
        // The header points mail apps at the one-click API endpoint; the visible link is the confirm page.
        headers: optOutUrl
          ? { "List-Unsubscribe": `<${optOutUrl.replace("/wanted/unsubscribe", "/api/wanted/unsubscribe")}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
          : {},
      });
      if (sent) result.emailsSent++;
      else result.errors++;
    } catch (error) {
      result.errors++;
      console.error("Wanted seller email failed:", sellerId, error);
    }
  }

  if (handled.length > 0) await deps.markAnnounced(handled);
  return result;
}
