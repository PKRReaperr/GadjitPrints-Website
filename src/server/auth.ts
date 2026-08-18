import { hash, verify } from '@node-rs/argon2';
import { and, count, eq, gt } from 'drizzle-orm';
import type { VercelRequestLike as VercelRequest, VercelResponseLike as VercelResponse } from './http-types.js';
import { getDb } from './db.js';
import { adminSessions, adminUsers, loginAttempts } from './schema.js';
import { cookie, parseCookies, randomToken, safeEqual, sha256 } from './security.js';

export const SESSION_COOKIE = '__Host-gp_admin';
export const CSRF_COOKIE = '__Host-gp_csrf';
const SESSION_SECONDS = 60 * 60 * 8;

export function progressiveLoginDelay(failures: number) {
  return Math.min(250 * 2 ** Math.min(Math.max(failures, 0), 5), 8000);
}

export function isLoginRateLimited(failures: number) {
  return failures >= 8;
}

export async function hashPassword(password: string) {
  return hash(password, {
    algorithm: 2,
    memoryCost: 19456,
    timeCost: 3,
    parallelism: 1,
    outputLen: 32,
  });
}

export async function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}

function requestFingerprint(req: VercelRequest) {
  const forwarded = String(req.headers['x-forwarded-for'] ?? 'unknown')
    .split(',')[0]
    .trim();
  return sha256(`${process.env.AUTH_SECRET ?? 'missing'}:${forwarded}`);
}

export async function getSession(req: VercelRequest) {
  const raw = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!raw) return null;
  const db = getDb();
  const [row] = await db
    .select({ session: adminSessions, user: adminUsers })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminUserId, adminUsers.id))
    .where(
      and(
        eq(adminSessions.tokenHash, sha256(raw)),
        gt(adminSessions.expiresAt, new Date()),
        eq(adminUsers.disabled, false)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function requireAdmin(req: VercelRequest, res: VercelResponse) {
  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return session;
}

export function requireCsrf(req: VercelRequest, res: VercelResponse, sessionCsrfHash?: string) {
  const cookies = parseCookies(req.headers.cookie);
  const header = String(req.headers['x-csrf-token'] ?? '');
  const matchesCookie = Boolean(header && cookies[CSRF_COOKIE] && safeEqual(header, cookies[CSRF_COOKIE]));
  const matchesSession = !sessionCsrfHash || safeEqual(sha256(header), sessionCsrfHash);
  if (!matchesCookie || !matchesSession) {
    res.status(403).json({ error: 'Request verification failed' });
    return false;
  }
  return true;
}

export async function ensureLoginCsrf(req: VercelRequest, res: VercelResponse) {
  const existing = parseCookies(req.headers.cookie)[CSRF_COOKIE];
  const token = existing || randomToken();
  if (!existing) res.setHeader('Set-Cookie', cookie(CSRF_COOKIE, token, { httpOnly: false, maxAge: 1800 }));
  return token;
}

async function findOrBootstrapUser(username: string) {
  const db = getDb();
  let [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  if (!user && username === process.env.ADMIN_BOOTSTRAP_USERNAME && process.env.ADMIN_BOOTSTRAP_PASSWORD_HASH) {
    [user] = await db
      .insert(adminUsers)
      .values({
        username,
        passwordHash: process.env.ADMIN_BOOTSTRAP_PASSWORD_HASH,
      })
      .onConflictDoNothing()
      .returning();
    if (!user) [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  }
  return user;
}

export async function login(req: VercelRequest, res: VercelResponse, username: string, password: string) {
  const db = getDb();
  const keyHash = sha256(`${requestFingerprint(req)}:${username.toLowerCase()}`);
  const cutoff = new Date(Date.now() - 15 * 60_000);
  const [{ value: failures }] = await db
    .select({ value: count() })
    .from(loginAttempts)
    .where(
      and(eq(loginAttempts.keyHash, keyHash), eq(loginAttempts.succeeded, false), gt(loginAttempts.attemptedAt, cutoff))
    );
  if (isLoginRateLimited(failures)) return { ok: false as const, status: 429, delayMs: 8000 };
  const user = await findOrBootstrapUser(username);
  const valid = Boolean(user && !user.disabled && (await verifyPassword(user.passwordHash, password)));
  await db.insert(loginAttempts).values({ keyHash, succeeded: valid });
  if (!valid || !user)
    return {
      ok: false as const,
      status: 401,
      delayMs: progressiveLoginDelay(failures),
    };

  const sessionToken = randomToken();
  const csrfToken = randomToken();
  await db.insert(adminSessions).values({
    adminUserId: user.id,
    tokenHash: sha256(sessionToken),
    csrfHash: sha256(csrfToken),
    expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
    userAgent: String(req.headers['user-agent'] ?? '').slice(0, 500),
    ipHash: requestFingerprint(req),
  });
  res.setHeader('Set-Cookie', [
    cookie(SESSION_COOKIE, sessionToken, { maxAge: SESSION_SECONDS }),
    cookie(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      maxAge: SESSION_SECONDS,
    }),
  ]);
  return { ok: true as const, username: user.username };
}

export async function logout(req: VercelRequest, res: VercelResponse) {
  const raw = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (raw)
    await getDb()
      .delete(adminSessions)
      .where(eq(adminSessions.tokenHash, sha256(raw)));
  res.setHeader('Set-Cookie', [
    cookie(SESSION_COOKIE, '', { maxAge: 0 }),
    cookie(CSRF_COOKIE, '', { httpOnly: false, maxAge: 0 }),
  ]);
}
