import { put } from '@vercel/blob';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { ensureLoginCsrf, getSession, login, logout, requireAdmin, requireCsrf } from '../src/server/auth.js';
import { getDb } from '../src/server/db.js';
import {
  buildEtsyAuthorizationUrl,
  createEtsyDraft,
  createPkce,
  exchangeEtsyCode,
  etsyDraftIdempotencyKey,
  getEtsyShops,
  refreshEtsyToken,
  uploadEtsyImage,
} from '../src/server/etsy.js';
import {
  isCronAuthorized,
  isDenverRadarWindow,
  isExternalRadarRecommendation,
  reconcileRadarRun,
  startRadarRun,
  weeklyIdempotencyKey,
} from '../src/server/radar.js';
import { decryptSecret, encryptSecret, randomToken, sha256 } from '../src/server/security.js';
import {
  auditLogs,
  etsyConnections,
  eventOpportunities,
  licenseRecords,
  listingAssets,
  listingDrafts,
  oauthStates,
  productRecommendations,
  radarRuns,
} from '../src/server/schema.js';
import { canCreateEtsyDraft, listingDraftSchema } from '../src/server/validation.js';
import { fixtureDashboard } from '../src/data/admin-fixtures.js';
import type {
  VercelRequestLike as VercelRequest,
  VercelResponseLike as VercelResponse,
} from '../src/server/http-types.js';
import { readImageDimensions } from '../src/server/image.js';

export const config = {
  api: { bodyParser: { sizeLimit: '9mb' } },
  maxDuration: 30,
};

function pathOf(req: VercelRequest) {
  const route = req.query.route;
  return `/${Array.isArray(route) ? route.join('/') : (route ?? '')}`;
}

function securityHeaders(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
}

