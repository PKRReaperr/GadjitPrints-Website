import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const SECRET_PATTERN = /(authorization|cookie|password|secret|token|api[_-]?key|code_verifier)/i;

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function encryptionKey(key = process.env.TOKEN_ENCRYPTION_KEY) {
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY is not configured');
  const decoded = Buffer.from(key, 'base64');
  if (decoded.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  return decoded;
}

export function encryptSecret(plaintext: string, key?: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(key), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

export function decryptSecret(envelope: string, key?: string) {
  const [version, ivText, tagText, ciphertextText] = envelope.split('.');
  if (version !== 'v1' || !ivText || !tagText || !ciphertextText) throw new Error('Invalid encrypted value');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(key), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextText, 'base64url')), decipher.final()]).toString('utf8');
}

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, SECRET_PATTERN.test(key) ? '[REDACTED]' : redact(item)])
  );
}

export function cookie(
  name: string,
  value: string,
  options: { maxAge?: number; secure?: boolean; httpOnly?: boolean } = {}
) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Strict'];
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.secure ?? process.env.NODE_ENV === 'production') parts.push('Secure');
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join('; ');
}

export function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([key, value]) => key && value !== undefined)
      .map(([key, value]) => [key, decodeURIComponent(value)])
  );
}

export function isSafeAdminRedirect(value: unknown) {
  return typeof value === 'string' && value.startsWith('/admin/') && !value.startsWith('//') && !value.includes('\\');
}
