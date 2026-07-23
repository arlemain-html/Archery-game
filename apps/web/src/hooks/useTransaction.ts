import { useTransactionStore } from '../stores/transaction.store';
import { useNotificationStore } from '../stores/notification.store';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '../app/providers';
import { errorMapper } from '../utils/errorMapper';
import { useQueryClient } from '@tanstack/react-query';

export function useTransaction() {
  const addTransaction = useTransactionStore(state => state.addTransaction);
  const updateTransaction = useTransactionStore(state => state.updateTransaction);
  const addNotification = useNotificationStore(state => state.addNotification);
  const queryClient = useQueryClient();

  const execute = async (
    type: string, 
    contractConfig: any, 
    optimisticUpdate?: () => void,
    onSuccess?: () => void
  ) => {
    const txId = addTransaction({ type });
    updateTransaction(txId, { status: 'Wallet Confirmation' });
    
    try {
      if (optimisticUpdate) optimisticUpdate();

      // Submit transaction
      const hash = await writeContract(config, contractConfig);
      
      updateTransaction(txId, { status: 'Submitted', hash });
      addNotification({ title: 'Transaction Submitted', message: `Hash: ${hash.substring(0, 8)}...`, type: 'info' });
      
      updateTransaction(txId, { status: 'Waiting Confirmation' });

      // Wait for mining
      const receipt = await waitForTransactionReceipt(config, { hash });
      
      if (receipt.status === 'success') {
        updateTransaction(txId, { status: 'Confirmed' });
        addNotification({ title: 'Transaction Confirmed', message: `${type} successful!`, type: 'success' });
        
        updateTransaction(txId, { status: 'Indexer Sync' });
        await new Promise(res => setTimeout(res, 1000));
        
        updateTransaction(txId, { status: 'Backend Sync' });
        await new Promise(res => setTimeout(res, 500));
        
        updateTransaction(txId, { status: 'Inventory Refresh' });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['balance'] });
        
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Transaction reverted by EVM');
      }

    } catch (err: any) {
      const mappedError = errorMapper(err);
      updateTransaction(txId, { status: 'Failed', error: mappedError });
      addNotification({ title: 'Transaction Failed', message: mappedError, type: 'error' });
      
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  };

  return { execute };
}
