# Gadjit Prints Website Context

This document is intended to give an AI model enough context to understand, maintain, redesign, or extend the Gadjit Prints website without needing the full conversation history.

## Project Summary

Gadjit Prints is a modern premium website for a custom 3D printing service. The current business direction is an expandable product catalog where customers choose an available print, then configure supported colors, materials, text, QR codes, labels, sizing, and product-specific content options.

The Houston-area and Gadjit connection should only appear as a small About-page note. Gadjit Prints has a quiet connection to Gadjit, a camera business with more than 10 years of experience around used and open-box camera gear, but that should not be the main site positioning. The primary message is custom 3D printing.

The website should feel cinematic, refined, tactile, and artisan. It should communicate made-to-order care, custom 3D print accessibility, and material awareness without becoming a generic ecommerce template, a mass-market tech store, or a technical 3D printer showcase.

The user specifically does not want imagery of 3D printer machines. Visuals should focus on finished printed objects, simple atmospheric product backgrounds, and polished presentation.

## Brand And Design Ideology

The brand personality is:

- Personal but practical: configurable products that are easy to order and made after selection.
- Artisan and premium: careful, tactile, considered.
- Modern fabrication with warmth: digital precision softened by handcrafted presentation.
- Calm and confident: no aggressive sales copy, no corporate tone.
- Design-forward: editorial typography, generous spacing, dark atmospheric surfaces, subtle motion.
- Small and honest: not mass produced, not instant, and not pretending every color or material is available.
- Customer-aware: orders are reviewed, tuned, and communicated about before production.
- Service-first: the main focus is a custom 3D printing service, not the parent-company or Houston origin story.

The visual language should use:

- Dark charcoal and smoke backgrounds.
- Bone, stone, soft metal, muted amber, clay, moss, and warm neutral accents.
- The black-and-white Gadjit Prints logo as a restrained inverse brand accent.
- Refined typography with an editorial feel.
- Soft shadows, layered depth, dimensional product cards.
- Tactile hover states and smooth reveal animations.
- Product images or styled product-like renders, not machine/process photos.

Avoid:

- Purple-heavy AI-style gradients.
- Generic startup landing page patterns.
- Generic ecommerce product grids that feel off-the-shelf.
- Copy that implies mass production, instant fulfillment, or unlimited customization.
- Dropdown-heavy configuration flows.
- Open quote/request forms for now.
- Heart/share buttons on product cards.
- Bidding, auction, or marketplace mechanics.

## Current Product Strategy

The website currently has several configurable products sourced from MakerWorld reference models. The catalog is expected to grow, so no product count should be treated as special in the UI or copy.

1. QR Business Card
   - Slug: `qr-business-card`
   - Type: custom contact card
   - Category: Business & Branding
   - Has real listing images.

2. Initial Ornament & Name
   - Slug: `initial-ornament-name`
   - Type: personal ornament
   - Category: Ornaments & Gifts
   - Uses a styled fallback render because automated image access was blocked.

3. Custom Door Hanger
   - Slug: `custom-door-hanger`
   - Type: door sign
   - Category: Signs & Labels
   - Uses a styled fallback render because automated image access was blocked.

4. QR Luggage / Bag Tag
   - Slug: `qr-luggage-bag-tag`
   - Type: travel tag
   - Category: Travel & Gear
   - Has real listing images.

5. QR Name Plate Stand
   - Slug: `qr-nameplate-stand`
   - Type: desk or wall nameplate
   - Category: Business & Branding
   - Has real listing images.

6. QR Code Business Stand
   - Slug: `qr-code-business-stand`
   - Type: in-house QR display stand
   - Category: Business & Branding
   - Uses local optimized images in `public/products`.
   - This is an in-house Gadjit Prints design and should show a subtle `In-house design` badge/callout.
   - Configurable fields include template, top text, bottom text, optional bottom logo, QR content, rear ornament, base color, text box color, QR color, and rear ornament color.

Each product supports a fixed set of color options. Each color has a subset of available materials, not every material in every color. Products may also support configurable content such as names, initials, QR destinations, labels, phrases, icons, sizing, mounting, or layouts. This is important: the UI should communicate real option constraints instead of implying infinite customization.

The catalog is not meant to feel like shelf inventory. Products are made after the customer outlines the configuration, and the studio should clearly communicate that previews, clarification, and longer wait times are part of the more careful ordering process.

## Materials Model

The material model lives in `src/main.jsx` as `materialInfo`.

Supported materials:

- PLA
  - Best for decorative pieces, gifts, display objects, and lower-cost orders.
  - Affordable, crisp detail, broad color range, clean matte finishes.
  - More brittle than PETG and not ideal for hot cars, high stress, or long sun exposure.

- PETG
  - Best for stronger functional pieces that need more flex and day-to-day toughness.
  - More impact resistant than PLA, better layer strength, handles moisture well.
  - Slightly softer surface detail and fewer ultra-matte color options.

- ABS
  - Best for sun exposure, hotter environments, and exterior-leaning utility parts.
  - Better heat resistance than PLA or PETG, more suitable for outdoor use.
  - Fewer finish options and may require more post-print cleanup.

