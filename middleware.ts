import { next } from '@vercel/functions';
import { neon } from '@neondatabase/serverless';

export const config = { matcher: '/admin/:path*', runtime: 'nodejs' };

function parseCookie(header: string, name: string) {
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.pathname === '/admin/login') return next();
  const token = parseCookie(request.headers.get('cookie') ?? '', '__Host-gp_admin');
  let valid = false;
  if (token && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const rows =
        await sql`select 1 from admin_sessions s join admin_users u on u.id = s.admin_user_id where s.token_hash = ${await digest(token)} and s.expires_at > now() and u.disabled = false limit 1`;
      valid = rows.length === 1;
    } catch {
      valid = false;
    }
  }
  if (!valid) {
    const target = new URL('/admin/login', request.url);
    target.searchParams.set('next', url.pathname + url.search);
    return Response.redirect(target, 307);
  }
  const response = next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
