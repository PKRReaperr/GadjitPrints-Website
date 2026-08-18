import { z } from 'zod';

export const commercialModelCategory = z.enum(['paid_commercial', 'free_commercial_remixable']);
export const licenseVerificationStatus = z.enum(['unverified', 'verified', 'rejected']);

export const radarRecommendationSchema = z
  .object({
    concept: z.string().min(3).max(500),
    title: z.string().min(3).max(140),
    thumbnailUrl: z.string().url().nullable(),
    thumbnailSource: z.string().url().nullable(),
    thumbnailApproved: z.literal(false),
    modelSourceUrl: z.string().url(),
    creator: z.string().min(1).max(160),
    eventHook: z.string().min(2).max(240),
    region: z.string().min(2).max(100),
    license: z.object({
      category: commercialModelCategory,
      exactName: z.string().min(2).max(160),
      commercialPermission: z.string().min(3).max(500),
      physicalPrintQuantityLimit: z.string().max(200).nullable(),
      attributionRequirement: z.string().max(300).nullable(),
      membershipRequirement: z.string().max(300).nullable(),
      remixRestrictions: z.string().min(2).max(300),
      evidenceUrl: z.string().url(),
      evidenceCaptureDate: z.string().date(),
      verificationStatus: z.literal('unverified'),
    }),
    printComplexity: z.enum(['low', 'medium', 'high']),
    estimatedPrintMinutes: z.number().int().positive().max(10080).nullable(),
    materials: z.array(z.string().min(1).max(40)).min(1).max(8),
    customizationOpportunity: z.string().min(2).max(400),
    ipRiskLevel: z.enum(['low', 'medium', 'high']),
    ipRiskNote: z.string().min(2).max(500),
    recommendedEtsyTitle: z.string().min(1).max(140),
    recommendedEtsyTags: z.array(z.string().min(1).max(20)).max(13),
    suggestedPrice: z.number().positive().max(10000),
    opportunityScore: z.number().int().min(0).max(100),
    reviewStatus: z.literal('needs_review'),
  })
  .superRefine((item, ctx) => {
    const forbidden =
      /noncommercial|no derivatives|personal use|fan art|copyrighted character|logo|sports.?team|unclear license/i;
    if (
      forbidden.test(`${item.license.exactName} ${item.license.commercialPermission} ${item.license.remixRestrictions}`)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'License or IP wording is not eligible for recommendation approval',
      });
    }
    if (
      item.license.category === 'free_commercial_remixable' &&
      !/remix|derivative|adapt|modify/i.test(`${item.license.commercialPermission} ${item.license.remixRestrictions}`)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Free models must explicitly allow remixing or derivative works',
      });
    }
  });

export const radarOutputSchema = z.object({
  summary: z.string().min(1).max(1000),
  recommendations: z.array(radarRecommendationSchema).min(1).max(12),
  citations: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string().min(1),
        recommendationIndexes: z.array(z.number().int().nonnegative()),
      })
    )
    .max(40),
});

const etsyTitle = z
  .string()
  .trim()
  .min(1)
  .max(140)
  .refine((value) => !/[^\p{L}\p{Nd}\p{P}\p{Sm}\p{Zs}™©®]/u.test(value), 'Title contains unsupported characters');
const etsyTag = z.string().trim().min(1).max(20);

export const listingDraftSchema = z.object({
  title: etsyTitle,
  description: z.string().trim().min(1).max(50000),
  tags: z
    .array(etsyTag)
    .max(13)
    .refine((tags) => new Set(tags.map((tag) => tag.toLowerCase())).size === tags.length, 'Tags must be unique'),
  price: z.coerce.number().positive().max(10000),
  quantity: z.coerce.number().int().min(1).max(999),
  sku: z.string().trim().min(1).max(32),
  materials: z.array(z.string().trim().min(1).max(45)).max(13),
  personalizationInstructions: z.string().max(1024).nullable().default(null),
  variations: z.record(z.string(), z.unknown()).default({}),
  shippingProfileId: z.string().regex(/^\d+$/),
  readinessStateId: z.string().regex(/^\d+$/),
  taxonomyId: z.string().regex(/^\d+$/),
  processingRecommendation: z.string().max(300).nullable().default(null),
  shippingNotes: z.string().max(1000).nullable().default(null),
  safetyPrivacyNotes: z.string().max(1000).nullable().default(null),
  mediaPlan: z.record(z.string(), z.unknown()).default({}),
});