function method(req: VercelRequest, res: VercelResponse, allowed: string[]) {
  if (!allowed.includes(req.method ?? '')) {
    res.setHeader('Allow', allowed.join(', '));
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}

function publicConfig() {
  return {
    etsyDraftsEnabled: process.env.ETSY_DRAFTS_ENABLED === 'true',
    radarCronEnabled: process.env.RADAR_CRON_ENABLED === 'true',
    radarFixtureMode: process.env.RADAR_FIXTURE_MODE === 'true' || !process.env.OPENAI_API_KEY,
    etsyConfigured: Boolean(
      process.env.ETSY_API_KEY &&
      process.env.ETSY_SHARED_SECRET &&
      process.env.ETSY_REDIRECT_URI &&
      process.env.TOKEN_ENCRYPTION_KEY
    ),
    storageConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };
}

async function dashboardData() {
  if (process.env.RADAR_FIXTURE_MODE === 'true') {
    const fixture = fixtureDashboard();
    const storedRuns = await getDb().select().from(radarRuns).orderBy(desc(radarRuns.createdAt)).limit(12);
    const runs = storedRuns.length ? storedRuns.map((run) => ({ ...run, date: run.createdAt })) : fixture.runs;
    return {
      ...fixture,
      products: fixture.products.filter(isExternalRadarRecommendation),
      runs,
      lastSuccessfulRun: runs.find((run) => run.status === 'completed') ?? null,
    };
  }
  const db = getDb();
  const [events, rawProducts, runs, listings] = await Promise.all([
    db.select().from(eventOpportunities).orderBy(eventOpportunities.startDate),
    db
      .select({ product: productRecommendations, license: licenseRecords })
      .from(productRecommendations)
      .innerJoin(licenseRecords, eq(productRecommendations.licenseRecordId, licenseRecords.id))
      .orderBy(desc(productRecommendations.opportunityScore)),
    db.select().from(radarRuns).orderBy(desc(radarRuns.createdAt)).limit(12),
    db.select().from(listingDrafts).orderBy(desc(listingDrafts.updatedAt)),
  ]);
  return {
    fixtureMode: false,
    events: events.map((event) => ({
      ...event,
      region: event.countryRegion,
      leadDays: event.planningLeadDays,
      opportunities: event.productOpportunities,
      sensitivity: event.culturalSensitivityNote,
      ip: event.trademarkIpNote,
      source: event.officialSourceUrl,
      verified: event.lastVerifiedDate,
      sample: event.isSample,
    })),
    products: rawProducts
      .filter(({ product }) => isExternalRadarRecommendation(product))
      .map(({ product, license }) => ({
        ...product,
        source: product.modelSourceUrl,
        hook: product.eventHook,
        category: license.category,
        license: license.exactLicenseName,
        commercialPermission: license.commercialPermission,
        quantityLimit: license.physicalPrintQuantityLimit,
        attribution: license.attributionRequirement,
        membership: license.membershipRequirement,
        remix: license.remixRestrictions,
        evidence: license.evidenceUrl,
        verified: license.status,
        complexity: product.printComplexity,
        printTime: product.estimatedPrintMinutes,
        customization: product.customizationOpportunity,
        risk: product.ipRiskLevel,
        riskNote: product.ipRiskNote,
        etsyTitle: product.recommendedEtsyTitle,
        tags: product.recommendedEtsyTags,
        price: Number(product.suggestedPrice),
        score: product.opportunityScore,
        review: product.reviewStatus,
      })),
    runs: runs.map((run) => ({ ...run, date: run.createdAt })),
    listings,
    lastSuccessfulRun: runs.find((run) => run.status === 'completed') ?? null,
  };
}

async function handleSession(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ['GET'])) return;
  const csrfToken = await ensureLoginCsrf(req, res);
  const session = await getSession(req);
  let etsyConnection = { connected: false, shopName: null as string | null };
  if (session) {
    const [connection] = await getDb()
      .select({ shopName: etsyConnections.shopName })
      .from(etsyConnections)
      .where(and(eq(etsyConnections.adminUserId, session.user.id), isNull(etsyConnections.disconnectedAt)))
      .limit(1);
    etsyConnection = {
      connected: Boolean(connection),
      shopName: connection?.shopName ?? null,
    };
  }
  res.status(200).json({
    authenticated: Boolean(session),
    username: session?.user.username ?? null,
    csrfToken,
    config: publicConfig(),
    etsyConnection,
  });
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ['POST']) || !requireCsrf(req, res)) return;
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().slice(0, 120) : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!username || password.length < 8 || password.length > 1024)
    return res.status(401).json({ error: 'Invalid username or password' });
  const result = await login(req, res, username, password);
  if (!result.ok) {
    await new Promise((resolve) => setTimeout(resolve, result.delayMs));
    return res.status(result.status).json({
      error: result.status === 429 ? 'Too many attempts. Try again later.' : 'Invalid username or password',
    });
  }
  res.status(200).json({ ok: true, username: result.username });
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ['POST'])) return;
  const session = await requireAdmin(req, res);
  if (!session || !requireCsrf(req, res, session.session.csrfHash)) return;
  await logout(req, res);
  res.status(200).json({ ok: true });
}

async function handleRadar(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ['POST'])) return;
  const session = await requireAdmin(req, res);
  if (!session || !requireCsrf(req, res, session.session.csrfHash)) return;
  const key = `manual-radar:${new Date().toISOString().slice(0, 13)}`;
  const result = await startRadarRun({
    idempotencyKey: key,
    trigger: 'manual',
  });
  await getDb()
    .insert(auditLogs)
    .values({
      adminUserId: session.user.id,
      action: 'radar.run',
      entityType: 'RadarRun',
      entityId: result.run?.id,
      outcome: result.duplicate ? 'duplicate_prevented' : 'started',
    });
  res.status(result.duplicate ? 200 : 202).json(result);
}

async function handleCron(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ['GET'])) return;
  if (!isCronAuthorized(req.headers.authorization)) return res.status(401).json({ error: 'Unauthorized' });
  if (process.env.RADAR_CRON_ENABLED !== 'true')
    return res.status(200).json({ skipped: true, reason: 'RADAR_CRON_ENABLED is false' });
  const now = new Date();
  if (!isDenverRadarWindow(now))
    return res.status(200).json({
      skipped: true,
      reason: 'Outside Monday 08:00 America/Denver window',
    });
  const result = await startRadarRun({
    idempotencyKey: weeklyIdempotencyKey(now),
    trigger: 'cron',
  });
  res.status(result.duplicate ? 200 : 202).json({
    accepted: true,
    duplicate: result.duplicate,
    runId: result.run?.id,
  });
}

