import { create } from 'zustand';

export type TransactionStatus = 
  | 'Idle'
  | 'Pending' // Initiated by user, waiting for wallet signature
  | 'Wallet Confirmation' // Wallet opened, waiting for user to click confirm
  | 'Submitted' // Signed and sent to mempool
  | 'Waiting Confirmation' // Waiting for block confirmation
  | 'Confirmed' // Mined
  | 'Indexer Sync' // Waiting for backend to catch up
  | 'Backend Sync' // Backend updated
  | 'Inventory Refresh' // Final UI refresh
  | 'Failed';

export interface AppTransaction {
  id: string;
  type: string; // e.g., 'BuyItem', 'EquipItem'
  status: TransactionStatus;
  hash?: string;
  error?: string;
  timestamp: number;
  payload?: any;
}

interface TransactionState {
  transactions: AppTransaction[];
  addTransaction: (tx: Omit<AppTransaction, 'id' | 'timestamp' | 'status'>) => string;
  updateTransaction: (id: string, updates: Partial<AppTransaction>) => void;
  removeTransaction: (id: string) => void;
  getActiveTransactions: () => AppTransaction[];
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  addTransaction: (tx) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      transactions: [
        {
          ...tx,
          id,
          status: 'Pending',
          timestamp: Date.now(),
        },
        ...state.transactions,
      ]
    }));
    return id;
  },
  updateTransaction: (id, updates) => set((state) => ({
    transactions: state.transactions.map((tx) => 
      tx.id === id ? { ...tx, ...updates } : tx
    )
  })),
  removeTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter((tx) => tx.id !== id)
  })),
  getActiveTransactions: () => {
    const { transactions } = get();
    return transactions.filter(tx => tx.status !== 'Confirmed' && tx.status !== 'Failed' && tx.status !== 'Inventory Refresh');
  }
}));
