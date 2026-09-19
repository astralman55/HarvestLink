# SEO & AI-Search (GEO) Implementation Spec: HarvestLink

**Site:** https://bulkwinegrapes.com (brand name: **HarvestLink**)
**Stack (per repo README, verify):** Next.js 15 App Router, Supabase, Tailwind, Vercel, Resend
**Audience:** AI coding agent + the human reviewing its work
**Written:** September 19, 2026
**Companion file:** `BLOG_CONTENT_PLAN_15_POSTS.md` (the 15 blog briefs). This file covers everything else: metadata, homepage copy, technical SEO, structured data, AI-search optimization, and stock photography.

---

## 0. How to Use This Document

1. **Read both files fully before coding.** Do Section 3 (fix list) and Section 9 (QA) alongside the build, not after.
2. **Requirement IDs** (`SEO-1`, `HOME-2`, `GEO-3`, `IMG-4`, etc.) exist so the project owner can reference items. Keep them in commit messages.
3. **MUST / SHOULD / MAY** carry their usual meaning.
4. **Re-verify my audit.** I reviewed the live homepage and `/bulk-wine` on Sept 19, 2026 (Section 1). Confirm each finding in the codebase before changing it.
5. **Never invent facts.** Where this document needs information only the owner has (fees, verification process, founder bio, customer counts, contact email), write `{{CONFIRM: …}}` in the copy and list every placeholder in `docs/seo-open-items.md`. Do not ship a page with an unresolved `{{CONFIRM}}` visible to the public.
6. **The NDA rules from the scope addendum still govern everything.** Any new public surface (blog embeds, landing pages, JSON-LD, sitemap, RSS, OG images) MUST use the central public serializer and MUST be added to the NDA canary test. SEO is never a reason to expose a confidential seller.
7. **Stack-adapt.** Code samples are conceptual. Follow existing conventions. No new dependencies without written justification.

---

## 1. Situation Summary (What the Live Site Looks Like Today)

### 1.1 Findings from the live site

| # | Finding | Why it matters | Priority |
|---|---|---|---|
| F1 | `/` and `/bulk-wine` have the **identical `<title>`** ("HarvestLink — Wine Grape Marketplace") and identical meta description. | Duplicate metadata; the bulk wine page can't rank for bulk wine queries. | **P0** |
| F2 | The title and description are grape-centric. "Bulk wine" is absent from the title. | Half the business is invisible in search results. | **P0** |
| F3 | The header "Bulk Wine" link goes to `/?market=bulk-wine`, while other links go to `/bulk-wine`. | Two URLs for one concept; splits link equity, creates duplicate content. | **P0** |
| F4 | The homepage H1 is grapes-only ("Source exceptional wine grapes, direct from growers."). Bulk wine is a secondary button. | Homepage doesn't communicate the two-marketplace model to users, Google, or AI systems. | **P0** |
| F5 | `/bulk-wine` currently renders "0 lots matching your search" and only filter UI. No explanatory text. | Thin/empty page risks a soft-404 classification. | **P0** |
| F6 | No blog, About, How It Works, FAQ, or Contact page is linked anywhere. | No topical authority, no entity/trust signals (E-E-A-T), nothing for AI systems to cite. | **P0** |
| F7 | "Browse by Region" and footer links use query strings (`?region_ava=…`, `?farming_practice=…`). | Faceted URLs aren't clean landing pages; they need canonical/indexing rules. | P1 |
| F8 | The footer link "Napa Valley Listings" uses `region_ava=Napa+Valley`, but the region filter values are county names ("Napa County"). | May return zero results (possible bug). Verify. | P1 |
| F9 | Footer tagline and meta description only describe "grape lots and multi-year forward contracts." | Bulk wine missing from brand description. | P1 |
| F10 | The homepage ships very long option lists (all counties, ~100 varieties) early in the HTML. | Can push meaningful content down and hurt performance. | P1 |
| F11 | Only one featured lot is visible; inventory is thin. | Listing pages can't carry SEO yet. Content and hub pages must. | Context |
| F12 | Existing copy makes claims that need substantiation: "Verified Growers," "Every listing traces back to a real vineyard operation," "the world's best wineries and winemakers." | Accuracy/legal risk; also erodes trust. See Section 2.4. | P1 |
| F13 | The brand name "HarvestLink" is not in the domain (`bulkwinegrapes.com`), and other sites use similar names (for example, another site titled "HarvestLink | Global Agricultural Marketplace"). | Brand-name searches will be crowded; needs disambiguation. See Section 2.3. | P1 |

### 1.2 Strategy in six lines

1. **Two marketplaces = two keyword universes.** Grape buyers think in tons and price per ton. Bulk wine buyers think in gallons, vintage, ABV, and price per gallon. Each gets its own landing pages and content.
2. **Inventory is thin, so content carries SEO for now.** Blog posts, guides, and hub pages earn rankings first; listing pages earn later.
3. **Win AI answers by being the clearest citable source on a narrow set of questions** (what bulk wine is, price per gallon, gallons per ton, who can legally buy, confidential selling).
4. **NDA listings are the differentiator.** Own the topic "selling bulk wine confidentially."
5. **Never compromise NDA.** Every SEO surface is redacted through the same serializer.
6. **Measure from day one** (Search Console, Bing Webmaster Tools, GA4, AI-referral tracking).

### 1.3 Honest expectations (put this in the owner report)

- This is a new, low-authority domain in a niche with established competitors (broker sites, trade-press classifieds, regional grower-association marketplaces). Meaningful organic traction typically takes months, not weeks.
- The keyword demand labels in the blog plan are **estimates**, not measured volumes (no keyword-tool access was available). Validate them (Section 9) and re-rank.
- The highest-volume terms in this niche skew informational and consumer-ish ("how many grapes in a bottle of wine"). The most *valuable* terms ("bulk wine for sale") have lower volume and much higher buyer intent. The plan deliberately mixes both.

---

## 2. Brand, Entity & Claims

### 2.1 Canonical description (use consistently, everywhere)

AI systems and search engines learn what a site *is* from repeated, consistent phrasing. Use these exact strings; do not paraphrase them on each page.

- **One sentence:** *HarvestLink is an online marketplace where wine grape growers, wineries, and wine brands buy and sell wine grapes and bulk wine directly, including confidential listings under NDA.*
- **50-word version:** *HarvestLink is an online marketplace for the wine trade. Growers and wineries list wine grapes by the ton and bulk wine by the gallon. Buyers filter by variety, vintage, region, farming practice, price, and more, then contact sellers through the site. Sellers can list openly or confidentially under NDA.*
- **100-word version:** the 50-word version plus: *Grape listings include harvest year, brix target, trellis, soil, exposure, and slope. Bulk wine listings include vintage, ABV, total sulfites (ppm), wine location, and farming practices such as organic, biodynamic, natural, sustainable, regenerative organic, and Demeter certified biodynamic. HarvestLink does not sell wine itself and is not a party to transactions. {{CONFIRM: fee model, payment/shipping handling, verification process}}.*

