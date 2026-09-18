"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NdaBadge } from "@/components/marketplace/NdaBadge";
import { formatCurrency, formatCurrencyPrecise, formatTons, formatGallons } from "@/lib/utils";
import { serializeListing, ANONYMOUS_VIEWER } from "@/lib/serializers/listing";
import type { Listing } from "@/types";

interface NdaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A synthetic row built from the current form values -- id/user_id/created_at are placeholders, never persisted. */
  previewRow: Listing;
  onConfirm: () => void;
  submitting: boolean;
}

/**
 * NDA-10: "Preview as a buyer sees it," rendered through the real public
 * serializer (not a hand-built mock) -- serializeListing is a pure
 * function, so the exact same code path the live site uses runs here
 * against an anonymous viewer. Branches on listing_type since grapes and
 * bulk wine show different specs (tons/ton vs gal/gal, harvest year vs
 * vintage).
 */
export function NdaPreviewDialog({ open, onOpenChange, previewRow, onConfirm, submitting }: NdaPreviewDialogProps) {
  const preview = serializeListing(previewRow, null, ANONYMOUS_VIEWER);
  const isBulkWine = preview.listing_type === "bulk_wine";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Preview as a buyer sees it</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 rounded-xl border border-stone-200 p-4">
          <div className="flex items-center justify-between">
            {isBulkWine ? (
              <Badge variant="brand">{preview.bulk_wine?.is_multi_vintage ? "NV" : preview.bulk_wine?.vintage_year}</Badge>
            ) : (
              <Badge variant="brand">{preview.harvest_year} Harvest</Badge>
            )}
            <NdaBadge size="sm" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Confidential Seller</p>
            <h3 className="font-semibold text-stone-900">{preview.title}</h3>
          </div>
          <p className="text-sm text-stone-500">{preview.sub_ava ? `${preview.sub_ava}, ` : ""}{preview.region_ava}</p>
          {isBulkWine && preview.bulk_wine && (
            <p className="text-sm text-stone-500">
              Wine location: {preview.bulk_wine.wine_location_county ? `${preview.bulk_wine.wine_location_county}, ` : ""}
              {preview.bulk_wine.wine_location_state}
            </p>
          )}
          {preview.single_vineyard && (
            <p className="text-sm text-stone-500">
              Vineyard: {preview.vineyard_withheld ? "Single vineyard (name withheld)" : preview.vineyard_name}
            </p>
          )}
          <p className="text-sm text-stone-600">{preview.description}</p>
          {isBulkWine && preview.bulk_wine ? (
            <>
              <p className="text-lg font-semibold text-stone-900">
                {formatCurrencyPrecise(preview.bulk_wine.price_per_gallon)}{" "}
                <span className="text-sm font-normal text-stone-500">/ gal</span>
              </p>
              <p className="text-xs text-stone-500">
                {formatGallons(preview.bulk_wine.quantity_gallons)} available · {preview.bulk_wine.abv}% ABV
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-stone-900">
                {formatCurrency(preview.price_per_ton)} <span className="text-sm font-normal text-stone-500">/ ton</span>
              </p>
              <p className="text-xs text-stone-500">{formatTons(preview.estimated_tons)} available</p>
            </>
          )}
          <p className="text-xs text-stone-400">Ref. {preview.reference_number}</p>
        </div>

        <p className="mt-3 text-xs text-stone-500">
          This is exactly what an anonymous buyer will see. Go back to change anything, or publish as shown.
        </p>

        <div className="mt-4 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Go Back &amp; Edit
          </Button>
          <Button type="button" className="flex-1" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
