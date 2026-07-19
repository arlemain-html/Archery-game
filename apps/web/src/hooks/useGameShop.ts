import { useQueryClient } from '@tanstack/react-query';
import { useTransaction } from './useTransaction';
import { contractAddresses, abis } from '@archery/contracts';
import { parseEther } from 'viem';

export function useGameShop() {
  const { execute } = useTransaction();
  const queryClient = useQueryClient();

  const buyItem = async (itemId: number, priceEth: string, itemName: string) => {
    // Optimistic Update function
    const optimisticUpdate = () => {
      queryClient.setQueryData(['inventory'], (oldData: any[]) => {
        if (!oldData) return [];
        return [...oldData, { item_id: itemId.toString(), quantity: 1, is_nft: true, name: itemName, optimistic: true }];
      });
    };

    const contractConfig = {
      address: contractAddresses.base_mainnet.GameShop as `0x${string}`,
      abi: abis.GameShop,
      functionName: 'buyItem',
      args: [itemId],
      value: parseEther(priceEth),
    };

    await execute('Buy Item', contractConfig, optimisticUpdate);
  };

  return { buyItem };
}
