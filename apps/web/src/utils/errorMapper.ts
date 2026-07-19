export function errorMapper(error: any): string {
  const msg = error?.message?.toLowerCase() || '';
  
  if (msg.includes('user rejected') || msg.includes('user denied')) {
    return 'Wallet Reject: You cancelled the transaction.';
  }
  if (msg.includes('wrong chain') || msg.includes('chain mismatch')) {
    return 'Wrong Chain: Please switch to Base Mainnet.';
  }
  if (msg.includes('insufficient funds') || msg.includes('intrinsic gas too low')) {
    return 'Insufficient Balance: You do not have enough ETH for gas.';
  }
  if (msg.includes('execution reverted') || msg.includes('contract revert')) {
    return 'Contract Revert: The transaction failed on-chain.';
  }
  if (msg.includes('network') || msg.includes('offline') || msg.includes('failed to fetch')) {
    return 'Network Offline: Cannot connect to RPC or API.';
  }
  if (msg.includes('internal server error') || msg.includes('500')) {
    return 'Backend Error: Something went wrong on our server.';
  }
  
  return error?.shortMessage || error?.message || 'An unknown error occurred.';
}
