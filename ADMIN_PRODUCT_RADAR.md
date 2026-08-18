# Product Radar Beta

This branch adds a private Product Radar and Etsy draft-preparation system without changing the public storefront. It is designed for the branch-specific `admin-beta.gadjitprints.store` Preview domain. External writes are off by default, and there is no code path or OAuth delete scope that publishes, activates, or deletes an Etsy listing.

## Architecture

- **UI:** the existing React 19/Vite app now routes `/admin/*` to a responsive operations interface. URL query parameters preserve Radar and event filters.
- **Request-time protection:** Vercel Routing Middleware checks the hashed session token against PostgreSQL before serving any admin page except `/admin/login`. Every admin API query independently verifies the same database session.
- **Authentication:** administrator records store Argon2id hashes only. Sessions use a random opaque cookie whose SHA-256 hash is stored in the database. Cookies are HttpOnly, SameSite=Strict, and Secure when deployed. Mutations use a session-bound double-submit CSRF token. Login attempts have a progressive delay and a 15-minute database-backed limit.
- **Data:** Drizzle ORM targets any Vercel-compatible PostgreSQL provider. The generated migration creates users, sessions, events, radar jobs, license evidence, recommendations, listing drafts/assets, Etsy connections, OAuth state, integration settings, and audit logs with indexes and uniqueness controls.
- **Radar:** a protected manual action and Vercel Cron create an idempotent `RadarRun`. Fixture mode completes without OpenAI. Live mode starts a background Responses API job using strict JSON Schema and web search; output is parsed again with Zod, saved as `needs_review`/`unverified`, and never trusted as proof of a license.
- **Etsy:** OAuth 2.0 Authorization Code + PKCE uses a one-time hashed state. Access and refresh tokens are encrypted with AES-256-GCM. The only write workflow calls `createDraftListing`, followed by approved image uploads. `listings_d` is rejected and activation fields are forbidden.
- **Media:** actual photos, source previews, and generated renders have distinct types and rights metadata. Uploads accept only JPEG/PNG/WebP, enforce 8 MB and 600–12,000 px limits, use server-generated names, and go to Vercel Blob. Etsy gating requires an approved `actual_photo`.

## Local setup

1. Use Node.js 20.19+ (or 22.12+) and check out `feature/admin-product-radar-beta`.
2. Copy `.env.example` to `.env.local`. Put real values only in `.env.local`; it is ignored by Git.
3. Create a separate beta PostgreSQL database and set `DATABASE_URL`.
4. Run `npm install`, `npm run db:migrate`, and `npm run db:seed`.
5. Run `npm run admin:hash-password` interactively. It never echoes the password. Put the printed Argon2id hash in `ADMIN_BOOTSTRAP_PASSWORD_HASH`; do not put the password itself anywhere.
6. Set `ADMIN_BOOTSTRAP_USERNAME` and strong values for `AUTH_SECRET`, `CRON_SECRET`, and `TOKEN_ENCRYPTION_KEY`.
7. Keep `RADAR_FIXTURE_MODE=true`, `RADAR_CRON_ENABLED=false`, and `ETSY_DRAFTS_ENABLED=false` initially.
8. Use `npx vercel dev` to exercise Vercel Functions and Routing Middleware. Plain `npm run dev` serves the visual SPA but does not emulate server functions.
9. Open `/admin/login`. On the first successful login, the bootstrap administrator is inserted into the database.

## Environment variables

All are server-only. None may use `NEXT_PUBLIC_` or `VITE_`.

| Name                            |    Required | Purpose                                                 |
| ------------------------------- | ----------: | ------------------------------------------------------- |
| `DATABASE_URL`                  |         Yes | Beta PostgreSQL connection string                       |
| `AUTH_SECRET`                   |         Yes | IP-fingerprint/session support secret                   |
| `ADMIN_BOOTSTRAP_USERNAME`      | First login | Initial admin username                                  |
| `ADMIN_BOOTSTRAP_PASSWORD_HASH` | First login | Argon2id hash, never plaintext                          |
| `CRON_SECRET`                   |        Cron | Vercel-supplied Bearer secret, 16+ random bytes         |
| `TOKEN_ENCRYPTION_KEY`          |        Etsy | Base64 encoding of exactly 32 random bytes              |
| `OPENAI_API_KEY`                |  Live Radar | Server-side OpenAI key                                  |
| `OPENAI_MODEL`                  |          No | Defaults to `gpt-5-mini`                                |
| `RADAR_FIXTURE_MODE`            |         Yes | `true` avoids live OpenAI requests                      |
| `RADAR_CRON_ENABLED`            |         Yes | Must be exactly `true` for scheduled work               |
| `ETSY_API_KEY`                  |        Etsy | Etsy app keystring                                      |
| `ETSY_SHARED_SECRET`            |        Etsy | Etsy app shared secret                                  |
| `ETSY_REDIRECT_URI`             |        Etsy | Exact HTTPS callback URL                                |
| `ETSY_SCOPES`                   |        Etsy | Use `listings_r listings_w shops_r`; never `listings_d` |
| `ETSY_DRAFTS_ENABLED`           |         Yes | Must be exactly `true` to permit draft writes           |
| `BLOB_READ_WRITE_TOKEN`         |     Uploads | Beta Vercel Blob store token                            |

