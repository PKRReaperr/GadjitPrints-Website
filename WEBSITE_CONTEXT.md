# Gadjit Prints Website Context

This document gives an AI model or developer enough context to understand, maintain, redesign, or extend the Gadjit Prints website without the full conversation history. Read it before changing the site, and update it when a decision changes.

## Project Summary

Gadjit Prints is a small custom 3D printing studio. The website is where customers **discover** products: real photos, a short description, and what each piece is made from. **Etsy is where they buy**: customers follow a link to the exact Etsy listing to choose options, add personalization, pay, and get shipping updates.

- Etsy shop: https://www.etsy.com/shop/GadjitNet
- The owner publishes and edits listings and their options in Etsy Shop Manager.
- Payments, shipping, inventory, and orders stay on Etsy and are out of scope for the website.

The Gadjit connection appears only as a one-line note on the Studio page ("Gadjit Prints is a sister studio to Gadjit"). Gadjit is a camera business, but that is not this site's positioning. The primary message is made-to-order 3D printed pieces. Do not add location branding ("Made in Texas", "Ships from Texas", Houston) or filler badges such as "Made to order" chips on every product.

The website is a **sister site to Gadjit.net** (https://www.gadjit.net/). It shares Gadjit.net's typography, colors, spacing, alignment, and component styling, while keeping its own Gadjit Prints logo, finished-print photography, and made-to-order studio identity. It should feel clear, flat, and well aligned, never like a generic ecommerce template or a technical 3D printer showcase. (Until November 2026 the site used a dark "cinematic" look with amber gradients and glass panels; that direction is retired.)

The owner does not want imagery of 3D printer machines. Visuals focus on real photos of finished printed objects.

## Brand And Design Ideology

The brand personality is:

- Personal but practical: useful, giftable, and display-ready pieces.
- Calm and confident: no aggressive sales copy, no corporate tone.
- Small and honest: not mass produced, not instant, printed after the order arrives.
- Related to Gadjit, but not a camera business: camera-business copy, eBay stats, and Gadjit trust numbers do not belong here.

The visual system (implemented in `src/styles.css`, modelled on the Gadjit.net reference repo's `_variables.scss`, `_typo.scss`, `_grid.scss`, `_homepage-beta.scss`, `_header.scss`, `_navigation.scss`, and `_about.scss`):

- **Type:** Akshar (weight 500) for display headings, Mulish for paragraphs, navigation, labels, and controls, both from Google Fonts in `index.html`. Display headings are fluid (`clamp`), tight (line-height about 0.9), and uppercase. Labels are short, 12 px, bold, tracked uppercase. Paragraphs stay in sentence case. Product names keep their natural case and wrap naturally; `displayName()` in `main.jsx` keeps number ranges such as "200–500mm" together.
- **Color (light, primary):** white `#FFFFFF`, charcoal `#262322`, Gadjit orange `#F15A24`. Orange is for active underlines, markers, focus rings, and selective accents. Small orange text uses the darker `--accent-text` (`#AD3B0D`) for contrast. Secondary surfaces are the reference's muted neutrals `#E8E2DE` and `#D8D9D4`.
- **Dark mode:** same type, grid, and orange on charcoal surfaces (`#1A1817` page, `#262322` surfaces) with light text `#F4F1EE`. Photo mats stay light so product photos read the same in both themes. The Light / Dark / System control and saved preference (`public/theme.js`) are unchanged.
- **Grid:** one shared content grid, `.container`: a 1440 px content cap with 16–32 px gutters (`--gutter`). Header, headings, tiles, bands, and footer align to the same edges. Section spacing is `--section-gap` (about 36 px on mobile up to 72 px on desktop); card gaps (`--card-gap`, 16–24 px) stay tighter than section gaps.
- **Logo:** like Gadjit.net, the header shows only the mark (`public/brand/gadjitprints-mark.webp`, 50 px): black on a transparent background, with no box, border, or wordmark. Dark mode inverts it to white with `filter: invert(1)`. The footer uses the same mark. `public/favicon.svg` (flips to white in dark browser chrome) and `favicon-96x96.png` come from the same mark. `gadjitprints-logo.png` (white on black) is the original source; the transparent mark was made from it by mapping brightness to transparency.
- **Text:** keep copy short. No eyebrow labels that repeat a heading, no repeated ordering notes, no location or "made to order" badges.
- **Components:** a flat sticky header with the mark on the left, centered uppercase navigation with an orange active underline, and a thin bottom rule; below 900 px a compact drop-down menu. Square or 2 px-radius buttons (charcoal primary, outline secondary, light on charcoal bands), thin rules, ruled lists with square orange markers, and a charcoal band for contrast. Hover states are restrained (color swaps, border darkening). No gradients, glows, glass panels, shadows, pills, or reveal animations.
- **Photos:** product photos sit in `.photo-frame` tiles (4:5, `object-fit: contain`, light mat, thin border) so tall and square photos are never awkwardly cropped. Only decorative studio photos (`.split-media`, `.photo-row`) use `cover`.

Avoid:

- Amber gradients, glows, glass panels, drop shadows, pill-heavy chrome, and purple AI-style gradients.
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

The site never shows a price. Product pages say "Price on Etsy" and link to the listing, so a stale price can never appear. The Etsy link keeps the referrer (`rel="noopener"`, not `noreferrer`) so Etsy shop stats credit the website as a traffic source.

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

- `/` Homepage: asymmetric split hero (headline, one sentence, "Browse products" CTA, and the first photo of up to two listings in their own grid area), "Ready to order" product grid, a charcoal "How ordering works" band with numbered steps, and a studio introduction.
- `/collection` Left-aligned page intro, compact category filter chips with counts, a shared ordering note, and a photo-led product grid (`auto-fill`, 320 px minimum columns) that works for two listings or many. Each card has its category, name, descriptor (`type`, else a two-line summary), an options note only when the listing has personalization or options, the Etsy button, and a Details link. If the catalog is empty it shows "New pieces are on the way" with a link to the Etsy shop.
- `/collection/:slug` Product page: two columns from 900 px (gallery with thumbnails and previous/next controls; a sticky information column with the name, descriptor, Etsy CTA, "Price on Etsy" line, description, and ruled detail lists). On mobile the gallery frame is capped at 60% of the viewport height so the name and Etsy button stay near the top. The personalization/options note appears only when the listing data calls for it. Unknown or retired slugs redirect to `/collection`.
- `/collection/:slug/configure` Legacy configurator URL; redirects to `/collection/:slug`.
- `/process` How it works: page heading, ruled numbered steps (browse, order on Etsy, printed to order, shipped to you), "Before you order" notes, and a closing CTA band.
- `/studio` About the studio, adapted from Gadjit.net's About page: a large left-aligned heading between rules with a short lead and numbered facts, finished-product photos, a short story, a brief supporting note about the Gadjit connection, and a CTA band.
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

Important components in `src/main.jsx`: `App`, `ScrollToTop`, `SiteShell` (header, appearance control, mobile menu, skip link), `Home`, `Hero`, `AvailableNow`, `MadeToOrderBand`, `StudioIntro`, `Collection`, `Process`, `Studio`, `PageIntro`, `CtaBand`, `OrderingNote`, `EmptyCatalog`, `ProductGrid`, `ProductCard`, `ProductDetail`, `ProductDetailContent`, `LegacyConfigureRedirect`, `ProductMedia`, `EtsyLink`, `ShopLink`, `Footer`.

The JSX uses the classic transform (there is no Vite React plugin), so `src/main.jsx` must keep `import React from 'react'`. Without it the build succeeds but every page renders blank.

## Styling Architecture

Custom CSS, no Tailwind, one file: `src/styles.css`. Light-theme tokens live on `:root`; `:root[data-theme='dark']` overrides only the color tokens. Use the tokens (`--bg`, `--text`, `--text-soft`, `--rule`, `--rule-soft`, `--surface`, `--surface-alt`, `--photo-mat`, `--accent`, `--accent-text`, `--band-*`, `--gutter`, `--section-gap`, `--card-gap`) rather than raw colors or spacing. Breakpoints: `600px` (footer and photo rows go multi-column), `768px` (split hero, bands, Studio intro, steps), `900px` (desktop header navigation, two-column product page). `prefers-reduced-motion` turns transitions off.

Useful classes: `.container`, `.section`, `.display`, `.label` / `.label-accent`, `.lead`, `.button` (`-primary`, `-secondary`, `-light`, `-small`, `-block`), `.text-link`, `.icon-button`, `.site-header`, `.nav`, `.hero`, `.photo-frame`, `.product-grid`, `.product-card`, `.band`, `.page-intro`, `.chip`, `.product-layout`, `.gallery`, `.product-info`, `.detail-list`, `.steps`, `.about-intro`, `.fact-list`, `.site-footer`.

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
- Follow the Gadjit.net sister-site system above (Akshar and Mulish, white / charcoal / orange, flat surfaces, thin rules, shared grid). Treat light as the primary reference and keep dark mode and the Light / Dark / System control working.
- Check changes at 390, 768, 1280, and 1440 px in both themes, with no horizontal overflow.
- Keep the Gadjit reference to the one-line Studio note. No location branding (Texas, Houston).
- Preserve the Vercel SPA rewrite.
- Keep the Etsy footer notice and the 3-hour sync schedule. Never commit the Etsy key.
- Run `npm run build`, `npm run test:catalog`, `npm run test:theme`, and `npm run test:sync`, then check the pages in a browser.
