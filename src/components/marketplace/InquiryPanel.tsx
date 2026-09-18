"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { startInquiry } from "@/app/(dashboard)/inquiries/actions";

interface InquiryPanelProps {
  listingId: string;
  isConfidential: boolean;
  isLoggedIn: boolean;
  viewerIsOwner: boolean;
}

/**
 * NDA-7: replaces the previous dead "Sign In to Contact Grower" link with
 * the minimum viable on-site relay -- buyers never see the seller's real
 * contact info, on NDA listings or otherwise.
 */
export function InquiryPanel({ listingId, isConfidential, isLoggedIn, viewerIsOwner }: InquiryPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (viewerIsOwner) {
    return <p className="mt-6 text-center text-sm text-stone-500">This is your listing.</p>;
  }

  if (!isLoggedIn) {
    return (
      <Button asChild className="mt-6 w-full" size="lg">
        <Link href={`/login?redirect_to=${encodeURIComponent(`/listings/${listingId}`)}`}>
          Sign In to Contact {isConfidential ? "Seller" : "Grower"}
        </Link>
      </Button>
    );
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
        Sent. The seller will reply through the site.{" "}
        <Link href="/inquiries" className="font-medium underline">
          View your inquiries
        </Link>
        .
      </div>
    );
  }

  async function handleSend() {
    setError(null);
    setSending(true);
    const result = await startInquiry(listingId, message);
    setSending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSent(true);
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-2">
      <Textarea
        placeholder={`Ask ${isConfidential ? "the seller" : "the grower"} about this lot…`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button className="w-full" size="lg" onClick={handleSend} disabled={sending || !message.trim()}>
        <Send className="size-4" /> {sending ? "Sending…" : "Send Inquiry"}
      </Button>
    </div>
  );
}