Use the one-sentence version in: homepage intro, About page, footer, Organization JSON-LD `description`, blog "About HarvestLink" boilerplate, and social bios.

### 2.2 Name usage rules
- Always **HarvestLink** (one word, capital H and L). Never "Harvest Link" or "Harvestlink."
- On first mention per page, pair the brand with its descriptor: "HarvestLink, the wine grape and bulk wine marketplace."
- Organization JSON-LD: `name: "HarvestLink"`, `alternateName: ["Bulk Wine Grapes", "bulkwinegrapes.com"]`, `url: "https://bulkwinegrapes.com"`.
- The domain contains "bulk wine grapes." That's a genuine keyword asset. Use the phrase naturally in copy (e.g., About page) without stuffing.

### 2.3 Brand disambiguation & trademark note
- "HarvestLink" is a common-sounding name; other sites and projects use the same or similar names. Searching for the brand alone may return unrelated results.
- The agent SHOULD pair the brand with descriptors in titles and headings (already done in Section 4).
- **Owner task (not for the agent):** run a trademark clearance search for "HarvestLink" (and consider whether a more distinctive brand or matching domain is worth it) before investing heavily in brand-name SEO.

### 2.4 Claims & compliance guardrails (MUST follow in all copy)

| Topic | Rule |
|---|---|
| **"Verified" claims** | Do not use "verified growers/sellers/listings" unless HarvestLink actually verifies them. If not verified, use "Direct from the source" or similar. Owner must confirm what verification exists. |
| **"World's best" / "top winemakers"** | Puffery is tolerable in a headline, but the body must not imply named or verified elite producers. Only assert "acclaimed/top-tier producers list on HarvestLink" if the owner confirms it's true. Otherwise say "established producers" or describe the *practice* ("wineries sometimes sell surplus or declassified lots in bulk"). |
| **"Fraction of the cost"** | Say bulk wine *can* cost a fraction of the finished bottle price, explain why (no glass, labels, marketing, distribution margins), and state the tradeoffs (bottling, compliance, freight, sampling). Never guarantee savings. |
| **Prices & statistics** | Every number needs a dated, linked source (see blog plan). Never fabricate or "round to something plausible." Historical figures must be labeled with their year. |
| **Named producers, AVAs, and brands** | Don't use producer or brand names as selling points without permission. AVA/region names are fine as geographic descriptors. |
| **Buyer eligibility & legality** | Bulk wine is a trade product. State plainly that buyers should confirm permit and licensing requirements (TTB and state). No legal advice. Don't imply consumers can buy tank lots for personal use. |
| **Health claims** | None. Don't claim organic/biodynamic wine is healthier. Sulfite content is described factually. |
| **Certifications** | Farming-practice labels are seller-declared unless HarvestLink verifies them. Keep the on-site disclaimer. |
| **Testimonials/customer counts** | None unless real and provided by the owner. |
| **Alcohol marketing** | Keep imagery and tone trade-focused (no party/toasting lifestyle imagery, nothing aimed at minors). |

---

## 3. Site Fixes & New Pages

### SEO-1: Unique metadata on every route (P0)
Implement metadata via the Next.js Metadata API (`generateMetadata` for dynamic routes). Set `metadataBase` to `https://bulkwinegrapes.com`. Use the strings in Section 4. Add a **build-time lint** that fails the build if any indexable page has a missing/duplicate `<title>`, a title > 60 characters, or a description > 155 characters.

### SEO-2: One URL per concept (P0)
- Header and footer "Bulk Wine" links MUST point to `/bulk-wine`; "Grapes" to `/grapes`.
- `/?market=bulk-wine` (and any similar toggle param): 301-redirect to `/bulk-wine` if it's only a legacy entry point. If it's a UI toggle on the homepage, keep it client-side and set `<link rel="canonical" href="https://bulkwinegrapes.com/">` so it never competes with `/bulk-wine`.
- Force a single host: non-www canonical (`www` → apex is already in place per README; verify 301 not 302).

### SEO-3: Homepage rewrite (P0)
Implement the copy and structure in Section 5. The homepage must clearly present **both** marketplaces above the fold and put a real `<h1>` and intro text before the long filter lists. Move the advanced search below the hero or into a collapsed panel that doesn't inflate initial HTML unnecessarily.

### SEO-4: New indexable pages (P0)
Create, link from header/footer, and include in the sitemap:

| Route | Purpose |
|---|---|
| `/about` | Entity page: who runs HarvestLink, what it is, why it exists. `{{CONFIRM: founder/team names & bios}}` (no fabricated people). |
| `/how-it-works` | Step-by-step for buyers and sellers, including NDA listings. |
| `/faq` | 12 to 15 questions (start with the FAQ in Section 5.9). Visible text, one Q per heading. |
| `/contact` | Real contact method `{{CONFIRM: email/form}}`. |
| `/blog` and `/blog/[slug]` | Blog index and posts (SEO-14). |
| `/credits` (optional) | Photo credits page (Section 8). |

### SEO-5: Clean landing pages (P1)
Create static, indexable hub pages so region/variety searches land on clean URLs instead of query strings. **Use distinct paths so they can't collide with listing slugs** (listings live at `/grapes/{slug}-{id}` and `/bulk-wine/{slug}-{id}`):

| Pattern | Examples |
|---|---|
| `/grapes/regions/{region-slug}` | `/grapes/regions/napa-county` |
| `/grapes/varieties/{variety-slug}` | `/grapes/varieties/cabernet-sauvignon` |
| `/grapes/farming/{practice-slug}` | `/grapes/farming/organic`, `/grapes/farming/biodynamic` |
| `/bulk-wine/regions/{region-slug}` | `/bulk-wine/regions/sonoma-county` |
| `/bulk-wine/varieties/{variety-slug}` | `/bulk-wine/varieties/chardonnay` |
| `/bulk-wine/farming/{practice-slug}` | `/bulk-wine/farming/regenerative-organic` |

**Rules (to avoid thin/duplicate content):**
- **Launch cap: 20 landing pages** total (top regions and varieties first). Expand only when inventory supports it.
- Each page needs **unique intro copy of at least 150 words** written for that region/variety/practice (what it is known for, what buyers should consider). No template-swapped boilerplate. The agent drafts; owner reviews.
- Show live listings via the public serializer. Show computed stats (listing count, price range) **only when at least 3 real listings exist**; otherwise omit. Never fabricate.
- **Indexing:** `index,follow` only if the page has substantial intro copy **and** at least 1 listing (or a clear "alert me" CTA plus strong content). Otherwise `noindex,follow`, and exclude from the sitemap.
- Title/H1/description templates in Section 4.4. Add `ItemList` JSON-LD when listings exist.
- Update header/footer/homepage region links to use these clean URLs. Fix the Napa mismatch from F8 while doing so.

