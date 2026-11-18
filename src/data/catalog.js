// Product catalog: the active listings in the Gadjit Prints Etsy shop.
// Plain JavaScript (no JSX) so node scripts such as scripts/catalog-check.mjs can import it.
//
// The website is where customers discover products. Etsy is where they choose options,
// add personalization, pay, and get shipping updates. Keep prices, stock, and checkout
// details out of this file; link to the listing instead.
//
// To add or update a listing, follow docs/CATALOG_UPDATES.md and run `npm run test:catalog`.

export const etsyShopUrl = 'https://www.etsy.com/shop/GadjitNet';

export const products = [
  // Source of truth: https://www.etsy.com/listing/4523619401 (checked 2026-11-18).
  {
    slug: 'soccer-trophy-cup',
    title: 'Soccer Trophy Cup',
    type: 'Championship display trophy',
    category: 'Decor & Collectibles',
    // Etsy-hosted listing photos (794 px wide).
    imageUrls: [
      'https://i.etsystatic.com/64616969/r/il/6cd8e6/8148566642/il_794xN.8148566642_11hv.jpg',
      'https://i.etsystatic.com/64616969/r/il/cd34ad/8196480903/il_794xN.8196480903_9b71.jpg',
    ],
    copy: 'A lightweight championship-style trophy for watch parties, team awards, fantasy leagues, and soccer-themed shelves. Printed to order, with small layer lines that make each piece its own. A fan-made decorative piece, not affiliated with any official soccer organization.',
    includes: ['Printed in PLA', 'Made to order', 'Ships from Texas'],
    etsy: {
      listingId: '4523619401',
      personalization: 'none',
      hasOptions: false,
    },
  },
  // Source of truth: https://www.etsy.com/listing/4594768652 (checked 2026-11-18).
  {
    slug: 'nikon-200-500mm-lens-hood',
    title: 'Nikon 200–500mm Lens Hood',
    type: 'HB-71 compatible replacement hood',
    category: 'Camera Gear',
    imageUrls: [
      'https://i.etsystatic.com/64616969/r/il/23d7d8/8672734822/il_794xN.8672734822_7q3p.jpg',
      'https://i.etsystatic.com/64616969/r/il/f4dc93/8672734810/il_794xN.8672734810_hq8t.jpg',
      'https://i.etsystatic.com/64616969/r/il/10e8f8/8720567331/il_794xN.8720567331_11f0.jpg',
      'https://i.etsystatic.com/64616969/r/il/3b8a0e/8672734818/il_794xN.8672734818_9zqs.jpg',
    ],
    copy: 'A twist-on replacement hood for the Nikon AF-S NIKKOR 200–500mm f/5.6E ED VR. It shades the front of the lens and adds a buffer against bumps. A compatible 3D-printed replacement, not an original Nikon accessory, so please check your lens model before ordering.',
    includes: ['Printed in PETG', 'Twist-on fit', 'Made to order', 'Ships from Texas'],
    etsy: {
      listingId: '4594768652',
      personalization: 'none',
      hasOptions: false,
    },
  },
];

// ---------------------------------------------------------------------------
// Catalog helpers (pure functions, shared by the UI and scripts/catalog-check.mjs)
// ---------------------------------------------------------------------------

export const personalizationModes = ['none', 'optional', 'required'];

export function isEtsyProduct(product) {
  return Boolean(product?.etsy?.listingId);
}

// Always link to the canonical listing URL built from the stable listing ID,
// so tracking parameters or renamed listing slugs never leak into the site.
export function getEtsyListingUrl(product) {
  return isEtsyProduct(product) ? `https://www.etsy.com/listing/${product.etsy.listingId}` : null;
}

export function needsEtsyCustomization(product) {
  const etsy = product?.etsy ?? {};
  return etsy.personalization === 'optional' || etsy.personalization === 'required' || Boolean(etsy.hasOptions);
}

export function getEtsyActionLabel(product) {
  return needsEtsyCustomization(product) ? 'Customize on Etsy' : 'View on Etsy';
}

export function getEtsyOptionsNote(product) {
  const etsy = product?.etsy ?? {};
  if (etsy.personalization === 'required') {
    return 'This piece is personalized. You will enter your details on Etsy before checkout.';
  }
  if (etsy.personalization === 'optional') {
    return 'Personalization is optional and is added on Etsy when you order.';
  }
  if (etsy.hasOptions) {
    return 'Choose the available options for this piece on Etsy.';
  }
  return 'Ordered through Etsy. Etsy handles checkout, payment, and shipping.';
}

// Photos for decorative homepage and studio moments: the first photo of each product,
// then second photos, and so on, so a small catalog still fills the layout.
export function getShowcaseImages(items, count) {
  const images = [];
  const longest = Math.max(0, ...items.map((product) => product.imageUrls?.length ?? 0));
  for (let index = 0; index < longest && images.length < count; index += 1) {
    for (const product of items) {
      const imageUrl = product.imageUrls?.[index];
      if (imageUrl && images.length < count) {
        images.push({ product, imageUrl, index });
      }
    }
  }
  return images;
}
