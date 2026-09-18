"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const COPY: Record<"on" | "off", { title: string; body: string; confirmLabel: string }> = {
  on: {
    title: "Make this listing confidential?",
    body: "Buyers may already have seen this listing's seller details. Making it confidential now hides them going forward but can't erase copies others may have saved.",
    confirmLabel: "Make Confidential",
  },
  off: {
    title: "Turn off confidentiality?",
    body: "Your name, business, and vineyard will become publicly visible on this listing. This can't be undone for anything already seen or crawled.",
    confirmLabel: "Turn Off",
  },
};

interface NdaToggleConfirmDialogProps {
  direction: "on" | "off" | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/** NDA-8: confirmation required whenever an existing listing's NDA flag changes. */
export function NdaToggleConfirmDialog({ direction, onCancel, onConfirm }: NdaToggleConfirmDialogProps) {
  if (!direction) return null;
  const copy = COPY[direction];

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-stone-600">{copy.body}</p>
        <div className="mt-4 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" onClick={onConfirm}>
            {copy.confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
