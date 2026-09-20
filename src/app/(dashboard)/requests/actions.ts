"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { flags } from "@/lib/flags";
import { describeSearch, queryToFilters } from "@/lib/alerts/query";
import { WANTED_LIFETIME_DAYS, WANTED_MAX_OPEN, WantedInputSchema, checkWantedNotes, wantedSearchQueries, type WantedInput } from "@/lib/wanted/schema";
import { getThreadAccess } from "@/lib/wanted/threads";
import { notifyWantedMessage } from "@/lib/wanted/notify";

const MESSAGE_MAX = 4000;
const DAY_MS = 24 * 3600_000;

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function checkMessage(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return "Write a message before sending.";
  if (trimmed.length > MESSAGE_MAX) return `Keep it under ${MESSAGE_MAX} characters.`;
  return null;
}

/** Posts a wanted request. All writes use the service role after these checks; the public API has no access to the table. */
export async function createWantedRequest(input: WantedInput) {
  if (!flags.wanted) return { error: "Requests are not open yet." };
  const parsed = WantedInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const data = parsed.data;

  const { allowed } = await checkRateLimit("wanted-create", { limit: 5, windowMs: 10 * 60_000 });
  if (!allowed) return { error: "You are posting too quickly. Please wait a few minutes." };

  try {
    const { supabase, user } = await currentUser();
    if (!user) return { error: "Log in to post a request." };

    const { data: profile } = await supabase.from("profiles").select("username, company_name, full_name").eq("id", user.id).single();
    if (flags.usernames && !profile?.username) return { error: "Please choose a username before posting a request.", needsUsername: true };

    const guard = checkWantedNotes(data.notes, {
      anonymous: data.is_anonymous,
      companyName: profile?.company_name,
      fullName: profile?.full_name,
      username: profile?.username,
    });
    if (guard.blocked) return { error: guard.reason };

    const admin = createAdminClient();
    const { count } = await admin
      .from("wanted_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "open")
      .gt("expires_at", new Date().toISOString());
    if ((count ?? 0) >= WANTED_MAX_OPEN) return { error: `You can have up to ${WANTED_MAX_OPEN} open requests. Close one to post another.` };

    const { data: created, error } = await admin
      .from("wanted_requests")
      .insert({
        user_id: user.id,
        request_type: data.request_type,
        variety: data.variety,
        regions: data.regions,
        quantity_min: data.quantity_min,
        quantity_max: data.quantity_max,
        max_price: data.max_price,
        show_price: data.max_price != null && data.show_price,
        year: data.year,
        farming_practice: data.farming_practice,
        notes: data.notes.trim(),
        is_anonymous: data.is_anonymous,
        expires_at: new Date(Date.now() + WANTED_LIFETIME_DAYS * DAY_MS).toISOString(),
      })
      .select("id")
      .single();
    if (error || !created) return { error: "Couldn't save the request. Please try again." };

    // Optional: alert the poster when a matching lot is listed, using the saved-search emails.
    if (data.alert_me) {
      for (const query of wantedSearchQueries(data)) {
        await supabase.from("saved_searches").insert({
          user_id: user.id,
          name: describeSearch(data.request_type, queryToFilters(query)),
          listing_type: data.request_type,
          query,
        });
      }
    }

    revalidatePath("/wanted");
    revalidatePath("/requests");
    return { success: true, id: created.id as string };
  } catch {
    return { error: "Couldn't reach the server. Please try again in a moment." };
  }
}

async function ownRequest(id: string) {
  const { user } = await currentUser();
  if (!user) return { error: "Log in first." } as const;
  const admin = createAdminClient();
  const { data } = await admin.from("wanted_requests").select("id, user_id, status, created_at, expires_at").eq("id", id).maybeSingle();
  if (!data || data.user_id !== user.id) return { error: "Request not found." } as const;
  return { admin, request: data, userId: user.id } as const;
}

export async function closeWantedRequest(id: string, status: "filled" | "closed") {
  try {
    const own = await ownRequest(id);
    if ("error" in own) return own;
    await own.admin.from("wanted_requests").update({ status }).eq("id", id);
    revalidatePath("/wanted");
    revalidatePath("/requests");
    return { success: true };
  } catch {
    return { error: "Couldn't update the request." };
  }
}

/** Another 60 days, never past 120 days from the day it was first posted. */
export async function renewWantedRequest(id: string) {
  try {
    const own = await ownRequest(id);
    if ("error" in own) return own;
    if (own.request.status !== "open") return { error: "Only open requests can be renewed." };
    const cap = new Date(own.request.created_at).getTime() + 120 * DAY_MS;
    const next = Math.min(Date.now() + WANTED_LIFETIME_DAYS * DAY_MS, cap);
    if (next <= new Date(own.request.expires_at).getTime()) return { error: "This request can't be extended any further. Post a new one instead." };
    await own.admin.from("wanted_requests").update({ expires_at: new Date(next).toISOString() }).eq("id", id);
    revalidatePath("/wanted");
    revalidatePath("/requests");
    return { success: true };
  } catch {
    return { error: "Couldn't renew the request." };
  }
}

export async function deleteWantedRequest(id: string) {
  try {
    const own = await ownRequest(id);
    if ("error" in own) return own;
    await own.admin.from("wanted_requests").delete().eq("id", id);
    revalidatePath("/wanted");
    revalidatePath("/requests");
    return { success: true };
  } catch {
    return { error: "Couldn't delete the request." };
  }
}

/**
 * "I can supply this": opens (or reuses) the responder's single thread on a request
 * and posts the first message. Optionally offers one of the responder's own lots.
 * A lot listed under NDA keeps the responder confidential in the thread.
 */
export async function respondToWanted(input: { requestId: string; message: string; listingId: string | null; anonymous: boolean }) {
  if (!flags.wanted) return { error: "Requests are not open yet." };
  const invalid = checkMessage(input.message);
  if (invalid) return { error: invalid };

  const { allowed } = await checkRateLimit("wanted-respond", { limit: 10, windowMs: 60_000 });
  if (!allowed) return { error: "Too many messages sent. Please wait a moment and try again." };

  try {
    const { supabase, user } = await currentUser();
    if (!user) return { error: "Log in to respond." };
    if (flags.usernames) {
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      if (!profile?.username) return { error: "Please choose a username before responding.", needsUsername: true };
    }

    const admin = createAdminClient();
    const { data: request } = await admin
      .from("wanted_requests")
      .select("id, user_id, request_type, status, expires_at")
      .eq("id", input.requestId)
      .maybeSingle();
    if (!request || request.status !== "open" || new Date(request.expires_at) <= new Date()) return { error: "This request is no longer open." };
    if (request.user_id === user.id) return { error: "You can't respond to your own request." };

    let anonymous = input.anonymous;
    let listingId: string | null = null;
    if (input.listingId) {
      const { data: listing } = await admin
        .from("listings")
        .select("id, user_id, listing_type, status, is_nda")
        .eq("id", input.listingId)
        .maybeSingle();
      if (!listing || listing.user_id !== user.id) return { error: "Choose one of your own listings." };
      if (listing.listing_type !== request.request_type || listing.status !== "available") return { error: "That listing doesn't fit this request." };
      listingId = listing.id;
      if (listing.is_nda) anonymous = true;
    }

    const { data: existing } = await admin
      .from("wanted_responses")
      .select("id")
      .eq("request_id", request.id)
      .eq("responder_id", user.id)
      .maybeSingle();
    let responseId = existing?.id as string | undefined;
    if (!responseId) {
      const { data: created, error } = await admin
        .from("wanted_responses")
        .insert({ request_id: request.id, responder_id: user.id, listing_id: listingId, responder_anonymous: anonymous })
        .select("id")
        .single();
      if (error || !created) return { error: "Couldn't send your response. Please try again." };
      responseId = created.id as string;
    } else if (listingId) {
      await admin.from("wanted_responses").update({ listing_id: listingId }).eq("id", responseId);
    }

    const { error: messageError } = await admin.from("wanted_messages").insert({ response_id: responseId, sender_id: user.id, body: input.message.trim() });
    if (messageError) return { error: "Couldn't send your message. Please try again." };

    await notifyWantedMessage(responseId, user.id);
    revalidatePath("/requests");
    return { success: true, responseId };
  } catch {
    return { error: "Couldn't reach the server. Please try again in a moment." };
  }
}

export async function replyToWantedResponse(responseId: string, message: string) {
  const invalid = checkMessage(message);
  if (invalid) return { error: invalid };

  const { allowed } = await checkRateLimit("wanted-respond", { limit: 20, windowMs: 60_000 });
  if (!allowed) return { error: "Too many messages sent. Please wait a moment and try again." };

  try {
    const { user } = await currentUser();
    if (!user) return { error: "Log in to reply." };
    const access = await getThreadAccess(responseId, user.id);
    if (!access) return { error: "Couldn't send that. You may not be part of this conversation." };

    const { error } = await createAdminClient().from("wanted_messages").insert({ response_id: responseId, sender_id: user.id, body: message.trim() });
    if (error) return { error: "Couldn't send your message. Please try again." };

    await notifyWantedMessage(responseId, user.id);
    revalidatePath(`/responses/${responseId}`);
    return { success: true };
  } catch {
    return { error: "Couldn't reach the server. Please try again in a moment." };
  }
}