async function handleRadarStatus(req: VercelRequest, res: VercelResponse, id: string) {
  if (!method(req, res, ['GET']) || !(await requireAdmin(req, res))) return;
  const run = await reconcileRadarRun(id);
  res.status(200).json({ run });
}

async function handleEtsyConnect(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ['POST'])) return;
  const session = await requireAdmin(req, res);
  if (!session || !requireCsrf(req, res, session.session.csrfHash)) return;
  if (!publicConfig().etsyConfigured) return res.status(503).json({ error: 'Etsy is not configured' });
  const state = randomToken();
  const pkce = createPkce();
  await getDb()
    .insert(oauthStates)
    .values({
      adminUserId: session.user.id,
      stateHash: sha256(state),
      codeVerifierEncrypted: encryptSecret(pkce.verifier),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });
  res.status(200).json({
    authorizationUrl: buildEtsyAuthorizationUrl({
      state,
      challenge: pkce.challenge,
    }),
  });
}

async function handleEtsyCallback(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ['GET'])) return;
  const session = await requireAdmin(req, res);
  if (!session) return;
  const state = String(req.query.state ?? '');
  const code = String(req.query.code ?? '');
  const db = getDb();
  const [stored] = await db
    .select()
    .from(oauthStates)
    .where(
      and(
        eq(oauthStates.stateHash, sha256(state)),
        eq(oauthStates.adminUserId, session.user.id),
        gt(oauthStates.expiresAt, new Date()),
        isNull(oauthStates.consumedAt)
      )
    )
    .limit(1);
  if (!state || !code || !stored) return res.status(403).json({ error: 'OAuth state validation failed' });
  await db.update(oauthStates).set({ consumedAt: new Date() }).where(eq(oauthStates.id, stored.id));
  const token = await exchangeEtsyCode(code, decryptSecret(stored.codeVerifierEncrypted));
  const shops = await getEtsyShops(token.access_token);
  if (!shops.length) return res.status(409).json({ error: 'No Etsy seller shop was found' });
  const selectedShop = shops[0];
  await db
    .insert(etsyConnections)
    .values({
      adminUserId: session.user.id,
      encryptedAccessToken: encryptSecret(token.access_token),
      encryptedRefreshToken: encryptSecret(token.refresh_token),
      accessTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
      shopId: String(selectedShop.shop_id),
      shopName: selectedShop.shop_name,
      scopes: (process.env.ETSY_SCOPES ?? 'listings_r listings_w shops_r').split(/\s+/),
    })
    .onConflictDoUpdate({
      target: etsyConnections.adminUserId,
      set: {
        encryptedAccessToken: encryptSecret(token.access_token),
        encryptedRefreshToken: encryptSecret(token.refresh_token),
        accessTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        shopId: String(selectedShop.shop_id),
        shopName: selectedShop.shop_name,
        disconnectedAt: null,
        updatedAt: new Date(),
      },
    });
  res.redirect(303, '/admin/settings/integrations?etsy=connected');
}

async function freshEtsyAccessToken(connection: typeof etsyConnections.$inferSelect) {
  if (connection.accessTokenExpiresAt.getTime() > Date.now() + 60_000)
    return decryptSecret(connection.encryptedAccessToken);
  const refreshed = await refreshEtsyToken(connection.encryptedRefreshToken);
  await getDb()
    .update(etsyConnections)
    .set({
      encryptedAccessToken: encryptSecret(refreshed.access_token),
      encryptedRefreshToken: encryptSecret(refreshed.refresh_token),
      accessTokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      updatedAt: new Date(),
    })
    .where(eq(etsyConnections.id, connection.id));
  return refreshed.access_token;
}

async function handleEtsyDisconnect(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, ['POST'])) return;
  const session = await requireAdmin(req, res);
  if (!session || !requireCsrf(req, res, session.session.csrfHash)) return;
  await getDb()
    .update(etsyConnections)
    .set({
      disconnectedAt: new Date(),
      encryptedAccessToken: '',
      encryptedRefreshToken: '',
      updatedAt: new Date(),
    })
    .where(eq(etsyConnections.adminUserId, session.user.id));
  res.status(200).json({ ok: true });
}

