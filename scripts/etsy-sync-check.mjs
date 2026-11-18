// Tests the Etsy sync safeguards against a fake Etsy API, so no key or network is needed.
// Run with: npm run test:sync
import assert from 'node:assert/strict';
import { buildProducts, fallbackCategory, getEtsyActionLabel } from '../src/data/catalog.js';
import {
  diffListings,
  etsyGet,
  fetchActiveListings,
  isWellFormedApiKey,
  normalizeListings,
  personalizationMode,
  renderListingsModule,
  shortTitle,
  slugify,
  summarize,
  websiteImageUrl,
} from './etsy-sync-lib.mjs';

const API_KEY = 'testkeystring:testsecret';
const SHOP = { shop_id: 111, shop_name: 'GadjitNet' };
const noSleep = async () => {};
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

function photo(id, rank) {
  return {
    listing_image_id: id,
    rank,
    url_570xN: `https://i.etsystatic.com/64616969/r/il/aaaaaa/${id}/il_570xN.${id}_abcd.jpg`,
    url_fullxfull: `https://i.etsystatic.com/64616969/r/il/aaaaaa/${id}/il_fullxfull.${id}_abcd.jpg`,
  };
}

function listing(id, overrides = {}) {
  return {
    listing_id: id,
    state: 'active',
    title: `Listing ${id}, printed to order | gift`,
    description: `First paragraph for ${id}.\n\nSecond paragraph.`,
    is_personalizable: false,
    has_variations: false,
    personalization: null,
    images: [photo(id * 10 + 2, 2), photo(id * 10 + 1, 1)],
    price: { amount: 1999, divisor: 100 },
    ...overrides,
  };
}

// A fake Etsy API. `listings` is the shop; `faults` lets a test break specific requests.
function fakeEtsy(listings, faults = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push(url.pathname + url.search);
    assert.equal(init.headers['x-api-key'], API_KEY, 'every request sends the key in x-api-key');
    const path = url.pathname.replace('/v3/application', '');
    if (faults.before) {
      const response = faults.before(path, calls.length);
      if (response) return response;
    }
    if (path === '/shops') return json({ count: 1, results: faults.noShop ? [] : [SHOP] });
    if (path === `/shops/${SHOP.shop_id}/listings/active`) {
      const limit = Number(url.searchParams.get('limit'));
      const offset = Number(url.searchParams.get('offset'));
      const page = listings.slice(offset, offset + limit).map((item) => ({ listing_id: item.listing_id }));
      return json({ count: faults.reportedCount ?? listings.length, results: faults.truncatePages ? page.slice(0, 1) : page });
    }
    if (path === '/listings/batch') {
      const ids = url.searchParams.get('listing_ids').split(',').map(Number);
      assert.equal(url.searchParams.get('includes'), 'Images,Personalization');
      const results = listings.filter((item) => ids.includes(item.listing_id) && !faults.dropDetails?.includes(item.listing_id));
      return json({ count: results.length, results });
    }
    return json({ error: 'not found' }, 404);
  };
  return { fetchImpl, calls };
}

const run = (fake) => fetchActiveListings({ shopName: 'GadjitNet', apiKey: API_KEY, fetchImpl: fake.fetchImpl, sleep: noSleep });
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// --- Fetching and failure safeguards -------------------------------------------------------------

test('fetches every active listing across pages, with photos and personalization', async () => {
  const shop = Array.from({ length: 230 }, (_, index) => listing(1000 + index));
  const fake = fakeEtsy(shop);
  const { listings } = await run(fake);
  assert.equal(listings.length, 230);
  assert.deepEqual(listings.map((item) => item.listing_id), shop.map((item) => item.listing_id), 'keeps Etsy order');
  assert.equal(fake.calls.filter((call) => call.includes('/listings/active')).length, 3, '3 pages of 100');
  assert.equal(fake.calls.filter((call) => call.includes('/listings/batch')).length, 3, 'details in batches of 100');
});

test('a shop with no active listings returns an empty list', async () => {
  const { listings } = await run(fakeEtsy([]));
  assert.deepEqual(listings, []);
});

