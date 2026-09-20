import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { flags } from "@/lib/flags";

interface PostRequestPromptProps {
  type: "grapes" | "bulk_wine";
  variety?: string;
  region?: string;
  year?: string;
  /** Sentence shown above the button. */
  text?: string;
}

/** "Can't find it? Post what you're looking for", prefilled from the filters the visitor had set. Renders nothing while the feature is off. */
export function PostRequestPrompt({ type, variety, region, year, text = "Can't find it? Tell sellers what you're looking for." }: PostRequestPromptProps) {
  if (!flags.wanted) return null;
  const params = new URLSearchParams({ type });
  if (variety) params.set("variety", variety);
  if (region) params.set("region", region);
  if (year) params.set("year", year);
  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <p className="text-sm text-stone-600">{text}</p>
      <Button asChild variant="outline">
        <Link href={`/wanted/new?${params}`}>
          <Megaphone /> Post a request
        </Link>
      </Button>
    </div>
  );
}
