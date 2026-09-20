"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToWantedResponse } from "@/app/(dashboard)/requests/actions";

export function ThreadReplyForm({ responseId }: { responseId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setError(null);
    setSending(true);
    const result = await replyToWantedResponse(responseId, message);
    setSending(false);
    if ("error" in result && result.error) {
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
      <Button onClick={send} disabled={sending || !message.trim()}>
        <Send className="size-4" /> {sending ? "Sending…" : "Send"}
      </Button>
    </div>
  );
}
