import { createSelector } from 'reselect';
import type { Hex } from 'viem';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import type { TransactionPayControllerState } from '@metamask/transaction-pay-controller';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
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
import { getTokensControllerAllTokens } from '../../shared/lib/selectors/assets-migration';
import { toAssetId } from '../../shared/lib/asset-utils';
import { mapKeyringTransaction } from '../../shared/lib/activity/adapters/keyring-transaction';
import { mapLocalTransaction } from '../../shared/lib/activity/adapters/local-transaction';
import { isProtectedByEnforcedSimulations } from '../pages/confirmations/utils/confirm';
import { enrichLocalMusdClaimActivity } from './activity/enrich-local-musd-claim';
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

const selectTransactionPayData = (state: MetaMaskReduxState) =>
  (state.metamask as unknown as TransactionPayControllerState)
    .transactionData ??
  (EMPTY_OBJECT as TransactionPayControllerState['transactionData']);

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

export const selectProtectedLocalTransactions = createSelector(
  selectLocalTransactions,
  (transactionGroups) => {
    const transactionsByHash = new Map<string, TransactionGroup>();

    for (const transactionGroup of transactionGroups) {
      const { primaryTransaction } = transactionGroup;
      const hash = primaryTransaction.hash?.toLowerCase();

      if (hash && isProtectedByEnforcedSimulations(primaryTransaction)) {
        transactionsByHash.set(hash, transactionGroup);
      }
    }

    return transactionsByHash;
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

function getBridgeActivityStatus(bridgeHistoryItem?: BridgeHistoryItem) {
  if (bridgeHistoryItem?.status.status === StatusTypes.FAILED) {
    return 'failed' as const;
  }

  if (bridgeHistoryItem?.status.status === StatusTypes.COMPLETE) {
    return 'success' as const;
  }

  if (
    bridgeHistoryItem?.status.status === StatusTypes.PENDING ||
    bridgeHistoryItem?.status.status === StatusTypes.SUBMITTED
  ) {
    return 'pending' as const;
  }

  return undefined;
}

export const selectLocalActivityItems = createSelector(
  selectLocalTransactions,
  selectBridgeHistory,
  selectTransactionPayData,
  getNetworkConfigurationsByChainId,
  getSelectedInternalAccount,
  getTokensControllerAllTokens,
  (
    transactionGroups,
    bridgeHistory,
    transactionPayData,
    networkConfigurationsByChainId,
    selectedAccount,
    allTokens,
  ) => {
    const selectedAddress = selectedAccount?.address?.toLowerCase();

    // Resolves symbol/decimals for an ERC-20 contract address from the user's
    // watched-tokens list (TokensController). The static mainnet token list
    // used inside the mapper only covers mainnet, so anything on Sepolia,
    // localhost, custom RPC etc. needs this fallback to render correctly.
    const resolveContractTokenMetadata = (
      chainId: string | undefined,
      contractAddress: string | undefined,
    ) => {
      if (!chainId || !contractAddress || !selectedAddress) {
        return undefined;
      }
      const userTokens = allTokens?.[chainId as Hex]?.[selectedAddress as Hex];
      const lowered = contractAddress.toLowerCase();
      const token = userTokens?.find(
        (t) => t.address.toLowerCase() === lowered,
      );
      return token
        ? { symbol: token.symbol, decimals: token.decimals }
        : undefined;
    };

    return transactionGroups.map((transactionGroup) => {
      const { type, chainId } = transactionGroup.initialTransaction;
      const nativeAssetSymbol =
        networkConfigurationsByChainId[chainId as Hex]?.nativeCurrency;
      const contractTokenMetadata = resolveContractTokenMetadata(
        chainId,
        transactionGroup.initialTransaction.txParams.to,
      );
      const sourceToken = (() => {
        if (type !== TransactionType.musdConversion) {
          return undefined;
        }

        const { metamaskPay } = transactionGroup.initialTransaction;
        const transactionPay =
          transactionPayData[transactionGroup.initialTransaction.id];
        const paymentToken = transactionPay?.paymentToken;
        const payTokenAddress =
          metamaskPay?.tokenAddress ?? paymentToken?.address;
        const payTokenChainId = metamaskPay?.chainId ?? paymentToken?.chainId;
        const sourceTokenMetadata = resolveContractTokenMetadata(
          payTokenChainId,
          payTokenAddress,
        );
        const sourceAmount =
          transactionPay?.totals?.sourceAmount.raw ??
          transactionPay?.sourceAmounts?.find((sourceAmountData) => {
            const targetTokenAddress =
              transactionGroup.initialTransaction.txParams.to;

            return (
              targetTokenAddress &&
              sourceAmountData.targetTokenAddress.toLowerCase() ===
                targetTokenAddress.toLowerCase()
            );
          })?.sourceAmountRaw ??
          transactionPay?.sourceAmounts?.[0]?.sourceAmountRaw;
        const sourceTokenCaipChainId = payTokenChainId
          ? toCaipChainId(
              KnownCaipNamespace.Eip155,
              Number.parseInt(payTokenChainId, 16).toString(),
            )
          : undefined;
        const sourceTokenAssetId =
          payTokenAddress && sourceTokenCaipChainId
            ? toAssetId(payTokenAddress, sourceTokenCaipChainId)
            : undefined;
        const sourceTokenSymbol =
          sourceTokenMetadata?.symbol ?? paymentToken?.symbol;
        const sourceTokenDecimals =
          sourceTokenMetadata?.decimals ?? paymentToken?.decimals;

        return sourceTokenMetadata || paymentToken || sourceTokenAssetId
          ? {
              direction: 'out' as const,
              ...(sourceAmount ? { amount: sourceAmount } : {}),
              ...(sourceTokenSymbol ? { symbol: sourceTokenSymbol } : {}),
              ...(sourceTokenDecimals === undefined
                ? {}
                : { decimals: sourceTokenDecimals }),
              ...(sourceTokenAssetId ? { assetId: sourceTokenAssetId } : {}),
            }
          : undefined;
      })();

      if (
        type === TransactionType.swap ||
        type === TransactionType.swapAndSend ||
        type === TransactionType.bridge
      ) {
        const bridgeHistoryItem = getBridgeHistoryItem(
          bridgeHistory,
          transactionGroup,
        );
        const activityStatus = getBridgeActivityStatus(bridgeHistoryItem);

        return enrichLocalMusdClaimActivity(
          mapLocalTransaction({
            ...transactionGroup,
            ...getSwapTokens(bridgeHistoryItem),
            ...(activityStatus ? { activityStatus } : {}),
            nativeAssetSymbol,
            contractTokenMetadata,
          }),
          transactionGroup,
        );
      }

      return enrichLocalMusdClaimActivity(
        mapLocalTransaction({
          ...transactionGroup,
          nativeAssetSymbol,
          contractTokenMetadata,
          ...(sourceToken ? { sourceToken } : {}),
        }),
        transactionGroup,
      );
    });
  },
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
