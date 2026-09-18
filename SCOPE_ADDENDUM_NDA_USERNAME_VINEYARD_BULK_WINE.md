# Scope Addendum: NDA Listings, Usernames, Vineyard Field & Bulk Wine Listings

**Project:** Bulk wine grape & bulk wine classifieds website
**Audience:** AI coding agent (and the human reviewing its work)
**Status:** New build requirements, added on top of the existing site

---

## 0. How to Use This Document

1. **Read the whole document before writing code.** Requirements interact. The NDA feature in particular touches almost every surface of the site.
2. **Do Phase 0 (Audit) first.** Report your findings before building. Do not assume how the existing site works. Verify it.
3. **Requirement IDs** (e.g., `NDA-4`, `USR-2`) exist so the project owner can reference them in follow-up messages. Keep them in commit messages and PR descriptions.
4. **Keywords:** MUST / MUST NOT = mandatory. SHOULD = do it unless you have a documented reason not to. MAY = optional.
5. **This spec is stack-agnostic.** Schema and code samples are conceptual. Adapt them to the existing framework, ORM, naming conventions, and folder structure. Do not introduce a new framework or major dependency without written justification.
6. **When something is ambiguous or a decision isn't covered here:** pick the *safest, most privacy-preserving, most backward-compatible* option, note it in `docs/scope-addendum-decisions.md`, and keep going. Do not silently guess, and do not stall on small questions. See Section 10 for known open questions.
7. **Do not build anything in Appendix B** (the parking lot) without explicit approval.

### The four new requirements at a glance

| # | Requirement | One-line summary |
|---|---|---|
| 1 | **NDA listings** | Seller can mark a listing "Selling under NDA?" so their identity is anonymized everywhere the public can see. |
| 2 | **Usernames** | Signup collects a username + email + password. Username is a future forum handle. |
| 3 | **Vineyard field** | Single-vineyard listings get a free-text vineyard name field. |
| 4 | **Two listing types** | Site becomes two mirrored marketplaces: **Grapes** (existing) and **Bulk Wine** (new, priced per gallon, with its own fields). |

---

## 1. Ground Rules (Apply to Everything)

| Rule | Detail |
|---|---|
| **Server is the source of truth** | All validation and all privacy/redaction is enforced server-side. Client-side validation is UX only. Never rely on hiding something in the UI. |
| **Allowlist, not blocklist** | Anything shown publicly is built from an explicit allowlist of safe fields. New fields added later are private by default. |
| **Additive & backward compatible** | Existing listings, users, URLs, saved searches, and emails must keep working. No data loss. Migrations must be reversible. |
| **Reuse over duplicate** | One listing-form framework and one set of listing components, driven by a per-type field configuration. Do not copy/paste the grapes flow into a second codebase. |
| **Ship behind feature flags** | `feature.nda_listings`, `feature.bulk_wine`, `feature.usernames`. Merge dark, enable per environment. |
| **Small, reviewable commits** | One requirement per PR/commit group where possible. Each includes its tests. |
| **Everything new is tested** | See Section 8. A requirement isn't done until its acceptance criteria and tests pass. |
| **Controlled inputs everywhere except a few** | Free text is a data-quality and privacy risk. Use dropdowns, checkboxes, and validated numeric inputs. The **vineyard name** is the deliberate exception (see Section 5), plus the existing title/description fields. |

---

## 2. Phase 0: Audit (Do This Before Coding)

Produce a short written report at `docs/scope-addendum-audit.md` answering each item below. Flag anything surprising.

### 2.1 Stack & conventions
- [ ] Framework, language, ORM, DB engine, migration tool, test framework, CI, hosting/CDN, search engine (if any), email provider, image storage.
- [ ] How forms, validation, and API serialization are currently done (so new code matches).

### 2.2 Auth & users
- [ ] Current signup/login flow, user table schema, password hashing algorithm and parameters, email verification, password reset, session handling, rate limiting.
- [ ] Is there any existing "username", "display name", or "business name" field on the user/profile? What does the public currently see as the seller's identity?

### 2.3 Listings
- [ ] Current listing schema, all fields, units (I expect **tons** and **price per ton**. Verify), statuses (draft/active/sold/expired?), and expiry/renewal logic.
- [ ] **Is there already a vineyard field?** (Requirement 3 depends on this.) What type is it (free text, dropdown, relation)?
- [ ] Is there already a farming-practice field on grapes? What are its values?
- [ ] How varietal, appellation/AVA, region, and location are currently modeled (free text vs. lookup tables).
- [ ] Listing URL structure and slug generation.

### 2.4 Every place seller identity can appear (critical for NDA)
Search the entire codebase and list every location that reads seller name, business name, username, email, phone, website, avatar, seller ID, seller profile URL, vineyard, or address:
- [ ] Page templates/components (cards, detail pages, browse pages, seller profile pages)
- [ ] API serializers/endpoints (public and authenticated)
- [ ] Search index, autocomplete, "similar listings," "more from this seller"
- [ ] URLs and slugs, sitemap, RSS/feeds, canonical tags
- [ ] `<title>`, meta description, Open Graph/Twitter cards, JSON-LD structured data
- [ ] Image upload pipeline: filenames, storage paths, EXIF handling, alt text
- [ ] Emails and notifications (From name, signature, reply-to, subject lines)
- [ ] How buyers contact sellers today (form? shown email/phone? messaging?)
- [ ] Favorites/saved searches/alerts, share links, print views, CSV/PDF exports
- [ ] Admin screens, analytics events, logs, error reports
- [ ] Caching layers (CDN, page cache, search cache)

### 2.5 Impact list
- [ ] Every feature that references listings and must become **listing-type-aware** (favorites, alerts, emails, dashboards, admin, exports, analytics, sitemap, "my listings," expiry jobs).

