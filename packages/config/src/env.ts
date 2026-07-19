import { z } from 'zod';
import dotenv from 'dotenv';

export const envSchema = z.object({
  APP_URL: z.string().url().optional(),
  API_URL: z.string().url().optional(),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  CHAIN_ID: z.string().optional(),
  RPC_URL: z.string().url().optional(),
  // Add more as needed
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig | null = null;

export const loadEnv = () => {
  dotenv.config();
  parsedEnv = envSchema.parse(process.env);
};

export const getEnv = (): EnvConfig => {
  if (!parsedEnv) {
    // Fallback for environments where loadEnv wasn't explicitly called
    parsedEnv = envSchema.parse(process.env);
  }
  return parsedEnv;
};
