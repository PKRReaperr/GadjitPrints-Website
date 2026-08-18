import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  hashPassword,
  isLoginRateLimited,
  progressiveLoginDelay,
  requireAdmin,
  requireCsrf,
  verifyPassword,
} from '../src/server/auth.js';
import {
  createEtsyDraft,
  etsyDraftIdempotencyKey,
  imageUploadRetryPlan,
  refreshEtsyToken,
  validateOAuthState,
} from '../src/server/etsy.js';
import { isCronAuthorized, isDenverRadarWindow, weeklyIdempotencyKey } from '../src/server/radar.js';
import { cookie, encryptSecret, redact, sha256 } from '../src/server/security.js';
import {
  assertDraftOnlyPayload,
  canCreateEtsyDraft,
  listingDraftSchema,
  radarOutputSchema,
} from '../src/server/validation.js';
import { readImageDimensions } from '../src/server/image.js';

function responseMock() {
  return {
    statusCode: 200,
    body: null as unknown,
    headers: {} as Record<string, unknown>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    setHeader(name: string, value: unknown) {
      this.headers[name] = value;
      return this;
    },
  };
}

const validListing = {
  title: 'Custom 3D Printed Name Tag',
  description: 'Made to order.',
  tags: ['name tag', 'custom gift'],
  price: 14,
  quantity: 2,
  sku: 'GP-001',
  materials: ['PETG'],
  personalizationInstructions: null,
  variations: {},
  shippingProfileId: '123',
  readinessStateId: '456',
  taxonomyId: '789',
  processingRecommendation: null,
  shippingNotes: null,
  safetyPrivacyNotes: null,
  mediaPlan: {},
};

describe('administrator authentication controls', () => {
  it('accepts the correct password and rejects an incorrect one', async () => {
    const stored = await hashPassword('correct horse battery staple');
    expect(stored.startsWith('$argon2id$')).toBe(true);
    await expect(verifyPassword(stored, 'correct horse battery staple')).resolves.toBe(true);
    await expect(verifyPassword(stored, 'wrong password')).resolves.toBe(false);
  });
  it('uses progressive delay and rate limiting', () => {
    expect(progressiveLoginDelay(0)).toBe(250);
    expect(progressiveLoginDelay(6)).toBe(8000);
    expect(isLoginRateLimited(7)).toBe(false);
    expect(isLoginRateLimited(8)).toBe(true);
  });
  it('denies an unauthenticated API request', async () => {
    const res = responseMock();
    const result = await requireAdmin({ headers: {} } as never, res as never);
    expect(result).toBeNull();
    expect(res.statusCode).toBe(401);
  });
  it('creates secure session-cookie attributes', () => {
    const value = cookie('__Host-gp_admin', 'token', { secure: true });
    expect(value).toContain('HttpOnly');
    expect(value).toContain('SameSite=Strict');
    expect(value).toContain('Secure');
  });
  it('validates double-submit CSRF and session hash', () => {
    const token = 'csrf-token';
    const req = {
      headers: { cookie: `__Host-gp_csrf=${token}`, 'x-csrf-token': token },
    };
    const res = responseMock();
    expect(requireCsrf(req as never, res as never, sha256(token))).toBe(true);
    expect(
      requireCsrf(
        {
          headers: {
            cookie: `__Host-gp_csrf=${token}`,
            'x-csrf-token': 'wrong',
          },
        } as never,
        res as never,
        sha256(token)
      )
    ).toBe(false);
  });
});

describe('radar and cron controls', () => {
  it('requires the exact cron bearer secret', () => {
    expect(isCronAuthorized('Bearer secret', 'secret')).toBe(true);
    expect(isCronAuthorized('secret', 'secret')).toBe(false);
    expect(isCronAuthorized(undefined, 'secret')).toBe(false);
  });
  it('gates both UTC schedules to Denver Monday 08:00 and deduplicates the week', () => {
    const summer = new Date('2026-08-17T14:05:00Z');
    const winter = new Date('2026-12-07T15:05:00Z');
    expect(isDenverRadarWindow(summer)).toBe(true);
    expect(isDenverRadarWindow(winter)).toBe(true);
    expect(weeklyIdempotencyKey(summer)).toBe(weeklyIdempotencyKey(new Date('2026-08-17T14:55:00Z')));
  });
  it('rejects malformed or unsafe radar output', () => {
    expect(() =>
      radarOutputSchema.parse({
        summary: 'x',
        recommendations: [],
        citations: [],
      })
    ).toThrow();
  });
});

