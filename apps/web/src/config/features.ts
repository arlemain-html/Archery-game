export const featureFlags = {
  ENABLE_PVP: process.env.NEXT_PUBLIC_ENABLE_PVP === 'true' || true,
  ENABLE_SHOP: process.env.NEXT_PUBLIC_ENABLE_SHOP === 'true' || true,
  ENABLE_REPLAY: process.env.NEXT_PUBLIC_ENABLE_REPLAY === 'true' || false,
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' || false,
};