### SEO-6: Empty and near-empty states (P0)
- `/bulk-wine` and `/grapes` MUST contain, in addition to the filter UI and results: an H1, a 100-200 word intro, a short "How pricing works" block (per gallon / per ton), links to 3 relevant guides, and an FAQ (3 to 4 questions).
- When there are **0 results**, show a helpful empty state ("No lots match yet. Set an alert / list your own / read the buying guide") and **do not** show a bare "0 lots" as the only content. Keep the page indexable if it has the editorial content above.
- Filtered/parameterized URLs with **0 results** MUST return `noindex,follow`.

### SEO-7: Faceted navigation and parameters (P1)
- Filter/sort/pagination query strings: `<link rel="canonical">` to the clean base URL (or the matching landing page); `noindex,follow` on filtered combinations that aren't whitelisted landing pages.
- Paginated pages (`?page=2`) self-canonical and are indexable only if content is unique per page; otherwise `noindex,follow`.
- Do not use `robots.txt` to block these (crawlers must see the canonical/noindex signals).

### SEO-8: robots.txt and noindex (P0)
- The repo README says a first `robots.txt` and sitemap already exist. **Audit and extend them; don't replace them blindly.**
- `robots.txt` (`app/robots.ts`): allow all public content; disallow private/app routes: `/api/`, `/admin`, `/dashboard`, `/inquiries`, `/planning`, `/login`, `/register`, `/sell/*/edit` (adapt to actual routes); declare the sitemap URL.
- Add `noindex` (metadata `robots`) on auth pages, dashboard, inquiry pages, and any thank-you/confirmation screens.
- **Preview deployments and non-production hosts MUST send `X-Robots-Tag: noindex`** so Vercel preview URLs never get indexed.
- Verify Vercel bot protection / firewall isn't blocking legitimate crawlers (Googlebot, Bingbot, and the AI search bots in Section 7).

### SEO-9: Sitemap (P0)
`app/sitemap.ts` MUST include: static pages, blog posts (published only), whitelisted landing pages, and active listings (NDA listings included with anonymized URLs only). Use accurate `lastModified` (real update times, not build time). Split into a sitemap index if it grows past 50,000 URLs. Exclude: noindex pages, drafts, sold/expired listings older than 30 days. Submit to Google Search Console and Bing Webmaster Tools.

### SEO-10: Listing-page SEO and lifecycle (P1)
- Metadata patterns in Section 4.3. **NDA listings: no seller, vineyard, or precise-location data in title, description, OG, JSON-LD, alt text, or image filenames. Use a generated text-only OG image, not the seller's photos** (photos can contain identifying signage).
- Sold/expired listings: keep the page live for 30 days with a "No longer available" banner and similar-lot links (`availability: SoldOut` in JSON-LD), then `noindex` (or 410 if removed).
- Every listing page needs an H1, key specs in a semantic list/table, breadcrumbs (`Home › Bulk Wine › {Varietal}`), and "similar lots" links (NDA-safe).

### SEO-11: Performance & Core Web Vitals (P1)
Targets (mobile, field or lab): **LCP < 2.5 s, INP < 200 ms, CLS < 0.1**, Lighthouse ≥ 90 on Performance, SEO, Accessibility, Best Practices for `/`, `/grapes`, `/bulk-wine`, a listing page, and a blog post.
- Use `next/image` (AVIF/WebP, correct `sizes`, `priority` only on the hero), `next/font` with `display: swap`, static generation/ISR for blog and landing pages, code-split heavy filter components, lazy-load below-the-fold widgets, reserve space for images to prevent CLS.
- The long county/variety option lists SHOULD be rendered lazily (on interaction) or moved out of the initial critical HTML.

### SEO-12: Structured data (P1)
See Section 6.

### SEO-13: Internal linking (P1)
- Hub-and-spoke: each blog post links to at least **3 related posts**, **1 relevant marketplace page** (`/grapes`, `/bulk-wine`, or a landing page), and the `/sell` CTA where relevant.
- Homepage links to: both marketplaces, `/how-it-works`, the 3 most important posts.
- Footer links to About, How It Works, FAQ, Blog, Contact, Terms, Privacy, and both marketplaces.
- Use descriptive anchor text (e.g., "how bulk wine is priced per gallon"), never "click here."
- Add "Related lots" modules inside relevant posts, pulling live (NDA-safe) listings by variety/region when available.

### SEO-14: Blog implementation (P0)
- **Content format:** MDX or Markdown files in `content/blog/` with front matter (schema below), rendered statically. Keep content in the repo so it's versioned and reviewable.
- **Front matter:** `title`, `slug`, `description`, `primaryKeyword`, `secondaryKeywords[]`, `datePublished`, `dateModified`, `author`, `reviewedBy` (optional), `heroImage`, `heroAlt`, `readingTime` (computed), `status` (`draft | needs-review | published`), `faq[]` (question/answer pairs), `sources[]` (title, url, dateAccessed).
- **Components:** answer box ("Quick answer"), auto table of contents, styled tables, callouts ("Not legal advice"), FAQ accordion (content in HTML by default, not JS-only), author box, related posts, inline CTA, "Last updated" date.
- **Behaviors:** RSS feed at `/blog/rss.xml`; tag/category pages only if they carry unique content (otherwise `noindex`); breadcrumbs; canonical URLs; `Article` JSON-LD.
- **Publishing gate (important):** the agent ships all posts as `status: needs-review`. Posts with that status are **excluded from the sitemap, index page, and RSS and served with `noindex`** until the owner flips them to `published`. Produce `docs/blog-fact-check-log.md` (one section per post listing every statistic/claim and its source URL) so the owner can review quickly.