async function handleListing(req: VercelRequest, res: VercelResponse, id: string) {
  const session = await requireAdmin(req, res);
  if (!session) return;
  const db = getDb();
  if (req.method === 'GET') {
    const [draft] = await db.select().from(listingDrafts).where(eq(listingDrafts.id, id)).limit(1);
    if (!draft) return res.status(404).json({ error: 'Listing not found' });
    const assets = await db
      .select()
      .from(listingAssets)
      .where(eq(listingAssets.listingDraftId, id))
      .orderBy(listingAssets.sortOrder);
    return res.status(200).json({ listing: { ...draft, assets } });
  }
  if (req.method === 'PUT') {
    if (!requireCsrf(req, res, session.session.csrfHash)) return;
    const draft = listingDraftSchema.parse(req.body);
    const [updated] = await db
      .update(listingDrafts)
      .set({ ...draft, price: String(draft.price), updatedAt: new Date() })
      .where(eq(listingDrafts.id, id))
      .returning();
    await db.insert(auditLogs).values({
      adminUserId: session.user.id,
      action: 'listing.save',
      entityType: 'ListingDraft',
      entityId: id,
      outcome: 'success',
    });
    return res.status(200).json({ listing: updated });
  }
  return method(req, res, ['GET', 'PUT']);
}

async function handleDuplicateListing(req: VercelRequest, res: VercelResponse, id: string) {
  if (!method(req, res, ['POST'])) return;
  const session = await requireAdmin(req, res);
  if (!session || !requireCsrf(req, res, session.session.csrfHash)) return;
  const db = getDb();
  const [source] = await db.select().from(listingDrafts).where(eq(listingDrafts.id, id)).limit(1);
  if (!source) return res.status(404).json({ error: 'Listing not found' });
  const [copy] = await db
    .insert(listingDrafts)
    .values({
      productRecommendationId: source.productRecommendationId,
      title: `${source.title} (Copy)`.slice(0, 140),
      description: source.description,
      tags: source.tags,
      price: source.price,
      quantity: source.quantity,
      sku: `${source.sku.slice(0, 25)}-COPY-${randomToken(3)}`.slice(0, 32),
      materials: source.materials,
      personalizationInstructions: source.personalizationInstructions,
      variations: source.variations,
      shippingProfileId: source.shippingProfileId,
      readinessStateId: source.readinessStateId,
      taxonomyId: source.taxonomyId,
      processingRecommendation: source.processingRecommendation,
      shippingNotes: source.shippingNotes,
      safetyPrivacyNotes: source.safetyPrivacyNotes,
      mediaPlan: source.mediaPlan,
      status: 'internal_draft',
    })
    .returning();
  const assets = await db.select().from(listingAssets).where(eq(listingAssets.listingDraftId, id));
  for (const asset of assets)
    await db.insert(listingAssets).values({
      listingDraftId: copy.id,
      kind: asset.kind,
      url: asset.url,
      sourceUrl: asset.sourceUrl,
      rightsNote: asset.rightsNote,
      altText: asset.altText,
      approved: false,
      verifiedAgainstPhysical: asset.verifiedAgainstPhysical,
      sortOrder: asset.sortOrder,
      mimeType: asset.mimeType,
      byteSize: asset.byteSize,
      width: asset.width,
      height: asset.height,
    });
  await db.insert(auditLogs).values({
    adminUserId: session.user.id,
    action: 'listing.duplicate',
    entityType: 'ListingDraft',
    entityId: copy.id,
    outcome: 'success',
    metadata: { sourceId: id },
  });
  res.status(201).json({ listing: copy });
}

