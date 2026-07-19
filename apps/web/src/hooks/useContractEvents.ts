import { useEffect } from 'react';
import { useWatchContractEvent } from 'wagmi';
import { contractAddresses, abis } from '@archery/contracts';
import { useNotificationStore } from '../stores/notification.store';
import { useQueryClient } from '@tanstack/react-query';

export function useContractEvents() {
  const addNotification = useNotificationStore(state => state.addNotification);
  const queryClient = useQueryClient();

  // Watch GameShop Purchases
  useWatchContractEvent({
    address: contractAddresses.base_mainnet.GameShop as `0x${string}`,
    abi: abis.GameShop,
    eventName: 'ItemPurchased',
    onLogs(logs) {
      logs.forEach((log: any) => {
        addNotification({
          title: 'Purchase Successful!',
          message: 'Your item has been delivered.',
          type: 'success'
        });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      });
    },
  });

  // Watch SBT Mints
  useWatchContractEvent({
    address: contractAddresses.base_mainnet.AchievementSBT as `0x${string}`,
    abi: abis.AchievementSBT,
    eventName: 'AchievementMinted',
    onLogs(logs) {
      logs.forEach((log: any) => {
        addNotification({
          title: 'Achievement Unlocked!',
          message: 'SBT has been minted to your wallet.',
          type: 'success'
        });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      });
    },
  });

  // Watch ERC1155 Transfers
  useWatchContractEvent({
    address: contractAddresses.base_mainnet.ArcheryItems1155 as `0x${string}`,
    abi: abis.ArcheryItems1155,
    eventName: 'TransferSingle',
    onLogs(logs) {
      logs.forEach((log: any) => {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['balance'] });
      });
    },
  });
}
