const fs = require('fs');
const path = require('path');

const rootDir = 'd:/Gamefi/Archery-dApp';

const files = {
  // ==========================================
  // .env.example
  // ==========================================
  '.env.example': `APP_URL=
API_URL=
DATABASE_URL=
REDIS_URL=
CHAIN_ID=
RPC_URL=
WALLETCONNECT_PROJECT_ID=
JWT_SECRET=
JWT_REFRESH_SECRET=
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
NEXT_PUBLIC_CHAIN_ID=
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_CONTRACT_ADDRESS=
`,

  // ==========================================
  // packages/types
  // ==========================================
  'packages/types/src/index.ts': `export * from './user';
export * from './wallet';
export * from './inventory';
export * from './equipment';
export * from './shop';
export * from './match';
export * from './achievement';
export * from './leaderboard';
export * from './api';
export * from './season';
export * from './replay';
`,
  'packages/types/src/user.ts': `export interface User {
  id: string;
  walletAddress: string;
  username: string;
  level: number;
  experience: number;
  createdAt: Date;
  updatedAt: Date;
}
`,
  'packages/types/src/wallet.ts': `export interface Wallet {
  address: string;
  chainId: number;
  balance: string;
  isActive: boolean;
}
`,
  'packages/types/src/inventory.ts': `export interface InventoryItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  acquiredAt: Date;
}
`,
  'packages/types/src/equipment.ts': `export interface Equipment {
  id: string;
  name: string;
  type: 'BOW' | 'ARROW' | 'ACCESSORY';
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  stats: Record<string, number>;
}
`,
  'packages/types/src/shop.ts': `export interface ShopItem {
  id: string;
  equipmentId: string;
  price: string;
  currency: 'GOLD' | 'TOKEN';
  stock: number;
}
`,
  'packages/types/src/match.ts': `export interface Match {
  id: string;
  players: string[];
  status: 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  winnerId?: string;
  startTime: Date;
  endTime?: Date;
}
`,
  'packages/types/src/achievement.ts': `export interface Achievement {
  id: string;
  title: string;
  description: string;
  criteria: Record<string, any>;
  reward: Record<string, any>;
}
`,
  'packages/types/src/leaderboard.ts': `export interface LeaderboardEntry {
  userId: string;
  score: number;
  rank: number;
  seasonId: string;
}
`,
  'packages/types/src/api.ts': `export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
`,
  'packages/types/src/season.ts': `export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}
`,
  'packages/types/src/replay.ts': `export interface Replay {
  matchId: string;
  events: any[];
  duration: number;
}
`,

  // ==========================================
  // packages/config
  // ==========================================
  'packages/config/package.json': `{
  "name": "@archery/config",
  "version": "0.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "lint": "eslint \\"src/**/*.ts\\"",
    "typecheck": "tsc --noEmit",
    "build": "tsc"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "5.4.5",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^8.10.0",
    "@typescript-eslint/parser": "^7.9.0",
    "@typescript-eslint/eslint-plugin": "^7.9.0"
  }
}
`,
  'packages/config/tsconfig.json': `{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": { "*": ["./*"] }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
  'packages/config/src/index.ts': `import { loadEnv } from './env';
export * from './env';
export * from './frontend';
export * from './backend';
export * from './blockchain';
export * from './game';

// Auto-load env in node environments
if (typeof process !== 'undefined' && process.env) {
  loadEnv();
}
`,
  'packages/config/src/env.ts': `import { z } from 'zod';
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
`,
  'packages/config/src/frontend.ts': `export const frontendConfig = {
  theme: 'dark',
  defaultLanguage: 'en',
};
`,
  'packages/config/src/backend.ts': `export const backendConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  }
};
`,
  'packages/config/src/blockchain.ts': `export const blockchainConfig = {
  defaultChainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1', 10),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
};
`,
  'packages/config/src/game.ts': `export const gameConfig = {
  maxPlayersPerMatch: 2,
  matchDurationSeconds: 180,
  gravity: 9.8,
  windVariance: 5.0,
};
`,

  // ==========================================
  // packages/utils
  // ==========================================
  'packages/utils/src/index.ts': `export * from './formatter';
export * from './validator';
export * from './retry';
export * from './logger';
export * from './date';
export * from './number';
export * from './string';
export * from './error';
export * from './async';
`,
  'packages/utils/src/formatter.ts': `export const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};