describe('Etsy draft safety', () => {
  const oldEnv = { ...process.env };
  afterEach(() => {
    process.env = { ...oldEnv };
    vi.restoreAllMocks();
  });
  it('validates single-use OAuth state material', () => {
    expect(validateOAuthState('state', sha256('state'))).toBe(true);
    expect(validateOAuthState('other', sha256('state'))).toBe(false);
  });
  it('encrypts tokens with authenticated encryption', () => {
    const key = Buffer.alloc(32, 7).toString('base64');
    const encrypted = encryptSecret('etsy-access-token', key);
    expect(encrypted).not.toContain('etsy-access-token');
  });
  it('refreshes a token without exposing it in the URL', async () => {
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 4).toString('base64');
    process.env.ETSY_API_KEY = 'key';
    const refresh = encryptSecret('refresh-secret');
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
      expect(String(init.body)).toContain('refresh_token=refresh-secret');
      expect(_url).not.toContain('refresh-secret');
      return new Response(
        JSON.stringify({
          access_token: 'new',
          refresh_token: 'new-refresh',
          expires_in: 3600,
        }),
        { status: 200 }
      );
    });
    const result = await refreshEtsyToken(refresh, fetcher as typeof fetch);
    expect(result.access_token).toBe('new');
  });
  it('enforces Etsy field limits', () => {
    expect(listingDraftSchema.parse(validListing).tags).toHaveLength(2);
    expect(() => listingDraftSchema.parse({ ...validListing, title: 'x'.repeat(141) })).toThrow();
    expect(() =>
      listingDraftSchema.parse({
        ...validListing,
        tags: Array.from({ length: 14 }, (_, i) => `tag${i}`),
      })
    ).toThrow();
  });
  it('requires license, recommendation, and actual-photo approval', () => {
    expect(
      canCreateEtsyDraft({
        recommendationReview: 'approved',
        licenseStatus: 'verified',
        assets: [{ kind: 'actual_photo', approved: true }],
      })
    ).toBe(true);
    expect(
      canCreateEtsyDraft({
        recommendationReview: 'approved',
        licenseStatus: 'unverified',
        assets: [{ kind: 'actual_photo', approved: true }],
      })
    ).toBe(false);
    expect(
      canCreateEtsyDraft({
        recommendationReview: 'approved',
        licenseStatus: 'verified',
        assets: [{ kind: 'generated_render', approved: true }],
      })
    ).toBe(false);
  });
  it('forbids activation fields and has no automatic publishing path', () => {
    expect(() => assertDraftOnlyPayload({ state: 'active' })).toThrow();
    expect(assertDraftOnlyPayload({ title: 'Draft' })).toEqual({
      title: 'Draft',
    });
  });
  it('uses a stable Etsy idempotency key for duplicate prevention', () => {
    expect(etsyDraftIdempotencyKey('draft-1')).toBe(etsyDraftIdempotencyKey('draft-1'));
    expect(etsyDraftIdempotencyKey('draft-1')).not.toBe(etsyDraftIdempotencyKey('draft-2'));
  });
  it('prevents external writes when the feature flag is off', async () => {
    process.env.ETSY_DRAFTS_ENABLED = 'false';
    await expect(createEtsyDraft('1', 'token', validListing, vi.fn() as never)).rejects.toThrow('ETSY_DRAFTS_DISABLED');
  });
  it('retries only approved images that have not succeeded', () => {
    expect(
      imageUploadRetryPlan([
        { id: 'a', approved: true },
        { id: 'b', approved: true, etsyImageId: 'done' },
        { id: 'c', approved: false },
      ])
    ).toEqual([{ id: 'a', rank: 1 }]);
  });
  it('redacts secrets recursively from logs', () => {
    expect(redact({ password: 'x', nested: { accessToken: 'y', status: 'ok' } })).toEqual({
      password: '[REDACTED]',
      nested: { accessToken: '[REDACTED]', status: 'ok' },
    });
  });
});

describe('media upload safety', () => {
  it('validates the declared image signature before reading dimensions', () => {
    const png = Buffer.alloc(24);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png);
    png.writeUInt32BE(1200, 16);
    png.writeUInt32BE(900, 20);
    expect(readImageDimensions(png, 'image/png')).toEqual({
      width: 1200,
      height: 900,
    });
    expect(() => readImageDimensions(Buffer.from('not an image'), 'image/png')).toThrow('INVALID_PNG');
  });
});
