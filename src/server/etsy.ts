import { createHash, randomBytes } from 'node:crypto';
import { decryptSecret } from './security.js';
import { assertDraftOnlyPayload, listingDraftSchema } from './validation.js';

const ETSY_API = 'https://api.etsy.com/v3';

export function createPkce() {
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function validateOAuthState(received: string, expectedHash: string) {
  if (!received || !expectedHash) return false;
  return createHash('sha256').update(received).digest('hex') === expectedHash;
}

export function imageUploadRetryPlan(assets: Array<{ id: string; approved: boolean; etsyImageId?: string | null }>) {
  return assets
    .filter((asset) => asset.approved && !asset.etsyImageId)
    .map((asset, index) => ({ id: asset.id, rank: index + 1 }));
}

export function etsyDraftIdempotencyKey(listingDraftId: string) {
  return `etsy-draft:${listingDraftId}`;
}

export function buildEtsyAuthorizationUrl(input: { state: string; challenge: string }) {
  const scopes = process.env.ETSY_SCOPES ?? 'listings_r listings_w shops_r';
  if (scopes.split(/\s+/).includes('listings_d')) throw new Error('Delete-listing scope is forbidden');
  const url = new URL('https://www.etsy.com/oauth/connect');
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ETSY_API_KEY ?? '',
    redirect_uri: process.env.ETSY_REDIRECT_URI ?? '',
    scope: scopes,
    state: input.state,
    code_challenge: input.challenge,
    code_challenge_method: 'S256',
  }).toString();
  return url.toString();
}

export async function exchangeEtsyCode(code: string, verifier: string, fetcher: typeof fetch = fetch) {
  const response = await fetcher(`${ETSY_API}/public/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ETSY_API_KEY ?? '',
      redirect_uri: process.env.ETSY_REDIRECT_URI ?? '',
      code,
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`ETSY_TOKEN_${response.status}`);
  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

export async function refreshEtsyToken(encryptedRefreshToken: string, fetcher: typeof fetch = fetch) {
  const response = await fetcher(`${ETSY_API}/public/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ETSY_API_KEY ?? '',
      refresh_token: decryptSecret(encryptedRefreshToken),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`ETSY_REFRESH_${response.status}`);
  return response.json() as Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>;
}

export async function getEtsyShops(accessToken: string, fetcher: typeof fetch = fetch) {
  const userId = accessToken.split('.', 1)[0];
  if (!/^\d+$/.test(userId)) throw new Error('ETSY_USER_ID_INVALID');
  const response = await fetcher(`${ETSY_API}/application/users/${userId}/shops`, {
    headers: headers(accessToken),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`ETSY_SHOPS_${response.status}`);
  const data = (await response.json()) as {
    results?: Array<{ shop_id: number; shop_name: string }>;
  };
  return data.results ?? [];
}

function headers(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'x-api-key': `${process.env.ETSY_API_KEY ?? ''}:${process.env.ETSY_SHARED_SECRET ?? ''}`,
  };
}

export async function createEtsyDraft(
  shopId: string,
  accessToken: string,
  input: unknown,
  fetcher: typeof fetch = fetch
) {
  if (process.env.ETSY_DRAFTS_ENABLED !== 'true') throw new Error('ETSY_DRAFTS_DISABLED');
  const draft = listingDraftSchema.parse(input);
  const payload = assertDraftOnlyPayload({
    quantity: draft.quantity,
    title: draft.title,
    description: draft.description,
    price: draft.price.toFixed(2),
    who_made: 'i_did',
    when_made: 'made_to_order',
    taxonomy_id: Number(draft.taxonomyId),
    shipping_profile_id: Number(draft.shippingProfileId),
    readiness_state_id: Number(draft.readinessStateId),
    tags: draft.tags,
    materials: draft.materials,
  });
  const response = await fetcher(`${ETSY_API}/application/shops/${encodeURIComponent(shopId)}/listings`, {
    method: 'POST',
    headers: {
      ...headers(accessToken),
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(
      Object.entries(payload).flatMap(([key, value]) =>
        Array.isArray(value) ? value.map((item) => [key, String(item)]) : [[key, String(value)]]
      )
    ),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`ETSY_DRAFT_${response.status}`);
  return response.json() as Promise<{ listing_id: number; url?: string }>;
}

export async function uploadEtsyImage(
  shopId: string,
  listingId: string,
  accessToken: string,
  image: Blob,
  rank: number,
  fetcher: typeof fetch = fetch
) {
  const form = new FormData();
  form.set('image', image);
  form.set('rank', String(rank));
  const response = await fetcher(
    `${ETSY_API}/application/shops/${encodeURIComponent(shopId)}/listings/${encodeURIComponent(listingId)}/images`,
    {
      method: 'POST',
      headers: headers(accessToken),
      body: form,
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!response.ok) throw new Error(`ETSY_IMAGE_${response.status}`);
  return response.json() as Promise<{ listing_image_id: number }>;
}