`,
  'packages/utils/src/validator.ts': `export const isEmail = (email: string): boolean => {
  return /^\\S+@\\S+\\.\\S+$/.test(email);
};
`,
  'packages/utils/src/retry.ts': `export const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
};
`,
  'packages/utils/src/logger.ts': `export const logger = {
  info: (message: string, meta?: any) => console.log(\`[INFO] \${message}\`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(\`[WARN] \${message}\`, meta || ''),
  error: (message: string, meta?: any) => console.error(\`[ERROR] \${message}\`, meta || ''),
};
`,
  'packages/utils/src/date.ts': `export const formatDate = (date: Date): string => {
  return date.toISOString();
};
`,
  'packages/utils/src/number.ts': `export const clamp = (val: number, min: number, max: number): number => {
  return Math.min(Math.max(val, min), max);
};
`,
  'packages/utils/src/string.ts': `export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};
`,
  'packages/utils/src/error.ts': `export const serializeError = (error: any): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};
`,
  'packages/utils/src/async.ts': `export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
`,

  // ==========================================
  // packages/blockchain-sdk
  // ==========================================
  'packages/blockchain-sdk/src/index.ts': `export * from './wallet';
export * from './chain';
export * from './provider';
export * from './abi';
export * from './contract';
export * from './transaction';
export * from './signature';
export * from './error';
`,
  'packages/blockchain-sdk/src/wallet.ts': `export class WalletService {
  connect() { throw new Error('Not implemented'); }
  disconnect() { throw new Error('Not implemented'); }
  getAddress() { throw new Error('Not implemented'); }
}
`,
  'packages/blockchain-sdk/src/chain.ts': `export class ChainService {
  switchChain(chainId: number) { throw new Error('Not implemented'); }
  getNetwork() { throw new Error('Not implemented'); }
}
`,
  'packages/blockchain-sdk/src/provider.ts': `export class ProviderFactory {
  static createProvider(rpcUrl: string) { throw new Error('Not implemented'); }
}
`,
  'packages/blockchain-sdk/src/abi.ts': `export class AbiLoader {
  static load(contractName: string) { throw new Error('Not implemented'); }
}
`,
  'packages/blockchain-sdk/src/contract.ts': `export class ContractLoader {
  static getContract(address: string, abi: any) { throw new Error('Not implemented'); }
}
`,
  'packages/blockchain-sdk/src/transaction.ts': `export class TransactionHelper {
  static async sendTx(txData: any) { throw new Error('Not implemented'); }
  static async waitForConfirmations(txHash: string) { throw new Error('Not implemented'); }
}
`,
  'packages/blockchain-sdk/src/signature.ts': `export class SignatureHelper {
  static async signMessage(message: string) { throw new Error('Not implemented'); }
  static verifySignature(message: string, signature: string, address: string) { throw new Error('Not implemented'); }
}
`,
  'packages/blockchain-sdk/src/error.ts': `export class BlockchainErrorParser {
  static parse(error: any) { throw new Error('Not implemented'); }
}
`,

  // ==========================================
  // packages/api-client
  // ==========================================
  'packages/api-client/package.json': `{
  "name": "@archery/api-client",
  "version": "0.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "lint": "eslint \\"src/**/*.ts\\"",
    "typecheck": "tsc --noEmit",
    "build": "tsc"
  },
  "dependencies": {
    "@archery/types": "workspace:*",
    "@archery/utils": "workspace:*",
    "axios": "latest"
  },
  "devDependencies": {
    "@archery/config": "workspace:*",
    "typescript": "5.4.5"
  }
}
`,
  'packages/api-client/tsconfig.json': `{
  "extends": "@archery/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
  'packages/api-client/.eslintrc.js': `module.exports = {
  extends: [require.resolve("@archery/config")],
  ignorePatterns: ["dist", ".next", "node_modules"],
};
`,
  'packages/api-client/src/index.ts': `export * from './client';
export * from './builder';
export * from './parser';
export * from './interceptor';
export * from './retry';
export * from './error';
`,
  'packages/api-client/src/client.ts': `import axios from 'axios';
import { attachInterceptors } from './interceptor';

export const createApiClient = (baseURL: string) => {
  const client = axios.create({ baseURL });
  attachInterceptors(client);
  return client;
};
`,
  'packages/api-client/src/builder.ts': `export class RequestBuilder {
  private url: string = '';
  private method: string = 'GET';
  private headers: Record<string, string> = {};
  private data: any = null;

  setUrl(url: string) { this.url = url; return this; }
  setMethod(method: string) { this.method = method; return this; }
  setHeaders(headers: Record<string, string>) { this.headers = headers; return this; }
  setData(data: any) { this.data = data; return this; }

  build() {
    return {
      url: this.url,
      method: this.method,
      headers: this.headers,
      data: this.data,
    };
  }
}
`,
  'packages/api-client/src/parser.ts': `import { ApiResponse } from '@archery/types';

export const parseResponse = <T>(data: any): ApiResponse<T> => {
  return data as ApiResponse<T>;
};
`,
  'packages/api-client/src/interceptor.ts': `import { AxiosInstance } from 'axios';

export const attachInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use((config) => {
    // Add auth token etc
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle global errors
      return Promise.reject(error);
    }
  );
};
`,
  'packages/api-client/src/retry.ts': `import { withRetry } from '@archery/utils';

export const retryRequest = <T>(requestFn: () => Promise<T>) => {
  return withRetry(requestFn);
};
`,
  'packages/api-client/src/error.ts': `export class ApiClientError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}
`,
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(rootDir, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Shared Core Foundation packages scaffolded successfully.');