### SEO-15: Analytics & search tooling (P0)
- Verify the domain in **Google Search Console** (domain property) and **Bing Webmaster Tools**; submit the sitemap to both. Enable **IndexNow** (Bing and others) so new posts are pinged on publish.
- GA4 (or the owner's existing analytics) with events: `signup`, `listing_view` (with `listing_type`, `is_nda`, never seller identity), `inquiry_submit`, `sell_start`, `listing_publish`, `blog_cta_click`, `alert_signup`, `search_filter_use`.
- Create a channel/segment for **AI referrals**: referrers such as `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`.
- Document all of this in `docs/seo-measurement.md`.

---

## 4. Metadata Spec

**Global rules:** title ≤ 60 characters; description ≤ 155 characters; append ` | HarvestLink` to titles only when the result stays ≤ 60 characters. One `<h1>` per page. Every page gets canonical, `og:title`, `og:description`, `og:image` (1200×630), `og:type`, `twitter:card=summary_large_image`. `og:site_name = HarvestLink`. Default `og:image`: generated branded card (Next.js `opengraph-image`), never a stock photo with text baked in.

### 4.1 Core pages

| Page | Title | Meta description | H1 |
|---|---|---|---|
| Home `/` | `Wine Grapes & Bulk Wine Marketplace \| HarvestLink` | `Buy and sell wine grapes and bulk wine direct. Search by variety, region, vintage and price per ton or gallon. Confidential NDA listings available.` | Buy and sell wine grapes and bulk wine, direct. |
| Grapes `/grapes` | `Wine Grapes for Sale by the Ton \| HarvestLink` | `Browse wine grape lots for sale direct from growers. Filter by variety, region, harvest year, farming practice, tonnage and price per ton.` | Wine Grapes for Sale |
| Bulk wine `/bulk-wine` | `Bulk Wine for Sale by the Gallon \| HarvestLink` | `Find bulk wine for sale, priced per gallon. Filter by varietal, vintage, ABV, region and farming practice. Confidential (NDA) lots available.` | Bulk Wine for Sale |
| Sell `/sell` | `Sell Wine Grapes & Bulk Wine \| HarvestLink` | `List your wine grapes or bulk wine for buyers across the country. Sell openly or confidentially under NDA and receive inquiries through the site.` | Sell Wine Grapes or Bulk Wine |
| About `/about` | `About HarvestLink \| Wine Grape & Bulk Wine Marketplace` | `HarvestLink is an online marketplace where growers, wineries and wine brands buy and sell wine grapes and bulk wine directly.` | About HarvestLink |
| How it works `/how-it-works` | `How HarvestLink Works \| Buy & Sell Grapes and Bulk Wine` | `See how to search lots, contact sellers, and list your own wine grapes or bulk wine, including how confidential NDA listings work.` | How HarvestLink Works |
| FAQ `/faq` | `HarvestLink FAQ \| Bulk Wine & Wine Grape Questions` | `Answers about bulk wine, wine grape pricing, NDA listings, and how to buy or sell on HarvestLink.` | Frequently Asked Questions |
| Blog `/blog` | `Wine Grape & Bulk Wine Buying Guides \| HarvestLink Blog` | `Guides on buying and selling wine grapes and bulk wine: pricing, contracts, compliance, farming practices, and market updates.` | The HarvestLink Blog |
| Contact `/contact` | `Contact HarvestLink` | `Questions about buying or selling wine grapes or bulk wine? Get in touch with the HarvestLink team.` | Contact HarvestLink |

The agent MUST verify lengths programmatically (SEO-1 lint); adjust wording, not the limits.

### 4.2 Noindex pages
`/login`, `/register`, `/dashboard`, `/inquiries`, `/planning`, `/admin`, confirmation/thank-you pages, and any filtered/sorted URL that isn't a whitelisted landing page.

### 4.3 Listing pages (dynamic)

Built only from allowlisted fields returned by the **public serializer**.

| Listing type | Title pattern | Description pattern |
|---|---|---|
| Grapes | `{Variety} Grapes, {County}, {ST} · {Harvest Year}` | `{qty} tons of {variety} grapes from {region}, {harvest year} harvest. {Farming practice}. ${price}/ton. Contact the seller through HarvestLink.` |
| Bulk wine | `{Vintage} {Varietal} Bulk Wine · {qty} gal at ${price}/gal` | `{qty} gallons of {vintage} {varietal} bulk wine, {abv}% ABV, {wine location}. ${price}/gal. {Farming practices}. Contact the seller through HarvestLink.` |
| **NDA (either)** | Same patterns. **No seller, business, vineyard, or precise location.** Region shown only at the precision the seller chose. Optionally add "Confidential Seller (NDA)". | Same. No seller/vineyard info. |

Truncate gracefully to the length limits. Omit optional fields cleanly (no "undefined", no dangling punctuation).

### 4.4 Landing-page templates (SEO-5)

| Type | Title | H1 | Description |
|---|---|---|---|
| Grapes by variety | `{Variety} Grapes for Sale by the Ton` (+ brand if it fits) | `{Variety} Grapes for Sale` | `Browse {variety} wine grape lots for sale. Compare harvest year, region, farming practice and price per ton, direct from growers.` |
| Grapes by region | `{Region} Wine Grapes for Sale` | `Wine Grapes for Sale in {Region}` | `Find wine grapes from {region}. Compare varieties, harvest years, farming practices and price per ton.` |
| Bulk wine by varietal | `{Varietal} Bulk Wine for Sale by the Gallon` | `{Varietal} Bulk Wine for Sale` | `Browse {varietal} bulk wine priced per gallon. Compare vintage, ABV, region, sulfites and farming practice.` |
| Bulk wine by region | `{Region} Bulk Wine for Sale` | `Bulk Wine for Sale in {Region}` | `Find bulk wine located in {region}. Compare varietals, vintages, ABV and price per gallon.` |
| By farming practice | `{Practice} Wine Grapes for Sale` / `{Practice} Bulk Wine for Sale` | Same | `Browse {practice} {grapes/bulk wine} listings. Practices are seller-declared; request documentation.` |

### 4.5 Blog posts
Per-post titles, descriptions, and slugs are in `BLOG_CONTENT_PLAN_15_POSTS.md`.

---

## 5. Homepage Copy & Structure

Replace the current homepage content with the sections below. Keep the existing "Advanced Search" (moved below the hero or collapsible) and existing Featured Lots functionality. Write in plain, confident, trade-practical language. Copy in `{{CONFIRM}}` form must be resolved by the owner.

### 5.1 Hero (HOME-1)
- **Eyebrow:** Wine Grape & Bulk Wine Marketplace
- **H1:** Buy and sell wine grapes and bulk wine, direct.
- **Subhead:** HarvestLink connects growers, wineries, and wine brands. Browse grape lots by the ton, bulk wine by the gallon, and confidential lots from established producers, then reach the seller through the site.
- **Buttons:** `Browse Grapes` (→ `/grapes`) · `Browse Bulk Wine` (→ `/bulk-wine`) · `Sell on HarvestLink` (→ `/sell`, secondary style)
- **Microcopy under buttons:** Filter by variety, region, vintage, farming practice, and price per ton or gallon.
- **Image:** see IMG-1 (wide vineyard photo with a dark left-to-right overlay for text contrast).

### 5.2 Two marketplaces (HOME-2)
**H2:** Two marketplaces. One place to source.

**Card A: Wine Grapes**
> **Wine grapes, priced per ton.**
> Find grape lots direct from growers. Search by variety, harvest year, brix target, farming practice, trellis, soil, exposure, and slope.
> [Browse grapes →]

**Card B: Bulk Wine**
> **Bulk wine, priced per gallon.**
> Find tank and barrel lots from wineries. Compare varietal, vintage, ABV, total sulfites (ppm), wine location, and farming practice. Every listing shows price per gallon and total lot value.
> [Browse bulk wine →]

Each card uses a different image (IMG-2, IMG-3).

### 5.3 Quick search (HOME-3)
A two-tab quick search (Grapes | Bulk Wine) with 3 to 4 fields each (variety/varietal, region, vintage/harvest year, max price). "More filters" opens the existing advanced search. Popular shortcuts (clean landing-page links): Organic Cabernet · Napa County · Biodynamic Pinot Noir · Chardonnay Bulk Wine.

### 5.4 Confidential (NDA) lots (HOME-4)
**H2:** Some of the best lots are never advertised.

> Established wineries and growers often need to move fruit or wine without attaching their name to it. On HarvestLink, sellers can list **under NDA**: their name, winery, and vineyard stay hidden, and location is shown only at region level. You still see what matters: variety or varietal, vintage, quantity, price, ABV, and farming practice.
>
> Reach out through HarvestLink, and the seller decides what to share and when.
> [See confidential lots →] (`/bulk-wine` and `/grapes` with NDA filter on)

*Owner note:* the previous headline ("Confidential lots from the world's best wineries and winemakers") is not to be reused unless the owner can substantiate it (Section 2.4).

Image: IMG-4 (atmospheric barrel room, no people).

### 5.5 Why HarvestLink (HOME-5)
**H2:** Built for how the wine trade actually buys.

| Card | Copy |
|---|---|
| **Transparent pricing** | Grapes are priced per ton and bulk wine per gallon. We calculate total lot value from quantity, so you can compare lots quickly. |
| **Vineyard- and wine-level detail** | Filter by trellis, soil, exposure, slope, and brix for grapes; ABV, vintage, total sulfites, and farming practice for bulk wine. |
| **Confidential selling** | List under NDA to keep your name, winery, and vineyard private. |
| **Direct contact** | Send an inquiry to the seller through the site. No brokerage layer. `{{CONFIRM: accurate as long as HarvestLink takes no commission role}}` |
| **Alerts & planning** | Get alerts when new lots match your spec, and plan future blocks with forward-contract tools. |

(Drop "Verified Growers" unless the owner confirms a verification process. See F12.)

### 5.6 Featured lots (HOME-6)
Two rows: **Featured Grape Lots** and **Featured Bulk Wine Lots**, each with a "Browse all" link. If bulk wine has no listings, hide that row entirely rather than showing an empty state on the homepage.

### 5.7 Browse by region and variety (HOME-7)
**H2:** Browse by region · **H2:** Browse by variety. Chip links to the clean landing pages from SEO-5 (limit 8 to 10 each; only link to pages that exist and are indexable).

### 5.8 How it works (HOME-8)
**H2:** How HarvestLink works. Tabs: *For Buyers* / *For Sellers*.

- **Buyers:** 1) **Search by spec.** Filter by variety, region, vintage, farming practice, price, and more. 2) **Compare lots.** Review quantity, price per ton or gallon, and detailed specs side by side. 3) **Contact the seller.** Send an inquiry through HarvestLink and take it from there.
- **Sellers:** 1) **Create a listing** for grapes or bulk wine. 2) **Choose how you're seen.** List openly, or confidentially under NDA. 3) **Get inquiries** through the site and decide what to share.
- Link: "Full details on How It Works →" (`/how-it-works`).

