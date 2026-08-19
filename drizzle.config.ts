import { defineConfig } from 'drizzle-kit';
import { config as loadEnv } from 'dotenv';

if (!process.env.DATABASE_URL) loadEnv({ path: '.env.local', quiet: true });

export default defineConfig({
  schema: './src/server/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
});
