import { loadEnv } from './env.js';
export * from './backend.js';
export * from './frontend.js';
export * from './blockchain.js';
export * from './game.js';
export * from './env.js';
export * from './game-data.js';

// Auto-load env in node environments
if (typeof process !== 'undefined' && process.env) {
  loadEnv();
}