Keep Preview and Production values separate. Do not attach the beta database, Etsy app, Blob store, or encryption key to Production unless a later, explicit promotion is approved.

## Weekly schedule and manual Radar

Vercel Cron uses UTC. `vercel.json` invokes the endpoint at `14:00` and `15:00` UTC every Monday. The endpoint proceeds only when `Intl.DateTimeFormat` reports Monday, 08:00 in `America/Denver`; this covers MDT and MST without manual DST edits. A unique `weekly-radar:YYYY-MM-DD` database key handles duplicate delivery. The endpoint verifies `Authorization: Bearer $CRON_SECRET`, starts/queues work, and returns promptly.

To run manually, open **Admin → Product Radar → Run Radar**. Repeated presses in one UTC hour use the same idempotency key. Progress appears in Recent radar runs. Live background responses are reconciled by the run-status endpoint; fixture mode completes immediately.

## OpenAI connection

1. Create a beta project/key in the OpenAI Platform; do not share the key in chat or commit it.
2. In Vercel, add `OPENAI_API_KEY` and `OPENAI_MODEL` to **Preview only**.
3. Leave `RADAR_FIXTURE_MODE=true` until the seeded UI and permissions are verified, then change it to `false` and redeploy.
4. Keep `RADAR_CRON_ENABLED=false` for the first manual run. Review output/cost and then enable the cron.
5. Every model/license result still begins as unverified and requires human review of its evidence URL and current license terms.

## Etsy developer app and OAuth

1. Sign in to Etsy and open **Developer Portal → Your Apps → Create a new app**. Use a separate beta/testing app if available.
2. Register the callback exactly as `https://admin-beta.gadjitprints.store/api/admin/etsy/callback` (case, scheme, path, and trailing slash must match exactly).
3. In Vercel Preview variables, add `ETSY_API_KEY`, `ETSY_SHARED_SECRET`, `ETSY_REDIRECT_URI`, and `TOKEN_ENCRYPTION_KEY`.
4. Set `ETSY_SCOPES=listings_r listings_w shops_r`. Do not add `listings_d`.
5. Redeploy, open **Admin → Integrations → Connect Etsy**, approve the requested scopes, then choose/verify the shop, shipping profile, readiness state, and taxonomy IDs used by each listing.
6. Leave `ETSY_DRAFTS_ENABLED=false` while testing OAuth and saving internal drafts. Enable it in Preview only when ready for a controlled draft test, then redeploy.
7. Open a listing, confirm its license and IP review, upload and approve an actual product photo, enter Etsy profile/category IDs, and choose **Create Etsy Draft**. Confirm the dialog. Finish review and publishing manually inside Etsy.

Etsy access tokens are refreshed server-side when required by the integration service. Rotate `TOKEN_ENCRYPTION_KEY` only after disconnecting Etsy or after implementing a controlled decrypt/re-encrypt migration; changing it immediately makes existing token envelopes unreadable. Disconnecting clears stored ciphertext and marks the connection inactive.

## Vercel Preview and beta domain

Vercel Cron calls only a project's **Production deployment URL**. A domain attached to a Preview branch works for the UI and manual Radar, but its `vercel.json` Cron will not run automatically. Therefore use one of these two explicit beta arrangements:

- **Normal branch Preview (simplest):** attach `admin-beta.gadjitprints.store` to the feature branch and use branch-scoped Preview variables. The admin UI, manual Radar, OAuth, and draft flow work; scheduled Radar stays inactive.
- **Separate beta Vercel project (recommended for weekly scheduling):** import the same repository as a new project named, for example, `gadjitprints-admin-beta`, set its Production Branch to `feature/admin-product-radar-beta`, and attach only `admin-beta.gadjitprints.store`. The word “Production” then refers only to the isolated beta project—not the existing storefront project or `gadjitprints.store`. Use beta-only database/OpenAI/Etsy/Blob credentials in that project.

Never change the Production Branch, production-domain assignment, or Production variables of the existing storefront project.

