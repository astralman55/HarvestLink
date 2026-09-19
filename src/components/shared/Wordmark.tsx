import Image from "next/image";

/**
 * The bulkwinegrapes.com wordmark. Source file: /public/brand/bwg-wordmark.png
 * (transparent background, 1200 x 155). Size it by height; the width follows.
 */
export function Wordmark({ className = "h-7 w-auto" }: { className?: string }) {
  return <Image src="/brand/bwg-wordmark.png" alt="bulkwinegrapes.com" width={1200} height={155} unoptimized priority className={className} />;
}
