import { isEqualCaseInsensitive } from '@metamask/controller-utils';
import type { InfiniteData } from '@tanstack/react-query';
import type { V4MultiAccountTransactionsResponse } from './types';
import { TransactionGroupCategory } from '../constants/transaction';

function mapApiTransactionTypeToCategory(
  apiTransactionType: string | null | undefined,
): TransactionGroupCategory {
  switch (apiTransactionType) {
    case 'ERC_20_APPROVE':
    case 'ERC_721_APPROVE':
    case 'ERC_1155_APPROVE':
      return TransactionGroupCategory.approval;
    case 'ERC_20_TRANSFER':
    case 'ERC_721_TRANSFER':
    case 'ERC_1155_TRANSFER':
      return TransactionGroupCategory.send;
    case 'INCOMING':
      return TransactionGroupCategory.receive;
    case 'METAMASK_V1_EXCHANGE':
      return TransactionGroupCategory.swap;
    case 'METAMASK_BRIDGE_V2_BRIDGE_OUT':
    case 'METAMASK_BRIDGE_V2_BRIDGE_IN':
      return TransactionGroupCategory.bridge;
    case 'CONTRACT_INTERACTION':
    case 'DEPLOY_CONTRACT':
    default:
      return TransactionGroupCategory.interaction;
  }
}

export function assignCategories(
  data: InfiniteData<V4MultiAccountTransactionsResponse>,
) {
  return {
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map((tx) => ({
        ...tx,
        category: mapApiTransactionTypeToCategory(tx.transactionType),
      })),
    })),
    pageParams: data.pageParams,
  };
}

export function filterTransactions(
  data: InfiniteData<V4MultiAccountTransactionsResponse>,
  accountAddress: string,
) {
  const result = {
    pages: data.pages.map((page) => {
      const filteredData = page.data.filter((tx) => {
        // if (tx.transactionType === 'SPAM_TOKEN_TRANSFER') {
        //   return false;
        // }

        // Rule: Show user-initiated transactions (from === account)
        // Ported from transactions.js - selectedAddressTxListSelector
        const userInitiated =
          accountAddress && isEqualCaseInsensitive(tx.from, accountAddress);
        if (userInitiated) {
          return true;
        }

        // Rule: Show incoming transactions TO this account only
        // Ported from /transactions.js - incomingTxListSelector
        if (tx.transactionType === 'INCOMING') {
          const isRecipient =
            accountAddress && isEqualCaseInsensitive(tx.to, accountAddress);
          return isRecipient;
        }

        return false;
      });

      return {
        ...page,
        data: filteredData,
      };
    }),
    pageParams: data.pageParams,
  };

  return result;
}