**Deliverable:** the audit report plus a proposed migration plan. Continue to Phase 1 unless something in the audit contradicts this spec. If so, flag it.

---

## 3. Requirement 1: NDA Listings ("Selling Under NDA?")

### 3.1 Intent
Some sellers can't have their name or vineyard associated with a sale. When a seller marks a listing as under NDA, **the public must not be able to learn who the seller is** from any surface of the site, and the platform must not accidentally leak it. Identity remains known to the platform, the listing owner, and admins.

> Note: this feature is a *confidentiality* feature. The platform does not create or enforce a legal NDA between buyer and seller (see Open Questions).

### 3.2 Requirements

**NDA-1: UI control**
- Add a checkbox/toggle labeled exactly **"Selling under NDA?"** to the listing form for **both** listing types.
- Default: **OFF**. Placed in the top "Seller & Source" section of the form, near the vineyard field.
- Helper text (see Appendix A for full copy): *"Your name, business, and vineyard will be hidden from buyers. Buyers contact you through the site."*
- When toggled ON, show an inline **"What buyers will see"** panel listing what is hidden and what stays visible (see NDA-3). It updates live.
- The control must be keyboard accessible, have a visible label (not placeholder-only), and the help text must be readable on mobile without hover.

**NDA-2: Data model**
- `listings.is_nda` boolean, NOT NULL, default `false`, indexed.
- `listings.nda_location_precision` enum (`county`, `state`), default `county`. Controls how precisely location is shown publicly on NDA listings.
- Every change to `is_nda` writes an audit-log row: listing ID, old → new, actor, timestamp. Do not log seller identity in the entry beyond the actor's internal user ID.

**NDA-3: What is hidden vs. visible on an NDA listing**

