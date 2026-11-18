// Product catalog data. Plain JavaScript (no JSX) so node scripts such as
// scripts/catalog-check.mjs can import it directly.

export const materialInfo = {
  PLA: {
    title: 'PLA',
    summary: 'Best for decorative pieces, gifts, display objects, and lower-cost orders.',
    pros: 'Affordable, crisp detail, broad color range, clean matte finishes.',
    cons: 'More brittle than PETG and not ideal for hot cars, high stress, or long sun exposure.',
  },
  PETG: {
    title: 'PETG',
    summary: 'Best for stronger functional pieces that need more flex and day-to-day toughness.',
    pros: 'More impact resistant than PLA, better layer strength, handles moisture well.',
    cons: 'Slightly less crisp visually and usually costs more than PLA.',
  },
  ABS: {
    title: 'ABS',
    summary: 'Best for sun, heat, outdoor exposure, and pieces that may live in warm places.',
    pros: 'Good heat resistance, better UV/sun suitability, strong for practical use.',
    cons: 'Fewer color options, rougher print behavior, and a higher-cost production setup.',
  },
};

export const colorLibrary = {
  'Silk hot pink': {
    swatch: '#ff4faf',
    swatchStyle: 'linear-gradient(135deg, #ff9bd4, #ff4faf 48%, #b71374)',
    materials: ['PLA'],
  },
  'Silk purple': {
    swatch: '#8d50d8',
    swatchStyle: 'linear-gradient(135deg, #c6a0ff, #8d50d8 52%, #4b238f)',
    materials: ['PLA'],
  },
  Orange: { swatch: '#f47a24', materials: ['PLA'] },
  'Glow blue': {
    swatch: '#7ad8ff',
    swatchStyle: 'radial-gradient(circle at 35% 30%, #e8fbff, #7ad8ff 52%, #2f83bb)',
    materials: ['PLA'],
    priceAdd: 5,
    priceNote: 'Glow PLA +$5',
  },
  Green: { swatch: '#32a852', materials: ['PLA', 'PETG'] },
  Blue: { swatch: '#2466e8', materials: ['PLA', 'PETG'] },
  Red: { swatch: '#d6292f', materials: ['PLA', 'PETG'] },
  White: { swatch: '#f5f1e8', materials: ['PLA', 'PETG', 'ABS'] },
  Black: { swatch: '#11100e', materials: ['PLA', 'PETG', 'ABS'] },
  'Galaxy black': {
    swatch: '#17171c',
    swatchStyle:
      'radial-gradient(circle at 30% 28%, #d6d0ff 0 2px, transparent 3px), radial-gradient(circle at 66% 62%, #9bdcff 0 1px, transparent 3px), linear-gradient(135deg, #2d2d38, #111117)',
    materials: ['PLA'],
    priceAdd: 4,
    priceNote: 'Galaxy PLA +$4',
  },
};

const colorNames = Object.keys(colorLibrary);
export const productColors = colorNames.map((name) => ({
  name,
  ...colorLibrary[name],
}));

