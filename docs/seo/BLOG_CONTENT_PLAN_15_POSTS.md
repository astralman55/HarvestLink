# Blog Content Plan: 15 Posts for HarvestLink

**Site:** https://bulkwinegrapes.com (brand: **HarvestLink**)
**Audience:** AI coding/content agent + the human reviewing its work
**Written:** September 19, 2026
**Companion file:** `SEO_GEO_IMPLEMENTATION_SPEC.md` (metadata, homepage, blog *system* requirements in SEO-14, structured data, AI-search rules, stock photography). Read it first. This file defines **what** the 15 posts are and **how** each should be written.

---

## 0. How to Use This Document

1. Write all 15 posts as MDX/Markdown in `content/blog/` using the front-matter schema in SEO-14 and the post template in Section 5.
2. **Ship every post as `status: needs-review`.** The site excludes `needs-review` posts from the sitemap, index, and RSS and serves them `noindex` until the owner approves. Do not publish on your own.
3. **Never fabricate.** No invented statistics, prices, quotes, studies, customers, testimonials, or author credentials. If you can't source a number, don't state it. Use a `{{CONFIRM}}` or `{{DATA NEEDED}}` marker and log it.
4. **Produce `docs/blog-fact-check-log.md`:** one section per post listing every statistic, date, price, regulation, and claim with its source URL and date accessed. The owner will review this to approve posts quickly.
5. **Requirement IDs** (`P1`…`P15`) map to posts so the owner can give feedback per post.
6. All posts must respect the **NDA rules** (no real seller data in any example) and the **claims guardrails** (SEO spec, Section 2.4).
7. If a brief conflicts with reality (e.g., a source says something different from what's written here), **the verified source wins.** Note the discrepancy in the fact-check log.

---

## 1. Goals, Audience & Voice

**Goals**
- Rank and get cited for the questions buyers and sellers actually ask about bulk wine and wine grapes.
- Establish HarvestLink as a clear, trustworthy explainer of the market (E-E-A-T) while giving people a natural next step: browse, list, or set an alert.
- Feed internal links to `/grapes`, `/bulk-wine`, `/sell`, and the landing pages.

**Audiences**
1. **Wine brands, négociants, and private-label founders** buying bulk wine.
2. **Winemakers and wineries** buying grapes or topping up blends.
3. **Growers and wineries** with fruit or wine to sell (including those who need confidentiality).
4. **Aspiring brand owners** researching how to start a wine label without a vineyard.

**Voice:** plain English, practical, calm, and specific. Trade-savvy but not jargon-heavy (define terms on first use). No hype ("revolutionary," "game-changing"), no fear-mongering, no filler intros ("In today's fast-paced world…"). U.S. spelling and units (tons, gallons, °F). Talk to the reader as "you."

**Not:** wine-lifestyle content, tasting notes, food pairing, or consumer buying advice.

---

## 2. Quality, Sourcing & Compliance Rules (MUST)

| Rule | Detail |
|---|---|
| **Original value** | Each post must contain something a reader can't get from a 200-word summary: a table, checklist, worked example, calculator, decision framework, or original data. |
| **Sourcing** | Every statistic, price, date, or regulation is linked to a source (see Section 8 for starters). Prefer primary sources (TTB, CDFA, USDA, university extension) and reputable trade press. Record the date accessed. |
| **Dating** | Time-sensitive claims state their date ("as of September 2026"). Historical numbers are labeled with their year and never presented as current. |
| **Paraphrase** | Paraphrase sources in your own words. Any direct quote is short (under 15 words), attributed, and used sparingly. Don't reproduce paywalled report content. |
| **Illustrative math** | Arithmetic examples (e.g., price per bottle from price per gallon) are labeled "illustration," not market claims. |
| **Disclaimers** | Compliance/legal/financial posts carry a visible "Educational information, not legal or financial advice" callout and recommend consulting a licensed professional. |
| **NDA & privacy** | No real seller or listing data unless it's already public on HarvestLink and anonymized as the serializer returns it. No named producers used as selling points. |
| **Author & review** | Byline uses a real person supplied by the owner `{{CONFIRM: author}}`. For P13 (compliance), add `reviewedBy` `{{CONFIRM: attorney/compliance professional}}`. Never invent credentials. |
| **No health claims** | Especially in P12 (farming practices) and sulfite discussions. |
| **Trade focus** | State clearly where relevant that bulk wine is a trade product and that buyers should confirm license/permit requirements. |
| **Freshness** | Add a visible "Last updated" date; follow the refresh schedule in Section 4.3. |

**Post-level QA (each post):** one H1; Quick answer box (40 to 60 words); question-style H2s; at least 1 table or checklist; 3 to 5 FAQs; ≥ 3 internal links + 1 marketplace link + 1 CTA; all sources linked; hero image + alt text; meta title ≤ 60 and description ≤ 155 chars; valid JSON-LD; no `{{CONFIRM}}` left unresolved *or* flagged in the fact-check log.

---

## 3. Keyword Approach

### 3.1 Read this before trusting the tiers
I did **not** have access to a keyword-volume tool. The **Demand tier** labels below are my estimates of relative search demand based on how these queries are commonly used, not measured numbers:

- **A** = head or high-interest term; likely the largest search demand in this niche (often informational).
- **B** = solid mid-volume, usually clear commercial or research intent.
- **C** = smaller or emerging, but high intent or strategically important (brand, differentiators, compliance).

The agent/owner should validate with Google Keyword Planner and then Search Console, and record results in `docs/keyword-validation.md`. Re-order the schedule if real numbers disagree.

### 3.2 Reality check on "high volume"
The biggest-volume phrases here skew informational and partly consumer ("how many grapes in a bottle of wine"). The buyer-intent phrases ("bulk wine for sale") have lower volume but far higher value. The 15 posts intentionally mix both and funnel both toward the marketplaces.

### 3.3 Competitive landscape (why differentiation matters)
Established players already rank for core terms: broker sites (e.g., Ciatti, Turrentine, North Coast Winegrape Brokers), trade-press classifieds (Wine Business), and regional grower-association marketplaces (e.g., IGGPRA in Paso Robles, Lake County Winegrape Commission, Oregon Wine Industry marketplace). To stand out, HarvestLink content should lean on what the site uniquely offers: **transparent price per gallon/ton, structured specs (ABV, sulfites ppm, farming practice), confidential NDA listings, direct contact, and plain-English explainers with worked examples.**

### 3.4 On-page keyword rules
- Primary keyword in: H1 (natural wording), meta title, first 100 words, one H2, URL slug, and image alt where it fits naturally.
- Secondary keywords appear naturally in H2/H3s and body. No stuffing, no repeated exact-match phrases.
- Match search intent: don't write a sales page for an informational query; don't write a glossary for a "for sale" query.

---

## 4. Topic Map, Schedule & Linking

### 4.1 Clusters

| Cluster | Posts | Role |
|---|---|---|
| **Brand / entity** | P1 | Defines HarvestLink for humans and AI systems |
| **Buying bulk wine** | P2, P3, P4, P5, P13 | Bulk wine buyer funnel |
| **Brand launch** | P6 | Private label / white label |
| **Confidentiality (differentiator)** | P7 | NDA listings |
| **Wine grapes** | P8, P9, P10, P11 | Grape buyer funnel and tools |
| **Farming practices** | P12 | Ties to on-site filters |
| **Market news** | P14 | Timely, link magnet, refreshed monthly |
| **Selling** | P15 | Seller acquisition |

**Pillars:** P3 (bulk wine) and P8 (wine grapes) act as pillar pages; other posts link up to them and across their cluster.

### 4.2 Publishing schedule (proposed; assumes owner approvals; today is Sat, Sept 19, 2026)

| Week of | Posts | Why |
|---|---|---|
| Mon Sept 21 | **P1** What is HarvestLink · **P2** Buy bulk wine at a fraction · **P14** 2026 buyer's market | Brand + flagship message + timely (harvest ~80% complete by late Sept per trade reports) |
| Mon Sept 28 | **P3** What is bulk wine · **P4** How to buy bulk wine · **P5** Bulk wine prices | Core buyer funnel |
| Mon Oct 5 | **P8** How to buy wine grapes · **P9** Grape prices per ton · **P10** Gallons per ton + calculator | Grape funnel and tool |
| Mon Oct 12 | **P6** Private/white label · **P7** NDA explainer · **P13** Who can legally buy bulk wine | Brand-building, differentiator, trust |
| Mon Oct 19 | **P11** Spot vs forward contracts · **P12** Farming practice labels · **P15** How to sell | Depth and seller acquisition |

Don't publish all at once. Space posts, announce each internally (homepage "From the blog," social, newsletter), and ping IndexNow on publish.

### 4.3 Refresh schedule
- **Monthly:** P14, P5 (bulk prices), P9 (grape prices, quarterly once annual data is static).
- **Quarterly:** P2, P4, P13 (check regulations), P15.
- **Semiannual:** all others. Update `dateModified` only when content actually changes.

### 4.4 Internal-link map (minimum)

| Post | Must link to |
|---|---|
| P1 | P3, P8, P7, `/how-it-works`, `/faq`, `/grapes`, `/bulk-wine`, `/sell` |
| P2 | P3, P4, P5, P7, P13, P14, `/bulk-wine` |
| P3 | P2, P4, P5, P6, P13, `/bulk-wine` |
| P4 | P3, P5, P13, P6, P7, `/bulk-wine` |
| P5 | P2, P3, P4, P14, `/bulk-wine` |
| P6 | P3, P4, P5, P13, `/bulk-wine` |
| P7 | P2, P15, P1, P13, `/sell`, `/bulk-wine` |
| P8 | P9, P10, P11, P12, P14, `/grapes` |
| P9 | P8, P10, P11, P14, `/grapes` |
| P10 | P8, P9, P3, `/grapes`, `/bulk-wine` |
| P11 | P8, P9, P14, `/grapes` |
| P12 | P8, P3, P5, `/grapes/farming/organic` etc. (once live) |
| P13 | P3, P4, P6, P2, `/faq` |
| P14 | P2, P5, P9, P8, P15, `/grapes`, `/bulk-wine` |
| P15 | P7, P5, P9, P14, `/sell` |

---

## 5. Post Template

**Front matter (YAML):** `title`, `slug`, `description`, `primaryKeyword`, `secondaryKeywords[]`, `datePublished` (set on approval), `dateModified`, `author`, `reviewedBy` (P13), `heroImage`, `heroAlt`, `status: needs-review`, `faq[]`, `sources[]`.

**Body order:**
1. H1
2. **Quick answer** box (40 to 60 words) that directly answers the primary query
3. Byline, "Last updated," reading time
4. Table of contents (for posts > 1,200 words)
5. Body: question-style H2s; short paragraphs; tables/checklists; callouts
6. **FAQ** (3 to 5 Qs; answers 40 to 80 words each)
7. **"About HarvestLink"** boilerplate (the one-sentence canonical description) and CTA block
8. Related posts (3) and (where relevant) **Related lots** module (live listings by variety/region via the public serializer, NDA-safe)
9. Sources list

**CTA types:** *Browse* (`/grapes` or `/bulk-wine`), *List* (`/sell`), *Alert* (set up alerts, if available).

---

## 6. The 15 Posts

Format for each: **Slug · Primary keyword · Secondary keywords · Demand tier (est.) · Intent · Length · Meta title · Meta description · Quick answer · Outline · FAQs · Facts to source · Hero image brief · CTA/links.**

---

### P1: What Is HarvestLink?

- **H1:** What Is HarvestLink? The Marketplace for Wine Grapes and Bulk Wine
- **Slug:** `what-is-harvestlink`
- **Primary keyword:** what is HarvestLink · **Secondary:** wine grape marketplace, bulk wine marketplace, buy wine grapes online, sell bulk wine online, wine grape classifieds, confidential wine listings, bulkwinegrapes
- **Demand tier:** C (brand; strategically critical for entity/AI recognition) · **Intent:** navigational/informational · **Length:** 1,300 to 1,700 words
- **Meta title:** `What Is HarvestLink? Wine Grape & Bulk Wine Marketplace` (55)
- **Meta description:** `HarvestLink is a marketplace where growers, wineries and brands buy and sell wine grapes by the ton and bulk wine by the gallon, openly or under NDA.` (149)
- **Quick answer:** HarvestLink is an online marketplace where wine grape growers, wineries, and wine brands buy and sell wine grapes by the ton and bulk wine by the gallon, directly with each other. Sellers can list openly or confidentially under NDA. Buyers filter by variety, vintage, region, farming practice, and price.
- **Suggested opening (edit freely):** *HarvestLink is an online marketplace for the wine trade. Growers and wineries list wine grapes by the ton and bulk wine by the gallon, and buyers search by the details winemakers actually care about: variety, vintage, region, farming practice, brix, ABV, and total sulfites. Sellers can list openly or confidentially under NDA, and buyers contact them through the site.*
- **Outline:**
  1. What HarvestLink is (definition; who it's for)
  2. Who uses it: growers, wineries, wine brands/négociants, private-label founders
  3. What you can find: **Grapes** (by the ton) vs **Bulk wine** (by the gallon), with a comparison table of the fields shown on each type
  4. How it works for buyers (search → compare → contact) and for sellers (list → choose visibility → get inquiries)
  5. Selling under NDA: what's hidden, what's shown, how buyers reach the seller (link P7)
  6. What HarvestLink is *not*: not a winery, not a brand, `{{CONFIRM: whether it's a party to transactions; who handles payment, shipping, and compliance}}`
  7. Pricing and fees `{{CONFIRM}}`
  8. Why it exists `{{CONFIRM: founder/origin story, real and provided by the owner}}`
  9. Where to start: links to Browse Grapes, Browse Bulk Wine, Sell, How It Works, FAQ
- **FAQs:** Is HarvestLink for consumers? · Is it free to list? `{{CONFIRM}}` · How do I contact a seller? · What does "under NDA" mean? · Does HarvestLink handle shipping or payment? `{{CONFIRM}}`
- **Facts to source:** none external; everything must match the live product and the owner's answers. Verify each feature statement against the site.
- **Hero image brief:** wide vineyard at harvest season (IMG-1 style variant) or split image: grape cluster + tank room.
- **CTA/links:** per link map; primary CTA Browse both marketplaces.
- **Extra:** Add `Organization` JSON-LD reference; this is the page AI systems should cite for "What is HarvestLink?"

---

### P2: Did You Know You Can Buy Bulk Wine From the World's Best Winemakers at a Fraction of the Cost?

- **H1 (owner's phrasing):** Did You Know You Can Buy Bulk Wine From the World's Best Winemakers at a Fraction of the Cost?
- **Safer alternate H1 if the claim can't be substantiated:** Did You Know You Can Buy Bulk Wine From Top Producers at a Fraction of the Bottle Price?
  *(Use the alternate unless the owner confirms HarvestLink sellers include acclaimed producers. See SEO spec 2.4.)*
- **Slug:** `buy-bulk-wine-from-top-winemakers`
- **Primary keyword:** buy bulk wine · **Secondary:** bulk wine for sale, buy wine in bulk, premium bulk wine, bulk wine from top wineries, bulk wine vs bottled wine, bulk wine cost, declassified wine
- **Demand tier:** A/B (buyer intent) · **Intent:** commercial/informational · **Length:** 1,800 to 2,200 words
- **Meta title:** `Buy Bulk Wine From Top Winemakers at a Fraction of the Cost` (59)
- **Meta description:** `Wineries sell surplus and declassified wine by the gallon. Learn how bulk wine works, why it can cost a fraction of the bottle price, and where to buy it.` (154)
- **Quick answer:** Yes. Wineries regularly sell wine they won't bottle themselves, such as surplus, declassified, or off-blend lots, to other wineries and brands by the gallon. Because buyers aren't paying for glass, labels, packaging, marketing, or distribution margins, the wine itself can cost a fraction of its finished bottle price. You take on bottling, compliance, and freight.
- **Suggested opening (edit freely):** *Some of the wine on the shelf is not made by the name on the label. When a winery ends up with more wine than it needs, whether from a big vintage, a lot that didn't make a top blend, or slower sales, it can sell that wine in bulk, by the gallon, to other wineries and brands. The buyer pays for the wine, not the bottle, the label, or the distribution chain, which is why bulk wine can cost a fraction of what the same wine would cost finished. Here's how it works, what you take on as a buyer, and how to find lots.*
- **Outline:**
  1. Quick answer + opening
  2. What is bulk wine? (short; link to P3)
  3. **Why do wineries sell bulk wine?** Surplus, tank space, cash flow, declassification, brand protection. *(Source: trade press on 2025–2026 inventory pressure; see Section 8.)*
  4. **Why can bulk wine cost a fraction of the bottle price?** Cost-stack table: wine itself vs glass, closure, label, packaging, marketing, distributor and retailer margins (qualitative; no invented percentages)
  5. **Illustrative per-bottle math** (label as illustration; excludes bottling, closure, label, packaging, freight, taxes, margin). 1 US gallon ≈ 5.05 bottles (750 mL).

     | Bulk price ($/gal) | Wine cost per 750 mL bottle |
     |---|---|
     | $5 | ≈ $0.99 |
     | $8 | ≈ $1.58 |
     | $10 | ≈ $1.98 |
     | $15 | ≈ $2.97 |
     | $25 | ≈ $4.95 |
     | $40 | ≈ $7.92 |
  6. **A real-world example (historical, labeled with the year):** in 2020, brands bought top-tier bulk Napa Cabernet and sold finished bottles at a small fraction of typical prices (SF Chronicle, April 2020). Paraphrase; state clearly that it reflects that market, not today's.
  7. **Why top producers often sell anonymously**, and how NDA listings work (link P7)
  8. **What you take on as a buyer:** bottling (permits or co-packer), label approval, taxes, freight, lab checks, sampling, timing (link P13)
  9. **How to judge quality before you buy:** samples, lab analysis (ABV, total SO₂, VA, pH/TA), provenance, conformity of lot to sample
  10. **Where to find bulk wine:** brokers, direct from wineries, marketplaces like HarvestLink (be neutral and fair about brokers)
  11. Is now a good time? Link to P14 (buyer's market context)
  12. FAQs, CTA
- **FAQs:** Is bulk wine lower quality? *(No. Quality varies by lot; evaluate samples and lab data.)* · Can individuals buy bulk wine? *(Generally a trade transaction; link P13.)* · How much does it cost? *(link P5)* · Do I have to bottle it myself? · What does "declassified" mean?
- **Facts to source:** SF Chronicle 2020 article; trade-press explanation of why wineries sell bulk (Section 8); TTB basics for P13 link; gallon/bottle conversion (1 US gal = 3.785 L → 5.05 × 750 mL).
- **Hero image brief:** IMG-3 style: tank room or barrel cellar, no labels.
- **CTA/links:** Browse Bulk Wine (`/bulk-wine`); "List your surplus" (`/sell`) as secondary.
- **Guardrails:** Don't name real producers. Don't promise savings. Include the "for licensed trade buyers" note.

---

### P3: What Is Bulk Wine? A Plain-English Guide (Pillar)

- **H1:** What Is Bulk Wine? A Plain-English Guide for Wineries and Wine Brands
- **Slug:** `what-is-bulk-wine`
- **Primary keyword:** what is bulk wine · **Secondary:** bulk wine meaning, bulk wine definition, bulk wine vs bottled wine, how is bulk wine sold, bulk wine gallons, bulk wine tank barrel tote
- **Demand tier:** A · **Intent:** informational · **Length:** 1,800 to 2,400 words (pillar)
- **Meta title:** `What Is Bulk Wine? A Plain-English Guide for Buyers` (50)
- **Meta description:** `Bulk wine is wine sold by volume before bottling. Learn how it's stored, measured in gallons, priced, and who buys it, plus a glossary of trade terms.` (150)
- **Quick answer:** Bulk wine is finished or nearly finished wine sold by volume, usually in gallons, before it is bottled. It's stored in tanks, barrels, or totes and sold to other wineries and brands that blend it, age it, or bottle it under their own label.
- **Outline:**
  1. What bulk wine is (and isn't): vs bottled wine, vs grape juice/must, vs grapes
  2. Why bulk wine exists (surplus, blending, private label, custom crush)
  3. How it's stored and moved: stainless tanks, oak barrels, totes/IBCs, flexitanks, tanker trucks (give typical container sizes **only with sources**; a standard 225 L barrel ≈ 59.4 US gallons is arithmetic: 225 ÷ 3.785)
  4. How it's measured and priced: gallons vs liters, price per gallon, FOB vs delivered (link P5)
  5. Who buys bulk wine (wineries, négociants, private-label brands, co-packers)
  6. What a good bulk wine listing shows: varietal, vintage, appellation, ABV, total sulfites (ppm), farming practice, quantity, location, price/gal (this doubles as a plug for HarvestLink's listing format)
  7. Spot vs contract purchases (brief; link P11 for grapes)
  8. Regulatory heads-up (bond, permits; link P13)
  9. **Glossary** (15 to 20 terms: bulk, in bond, taxpaid, TIB, FOB, ABV, total SO₂, VA, declassified, custom crush, COLA, négociant, etc.)
  10. FAQs, CTA
- **FAQs:** Is bulk wine the same as box wine? *(No.)* · Is bulk wine cheaper? · How much is a "tank lot"? · Can I buy just a barrel? · What's the difference between bulk wine and juice?
- **Facts to source:** any container-size or typical-lot claims; TTB terms (bonded premises, taxpaid).
- **Hero image:** IMG-3 style: steel tanks/barrels.
- **CTA/links:** Browse Bulk Wine; link P2, P4, P5, P6, P13.

---

### P4: How to Buy Bulk Wine

- **H1:** How to Buy Bulk Wine: A Step-by-Step Guide
- **Slug:** `how-to-buy-bulk-wine`
- **Primary keyword:** how to buy bulk wine · **Secondary:** buying bulk wine, buy wine in bulk for a winery, bulk wine samples, bulk wine broker vs direct, bulk wine shipping, questions to ask bulk wine sellers
- **Demand tier:** B · **Intent:** informational/commercial · **Length:** 1,800 to 2,300 words
- **Meta title:** `How to Buy Bulk Wine: A Step-by-Step Buyer's Guide` (51)
- **Meta description:** `Define your spec, confirm permits, get samples and lab data, negotiate price per gallon and arrange transport. A step-by-step buying guide.` (139)
- **Quick answer:** To buy bulk wine, define your spec (varietal, vintage, appellation, volume, budget), confirm your permits, find sellers, request samples and lab analysis, negotiate price per gallon and delivery terms, sign a purchase agreement, arrange transport, and verify the wine on arrival.
- **Outline (numbered steps):**
  1. Define your spec (varietal, vintage, appellation, style, ABV range, volume, budget, timing)
  2. Confirm your legal status and permits (link P13)
  3. Find sellers: marketplaces, brokers, direct (pros/cons table; neutral tone)
  4. Request samples and lab analysis (what to ask for: ABV, total SO₂, VA, pH, TA, residual sugar, malolactic status)
  5. Evaluate: sensory, lab, stability, provenance; how to make sure the lot matches the sample
  6. Negotiate: price per gallon, minimum lot, FOB vs delivered, payment terms, timing, who pays for testing
  7. Contract and documentation (purchase agreement; transfer/bill of lading; state-specific requirements such as California's weighmaster certificate, verify)
  8. Logistics: tanker, flexitank, totes, pickup; cleanliness and cold-chain considerations
  9. Receive and verify: sample on arrival, compare to spec, address discrepancies
  10. What comes next: blending, aging, bottling, label approval (link P6)
- **Include:** a downloadable/printable **buyer checklist** (table) and **"20 questions to ask a bulk wine seller."**
- **FAQs:** How much can I buy? · Do I need a broker? · How do samples work? · Who pays for shipping? · What if the delivered wine doesn't match the sample?
- **Facts to source:** TTB transfer-in-bond/bill-of-lading documentation; California weighmaster requirement (verify current); broker process (e.g., Ciatti's public description).
- **Hero image:** wine sample glass or tank sampling (if a suitable free image exists), otherwise IMG-3 style.
- **CTA/links:** Browse Bulk Wine; "Set an alert."

---

### P5: Bulk Wine Prices Per Gallon

- **H1:** Bulk Wine Prices Per Gallon (2026): What You'll Actually Pay
- **Slug:** `bulk-wine-price-per-gallon`
- **Primary keyword:** bulk wine price per gallon · **Secondary:** bulk wine prices, bulk wine cost, cost of bulk wine per gallon, bulk cabernet price per gallon, bulk chardonnay price, bulk wine price index, bulk wine price per liter
- **Demand tier:** B · **Intent:** commercial research · **Length:** 1,600 to 2,200 words · **Refresh:** monthly
- **Meta title:** `Bulk Wine Price Per Gallon (2026): What Buyers Pay` (49)
- **Meta description:** `What drives bulk wine prices per gallon, how to read a quote (FOB vs delivered), and what recent market reports say about bulk prices in 2026.` (141)
- **Quick answer:** Bulk wine is priced per gallon, and the price depends heavily on varietal, vintage, appellation, and quality, plus current market conditions. `{{DATA NEEDED: dated, sourced ranges}}` Prices for premium appellations sit far above generic lots. Always compare quotes on the same basis (FOB or delivered).
- **Outline:**
  1. Quick answer with **dated, sourced** price ranges only (no numbers without sources). Use a table: category · example price range · source · date
  2. What drives price per gallon: varietal, appellation, vintage, quality tier, farming practice, quantity, timing, container, freight
  3. How to read a bulk wine quote: per gallon vs per liter; FOB vs delivered; ex-tax; sample-lot conformity
  4. **Converting to bottle cost** (reuse the illustrative table from P2; label as illustration)
  5. Market context: what trade reports say about 2025–2026 (oversupply, buyer's market; link P14). Include historical context clearly labeled (e.g., a 2024 report cited bulk prices for some wines falling from $30 to $40 per gallon in early 2023 to $10 to $15; verify with a primary source before using)
  6. Price differences by category (premium AVA reds vs generic whites) using **only sourced examples**
  7. Where to see live asking prices (HarvestLink `/bulk-wine`; place a **"HarvestLink asking-price snapshot"** module that only renders when ≥ 10 active bulk listings exist, showing anonymized aggregates with methodology and never any single seller's data)
  8. Negotiation tips
  9. FAQs, CTA
- **FAQs:** How much does bulk wine cost per gallon? *(answer with the sourced ranges and caveats)* · Why do quotes differ so much? · Is bulk wine priced per liter elsewhere? · Do prices include freight?
- **Facts to source:** latest **public** portions of Ciatti/Turrentine/Wine Business market reports; Wine Business "recent sales" pages if public; 2024 Wine Intelligence article (secondary; corroborate). SF Chronicle 2020 (historical only).
- **Hero image:** IMG-3 style tank/barrel.
- **Warning:** If public data can't be found for a category, say so rather than guess.

---

### P6: Private Label & White Label Wine

- **H1:** Private Label and White Label Wine: How to Launch a Brand With Bulk Wine
- **Slug:** `private-label-white-label-wine-bulk-wine`
- **Primary keyword:** white label wine · **Secondary:** private label wine, how to start a wine brand, start a wine label without a vineyard, négociant wine brand, custom label wine, bulk wine to private label, wine brand from bulk wine
- **Demand tier:** A · **Intent:** informational/commercial · **Length:** 2,000 to 2,600 words
- **Meta title:** `Private Label & White Label Wine: Launch a Brand` (47)
- **Meta description:** `How to start a wine brand without a vineyard: source bulk wine, understand permits, label approval and bottling, and see what it really costs.` (140)
- **Quick answer:** Private label or white label wine means selling wine under your own brand that someone else produced. Most brands source bulk wine, then bottle and label it themselves or through a licensed facility, after handling federal and state permits and label approval.
- **Outline:**
  1. Definitions: private label vs white label vs custom crush vs négociant vs contract production (table)
  2. The launch path (numbered): concept → sourcing bulk wine (link P4) → permits or a host facility → label design and approval → bottling → distribution
  3. Permits and label approval basics: TTB permit/bond, alternating proprietor or custom-crush host, COLA, state registration; who is responsible for label claims (TTB FAQ) (link P13)
  4. Cost framework (table of cost categories only; **no invented dollar amounts**): wine, bottling, glass, closure, label, packaging, freight, taxes, compliance, marketing, distributor margin
  5. Sourcing tips: what to specify to sellers; samples and consistency across vintages
  6. Pitfalls: label claims you can't support (organic/appellation/vintage rules), inconsistent supply, underestimating compliance
  7. When this model fits and when it doesn't
  8. Example walkthrough with illustrative per-bottle math (label as illustration)
  9. FAQs, CTA
- **FAQs:** Can I sell wine I didn't make? · Do I need a winery license? · What is a COLA? · How much bulk wine do I need to start? · What's a négociant?
- **Facts to source:** TTB wine FAQs (custom crush, bottler responsibility, bond/permit requirement), label-approval requirements, state rules `{{verify}}`.
- **Hero image:** IMG-5 style crush-pad/bins or tank room.
- **CTA/links:** Browse Bulk Wine; link P4, P5, P13.
- **Add** `reviewedBy` if the owner can arrange a compliance review.

---

### P7: Selling Bulk Wine Under NDA

- **H1:** Why Top Wineries Sell Bulk Wine Anonymously (and How NDA Listings Work)
- **Slug:** `selling-bulk-wine-under-nda`
- **Primary keyword:** sell bulk wine anonymously · **Secondary:** confidential bulk wine, NDA wine sale, sell surplus wine confidentially, why wineries sell bulk wine, anonymous wine marketplace, private wine listing, declassified wine
- **Demand tier:** C (differentiator; strong AI-answer potential) · **Intent:** informational · **Length:** 1,300 to 1,700 words
- **Meta title:** `Selling Bulk Wine Under NDA: How Confidential Listings Work` (59)
- **Meta description:** `Why wineries sell bulk wine anonymously, and how HarvestLink NDA listings hide the seller while buyers still see varietal, vintage, price and specs.` (146)
- **Quick answer:** Wineries often sell surplus or declassified wine without attaching their name, to protect brand positioning and pricing. On HarvestLink, "selling under NDA" hides the seller's name, winery, vineyard, and contact details, shows location only at region level, and routes buyer contact through the site so the seller controls what to reveal.
- **Outline:**
  1. Why sellers want confidentiality (brand protection, price positioning, contractual reasons); keep it general and factual
  2. What "selling under NDA" means on HarvestLink (from the product spec): what's hidden vs shown (table)
  3. How buyers evaluate a confidential lot: specs, samples, lab data; how contact works through the site; the seller decides what and when to reveal
  4. What "NDA" does and doesn't mean: it's a confidentiality setting on the listing; it is not itself a legal agreement between parties `{{CONFIRM with owner/counsel}}`
  5. Tips for sellers: don't identify yourself in descriptions or photos; choose location precision; use structured specs
  6. Tips for buyers: how to build confidence in an anonymous lot (samples, independent lab analysis, written specs)
  7. FAQs, CTA
- **FAQs:** Can buyers see who the seller is? · Is it legal to sell wine anonymously? *(carefully worded; link P13; no legal conclusions)* · Are NDA listings priced differently? · Can I switch a listing from NDA to public?
- **Facts to source:** must match the shipped NDA behavior (scope addendum Section 3). Don't claim more protection than the product provides.
- **Hero image:** IMG-4 (moody barrel room, no people).
- **CTA/links:** `/sell`; Browse NDA lots; link P2, P15.

---

### P8: How to Buy Wine Grapes (Pillar)

- **H1:** How to Buy Wine Grapes: A Buyer's Guide for Wineries and Winemakers
- **Slug:** `how-to-buy-wine-grapes`
- **Primary keyword:** how to buy wine grapes · **Secondary:** buy wine grapes, wine grapes for sale, buy wine grapes by the ton, where to buy wine grapes, wine grape brokers, commercial winemaking grapes, brix at harvest
- **Demand tier:** A · **Intent:** informational/commercial · **Length:** 2,000 to 2,600 words (pillar)
- **Meta title:** `How to Buy Wine Grapes: A Buyer's Guide (By the Ton)` (52)
- **Meta description:** `Learn how to source wine grapes by the ton: what to specify, how to compare vineyards, contracts, harvest logistics, and where to find lots.` (139)
- **Quick answer:** To buy wine grapes, decide your variety, region, volume, and quality specs; find growers or listings; compare price per ton, brix, farming practice, and harvest method; agree on contract terms; and plan picking, hauling, and receiving.
- **Outline:**
  1. Who buys grapes and how much (small-lot vs commercial; be honest that HarvestLink lots are commercial tonnage)
  2. Step-by-step: define spec → find sources → evaluate vineyards → negotiate → contract → harvest logistics → receiving and weighing
  3. What to specify: variety and clone, region/AVA, harvest year, tonnage, brix target, harvest method (hand vs machine), farming practice, delivery
  4. Vineyard details that affect quality: trellis, soil, exposure, slope, yield (tie to HarvestLink's filters; explain each in one plain sentence)
  5. Where to find grapes: growers, brokers, association marketplaces, HarvestLink
  6. Price basics (link P9) and contracts (link P11)
  7. Harvest logistics: timing, picking crews, hauling, weigh tags, receiving, sampling
  8. Buyer checklist (table)
  9. FAQs, CTA
- **FAQs:** How many tons do I need? · How much do wine grapes cost? (P9) · What is brix and why does it matter? · Can I buy grapes for home winemaking? *(be clear that HarvestLink lots are commercial-scale; point home winemakers to local sources)*
- **Facts to source:** brix/harvest basics (extension sources), CDFA data for P9 link, hauling/weighmaster rules (California, verify).
- **Hero image:** IMG-2 or IMG-5 (harvest bins).
- **CTA/links:** Browse Grapes; "Set an alert"; link P9, P10, P11, P12.

---

### P9: Wine Grape Prices Per Ton

- **H1:** Wine Grape Prices Per Ton (2026): What Wineries Pay by Variety and Region
- **Slug:** `wine-grape-prices-per-ton`
- **Primary keyword:** wine grape prices per ton · **Secondary:** price of wine grapes per ton, cabernet sauvignon grape price per ton, napa grape prices, grape crush report prices, average price per ton wine grapes, chardonnay price per ton
- **Demand tier:** A/B · **Intent:** research · **Length:** 1,700 to 2,300 words · **Refresh:** quarterly (and when new crush data lands)
- **Meta title:** `Wine Grape Prices Per Ton (2026): By Variety & Region` (52)
- **Meta description:** `What wine grapes cost per ton by variety and region, based on the latest official crush data, plus what's pushing prices in 2026.` (128)
- **Quick answer:** Wine grape prices vary enormously by variety and region, from hundreds of dollars per ton for some generic lots to many thousands for premium Napa Cabernet. `{{DATA NEEDED: latest CDFA final crush report averages, with year}}` Use official crush data for benchmarks and current market reports for direction.
- **Outline:**
  1. Quick answer with **sourced, dated** averages from the latest CDFA Grape Crush Report (final 2025 report, released spring 2026, verify) and USDA NASS where relevant. Table: district/region · average $/ton · year · source
  2. Why prices differ (variety, appellation, quality tier, yield, contracts vs spot, farming practice)
  3. Reading the Crush Report (district numbers, what average price means and doesn't)
  4. Market conditions 2025–2026: spot prices below break-even for many growers; oversupply; vineyard removals; light 2025 crop (cite trade and lender sources; link P14). Use **paraphrase**; never overstate.
  5. Historical context (label the years clearly): e.g., the 2023 report showed record Napa Cabernet averages (verify with primary source); contrast with 2025–2026 conditions
  6. Price per ton → price per gallon/bottle conversions (use P10 math; label as illustration)
  7. How to find current asking prices (HarvestLink `/grapes`; anonymized aggregate snapshot only when enough listings exist)
  8. FAQs, CTA
- **FAQs:** What is the average price per ton of wine grapes? · Why is Napa so much higher? · Are prices falling in 2026? · What's a spot price vs a contract price? · Where can I find the Crush Report?
- **Facts to source:** CDFA Grape Crush Report (primary); USDA NASS; AgWest Farm Credit 2026 outlook; Turrentine/Ciatti public commentary; Vinetur (Sept 2026) on harvest and contracting; Napa Valley Focus summary of the 2023 report (secondary; corroborate with CDFA).
- **Hero image:** IMG-2 (grape cluster) or harvest bins.
- **Warning:** No numbers without sources. If the final 2025 report isn't retrievable, say which report you used and its date.

---

### P10: How Many Gallons of Wine Does a Ton of Grapes Make? (With Calculator)

- **H1:** How Many Gallons of Wine Does a Ton of Grapes Make? (With Free Calculator)
- **Slug:** `gallons-of-wine-per-ton-of-grapes`
- **Primary keyword:** how many gallons of wine per ton of grapes · **Secondary:** how many bottles of wine per ton of grapes, how many grapes to make a bottle of wine, cases per ton, gallons per ton conversion, tons of grapes per acre, grape to wine calculator
- **Demand tier:** A · **Intent:** informational/tool · **Length:** 1,000 to 1,500 words + calculator
- **Meta title:** `Gallons of Wine Per Ton of Grapes (Free Calculator)` (51)
- **Meta description:** `A ton of grapes makes about 150 to 165 gallons of wine, depending on variety and pressing. Free calculator: tons to gallons, cases and bottles.` (143) `{{VERIFY the range against 2+ authoritative sources before publishing}}`
- **Quick answer:** A ton of wine grapes typically yields about 150 to 165 gallons of wine (roughly 60 to 70 cases of 12 bottles), depending on variety, ripeness, and how hard the grapes are pressed. `{{VERIFY with extension/university sources and adjust}}`
- **Outline:**
  1. Quick answer + calculator at the top
  2. **Calculator spec (build it):** client-side component with server-rendered default result. Inputs: tons of grapes; gallons per ton (default from the verified range; adjustable slider); optional wine type (red/white) if sources support different defaults. Outputs: gallons, liters, 750 mL bottles, 12-bottle cases, 59.4-gal (225 L) barrels. Reverse mode: cases wanted → tons needed. Show the formula. Accessible labels, keyboard-friendly, works without JS for the default example.
  3. Conversion constants (arithmetic, no sourcing needed): 1 US gal = 3.78541 L; 750 mL bottle → 5.048 bottles/gal; 12-bottle case = 9 L = 2.378 gal; 225 L barrel ≈ 59.4 gal
  4. Why yields vary: variety, cluster size, juice vs must, pressing method, red vs white, losses in racking/filtration
  5. Related numbers: grapes per bottle, tons per acre (cite; ranges vary widely by region)
  6. Worked examples: 5 tons; 20 tons; 100 tons
  7. Turn tons into a price per gallon: link P9 and P5 (illustration only)
  8. FAQs, CTA
- **FAQs:** How many pounds of grapes in a bottle of wine? · How many bottles from a ton? · How many barrels from a ton? · Do reds and whites differ? · How many tons per acre?
- **Facts to source:** university extension or industry sources for gal/ton and cases/ton; tons per acre ranges.
- **Hero image:** IMG-5 style bins or hands with grapes.
- **Extra:** Add `SoftwareApplication` or `WebApplication` JSON-LD only if accurate; otherwise skip.

---

### P11: Spot Market vs Forward Contracts for Wine Grapes

- **H1:** Spot Market vs Forward Contracts for Wine Grapes: What Buyers and Growers Should Know
- **Slug:** `wine-grape-contracts-spot-vs-forward`
- **Primary keyword:** wine grape contracts · **Secondary:** grape purchase agreement, forward contract wine grapes, spot market grapes, multi-year grape contract, grape contract terms price per ton, grape contract template
- **Demand tier:** B/C · **Intent:** informational · **Length:** 1,500 to 2,000 words
- **Meta title:** `Wine Grape Contracts: Spot vs Forward Explained` (46)
- **Meta description:** `How spot and forward wine grape contracts differ, what terms to include (tonnage, price per ton, brix, delivery), and how to plan multi-year supply.` (147)
- **Quick answer:** A spot purchase buys grapes for the current harvest at today's negotiated price, while a forward (multi-year) contract locks in tonnage and pricing terms in advance. Forward contracts add predictability for both sides; spot deals add flexibility, especially in a changing market.
- **Outline:**
  1. Definitions: spot vs forward vs multi-year vs block-specific contracts (table: pros/cons for buyers and growers)
  2. Why the market is shifting toward caution on multi-year commitments (2025–2026 context; link P14; cite Ciatti/others)
  3. **Contract terms checklist** (table): parties, block/vineyard, variety, tonnage (fixed or range), price per ton (fixed/indexed), quality specs (brix range, pH/TA if used), harvest method and timing, weighing and receiving, sampling and rejection, payment terms, term/renewal, force majeure, dispute resolution
  4. Pricing structures: fixed, tiered by brix, indexed to reports (explain neutrally)
  5. Planning ahead: how crop planning tools help (HarvestLink's planner/alerts; describe only features that exist)
  6. Red flags and pitfalls
  7. **"Not legal advice"** callout; recommend counsel
  8. FAQs, CTA
- **FAQs:** How long do grape contracts last? · What is a spot price? · Can a buyer reject fruit? · What if there's a crop loss? · Should I lock in prices in a down market?
- **Facts to source:** industry sources on contracting trends (e.g., Ciatti/Turrentine public commentary; lender outlooks).
- **Hero image:** IMG-6 (vine canopy) or handshake-free harvest scene.
- **CTA/links:** Browse Grapes; planning/alerts.

---

### P12: Organic, Biodynamic, Natural, Sustainable & Regenerative Organic: What the Labels Mean

- **H1:** Organic, Biodynamic, Natural, Sustainable and Regenerative Organic Wine: What the Labels Actually Mean for Buyers
- **Slug:** `organic-biodynamic-sustainable-regenerative-wine-labels`
- **Primary keyword:** organic vs biodynamic wine · **Secondary:** what is biodynamic wine, regenerative organic wine, Demeter certified biodynamic, natural wine meaning, sustainable winegrowing certification, organic grapes for sale, biodynamic grapes for sale
- **Demand tier:** A (consumer-heavy; write for the trade buyer) · **Intent:** informational · **Length:** 1,800 to 2,400 words
- **Meta title:** `Organic vs Biodynamic vs Regenerative Wine Labels Explained` (58)
- **Meta description:** `What organic, biodynamic, natural, sustainable and regenerative organic mean, which are certified, and what to ask when buying grapes or bulk wine.` (146)
- **Quick answer:** Organic, biodynamic, and regenerative organic are certified farming standards with third-party audits; "sustainable" ranges from certified programs to self-declared claims; "natural" has no legal definition. When buying grapes or bulk wine, ask for certification documents rather than relying on labels.
- **Outline:**
  1. Quick comparison table: practice · certified? · who certifies (verify) · what it covers · what to ask the seller
  2. **Organic**: farming vs winemaking; how "organic wine" and "made with organic grapes" differ under USDA rules, including sulfite limits (**verify current USDA NOP rules and cite**)
  3. **Biodynamic** and **Demeter Certified Biodynamic** (what Demeter certifies; verify)
  4. **Regenerative Organic** (Regenerative Organic Certified; what it adds; verify)
  5. **Sustainable** (programs like SIP Certified, Lodi Rules, CCOF programs, Napa Green, California Sustainable Winegrowing; verify each before naming)
  6. **Natural** (no legal definition; what people usually mean; why you need specifics)
  7. Why buyers care (brand story, market access, cost) **without health claims**
  8. How HarvestLink handles these: the six filter options; seller-declared unless verified; how to request documentation
  9. Buyer checklist: documents to request (certificates, scope, expiry, lot traceability)
  10. FAQs, CTA
- **FAQs:** Is organic wine sulfite-free? *(cite USDA rules)* · Is biodynamic the same as organic? · Is "natural wine" regulated? · What does Demeter certify? · How can I verify a certification?
- **Facts to source:** USDA NOP organic wine labeling; Demeter USA; Regenerative Organic Alliance; SIP, Lodi Rules, CCOF, Napa Green.
- **Hero image:** IMG-6 (vine canopy, cover crop between rows if available).
- **CTA/links:** `/grapes/farming/organic`, `/bulk-wine/farming/regenerative-organic` (when live); P8, P3.

---

### P13: Who Can Legally Buy Bulk Wine?

- **H1:** Who Can Legally Buy Bulk Wine? TTB Permits, Bonded Premises and Transfers in Bond Explained
- **Slug:** `who-can-buy-bulk-wine-ttb-permits-bond`
- **Primary keyword:** buy bulk wine legally · **Secondary:** TTB bulk wine, transfer in bond wine, bonded winery, TTB basic permit wine, taxpaid wine bottling house, COLA label approval, weighmaster certificate wine California, bulk wine license
- **Demand tier:** C (high trust; high citation value) · **Intent:** informational/compliance · **Length:** 1,800 to 2,400 words · **Refresh:** quarterly
- **Meta title:** `Who Can Buy Bulk Wine? TTB Permits & Bond Basics` (48)
- **Meta description:** `A plain-English overview of U.S. rules for buying bulk wine: TTB permits, bonded premises, in-bond transfers, labeling, and state requirements.` (142)
- **Quick answer:** In the U.S., anyone conducting wine operations other than as a home winemaker must establish premises, obtain a bond, and get permission from TTB. Bulk wine typically moves between bonded premises with transfer records, and state rules add requirements. This is a general overview, not legal advice.
- **Outline:**
  1. Callout: educational information, not legal advice; consult a licensed professional `{{CONFIRM reviewer}}`
  2. Who this affects: wineries, brands, custom-crush clients, importers, individuals
  3. Federal basics: TTB permits, bond, premises; home winemaker exemption (link TTB wine FAQ)
  4. **In-bond vs taxpaid** wine and why it matters
  5. Transfers in bond: documentation (bill of lading/transfer records; cite TTB and compliance sources)
  6. Bottling and labeling: bottler responsibilities, COLA/label approval basics, custom crush and alternating proprietors
  7. **State layer:** licensing, tax, reporting; California weighmaster certificate (verify current); "check your state ABC agency"
  8. Importing bulk wine (brief; TTB procedures; only what you can source)
  9. Practical checklist before you buy
  10. FAQs; how HarvestLink relates (marketplace for listings; HarvestLink does not provide legal advice and `{{CONFIRM: is not a party}}`)
- **FAQs:** Can I buy bulk wine as an individual? · Do I need a TTB permit to buy bulk wine? · What is an in-bond transfer? · Do I need a COLA? · Does California require a weighmaster certificate?
- **Facts to source:** TTB wine FAQs and requirements pages (primary); TTB wine procedures; compliance-education sources; verify every rule and date. Older law-firm or compliance articles (e.g., 2016, 2018) may be outdated; use only to locate topics, then confirm on primary sources.
- **Hero image:** none needed beyond a clean tank/cellar image (IMG-3 style); avoid legalistic stock imagery.
- **Guardrail:** Do not state conclusions about specific transactions. Describe, cite, and recommend professional advice.

---

### P14: The 2026 Wine Grape Glut

- **H1:** The 2026 Wine Grape Glut: Why It's a Buyer's Market for Grapes and Bulk Wine (and How Long It May Last)
- **Slug:** `2026-wine-grape-oversupply-buyers-market`
- **Primary keyword:** wine grape oversupply 2026 · **Secondary:** bulk wine market 2026, wine glut, California grape harvest 2026, wine grape prices falling, vineyard removal, buyer's market bulk wine, wine industry downturn
- **Demand tier:** B (news/trend; likely to spike in harvest season) · **Intent:** informational/news · **Length:** 1,300 to 1,800 words · **Refresh:** monthly
- **Meta title:** `2026 Wine Grape Glut: Is It a Buyer's Market?` (46)
- **Meta description:** `Oversupply, vineyard removals and a fast 2026 harvest are reshaping the grape and bulk wine markets. What it means for buyers and sellers right now.` (147)
- **Quick answer:** Trade and lender reports describe a prolonged downturn: oversupply, elevated bulk inventories, and weak demand have pressured grape prices and winery cash flow, which favors buyers. But vineyard removals and a lighter, earlier 2026 harvest may narrow some segments, so timing and specificity matter.
- **Outline (all claims paraphrased and sourced):**
  1. Quick answer + "as of {date}" stamp
  2. **What's happening:** oversupply and elevated inventories (AgWest Farm Credit 2026 outlook); winery surveys showing many report excess wine (SVB 2026 report via Wine Enthusiast: about 15% "extremely excessive," nearly 45% above what they need; verify); light 2025 crop and below-break-even spot prices (Turrentine)
  2. **The 2026 harvest:** warm spring, earlier development, lighter yields; harvest potentially ~80% complete by late September per trade reporting (Vinetur, Sept 14, 2026); Ciatti's view that weak case-goods sales remain the core issue; cautious buyer activity
  3. **Why it's a buyer's market, and where it isn't:** acreage removal (tens of thousands of acres reported removed; cite) may reduce supply in specific appellations/styles; sellers needing cash or tank space may liquidate quickly (Vinetur, June 2026)
  4. **What buyers can do now:** compare lots quickly, lock in sources for specific needs, consider contracts carefully (link P11), check quality (link P4)
  5. **What sellers can do now:** price realistically, provide lab data and samples, consider confidential listing (link P7, P15)
  6. What to watch next (crush report, case-goods depletions, bulk inventory reports)
  7. FAQs, CTA
- **FAQs:** Is it a good time to buy bulk wine? · Are wine grape prices going down in 2026? · Why is there a wine glut? · How many acres of vines have been removed? · When will the market recover?
- **Facts to source:** AgWest Farm Credit (agwestfc.com wine-vineyard outlook); Vinetur June 9, 2026 and Sept 14, 2026 articles; Wine Enthusiast on SVB 2026 report; Turrentine (Wine Industry Network); Ciatti public commentary; CDFA final 2025 crush. **Use only what sources state; note their dates.**
- **Hero image:** autumn vineyard rows at harvest (IMG-1 variant). Do not use imagery that portrays a specific grower's unharvested crop.
- **Guardrail:** Neutral tone. Not investment advice. No predictions stated as facts.

---

### P15: How to Sell Bulk Wine or Wine Grapes

- **H1:** How to Sell Bulk Wine or Wine Grapes: Pricing, Listing Tips and Selling Confidentially
- **Slug:** `how-to-sell-bulk-wine-or-wine-grapes`
- **Primary keyword:** sell bulk wine · **Secondary:** sell wine grapes, how to sell excess wine, sell surplus wine, list bulk wine for sale, sell unsold wine grapes, bulk wine listing tips
- **Demand tier:** B · **Intent:** commercial/informational (seller acquisition) · **Length:** 1,600 to 2,200 words
- **Meta title:** `How to Sell Bulk Wine or Wine Grapes: A Seller's Guide` (53)
- **Meta description:** `Price your lot, prepare samples and lab data, write a listing that gets inquiries, and decide whether to sell openly or confidentially under NDA.` (144)
- **Quick answer:** To sell bulk wine or grapes, know your lot's specs, price it against current market data, prepare samples and lab analysis, write a clear listing with structured details, and choose whether to sell openly or confidentially. Respond quickly to inquiries and be ready to ship or hand off.
- **Outline:**
  1. Who this is for: growers, wineries with surplus/declassified lots, brands with excess inventory
  2. Before you list: know your spec (varietal, vintage, appellation, ABV, total SO₂, farming practice, quantity, location, container)
  3. **Pricing:** how to benchmark (links P5, P9, P14); avoid guesswork; leave room to negotiate; explain price per gallon/ton
  4. Lab data and samples: what buyers ask for and why they speed up sales
  5. **What a great listing includes** (checklist mirroring HarvestLink's fields, including single-vineyard, farming practice, sulfites, location)
  6. **Selling confidentially:** how NDA works, what to avoid in photos/descriptions (link P7)
  7. Photos: what helps (tanks, barrels, sample), what to avoid (labels, signage)
  8. Handling inquiries: response time, sample logistics, terms, paperwork (link P4, P13 from the seller's side)
  9. Timing: seasonality (grapes at harvest; bulk wine post-harvest and spring) `{{verify with sources}}`
  10. FAQs, CTA
- **FAQs:** How do I price bulk wine? · Do I need lab analysis? · Can I list under NDA? · How fast do lots sell? *(don't claim numbers)* · What if my grapes went unsold?
- **Facts to source:** market context from P14/P5/P9; TTB/state basics for seller obligations (cite).
- **Hero image:** IMG-5 or IMG-3.
- **CTA/links:** `/sell` (primary); P7, P5, P9, P14.

---

## 7. Backlog (Posts 16+; write later, in roughly this order)

1. **What do "total sulfites (ppm)" mean in wine?** (`sulfites in wine ppm`, `total SO2 in wine`)
2. **Custom crush explained: how to make wine without a winery** (`custom crush`, `how to start a winery without equipment`)
3. **How much does it cost to start a winery or wine brand?** (`cost to start a winery`)
4. **What is brix and why does it matter at harvest?** (`what is brix wine`)
5. **How to read the California Grape Crush Report** (`grape crush report`)
6. **Bulk wine shipping: tankers, flexitanks, totes and barrels compared** (`bulk wine shipping`)
7. **How to evaluate bulk wine samples and lab analysis** (`bulk wine lab analysis`)
8. **Napa vs Sonoma vs Paso Robles vs Central Valley: grape and bulk wine price differences** (`napa vs sonoma grape prices`) *(only with sourced data)*
9. **Wine grape varieties for commercial winemaking: a buyer's cheat sheet** (`wine grape varieties list`)
10. **What is a négociant? History and modern use** (`négociant meaning`)
11. **Buying organic wine grapes and bulk wine: a checklist**
12. **Bulk wine imports vs domestic: what buyers should consider** *(only with sourced data)*

---

## 8. Source Starter List (Verify Every One; Retrieval Dates Required)

These are starting points I found while researching on Sept 19, 2026. Treat them as leads. Read them, confirm the facts, and cite them properly. Several are secondary sources; corroborate with primary sources where noted.

| Topic | Source | Use for |
|---|---|---|
| 2026 market outlook (lender) | AgWest Farm Credit, "Wine and Wine Grapes" industry insight: `https://www.agwestfc.com/education-and-resources/industry-and-economic-insights/industry-insights/wine-vineyard` | P14, P9: prolonged downturn, oversupply, elevated bulk inventories heading into 2026 |
| Buyers' options, acreage removals, early 2026 season | Vinetur, June 9, 2026: `https://www.vinetur.com/en/20260609102335/californias-wine-buyers-face-fewer-options-despite-ample-bulk-supplies.html` | P14 |
| 2026 harvest progress; Ciatti commentary | Vinetur, Sept 14, 2026: `https://www.vinetur.com/en/20260914107081/californias-2026-winegrape-harvest-could-be-80-complete-by-late-september-squeezing-contract-talks.html` | P14, P11 |
| Winery inventory survey | Wine Enthusiast on SVB's 2026 State of the U.S. Wine Industry report: `https://www.wineenthusiast.com/culture/industry-news/svb-state-of-wine-industry-report-2026/` | P14 |
| Brokerage commentary on 2025 crush/spot prices | Turrentine Brokerage (Wine Industry Network): `https://www.wineindustrynetwork.com/c/turrentine-brokerage` | P9, P14 |
| Trade news hub for grapes & bulk wine | Wine Business "Grapes & Bulk Wine": `https://www.winebusiness.com/classifieds/grapesbulkwine/` | P5, P9, P14 (market headlines) |
| Historical bulk pricing example | SF Chronicle, April 2020: `https://www.sfchronicle.com/wine/article/Top-tier-Napa-Cab-for-10-With-bulk-wine-prices-15201102.php` | P2, P5 (historical only, labeled 2020) |
| Bulk price decline (secondary) | Wine Intelligence, Nov 2024: `https://wine-intelligence.com/blogs/wine-news-insights-wine-intelligence-trends-data-reports/california-s-wine-crisis-overproduction-and-falling-demand-threaten-the-industry` | P5, P14 (corroborate with a primary source) |
| 2023 Crush Report summary (secondary) | Napa Valley Focus: `https://napavalleyfocus.substack.com/p/napa-valley-grape-prices-see-continued` | P9 historical context (corroborate with CDFA) |
| How brokers describe the bulk process | Ciatti, "Buy or Sell Bulk Wine Globally": `https://ciatti.com/products/bulk-wine/` | P4 (process description) |
| Federal wine operations rules | TTB Wine FAQs: `https://www.ttb.gov/regulated-commodities/beverage-alcohol/wine/wine-faqs` | P13, P6 |
| Winery permit requirements | TTB "Requirements: Wineries": `https://www.ttb.gov/business-central/requirements-wineries` | P13 |
| TTB wine procedures | `https://www.ttb.gov/regulated-commodities/beverage-alcohol/wine/procedures` | P13 |
| Bulk wine documentation (older) | Wine Compliance Alliance, 2016: `https://winecompliancealliance.com/purchase-bulk-wine-heres-how-to-document-it-to-meet-ttb-ca-requirements/` | P4, P13: locate topics only; **verify current requirements** on primary sources |
| **To retrieve** | CDFA Grape Crush Report (final 2025); USDA NASS; USDA NOP organic wine labeling; Demeter USA; Regenerative Organic Alliance; SIP Certified; Lodi Rules; CCOF; Napa Green; university extension (UC Davis, Cornell, WSU, Oregon State) for yield per ton, brix, tons per acre | P9, P10, P12 |

Competitor pages to study (for gaps, not to copy): Ciatti, Turrentine, North Coast Winegrape Brokers, IGGPRA marketplace, Lake County Winegrape Commission marketplace, Oregon Wine Industry marketplace, Wine Business classifieds.

---

## 9. Definition of Done

- [ ] All 15 posts written per their briefs, in `content/blog/`, `status: needs-review`, with valid front matter.
- [ ] Every post passes the post-level QA in Section 2.
- [ ] `docs/blog-fact-check-log.md` complete: every claim mapped to a source URL and access date; unresolved items marked.
- [ ] No fabricated data; every `{{CONFIRM}}` / `{{DATA NEEDED}}` / `{{VERIFY}}` is either resolved or listed in `docs/seo-open-items.md`.
- [ ] P10 calculator built, accessible, tested, with a verified default range and sources.
- [ ] Internal links match the Section 4.4 map; all links resolve.
- [ ] Hero images selected and logged per the SEO spec (Section 8), with alt text.
- [ ] Meta titles and descriptions within limits (lint passing); JSON-LD valid.
- [ ] NDA canary test still green; no real seller data appears in any post or example.
- [ ] Owner review pack delivered: a one-page summary of open questions and the recommended publishing order (Section 4.2).
