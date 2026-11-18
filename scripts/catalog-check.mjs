// Validates the product catalog in src/data/catalog.js and the pure helpers the UI relies on.
// Run with: npm run test:catalog
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  etsyShopUrl,
  getEtsyActionLabel,
  getEtsyListingUrl,
  getShowcaseImages,
  isEtsyProduct,
  listingCopy,
  needsEtsyCustomization,
  personalizationModes,
  products,
} from '../src/data/catalog.js';

const publicDir = new URL('../public/', import.meta.url);
const errors = [];
const fail = (product, message) => errors.push(`${product?.slug ?? '(no slug)'}: ${message}`);

// --- Helper behavior (fixtures, independent of the live catalog) ---------------------------------
const bare = { slug: 'fixture', title: 'Fixture', imageUrls: ['/a.jpg', '/b.jpg'], etsy: { listingId: '1234567890', personalization: 'none' } };
const other = { slug: 'other', title: 'Other', imageUrls: ['/c.jpg'], etsy: { listingId: '1234567891', personalization: 'required' } };
assert.equal(getEtsyListingUrl(bare), 'https://www.etsy.com/listing/1234567890');
assert.equal(getEtsyListingUrl({ slug: 'not-on-etsy' }), null);
assert.equal(getEtsyActionLabel(bare), 'View on Etsy');
assert.equal(getEtsyActionLabel(other), 'Customize on Etsy');
assert.equal(getEtsyActionLabel({ etsy: { listingId: '1', personalization: 'optional' } }), 'Customize on Etsy');
assert.equal(getEtsyActionLabel({ etsy: { listingId: '1', personalization: 'none', hasOptions: true } }), 'Customize on Etsy');
assert.equal(needsEtsyCustomization(bare), false);
assert.deepEqual(
  getShowcaseImages([bare, other], 3).map(({ imageUrl }) => imageUrl),
  ['/a.jpg', '/c.jpg', '/b.jpg'],
  'showcase takes first photos first, then second photos'
);
assert.deepEqual(getShowcaseImages([], 3), [], 'an empty catalog has no showcase images');

// --- Live catalog --------------------------------------------------------------------------------
assert.match(etsyShopUrl, /^https:\/\/www\.etsy\.com\/shop\/[A-Za-z0-9]+$/, 'etsyShopUrl must be the canonical shop URL');
assert.ok(Array.isArray(products), 'products must be an array');
if (!products.length) {
  console.warn('warning: the catalog is empty; the site will show the "New pieces are on the way" state');
}

const seenSlugs = new Set();
const seenListingIds = new Set();

for (const product of products) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug ?? '')) fail(product, 'slug must be lowercase-kebab-case');
  if (seenSlugs.has(product.slug)) fail(product, 'duplicate slug');
  seenSlugs.add(product.slug);

  for (const field of ['title', 'copy', 'category']) {
    if (typeof product[field] !== 'string' || !product[field].trim()) fail(product, `missing ${field}`);
  }

  if (!product.imageUrls?.length) fail(product, 'needs at least one real product photo');
  for (const imageUrl of product.imageUrls ?? []) {
    if (imageUrl.startsWith('/')) {
      if (!fs.existsSync(new URL(`.${imageUrl}`, publicDir))) fail(product, `image not found in public/: ${imageUrl}`);
    } else if (!/^https:\/\/i\.etsystatic\.com\//.test(imageUrl)) {
      fail(product, `photos must be local files or Etsy-hosted listing photos: ${imageUrl}`);
    }
  }

  if (!isEtsyProduct(product)) {
    fail(product, 'every catalog product must be an active Etsy listing (etsy.listingId)');
    continue;
  }

  const { listingId, personalization, hasOptions } = product.etsy;
  if (typeof listingId !== 'string' || !/^\d{6,15}$/.test(listingId)) {
    fail(product, 'etsy.listingId must be the numeric listing ID as a string');
  }
  if (seenListingIds.has(listingId)) fail(product, `duplicate Etsy listing ID ${listingId}`);
  seenListingIds.add(listingId);
  if (!personalizationModes.includes(personalization)) {
    fail(product, `etsy.personalization must be one of: ${personalizationModes.join(', ')}`);
  }
  if (hasOptions !== undefined && typeof hasOptions !== 'boolean') fail(product, 'etsy.hasOptions must be true or false');
  if (getEtsyListingUrl(product) !== `https://www.etsy.com/listing/${listingId}`) fail(product, 'Etsy URL does not match listing ID');
  if ('price' in product) fail(product, 'do not store prices here; Etsy is the source of truth for price');
}

const activeIds = new Set(products.map((product) => product.etsy?.listingId));
for (const listingId of Object.keys(listingCopy)) {
  if (!activeIds.has(listingId)) {
    console.warn(`note: website copy for listing ${listingId} is unused (the listing is not active on Etsy); it can be removed`);
  }
}
for (const product of products) {
  if (!listingCopy[product.etsy?.listingId]) {
    console.warn(`note: ${product.slug} (listing ${product.etsy?.listingId}) has no website copy yet; it shows the Etsy title and summary`);
  }
}

if (errors.length) {
  console.error(`catalog check failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`catalog checks passed: ${products.length} Etsy listings`);