1. Push only `feature/admin-product-radar-beta` to the configured Git remote.
2. For the normal Preview route, open the existing Vercel project and use Preview branch environment-variable overrides for `feature/admin-product-radar-beta`. Pro/Enterprise teams may instead create **Settings → Environments → Custom Environments → admin-beta** and track that branch.
3. Open **Project → Settings → Domains → Add Domain** and enter `admin-beta.gadjitprints.store`.
4. Assign that domain to the beta/custom environment (or branch deployment) for `feature/admin-product-radar-beta`. Do not edit or reassign `gadjitprints.store`.
5. If DNS is external, Vercel will show the exact required record. At the DNS host, add only that record—typically a CNAME for host `admin-beta` to the target Vercel displays. Do not guess or change the apex/production records.
6. Open **Project → Settings → Environment Variables**, select **Preview** (and the `feature/admin-product-radar-beta` branch/custom environment), and enter the variables above. Do not select Production.
7. Open **Deployments**, select the feature-branch deployment, and choose **Redeploy** after changing environment variables.
8. Update the Etsy app callback to the exact beta URL and run the OAuth connection again.
9. In a normal Preview arrangement, keep `RADAR_CRON_ENABLED=false` because Vercel will not schedule Preview Crons. For scheduled beta runs, create the separate beta project described above, verify its domain and beta-only credentials, run Radar manually, then enable `RADAR_CRON_ENABLED` in that isolated project's environment.

## Owner Setup Checklist

- [ ] **Git host → repository → Branches:** confirm `feature/admin-product-radar-beta` exists and `main` is unchanged.
- [ ] **Database provider → New project/database:** create a beta-only PostgreSQL database; copy its connection string directly into Vercel Preview.
- [ ] **Local terminal:** run `npm run db:migrate` and `npm run db:seed` against the beta database.
- [ ] **Local terminal:** run `npm run admin:hash-password`; save only the resulting hash in Vercel.
- [ ] **Vercel → Project → Settings → Environment Variables → Preview:** add every required server variable and scope it to the feature branch/custom environment.
- [ ] **Vercel → Project → Storage → Create Database/Blob:** connect a beta Blob store and expose `BLOB_READ_WRITE_TOKEN` to Preview only.
- [ ] **Vercel → Project → Settings → Domains:** add `admin-beta.gadjitprints.store` to the feature branch/custom environment; leave the production domain untouched.
- [ ] **DNS provider → gadjitprints.store → DNS records:** add only the `admin-beta` record shown by Vercel.
- [ ] **OpenAI Platform → Project → API keys:** create a beta key; add it directly to Vercel Preview, never source or chat.
- [ ] **Etsy Developer Portal → Your Apps → beta app:** set the exact HTTPS callback and minimal scopes.
- [ ] **Admin → Integrations:** connect Etsy, verify the shop, and record the shipping/readiness/taxonomy choices.
- [ ] **Admin → Product Radar:** run once in fixture mode, then once live; review every citation/license manually.
- [ ] **Vercel → Environment Variables → Preview:** enable `ETSY_DRAFTS_ENABLED=true` only for a controlled beta draft test.
- [ ] **Etsy → Shop Manager → Listings → Drafts:** inspect the created draft, photos, price, variations, shipping, and rights before publishing manually.

## Disabling, backup, and rollback

- Set `ETSY_DRAFTS_ENABLED=false` and `RADAR_CRON_ENABLED=false`, then redeploy, to stop all external writes and scheduled research.
- Disconnect Etsy in Admin to clear stored token ciphertext. Revoke the app in Etsy as an additional external control.
- Use the database provider’s point-in-time recovery or scheduled backups. Back up the beta database before migrations or promotion.
- Vercel rollback changes code but does not change environment variables, database migrations, or active Cron configuration. Disable Cron first when rolling back an integration incident.
- To remove the beta, detach only `admin-beta.gadjitprints.store`, disable the flags, revoke beta credentials, and archive the beta database after its retention period.

## Promotion checklist (do not execute without explicit approval)

- [ ] Resolve all beta limitations and review the final security diff.
- [ ] Rotate beta credentials before any production use.
- [ ] Back up production data and rehearse migrations.
- [ ] Reconfirm Etsy API terms, field limits, scopes, and callback.
- [ ] Reconfirm Vercel Cron plan limits and function duration.
- [ ] Re-run `npm run verify` and `npm audit`.
- [ ] Review CSP, logs, audit records, accessibility, mobile layout, and manual Etsy draft behavior.
- [ ] Obtain explicit owner approval before merging to `main` or assigning any production environment variables/domain.

## Current beta limitations

- Etsy shop/profile/readiness/taxonomy selection depends on a real connected Etsy account and must be verified after OAuth; the UI deliberately leaves those selectors disabled until live option-sync data is available.
- Product recommendation/license approval controls are stored in the schema and enforced for Etsy creation, but the first beta expects database review/administrative tooling for changing those statuses.
- Fixture image references are demonstration data. Only photographs owned by Gadjit Prints should be approved for listing use.
- OpenAI background completion requires an authenticated status poll; adding a signed OpenAI webhook is a future durability enhancement.
