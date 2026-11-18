# Gadjit Prints Website Context

This document gives an AI model or developer enough context to understand, maintain, redesign, or extend the Gadjit Prints website without the full conversation history. Read it before changing the site, and update it when a decision changes.

## Project Summary

Gadjit Prints is a small custom 3D printing studio. The website is where customers **discover** products: real photos, a short description, and what each piece is made from. **Etsy is where they buy**: customers follow a link to the exact Etsy listing to choose options, add personalization, pay, and get shipping updates.

- Etsy shop: https://www.etsy.com/shop/GadjitNet
- The owner publishes and edits listings and their options in Etsy Shop Manager.
- Payments, shipping, inventory, and orders stay on Etsy and are out of scope for the website.

The Houston-area and Gadjit connection should only appear as a small note on the Studio page. Gadjit Prints has a quiet connection to Gadjit, a camera business with more than 10 years of experience around used and open-box camera gear, but that is not the main site positioning. The primary message is made-to-order 3D printed pieces.

The website should feel cinematic, refined, tactile, and artisan. It should communicate made-to-order care without becoming a generic ecommerce template, a mass-market tech store, or a technical 3D printer showcase.

The owner does not want imagery of 3D printer machines. Visuals focus on finished printed objects, simple atmospheric backgrounds, and polished presentation.

## Brand And Design Ideology

The brand personality is:

- Personal but practical: useful, giftable, and display-ready pieces.
- Artisan and premium: careful, tactile, considered.
- Modern fabrication with warmth: digital precision softened by handcrafted presentation.
- Calm and confident: no aggressive sales copy, no corporate tone.
- Design-forward: editorial typography, generous spacing, dark atmospheric surfaces, subtle motion.
- Small and honest: not mass produced, not instant, printed after the order arrives.

The visual language uses:

- Dark charcoal and smoke backgrounds (plus a warm light theme).
- Bone, stone, soft metal, muted amber, clay, moss, and warm neutral accents.
- The black-and-white Gadjit Prints logo as a restrained inverse brand accent.
- Refined typography with an editorial feel.
- Soft shadows, layered depth, dimensional product cards.
- Tactile hover states and smooth reveal animations.
- Real photos of finished prints, never machine or process photos.

Avoid:

- Purple-heavy AI-style gradients.
- Generic startup landing page patterns.
- Generic ecommerce product grids that feel off-the-shelf.
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
5. The piece is printed after the order arrives, checked, and shipped from Texas. Etsy sends tracking and order updates.

The site never shows a price. Product pages say "Price on Etsy" and link to the listing, so a stale price can never appear. The Etsy link keeps the referrer (`rel="noopener"`, not `noreferrer`) so Etsy shop stats credit the website as a traffic source.

## Product Catalog

All products live in `src/data/catalog.js` as the `products` array. Every product is an **active Etsy listing**; there are no studio-only or sample products. The previous MakerWorld-based configurable products (QR business card, QR code business stand, initial ornament, door hanger, luggage tag, name plate stand) and the email configurator were retired in November 2026 because none of them were sold anymore.

Current listings (checked 2026-11-18):

1. Soccer Trophy Cup: `soccer-trophy-cup`, Etsy listing `4523619401`, Decor & Collectibles.
2. Nikon 200–500mm Lens Hood: `nikon-200-500mm-lens-hood`, Etsy listing `4594768652`, Camera Gear.

How to add, update, or remove a listing: see `docs/CATALOG_UPDATES.md`.

### Product Data Shape

```js
{
  slug: 'soccer-trophy-cup',            // URL: /collection/soccer-trophy-cup. Keep stable once published.
  title: 'Soccer Trophy Cup',
  type: 'Championship display trophy',  // optional short descriptor; falls back to category
  category: 'Decor & Collectibles',     // drives the Category filter
  imageUrls: ['https://i.etsystatic.com/...'], // Etsy-hosted listing photos or local files in public/
  copy: 'Short description written for the website.',
  includes: ['Printed in PLA', 'Made to order'], // optional chips on cards and the detail page
  etsy: {
    listingId: '4523619401',            // stable Etsy listing ID; the link is built from it
    personalization: 'none',            // 'none' | 'optional' | 'required'
    hasOptions: false,                  // true when the listing has variations (size, color, ...)
  },
}
```

Rules enforced by `npm run test:catalog`:

- Unique kebab-case slugs and unique numeric listing IDs.
- `title`, `copy`, and `category` are required; at least one photo is required.
- Photos are local files that exist in `public/` or `https://i.etsystatic.com/` listing photos.
- Every product has `etsy.listingId`; the generated URL is `https://www.etsy.com/listing/<id>`.
- No `price` field.