export const radarJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'recommendations', 'citations'],
  properties: {
    summary: { type: 'string' },
    recommendations: {
      type: 'array',
      minItems: 1,
      maxItems: 12,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'concept',
          'title',
          'thumbnailUrl',
          'thumbnailSource',
          'thumbnailApproved',
          'modelSourceUrl',
          'creator',
          'eventHook',
          'region',
          'license',
          'printComplexity',
          'estimatedPrintMinutes',
          'materials',
          'customizationOpportunity',
          'ipRiskLevel',
          'ipRiskNote',
          'recommendedEtsyTitle',
          'recommendedEtsyTags',
          'suggestedPrice',
          'opportunityScore',
          'reviewStatus',
        ],
        properties: {
          concept: { type: 'string' },
          title: { type: 'string' },
          thumbnailUrl: { type: ['string', 'null'] },
          thumbnailSource: { type: ['string', 'null'] },
          thumbnailApproved: { type: 'boolean' },
          modelSourceUrl: { type: 'string' },
          creator: { type: 'string' },
          eventHook: { type: 'string' },
          region: { type: 'string' },
          license: {
            type: 'object',
            additionalProperties: false,
            required: [
              'category',
              'exactName',
              'commercialPermission',
              'physicalPrintQuantityLimit',
              'attributionRequirement',
              'membershipRequirement',
              'remixRestrictions',
              'evidenceUrl',
              'evidenceCaptureDate',
              'verificationStatus',
            ],
            properties: {
              category: {
                type: 'string',
                enum: ['paid_commercial', 'free_commercial_remixable'],
              },
              exactName: { type: 'string' },
              commercialPermission: { type: 'string' },
              physicalPrintQuantityLimit: { type: ['string', 'null'] },
              attributionRequirement: { type: ['string', 'null'] },
              membershipRequirement: { type: ['string', 'null'] },
              remixRestrictions: { type: 'string' },
              evidenceUrl: { type: 'string' },
              evidenceCaptureDate: { type: 'string' },
              verificationStatus: { type: 'string', enum: ['unverified'] },
            },
          },
          printComplexity: { type: 'string', enum: ['low', 'medium', 'high'] },
          estimatedPrintMinutes: { type: ['integer', 'null'] },
          materials: { type: 'array', items: { type: 'string' } },
          customizationOpportunity: { type: 'string' },
          ipRiskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
          ipRiskNote: { type: 'string' },
          recommendedEtsyTitle: { type: 'string' },
          recommendedEtsyTags: {
            type: 'array',
            maxItems: 13,
            items: { type: 'string' },
          },
          suggestedPrice: { type: 'number' },
          opportunityScore: { type: 'integer' },
          reviewStatus: { type: 'string', enum: ['needs_review'] },
        },
      },
    },
    citations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['url', 'title', 'recommendationIndexes'],
        properties: {
          url: { type: 'string' },
          title: { type: 'string' },
          recommendationIndexes: { type: 'array', items: { type: 'integer' } },
        },
      },
    },
  },
} as const;

export function assertDraftOnlyPayload(payload: Record<string, unknown>) {
  if (payload.state !== undefined || payload.is_active !== undefined)
    throw new Error('Listing activation fields are forbidden');
  return payload;
}

export function canCreateEtsyDraft(input: {
  recommendationReview: string;
  licenseStatus: string;
  assets: Array<{ kind: string; approved: boolean }>;
}) {
  return (
    input.recommendationReview === 'approved' &&
    input.licenseStatus === 'verified' &&
    input.assets.some((asset) => asset.kind === 'actual_photo' && asset.approved)
  );
}
