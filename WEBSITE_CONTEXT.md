# Gadjit Prints Website Context

This document gives an AI model or developer enough context to understand, maintain, redesign, or extend the Gadjit Prints website without the full conversation history. Read it before changing the site, and update it when a decision changes.

## Project Summary

Gadjit Prints is a small custom 3D printing studio. The website is where customers **discover** products: real photos, a short description, and what each piece is made from. **Etsy is where they buy**: customers follow a link to the exact Etsy listing to choose options, add personalization, pay, and get shipping updates.

- Etsy shop: https://www.etsy.com/shop/GadjitNet
- The owner publishes and edits listings and their options in Etsy Shop Manager.
- Payments, shipping, inventory, and orders stay on Etsy and are out of scope for the website.

The Gadjit connection appears only as a one-line note on the Studio page ("Gadjit Prints is a sister studio to Gadjit"). Gadjit is a camera business, but that is not this site's positioning. The primary message is made-to-order 3D printed pieces. Do not add location branding ("Made in Texas", "Ships from Texas", Houston) or filler badges such as "Made to order" chips on every product.

The website reads as **a small design studio's product collection**: considered through typography, spacing, and photography, with the products carrying the visual interest. It is visually distinct from Gadjit.net; the only shared design element is the Mulish body font, kept as a quiet connection. It should never feel like a generic ecommerce template or a technical 3D printer showcase. (History: until November 2026 the site used a dark "cinematic" look with amber gradients; it then briefly matched Gadjit.net with Akshar, white, and orange. Both directions are retired.)

The owner does not want imagery of 3D printer machines. Visuals focus on real photos of finished printed objects.

## Brand And Design Ideology

The brand personality is:

- Personal but practical: useful, giftable, and display-ready pieces.
- Calm and confident: no aggressive sales copy, no corporate tone.
- Small and honest: not mass produced, not instant, printed after the order arrives.
- Related to Gadjit, but not a camera business: camera-business copy, eBay stats, and Gadjit trust numbers do not belong here.

The visual system (implemented in `src/styles.css`):

- **Type:** Instrument Serif (regular, italic for step numerals) for display headings, product names, and the wordmark; Mulish for paragraphs, navigation, and controls. Both load from Google Fonts in `index.html`. Headings use sentence case, generous fluid sizes (`clamp`, about 46–104 px for page titles), line-height about 1.02–1.1, and slightly tight tracking. Deliberate line breaks use `<span className="line">`, which only breaks from 600 px up; smaller screens wrap naturally with `text-wrap: balance`. There are no uppercase labels or eyebrows. `displayName()` in `main.jsx` keeps number ranges such as "200–500mm" together.
- **Color (light):** warm ivory `#F6F2EA` page, deep ink `#23211F` text, soft stone `#E8E0D5` photo mats, muted oxblood `#694049` accent. Oxblood is used selectively: active nav and filter underlines, text-link underlines, step numerals, the primary-button hover, and focus rings. Secondary text is `#5F5850`. Rules are ink at 16% (`--rule`) or 42% (`--rule-strong`).
- **Dark mode:** its own warm palette, not an inversion: charcoal page `#1B1917`, ivory text `#F1EBE0`, secondary text `#B8AFA3`, dark stone mats `#2B2723`, and a lifted rose accent `#D7A1AB` that stays readable on charcoal. The primary button flips to an ivory fill. The Light / Dark / System control and saved preference (`public/theme.js`) are unchanged; `index.html` sets matching `theme-color` values.
- **Spacing:** wide space between sections (`--section-gap`, about 88 px on mobile up to 168 px on desktop) and tight space within them (`.section-heading` 24–40 px above its content, `.section-tight` for content that belongs to the intro above). One content grid, `.container`: a 1440 px cap with 16–40 px gutters (`--gutter`).
- **Logo:** the header shows the mark (`public/brand/gadjitprints-mark.webp`, 36 px; 32 px under 600 px) next to a visible "Gadjit Prints" wordmark set in Instrument Serif. The mark is black on transparent, with no box or border; dark mode inverts it to white with `filter: invert(1)`. The footer repeats the mark and wordmark at a smaller size. The brand link's accessible name is "Gadjit Prints, home". `public/favicon.svg` and `favicon-96x96.png` come from the same mark; `gadjitprints-logo.png` (white on black) is the original source asset.
- **Text:** keep copy short and plain. One clear primary action per section. No eyebrow labels, no repeated ordering or sales notes where the page already says it, no location or "made to order" badges.
- **Components:** a sticky header with a fine bottom rule: brand at left, compact sentence-case navigation at right (Products, How it works, Studio; the brand links home), and a quiet borderless appearance control. Below 900 px the navigation becomes a drop-down with large serif links. Buttons are square: ink primary (oxblood on hover), outline secondary, full width only for the product page's Etsy action. Text links are Mulish 15 px with a fine oxblood underline; `.quiet-link` is the secondary soft-gray variant. Solid fills and fine rules only: no gradients, glows, glass, shadows, pills, or dark bands.
- **Photos:** every product photo sits in a `.mat-frame`: a stone mat at a fixed 4:5 proportion (1:1 for the product gallery and "A closer look") with the photo contained inside at about 7% inset, so square and tall source photos both stay whole and sit consistently. The homepage feature shows its photo at natural proportions on a stone mat, capped by the viewport height, so the object is never cropped. Hover is a very slight image scale (off with reduced motion).

