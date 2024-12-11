import type { Json } from '@metamask/utils';

export type Transaction = {
  id: string;
  account: string;
  chain: string;
  type: 'send' | 'receive';
  status: 'submitted' | 'unconfirmed' | 'confirmed' | 'failed';
  timestamp: number | null;
  from: Record<string, Json>[];
  to: Record<string, Json>[];
  fees: Record<string, Json>[];
  events: {
    status: 'submitted' | 'unconfirmed' | 'confirmed' | 'failed';
    timestamp: number | null;
  }[];
};

/**
 * State used by the MultichainTransactionsController to cache account transactions.
 */
export type MultichainTransactionsControllerState = {
  nonEvmTransactions: {
    [accountId: string]: {
      data: Transaction[];
      next: string | null;
      lastUpdated: number;
    };
  };
};