test('fails when the shop is not found, instead of treating it as empty', async () => {
  await assert.rejects(run(fakeEtsy([listing(1)], { noShop: true })), /shop "GadjitNet" was not found/);
});

test('fails when Etsy returns fewer listings than it reports (partial list)', async () => {
  const shop = [listing(1), listing(2), listing(3)];
  await assert.rejects(run(fakeEtsy(shop, { reportedCount: 5 })), /reported 5 active listings but returned 3/);
  await assert.rejects(run(fakeEtsy(shop, { truncatePages: true })), /reported 3 active listings but returned 1/);
});

test('fails when details are missing for a listing', async () => {
  await assert.rejects(run(fakeEtsy([listing(1), listing(2)], { dropDetails: [2] })), /did not return details for listings 2/);
});

test('retries rate limits (429) and server errors, then succeeds', async () => {
  let failures = 0;
  const delays = [];
  const fake = fakeEtsy([listing(1)], {
    before: () => {
      if (failures >= 2) return null;
      failures += 1;
      return failures === 1 ? json({ error: 'slow down' }, 429, { 'retry-after': '3' }) : json({ error: 'oops' }, 503);
    },
  });
  const { listings } = await fetchActiveListings({
    shopName: 'GadjitNet', apiKey: API_KEY, fetchImpl: fake.fetchImpl, sleep: async (ms) => delays.push(ms),
  });
  assert.equal(listings.length, 1);
  assert.equal(delays[0], 3000, 'honours retry-after');
});

test('gives up after repeated failures and never leaks the key in the error', async () => {
  const fake = fakeEtsy([listing(1)], { before: () => json({ error: 'down' }, 500) });
  await assert.rejects(run(fake), (error) => {
    assert.match(error.message, /HTTP 500/);
    assert.ok(!error.message.includes('testsecret') && !error.message.includes('testkeystring'));
    return true;
  });
  assert.equal(fake.calls.length, 4, 'four attempts');
});

test('does not retry a rejected key (403)', async () => {
  const fake = fakeEtsy([listing(1)], { before: () => json({ error: 'Invalid API key' }, 403) });
  await assert.rejects(run(fake), /HTTP 403/);
  assert.equal(fake.calls.length, 1);
});

test('network errors are retried and reported without details', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    throw new TypeError('fetch failed');
  };
  await assert.rejects(etsyGet('/shops', {}, { apiKey: API_KEY, fetchImpl, sleep: noSleep }), /network error \(TypeError\)/);
  assert.equal(calls, 4);
});

test('checks the key format without needing a real key', () => {
  assert.ok(isWellFormedApiKey('abc123:def456'));
  for (const bad of ['', 'abc123', 'abc:def:ghi', 'abc 123:def', undefined]) assert.ok(!isWellFormedApiKey(bad));
});

// --- Turning listings into website data ----------------------------------------------------------

test('photos are ordered by rank and use the 794 px size', () => {
  const { listings } = normalizeListings([listing(7)]);
  assert.deepEqual(listings[0].imageUrls, [
    'https://i.etsystatic.com/64616969/r/il/aaaaaa/71/il_794xN.71_abcd.jpg',
    'https://i.etsystatic.com/64616969/r/il/aaaaaa/72/il_794xN.72_abcd.jpg',
  ]);
  assert.equal(websiteImageUrl({ url_fullxfull: 'https://example.com/x.jpg' }), null, 'only Etsy-hosted photos');
});

test('listings without photos or no longer active are skipped with a warning', () => {
  const { listings, warnings } = normalizeListings([listing(1, { images: [] }), listing(2, { state: 'inactive' }), listing(3)]);
  assert.deepEqual(listings.map((item) => item.listingId), ['3']);
  assert.equal(warnings.length, 2);
});

test('personalization and options map to the Etsy button', () => {
  const required = listing(1, { is_personalizable: true, personalization: { personalization_questions: [{ required: true }] } });
  const optional = listing(2, { is_personalizable: true, personalization: { personalization_questions: [{ required: false }] } });
  const options = listing(3, { has_variations: true });
  assert.equal(personalizationMode(required), 'required');
  assert.equal(personalizationMode(optional), 'optional');
  assert.equal(personalizationMode(listing(4)), 'none');
  const { listings } = normalizeListings([required, optional, options, listing(4)]);
  const labels = buildProducts(listings, {}).map(getEtsyActionLabel);
  assert.deepEqual(labels, ['Customize on Etsy', 'Customize on Etsy', 'Customize on Etsy', 'View on Etsy']);
});