Avoid:

- Amber gradients, glows, glass panels, drop shadows, pill-heavy chrome, uppercase tracked labels, dark contrast bands, and purple AI-style gradients.
- Generic startup landing page patterns.
- Copy that implies mass production, instant fulfillment, or a checkout on the website.
- Prices, stock counts, or ratings on the website (Etsy is the source of truth; see below).
- Heart/share buttons on product cards.
- Bidding, auction, or marketplace mechanics.
- Open quote/request forms.
- Scraping Etsy.

## Buying Flow

1. Customer browses `/collection` or the homepage and opens a product.
2. The product page shows real photos, a short description, and what the piece is made from.
3. The **View on Etsy** or **Customize on Etsy** button opens the exact Etsy listing in a new tab.
   - "Customize on Etsy" is used when the listing has personalization (optional or required) or variations.
   - "View on Etsy" is used otherwise.
4. On Etsy the customer chooses options, enters personalization or uploads, checks out, and pays.
5. The piece is printed after the order arrives, checked, and shipped. Etsy sends tracking and order updates.

The site never shows a price. Product pages say "Price and checkout on Etsy." and link to the listing, so a stale price can never appear. The Etsy link keeps the referrer (`rel="noopener"`, not `noreferrer`) so Etsy shop stats credit the website as a traffic source.

## Product Catalog

Every product is an **active Etsy listing**; there are no studio-only or sample products. The previous MakerWorld-based configurable products (QR business card, QR code business stand, initial ornament, door hanger, luggage tag, name plate stand) and the email configurator were retired in November 2026 because none of them were sold anymore.

The `products` array in `src/data/catalog.js` is built from two sources:

- `src/data/etsy-listings.js`: **generated** by the Etsy sync (`scripts/etsy-sync.mjs`, run every 3 hours by `.github/workflows/etsy-sync.yml`). It decides which listings exist and holds their order, slug, photos, and personalization/options flags. Never edit it by hand.
- `listingCopy` in `src/data/catalog.js`: **hand-written** website copy (title, type, category, copy, includes) keyed by Etsy listing ID. The sync never touches it. A listing without copy still shows, using its Etsy title, the first paragraph of its Etsy description, and the "New on Etsy" category.

Listings with website copy (checked 2026-11-18):

1. Soccer Trophy Cup: `soccer-trophy-cup`, Etsy listing `4523619401`, Decor & Collectibles.
2. Nikon 200–500mm Lens Hood: `nikon-200-500mm-lens-hood`, Etsy listing `4594768652`, Camera Gear.

How the sync works, its safeguards, and how to add copy for new listings: see `docs/CATALOG_UPDATES.md`.

### Product Data Shape

`buildProducts` in `catalog.js` merges each synced listing with its copy into:

```js
{
  slug: 'soccer-trophy-cup',            // from the sync; stays the same even if the Etsy title changes
  title: 'Soccer Trophy Cup',           // listingCopy, else the shortened Etsy title
  type: 'Championship display trophy',  // listingCopy only; the UI falls back to category
  category: 'Decor & Collectibles',     // listingCopy, else 'New on Etsy'; drives the Category filter
  imageUrls: ['https://i.etsystatic.com/...'], // from the sync, 794 px wide, in Etsy photo order
  copy: 'Short description written for the website.', // listingCopy, else the Etsy summary
  includes: ['Printed in PLA'],          // listingCopy only; optional material/fit details
  etsy: {
    listingId: '4523619401',            // stable Etsy listing ID; the link is built from it
    personalization: 'none',            // from the sync: 'none' | 'optional' | 'required'
    hasOptions: false,                  // from the sync: true when the listing has variations
  },
}
```

### Etsy API rules that shape the site

- Listing content may not be shown more than 6 hours older than Etsy, hence the 3-hourly sync.
- The footer must keep Etsy's notice: "The term 'Etsy' is a trademark of Etsy, Inc. This Application uses Etsy's API, but is not endorsed or certified by Etsy."
- No scraping, and request only the data the site needs. The site must not mimic Etsy's look or bypass Etsy checkout.
- The key (`keystring:shared_secret`) is only in the GitHub Actions secret `ETSY_API_KEY`. The repo is public, so never commit it.

