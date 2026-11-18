// Validates the product catalog in src/data/catalog.js and the pure helpers the UI relies on.
// Run with: npm run test:catalog
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  getColorsForMaterial,
  getEtsyActionLabel,
  getEtsyListingUrl,
  hasFinishOptions,
  isEtsyProduct,
  needsEtsyCustomization,
  personalizationModes,
  products,
} from '../src/data/catalog.js';

const publicDir = new URL('../public/', import.meta.url);
const errors = [];
const fail = (product, message) => errors.push(`${product?.slug ?? '(no slug)'}: ${message}`);

// --- Helper behavior (fixtures, independent of the live catalog) ---------------------------------
const bare = { slug: 'fixture', title: 'Fixture', etsy: { listingId: '1234567890', personalization: 'none' } };
assert.equal(getEtsyListingUrl(bare), 'https://www.etsy.com/listing/1234567890');
assert.equal(getEtsyActionLabel(bare), 'View on Etsy');
assert.equal(getEtsyActionLabel({ etsy: { listingId: '1', personalization: 'required' } }), 'Customize on Etsy');
assert.equal(getEtsyActionLabel({ etsy: { listingId: '1', personalization: 'optional' } }), 'Customize on Etsy');
assert.equal(getEtsyActionLabel({ etsy: { listingId: '1', personalization: 'none', hasOptions: true } }), 'Customize on Etsy');
assert.equal(needsEtsyCustomization(bare), false);
assert.equal(hasFinishOptions(bare), false, 'a listing without colors has no on-site finish options');
assert.deepEqual(getColorsForMaterial(bare, undefined), []);
assert.equal(getEtsyListingUrl({ slug: 'studio-only' }), null);

// --- Live catalog --------------------------------------------------------------------------------
assert.ok(Array.isArray(products) && products.length > 0, 'catalog must contain at least one product');

const seenSlugs = new Set();
const seenListingIds = new Set();

for (const product of products) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug ?? '')) fail(product, 'slug must be lowercase-kebab-case');
  if (seenSlugs.has(product.slug)) fail(product, 'duplicate slug');
  seenSlugs.add(product.slug);

  for (const field of ['title', 'copy', 'category']) {
    if (typeof product[field] !== 'string' || !product[field].trim()) fail(product, `missing ${field}`);
  }

  for (const imageUrl of product.imageUrls ?? []) {
    if (imageUrl.startsWith('/') && !fs.existsSync(new URL(`.${imageUrl}`, publicDir))) {
      fail(product, `image not found in public/: ${imageUrl}`);
    }
  }

  if (isEtsyProduct(product)) {
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
    if (!product.imageUrls?.length) fail(product, 'Etsy listings need at least one real product photo');
    if (product.configureType) fail(product, 'Etsy listings cannot use the on-site configurator');
  } else if (!hasFinishOptions(product)) {
    fail(product, 'studio products need colors with materials (or an etsy listing)');
  }
}

if (errors.length) {
  console.error(`catalog check failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

const etsyCount = products.filter(isEtsyProduct).length;
console.log(`catalog checks passed: ${products.length} products (${etsyCount} Etsy listings)`);