export const products = [
  {
    slug: 'qr-business-card',
    title: 'QR Business Card',
    type: 'Custom contact card',
    category: 'Business & Branding',
    variant: 'business-card',
    sourceUrl: 'https://makerworld.com/en/models/2584791-business-card-bc036qr?from=recommend#profileId-2851280',
    imageUrls: [
      'https://wsrv.3dprinterfiles.com/?h=828&n=40&output=webp&q=100&url=https%3A%2F%2Fmakerworld.bblmw.com%2Fmakerworld%2Fmodel%2FUSa79b282bc488cd%2Fdesign%2F98883af3adbe048c.png&w=828',
      'https://wsrv.3dprinterfiles.com/?h=828&n=40&output=webp&q=100&url=https%3A%2F%2Fmakerworld.bblmw.com%2Fmakerworld%2Fmodel%2FUSa79b282bc488cd%2Fdesign%2Fbe65cd04b4540925.jpg&w=828',
    ],
    copy: 'A rigid printed business card with raised text, a scannable QR area, and a clean pocketable profile.',
    colors: productColors,
    config: ['Name and title', 'QR destination', 'Logo or small icon'],
    price: 'From $18',
    leadTime: '2-4 studio days',
    dimensions: 'Standard card footprint',
    printDimensions: {
      width: 80,
      height: 55,
      depth: 3,
      note: 'Fixed reference card size from the source model; raised QR and text details are included in the thickness estimate.',
    },
    finish: 'Flat two-tone detail',
    includes: ['QR code area', 'Custom name text', 'Optional logo mark'],
  },
  {
    slug: 'qr-code-business-stand',
    title: 'QR Code Business Stand',
    type: 'In-house QR display stand',
    category: 'Business & Branding',
    variant: 'qr-plate',
    badge: 'In-house design',
    configureType: 'qr-stand',
    imageUrls: ['/products/qr-code-business-stand-hero.webp', '/products/qr-code-business-stand-print-bed.webp'],
    copy: 'A custom counter stand for QR payments, social follows, menus, contact links, booths, and small business displays.',
    colors: productColors,
    config: ['Top text', 'QR color', 'Bottom text or logo', 'Rear ornament'],
    price: 'From $35',
    leadTime: '7-10 studio days',
    dimensions: 'Countertop display scale',
    printDimensions: {
      width: 140,
      height: 110,
      depth: 75,
      note: 'Approximate in-house countertop footprint. Final stand depth and ornament size are confirmed during studio review.',
    },
    finish: 'Multi-color raised QR display',
    includes: ['In-house stand design', 'Custom text zones', 'QR code panel', 'Optional rear ornament'],
    inHouseNote:
      'Designed entirely in house by Gadjit Prints. The base plate, QR panel, text boxes, bottom logo area, and optional rear ornament can be tuned for each order.',
  },
  {
    slug: 'initial-ornament-name',
    title: 'Initial Ornament & Name',
    type: 'Personal ornament',
    category: 'Ornaments & Gifts',
    variant: 'ornament',
    sourceUrl:
      'https://makerworld.com/en/models/2740326-fully-customizable-initial-ornament-and-name#profileId-3038641',
    customizeUrl:
      'https://makerworld.com/en/makerlab/parametricModelMaker?designId=2740326&from=model_page&modelName=nombre-v3.scad&protected=true&unikey=a926126f-79e1-4363-aeeb-382ea6aede75',
    imageUrls: ['/products/initial-ornament-name.png'],
    copy: 'A personalized ornament built around a large initial, custom name text, and a finished hanging loop.',
    colors: productColors,
    config: ['Initial letter', 'Name text', 'Loop style'],
    price: 'From $16',
    leadTime: '2-4 studio days',
    dimensions: '3-5 in ornament span',
    printDimensions: {
      width: 100,
      height: 100,
      depth: 4,
      note: 'Approximate standard ornament span. Long names, wide letters, or custom loop choices can change the final footprint.',
    },
    finish: 'Layered raised lettering',
    includes: ['Large initial', 'Custom name', 'Hanging loop'],
  },
  {
    slug: 'custom-door-hanger',
    title: 'Custom Door Hanger',
    type: 'Door sign',
    category: 'Signs & Labels',
    variant: 'door-hanger',
    sourceUrl:
      'https://makerworld.com/en/models/2737514-customizable-door-hanger-text-svg-emoji-support#profileId-3035138',
    imageUrls: ['/products/custom-door-hanger.png'],
    copy: 'A customizable door hanger with text, SVG, or emoji-style artwork support for rooms, studios, and events.',
    colors: productColors,
    config: ['Front text', 'Icon or SVG', 'Single or two-tone'],
    price: 'From $22',
    leadTime: '3-5 studio days',
    dimensions: 'Standard door-hanger scale',
    printDimensions: {
      width: 89,
      height: 216,
      depth: 4,
      note: 'Standard door-hanger footprint with a knob cutout. Custom graphics may change the usable text area.',
    },
    finish: 'Durable readable face',
    includes: ['Custom phrase', 'Graphic option', 'Door knob cutout'],
  },
  {
    slug: 'qr-luggage-bag-tag',
    title: 'QR Luggage / Bag Tag',
    type: 'Travel tag',
    category: 'Travel & Gear',
    variant: 'bag-tag',
    sourceUrl: 'https://makerworld.com/en/models/710726-custom-qr-code-luggage-bag-tag?from=search#profileId-641133',
    imageUrls: [
      'https://makerworld.bblmw.com/makerworld/model/USc7eb59bdce5c4b/design/2024-10-17_4706bf9541546.jpg?x-oss-process=image%2Fresize%2Cw_1000%2Fformat%2Cwebp',
      'https://makerworld.bblmw.com/makerworld/model/USc7eb59bdce5c4b/design/2024-10-17_6e2de6ddb58ca.jpg?x-oss-process=image%2Fresize%2Cw_1000%2Fformat%2Cwebp',
    ],
    copy: 'A custom travel tag with a QR code, name field, and sturdy strap slot for luggage, backpacks, and gear bags.',
    colors: productColors,
    config: ['QR destination', 'Name or handle', 'Tag size'],
    price: 'From $20',
    leadTime: '2-4 studio days',
    dimensions: 'Medium or large tag',
    printDimensions: {
      width: 108,
      height: 64,
      depth: 3,
      note: 'Medium luggage-tag footprint. The parametric source supports tag-size changes and recommends at least 2 mm thickness.',
    },
    finish: 'Raised QR and text panel',
    includes: ['QR code panel', 'Name field', 'Strap slot'],
  },
  {
    slug: 'qr-nameplate-stand',
    title: 'QR Name Plate Stand',
    type: 'Desk or wall nameplate',
    category: 'Business & Branding',
    variant: 'qr-plate',
    sourceUrl:
      'https://makerworld.com/en/models/2614672-customizable-qr-code-name-plate-stand-or-wall?from=search#profileId-2885404',
    imageUrls: [
      'https://wsrv.3dprinterfiles.com/?h=828&n=40&output=webp&q=100&url=https%3A%2F%2Fmakerworld.bblmw.com%2Fmakerworld%2Fmodel%2FUS86fd7a65b8c7f0%2Fdesign%2F0c7a09d0b146db1f.jpg&w=828',
      'https://wsrv.3dprinterfiles.com/?h=828&n=40&output=webp&q=100&url=https%3A%2F%2Fmakerworld.bblmw.com%2Fmakerworld%2Fmodel%2FUS86fd7a65b8c7f0%2Fdesign%2F589c7773c818d9aa.jpg&w=828',
      'https://wsrv.3dprinterfiles.com/?h=828&n=40&output=webp&q=100&url=https%3A%2F%2Fmakerworld.bblmw.com%2Fmakerworld%2Fmodel%2FUS86fd7a65b8c7f0%2Fdesign%2Ff50dbabe572c2658.jpg&w=828',
    ],
    copy: 'A configurable name plate with QR code support that can sit on a desk or mount to a wall.',
    colors: productColors,
    config: ['Display text', 'QR destination', 'Stand or wall mount'],
    price: 'From $26',
    leadTime: '3-5 studio days',
    dimensions: '5-10 in width',
    printDimensions: {
      width: 200,
      height: 70,
      depth: 65,
      note: 'Approximate desktop stand footprint. The parametric source can change width, height, thickness, stand depth, and wall-mount details.',
    },
    finish: 'Raised two-tone signage',
    includes: ['QR code panel', 'Custom display name', 'Stand or wall option'],
  },
  // Etsy listings. Options, personalization, price, checkout, and shipping all happen on Etsy.
  // Source of truth: https://www.etsy.com/listing/4523619401 (checked 2026-11-18).
  {
    slug: 'soccer-trophy-cup',
    title: 'Soccer Trophy Cup',
    type: 'Championship display trophy',
    category: 'Decor & Collectibles',
    variant: 'ornament',
    // Etsy-hosted listing photos (794 px wide). Swap for optimized local copies in public/products/etsy/ later.
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

export function getProductMaterials(product) {
  const availableMaterials = new Set((product?.colors ?? []).flatMap((color) => color.materials ?? []));
  return Object.keys(materialInfo).filter((material) => availableMaterials.has(material));
}

export function getDefaultMaterial(product) {
  return getProductMaterials(product)[0];
}

export function getColorsForMaterial(product, material) {
  return (product?.colors ?? []).filter((color) => (color.materials ?? []).includes(material));
}

// True when the site itself can show material and color choices for a product.
// Etsy listings without known material data return false and defer options to Etsy.
export function hasFinishOptions(product) {
  return getProductMaterials(product).length > 0;
}
