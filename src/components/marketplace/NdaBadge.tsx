"use client";

import { ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const TOOLTIP_COPY = "The seller has chosen to remain anonymous. Contact them through the site.";

interface NdaBadgeProps {
  size?: "sm" | "md";
  /** false on listing cards, where the badge sits inside a <Link> and can't nest another interactive element. */
  interactive?: boolean;
}

/**
 * NDA-12: "Confidential Seller (NDA)" badge. On the detail page (not
 * nested inside a link) it's a Popover-backed tooltip -- not a hover-only
 * CSS tooltip -- so it works identically on touch and keyboard per Section
 * 7.4. On cards it renders as a plain labeled badge with a native `title`,
 * since it sits inside the card's own <Link> and can't host a nested
 * interactive trigger.
 */
export function NdaBadge({ size = "md", interactive = true }: NdaBadgeProps) {
  const label = size === "sm" ? "NDA" : "Confidential Seller (NDA)";

  if (!interactive) {
    return (
      <Badge
        variant="outline"
        title={TOOLTIP_COPY}
        className={`gap-1 border-amber-300 bg-amber-50 text-amber-800 ${size === "sm" ? "px-2 py-0.5" : ""}`}
      >
        <ShieldQuestion className="size-3" />
        {label}
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/40"
          aria-label={`${label} — more information`}
        >
          <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-800">
            <ShieldQuestion className="size-3" />
            {label}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent>{TOOLTIP_COPY}</PopoverContent>
    </Popover>
  );
}
