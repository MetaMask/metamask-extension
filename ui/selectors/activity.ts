import { createSelector } from 'reselect';
import type { Hex } from 'viem';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { ResultType } from '../../shared/lib/trust-signals';
import { EXCLUDED_TRANSACTION_TYPES } from '../helpers/constants/transactions';
import {
  collectTransactionTokenScanKeys,
  filterMaliciousTransactions,
  type MultichainTokenScanKey,
} from '../helpers/utils/token-scan';
import type { TransactionGroup } from '../../shared/lib/multichain/types';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../shared/constants/network';
import { NATIVE_TOKEN_ADDRESS } from '../../shared/constants/transaction';
import type { MetaMaskReduxState } from '../store/store';
import { getSelectedInternalAccount } from '../../shared/lib/selectors/accounts';
import { getNetworkConfigurationsByChainId } from '../../shared/lib/selectors/networks';
import { mapKeyringTransaction } from '../../shared/lib/activity/adapters/keyring-transaction';
import { mapLocalTransaction } from '../../shared/lib/activity/adapters/local-transaction';
import {
  groupAndSortTransactionsByNonce,
  smartTransactionsListSelector,
} from './transactions';
import { selectCurrentAccountNonEvmTransactions } from './multichain-transactions';
import {
  selectOrderedTransactions,
  selectRequiredTransactionHashes,
} from './transactionController';
import type { TokenScanCacheResults } from './token-scan';
import {
  getMarketData,
  getCurrencyRates,
  getTokenScanCache,
} from './selectors';
import { EMPTY_ARRAY, EMPTY_OBJECT } from './shared';

const selectBridgeHistory = (state: MetaMaskReduxState) =>
  (state.metamask.txHistory ?? EMPTY_OBJECT) as Record<
    string,
    BridgeHistoryItem
  >;

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

export const selectLocalTransactions = createSelector(
  selectOrderedTransactions,
  getSelectedInternalAccount,
  smartTransactionsListSelector,
  selectRequiredTransactionHashes,
  (
    transactions,
    selectedAccount,
    smartTransactions,
    internalTxHashes,
  ): TransactionGroup[] => {
    if (!selectedAccount?.address) {
      return EMPTY_ARRAY as unknown as TransactionGroup[];
    }

    const selectedAddress = selectedAccount.address.toLowerCase();

    const filtered = (transactions ?? []).filter((tx) => {
      if (!isFromSelectedAccount(tx, selectedAddress)) {
        return false;
      }

      if (tx.hash && internalTxHashes.has(tx.hash.toLowerCase())) {
        return false;
      }
      return true;
    });

    const combined = [...filtered, ...smartTransactions];

    if (!combined.length) {
      return EMPTY_ARRAY as unknown as TransactionGroup[];
    }

    return groupAndSortTransactionsByNonce(combined) as TransactionGroup[];
  },
);

export const selectNonEvmTransactionsForActivity = createSelector(
  [
    selectCurrentAccountNonEvmTransactions,
    (state: MetaMaskReduxState) =>
      (getTokenScanCache(state) as TokenScanCacheResults | undefined) ??
      (EMPTY_OBJECT as TokenScanCacheResults),
  ],
  (nonEvmTransactions, tokenScanCache) => {
    const tokenScanKeys: MultichainTokenScanKey[] = [
      ...new Set(
        nonEvmTransactions.flatMap((transaction) =>
          collectTransactionTokenScanKeys(transaction),
        ),
      ),
    ];

    const maliciousTokenKeys = new Set<MultichainTokenScanKey>(
      tokenScanKeys.filter(
        (key) =>
          tokenScanCache[key]?.data?.result_type === ResultType.Malicious,
      ),
    );

    if (maliciousTokenKeys.size === 0) {
      return nonEvmTransactions;
    }

    return filterMaliciousTransactions(nonEvmTransactions, maliciousTokenKeys);
  },
);

export const selectNonEvmActivityItems = createSelector(
  selectNonEvmTransactionsForActivity,
  (transactions) =>
    transactions.map((transaction) => mapKeyringTransaction({ transaction })),
);