test('slugs stay the same when the Etsy title changes', () => {
  const previous = [{ listingId: '5', slug: 'original-slug' }];
  const { listings } = normalizeListings([listing(5, { title: 'Completely new title' }), listing(6)], previous);
  assert.equal(listings[0].slug, 'original-slug');
  assert.equal(listings[1].slug, 'listing-6');
});

test('duplicate titles still get unique slugs', () => {
  const { listings } = normalizeListings([listing(1, { title: 'Same name' }), listing(2, { title: 'Same name' })]);
  assert.deepEqual(listings.map((item) => item.slug), ['same-name', 'same-name-2']);
});

test('titles and summaries are shortened for the website', () => {
  assert.equal(shortTitle('Soccer Trophy Cup | World Cup Replica | Gift'), 'Soccer Trophy Cup');
  assert.equal(shortTitle('Lens Hood - Nikon 200-500mm, PETG'), 'Lens Hood');
  assert.equal(slugify('Nikon 200–500mm Lens Hood & Cap'), 'nikon-200-500mm-lens-hood-and');
  assert.equal(summarize('One.\n\nTwo.'), 'One.');
  const long = summarize(`${'A sentence that goes on. '.repeat(20)}`);
  assert.ok(long.length <= 280 && long.endsWith('.'));
});

test('the website never stores prices from Etsy', () => {
  const { listings } = normalizeListings([listing(1)]);
  assert.ok(!('price' in listings[0]));
  assert.ok(!renderListingsModule(listings).includes('1999'));
});

test('new listings without website copy still show, using the Etsy title and summary', () => {
  const { listings } = normalizeListings([listing(9)]);
  const [product] = buildProducts(listings, {});
  assert.equal(product.title, 'Listing 9');
  assert.equal(product.copy, 'First paragraph for 9.');
  assert.equal(product.category, fallbackCategory);
  assert.deepEqual(product.includes, []);
});

test('website copy overrides the Etsy title and summary', () => {
  const { listings } = normalizeListings([listing(9)]);
  const [product] = buildProducts(listings, { 9: { title: 'Nice name', category: 'Desk', copy: 'Written copy.', includes: ['PLA'] } });
  assert.deepEqual([product.title, product.category, product.copy, product.includes], ['Nice name', 'Desk', 'Written copy.', ['PLA']]);
});

// --- Change report -------------------------------------------------------------------------------

test('the report lists added, removed, changed, and reordered listings', () => {
  const before = normalizeListings([listing(1), listing(2), listing(3)]).listings;
  const after = normalizeListings([listing(2, { has_variations: true }), listing(4), listing(1)], before).listings;
  const diff = diffListings(before, after);
  assert.deepEqual(diff.added.map((item) => item.listingId), ['4']);
  assert.deepEqual(diff.removed.map((item) => item.listingId), ['3']);
  assert.deepEqual(diff.changed.map(({ listing: item, fields }) => [item.listingId, fields]), [['2', ['hasOptions']]]);
  assert.ok(diff.hasChanges);

  const same = diffListings(before, before);
  assert.ok(!same.hasChanges, 'no changes means no commit');
  const reordered = diffListings(before, [before[1], before[0], before[2]]);
  assert.ok(reordered.reordered && reordered.hasChanges);
});

test('the generated file is a module the site can import', async () => {
  const { listings } = normalizeListings([listing(1)]);
  const source = renderListingsModule(listings);
  const loaded = (await import(`data:text/javascript,${encodeURIComponent(source)}`)).default;
  assert.deepEqual(loaded, listings);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}\n     ${error.message}`);
  }
}
if (failed) {
  console.error(`\n${failed} of ${tests.length} sync checks failed`);
  process.exit(1);
}
console.log(`\nsync checks passed: ${tests.length}`);