The UI exposes this through material badges with hover/focus tooltips. Disabled material choices remain visible but unavailable when a selected color does not support that material.

## Color Model

The color model lives in `src/main.jsx` as `colorLibrary`. Product colors reference the library by name and inherit:

- `swatch`: the visual color value.
- `materials`: the available material options for that color.

The product model maps color names into full color objects, for example:

```js
colors: ['Bone', 'Charcoal', 'Amber', 'Stone'].map((name) => ({ name, ...colorLibrary[name] }))
```

When adding a new product, prefer reusing existing color library names. If adding a new color, update `colorLibrary` first and include realistic available materials.

## Website Pages

The app uses React Router and is a client-rendered Vite SPA.

Routes:

- `/`
  - Homepage.
  - Cinematic hero, configurable service positioning, featured products, process/material/category sections.

- `/collection`
  - Main products page.
  - Amazon/listing-inspired product cards, but restyled into the dark premium Gadjit Prints design language.
  - Includes filters and configurable product cards.
  - Each card has color and material selectors and a `Configure` button.

- `/collection/:slug`
  - Product detail/listing page.
  - Inspired by Amazon product detail layout, but not visually copied.
  - Includes breadcrumbs, thumbnail gallery, large product media area, product description, specs, available configuration, buybox-style configuration panel, and reference model link.

- `/collection/:slug/configure`
  - Lightweight product configuration page.
  - Lets customers choose finish, enter text, QR content, logo/file notes, size/layout requests, studio notes, and contact details.
  - Generates a configuration summary and opens a prefilled `mailto:` draft to the studio email.

- `/process`
  - Process page.
  - Explains the configurable made-to-order workflow, including studio review and communication before production.

- `/studio`
  - About/studio page.
  - Communicates Gadjit Prints as a custom 3D printing service with careful printing, order-by-order finishing, and no mass-production positioning.
  - May include a small shoutout to the Houston-area origin and Gadjit connection, but this should not dominate the page.

- `/quote`
  - Currently redirects to `/collection`.
  - Quote/request form was intentionally removed for now.

- `*`
  - Redirects unknown routes to `/collection`.

## Frontend Structure

Primary source files:

- `src/main.jsx`
  - React app, routing, product data, components, configuration UI, product visuals.

- `src/styles.css`
  - Global CSS, design tokens, responsive layout, product render shapes, card styles, detail page styles, animations.

- `index.html`
  - Vite entry HTML.

- `package.json`
  - Scripts and dependencies.

- `vercel.json`
  - Vercel build settings and SPA rewrite configuration.

- `public/brand/gadjitprints-logo.webp`
  - Optimized official Gadjit Prints logo used by the live UI. Use it in restrained brand moments such as the header, footer, or subtle watermark treatments.

- `public/brand/gadjitprints-logo.png`
  - Original larger source logo retained as a backup/source asset.

Important components in `src/main.jsx`:

- `App`
  - Top-level router layout.

- `ScrollToTop`
  - Scrolls to top on route changes.

- `Home`
  - Homepage composition.

- `Collection`
  - Products/catalog page with filter state.

- `ProductCard`
  - Listing-style configurable product card.
  - Maintains selected color and material state locally.
  - Uses `ProductMedia` to show real product photos when available.
  - Shows a subtle product badge when `product.badge` exists.

- `ProductDetail`
  - Looks up product by URL slug.

- `ProductDetailContent`
  - Full product detail layout.
  - Maintains selected color, material, and selected image index.
  - Shows real image thumbnails when `product.imageUrls` exists.
  - Falls back to color-based `ProductVisual` thumbnails when no images are available.

- `ProductMedia`
  - Chooses between real product images and the CSS-rendered `ProductVisual` fallback.

- `QrStandConfigureFields`
  - Product-specific configuration UI for the in-house QR Code Business Stand.
  - Supports Custom, Facebook Stand, Zelle Stand, and Instagram Stand templates plus multiple color zones.

- `ColorSwatches`
  - Color selector UI.

- `MaterialChoices`
  - Material selector row.

- `MaterialBadge`
  - Material button/span with tooltip explaining strengths and weaknesses.

- `ProductVisual`
  - CSS-based dimensional fallback object render.
  - Uses product `variant` classes and a selected color tone.

- `Footer`
  - Site footer.

## Product Data Shape

Each product object generally follows this shape:

```js
{
  slug: 'qr-business-card',
  title: 'QR Business Card',
  type: 'Custom contact card',
  category: 'Business & Branding',
  variant: 'business-card',
  sourceUrl: 'https://makerworld.com/...',
  imageUrls: ['https://...'],
  copy: 'Short product description.',
  colors: ['Bone', 'Charcoal'].map((name) => ({ name, ...colorLibrary[name] })),
  config: ['Name and title', 'QR destination', 'Logo or small icon'],
  price: 'From $18',
  leadTime: '2-4 studio days',
  dimensions: 'Standard card footprint',
  finish: 'Flat two-tone detail',
  includes: ['QR code area', 'Custom name text', 'Optional logo mark']
}
```

Fields with special behavior:

