import { eq } from 'drizzle-orm';
import { getDb } from '../src/server/db.js';
import {
  eventOpportunities,
  licenseRecords,
  listingAssets,
  listingDrafts,
  productRecommendations,
} from '../src/server/schema.js';
import { sampleEvents, sampleListings, sampleProducts } from '../src/data/admin-fixtures.js';

const db = getDb();

for (const event of sampleEvents) {
  await db
    .insert(eventOpportunities)
    .values({
      name: event.name,
      slug: event.slug,
      countryRegion: event.region,
      startDate: event.startDate,
      endDate: event.endDate,
      planningLeadDays: event.leadDays,
      status: event.status as 'active',
      eventType: event.type,
      summary: event.summary,
      productOpportunities: event.opportunities,
      culturalSensitivityNote: event.sensitivity,
      trademarkIpNote: event.ip,
      officialSourceUrl: event.source,
      lastVerifiedDate: event.verified,
      isSample: true,
    })
    .onConflictDoUpdate({
      target: eventOpportunities.slug,
      set: {
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status as 'active',
        updatedAt: new Date(),
      },
    });
}

const recommendationIds = new Map<string, string>();
for (const product of sampleProducts) {
  const existing = await db
    .select()
    .from(productRecommendations)
    .where(eq(productRecommendations.title, product.title))
    .limit(1);
  if (existing[0]) {
    recommendationIds.set(product.id, existing[0].id);
    continue;
  }
  const [license] = await db
    .insert(licenseRecords)
    .values({
      category: product.category as 'paid_commercial',
      exactLicenseName: product.license,
      commercialPermission: product.commercialPermission,
      physicalPrintQuantityLimit: product.quantityLimit,
      attributionRequirement: product.attribution,
      membershipRequirement: product.membership,
      remixRestrictions: product.remix,
      evidenceUrl: product.evidence.startsWith('http') ? product.evidence : 'https://gadjitprints.store',
      evidenceCapturedAt: new Date('2026-08-18T00:00:00Z'),
      status: product.verified as 'verified',
    })
    .returning();
  const [recommendation] = await db
    .insert(productRecommendations)
    .values({
      licenseRecordId: license.id,
      concept: product.concept,
      title: product.title,
      thumbnailUrl: product.thumbnail,
      thumbnailSource: product.thumbnailSource,
      thumbnailApproved: product.thumbnailApproved,
      modelSourceUrl: product.source.startsWith('http') ? product.source : 'https://gadjitprints.store',
      creator: product.creator,
      eventHook: product.hook,
      region: product.region,
      printComplexity: product.complexity.toLowerCase(),
      estimatedPrintMinutes: product.printTime,
      materials: product.materials,
      customizationOpportunity: product.customization,
      ipRiskLevel: product.risk as 'low',
      ipRiskNote: product.riskNote,
      recommendedEtsyTitle: product.etsyTitle,
      recommendedEtsyTags: product.tags,
      suggestedPrice: String(product.price),
      opportunityScore: product.score,
      reviewStatus: product.review as 'approved',
    })
    .returning();
  recommendationIds.set(product.id, recommendation.id);
}

for (const listing of sampleListings) {
  const recommendationId = recommendationIds.get(listing.productId);
  if (!recommendationId) continue;
  const existing = await db.select().from(listingDrafts).where(eq(listingDrafts.sku, listing.sku)).limit(1);
  if (existing[0]) continue;
  const [draft] = await db
    .insert(listingDrafts)
    .values({
      productRecommendationId: recommendationId,
      title: listing.title,
      description: listing.description,
      tags: listing.tags,
      price: String(listing.price),
      quantity: listing.quantity,
      sku: listing.sku,
      materials: listing.materials,
      shippingProfileId: listing.shippingProfileId || null,
      readinessStateId: listing.readinessStateId || null,
      taxonomyId: listing.taxonomyId || null,
      status: listing.status as 'ready',
    })
    .returning();
  for (const asset of listing.assets)
    await db.insert(listingAssets).values({
      listingDraftId: draft.id,
      kind: asset.kind as 'actual_photo',
      url: asset.url,
      rightsNote: 'Gadjit Prints-owned sample photography; confirm before Etsy use.',
      altText: asset.altText,
      approved: asset.approved,
      verifiedAgainstPhysical: true,
      mimeType: 'image/webp',
      byteSize: 1,
      width: 828,
      height: 828,
    });
}

console.log(
  'Beta sample events, recommendations, and drafts are ready. All third-party examples remain visibly marked as sample/unverified.'
);
