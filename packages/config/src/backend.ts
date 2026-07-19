export const backendConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  }
};
