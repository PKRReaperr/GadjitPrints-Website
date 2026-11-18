// Read-only Etsy Open API v3 sync: fetches the shop's active listings and turns them into the
// data the website shows. Network access is injected (fetchImpl, sleep) so the safeguards can be
// tested without an API key; see scripts/etsy-sync-check.mjs.
//
// Only public endpoints are used, which need the API key alone (no OAuth, no buyer or order data):
//   GET /shops?shop_name=...                      findShops
//   GET /shops/{shop_id}/listings/active          findAllActiveListingsByShop (100 per page)
//   GET /listings/batch?includes=Images,Personalization   getListingsByListingIds (100 per call)

export const ETSY_API_BASE = 'https://api.etsy.com/v3/application';
const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 20_000;

export class EtsySyncError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EtsySyncError';
  }
}

// Etsy expects "keystring:shared_secret" in the x-api-key header.
export function isWellFormedApiKey(apiKey) {
  return typeof apiKey === 'string' && /^[^\s:]+:[^\s:]+$/.test(apiKey);
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function retryDelayMs(response, attempt) {
  const retryAfter = Number(response?.headers?.get?.('retry-after'));
  const backoff = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 1000;
  return Math.min(backoff, 30_000);
}

// One GET with retries for rate limits (429), server errors (5xx), and network failures.
// Errors never include the API key or request headers.
export async function etsyGet(path, params, { apiKey, fetchImpl = fetch, sleep = defaultSleep }) {
  const url = new URL(`${ETSY_API_BASE}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, String(value));

  let lastProblem = '';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { 'x-api-key': apiKey, accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      lastProblem = `network error (${error?.name ?? 'Error'})`;
      if (attempt < MAX_ATTEMPTS) await sleep(retryDelayMs(null, attempt));
      continue;
    }

    if (response.ok) {
      try {
        return await response.json();
      } catch {
        throw new EtsySyncError(`Etsy returned a response that is not JSON for ${path}`);
      }
    }

    const body = (await response.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 200);
    lastProblem = `HTTP ${response.status}${body ? `: ${body}` : ''}`;
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable) break;
    if (attempt < MAX_ATTEMPTS) await sleep(retryDelayMs(response, attempt));
  }
  throw new EtsySyncError(`Etsy request ${path} failed: ${lastProblem}`);
}

// Fetches every active listing with photos and personalization. Throws instead of returning a
// partial list, so a failed run can never shrink the catalog on the website.
export async function fetchActiveListings({ shopName, apiKey, fetchImpl, sleep }) {
  const options = { apiKey, fetchImpl, sleep };

  const shops = await etsyGet('/shops', { shop_name: shopName }, options);
  const shop = (shops?.results ?? []).find((item) => item.shop_name?.toLowerCase() === shopName.toLowerCase());
  if (!shop?.shop_id) throw new EtsySyncError(`Etsy shop "${shopName}" was not found`);

  const ids = [];
  let expected = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await etsyGet(
      `/shops/${shop.shop_id}/listings/active`,
      { limit: PAGE_SIZE, offset: page * PAGE_SIZE, sort_on: 'created', sort_order: 'desc' },
      options
    );
    if (!Number.isInteger(data?.count) || !Array.isArray(data?.results)) {
      throw new EtsySyncError('Etsy returned an unexpected active-listings response');
    }
    expected ??= data.count;
    ids.push(...data.results.map((listing) => listing.listing_id));
    if (!data.results.length || ids.length >= expected) break;
  }

  const uniqueIds = [...new Set(ids)];
  if (expected === null || uniqueIds.length !== expected) {
    throw new EtsySyncError(`Etsy reported ${expected} active listings but returned ${uniqueIds.length}; nothing was written`);
  }

  const byId = new Map();
  for (let start = 0; start < uniqueIds.length; start += PAGE_SIZE) {
    const chunk = uniqueIds.slice(start, start + PAGE_SIZE);
    const data = await etsyGet(
      '/listings/batch',
      { listing_ids: chunk.join(','), includes: 'Images,Personalization' },
      options
    );
    for (const listing of data?.results ?? []) byId.set(listing.listing_id, listing);
  }

  const missing = uniqueIds.filter((id) => !byId.has(id));
  if (missing.length) {
    throw new EtsySyncError(`Etsy did not return details for listings ${missing.join(', ')}; nothing was written`);
  }

  return { shopId: shop.shop_id, listings: uniqueIds.map((id) => byId.get(id)) };
}

// --- Turning Etsy listings into website data ----------------------------------------------------

export function slugify(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .filter(Boolean)
    .slice(0, 6)
    .join('-');
}

// Etsy titles are often long keyword lists; keep the first phrase for the website.
export function shortTitle(etsyTitle) {
  const first = String(etsyTitle ?? '').split(/\s+[|•–—-]\s+|\s*\|\s*|,\s+/)[0].trim();
  if (first.length <= 70) return first;
  const cut = first.slice(0, 70);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 30 ? cut.lastIndexOf(' ') : 70).trim()}…`;
}

// First paragraph of the Etsy description, trimmed to a short summary.
export function summarize(description, maxLength = 280) {
  const first = String(description ?? '').split(/\n\s*\n/).map((part) => part.replace(/\s+/g, ' ').trim()).find(Boolean) ?? '';
  if (first.length <= maxLength) return first;
  const cut = first.slice(0, maxLength);
  const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentenceEnd > maxLength / 2) return cut.slice(0, sentenceEnd + 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).trim()}…`;
}

// Etsy photo URLs come in fixed sizes; the site uses the 794 px wide version.
export function websiteImageUrl(image) {
  const full = image?.url_fullxfull ?? '';
  if (/^https:\/\/i\.etsystatic\.com\/.+\/il_fullxfull\.[^/]+$/.test(full)) {
    return full.replace('/il_fullxfull.', '/il_794xN.');
  }
  const medium = image?.url_570xN ?? '';
  return /^https:\/\/i\.etsystatic\.com\//.test(medium) ? medium : null;
}

export function personalizationMode(listing) {
  if (!listing?.is_personalizable) return 'none';
  const questions = listing.personalization?.personalization_questions ?? [];
  if (questions.some((question) => question?.required)) return 'required';
  if (questions.length) return 'optional';
  return listing.personalization_is_required ? 'required' : 'optional';
}

// previousListings keeps slugs stable: once a listing has a URL on the website it keeps it,
// even if the Etsy title changes later.
export function normalizeListings(etsyListings, previousListings = []) {
  const previousSlugs = new Map(previousListings.map((listing) => [listing.listingId, listing.slug]));
  const usedSlugs = new Set();
  const listings = [];
  const warnings = [];

  for (const raw of etsyListings) {
    const listingId = String(raw.listing_id);
    if (raw.state && raw.state !== 'active') {
      warnings.push(`listing ${listingId} is no longer active; skipped`);
      continue;
    }

    const imageUrls = [...(raw.images ?? [])]
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .map(websiteImageUrl)
      .filter(Boolean);
    if (!imageUrls.length) {
      warnings.push(`listing ${listingId} has no usable photos; skipped`);
      continue;
    }

    const title = shortTitle(raw.title) || `Etsy listing ${listingId}`;
    let slug = previousSlugs.get(listingId) || slugify(title) || `listing-${listingId}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${listingId}`;
    usedSlugs.add(slug);

    listings.push({
      listingId,
      slug,
      title,
      summary: summarize(raw.description),
      imageUrls,
      personalization: personalizationMode(raw),
      hasOptions: Boolean(raw.has_variations),
    });
  }

  return { listings, warnings };
}

const COMPARED_FIELDS = ['slug', 'title', 'summary', 'imageUrls', 'personalization', 'hasOptions'];

export function diffListings(previous, next) {
  const before = new Map(previous.map((listing) => [listing.listingId, listing]));
  const after = new Map(next.map((listing) => [listing.listingId, listing]));
  const added = next.filter((listing) => !before.has(listing.listingId));
  const removed = previous.filter((listing) => !after.has(listing.listingId));
  const changed = [];
  for (const listing of next) {
    const old = before.get(listing.listingId);
    if (!old) continue;
    const fields = COMPARED_FIELDS.filter((field) => JSON.stringify(old[field]) !== JSON.stringify(listing[field]));
    if (fields.length) changed.push({ listing, fields });
  }
  const sameIds = previous.length === next.length && added.length === 0 && removed.length === 0;
  const reordered = sameIds && previous.some((listing, index) => listing.listingId !== next[index].listingId);
  return { added, removed, changed, reordered, hasChanges: Boolean(added.length || removed.length || changed.length || reordered) };
}

export function renderListingsModule(listings) {
  return [
    '// Generated by scripts/etsy-sync.mjs from the active listings in the Etsy shop. Do not edit by hand:',
    '// the next sync overwrites it. Website copy (titles, descriptions, categories) lives in catalog.js.',
    '//',
    "// The term 'Etsy' is a trademark of Etsy, Inc. This Application uses Etsy's API, but is not",
    '// endorsed or certified by Etsy.',
    '',
    `export default ${JSON.stringify(listings, null, 2)};`,
    '',
  ].join('\n');
}

export function formatReport({ diff, warnings, needsCopy, total, dryRun, wrote }) {
  const lines = [`Active Etsy listings: ${total}`];
  if (!diff.hasChanges) lines.push('No changes since the last sync.');
  for (const listing of diff.added) lines.push(`+ added   ${listing.listingId}  ${listing.title}  (/collection/${listing.slug})`);
  for (const listing of diff.removed) lines.push(`- removed ${listing.listingId}  ${listing.title}  (/collection/${listing.slug} will redirect to /collection)`);
  for (const { listing, fields } of diff.changed) lines.push(`~ changed ${listing.listingId}  ${listing.title}: ${fields.join(', ')}`);
  if (diff.reordered) lines.push('~ listing order changed');
  for (const warning of warnings) lines.push(`! ${warning}`);
  for (const listing of needsCopy) {
    lines.push(`? ${listing.listingId}  ${listing.title} has no website copy yet; showing the Etsy title and summary`);
  }
  if (dryRun) lines.push('Dry run: nothing was written.');
  else lines.push(wrote ? 'Wrote src/data/etsy-listings.js.' : 'Nothing to write.');
  return lines.join('\n');
}
