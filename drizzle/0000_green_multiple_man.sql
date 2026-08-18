CREATE TYPE "public"."asset_kind" AS ENUM('actual_photo', 'source_preview', 'generated_render');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('active', 'coming_soon', 'plan_early', 'archived');--> statement-breakpoint
CREATE TYPE "public"."license_status" AS ENUM('unverified', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('internal_draft', 'ready', 'etsy_draft', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."model_category" AS ENUM('paid_commercial', 'free_commercial_remixable');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('needs_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('queued', 'running', 'completed', 'partial', 'failed');--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"csrf_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"totp_secret_encrypted" text,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"outcome" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etsy_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"shop_id" text,
	"shop_name" text,
	"encrypted_access_token" text NOT NULL,
	"encrypted_refresh_token" text NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"refresh_token_expires_at" timestamp with time zone,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"disconnected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"country_region" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"planning_lead_days" integer NOT NULL,
	"status" "event_status" NOT NULL,
	"event_type" text NOT NULL,
	"summary" text NOT NULL,
	"product_opportunities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cultural_sensitivity_note" text,
	"trademark_ip_note" text,
	"official_source_url" text NOT NULL,
	"last_verified_date" date NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"secret" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"radar_run_id" uuid,
	"idempotency_key" text NOT NULL,
	"job_type" text NOT NULL,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "license_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "model_category" NOT NULL,
	"exact_license_name" text NOT NULL,
	"commercial_permission" text NOT NULL,
	"physical_print_quantity_limit" text,
	"attribution_requirement" text,
	"membership_requirement" text,
	"remix_restrictions" text NOT NULL,
	"evidence_url" text NOT NULL,
	"evidence_captured_at" timestamp with time zone NOT NULL,
	"status" "license_status" DEFAULT 'unverified' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_draft_id" uuid NOT NULL,
	"kind" "asset_kind" NOT NULL,
	"url" text NOT NULL,
	"source_url" text,
	"rights_note" text NOT NULL,
	"alt_text" text NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"verified_against_physical" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"upload_retry_count" integer DEFAULT 0 NOT NULL,
	"etsy_image_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_recommendation_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"sku" text NOT NULL,
	"materials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"personalization_instructions" text,
	"variations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"shipping_profile_id" text,
	"readiness_state_id" text,
	"taxonomy_id" text,
	"processing_recommendation" text,
	"shipping_notes" text,
	"safety_privacy_notes" text,
	"media_plan" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "listing_status" DEFAULT 'internal_draft' NOT NULL,
	"etsy_listing_id" text,
	"etsy_draft_url" text,
	"etsy_idempotency_key" text,
	"last_etsy_error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_hash" text NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"succeeded" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"state_hash" text NOT NULL,
	"code_verifier_encrypted" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_event_matches" (
	"product_recommendation_id" uuid NOT NULL,
	"event_opportunity_id" uuid NOT NULL,
	"relevance_score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"radar_run_id" uuid,
	"license_record_id" uuid NOT NULL,
	"concept" text NOT NULL,
	"title" text NOT NULL,
	"thumbnail_url" text,
	"thumbnail_source" text,
	"thumbnail_approved" boolean DEFAULT false NOT NULL,
	"model_source_url" text NOT NULL,
	"creator" text NOT NULL,
	"event_hook" text NOT NULL,
	"region" text NOT NULL,
	"print_complexity" text NOT NULL,
	"estimated_print_minutes" integer,
	"materials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"customization_opportunity" text NOT NULL,
	"ip_risk_level" "risk_level" NOT NULL,
	"ip_risk_note" text NOT NULL,
	"recommended_etsy_title" text NOT NULL,
	"recommended_etsy_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_price" numeric(10, 2) NOT NULL,
	"opportunity_score" integer NOT NULL,
	"review_status" "review_status" DEFAULT 'needs_review' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "radar_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"trigger" text NOT NULL,
	"provider_response_id" text,
	"model" text,
	"error_code" text,
	"summary" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "etsy_connections" ADD CONSTRAINT "etsy_connections_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_radar_run_id_radar_runs_id_fk" FOREIGN KEY ("radar_run_id") REFERENCES "public"."radar_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_records" ADD CONSTRAINT "license_records_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_assets" ADD CONSTRAINT "listing_assets_listing_draft_id_listing_drafts_id_fk" FOREIGN KEY ("listing_draft_id") REFERENCES "public"."listing_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_drafts" ADD CONSTRAINT "listing_drafts_product_recommendation_id_product_recommendations_id_fk" FOREIGN KEY ("product_recommendation_id") REFERENCES "public"."product_recommendations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_event_matches" ADD CONSTRAINT "product_event_matches_product_recommendation_id_product_recommendations_id_fk" FOREIGN KEY ("product_recommendation_id") REFERENCES "public"."product_recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_event_matches" ADD CONSTRAINT "product_event_matches_event_opportunity_id_event_opportunities_id_fk" FOREIGN KEY ("event_opportunity_id") REFERENCES "public"."event_opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_radar_run_id_radar_runs_id_fk" FOREIGN KEY ("radar_run_id") REFERENCES "public"."radar_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_license_record_id_license_records_id_fk" FOREIGN KEY ("license_record_id") REFERENCES "public"."license_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_sessions_token_uq" ON "admin_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "admin_sessions_expiry_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_username_uq" ON "admin_users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "etsy_connection_admin_uq" ON "etsy_connections" USING btree ("admin_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_opportunities_slug_uq" ON "event_opportunities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "event_opportunities_status_date_idx" ON "event_opportunities" USING btree ("status","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_setting_key_uq" ON "integration_settings" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "job_runs_idempotency_uq" ON "job_runs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "job_runs_status_idx" ON "job_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listing_assets_order_idx" ON "listing_assets" USING btree ("listing_draft_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_etsy_idempotency_uq" ON "listing_drafts" USING btree ("etsy_idempotency_key");--> statement-breakpoint
CREATE INDEX "listing_status_idx" ON "listing_drafts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "login_attempts_key_time_idx" ON "login_attempts" USING btree ("key_hash","attempted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_states_hash_uq" ON "oauth_states" USING btree ("state_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "product_event_match_uq" ON "product_event_matches" USING btree ("product_recommendation_id","event_opportunity_id");--> statement-breakpoint
CREATE INDEX "recommendations_score_idx" ON "product_recommendations" USING btree ("opportunity_score");--> statement-breakpoint
CREATE INDEX "recommendations_review_idx" ON "product_recommendations" USING btree ("review_status");--> statement-breakpoint
CREATE UNIQUE INDEX "radar_runs_idempotency_uq" ON "radar_runs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "radar_runs_status_idx" ON "radar_runs" USING btree ("status");