function normalizeBridgeHistoryLookupKey(value: unknown) {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).toLowerCase()
    : undefined;
}

function getBridgeHistoryItem(
  bridgeHistory: Record<string, BridgeHistoryItem>,
  transactionGroup: TransactionGroup,
) {
  const { initialTransaction, primaryTransaction } = transactionGroup;
  const lookupValues = [
    initialTransaction.id,
    primaryTransaction.id,
    initialTransaction.hash,
    primaryTransaction.hash,
    (initialTransaction as Record<string, unknown>).actionId,
    (primaryTransaction as Record<string, unknown>).actionId,
  ].flatMap((value) => {
    const normalizedValue = normalizeBridgeHistoryLookupKey(value);
    return normalizedValue ? [normalizedValue] : [];
  });
  const lookupValueSet = new Set(lookupValues);

  const directEntry = lookupValues
    .map((value) => bridgeHistory[value])
    .find(Boolean);

  return (
    directEntry ??
    Object.values(bridgeHistory).find((item) => {
      const itemLookupValues = [
        item.txMetaId,
        item.actionId,
        item.originalTransactionId,
        item.approvalTxId,
        item.status.srcChain?.txHash,
        item.status.destChain?.txHash,
      ].flatMap((value) => {
        const normalizedValue = normalizeBridgeHistoryLookupKey(value);
        return normalizedValue ? [normalizedValue] : [];
      });

      return itemLookupValues.some((value) => lookupValueSet.has(value));
    })
  );
}

function getSwapTokens(bridgeHistoryItem?: BridgeHistoryItem) {
  if (bridgeHistoryItem === undefined) {
    return undefined;
  }

  const { quote, status } = bridgeHistoryItem;

  return {
    sourceToken: {
      amount: quote.srcTokenAmount,
      assetId: quote.srcAsset.assetId,
      decimals: quote.srcAsset.decimals,
      direction: 'out' as const,
      symbol: quote.srcAsset.symbol,
    },
    destinationToken: {
      amount: status.destChain?.amount ?? quote.destTokenAmount,
      assetId: quote.destAsset.assetId,
      decimals: quote.destAsset.decimals,
      direction: 'in' as const,
      symbol: quote.destAsset.symbol,
    },
  };
}

export const selectLocalActivityItems = createSelector(
  selectLocalTransactions,
  selectBridgeHistory,
  getNetworkConfigurationsByChainId,
  (transactionGroups, bridgeHistory, networkConfigurationsByChainId) =>
    transactionGroups.map((transactionGroup) => {
      const { type, chainId } = transactionGroup.initialTransaction;
      const nativeAssetSymbol =
        networkConfigurationsByChainId[chainId as Hex]?.nativeCurrency;

      if (
        type === TransactionType.swap ||
        type === TransactionType.swapAndSend
      ) {
        return mapLocalTransaction({
          ...transactionGroup,
          ...getSwapTokens(
            getBridgeHistoryItem(bridgeHistory, transactionGroup),
          ),
          nativeAssetSymbol,
        });
      }

      return mapLocalTransaction({ ...transactionGroup, nativeAssetSymbol });
    }),
);

export const selectMarketRates = createSelector(
  [getMarketData, getCurrencyRates],
  (marketData, currencyRates) => {
    const rates: Record<number, Record<string, number>> = {};

    // Build lookup table: [chainId][tokenAddress] -> fiat rate (in user's current currency)
    for (const [hexChainId, chainData] of Object.entries(
      marketData as Record<string, Record<string, { price: number }>>,
    )) {
      const chainId = parseInt(hexChainId, 16);
      rates[chainId] = {};

      const nativeSymbol =
        CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
          hexChainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
        ];
      const conversionRate = currencyRates?.[nativeSymbol]?.conversionRate;

      for (const [tokenAddress, tokenData] of Object.entries(chainData)) {
        if (tokenData.price && conversionRate) {
          rates[chainId][tokenAddress.toLowerCase()] =
            tokenData.price * conversionRate;
        }
      }

      if (conversionRate) {
        rates[chainId][NATIVE_TOKEN_ADDRESS] = conversionRate;
      }
    }

    return rates;
  },
);