| Data | Normal listing | NDA listing (public view) | Who can still see the real value |
|---|---|---|---|
| Seller name / business name | Shown | **"Confidential Seller"** | Owner, admins |
| Seller username & profile link | Shown | **Hidden. No link, no profile.** | Owner, admins |
| Seller avatar / logo | Shown | Generic placeholder | Owner, admins |
| Vineyard name (if single vineyard) | Shown | **Hidden.** Shows "Single vineyard (name withheld)" | Owner, admins |
| Exact address / coordinates | Per existing behavior | **Never shown** | Owner, admins |
| Public location | Per existing behavior | Reduced to county/region or state (seller's choice via `nda_location_precision`) | Owner, admins |
| Seller email / phone / website / social | Per existing behavior | **Hidden.** Contact only via on-site inquiry | Owner, admins |
| Other listings by same seller | Linked | **Not linked or correlated** to this listing | Owner, admins |
| Uploaded documents (certificates, lab reports, if any exist) | Per existing behavior | **Private.** Never public | Owner, admins |
| Varietal, vintage, quantity, price, ABV, sulfites, farming practices, general region, description | Shown | **Shown** | Everyone |

**NDA-4: Enforcement architecture (most important requirement)**
- Implement **one central public-listing serializer/DTO** that every public surface uses (pages, API, search index, emails, feeds). It takes a listing and a *viewer context* (anonymous, other user, owner, admin) and returns only allowed fields. The NDA branch lives here, once.
- Redaction MUST happen on the server before data is sent. Verify with "view source" and the network tab. The hidden values must not be present in HTML, JSON, or hydration payloads. CSS/JS hiding is a failure.
- Public responses MUST NOT include the seller's internal user ID or any stable identifier for NDA listings.
- Do not scatter `if (listing.is_nda)` checks across templates. If you find yourself doing that, route it through the serializer instead.

**NDA-5: Leak vector checklist (each must be handled and tested)**

| Vector | Required handling on NDA listings |
|---|---|
| **URL / slug** | Slug built only from safe fields (varietal, vintage, region, listing ID). Never seller or vineyard names. |
| **Page title, meta description, OG/Twitter cards, canonical** | No seller/vineyard data. |
| **JSON-LD / structured data** | Omit seller, brand, organization, and vineyard entirely. |
| **Sitemap, RSS, feeds** | Only anonymized URLs/titles. |
| **Site search & autocomplete** | Seller name, username, and vineyard name of NDA listings MUST NOT be indexed or searchable. Searching "Smith Vineyards" must not surface an NDA listing from Smith Vineyards. |
| **Vineyard typeahead (Req. 3)** | Never suggests vineyard names from other users' NDA listings. |
| **"More from this seller" / "Similar listings" / seller profile pages** | NDA listings excluded from any seller-centric grouping. |
| **Sort/filter by seller** | Must not be possible for NDA listings. |
| **Images** | Strip EXIF (GPS, camera, owner tags) on upload. Rename files to random IDs (no original filenames). Storage/CDN paths contain no seller identifiers. Alt text auto-generated from safe fields only. |
| **Emails & notifications** | From-name/signature/subject use "Confidential Seller." Reply-to routes through the platform. |
| **Contact/inquiry flow** | See NDA-7. |
| **Share links, print view, PDF/CSV export** | Same redaction (they use the same serializer). |
| **Error pages & API behavior** | Don't reveal seller via 403-vs-404 differences or verbose errors. |
| **Analytics/logging/error reporting** | Do not send seller identity with events tied to public NDA listing views. |
| **Caching** | Purge page/CDN/search caches whenever `is_nda` changes or the listing is edited (see NDA-8). |
| **Admin** | Admins MAY see identity (see NDA-11). |

**NDA-6: Free-text leak guard**
Titles and descriptions are the most common accidental leak. When `is_nda = true`, on save and publish the server MUST:
1. **Block** (with a clear message pointing to the offending text) if the title/description/any free-text field contains the seller's own identifying strings: business name, display name, username, email address/domain, phone number, website domain, and any vineyard name the seller has entered on any of their listings. Comparison is case-insensitive and ignores punctuation/spacing.
2. **Block** any email address, phone number, or URL pattern in free text on NDA listings (prevents contact-info bypass and accidental identity leaks).
3. Show the seller a plain-language reminder: *"Avoid mentioning your winery, vineyard, brand, or anything else that identifies you, including in photos."* This guard is a safety net, not a guarantee.

**NDA-7: Buyer ↔ seller contact**
- NDA listings MUST NOT show direct contact info.
- Buyers reach the seller via an on-site inquiry (form/message) that relays to the seller.
- **Audit first (Phase 0).** If a platform-mediated inquiry/messaging system already exists, use it. If it does not, build the *minimum* viable relay (buyer submits inquiry → seller is notified by email with a link to view/reply in the site → replies delivered to buyer without exposing the seller's email address). **Flag this as a scope expansion to the project owner** before building beyond the minimum.
- Sellers may choose to reveal themselves inside a conversation by typing it. That's their decision. The platform doesn't prevent it in private messages.

**NDA-8: Toggling on existing listings**
- **Turning NDA ON** for a live listing: confirmation modal (*"Buyers may already have seen this listing's seller details. Making it confidential now hides them going forward but can't erase copies others may have saved."*). On confirm: regenerate an anonymized slug, purge all caches, reindex, remove from seller-centric pages. The **old URL returns 404** (do NOT redirect it. A redirect would confirm the connection).
- **Turning NDA OFF**: confirmation modal (*"Your name/business/vineyard will become publicly visible on this listing. This can't be undone for anything already seen or crawled."*). Requires explicit confirmation.

**NDA-9: Anonymous label**
- Public seller label on NDA listings: **"Confidential Seller."**
- Do NOT use a per-seller anonymous ID (e.g., "Seller #4821") because it would let buyers correlate one seller's NDA listings. Use a **per-listing reference number** (e.g., `G-10482` for grapes, `W-20931` for bulk wine) if a reference is needed.

**NDA-10: Preview before publish**
- When NDA is ON, the publish step MUST include a **"Preview as a buyer sees it"** screen rendered through the *real* public serializer (not a hand-built mock). Seller can go back and edit. Publish button is on that screen.

**NDA-11: Admin & moderation**
- Admins can see the real seller on NDA listings, in a clearly labeled panel ("NDA listing: seller identity visible to admins only").
- Each admin view of an NDA listing's identity is written to an audit log (admin ID, listing ID, timestamp).
- Moderation actions (edit, unpublish, delete) keep working.

**NDA-12: Visual treatment**
- Listing cards and detail pages show a small **"Confidential Seller (NDA)"** badge with an accessible tooltip/popover: *"The seller has chosen to remain anonymous. Contact them through the site."*
- Optional browse filter: "Include/exclude NDA listings" (default: include).

### 3.3 Acceptance criteria (NDA)
- [ ] With NDA ON, no public response (HTML, JSON, feeds, emails, search, sitemap, images/metadata) contains any seller-identifying data. Proven by the **canary test** in Section 8.
- [ ] Toggle behavior, preview, and confirmations work as specified.
- [ ] Non-NDA listings behave exactly as before.
- [ ] Works identically for grapes and bulk wine listings.

---

## 4. Requirement 2: Username at Signup

### 4.1 Intent
Users choose a **username** (in addition to email and password) at signup. It will become the public handle on a possible future forum. Do **not** build the forum. Make the data forum-ready.

### 4.2 Requirements

**USR-1: Signup form**
- Fields, in order: **Email**, **Username**, **Password**.
- Username field shows live rules and a debounced availability check (✔ "Available" / ✖ "Already taken") without requiring form submit. Availability endpoint is rate-limited.
- Helper text: *"This is your public handle. It may be visible to other members in the future. If you plan to sell confidentially, don't use your winery or vineyard name."*
- Password field: show/hide toggle, paste allowed, password-manager friendly (correct `autocomplete` attributes: `email`, `username`, `new-password`).

**USR-2: Username rules**
- Length **3–24** characters. Allowed: letters, numbers, underscore, hyphen. Must start with a letter or number.
  Suggested pattern: `^[A-Za-z0-9][A-Za-z0-9_-]{2,23}$`
- **ASCII only.** This prevents look-alike (homoglyph) impersonation.
- No consecutive special characters (`__`, `--`, `_-`), no trailing special character.
- Must not contain `@`, look like an email address, a URL, or a phone number (protects privacy and prevents contact-info bypass).
- Display case is preserved (`GrapeGuy`), but uniqueness is **case-insensitive** (`grapeguy` = `GrapeGuy`).

**USR-3: Uniqueness**
- Enforced at the **database level** with a unique index on a lowercase/normalized column (or a case-insensitive type), not just in application code.
- Handle race conditions: if two people submit the same name at once, catch the unique-violation and show the friendly "already taken" message. Do not return a 500.

**USR-4: Reserved & blocked names**
- Block reserved/official-sounding names: `admin`, `administrator`, `support`, `help`, `staff`, `moderator`, `mod`, `system`, `root`, `official`, `team`, the site/brand name, `null`, `undefined`, `anonymous`, `confidential`, `nda`, `seller`, `buyer`, `anon`, and route names that could collide with URLs (e.g., `login`, `signup`, `grapes`, `bulk-wine`, `api`).
- Apply a profanity/offensive-term filter (use a maintained list; match against normalized variants).
- Store the list in config/DB so it can be updated without a deploy.

**USR-5: Password (verify, don't regress)**
- Audit current handling (Phase 0). Passwords MUST be hashed with argon2id or bcrypt with sane parameters. Only change hashing if the current approach is weaker than that.
- SHOULD: minimum length 10–12, allow long passphrases (64+), no forced composition rules, reject passwords found in known-breach lists (e.g., k-anonymity range check), never log passwords, never email passwords.

**USR-6: Login**
- Login accepts **email OR username** plus password. (Email remains the primary identifier for account recovery.)
- Failed login returns one generic message ("Incorrect email/username or password") that doesn't reveal which part was wrong.
- Keep or add rate limiting/lockout on login attempts.

**USR-7: Existing users (migration)**
- Add `users.username` as **nullable** first. Existing users cannot be auto-assigned a username derived from their email or business name (privacy risk).
- On next login, users with no username see a **blocking "Choose your username" step** (same rules, same live availability check), then continue where they were headed.
- Until an existing user picks one, they can browse but can't create new listings. Enforce `NOT NULL` only once all users have been migrated. Use a partial unique index in the meantime.

**USR-8: Storage & display**
- Users are referenced internally by an **immutable internal ID**, never by username. Username is a display handle only.
- Store: `username` (as entered) and `username_normalized` (lowercase; unique index).
- Show the username in account settings. **Default policy for v1: users can't change it themselves; admins can** (see Open Questions).
- Where the username is displayed publicly today (if anywhere) follows the audit. **On NDA listings the username is never displayed.**

**USR-9: Privacy**
- Email addresses are never displayed publicly or exposed through any username lookup.
- The availability-check endpoint returns only available/unavailable, never any account details.

**USR-10: Forum-readiness (data only)**
- Ensure the username column, index, reserved list, and moderation-ready admin edit exist. Build nothing else for the forum.

### 4.3 Acceptance criteria (Username)
- [ ] New signups require a valid, unique, non-reserved username.
- [ ] Uniqueness holds under concurrent requests (test it).
- [ ] Existing users are prompted once, with no data loss and no broken sessions.
- [ ] Login works with either email or username; error messages are generic.
- [ ] No auth regression (reset, verification, sessions still work).

---

## 5. Requirement 3: Vineyard Name Field

### 5.1 Intent
For a **single-vineyard** offering, the seller can name the vineyard. There are far too many vineyards to maintain a master list, so this is deliberately **free text**, one of the few fields the seller types themselves.

### 5.2 Requirements

**VIN-1: Audit first**
- If a vineyard field already exists, extend/repair it to meet this spec, migrating existing values without loss. If not, create it.

**VIN-2: UI**
- Question: **"Is this a single-vineyard offering?"** (Yes / No). Default **No**.
- If **Yes** → show **"Vineyard name"** text input (required when Yes).
- If **No** → hide the input. If the seller toggles No after typing, keep the text in memory so toggling back restores it, but do not save it when No is selected.
- Placeholder/help: *"Type the vineyard name as you'd like buyers to see it."*
- Applies to **both** listing types. For bulk wine it means "wine sourced from a single vineyard" and is optional.

**VIN-3: Everything else stays controlled**
- Do not make varietal, appellation, farming practice, vintage, or location free text. Use lookups/selects. This is the intentional exception.

**VIN-4: Validation & normalization**
- Trim, collapse repeated whitespace, **2–100 characters**.
- Allowed: Unicode letters (accents allowed, e.g., "Clos Pégase"), numbers, spaces, and `' . , - & ( ) # /`
- Reject HTML tags, URLs, and email addresses. Escape on output (XSS-safe everywhere it's rendered).
- Store `vineyard_name` (as entered, for display) and `vineyard_name_normalized` (lowercase, accents and punctuation stripped) for search and duplicate detection.

**VIN-5: Typeahead suggestions (nice-to-have that prevents messy data)**
- As the seller types, suggest previously used vineyard names to reduce spelling variants ("To Kalon" vs "ToKalon").
- Suggestions come **only** from (a) the current user's own past entries and (b) **non-NDA** public listings. They MUST NEVER come from other users' NDA listings.
- Suggestions are non-binding. The seller can always submit whatever they typed.
- Debounced and rate-limited. Never blocks form submission if the suggestion service fails.

**VIN-6: NDA interaction**
- If `is_nda = true` and single-vineyard = Yes: the name is still collected and stored (owner/admin can see it), but it is **never shown publicly** and **never indexed**. Public view shows **"Single vineyard (name withheld)."**
- This lock is automatic. There is no separate "hide vineyard" option in v1.

**VIN-7: Display & discovery (non-NDA listings)**
- Card and detail page show "Vineyard: {name}" when single vineyard.
- Site search matches vineyard names of non-NDA listings.
- Add a browse filter: **"Single vineyard only"** checkbox (works for NDA listings too, since the fact of being single-vineyard is not identifying).

**VIN-8: Data model**
- `listings.single_vineyard` boolean NOT NULL default `false`.
- `listings.vineyard_name` varchar(100) NULL, `listings.vineyard_name_normalized` NULL, indexed.
- CHECK: if `single_vineyard = false`, `vineyard_name` must be NULL.
- No separate vineyards table in v1 (see Appendix B).

### 5.3 Acceptance criteria (Vineyard)
- [ ] Field appears, validates, saves, and displays correctly on both listing types.
- [ ] NDA listings never expose the vineyard name anywhere public (canary test).
- [ ] Typeahead never leaks NDA vineyard names.

---

## 6. Requirement 4: Two Mirrored Marketplaces (Grapes & Bulk Wine)

### 6.1 Intent
The site becomes two peer sections with the same look, feel, and flows, but with different fields and units:
- **Grapes** (existing): sold by weight (verify: tons), price per unit weight.
- **Bulk Wine** (new): quantity in **US gallons**, price **per gallon**.

A user who understands one should immediately understand the other. Same layout, components, filters pattern, and detail-page structure, with type-specific fields.

### 6.2 Structure & navigation

**WINE-1: Listing type**
- Add `listings.listing_type` enum (`grapes`, `bulk_wine`), NOT NULL, default `grapes`, indexed. **Backfill every existing listing as `grapes`.**
- Type is set at creation and **not changeable afterward** (except by admin), because the fields differ.

**WINE-2: Routes**
| Purpose | Route (adapt to existing conventions) |
|---|---|
| Grapes browse | `/grapes` |
| Bulk wine browse | `/bulk-wine` |
| Grapes detail | `/grapes/{slug}-{id}` |
| Bulk wine detail | `/bulk-wine/{slug}-{id}` |
| Create listing (chooser) | `/sell` |
| Create grapes / bulk wine | `/sell/grapes`, `/sell/bulk-wine` |
- **All existing listing URLs MUST keep working** via 301 redirects to the new canonical grapes URLs. (Exception: NDA conversion in NDA-8.)

**WINE-3: Navigation**
- Persistent header switch: **Grapes | Bulk Wine** (segmented control/tabs). Current section is clearly highlighted.
- Homepage: two equal, clear entry points ("Browse Grapes," "Browse Bulk Wine") plus a single "Sell" call to action.
- Global search returns results with **type tabs and counts** ("Grapes (24) | Bulk Wine (7)"), never a mixed, confusing list.

**WINE-4: Create-listing flow**
- `/sell` shows two large choice cards: **"Sell Grapes"** and **"Sell Bulk Wine"**, each with a one-line description and unit hint ("priced per ton" / "priced per gallon").
- Type is shown prominently in the form header at all times.
- If a seller starts one type and switches, warn that type-specific fields will be discarded; carry over shared fields (varietal, vintage, NDA, vineyard, description, photos).

### 6.3 Bulk Wine listing form: fields

Shared fields (title, varietal, description, photos, NDA toggle, single-vineyard) reuse the existing/new shared components. Type-specific fields:

| Field | Control | Required | Validation / behavior | Storage |
|---|---|---|---|---|
| **Quantity** | Number input, suffix "gal" | **Yes** | Whole number ≥ 1, ≤ 5,000,000. Soft confirm above 250,000 ("Is that right?"). Unit is **US gallons**. Thousand separators on display. | `quantity` + `quantity_unit='gallon'` |
| **Price per gallon** | Currency input, prefix "$", suffix "/ gal" | **Yes** | 0.01–1,000.00, max 2 decimals. Use decimal/integer-cents. **Never floating point.** | `price_amount` + `price_unit='per_gallon'` |
| **Total lot value** | Read-only, auto-calculated ("≈ $X") | n/a | quantity × price, computed with exact decimal math. Shown live in form and on detail page. Not editable. | Derived (not stored, or stored + recomputed server-side) |
| **Alcohol % (ABV)** | Number input, suffix "%", step 0.1 | **Yes** | 5.0–25.0. Soft warning outside 9–16% ("Please double-check"). 1 decimal place. | `abv` numeric(4,1) |
| **Vintage** | Dropdown | **Yes** | Current year down to 30 years back (generate dynamically; don't hardcode) + **"Non-vintage / multi-vintage blend"** option. | `vintage_year` smallint NULL + `is_multi_vintage` boolean |
| **Wine location** (where the wine is physically stored) | Two dependent dropdowns: **State → County/Region** | **Yes** | Lookup-driven, not free text. **Independent of grape origin. MUST NOT be auto-filled from or synced with it, in either direction.** | `wine_location_state`, `wine_location_county` |
| **Grape origin / appellation** (where grapes came from) | Existing appellation control from the grapes form | **Yes** | Reuse the same lookup. Independent of wine location. | Existing appellation FK/fields |
| **Farming practices** | Multi-select checkboxes | No | Exactly these options: **Organic, Biodynamic, Natural, Sustainable, Regenerative Organic, Demeter Certified Biodynamic.** Multiple may apply. | Join table of enum codes |
| **Total sulfites (total SO₂)** | Number input, suffix "ppm" | No (encouraged) | Integer 0–1,000. **Soft** warning above 350 ("Above common regulatory limits. Please verify."). `0` is valid and distinct from "not provided" (NULL). Label clarifies "total SO₂," not free SO₂. | `total_so2_ppm` int NULL |
| **Single vineyard / vineyard name** | See Section 5 | No | Optional for bulk wine | Shared columns |

**WINE-5: Location independence (explicit)**
- The form has both "Wine location" and "Grape origin." Show them in separate, clearly labeled sections with helper text: *"Where the wine is stored/available for pickup"* vs. *"Where the grapes were grown."*
- No "same as" shortcut, no silent copying, no shared state between them.
- NDA precision (`nda_location_precision`) applies to **wine location** on bulk wine listings and to the existing location display on grapes listings. Seller chooses "County & state" or "State only." Show a hint: *"In areas with few wineries, a county may still make you identifiable. Choose 'State only' for maximum privacy."*

**WINE-6: Farming practices details**
- Use a **shared lookup/enum** for the six values so the grapes form can use the same list. If the grapes form already has farming options, do **not** rewrite existing grape data. Align only if trivial and report differences.
- Selecting **Demeter Certified Biodynamic** SHOULD auto-check **Biodynamic** (can be unchecked manually).
- Display as badges on cards/detail. Filter uses "any of the selected."
- Show a small note near the field: *"Practices and certifications are declared by the seller. Buyers should request documentation."* The platform doesn't verify them.
- If any certificate uploads exist or are added, they are private on NDA listings (NDA-3).

**WINE-7: Unit safety**
- Units are stored explicitly (`quantity_unit`, `price_unit`) and enforced with DB CHECK constraints per type (grapes can't use gallons; bulk wine can't use tons).
- UI labels always show units ("12,500 gal," "$4.25 / gal," "13.5% ABV," "80 ppm SO₂").
- One gallon = **US liquid gallon**. State this once in a tooltip.

### 6.4 Listing card & detail page

**Bulk wine card (mirror of grapes card):** photo, title (varietal + vintage), quantity in gal, **price/gal**, ABV, location (NDA-aware), farming badges, single-vineyard note, NDA badge if applicable.

**Bulk wine detail page:** same layout skeleton as grapes. A "Wine specs" block lists: vintage, ABV, total SO₂ (or "Not provided"), farming practices, wine location, grape origin, vineyard (if applicable and non-NDA), quantity, price/gal, **total lot value**. Then description, photos, and the contact/inquiry call to action.

### 6.5 Browse & filters (bulk wine)
Varietal · Vintage · Grape origin/appellation · Wine location (state/county) · ABV range · Price/gal range · Quantity range · Farming practice (any-of) · Max total sulfites · Single vineyard only · NDA include/exclude.
Sort: newest, price/gal (asc/desc), quantity, ABV.
Requirements: URL-persisted filters (shareable/back-button safe), clear "Reset filters," empty state with guidance ("No bulk wine matches. Try widening your filters" + link to set an alert if alerts exist), pagination, mobile-friendly filter drawer.

### 6.6 Everything that must become type-aware (from Phase 0)
Favorites, saved searches/alerts, notification emails, "My listings" dashboard (add type label + filter), listing expiry/renewal, admin lists and moderation, exports, analytics events (include `listing_type` property), sitemap, search index, share/OG images.

### 6.7 Acceptance criteria (Two marketplaces)
- [ ] All existing listings appear under Grapes, unchanged, at working URLs (old URLs redirect).
- [ ] A bulk wine listing can be created, edited, published, browsed, filtered, favorited, and expired end-to-end.
- [ ] Gallons/price-per-gallon appear correctly everywhere; no tons/gallons cross-contamination.
- [ ] Wine location and grape origin never sync.
- [ ] NDA works identically on both types.

---

## 7. Cross-Cutting Requirements

### 7.1 Conceptual data model (adapt to existing ORM/conventions)

```
users
  + username               varchar(24)  NULL (NOT NULL after backfill)
  + username_normalized    varchar(24)  UNIQUE (partial, where not null)

listings (existing table)
  + listing_type           enum('grapes','bulk_wine') NOT NULL DEFAULT 'grapes'   [indexed]
  + is_nda                 boolean NOT NULL DEFAULT false                          [indexed]
  + nda_location_precision enum('county','state') NOT NULL DEFAULT 'county'
  + single_vineyard        boolean NOT NULL DEFAULT false
  + vineyard_name          varchar(100) NULL
  + vineyard_name_normalized varchar(100) NULL                                     [indexed]
  ~ quantity / quantity_unit ('ton'|'gallon')     -- explicit unit, CHECK per type
  ~ price_amount / price_unit ('per_ton'|'per_gallon')  -- decimal, never float
  CHECK (single_vineyard OR vineyard_name IS NULL)

bulk_wine_details   (1:1 with listings; only for listing_type='bulk_wine')
  listing_id PK/FK
  abv                      numeric(4,1) NOT NULL  CHECK 5.0..25.0
  total_so2_ppm            integer NULL           CHECK 0..1000
  vintage_year             smallint NULL
  is_multi_vintage         boolean NOT NULL DEFAULT false
  wine_location_state      FK lookup
  wine_location_county     FK lookup
  (grape origin uses the existing appellation fields)

farming_practices           lookup: organic, biodynamic, natural, sustainable,
                            regenerative_organic, demeter_certified_biodynamic
listing_farming_practices   (listing_id, practice_code) many-to-many

nda_audit_log               listing_id, old_value, new_value, actor_id, timestamp
admin_identity_view_log     admin_id, listing_id, timestamp
reserved_usernames          term
```

A single table with nullable type-specific columns is acceptable **if** it matches the existing conventions and CHECK constraints guarantee integrity. Prefer whichever is least invasive.

### 7.2 Migration safety
- All migrations additive first. Backfills run in batches; no long table locks.
- Every migration has a tested rollback.
- Test on a copy of realistic data before production.
- Take/verify a backup step in the rollout notes.
- Deploy order: schema → backend behind flags → UI behind flags → enable in staging → verify → enable in production.

### 7.3 Validation
- Define validation rules **once** (shared schema, or mirrored client/server from the same source) so client and server never disagree.
- Every error message is specific and human: *"Alcohol must be between 5% and 25%"*, not *"Invalid input."*
- Reject unknown/extra fields (protect against mass-assignment; e.g., a user can't set `listing_type`, `is_nda`, or ownership fields in ways they shouldn't).

### 7.4 Form UX (make it genuinely easy)
- **Sections, not a wall of fields:** *Basics → Source (vineyard, origin, NDA) → Specs → Price & Quantity → Photos → Preview & Publish.* Show a progress indicator.
- **Autosave drafts** so a phone call or bad signal in the vineyard doesn't lose work. "Resume your draft" on return.
- **Never lose input on validation error.** Keep all entered values, scroll/focus to the first error.
- **Inline validation on blur**, not on every keystroke. Errors sit next to the field.
- **Units inside the field** (suffix/prefix), numeric keyboard on mobile (`inputmode="decimal"` / `numeric`), thousand separators, no scroll-wheel changing number values.
- **Plain-language helper text**, minimal jargon. Tooltips must work on touch and keyboard (not hover-only).
- **Mobile-first**, since sellers are often on phones. Tap targets ≥ 44px, no horizontal scrolling.
- **Accessibility (WCAG 2.1 AA):** proper `<label>`s, `aria-describedby` for help/errors, logical focus order, visible focus, sufficient contrast, don't rely on color alone, screen-reader-announced live validation.
- **Confirm destructive/irreversible actions** (NDA off, delete, type-switch).
- Clear **success state** after publish with "View listing" and "Create another."
- **Edit flow** mirrors create flow. Re-running NDA and free-text guards on every save.

### 7.5 Security
- Authorization on every listing/user endpoint (owner-only edits; test for IDOR by changing IDs).
- CSRF protection, XSS-safe output encoding, parameterized queries.
- Rate limiting on: signup, login, username availability, vineyard typeahead, inquiry submission.
- Image uploads: type/size limits, re-encode server-side, strip metadata, random filenames.
- No PII, seller identity, or passwords in logs or error reports. Scrub as needed.

### 7.6 Performance
- Add indexes for `listing_type`, `is_nda`, `vineyard_name_normalized`, `username_normalized`, and each filterable bulk-wine field. Confirm query plans on browse pages.
- Paginate; no unbounded queries.

### 7.7 SEO
- Distinct titles/meta descriptions/headings per section (`/grapes`, `/bulk-wine`).
- Structured data (Product/Offer) per listing **excluding** seller/vineyard on NDA listings.
- Canonical URLs, sitemap includes both types, 301s for old URLs.

### 7.8 Observability & docs
- Track key events with `listing_type` and `is_nda` as properties (never seller identity for NDA views).
- Update README, `.env.example` (if needed), admin guide, and add a CHANGELOG entry. Record architectural decisions in `docs/scope-addendum-decisions.md`.

---

## 8. Testing Requirements

### 8.1 The NDA "Canary" Test (mandatory, automated)
1. Create a test seller with unmistakable unique strings: business name `Zzcanary Ridge Vineyards`, username `zzcanary_seller`, email `zzcanary@example.test`, a phone number, website, and vineyard name `Zzcanary Block 7`. Upload an image with EXIF GPS data and filename `zzcanary.jpg`.
2. Create an **NDA** listing (do this once for grapes and once for bulk wine) using that seller.
3. As **anonymous**, **another logged-in user**, and **the owner**/**admin** (separately), fetch **every** public surface: browse pages, detail page, HTML source, hydration/JSON payloads, all API endpoints, search results and autocomplete (query for the canary strings), sitemap, RSS/feeds, OG/meta/JSON-LD, image URLs and image file metadata, response headers, "similar/more from seller" modules, captured notification emails, print/export output.
4. **Assert** the canary strings (case-insensitive, with punctuation/spacing variants) **and the seller's internal ID** appear in **none** of the anonymous/other-user outputs. Assert the owner and admin **can** see them where specified.
5. Toggle NDA on for an existing public listing and assert the old URL now 404s, caches are purged, and the search index no longer returns the canary strings.
6. Run this test in CI. It must never be skipped.

### 8.2 Other test coverage
| Area | Tests |
|---|---|
| **Username** | Validation rules (length, chars, reserved, profanity), case-insensitive uniqueness, **concurrent-signup race**, existing-user migration prompt, login with email/username, generic error messages, rate limiting. |
| **Vineyard** | Show/hide logic, validation & normalization, XSS payloads in the name, typeahead excludes other users' NDA vineyards, NDA hides it publicly. |
| **Bulk wine** | Every field's validation boundaries (ABV 4.9/5.0/25.0/25.1; SO₂ 0/1000/1001; quantity 0/1/5,000,000/5,000,001; price decimals), vintage dropdown generated from current year, total-value math exactness, location/origin independence, farming multi-select, DB CHECK constraints reject wrong units. |
| **Two marketplaces** | Backfill correctness, old-URL 301s, nav switch, search type tabs and counts, filters persist in URL, favorites/alerts/emails type-aware. |
| **Free-text guard** | Blocks own business name/username/vineyard/email/phone/URL on NDA listings; doesn't false-positive on ordinary text. |
| **Migrations** | Up/down on production-like data; no data loss. |
| **Accessibility** | Automated axe checks on signup, both listing forms, browse, detail. Manual keyboard-only pass. |
| **Responsive/browsers** | Verify at ~375px, tablet, desktop; current Chrome, Safari (incl. iOS), Firefox, Edge. |
| **End-to-end** | Signup → choose username → create NDA bulk wine listing → preview → publish → buyer finds via filter → buyer inquires → seller receives (identity intact for seller; hidden from buyer). |

---

## 9. Phased Delivery Plan

Stop and summarize at each checkpoint (what changed, what was tested, anything flagged).

| Phase | Work | Checkpoint output |
|---|---|---|
| **0** | Audit (Section 2) | `docs/scope-addendum-audit.md` |
| **1** | Data model & migrations: `listing_type`, `is_nda`, vineyard columns, bulk wine tables, farming lookup, username columns, feature flags, backfills | Migrations + rollback tested |
| **2** | Usernames (Req. 2): signup, availability check, login by either, existing-user prompt | Username acceptance criteria met |
| **3** | **Central public serializer + NDA (Req. 1)**, built before bulk wine pages so bulk wine is NDA-aware from day one; includes free-text guard, preview, toggle flows, admin view, canary test (grapes) | Canary test green |
| **4** | Vineyard field (Req. 3) incl. typeahead and NDA interplay | Vineyard criteria met |
| **5** | Bulk wine (Req. 4): create flow, form, detail page, card, farming lookup, sulfites, location | Form + detail complete |
| **6** | Browse/filter/search/nav for both sections; type-aware sweep (favorites, alerts, emails, admin, sitemap, analytics); URL redirects | Section 6.6 checklist complete |
| **7** | Hardening: canary test extended to bulk wine, a11y, mobile, performance, security review, docs | Definition of Done (Section 10) |

---

## 10. Definition of Done

- [ ] Every requirement ID above is implemented or has a documented, owner-approved deviation.
- [ ] Canary test passes for both listing types and runs in CI.
- [ ] No regressions in existing grapes listing creation, browsing, contact, auth, or admin.
- [ ] All migrations tested up and down; existing data intact; old URLs redirect.
- [ ] Feature flags in place and documented; rollout order written down.
- [ ] Accessibility checks pass; mobile layouts verified.
- [ ] Docs, changelog, and decision log updated.
- [ ] A short **"How to test this manually"** note is provided for the project owner, covering: sign up with a username, create a grapes NDA listing, create a bulk wine NDA listing, view both as an anonymous visitor, and confirm nothing identifying appears.

---

## 11. Open Questions (Flag to Project Owner. Use the Safe Default Meanwhile)

| # | Question | Safe default used until answered |
|---|---|---|
| 1 | **Is "NDA" only a confidentiality flag, or should buyers have to accept NDA terms before contacting/seeing more?** Legal review may be advisable. | Flag only. No buyer-side agreement. Copy avoids implying a legal contract. |
| 2 | Should sellers be able to **reveal identity to a specific buyer** through a one-click "Reveal to this buyer" action? | Not built. Sellers can disclose in messages. Data model doesn't block adding it later. |
| 3 | Can users **change their username**? | No self-service change in v1. Admin can change. Internal ID is the true key. |
| 4 | On NDA listings, should the vineyard ever be shown separately from the seller? | Always hidden on NDA. |
| 5 | Is there an existing **on-site messaging/inquiry system**? If not, is the minimal relay in NDA-7 approved? | Build the minimum relay, and flag it before expanding. |
| 6 | Should the Farming Practices list also appear on the **grapes** form (same six options)? | Shared lookup created. Grapes form untouched unless approved. |
| 7 | Do bulk wine sellers need to declare **TTB/bonded-winery status** or similar licensing? | Not collected. |
| 8 | Currency: is everything **USD**? | Yes. |
| 9 | Should sulfites be **required** for bulk wine? | Optional, encouraged, with clear "Not provided" display. |

---

## Appendix A: Suggested Copy (Microcopy)

| Location | Copy |
|---|---|
| NDA toggle label | **Selling under NDA?** |
| NDA helper | Your name, business, and vineyard will be hidden from buyers. Buyers contact you through the site. |
| NDA panel (ON) | **Hidden from buyers:** your name, business, username, vineyard name, contact info, and exact location. **Visible to buyers:** varietal, vintage, quantity, price, region, and the details you enter below. |
| NDA free-text warning | Avoid mentioning your winery, vineyard, brand, or anything else that could identify you, including in photos. |
| NDA badge | Confidential Seller (NDA) |
| NDA badge tooltip | The seller has chosen to remain anonymous. Contact them through the site. |
| NDA location hint | In areas with few wineries, a county may still make you identifiable. Choose "State only" for maximum privacy. |
| NDA ON confirm (existing listing) | Buyers may already have seen this listing's seller details. Making it confidential hides them going forward but can't erase copies others may have saved. |
| NDA OFF confirm | Your name, business, and vineyard will become publicly visible on this listing. This can't be undone for anything already seen or crawled. |
| Username helper | This is your public handle. It may be visible to other members in the future. If you plan to sell confidentially, don't use your winery or vineyard name. |
| Username taken | Sorry, that username is taken. Try another. |
| Username rules | 3–24 characters. Letters, numbers, underscores, and hyphens. |
| Single vineyard question | Is this a single-vineyard offering? |
| Vineyard name help | Type the vineyard name as you'd like buyers to see it. |
| Vineyard NDA display | Single vineyard (name withheld) |
| Quantity help (wine) | Total volume in US gallons. |
| Price help (wine) | Price per US gallon. We'll calculate the total lot value for you. |
| Sulfites label | Total sulfites (total SO₂), in ppm |
| Sulfites help | From your lab analysis, if you have it. Leave blank if not tested. |
| Sulfites soft warning | This is above common regulatory limits. Please double-check. |
| ABV warning | That's outside the usual range. Please double-check. |
| Wine location help | Where the wine is stored and available for pickup. |
| Grape origin help | Where the grapes were grown. This can be different from the wine location. |
| Farming note | Practices and certifications are declared by the seller. Buyers should request documentation. |
| Vintage NV option | Non-vintage / multi-vintage blend |
| Sell chooser: grapes | **Sell Grapes.** Priced per ton. |
| Sell chooser: bulk wine | **Sell Bulk Wine.** Priced per gallon. |

---

## Appendix B: Parking Lot (Do NOT Build Without Explicit Approval)

Ideas that would likely improve the product but are outside this scope:
- Canonical **vineyards table** (merge/dedupe, vineyard pages, verified vineyards)
- **Forum** (only username groundwork is in scope)
- One-click **identity reveal** to a specific buyer / buyer-side NDA acceptance
- Bulk wine extras: wine style/type, container/storage type (tank, barrel, tote), minimum purchase, available/delivery date, sample availability, FOB/pickup vs. delivery terms, freight estimator, private lab-analysis attachment, free SO₂, pH/TA, residual sugar, filtration/stabilization status
- Bonded-winery / TTB status and seller verification badges
- Verified certification badges (Demeter, Regenerative Organic)
- Metric units toggle (liters / tonnes) as a display option
- Saved-search alerts specifically for bulk wine price drops
