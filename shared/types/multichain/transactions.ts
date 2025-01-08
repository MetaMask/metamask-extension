// TODO: Use types from core once this controller has been moved there
import { Transaction } from '@metamask/keyring-api';

/**
 * State used by the MultichainTransactionsController to cache account transactions.
 */
export type MultichainTransactionsControllerState = {
  nonEvmTransactions: {
    [accountId: string]: {
      transactions: Transaction[];
      next: string | null;
      lastUpdated: number;
    };
  };
};