### 5.9 FAQ (HOME-9)
**H2:** Frequently asked questions. Render as visible text (accordion is fine if content is in the HTML). These same Q&As also appear on `/faq`.

1. **What is HarvestLink?** HarvestLink is an online marketplace where wine grape growers, wineries, and wine brands buy and sell wine grapes by the ton and bulk wine by the gallon, directly with each other. Sellers can list openly or confidentially under NDA.
2. **What is bulk wine?** Bulk wine is wine sold by volume, typically in gallons, before it is bottled. It is usually stored in tanks or barrels and sold to other wineries and brands for blending, bottling under their own label, or further aging.
3. **How is bulk wine priced?** Per gallon. Each HarvestLink bulk wine listing shows the price per gallon and the total lot value calculated from the quantity. Price depends on varietal, vintage, appellation, quality, farming practice, and market conditions.
4. **What does "selling under NDA" mean?** The seller's name, winery, vineyard, and contact details are hidden on the listing, and location is shown only at a general level. You contact the seller through HarvestLink, and the seller decides whether and when to reveal who they are.
5. **Who can buy bulk wine?** Bulk wine is generally a trade transaction. In the U.S., it typically moves between licensed, bonded wine businesses under federal (TTB) and state rules. Confirm the permits and requirements that apply to you before buying. HarvestLink does not provide legal advice.
6. **How do I contact a seller?** Use the inquiry button on any listing. Your message is delivered to the seller through HarvestLink, and replies come back through the site. `{{CONFIRM: exact reply flow}}`

### 5.10 From the blog (HOME-10)
Three cards (latest or featured): *What Is HarvestLink?*, *Did You Know You Can Buy Bulk Wine From the World's Best Winemakers…*, *The 2026 Wine Grape Glut…* (only once those posts are `published`).

### 5.11 Closing CTA band (HOME-11)
> **Ready to buy or sell?** Browse lots or list yours in minutes.
> [Browse Grapes] [Browse Bulk Wine] [Sell on HarvestLink]

### 5.12 Footer (HOME-12)
Tagline: *HarvestLink is the marketplace where wine grape growers, wineries, and wine brands buy and sell wine grapes and bulk wine directly.* Columns: **Marketplace** (Browse Grapes, Browse Bulk Wine, Sell, Crop Planning), **Learn** (How It Works, Blog, FAQ, and links to 3 top posts), **Company** (About, Contact, Log in, Create account), **Legal** (Terms, Privacy). Add: "© {year} HarvestLink." Remove "Built for growers and buyers who plan ahead" if it no longer fits.

**Semantic HTML requirements for the homepage:** one `<h1>`; `<h2>` per section; real `<a>` links (not JS-only handlers); all meaningful text server-rendered; images with alt text (Section 8.5).

---

## 6. Structured Data (JSON-LD)

Render JSON-LD server-side (`<script type="application/ld+json">`). Validate every template with the Schema.org validator and Google's Rich Results Test. **No NDA-sensitive fields, ever** (seller, vineyard name, precise location, seller photos).