Rules enforced by `npm run test:catalog`:

- Unique kebab-case slugs and unique numeric listing IDs.
- `title`, `copy`, and `category` are required; at least one photo is required.
- Photos are local files that exist in `public/` or `https://i.etsystatic.com/` listing photos.
- Every product has `etsy.listingId`; the generated URL is `https://www.etsy.com/listing/<id>`.
- No `price` field.

Helpers in the same file (shared by the UI and the checks): `buildProducts`, `getEtsyListingUrl`, `getEtsyActionLabel`, `getEtsyOptionsNote`, `needsEtsyCustomization`, `getShowcaseImages`, `isEtsyProduct`, `etsyShopUrl`, and `fallbackCategory`.

## Website Pages

The app is a client-rendered Vite + React SPA using React Router.

- `/` Homepage: a short centered introduction (headline, one sentence, "Browse products", which on mobile stays above the photo), then one large linked product photograph (`FeaturedPiece`: the first photo of `featuredSlug` in `main.jsx`, currently the Soccer Trophy Cup, falling back to the first listing), then "The collection" (up to three cards, with a "View all" link only when more exist), a quiet "How ordering works" section with three numbered columns on the page palette, and a short centered studio note.
- `/collection` Centered page intro, category filters as quiet underlined text buttons with counts (shown only when there are at least two categories) and a "pieces" count, then the product grid. The grid is one column on mobile, two from 600 px, and three from 1100 px only once there are three or more listings, so two listings fill the row as a complete pair and a single listing stays at card width. Cards have almost no chrome: the matted photo, the name in serif, the descriptor (`type`, else a two-line summary), an options note only when the listing has personalization or options, a "View details" link, and a quiet "View on Etsy" link. If the catalog is empty it shows "New pieces are on the way" with a link to the Etsy shop.
- `/collection/:slug` Product page: breadcrumb (Products, category), then two columns from 900 px with the gallery taking about two thirds. The gallery is a stone mat with the photo contained; previous/next controls and the photo count sit in a strip of the mat below the photo so they never cover the object, with thumbnails underneath. The sticky information column groups the name, descriptor, essential details (`includes`, joined by middle dots), the options note when needed, the full-width Etsy action, and "Price and checkout on Etsy.", followed by the description. On mobile the gallery is square and capped at 62% of the viewport height so the Etsy action stays in the first screen. Listings with three or more photos add "A closer look", their other photos shown larger to show finish and texture. Unknown or retired slugs redirect to `/collection`.
- `/collection/:slug/configure` Legacy configurator URL; redirects to `/collection/:slug`.
- `/process` How it works: centered intro, ruled numbered steps with serif italic numerals (choose a piece, order on Etsy, printed to order, shipped to you), three "Before you order" notes divided by fine rules, and a quiet closing section with one primary action.
- `/studio` Centered intro, a row of matted photos of the finished pieces (each linked to its product), "How each piece is made" in three numbered columns, a one-line note about the collection and the Gadjit connection, and the same closing section.
- `/quote` Redirects to `/collection`.
- `*` Redirects to `/collection`.

## Frontend Structure

- `src/main.jsx`: routing, layout (`SiteShell` with the appearance control), pages, and components.
- `src/data/catalog.js`: hand-written listing copy and pure catalog helpers (no JSX, importable from Node).
- `src/data/etsy-listings.js`: generated by the Etsy sync; do not edit.
- `scripts/etsy-sync.mjs`, `scripts/etsy-sync-lib.mjs`, `scripts/etsy-sync-check.mjs`: the Etsy sync, its fetch/transform logic, and its tests.
- `.github/workflows/etsy-sync.yml`: runs the sync every 3 hours on `main`.
- `src/styles.css`: global CSS, design tokens, light theme overrides, responsive layout.
- `public/theme.js`: runs before paint to apply the system/light/dark preference.
- `public/brand/gadjitprints-mark.webp` (and `.png`): the transparent mark used in the header and footer. `public/favicon.svg`, `public/favicon-96x96.png`: favicons. `public/brand/gadjitprints-logo.png` / `.webp`: the original white-on-black logo, kept as the source asset and no longer shown.
- `index.html`: Vite entry HTML.
- `scripts/catalog-check.mjs`, `scripts/theme-check.mjs`: Node checks.

Important components in `src/main.jsx`: `App`, `ScrollToTop`, `SiteShell` (header, appearance control, mobile menu, skip link), `Brand` (mark and wordmark, used in header and footer), `Home`, `HomeIntro`, `FeaturedPiece`, `HomeCollection`, `HomeOrdering`, `StudioNote`, `Collection`, `Process`, `Studio`, `PageIntro`, `ClosingCta`, `Note`, `EmptyCatalog`, `ProductGrid`, `ProductCard`, `ProductDetail`, `ProductDetailContent`, `LegacyConfigureRedirect`, `ProductMedia`, `EtsyLink`, `ShopLink`, `Footer`.

