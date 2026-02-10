import { createSelector } from 'reselect';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Transaction } from '@metamask/keyring-api';
import type { Hex } from 'viem';
import { MULTICHAIN_NETWORK_DECIMAL_PLACES } from '@metamask/multichain-network-controller';
import type { MetaMaskReduxState } from '../store/store';
import {
  PENDING_STATUS_HASH,
  EXCLUDED_TRANSACTION_TYPES,
} from '../helpers/constants/transactions';
import { TransactionGroupCategory } from '../../shared/constants/transaction';
import type {
  TransactionGroup,
  TransactionViewModel,
} from '../../shared/acme-controller/types';
import {
  getTransactions,
  groupAndSortTransactionsByNonce,
} from './transactions';
import { getMarketData, getCurrencyRates } from './selectors';
import {
  getSelectedInternalAccount,
  getInternalAccounts,
  isNonEvmAccount,
} from './accounts';
import { getSelectedAccountGroupMultichainTransactions } from './multichain-transactions';
import { EMPTY_ARRAY } from './shared';

// Time window for "recent" transactions (5 minutes)
const RECENT_TRANSACTION_TIME_WINDOW_MS = 5 * 60 * 1000;

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

export const getPendingTransactionGroups = createSelector(
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
      // Ported from pendingStatusSortedTransactionsSelector
      return tx.status in PENDING_STATUS_HASH;
    });

    if (!filtered.length) {
      return EMPTY_ARRAY as unknown as TransactionGroup[];
    }
    return groupAndSortTransactionsByNonce(filtered) as TransactionGroup[];
  },
);

export const getRecentTransactionGroups = createSelector(
  getTransactions,
  getSelectedInternalAccount,
  (transactions, selectedAccount): TransactionGroup[] => {
    if (!transactions?.length || !selectedAccount?.address) {
      return EMPTY_ARRAY as unknown as TransactionGroup[];
    }

    const now = Date.now();
    const cutoffTime = now - RECENT_TRANSACTION_TIME_WINDOW_MS;
    const selectedAddress = selectedAccount.address.toLowerCase();

    const filtered = transactions.filter((tx) => {
      if (!isFromSelectedAccount(tx, selectedAddress)) {
        return false;
      }
      // Ported from pendingStatusSortedTransactionsSelector
      if (tx.status in PENDING_STATUS_HASH) {
        return false;
      }
      // Include if recently submitted (use submittedTime, fallback to time)
      const txTime = tx.submittedTime || tx.time || 0;
      return txTime >= cutoffTime;
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

export const getNonEvmChainIds = (
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

// NOTE
function parseAmountToBigInt(amountStr: string, decimals: number): bigint {
  const [integerPart = '0', fractionalPart = ''] = amountStr.split('.');
  const paddedFraction = fractionalPart
    .padEnd(decimals, '0')
    .slice(0, decimals);
  return BigInt(integerPart + paddedFraction);
}

function normalizeNonEvmTransaction(tx: Transaction): TransactionViewModel {
  const timeMs = (tx.timestamp ?? 0) * 1000;

  // Get decimals for this chain
  const decimals =
    MULTICHAIN_NETWORK_DECIMAL_PLACES[
      tx.chain as keyof typeof MULTICHAIN_NETWORK_DECIMAL_PLACES
    ] ?? 8;

  // Extract first from/to movement for addresses and amounts
  const fromMovement = tx.from?.[0];
  const toMovement = tx.to?.[0];

  // Pick relevant movement based on type (receive = to, send = from)
  const isReceive = tx.type === 'receive';
  const primaryMovement = isReceive ? toMovement : fromMovement;

  // Extract amount from the asset
  const asset = primaryMovement?.asset;
  const amountStr =
    asset && 'amount' in asset ? String(asset.amount) : undefined;
  const symbol = asset && 'unit' in asset ? String(asset.unit) : undefined;

  // Build amounts object (same structure as EVM)
  const amountData =
    amountStr && symbol
      ? {
          amount: parseAmountToBigInt(amountStr, decimals),
          decimal: decimals,
          symbol,
        }
      : undefined;

  // Determine amounts placement based on transaction type
  let amounts: TransactionViewModel['amounts'];
  if (amountData) {
    amounts = isReceive ? { to: amountData } : { from: amountData };
  }

  // Map non-EVM type to category
  const categoryMap: Record<string, TransactionViewModel['category']> = {
    send: TransactionGroupCategory.send,
    receive: TransactionGroupCategory.receive,
    swap: TransactionGroupCategory.swap,
  };
  const category = categoryMap[tx.type] ?? TransactionGroupCategory.interaction;

  return {
    id: tx.id,
    hash: '',
    chainId: tx.chain as Hex,
    networkClientId: tx.chain,
    status: tx.status as TransactionViewModel['status'],
    time: timeMs,
    txParams: {
      from: fromMovement?.address ?? '',
      to: toMovement?.address ?? '',
    },
    readable: '',
    transactionType: tx.type,
    category,
    amounts,
  } as TransactionViewModel;
}

export const getNonEvmTransactions = (
  state: MetaMaskReduxState,
): TransactionViewModel[] => {
  const nonEvmChainIds = getNonEvmChainIds(state.metamask.enabledNetworkMap);
  const { transactions } = getSelectedAccountGroupMultichainTransactions(
    state,
    nonEvmChainIds,
  );
  return transactions.map(normalizeNonEvmTransaction);
};

export const getFirstEvmAddress = createSelector(
  getInternalAccounts,
  (accounts): string | undefined => {
    const evmAccount = accounts.find((account) => !isNonEvmAccount(account));
    return evmAccount?.address;
  },
);
