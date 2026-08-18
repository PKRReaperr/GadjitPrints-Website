import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const eventStatus = pgEnum('event_status', ['active', 'coming_soon', 'plan_early', 'archived']);
export const runStatus = pgEnum('run_status', ['queued', 'running', 'completed', 'partial', 'failed']);
export const reviewStatus = pgEnum('review_status', ['needs_review', 'approved', 'rejected']);
export const licenseStatus = pgEnum('license_status', ['unverified', 'verified', 'rejected']);
export const modelCategory = pgEnum('model_category', ['paid_commercial', 'free_commercial_remixable']);
export const riskLevel = pgEnum('risk_level', ['low', 'medium', 'high']);
export const assetKind = pgEnum('asset_kind', ['actual_photo', 'source_preview', 'generated_render']);
export const listingStatus = pgEnum('listing_status', ['internal_draft', 'ready', 'etsy_draft', 'partial', 'failed']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    totpSecretEncrypted: text('totp_secret_encrypted'),
    disabled: boolean('disabled').notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex('admin_users_username_uq').on(table.username)]
);

export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    csrfHash: text('csrf_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    userAgent: text('user_agent'),
    ipHash: text('ip_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('admin_sessions_token_uq').on(table.tokenHash),
    index('admin_sessions_expiry_idx').on(table.expiresAt),
  ]
);

export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    keyHash: text('key_hash').notNull(),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
    succeeded: boolean('succeeded').notNull().default(false),
  },
  (table) => [index('login_attempts_key_time_idx').on(table.keyHash, table.attemptedAt)]
);

export const radarRuns = pgTable(
  'radar_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    idempotencyKey: text('idempotency_key').notNull(),
    status: runStatus('status').notNull().default('queued'),
    trigger: text('trigger').notNull(),
    providerResponseId: text('provider_response_id'),
    model: text('model'),
    errorCode: text('error_code'),
    summary: text('summary'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('radar_runs_idempotency_uq').on(table.idempotencyKey),
    index('radar_runs_status_idx').on(table.status),
  ]
);

export const eventOpportunities = pgTable(
  'event_opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    countryRegion: text('country_region').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    planningLeadDays: integer('planning_lead_days').notNull(),
    status: eventStatus('status').notNull(),
    eventType: text('event_type').notNull(),
    summary: text('summary').notNull(),
    productOpportunities: jsonb('product_opportunities').$type<string[]>().notNull().default([]),
    culturalSensitivityNote: text('cultural_sensitivity_note'),
    trademarkIpNote: text('trademark_ip_note'),
    officialSourceUrl: text('official_source_url').notNull(),
    lastVerifiedDate: date('last_verified_date').notNull(),
    isSample: boolean('is_sample').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('event_opportunities_slug_uq').on(table.slug),
    index('event_opportunities_status_date_idx').on(table.status, table.startDate),
  ]
);

export const licenseRecords = pgTable('license_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: modelCategory('category').notNull(),
  exactLicenseName: text('exact_license_name').notNull(),
  commercialPermission: text('commercial_permission').notNull(),
  physicalPrintQuantityLimit: text('physical_print_quantity_limit'),
  attributionRequirement: text('attribution_requirement'),
  membershipRequirement: text('membership_requirement'),
  remixRestrictions: text('remix_restrictions').notNull(),
  evidenceUrl: text('evidence_url').notNull(),
  evidenceCapturedAt: timestamp('evidence_captured_at', {
    withTimezone: true,
  }).notNull(),
  status: licenseStatus('status').notNull().default('unverified'),
  reviewedBy: uuid('reviewed_by').references(() => adminUsers.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  ...timestamps,
});

export const productRecommendations = pgTable(
  'product_recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    radarRunId: uuid('radar_run_id').references(() => radarRuns.id, {
      onDelete: 'set null',
    }),
    licenseRecordId: uuid('license_record_id')
      .notNull()
      .references(() => licenseRecords.id),
    concept: text('concept').notNull(),
    title: text('title').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    thumbnailSource: text('thumbnail_source'),
    thumbnailApproved: boolean('thumbnail_approved').notNull().default(false),
    modelSourceUrl: text('model_source_url').notNull(),
    creator: text('creator').notNull(),
    eventHook: text('event_hook').notNull(),
    region: text('region').notNull(),
    printComplexity: text('print_complexity').notNull(),
    estimatedPrintMinutes: integer('estimated_print_minutes'),
    materials: jsonb('materials').$type<string[]>().notNull().default([]),
    customizationOpportunity: text('customization_opportunity').notNull(),
    ipRiskLevel: riskLevel('ip_risk_level').notNull(),
    ipRiskNote: text('ip_risk_note').notNull(),
    recommendedEtsyTitle: text('recommended_etsy_title').notNull(),
    recommendedEtsyTags: jsonb('recommended_etsy_tags').$type<string[]>().notNull().default([]),
    suggestedPrice: numeric('suggested_price', {
      precision: 10,
      scale: 2,
    }).notNull(),
    opportunityScore: integer('opportunity_score').notNull(),
    reviewStatus: reviewStatus('review_status').notNull().default('needs_review'),
    ...timestamps,
  },
  (table) => [
    index('recommendations_score_idx').on(table.opportunityScore),
    index('recommendations_review_idx').on(table.reviewStatus),
  ]
);