Helpers in the same file (shared by the UI and the check): `getEtsyListingUrl`, `getEtsyActionLabel`, `getEtsyOptionsNote`, `needsEtsyCustomization`, `getShowcaseImages`, `isEtsyProduct`, and `etsyShopUrl`.

## Website Pages

The app is a client-rendered Vite + React SPA using React Router.

- `/` Homepage: hero with product photos, "Available now" carousel of the listings, ribbon, how-ordering-works preview, studio callout.
- `/collection` All listings with a Category filter. If the catalog is empty it shows "New pieces are on the way" with a link to the Etsy shop.
- `/collection/:slug` Product page: photo gallery with thumbnails, description, includes chips, and a buybox with "Price on Etsy", the options note, and the Etsy button. Unknown or retired slugs redirect to `/collection`.
- `/collection/:slug/configure` Legacy configurator URL; redirects to `/collection/:slug`.
- `/process` How it works: browse here, order on Etsy, printed to order, shipped from Texas.
- `/studio` About the studio, including the small Gadjit note.
- `/quote` Redirects to `/collection`.
- `*` Redirects to `/collection`.

## Frontend Structure

- `src/main.jsx`: routing, layout (`SiteShell` with the appearance control), pages, and components.
- `src/data/catalog.js`: product data and pure catalog helpers (no JSX, importable from Node).
- `src/styles.css`: global CSS, design tokens, light theme overrides, responsive layout.
- `public/theme.js`: runs before paint to apply the system/light/dark preference.
- `public/brand/gadjitprints-logo.webp`: logo used in the UI; `gadjitprints-logo.png` is the source asset.
- `index.html`: Vite entry HTML.
- `scripts/catalog-check.mjs`, `scripts/theme-check.mjs`: Node checks.

Important components in `src/main.jsx`: `App`, `ScrollToTop`, `SiteShell`, `Home`, `Hero`, `FeaturedWork`, `CategoryRibbon`, `ProcessPreview`, `StudioCallout`, `Collection`, `Process`, `Studio`, `ProductCard`, `ProductDetail`, `ProductDetailContent`, `LegacyConfigureRedirect`, `ProductMedia`, `EtsyLink`, `ShopLink`, `FilterGroup`, `Footer`.

The JSX uses the classic transform (there is no Vite React plugin), so `src/main.jsx` must keep `import React from 'react'`. Without it the build succeeds but every page renders blank.

## Styling Architecture

Custom CSS, no Tailwind. Tokens live on `:root` in `src/styles.css`, with `:root[data-theme='light']` overrides. Cards use radii of 8px or less, amber accents, soft shadows, and subtle reveal motion, with a `prefers-reduced-motion` fallback. Breakpoints are around `980px` and `640px`.

Useful areas: `.site-header`, `.hero`, `.hero-objects`, `.catalog-card`, `.catalog-etsy-note`, `.etsy-button`, `.product-detail-page`, `.detail-buybox`, `.buybox-etsy-note`, `.object-wall`, `.about-image`, `.footer-links`. Some CSS for the retired configurator and material pickers (`.material-badge`, `.swatch-*`, `.configure-*`, `.product-visual`) is still in the file but unused.

## Backend Structure

There is no custom backend, API route, database, or server function. Product data is hand-maintained in `src/data/catalog.js`. A read-only Etsy Open API v3 sync is planned for when Etsy developer access is approved (see `docs/CATALOG_UPDATES.md`).

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
```

## Current Known Limitations

- The catalog is maintained by hand until the Etsy API sync exists.
- Product photos are loaded from Etsy's image CDN.
- The checks do not render the app, so always open the site in a browser before shipping.
- No full accessibility audit has been done yet.

## Guidelines For Future AI Work

- Read this file first; check it against the current source and update it when decisions change.
- Keep the website a discovery layer. Etsy handles options, personalization, payment, shipping, inventory, and orders.
- Link to the exact listing by ID. Do not show prices, stock, or ratings on the site.
- Only list active Etsy listings in the catalog.
- Do not reintroduce quote forms, the email configurator, or material/color pickers unless explicitly requested.
- Do not add heart/share buttons or 3D printer machine imagery.
- Keep the visual tone dark, premium, warm, and tactile, and keep the light theme working.
- Keep Houston and Gadjit references limited to the Studio page.
- Preserve the Vercel SPA rewrite.
- Run `npm run build`, `npm run test:catalog`, and `npm run test:theme`, then check the pages in a browser.
