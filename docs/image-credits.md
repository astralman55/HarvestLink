# Image credits and licenses

All photographs on the site come from **Pexels**, which licenses them for free commercial use with no attribution required ([Pexels License](https://www.pexels.com/license/)). Attribution is not required, but is logged here so every image can be traced. Retrieved **September 19, 2026**.

Each photo was vetted by eye for: no identifiable faces, no readable brand names or signage, no landmarks that contradict a US-focused marketplace, and nothing that could be mistaken for a specific seller (important for the NDA promise). Files are self-hosted in `public/images/` (never hotlinked), converted to WebP, cropped as noted, and stripped of EXIF/GPS metadata.

| File | Used for | Pexels page (photo ID) | Pexels title | Modifications |
|---|---|---|---|---|
| `hero-vineyard-rows-calistoga.webp` | Homepage hero background | [36660783](https://www.pexels.com/photo/sunlit-vineyard-in-calistoga-california-36660783/) | Sunlit Vineyard in Calistoga, California | Cropped to 16:10 (rows and hills), resized to 1600 px, dark gradient overlay in CSS |
| `grapes-cluster-on-vine.webp` | "Wine grapes" marketplace card | [39304726](https://www.pexels.com/photo/lush-vineyard-with-ripe-purple-grapes-on-vine-39304726/) | Lush Vineyard with Ripe Purple Grapes on Vine | Cropped to 4:3, resized to 1200 px |
| `bulk-wine-cellar-tanks.webp` | "Bulk wine" marketplace card | [30587077](https://www.pexels.com/photo/modern-wine-cellar-with-barrels-and-steel-tanks-30587077/) | Modern Wine Cellar with Barrels and Steel Tanks | Resized to 1200 px |
| `confidential-barrel-room.webp` | Confidential (NDA) section background | [36826094](https://www.pexels.com/photo/dimly-lit-wine-cellar-with-barrels-36826094/) | Dimly Lit Wine Cellar with Barrels | Cropped to remove the ceiling light, resized to 1920 px, dark overlay in CSS |
| `harvest-bin-grapes.webp` | "How it works" banner | [32618106](https://www.pexels.com/photo/freshly-harvested-grapes-for-portuguese-winemaking-32618106/) | Freshly Harvested Grapes for Portuguese Winemaking | Resized to 1600 px |
| `vine-canopy-grapes.webp` | Closing call-to-action background | [28438009](https://www.pexels.com/photo/lush-vineyard-grapevines-in-early-fall-light-28438009/) | Lush Vineyard Grapevines in Early Fall Light | Cropped to a wide band, resized to 1920 px, burgundy overlay in CSS |

## Notes

- Pexels lists the Calistoga photo's location as Calistoga, California, and that is the only place claimed in any alt text. The other photos' locations are unstated or non-US, so their alt text describes only what is visible. None of them names a place.
- Photographer names were not recorded (Pexels pages did not expose them in machine-readable form); the photo page linked above shows the credit.
- Not verified: the free stock sites do not verify model or property releases, and none offer legal protection if an uploader lacked rights. If you want indemnification, replace the hero (and any image you feel strongly about) with a paid-stock equivalent (Adobe Stock, Shutterstock, iStock).
- The generated social cards (`/og/...`) contain no photographs.
- Unsplash could not be used from the build environment (it blocks automated access). Its photos can be added the same way by hand.