### 6.1 Sitewide
- **Organization** (in root layout or homepage): `name`, `alternateName`, `url`, `logo` (`{{CONFIRM: logo file}}`), `description` (one-sentence canonical), `sameAs` (LinkedIn/other real profiles `{{CONFIRM}}`; omit if none), `contactPoint` if a public contact exists.
- **WebSite**: `name`, `url`. (Skip `SearchAction`; Google no longer uses it for sitelinks search boxes.)
- **BreadcrumbList** on all pages below the homepage.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "HarvestLink",
  "alternateName": ["Bulk Wine Grapes", "bulkwinegrapes.com"],
  "url": "https://bulkwinegrapes.com",
  "description": "HarvestLink is an online marketplace where wine grape growers, wineries, and wine brands buy and sell wine grapes and bulk wine directly, including confidential listings under NDA."
}
```

### 6.2 Listings
`Product` with an `Offer`. Express units with UN/CEFACT codes (verify the code list): `GLL` = gallon (US); `STN` = ton (US short ton).

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "2025 Cabernet Sauvignon Bulk Wine · 12,500 gal",
  "description": "12,500 gallons of 2025 Cabernet Sauvignon bulk wine, 14.2% ABV, Napa County, CA.",
  "category": "Bulk wine",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "eligibleQuantity": { "@type": "QuantitativeValue", "value": 12500, "unitCode": "GLL" },
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": 8.50,
      "priceCurrency": "USD",
      "referenceQuantity": { "@type": "QuantitativeValue", "value": 1, "unitCode": "GLL" }
    }
  }
}
```
For grapes use `unitCode: "STN"` and price per ton. **Omit `seller`, `brand`, and any vineyard reference when `is_nda = true`.** For non-NDA listings include `seller` only with the name the seller already displays publicly. Don't expect Google product rich results for classifieds; the markup mainly helps machines understand the page.

### 6.3 Blog posts
`BlogPosting` (or `Article`) with `headline`, `description`, `image`, `datePublished`, `dateModified`, `author` (`Person` with `url` to the author page), `publisher` (Organization), `mainEntityOfPage`. Keep `dateModified` truthful (update when content changes).

### 6.4 FAQ
Add `FAQPage` JSON-LD to `/faq` and to posts with FAQ sections, **but** set expectations: Google limits FAQ rich results to a narrow set of sites, so don't expect them. The value is the visible, well-structured Q&A text, which AI systems extract readily.

### 6.5 Category/landing pages
`CollectionPage` (or `ItemList`) with the listings shown (anonymized as above).

---

## 7. AI Search Optimization (GEO)

Goal: when someone asks ChatGPT, Perplexity, Gemini, Claude, Copilot, or Google's AI Overviews about bulk wine, wine grape prices, or where to buy either, HarvestLink is cited as a source.

### GEO-1: Let the right crawlers in
- Confirm `robots.txt` doesn't block search/answer crawlers and that Vercel firewall/bot rules don't either.
- **Search/answer bots (recommend: allow):** `Googlebot`, `Bingbot`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot`, `Claude-User`, `Applebot`. Verify current names in each vendor's documentation; they change.
- **Training crawlers (owner decision):** `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, others. Default recommendation: allow, since brand visibility inside AI answers depends partly on being in training data. Document the decision in `docs/seo-open-items.md`. NDA data is never in crawlable HTML, so this doesn't touch confidentiality.
- Optional explicit `robots.txt` stanzas per bot are only needed if the owner wants to block any.

### GEO-2: Write so machines can quote you
Apply to all blog and landing content (also enforced in the blog plan):
1. **Answer first.** The first 1 to 2 sentences under every heading directly answer the heading. Add a "Quick answer" box (40 to 60 words) at the top of each post.
2. **Question-style H2/H3s** that mirror how people ask ("How much does bulk wine cost per gallon?").
3. **Self-contained sections.** Each section should make sense if extracted alone (define terms on first use; restate the subject instead of "it").
4. **Specifics with units and dates.** "$/gal," "tons," "2025 vintage," "as of September 2026." Avoid vague claims.
5. **Tables and lists** for comparisons, steps, and checklists.
6. **Cite sources with links** and dates. Prefer primary sources (TTB, CDFA Grape Crush Report, USDA NASS) and reputable trade press.
7. **Visible "Last updated" date** plus honest `dateModified`. Refresh time-sensitive posts on a schedule (blog plan).
8. **Real authorship.** Named author with a bio page; `reviewedBy` for compliance/legal posts. `{{CONFIRM: author names and credentials}}`. Never invent credentials.
9. **Original data when possible.** Once inventory exists, publish anonymized, aggregated listing stats (median asking price per gallon by varietal, etc.) with a clear methodology and minimum sample size (never expose a single seller). This is the strongest long-term citation magnet.
10. **Consistent entity language.** Reuse the canonical description (Section 2.1).
11. **Server-rendered content.** Nothing critical behind client-only rendering or click-to-expand that isn't in the HTML.

### GEO-3: `llms.txt` (optional, low cost)
Add `/llms.txt` summarizing the site (canonical description, key pages, contact). No major AI provider has confirmed relying on it, so treat it as a harmless extra, not a strategy.

### GEO-4: Off-site entity signals (owner tasks, Section 10)
AI systems weigh what other sites say about you. See Section 10.

### GEO-5: Track AI visibility monthly
Create `docs/ai-visibility-log.md` with a fixed set of prompts. Each month, run them in ChatGPT (with search), Perplexity, Gemini, Claude, Copilot, and Google (AI Overview), and record whether HarvestLink is mentioned or cited, which URL, and the competing sources. Starter prompts:

1. What is HarvestLink?
2. Where can I buy bulk wine?
3. What is bulk wine and how is it sold?
4. How much does bulk wine cost per gallon?
5. Where can I buy wine grapes by the ton?
6. How much do wine grapes cost per ton?
7. How many gallons of wine does a ton of grapes make?
8. How do I start a wine brand without a vineyard?
9. What is white label or private label wine?
10. Can a winery sell wine anonymously?
11. What does selling bulk wine under NDA mean?
12. Who can legally buy bulk wine in the U.S.?
13. What's the difference between spot and forward grape contracts?
14. What's the difference between organic, biodynamic, and regenerative organic wine?
15. Is there a marketplace for bulk wine and wine grapes?
16. Is it a good time to buy bulk wine in 2026?
17. How do I sell surplus bulk wine?
18. What total sulfite level is typical for wine?
(add 7 more from Search Console queries as they appear)

---

## 8. Stock Photography Plan (Homepage & Blog)

