export const blockchainConfig = {
  defaultChainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1', 10),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
};
