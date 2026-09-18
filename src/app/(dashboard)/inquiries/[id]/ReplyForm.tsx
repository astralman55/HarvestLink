"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToInquiry } from "../actions";

export function ReplyForm({ inquiryId }: { inquiryId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    setSending(true);
    const result = await replyToInquiry(inquiryId, message);
    setSending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setMessage("");
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-2">
      <Textarea placeholder="Write a reply…" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button onClick={handleSend} disabled={sending || !message.trim()}>
        <Send className="size-4" /> {sending ? "Sending…" : "Send"}
      </Button>
    </div>
  );
}