### 8.1 Principles
- **Trade-focused, authentic, premium.** The audience is growers, winemakers, and wine brands. Favor vineyards, harvest, crush pad, tanks, barrels, and hands-on close-ups. **Avoid** consumer-lifestyle shots (toasting, parties, picnics).
- **No identifiable faces** unless a model release is confirmed (free stock sites don't verify releases). Prefer hands, backs, silhouettes, or no people.
- **No visible brand labels, winery logos, signage, or recognizable named estates.** This avoids implying endorsement and protects the NDA positioning (nothing that could be mistaken for a specific seller).
- **Geographic fit.** The site's regions are U.S. (California, Washington, Oregon, New York). Avoid unmistakably European scenery (Tuscan villas, French châteaux) on U.S.-focused pages. Only claim a location in alt text if the source states it.
- **Seasonal and consistent.** Warm natural light; harvest/autumn tones for hero and market posts; keep one consistent color grade across the site.
- **Hero text contrast:** if text sits on an image, apply an overlay that meets WCAG AA (4.5:1).

### 8.2 Approved sources and licensing

| Source | License summary (verify at the time of download) | Notes |
|---|---|---|
| **Unsplash** | Free for commercial use, no attribution required; can't be used to build a competing photo service. | Only use photos marked "Free / Unsplash License." **Photos labeled "For Unsplash+" are paid and MUST NOT be used** unless the owner buys a subscription. |
| **Pexels** | Free for commercial use, no attribution required. Identifiable people must not be portrayed in a bad light; don't imply endorsement; don't sell unaltered copies. | Don't use the photo as part of a trademark or business name. |
| **Pixabay** | Pixabay Content License: free for commercial use, no attribution required. | Read the current license and its restrictions before use. |
| **Paid (recommended for the hero and anything with people)** | Adobe Stock, Shutterstock, iStock, Getty: offer indemnification and verified releases. | Use if budget allows, especially for the homepage hero and any image with a person. |

**Risk note for the owner report:** none of the free sites verify model/property releases, and none offer meaningful legal protection if an uploader lacked rights. Hence the vetting steps in Section 8.4.

### 8.3 Verified starting points (the agent must still vet each image)

I confirmed these pages exist and show free-license terms, but I could not inspect full-resolution images or check every rights detail. Treat them as **starting candidates**, not approved assets.

| Candidate | Where | Notes |
|---|---|---|
| "A bunch of grapes hanging from a vine," Molly Bailey (Pinot Noir, Dundee, Oregon; published Sept 2024; Unsplash License) | `https://unsplash.com/photos/a-bunch-of-grapes-hanging-from-a-vine-BFmPWky6rZ8` | Good close-up for the Grapes card (IMG-2). Confirm no identifying features. |
| "Wine Tank Room," a Pexels photo by a Pixabay contributor (wooden barrels, Napa, CA winery) | `https://www.pexels.com/photo/wine-tank-room-434311/` | Candidate for the Bulk Wine card (IMG-3) or NDA section (IMG-4). Check for visible branding. |
| Unsplash topic: Grape Harvest | `https://unsplash.com/s/photos/grape-harvest` | Harvest bins, hand-picking. |
| Unsplash topic: Wine Harvest | `https://unsplash.com/s/photos/wine-harvest` | Harvest-season scenes. |
| Unsplash topic: Vineyard | `https://unsplash.com/s/photos/vineyard` | Vineyard rows and landscapes. |
| Unsplash topic: Viticulture | `https://unsplash.com/s/photos/viticulture` | Vine and canopy detail. |
| Unsplash collection: Vineyard (56 photos, curated by laze.life) | `https://unsplash.com/collections/1985644/vineyard` | Pre-curated set to browse quickly. |

Photographers whose portfolios appeared repeatedly with relevant, free-license vineyard/harvest images (unvetted; check each photo): Molly Bailey, Danielle Comer, Vindemia Winery, Dan Meyers, Andrea Cairone, Jolea Schwindt. Search results also included a "spring vineyard landscape (Santa Barbara County, California)" photo, which suits U.S. geography (verify).

### 8.4 Vetting workflow (MUST complete for every image)

1. **Open the source page** and confirm the license badge/text ("Free to use under the Unsplash License," the Pexels license, or the Pixabay license). Reject anything labeled Unsplash+ or "premium."
2. **Screenshot or save** the license text and page URL (proof of the terms at time of download) to `docs/image-licenses/`.
3. **Check content:** no readable brand labels, logos, signage, license plates, or identifiable faces; no obviously Italian/French landmarks for U.S. pages; nothing suggestive or consumer-party themed.
4. **Reverse-image search** (Google Lens/TinEye) to spot images that were uploaded by someone who doesn't own them or that appear as paid stock elsewhere. Reject if suspicious.
5. **Duplicate check:** avoid images already prominent on the top-ranking competitor sites (Ciatti, Turrentine, Wine Business classifieds, etc.) so the site looks distinct.
6. **Download the original** and **self-host** it (never hotlink to Unsplash/Pexels/Pixabay).
7. **Log it** in `docs/image-credits.md`: file name, source URL, photographer, license (name + URL), date accessed, modifications, where used.
8. **If the agent cannot reach these sites** (network restrictions): do not fabricate images. Insert a clearly named placeholder, list the missing slots in `docs/seo-open-items.md`, and continue.

### 8.5 Shot list (IMG-1 … IMG-n)

| ID | Slot | Subject brief | Size (source) | Search queries |
|---|---|---|---|---|
| **IMG-1** | Homepage hero | Wide vineyard rows at golden hour or harvest season; open space on the left for text; no people | 2400×1350 (16:9) | `vineyard rows golden hour`, `vineyard harvest season`, `california vineyard landscape` |
| **IMG-2** | Grapes card | Close-up of ripe wine grape clusters on the vine (red variety preferred for contrast) | 1600×1067 | `wine grapes on vine close up`, `pinot noir grapes`, `cabernet grapes vine` |
| **IMG-3** | Bulk Wine card | Stainless steel tanks or oak barrels in a cellar; clean, no labels | 1600×1067 | `winery stainless steel tanks`, `wine barrel cellar`, `winery tank room` |
| **IMG-4** | NDA section | Moody, anonymous: dim barrel room or a shadowed cellar corridor; conveys "confidential" without people | 1600×900 | `dark wine cellar barrels`, `barrel room low light`, `winery cellar moody` |
| **IMG-5** | How it works | Harvest bins of grapes on the crush pad; or hands holding a grape cluster (non-identifiable) | 1600×1067 | `harvest bins grapes`, `hands holding grapes`, `crush pad grapes` |
| **IMG-6** | Sell CTA / band | Vine canopy or harvest hands; warm tones | 2000×800 | `vineyard canopy sunlight`, `grape harvest hands` |
| **IMG-7** | Blog heroes (15) | See the "Hero image brief" in each post of the blog plan | 1600×900 | (per post) |
| **IMG-8** | Default OG image | **Generated** branded card (logo + tagline + accent color), not a stock photo | 1200×630 | n/a |

**Reserve a lab-sample or tanker/transfer image** for the bulk-wine buying posts if suitable free images exist (`wine sample glass lab`, `winery tanker truck`). If nothing good is found, skip. Don't force weak images.

### 8.6 Technical specs
- Store originals in `/assets/stock-originals/` (not served); serve optimized versions from `/public/images/` via `next/image` (AVIF/WebP).
- **Budgets:** hero ≤ 200 KB served (AVIF/WebP at typical viewport), cards ≤ 100 KB, blog heroes ≤ 150 KB. `priority` only on the homepage hero. Provide `sizes` for responsive selection.
- **File names:** descriptive kebab-case (`vineyard-rows-golden-hour.jpg`). Don't include producer, seller, or named-estate words.
- **EXIF:** strip GPS and camera metadata from all served files.
- **Alt text rules:** describe what's visible in 8 to 16 words; no keyword stuffing; no "image of"; decorative images get `alt=""`. Example: "Clusters of ripe Pinot Noir grapes hanging on the vine before harvest." Include variety/region only if the source states it.
- **No text baked into images.** Overlay text in HTML/CSS.
- **Attribution:** not legally required for these licenses, but as a courtesy add an optional `/credits` page and log everything in `docs/image-credits.md`. Owner decides whether to publish credits.

---

## 9. QA, Measurement & Definition of Done

### 9.1 Keyword validation (before finalizing priorities)
The demand tiers in the blog plan are estimates. The agent/owner SHOULD validate with: Google Keyword Planner (free with an Ads account), Google Search Console (once data accrues), a free tier of a keyword tool, and People-Also-Ask style tools. Record real numbers in `docs/keyword-validation.md` and re-order the publishing schedule if warranted.

### 9.2 Automated checks (CI)
- Metadata lint (unique titles, length limits, canonical present, exactly one H1).
- Broken-link check (internal and external) on built pages.
- JSON-LD validation for each template.
- Lighthouse CI budget for the five key page types (SEO-11).
- **NDA canary test extended** to: sitemap, RSS, JSON-LD, OG images, landing pages, blog "related lots" modules, and image filenames/metadata.
- Accessibility (axe) on home, marketplaces, a post, and the FAQ.

### 9.3 Manual checks
- Google Rich Results Test and Schema.org validator on sample URLs.
- View source on the homepage and a blog post: H1/H2, canonical, meta, and body text are in the initial HTML.
- Test `/?market=bulk-wine` behavior after SEO-2.
- Mobile pass at 375 px (LCP, layout shift, tap targets).
- Confirm preview deployments send `noindex`.

### 9.4 Definition of Done
- [ ] All P0 items complete; P1 items complete or documented as deferred with reasons.
- [ ] Unique, length-compliant metadata on every indexable page; lint passing.
- [ ] Homepage rewritten per Section 5; both marketplaces clear above the fold; no unresolved `{{CONFIRM}}` visible.
- [ ] `/about`, `/how-it-works`, `/faq`, `/contact`, `/blog` live and linked.
- [ ] Sitemap, robots, canonical, and noindex rules verified in production.
- [ ] JSON-LD valid; NDA-safe; canary test green including new surfaces.
- [ ] Images vetted, logged, optimized, self-hosted; credits and license records in `docs/`.
- [ ] All 15 posts present as `needs-review` with `docs/blog-fact-check-log.md`.
- [ ] Search Console and Bing Webmaster Tools set up (or owner instructions written if the agent lacks access).
- [ ] `docs/seo-open-items.md` lists every owner decision, placeholder, and deferred item.

---

## 10. Owner Tasks (Not for the Coding Agent)

The agent cannot do these; the project owner should.

1. **Resolve every `{{CONFIRM}}`** (fees, verification process, contact method, founder/team info, logo, social profiles).
2. **Trademark and brand check** for "HarvestLink" (Section 2.3).
3. **Approve or edit claims** in Section 2.4, especially "world's best winemakers" and "verified."
4. **Verify accounts:** Google Search Console, Bing Webmaster Tools, GA4, and (optionally) Google Business/other profiles.
5. **Build off-site signals:** create a LinkedIn company page and other real profiles; list HarvestLink in relevant industry directories and supplier guides; introduce the site to regional grower associations and winegrowers groups; participate (transparently) in relevant communities; pursue trade-press coverage of the 2026 harvest/market posts. Off-site mentions and links are a major driver of both rankings and AI citations.
6. **Seed inventory.** Search and AI visibility improve when listings exist. Recruit early sellers (especially bulk wine) to list.
7. **Review and approve blog posts** using the fact-check log; flip `status` to `published` on a schedule (the blog plan proposes one).
8. **Legal review** of the compliance post (TTB/permit content), Terms, and Privacy.
9. **Decide on AI training crawlers** (GEO-1).
10. **Consider paid stock** for the hero image and any image with people.
11. **Public repository heads-up:** the GitHub repository appears to be public and contains the NDA design documents and database migration files. Consider whether that's intended for a marketplace whose selling point is confidentiality.

---

## 11. Phased Delivery Plan

| Phase | Work | Output |
|---|---|---|
| **A: Foundations (P0)** | Audit confirmation, SEO-1, SEO-2, SEO-8, SEO-9, SEO-15, metadata lint, preview noindex | Unique metadata everywhere; clean URLs; sitemap/robots verified; tooling set up |
| **B: Homepage & core pages** | SEO-3, SEO-4, SEO-6, Section 5, footer/nav, Organization/WebSite/Breadcrumb JSON-LD | New homepage; About, How It Works, FAQ, Contact live |
| **C: Imagery** | Section 8: vet and log images, optimize, place IMG-1…IMG-6, generated OG image | Images live; `docs/image-credits.md`, `docs/image-licenses/` |
| **D: Blog system + posts** | SEO-14; implement components; write all 15 posts per the blog plan as `needs-review`; fact-check log | Blog live (drafts gated); review pack |
| **E: Landing pages & listing SEO** | SEO-5, SEO-7, SEO-10, Section 6.2/6.5 | 20 landing pages; listing metadata/JSON-LD (NDA-safe) |
| **F: Hardening & GEO** | SEO-11, GEO-1…3, canary extension, Lighthouse/axe, ai-visibility-log baseline | All QA gates green |
| **G: Launch & iterate** | Owner approves posts; staged publishing; monitor Search Console; refresh cadence | Ongoing |

Stop and summarize after each phase: what changed, what was tested, what was flagged.