async function handleCreateEtsyDraft(req: VercelRequest, res: VercelResponse, id: string) {
  if (!method(req, res, ['POST'])) return;
  const session = await requireAdmin(req, res);
  if (!session || !requireCsrf(req, res, session.session.csrfHash)) return;
  if (req.body?.confirmed !== true) return res.status(400).json({ error: 'Explicit confirmation is required' });
  const db = getDb();
  const [row] = await db
    .select({
      draft: listingDrafts,
      recommendation: productRecommendations,
      license: licenseRecords,
    })
    .from(listingDrafts)
    .innerJoin(productRecommendations, eq(listingDrafts.productRecommendationId, productRecommendations.id))
    .innerJoin(licenseRecords, eq(productRecommendations.licenseRecordId, licenseRecords.id))
    .where(eq(listingDrafts.id, id))
    .limit(1);
  if (!row) return res.status(404).json({ error: 'Listing not found' });
  const assets = await db
    .select()
    .from(listingAssets)
    .where(eq(listingAssets.listingDraftId, id))
    .orderBy(listingAssets.sortOrder);
  if (
    !canCreateEtsyDraft({
      recommendationReview: row.recommendation.reviewStatus,
      licenseStatus: row.license.status,
      assets,
    })
  )
    return res.status(409).json({
      error: 'Approved recommendation, verified license, and an approved actual product photo are required',
    });
  const idempotencyKey = row.draft.etsyIdempotencyKey ?? etsyDraftIdempotencyKey(id);
  const [connection] = await db
    .select()
    .from(etsyConnections)
    .where(and(eq(etsyConnections.adminUserId, session.user.id), isNull(etsyConnections.disconnectedAt)))
    .limit(1);
  if (!connection?.shopId) return res.status(409).json({ error: 'Connect Etsy and select a verified shop first' });
  await db
    .update(listingDrafts)
    .set({
      etsyIdempotencyKey: idempotencyKey,
      status: 'internal_draft',
      updatedAt: new Date(),
    })
    .where(eq(listingDrafts.id, id));
  try {
    const accessToken = await freshEtsyAccessToken(connection);
    const wasExisting = Boolean(row.draft.etsyListingId);
    let listingId = row.draft.etsyListingId;
    if (!listingId) {
      const created = await createEtsyDraft(connection.shopId, accessToken, row.draft);
      listingId = String(created.listing_id);
      await db
        .update(listingDrafts)
        .set({ etsyListingId: listingId, updatedAt: new Date() })
        .where(eq(listingDrafts.id, id));
    }
    let partial = false;
    for (const [index, asset] of assets.filter((item) => item.approved).entries()) {
      if (asset.etsyImageId) continue;
      try {
        const imageResponse = await fetch(asset.url, {
          signal: AbortSignal.timeout(15_000),
        });
        if (!imageResponse.ok) throw new Error('ASSET_FETCH_FAILED');
        const uploaded = await uploadEtsyImage(
          connection.shopId,
          listingId,
          accessToken,
          await imageResponse.blob(),
          index + 1
        );
        await db
          .update(listingAssets)
          .set({
            etsyImageId: String(uploaded.listing_image_id),
            updatedAt: new Date(),
          })
          .where(eq(listingAssets.id, asset.id));
      } catch {
        partial = true;
        await db
          .update(listingAssets)
          .set({
            uploadRetryCount: asset.uploadRetryCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(listingAssets.id, asset.id));
      }
    }
    const url = `https://www.etsy.com/your/shops/me/listing-editor/edit/${listingId}`;
    await db
      .update(listingDrafts)
      .set({
        etsyListingId: listingId,
        etsyDraftUrl: url,
        status: partial ? 'partial' : 'etsy_draft',
        updatedAt: new Date(),
      })
      .where(eq(listingDrafts.id, id));
    await db.insert(auditLogs).values({
      adminUserId: session.user.id,
      action: 'etsy.draft.create',
      entityType: 'ListingDraft',
      entityId: id,
      outcome: partial ? 'partial' : 'success',
      metadata: { listingId },
    });
    return res
      .status(partial ? 207 : wasExisting ? 200 : 201)
      .json({ listingId, url, partial, duplicatePrevented: wasExisting });
  } catch (error) {
    await db
      .update(listingDrafts)
      .set({
        status: 'failed',
        lastEtsyErrorCode: error instanceof Error ? error.message.slice(0, 100) : 'ETSY_FAILED',
        updatedAt: new Date(),
      })
      .where(eq(listingDrafts.id, id));
    await db.insert(auditLogs).values({
      adminUserId: session.user.id,
      action: 'etsy.draft.create',
      entityType: 'ListingDraft',
      entityId: id,
      outcome: 'failed',
    });
    throw error;
  }
}

async function handleUpload(req: VercelRequest, res: VercelResponse, listingId: string) {
  if (!method(req, res, ['POST'])) return;
  const session = await requireAdmin(req, res);
  if (!session || !requireCsrf(req, res, session.session.csrfHash)) return;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: 'Storage is not configured' });
  const match =
    typeof req.body?.dataUrl === 'string' &&
    req.body.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return res.status(400).json({ error: 'Only JPEG, PNG, and WebP images are accepted' });
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'Image exceeds 8 MB' });
  const mimeType = match[1] as 'image/jpeg' | 'image/png' | 'image/webp';
  let dimensions: { width: number; height: number };
  try {
    dimensions = readImageDimensions(bytes, mimeType);
  } catch {
    return res.status(400).json({ error: 'Image content does not match its declared type' });
  }
  if (
    !dimensions.width ||
    !dimensions.height ||
    dimensions.width < 600 ||
    dimensions.height < 600 ||
    dimensions.width > 12000 ||
    dimensions.height > 12000
  )
    return res.status(400).json({ error: 'Image dimensions must be between 600 and 12000 pixels' });
  const extension = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }[mimeType];
  const blob = await put(`admin/listings/${listingId}/${randomToken(18)}.${extension}`, bytes, {
    access: 'public',
    contentType: mimeType,
    addRandomSuffix: false,
  });
  const [asset] = await getDb()
    .insert(listingAssets)
    .values({
      listingDraftId: listingId,
      kind: req.body?.kind === 'generated_render' ? 'generated_render' : 'actual_photo',
      url: blob.url,
      rightsNote: String(req.body?.rightsNote ?? '').slice(0, 500),
      altText: String(req.body?.altText ?? '').slice(0, 500),
      approved: false,
      mimeType,
      byteSize: bytes.length,
      width: dimensions.width,
      height: dimensions.height,
    })
    .returning();
  res.status(201).json({ asset });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  securityHeaders(res);
  try {
    const path = pathOf(req);
    if (path === '/admin/session') return await handleSession(req, res);
    if (path === '/admin/login') return await handleLogin(req, res);
    if (path === '/admin/logout') return await handleLogout(req, res);
    if (path === '/cron/weekly-radar') return await handleCron(req, res);
    if (path === '/admin/dashboard') {
      if (!method(req, res, ['GET']) || !(await requireAdmin(req, res))) return;
      return res.status(200).json(await dashboardData());
    }
    if (path === '/admin/radar/run') return await handleRadar(req, res);
    if (path.startsWith('/admin/radar/runs/')) return await handleRadarStatus(req, res, path.split('/').at(-1)!);
    if (path === '/admin/etsy/connect') return await handleEtsyConnect(req, res);
    if (path === '/admin/etsy/callback') return await handleEtsyCallback(req, res);
    if (path === '/admin/etsy/disconnect') return await handleEtsyDisconnect(req, res);
    const createMatch = path.match(/^\/admin\/listings\/([^/]+)\/etsy-draft$/);
    if (createMatch) return await handleCreateEtsyDraft(req, res, createMatch[1]);
    const duplicateMatch = path.match(/^\/admin\/listings\/([^/]+)\/duplicate$/);
    if (duplicateMatch) return await handleDuplicateListing(req, res, duplicateMatch[1]);
    const uploadMatch = path.match(/^\/admin\/listings\/([^/]+)\/assets$/);
    if (uploadMatch) return await handleUpload(req, res, uploadMatch[1]);
    const listingMatch = path.match(/^\/admin\/listings\/([^/]+)$/);
    if (listingMatch) return await handleListing(req, res, listingMatch[1]);
    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    const status = error && typeof error === 'object' && 'issues' in error ? 400 : 500;
    res.status(status).json({
      error: status === 400 ? 'Validation failed' : 'Request failed safely',
      details: status === 400 ? (error as { issues: unknown }).issues : undefined,
    });
  }
}
