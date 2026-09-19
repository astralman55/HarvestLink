import Image from "next/image";

/**
 * The HarvestLink wordmark (grape-cluster mark + Playfair Display lettering,
 * converted to vector paths so it renders identically everywhere). Source
 * files live in /public/brand. Use `tone="light"` on dark backgrounds.
 */
export function Wordmark({ tone = "dark", className = "h-8 w-auto" }: { tone?: "dark" | "light"; className?: string }) {
  return (
    <Image
      src={tone === "light" ? "/brand/harvestlink-wordmark-light.svg" : "/brand/harvestlink-wordmark.svg"}
      alt="HarvestLink"
      width={310}
      height={52}
      unoptimized
      priority
      className={className}
    />
  );
}
