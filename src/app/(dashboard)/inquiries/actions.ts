"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "@/lib/rate-limit";

const MESSAGE_MAX_LENGTH = 4000;

function validateMessage(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return "Enter a message before sending.";
  if (trimmed.length > MESSAGE_MAX_LENGTH) return `Keep it under ${MESSAGE_MAX_LENGTH} characters.`;
  return null;
}

/**
 * NDA-7 minimum viable relay: opens (or reuses) the buyer's single thread
 * for a listing and posts the first message. No email notification yet --
 * flagged in docs/scope-addendum-decisions.md as needing a provider
 * decision before that's built.
 */
export async function startInquiry(listingId: string, message: string) {
  const validationError = validateMessage(message);
  if (validationError) return { error: validationError };

  // Phase 7 security review (Decision 40): message-sending had no rate
  // limit at all, unlike every other write-heavy Server Action in this app
  // -- a logged-in user could otherwise flood any seller's inbox with no
  // throttle.
  const { allowed } = await checkRateLimit("inquiry-message", { limit: 20, windowMs: 60_000 });
  if (!allowed) return { error: "Too many messages sent. Please wait a moment and try again." };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in to send an inquiry." };

    const { data: listing } = await supabase.from("listings").select("user_id").eq("id", listingId).single();
    if (!listing) return { error: "Listing not found." };
    if (listing.user_id === user.id) return { error: "You can't send an inquiry on your own listing." };

    // One thread per buyer per listing (unique constraint) -- reuse it if
    // the buyer has already reached out instead of erroring.
    const { data: existing } = await supabase
      .from("listing_inquiries")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    const inquiryId =
      existing?.id ??
      (await (async () => {
        const { data: created, error } = await supabase
          .from("listing_inquiries")
          .insert({ listing_id: listingId, buyer_id: user.id })
          .select("id")
          .single();
        if (error) throw error;
        return created.id;
      })());

    const { error: messageError } = await supabase
      .from("listing_inquiry_messages")
      .insert({ inquiry_id: inquiryId, sender_id: user.id, body: message.trim() });
    if (messageError) return { error: messageError.message };

    revalidatePath("/inquiries");
    revalidatePath(`/inquiries/${inquiryId}`);
    return { success: true, inquiryId };
  } catch {
    return { error: "Couldn't reach Supabase. Connect a real project in .env.local (see README) to send inquiries." };
  }
}

export async function replyToInquiry(inquiryId: string, message: string) {
  const validationError = validateMessage(message);
  if (validationError) return { error: validationError };

  const { allowed } = await checkRateLimit("inquiry-message", { limit: 20, windowMs: 60_000 });
  if (!allowed) return { error: "Too many messages sent. Please wait a moment and try again." };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You need to be signed in to reply." };

    const { error } = await supabase
      .from("listing_inquiry_messages")
      .insert({ inquiry_id: inquiryId, sender_id: user.id, body: message.trim() });
    if (error) return { error: "Couldn't send that -- you may not be a participant in this thread." };

    revalidatePath(`/inquiries/${inquiryId}`);
    revalidatePath("/inquiries");
    return { success: true };
  } catch {
    return { error: "Couldn't reach Supabase. Please try again in a moment." };
  }
}
