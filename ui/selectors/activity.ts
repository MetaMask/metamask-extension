import { createSelector } from 'reselect';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { isEvmAccountType, type Transaction } from '@metamask/keyring-api';
import type { MetaMaskReduxState } from '../store/store';
import {
  PENDING_STATUS_HASH,
  EXCLUDED_TRANSACTION_TYPES,
} from '../helpers/constants/transactions';
import type { TransactionGroup } from '../../shared/acme-controller/types';
import {
  getTransactions,
  groupAndSortTransactionsByNonce,
} from './transactions';
import { getMarketData, getCurrencyRates } from './selectors';
import { getSelectedInternalAccount } from './accounts';
import { getSelectedAccountGroupMultichainTransactions } from './multichain-transactions';
import { EMPTY_ARRAY } from './shared';

function isFromSelectedAccount(tx: TransactionMeta, selectedAddress: string) {
  // Ported from selectedAddressTxListSelector
  if (tx.txParams?.from?.toLowerCase() !== selectedAddress) {
    return false;
  }
  // Ported from txStatusSortedTransactionsSelector
  if (tx.type && EXCLUDED_TRANSACTION_TYPES.has(tx.type)) {
    return false;
  }
  return true;
}

// Returns transaction groups from local Redux state that may not be in the API yet.
// Includes:
// - Pending transactions (not on-chain yet)
// - Locally submitted transactions (have actionId)
export const getLocalTransactionGroups = createSelector(
  getTransactions,
  getSelectedInternalAccount,
  (transactions, selectedAccount): TransactionGroup[] => {
    if (!transactions?.length || !selectedAccount?.address) {
      return EMPTY_ARRAY as unknown as TransactionGroup[];
    }

    const selectedAddress = selectedAccount.address.toLowerCase();

    const filtered = transactions.filter((tx) => {
      if (!isFromSelectedAccount(tx, selectedAddress)) {
        return false;
      }
      // Include pending transactions
      // or locally submitted transactions (have actionId or origin=metamask)
      const isPending = tx.status in PENDING_STATUS_HASH;
      const hasActionId = tx.actionId !== undefined;
      const isLocalOrigin = tx.origin === 'metamask';
      return isPending || hasActionId || isLocalOrigin;
    });

    if (!filtered.length) {
      return EMPTY_ARRAY as unknown as TransactionGroup[];
    }

    return groupAndSortTransactionsByNonce(filtered) as TransactionGroup[];
  },
);

export const getMarketRates = createSelector(
  [getMarketData, getCurrencyRates],
  (marketData, currencyRates) => {
    const rates: Record<number, Record<string, number>> = {};

    // Build lookup table: [chainId][tokenAddress] -> fiat rate (in user's current currency)
    for (const [hexChainId, chainData] of Object.entries(
      marketData as Record<string, Record<string, { price: number }>>,
    )) {
      const chainId = parseInt(hexChainId, 16);
      rates[chainId] = {};

      for (const [tokenAddress, tokenData] of Object.entries(chainData)) {
        // Get native currency conversion rate (ETH -> user's current currency)
        const conversionRate = currencyRates?.ETH?.conversionRate;

        if (tokenData.price && conversionRate) {
          // Token price is in native currency, multiply by conversion rate to get fiat
          rates[chainId][tokenAddress.toLowerCase()] =
            tokenData.price * conversionRate;
        }
      }
    }

    return rates;
  },
);

const getNonEvmChainIds = (
  enabledNetworkMap: MetaMaskReduxState['metamask']['enabledNetworkMap'],
) => {
  return Object.entries(enabledNetworkMap)
    .filter(([namespace]) => namespace !== 'eip155')
    .flatMap(([, chains]) =>
      Object.entries(chains)
        .filter(([, enabled]) => enabled)
        .map(([id]) => id),
    );
};

export const getNonEvmTransactions = (
  state: MetaMaskReduxState,
): Transaction[] => {
  const nonEvmChainIds = getNonEvmChainIds(state.metamask.enabledNetworkMap);
  const { transactions } = getSelectedAccountGroupMultichainTransactions(
    state,
    nonEvmChainIds,
  );
  return transactions;
};

export const getFirstEvmAddress = createSelector(
  getSelectedInternalAccount,
  (account): string | undefined => {
    if (account && isEvmAccountType(account.type)) {
      return account.address;
    }
    return undefined;
  },
);
