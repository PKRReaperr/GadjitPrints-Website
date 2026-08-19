import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { getDb } from './db.js';
import { licenseRecords, productRecommendations, radarRuns } from './schema.js';
import { radarJsonSchema, radarOutputSchema } from './validation.js';

export function denverParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function isDenverRadarWindow(date = new Date()) {
  const parts = denverParts(date);
  return parts.weekday === 'Mon' && parts.hour === '08';
}

export function weeklyIdempotencyKey(date = new Date()) {
  const parts = denverParts(date);
  return `weekly-radar:${parts.year}-${parts.month}-${parts.day}`;
}

export function isCronAuthorized(header: string | undefined, secret = process.env.CRON_SECRET) {
  return Boolean(secret && header === `Bearer ${secret}`);
}

export function isExternalRadarRecommendation(product: {
  creator?: string | null;
  source?: string | null;
  modelSourceUrl?: string | null;
}) {
  if ((product.creator ?? '').toLowerCase().includes('gadjit')) return false;
  const source = product.modelSourceUrl ?? product.source;
  try {
    const url = new URL(source ?? '');
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      url.hostname !== 'example.com' &&
      !url.hostname.endsWith('.example.com')
    );
  } catch {
    return false;
  }
}

const radarPrompt = `Research current worldwide seasonal and cultural product opportunities for a small 3D-print shop. Recommend independent third-party models only; never include Gadjit Prints products, its catalog, or any in-house model. Only recommend either (1) paid models with a purchasable license explicitly allowing physical-print sales, or (2) free models whose source explicitly permits both commercial physical-print sales and remix/derivative work. Reject NonCommercial, NoDerivatives, personal-use-only, fan art, branded/logo/team/character designs, unclear terms, placeholder URLs, and unsupported claims. Keep every recommendation needs_review and every license unverified even when evidence appears strong. Use the original model-source URL and current dates. Set thumbnailUrl and thumbnailSource to null because Radar is intentionally text-only. Never invent permission. Favor low-IP-risk generic concepts and note cultural sensitivity. Return no more than 8 recommendations.`;

export async function startRadarRun(input: { idempotencyKey: string; trigger: 'cron' | 'manual' }) {
  const db = getDb();
  const [run] = await db
    .insert(radarRuns)
    .values({
      idempotencyKey: input.idempotencyKey,
      trigger: input.trigger,
      status: 'queued',
      model: process.env.OPENAI_MODEL ?? 'gpt-5-mini',
    })
    .onConflictDoNothing()
    .returning();
  if (!run) {
    const [existing] = await db
      .select()
      .from(radarRuns)
      .where(eq(radarRuns.idempotencyKey, input.idempotencyKey))
      .limit(1);
    return { run: existing, duplicate: true };
  }

  if (process.env.RADAR_FIXTURE_MODE === 'true' || !process.env.OPENAI_API_KEY) {
    const [complete] = await db
      .update(radarRuns)
      .set({
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        summary: 'Fixture mode completed. Seeded recommendations remain available for review.',
        updatedAt: new Date(),
      })
      .where(eq(radarRuns.id, run.id))
      .returning();
    return { run: complete, duplicate: false };
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 25_000,
      maxRetries: 2,
    });
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-5-mini',
      background: true,
      store: true,
      max_output_tokens: 6000,
      tools: [
        {
          type: 'web_search_preview',
          search_context_size: 'medium',
          user_location: {
            type: 'approximate',
            country: 'US',
            region: 'Colorado',
            timezone: 'America/Denver',
          },
        },
      ],
      input: radarPrompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'product_radar',
          strict: true,
          schema: radarJsonSchema,
        },
      },
    });
    const [updated] = await db
      .update(radarRuns)
      .set({
        status: 'running',
        providerResponseId: response.id,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(radarRuns.id, run.id))
      .returning();
    return { run: updated, duplicate: false };
  } catch (error) {
    await db
      .update(radarRuns)
      .set({
        status: 'failed',
        errorCode: error instanceof Error ? error.message.slice(0, 100) : 'OPENAI_START_FAILED',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(radarRuns.id, run.id));
    throw error;
  }
}

export async function reconcileRadarRun(runId: string) {
  const db = getDb();
  const [run] = await db.select().from(radarRuns).where(eq(radarRuns.id, runId)).limit(1);
  if (!run?.providerResponseId || !process.env.OPENAI_API_KEY || run.status !== 'running') return run;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 20_000,
    maxRetries: 1,
  });
  const response = await openai.responses.retrieve(run.providerResponseId);
  if (response.status === 'failed' || response.status === 'cancelled' || response.status === 'incomplete') {
    const [failed] = await db
      .update(radarRuns)
      .set({
        status: 'failed',
        errorCode: `OPENAI_${response.status.toUpperCase()}`,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(radarRuns.id, run.id))
      .returning();
    return failed;
  }
  if (response.status !== 'completed') return run;
  try {
    const output = radarOutputSchema.parse(JSON.parse(response.output_text));
    await db.transaction(async (tx) => {
      for (const item of output.recommendations) {
        const [license] = await tx
          .insert(licenseRecords)
          .values({
            category: item.license.category,
            exactLicenseName: item.license.exactName,
            commercialPermission: item.license.commercialPermission,
            physicalPrintQuantityLimit: item.license.physicalPrintQuantityLimit,
            attributionRequirement: item.license.attributionRequirement,
            membershipRequirement: item.license.membershipRequirement,
            remixRestrictions: item.license.remixRestrictions,
            evidenceUrl: item.license.evidenceUrl,
            evidenceCapturedAt: new Date(`${item.license.evidenceCaptureDate}T00:00:00Z`),
            status: 'unverified',
          })
          .returning();
        await tx.insert(productRecommendations).values({
          radarRunId: run.id,
          licenseRecordId: license.id,
          concept: item.concept,
          title: item.title,
          thumbnailUrl: item.thumbnailUrl,
          thumbnailSource: item.thumbnailSource,
          thumbnailApproved: false,
          modelSourceUrl: item.modelSourceUrl,
          creator: item.creator,
          eventHook: item.eventHook,
          region: item.region,
          printComplexity: item.printComplexity,
          estimatedPrintMinutes: item.estimatedPrintMinutes,
          materials: item.materials,
          customizationOpportunity: item.customizationOpportunity,
          ipRiskLevel: item.ipRiskLevel,
          ipRiskNote: item.ipRiskNote,
          recommendedEtsyTitle: item.recommendedEtsyTitle,
          recommendedEtsyTags: item.recommendedEtsyTags,
          suggestedPrice: String(item.suggestedPrice),
          opportunityScore: item.opportunityScore,
          reviewStatus: 'needs_review',
        });
      }
      await tx
        .update(radarRuns)
        .set({
          status: 'completed',
          summary: output.summary,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(radarRuns.id, run.id));
    });
    return (await db.select().from(radarRuns).where(eq(radarRuns.id, run.id)).limit(1))[0];
  } catch {
    const [partial] = await db
      .update(radarRuns)
      .set({
        status: 'partial',
        errorCode: 'OUTPUT_VALIDATION_FAILED',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(radarRuns.id, run.id))
      .returning();
    return partial;
  }
}
