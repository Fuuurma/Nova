// src/env.ts
/**
 * Environment variables for Nova.
 * Uses Zod for validation.
 */
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),

  // Nexus API
  NEXUS_API_URL: z.string().url().default('http://localhost:4000'),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),

  // Internal service auth
  FURMA_INTERNAL_SECRET: z.string().min(1).default('dev-internal-secret'),

  // Node env
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

type Env = z.infer<typeof envSchema>;

// Parse and validate env
function getEnv(): Env {
  // In development, allow missing optional vars
  const result = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXUS_API_URL: process.env.NEXUS_API_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    FURMA_INTERNAL_SECRET: process.env.FURMA_INTERNAL_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
    // In dev, return defaults instead of throwing
    if (process.env.NODE_ENV !== 'production') {
      return {
        DATABASE_URL: process.env.DATABASE_URL,
        NEXUS_API_URL: 'http://localhost:4000',
        BETTER_AUTH_SECRET: 'dev-secret',
        BETTER_AUTH_URL: 'http://localhost:3000',
        FURMA_INTERNAL_SECRET: 'dev-internal-secret',
        NODE_ENV: 'development',
      };
    }
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

export const env = getEnv();