- `slug`: controls product detail URL.
- `variant`: controls fallback CSS product visual class.
- `sourceUrl`: external reference model link shown on the detail page.
- `imageUrls`: real product listing photos. If empty, the UI falls back to `ProductVisual`.
- `colors`: controls swatches and available material options.
- `config`: shown as product capability tags.
- `badge`: optional product badge, currently used for the in-house QR stand.
- `configureType`: optional product-specific configure form switch, currently `qr-stand`.
- `inHouseNote`: optional detail-page callout copy for in-house products.

## Styling Architecture

The site uses custom CSS rather than Tailwind. CSS variables are defined in `:root` in `src/styles.css`.

Key styling concepts:

- The page background uses layered dark radial gradients.
- Product cards use restrained borders, warm amber accents, and soft shadows.
- Buttons use amber/gold gradients but should remain refined.
- Cards use small border radii around 8px or less.
- Motion is subtle: reveal animations, hover lift, product visual transforms.
- There is a `prefers-reduced-motion` media query to reduce animations for users who prefer it.
- Responsive breakpoints exist around `980px` and `640px`.

Important CSS areas:

- Header and navigation: `.site-header`, `.brand`, `.nav-links`.
- Hero: `.hero`, `.hero-content`, `.hero-objects`.
- Product fallback renders: `.product-visual` and variant classes such as:
  - `.product-business-card`
  - `.product-ornament`
  - `.product-door-hanger`
  - `.product-bag-tag`
  - `.product-qr-plate`
- Catalog cards: `.catalog-card`, `.catalog-media`, `.catalog-options`, `.configure-button`.
- Real product images: `.product-photo`.
- Detail page: `.product-detail-page`, `.detail-layout`, `.detail-thumbs`, `.detail-gallery`, `.detail-buybox`.
- Material UI: `.material-badge`, `.material-tooltip`.

## Backend Structure

There is currently no custom backend.

The site is a static/client-rendered Vite React application. All product data is hardcoded in `src/main.jsx`. There are no API routes, databases, authentication flows, payment integrations, quote submissions, or server-side functions.

This is intentional for the current version. The site is acting as a polished product catalog and configuration presentation layer.

Potential future backend additions:

- Product/configuration CMS or JSON data source.
- Contact or quote request form.
- Cart or checkout.
- Inventory-aware material/color availability.
- Image hosting pipeline.
- Admin panel for adding new designs.
- Parametric STL/3MF generation from customer configuration JSON and product source templates.
- Local configuration pages that generate email-ready customer specs, with MakerWorld links kept as references for supported parametric products.

## Deployment Structure

The app is configured for Vercel.

`package.json` scripts:

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

`vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

The rewrite is important because React Router handles routes such as `/collection/qr-business-card` on the client. Without the rewrite, direct visits to nested routes can 404 on Vercel.

The domain discussed during setup is:

- `gadjitprints.store`
- `www.gadjitprints.store`

The current preferred behavior was that the apex domain redirects to `www.gadjitprints.store`.

## Development Commands

Install dependencies:

```bash
npm install
```

Run local dev server:

```bash
npm run dev
```

Build production output:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

The local Vite server commonly runs at:

```text
http://127.0.0.1:5173
```

## Current Known Limitations

- Product data is hardcoded in React.
- No real purchase, cart, quote, or inquiry flow exists yet.
- Configure buttons lead to `/collection/:slug/configure`, where customers can copy or email their specs.
- Some product images are stored locally in `public/products`, while others still use externally hosted reference images.
- Real image URLs are externally hosted. For production reliability, it may be better to download, license-check, optimize, and serve images from the project or a dedicated asset host.
- There is no automated test suite.
- Accessibility is considered in button labels and semantic structure, but a full accessibility audit has not been performed.

## Guidelines For Future AI Work

When modifying this project, preserve these principles:

- Keep the catalog expandable and product-based, with clear configurable options for each item.
- Do not reintroduce quote forms unless explicitly requested.
- Do not add project type dropdowns.
- Do not add heart/share buttons to listing cards.
- Do not add 3D printer machine imagery.
- Keep visual tone dark, premium, warm, and tactile.
- Keep copy grounded in the Gadjit Prints philosophy: custom 3D printing service, made after selection, not mass produced, longer wait times accepted for a more personal result.
- Keep Houston and Gadjit references limited to the About section as a small supporting note.
- Keep product cards listing-like, but aligned with the site color scheme.
- Keep material/color constraints visible and honest.
- Prefer reusable React components and local product data patterns already present.
- Preserve Vercel SPA rewrites.
- If adding product images, use `imageUrls` and let `ProductMedia` handle fallback behavior.

## Suggested Next Enhancements

High-value next steps:

- Add local optimized images for all products.
- Add a non-dropdown product expansion pattern for future designs, such as category filter chips or searchable product cards.
- Replace `studioEmail` in `src/main.jsx` with the final production inbox if different from the current value.
- Move `products`, `colorLibrary`, and `materialInfo` into separate data files when the catalog grows.
- Add basic analytics or Vercel Web Analytics.
- Add a simple test or smoke check for all routes.
