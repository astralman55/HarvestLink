import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email";
import { getListingTitlesForViewer } from "@/lib/data/owner-listings";

/**
 * Fires a "you have a new message" email to whichever inquiry participant
 * didn't just send the message. Best-effort (see sendNotificationEmail) --
 * called after the message row is already committed, so a failure here
 * never blocks the in-app relay that NDA-7 actually depends on.
 *
 * NDA-aware: if the listing is confidential and the seller is the one who
 * just messaged, the buyer's notification must not name the seller --
 * their in-app view of this exact thread already shows "Confidential
 * Seller" (Decision 18), so the email has to match that, not undo it.
 * Buyers are never anonymized, so the reverse direction never needs this.
 */
export async function notifyNewInquiryMessage(inquiryId: string, senderId: string): Promise<void> {
  // The message this notifies about is already committed by the time a
  // caller reaches this line -- every failure here (missing admin env vars
  // in local/demo mode included) must be swallowed, not just the send
  // itself, or a notification hiccup would surface as a false "couldn't
  // send" error on a message that actually went through fine.
  try {
    const admin = createAdminClient();

    const { data: inquiry } = await admin
      .from("listing_inquiries")
      .select("buyer_id, seller_id, listing_id")
      .eq("id", inquiryId)
      .single();
    if (!inquiry) return;

    const senderIsSeller = senderId === inquiry.seller_id;
    const recipientId = senderIsSeller ? inquiry.buyer_id : inquiry.seller_id;
    // The title is serialized for the RECIPIENT: the stored title of a
    // confidential lot can carry the sub-appellation the seller hid, and the
    // recipient may be the buyer.
    const listing = (await getListingTitlesForViewer([inquiry.listing_id], { userId: recipientId, isAdmin: false })).get(inquiry.listing_id);
    const listingTitle = listing?.title ?? "your listing";

    let senderLabel = "You have a new message";
    if (senderIsSeller) {
      if (listing?.isNda) {
        senderLabel = "The confidential seller";
      } else {
        const { data: sellerProfile } = await admin.from("profiles").select("company_name, full_name").eq("id", senderId).single();
        senderLabel = sellerProfile?.company_name || sellerProfile?.full_name || "The seller";
      }
    } else {
      const { data: buyerProfile } = await admin.from("profiles").select("company_name, full_name").eq("id", senderId).single();
      senderLabel = buyerProfile?.company_name || buyerProfile?.full_name || "A buyer";
    }

    const {
      data: { user: recipientUser },
    } = await admin.auth.admin.getUserById(recipientId);
    if (!recipientUser?.email) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendNotificationEmail({
      to: recipientUser.email,
      subject: `New message about "${listingTitle}"`,
      text: `${senderLabel} sent you a message about "${listingTitle}" on HarvestLink.\n\nRead and reply: ${appUrl}/inquiries/${inquiryId}`,
    });
  } catch (err) {
    console.error("Inquiry notification email failed:", err);
    // Best-effort -- see doc comment above.
  }
}