The JSX uses the classic transform (there is no Vite React plugin), so `src/main.jsx` must keep `import React from 'react'`. Without it the build succeeds but every page renders blank.

## Styling Architecture

Custom CSS, no Tailwind, one file: `src/styles.css`. Light-theme tokens live on `:root`; `:root[data-theme='dark']` overrides only the color tokens. Use the tokens (`--bg`, `--text`, `--text-soft`, `--rule`, `--rule-strong`, `--mat`, `--accent`, `--on-accent`, `--gutter`, `--section-gap`, plus the raw `--ivory`, `--ink`, `--stone`, `--oxblood`) rather than raw colors or spacing. Breakpoints: `600px` (deliberate heading line breaks, two-column product grid, notes, photo rows, footer), `768px` (three-column step sections, ruled process steps), `900px` (desktop header navigation, two-column product page), `1100px` (three-column product grid once there are three or more listings, via `:has()`). `prefers-reduced-motion` turns transitions off.

Useful classes: `.container`, `.section`, `.section-tight`, `.section-heading`, `.display`, `.line`, `.lead`, `.intro`, `.button` (`-primary`, `-secondary`, `-block`), `.text-link`, `.quiet-link`, `.icon-button` / `.icon-button-quiet`, `.site-header`, `.brand`, `.wordmark`, `.nav`, `.mat-frame`, `.featured`, `.product-grid`, `.product-card`, `.filters` / `.filter`, `.step-columns`, `.numeral`, `.studio-note`, `.product-layout`, `.gallery`, `.product-info`, `.essentials`, `.closer-look`, `.steps`, `.notes`, `.closing`, `.gallery-row`, `.site-footer`.

## Backend Structure

There is no custom backend, API route, database, or server function, and the site never calls Etsy while customers browse. A GitHub Action reads the Etsy Open API v3 (public endpoints, API key only, read-only), commits `src/data/etsy-listings.js` when listings change, and Vercel redeploys. See `docs/CATALOG_UPDATES.md`.

## Deployment Structure

Vercel builds the site from GitHub. Pushing `main` deploys production; other branches get preview deployments (behind Vercel sign-in).

`vercel.json` runs `npm run build`, serves `dist`, and rewrites every path to `/index.html`. The rewrite is required so direct visits to routes such as `/collection/soccer-trophy-cup` work.

Domains: `gadjitprints.store` and `www.gadjitprints.store` (the apex redirects to `www`).

## Development Commands

```bash
npm install
npm run dev            # http://127.0.0.1:5173
npm run build
npm run preview
npm run test:catalog   # validates src/data/catalog.js
npm run test:theme     # validates the appearance preference script
npm run test:sync      # tests the Etsy sync safeguards against a fake API (no key needed)
npm run sync:etsy:dry  # live Etsy check; asks for the key, writes nothing
```

## Current Known Limitations

- Website copy for new listings is written by hand; until then they show the Etsy title and summary.
- Product photos are loaded from Etsy's image CDN.
- If the sync fails for more than 6 hours, listing content can fall behind Etsy; GitHub emails each failed run.
- The checks do not render the app, so always open the site in a browser before shipping.
- No full accessibility audit has been done yet.

## Guidelines For Future AI Work

- Read this file first; check it against the current source and update it when decisions change.
- Keep the website a discovery layer. Etsy handles options, personalization, payment, shipping, inventory, and orders.
- Link to the exact listing by ID. Do not show prices, stock, or ratings on the site.
- Only list active Etsy listings in the catalog.
- Do not reintroduce quote forms, the email configurator, or material/color pickers unless explicitly requested.
- Do not add heart/share buttons or 3D printer machine imagery.
- Follow the studio-collection system above (Instrument Serif and Mulish; ivory, ink, stone, and oxblood; matted photos; solid fills and fine rules; wide space between sections). Keep dark mode's own palette and the Light / Dark / System control working.
- Check long product titles and both square and tall photos whenever cards, the gallery, or the feature change.
- Check changes at 390, 768, 1280, and 1440 px in both themes, with no horizontal overflow.
- Keep the Gadjit reference to the one-line Studio note. No location branding (Texas, Houston).
- Preserve the Vercel SPA rewrite.
- Keep the Etsy footer notice and the 3-hour sync schedule. Never commit the Etsy key.
- Run `npm run build`, `npm run test:catalog`, `npm run test:theme`, and `npm run test:sync`, then check the pages in a browser.