export const productEventMatches = pgTable(
  'product_event_matches',
  {
    productRecommendationId: uuid('product_recommendation_id')
      .notNull()
      .references(() => productRecommendations.id, { onDelete: 'cascade' }),
    eventOpportunityId: uuid('event_opportunity_id')
      .notNull()
      .references(() => eventOpportunities.id, { onDelete: 'cascade' }),
    relevanceScore: integer('relevance_score').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('product_event_match_uq').on(table.productRecommendationId, table.eventOpportunityId)]
);

export const listingDrafts = pgTable(
  'listing_drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productRecommendationId: uuid('product_recommendation_id').references(() => productRecommendations.id),
    title: text('title').notNull(),
    description: text('description').notNull(),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull(),
    sku: text('sku').notNull(),
    materials: jsonb('materials').$type<string[]>().notNull().default([]),
    personalizationInstructions: text('personalization_instructions'),
    variations: jsonb('variations').$type<Record<string, unknown>>().notNull().default({}),
    shippingProfileId: text('shipping_profile_id'),
    readinessStateId: text('readiness_state_id'),
    taxonomyId: text('taxonomy_id'),
    processingRecommendation: text('processing_recommendation'),
    shippingNotes: text('shipping_notes'),
    safetyPrivacyNotes: text('safety_privacy_notes'),
    mediaPlan: jsonb('media_plan').$type<Record<string, unknown>>().notNull().default({}),
    status: listingStatus('status').notNull().default('internal_draft'),
    etsyListingId: text('etsy_listing_id'),
    etsyDraftUrl: text('etsy_draft_url'),
    etsyIdempotencyKey: text('etsy_idempotency_key'),
    lastEtsyErrorCode: text('last_etsy_error_code'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('listing_etsy_idempotency_uq').on(table.etsyIdempotencyKey),
    index('listing_status_idx').on(table.status),
  ]
);

export const listingAssets = pgTable(
  'listing_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingDraftId: uuid('listing_draft_id')
      .notNull()
      .references(() => listingDrafts.id, { onDelete: 'cascade' }),
    kind: assetKind('kind').notNull(),
    url: text('url').notNull(),
    sourceUrl: text('source_url'),
    rightsNote: text('rights_note').notNull(),
    altText: text('alt_text').notNull(),
    approved: boolean('approved').notNull().default(false),
    verifiedAgainstPhysical: boolean('verified_against_physical').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    mimeType: text('mime_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    uploadRetryCount: integer('upload_retry_count').notNull().default(0),
    etsyImageId: text('etsy_image_id'),
    ...timestamps,
  },
  (table) => [index('listing_assets_order_idx').on(table.listingDraftId, table.sortOrder)]
);

export const etsyConnections = pgTable(
  'etsy_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => adminUsers.id),
    shopId: text('shop_id'),
    shopName: text('shop_name'),
    encryptedAccessToken: text('encrypted_access_token').notNull(),
    encryptedRefreshToken: text('encrypted_refresh_token').notNull(),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }).notNull(),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
    disconnectedAt: timestamp('disconnected_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex('etsy_connection_admin_uq').on(table.adminUserId)]
);

export const integrationSettings = pgTable(
  'integration_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(),
    value: jsonb('value').$type<Record<string, unknown>>().notNull().default({}),
    secret: boolean('secret').notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex('integration_setting_key_uq').on(table.key)]
);

export const jobRuns = pgTable(
  'job_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    radarRunId: uuid('radar_run_id').references(() => radarRuns.id),
    idempotencyKey: text('idempotency_key').notNull(),
    jobType: text('job_type').notNull(),
    status: runStatus('status').notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    errorCode: text('error_code'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('job_runs_idempotency_uq').on(table.idempotencyKey),
    index('job_runs_status_idx').on(table.status),
  ]
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminUserId: uuid('admin_user_id').references(() => adminUsers.id),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    outcome: text('outcome').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    ipHash: text('ip_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    index('audit_logs_created_idx').on(table.createdAt),
  ]
);

export const oauthStates = pgTable(
  'oauth_states',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    stateHash: text('state_hash').notNull(),
    codeVerifierEncrypted: text('code_verifier_encrypted').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('oauth_states_hash_uq').on(table.stateHash)]
);
