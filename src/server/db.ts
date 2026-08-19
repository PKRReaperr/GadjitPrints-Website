import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { config as loadEnv } from 'dotenv';
import * as schema from './schema.js';

if (!process.env.DATABASE_URL) loadEnv({ path: '.env.local', quiet: true });

export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return drizzle(neon(process.env.DATABASE_URL), { schema });
}

export type Database = ReturnType<typeof getDb>;
