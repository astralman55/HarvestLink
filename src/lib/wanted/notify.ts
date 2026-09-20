import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/seo";
import { wantedTitle } from "@/lib/wanted/schema";

/**
 * Emails whichever participant did not just write, after the message is already
 * saved. Best-effort: any failure is swallowed so a notification hiccup never
 * turns into a false "couldn't send" for a message that went through.
 *
 * Names follow the same rule as the pages: a sender who chose to stay anonymous
 * is never named in the email.
 */
export async function notifyWantedMessage(responseId: string, senderId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: response } = await admin
      .from("wanted_responses")
      .select("id, request_id, responder_id, responder_anonymous")
      .eq("id", responseId)
      .single();
    if (!response) return;
    const { data: request } = await admin
      .from("wanted_requests")
      .select("user_id, is_anonymous, request_type, variety, regions, quantity_min, quantity_max, year")
      .eq("id", response.request_id)
      .single();
    if (!request) return;

    const senderIsResponder = senderId === response.responder_id;
    const recipientId = senderIsResponder ? request.user_id : response.responder_id;

    let senderLabel: string;
    if (senderIsResponder ? response.responder_anonymous : request.is_anonymous) {
      senderLabel = senderIsResponder ? "A confidential seller" : "The buyer";
    } else {
      const { data: profile } = await admin.from("profiles").select("company_name, full_name").eq("id", senderId).single();
      senderLabel = profile?.company_name || profile?.full_name || (senderIsResponder ? "A seller" : "The buyer");
    }

    const {
      data: { user: recipient },
    } = await admin.auth.admin.getUserById(recipientId);
    if (!recipient?.email) return;

    const title = wantedTitle({
      request_type: request.request_type,
      variety: request.variety,
      regions: request.regions,
      quantity_min: Number(request.quantity_min),
      quantity_max: request.quantity_max == null ? null : Number(request.quantity_max),
      year: request.year,
    });
    await sendNotificationEmail({
      to: recipient.email,
      subject: senderIsResponder ? `Someone can supply your request` : `New message about your request`,
      text: `${senderLabel} sent you a message about "${title}" on bulkwinegrapes.com.\n\nRead and reply: ${SITE_URL}/responses/${responseId}`,
    });
  } catch (error) {
    console.error("Wanted notification email failed:", error);
  }
}
