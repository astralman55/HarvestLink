"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { respondToWanted } from "@/app/(dashboard)/requests/actions";

export interface RespondListing {
  id: string;
  label: string;
  isNda: boolean;
}

interface RespondFormProps {
  requestId: string;
  /** The responder's own available lots of the right type, already labelled for them. */
  listings: RespondListing[];
  redirectPath: string;
}

export function RespondForm({ requestId, listings, redirectPath }: RespondFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [listingId, setListingId] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = listings.find((listing) => listing.id === listingId);
  const forcedAnonymous = chosen?.isNda === true;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSending(true);
    const result = await respondToWanted({ requestId, message, listingId: listingId || null, anonymous: anonymous || forcedAnonymous });
    setSending(false);
    if ("error" in result && result.error) {
      if ("needsUsername" in result && result.needsUsername) {
        router.push(`/choose-username?redirect_to=${encodeURIComponent(redirectPath)}`);
        return;
      }
      setError(result.error);
      return;
    }
    if ("responseId" in result && result.responseId) router.push(`/responses/${result.responseId}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="message">Your message</Label>
        <Textarea
          id="message"
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What you can supply, how much, the timing, and anything the buyer should know. The buyer replies through the site."
        />
      </div>

      {listings.length > 0 && (
        <div>
          <Label htmlFor="listing">Offer one of your lots (optional)</Label>
          <Select id="listing" value={listingId} onChange={(e) => setListingId(e.target.value)}>
            <option value="">No lot attached</option>
            {listings.map((listing) => (
              <option key={listing.id} value={listing.id}>
                {listing.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      <label className="flex items-start gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 rounded border-stone-300 accent-[var(--color-brand)]"
          checked={anonymous || forcedAnonymous}
          disabled={forcedAnonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
        />
        <span>
          Respond as a confidential seller.{" "}
          {forcedAnonymous ? "Required, because that lot is listed under NDA." : "The buyer will see “Confidential Seller” instead of your company name."}
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" disabled={sending || !message.trim()}>
        <Send className="size-4" /> {sending ? "Sending…" : "Send response"}
      </Button>
    </form>
  );
}
