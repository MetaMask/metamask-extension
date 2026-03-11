/**
 * Activity list overrides for mUSD transactions.
 *
 * The accounts API may misclassify some mUSD transactions (e.g. Merkl claims)
 * as generic contract interactions. This module applies local overrides by
 * setting transactionCategory so downstream activity-v2 code can display them
 * correctly without needing mUSD-specific logic.
 */

import type { InfiniteData } from '@tanstack/react-query';
import type {
  NormalizedV4MultiAccountTransactionsResponse,
  TransactionViewModel,
} from '../../../../shared/lib/multichain/types';
import {
  MERKL_DISTRIBUTOR_ADDRESS,
  MERKL_CLAIM_CHAIN_ID,
} from './constants';

/** Category injected when API misclassifies mUSD Merkl claim as contract interaction */
export const MUSD_CLAIM_CATEGORY = 'MUSD_CLAIM' as const;

function isMusdClaimTransaction(tx: TransactionViewModel): boolean {
  const to = tx.txParams?.to?.toLowerCase();
  const chainId = tx.chainId?.toString().toLowerCase();
  return (
    to === MERKL_DISTRIBUTOR_ADDRESS.toLowerCase() &&
    (chainId === MERKL_CLAIM_CHAIN_ID.toLowerCase() || chainId === '0xe708')
  );
}

/**
 * Applies transactionCategory overrides for mUSD transactions that the API
 * misclassifies. Call after selectTransactions in the query select chain.
 */
export function applyActivityTransactionOverrides(
  data: InfiniteData<NormalizedV4MultiAccountTransactionsResponse>,
): InfiniteData<NormalizedV4MultiAccountTransactionsResponse> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map((tx) => {
        if (isMusdClaimTransaction(tx)) {
          return { ...tx, transactionCategory: MUSD_CLAIM_CATEGORY };
        }
        return tx;
      }),
    })),
  };
}
