import type { NetworkState } from '@metamask/network-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  isSolanaChainId,
  isBitcoinChainId,
  isNativeAddress,
  formatChainIdToCaip,
  BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
  getNativeAssetForChainId,
  type BridgeAppState as BridgeAppStateFromController,
  selectBridgeQuotes,
  selectIsQuoteExpired,
  selectBridgeFeatureFlags,
  selectMinimumBalanceForRentExemptionInSOL,
  isValidQuoteRequest,
  type QuoteWarning,
  isCrossChain,
  RequestStatus,
} from '@metamask/bridge-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import type { AccountsControllerState } from '@metamask/accounts-controller';
import { createSelector } from 'reselect';
import type { GasFeeState } from '@metamask/gas-fee-controller';
import { BigNumber } from 'bignumber.js';
import { calcTokenAmount } from '@metamask/notification-services-controller/push-services';
import { parseCaipChainId, type CaipChainId, type Hex } from '@metamask/utils';
import type {
  AccountTrackerControllerState,
  CurrencyRateState,
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
  MultichainBalancesControllerState,
  RatesControllerState,
  TokenBalancesControllerState,
  TokenListState,
  TokenRatesControllerState,
  TokensControllerState,
} from '@metamask/assets-controllers';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import type { MultichainNetworkControllerState } from '@metamask/multichain-network-controller';
import type { NetworkEnablementControllerState } from '@metamask/network-enablement-controller';
import {
  type AccountGroupObject,
  type AccountTreeControllerState,
} from '@metamask/account-tree-controller';
import { getHardwareWalletType } from '../../selectors/selectors';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { CHAIN_IDS, FEATURED_RPCS } from '../../../shared/constants/network';
import {
  getMultichainBalances,
  getMultichainCoinRates,
  getMultichainNetworkConfigurationsByChainId,
  getMultichainProviderConfig,
} from '../../selectors/multichain';
import { getAssetsRates } from '../../selectors/assets';
import {
  HardwareKeyringNames,
  HardwareKeyringType,
} from '../../../shared/constants/hardware-wallets';
import { Numeric } from '../../../shared/modules/Numeric';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import {
  getIsSmartTransaction,
  type SmartTransactionsMetaMaskState,
} from '../../../shared/modules/selectors';
import { calcTokenValue } from '../../../shared/lib/swaps-utils';
import { safeAmountForCalc } from '../../pages/bridge/utils/quote';
import {
  getInternalAccountsByScope,
  getSelectedInternalAccount,
} from '../../selectors/accounts';
import { getRemoteFeatureFlags } from '../../selectors/remote-feature-flags';
import {
  getAllAccountGroups,
  getInternalAccountBySelectedAccountGroupAndCaip,
  getWalletsWithAccounts,
} from '../../selectors/multichain-accounts/account-tree';
import { getAllEnabledNetworksForAllNamespaces } from '../../selectors/multichain/networks';
import { type MultichainAccountsState } from '../../selectors/multichain-accounts/account-tree.types';
import {
  exchangeRateFromMarketData,
  tokenPriceInNativeAsset,
  getDefaultToToken,
  toBridgeToken,
  isNonEvmChain,
  isTronChainId,
  getMaybeHexChainId,
} from './utils';
import type { BridgeNetwork, BridgeState } from './types';

export type BridgeAppState = {
  metamask: BridgeAppStateFromController &
    SmartTransactionsMetaMaskState['metamask'] &
    GasFeeState &
    NetworkState &
    AccountsControllerState &
    AccountTreeControllerState &
    AccountTrackerControllerState &
    TokenBalancesControllerState &
    NetworkEnablementControllerState &
    TokensControllerState &
    MultichainAccountsState['metamask'] &
    MultichainAssetsRatesControllerState &
    TokenRatesControllerState &
    RatesControllerState &
    MultichainBalancesControllerState &
    MultichainTransactionsControllerState &
    MultichainAssetsControllerState &
    MultichainNetworkControllerState &
    TokenListState &
    RemoteFeatureFlagControllerState &
    CurrencyRateState & {
      useExternalServices: boolean;
    };
  bridge: BridgeState;
};

// Only includes networks user has added
const getAllBridgeableNetworks = createDeepEqualSelector(
  [getMultichainNetworkConfigurationsByChainId],
  (
    multichainNetworkConfigurationsByChainId,
  ): Record<CaipChainId, BridgeNetwork> => {
    // Build a record of networks keyed by ALLOWED_BRIDGE_CHAIN_IDS
    return ALLOWED_BRIDGE_CHAIN_IDS.reduce(
      (
        networkRecord: Record<Hex | CaipChainId, BridgeNetwork>,
        chainId: Hex | CaipChainId,
      ) => {
        const caipChainId = formatChainIdToCaip(chainId);
        if (multichainNetworkConfigurationsByChainId[chainId]) {
          networkRecord[caipChainId] = {
            ...multichainNetworkConfigurationsByChainId[chainId],
            chainId: caipChainId,
          };
        }
        return networkRecord;
      },
      {} as Record<CaipChainId, BridgeNetwork>,
    );
  },
);

const getBridgeFeatureFlags = createDeepEqualSelector(
  [(state: BridgeAppState) => getRemoteFeatureFlags(state).bridgeConfig],
  (bridgeConfig) => {
    const validatedFlags = selectBridgeFeatureFlags({
      remoteFeatureFlags: { bridgeConfig },
    });
    return {
      ...validatedFlags,
      // @ts-expect-error - chainRanking is not typed yet. remove this after updating controller types
      chainRanking: bridgeConfig?.chainRanking as {
        chainId: CaipChainId;
        name: string;
      }[],
    };
  },
);

export const getPriceImpactThresholds = createDeepEqualSelector(
  [
    (state: BridgeAppState) =>
      getBridgeFeatureFlags(state).priceImpactThreshold,
  ],
  (priceImpactThreshold) => priceImpactThreshold,
);

const getChainRanking = (state: BridgeAppState) => {
  return getBridgeFeatureFlags(state)?.chainRanking;
};

export const getFromChains = createDeepEqualSelector(
  [
    getAllBridgeableNetworks,
    getChainRanking,
    (state: BridgeAppState) =>
      Boolean(
        getInternalAccountBySelectedAccountGroupAndCaip(
          state,
          MultichainNetworks.SOLANA,
        ),
      ),
    (state: BridgeAppState) =>
      Boolean(
        getInternalAccountBySelectedAccountGroupAndCaip(
          state,
          MultichainNetworks.BITCOIN,
        ),
      ),
    (state: BridgeAppState) =>
      Boolean(
        getInternalAccountBySelectedAccountGroupAndCaip(
          state,
          MultichainNetworks.TRON,
        ),
      ),
  ],
  (
    allBridgeableNetworks,
    chainRanking,
    hasSolanaAccount,
    hasBitcoinAccount,
    hasTronAccount,
  ) => {
    const filteredNetworks: BridgeNetwork[] = [];
    chainRanking.forEach(({ chainId, name }) => {
      const shouldAddSolana = isSolanaChainId(chainId)
        ? hasSolanaAccount
        : true;
      const shouldAddBitcoin = isBitcoinChainId(chainId)
        ? hasBitcoinAccount
        : true;
      const shouldAddTron = isTronChainId(chainId) ? hasTronAccount : true;
      const matchedNetwork = allBridgeableNetworks[chainId];
      // If all conditions are met, add the network to the list
      if (
        [
          shouldAddSolana,
          shouldAddBitcoin,
          shouldAddTron,
          matchedNetwork,
        ].every(Boolean)
      ) {
        filteredNetworks.push({
          chainId,
          name,
        });
      }
    });
    return filteredNetworks;
  },
);

/**
 * This matches the network filter in the activity and asset lists
 */
export const getLastSelectedChainId = createSelector(
  [getAllEnabledNetworksForAllNamespaces, getFromChains],
  (allEnabledNetworksForAllNamespaces, fromChains) => {
    // If there is no network filter, return top chain from LD
    if (allEnabledNetworksForAllNamespaces.length > 1) {
      return fromChains[0]?.chainId ?? CHAIN_IDS.MAINNET;
    }
    // Find the matching bridge fromChain for the selected network filter
    return fromChains.find(
      ({ chainId: fromChainId }) =>
        fromChainId ===
        formatChainIdToCaip(allEnabledNetworksForAllNamespaces[0]),
    )?.chainId;
  },
);

// This returns undefined if the selected chain is not supported by swap/bridge (i.e, testnets)
// TODO when GNS is removed, use the getLastSelectedChain instead of providerChainId
export const getFromToken = createSelector(
  [
    (state: BridgeAppState) => state.bridge?.fromToken,
    getFromChains,
    getMultichainProviderConfig,
  ],
  (fromToken, fromChains, providerConfig) => {
    // When the page loads the global network always matches the network filter
    // Because useBridging checks whether the lastSelectedNetwork matches the provider config
    // Then useBridgeQueryParams sets the global network to lastSelectedNetwork as needed
    const fromChain = fromChains.find(
      ({ chainId }) => !isCrossChain(chainId, providerConfig?.chainId),
    );
    // If selected network is not supported by swap/bridge, return ETH
    if (!fromChain) {
      return toBridgeToken(getNativeAssetForChainId(fromChains[0].chainId));
    }
    const fromChainId = fromChain.chainId;
    if (fromToken) {
      return fromToken;
    }
    const { iconUrl, ...nativeAsset } = getNativeAssetForChainId(fromChainId);
    return toBridgeToken(nativeAsset);
  },
);

export const getToChains = createDeepEqualSelector(
  [getAllBridgeableNetworks, getChainRanking],
  (allBridgeableNetworks, chainRanking) => {
    const allChains: Record<CaipChainId, BridgeNetwork> = {
      ...allBridgeableNetworks,
      ...Object.fromEntries(
        FEATURED_RPCS.map((rpc) => {
          const caipChainId = formatChainIdToCaip(rpc.chainId);
          return [
            caipChainId,
            {
              chainId: caipChainId,
            },
          ];
        }),
      ),
    };
    const filteredChains: BridgeNetwork[] = [];
    chainRanking.forEach(({ chainId, name }) => {
      if (allChains[chainId]) {
        filteredChains.push({ ...allChains[chainId], name });
      }
    });
    return filteredChains;
  },
);

export const getTopAssetsFromFeatureFlags = (
  state: BridgeAppState,
  chainId?: CaipChainId | Hex,
) => {
  if (!chainId) {
    return undefined;
  }
  const bridgeFeatureFlags = getBridgeFeatureFlags(state);
  return bridgeFeatureFlags?.chains[formatChainIdToCaip(chainId)]?.topAssets;
};

const getFromChainId = (state: BridgeAppState) => getFromToken(state).chainId;
// For compatibility with old code
export const getFromChain = createSelector(
  [getFromChainId, getAllBridgeableNetworks],
  (fromChainId, allBridgeableNetworks) => allBridgeableNetworks[fromChainId],
);

export const getBip44DefaultPairsConfig = (state: BridgeAppState) =>
  getBridgeFeatureFlags(state).bip44DefaultPairs;

// Returns a mapping from src assetId to default dest assetId
export const getBip44DefaultPairs = createSelector(
  [getBip44DefaultPairsConfig],
  (bip44DefaultPairsConfig) => {
    if (!bip44DefaultPairsConfig) {
      return {};
    }
    return Object.fromEntries(
      Object.values(bip44DefaultPairsConfig)
        .filter((s) => s !== undefined)
        .flatMap(({ other, standard }) =>
          Object.entries({ ...other, ...standard }),
        ),
    );
  },
);

export const getToToken = createSelector(
  [getFromToken, (state: BridgeAppState) => state.bridge.toToken],
  (fromToken, toToken) => {
    // If the user has selected a token, return it
    if (toToken) {
      return toToken;
    }
    return getDefaultToToken(fromToken.chainId, fromToken.assetId);
  },
);

export const getToChain = createSelector(
  [
    (state: BridgeAppState) => getToToken(state)?.chainId,
    getToChains,
    getFromChain,
  ],
  (toChainId, toChains, fromChain) =>
    toChains.find(({ chainId }) => !isCrossChain(chainId, toChainId)) ??
    fromChain,
);

export const getFromAmount = (state: BridgeAppState): string | null =>
  state.bridge.fromTokenInputValue;

export const getAccountGroupNameByInternalAccount = createSelector(
  [getAllAccountGroups, (_, account: InternalAccount | null) => account],
  (accountGroups: AccountGroupObject[], account) => {
    if (!account?.id) {
      return null;
    }
    return (
      accountGroups.find(({ accounts }) => accounts.includes(account.id))
        ?.metadata.name ?? account?.metadata?.name
    );
  },
);

export const getFromAccount = createSelector(
  [
    (state: BridgeAppState) => getFromChain(state)?.chainId,
    (state: BridgeAppState) => state,
    getSelectedInternalAccount,
  ],
  (fromChainId, state, selectedInternalAccount) => {
    return (
      getInternalAccountBySelectedAccountGroupAndCaip(state, fromChainId) ??
      selectedInternalAccount
    );
  },
);

export const getToAccounts = createSelector(
  [
    (state: BridgeAppState) => getToChain(state)?.chainId,
    getWalletsWithAccounts,
    (state: BridgeAppState) => state,
  ],
  (toChainId, accountsByWallet, state) => {
    if (!toChainId) {
      return [];
    }
    const internalAccounts = getInternalAccountsByScope(state, toChainId);

    return internalAccounts.map((account) => ({
      ...account,
      isExternal: false,
      walletName:
        account.options.entropy?.type === 'mnemonic'
          ? accountsByWallet[`entropy:${account.options.entropy.id}`]?.metadata
              .name
          : accountsByWallet[`keyring:${account.metadata.keyring.type}`]
              ?.metadata.name,
      displayName:
        getAccountGroupNameByInternalAccount(state, account) ??
        account.metadata.name ??
        account.address,
    }));
  },
);

const _getFromNativeBalance = createSelector(
  [
    getFromChain,
    (state: BridgeAppState) => state.bridge.fromNativeBalance,
    getMultichainBalances,
    (state: BridgeAppState) => getFromAccount(state)?.id,
  ],
  (fromChain, fromNativeBalance, nonEvmBalancesByAccountId, id) => {
    if (!fromChain || !id) {
      return null;
    }

    const { chainId } = fromChain;
    const { decimals, assetId } = getNativeAssetForChainId(chainId);

    // Use the balance provided by the multichain balances controller for non-EVM chains
    if (isNonEvmChain(chainId)) {
      return nonEvmBalancesByAccountId?.[id]?.[assetId]?.amount ?? null;
    }

    return fromNativeBalance
      ? Numeric.from(fromNativeBalance, 10).shiftedBy(decimals).toString()
      : null;
  },
);

export const getFromTokenBalance = createSelector(
  [
    getFromToken,
    getFromChain,
    (state: BridgeAppState) => state.bridge.fromTokenBalance,
    getMultichainBalances,
    getFromAccount,
  ],
  (
    fromToken,
    fromChain,
    fromTokenBalance,
    nonEvmBalancesByAccountId,
    fromAccount,
  ) => {
    if (!fromToken || !fromChain || !fromAccount) {
      return null;
    }
    const { id } = fromAccount;
    const { chainId, decimals, assetId } = fromToken;

    // Use the balance provided by the multichain balances controller for non-EVM chains
    if (isNonEvmChain(chainId)) {
      return (
        nonEvmBalancesByAccountId?.[id]?.[assetId]?.amount ??
        fromToken.balance ??
        null
      );
    }

    return fromTokenBalance
      ? Numeric.from(fromTokenBalance, 10).shiftedBy(decimals).toString()
      : null;
  },
);

export const getSlippage = (state: BridgeAppState) => state.bridge.slippage;

export const getQuoteRequest = (state: BridgeAppState) => {
  const { quoteRequest } = state.metamask;
  return quoteRequest;
};

export const getQuoteRefreshRate = createSelector(
  [getBridgeFeatureFlags, getFromChain],
  (extensionConfig, fromChain) =>
    (fromChain && extensionConfig.chains[fromChain.chainId]?.refreshRate) ??
    extensionConfig.refreshRate,
);
export const getBridgeSortOrder = (state: BridgeAppState) =>
  state.bridge.sortOrder;

export const getFromTokenConversionRate = createSelector(
  [
    getFromToken,
    (state: BridgeAppState) => state.bridge.fromTokenExchangeRate,
    getAssetsRates, // non-evm conversion rates multichain equivalent of getMarketData
    getMultichainCoinRates,
    (state: BridgeAppState) => state.metamask.marketData, // rates for non-native evm tokens
    (state: BridgeAppState) => state.metamask.currencyRates, // EVM only
  ],
  (
    fromToken,
    fromTokenExchangeRate,
    conversionRates,
    rates,
    marketData,
    currencyRates,
  ) => {
    const nullResult = {
      valueInCurrency: null,
      usd: null,
    };
    if (!fromToken) {
      return nullResult;
    }
    const { chainId, assetId } = fromToken;
    const nativeAsset = getNativeAssetForChainId(chainId);
    if (!nativeAsset) {
      return nullResult;
    }
    // For non-EVM tokens (Solana, Bitcoin, Tron), we use the conversion rates provided by the multichain rates controller
    if (isNonEvmChain(chainId)) {
      // Derive asset's value in USD from the native asset's value in USD
      const {
        conversionRate: nativeToCurrencyRate,
        usdConversionRate: nativeToUsdRate,
      } = rates[nativeAsset.symbol.toLowerCase()] ?? {};
      const assetToCurrencyRateToUse =
        fromTokenExchangeRate ?? Number(conversionRates?.[assetId]?.rate);

      return {
        valueInCurrency: assetToCurrencyRateToUse,
        usd:
          nativeToUsdRate && nativeToCurrencyRate && assetToCurrencyRateToUse
            ? (assetToCurrencyRateToUse * nativeToUsdRate) /
              nativeToCurrencyRate
            : null,
      };
    }

    // For EVM tokens
    const {
      conversionRate: nativeToCurrencyRate,
      usdConversionRate: nativeToUsdRate,
    } = currencyRates[nativeAsset.symbol] ?? {};

    // For EVM tokens, we use the market data to get the exchange rate
    const tokenToNativeAssetRate =
      exchangeRateFromMarketData(assetId, marketData) ??
      tokenPriceInNativeAsset(fromTokenExchangeRate, nativeToCurrencyRate);

    return {
      valueInCurrency:
        tokenToNativeAssetRate && nativeToCurrencyRate
          ? tokenToNativeAssetRate * nativeToCurrencyRate
          : null,
      usd:
        tokenToNativeAssetRate && nativeToUsdRate
          ? tokenToNativeAssetRate * nativeToUsdRate
          : null,
    };
  },
);

export const getIsQuoteExpired = (
  { metamask }: BridgeAppState,
  currentTimeInMs: number,
) => selectIsQuoteExpired(metamask, {}, currentTimeInMs);

export const getBridgeQuotes = createSelector(
  [
    ({ metamask }: BridgeAppState) => metamask,
    ({ bridge: { sortOrder } }: BridgeAppState) => sortOrder,
    ({ bridge: { selectedQuote } }: BridgeAppState) => selectedQuote,
  ],
  (controllerStates, sortOrder, selectedQuote) =>
    selectBridgeQuotes(controllerStates, {
      sortOrder,
      selectedQuote,
    }),
);

export const getValidatedFromValue = createSelector(
  [getFromToken, getFromAmount],
  (fromToken, unvalidatedInputValue) =>
    unvalidatedInputValue && fromToken?.decimals
      ? calcTokenValue(
          safeAmountForCalc(unvalidatedInputValue),
          fromToken.decimals,
        )
          .toFixed()
          // Length of decimal part cannot exceed token.decimals
          .split('.')[0]
      : undefined,
);

const _getValidatedSrcAmount = createSelector(
  [getFromToken, getValidatedFromValue],
  (fromToken, srcTokenAmount) =>
    srcTokenAmount && fromToken?.decimals
      ? calcTokenAmount(srcTokenAmount, Number(fromToken.decimals)).toString()
      : undefined,
);

export const getFromAmountInCurrency = createSelector(
  [
    getFromToken,
    getFromChain,
    _getValidatedSrcAmount,
    getFromTokenConversionRate,
  ],
  (
    fromToken,
    fromChain,
    validatedSrcAmount,
    {
      valueInCurrency: fromTokenToCurrencyExchangeRate,
      usd: fromTokenToUsdExchangeRate,
    },
  ) => {
    if (fromToken?.symbol && fromChain?.chainId && validatedSrcAmount) {
      if (fromTokenToCurrencyExchangeRate) {
        return {
          valueInCurrency: new BigNumber(validatedSrcAmount).mul(
            new BigNumber(fromTokenToCurrencyExchangeRate.toString() ?? 1),
          ),
          usd: new BigNumber(validatedSrcAmount).mul(
            new BigNumber(fromTokenToUsdExchangeRate?.toString() ?? 1),
          ),
        };
      }
    }
    return {
      valueInCurrency: new BigNumber(0),
      usd: new BigNumber(0),
    };
  },
);

export const getTxAlerts = (state: BridgeAppState) => state.bridge.txAlert;

export const getValidationErrors = createDeepEqualSelector(
  [
    getBridgeQuotes,
    _getValidatedSrcAmount,
    getFromToken,
    getFromAmount,
    ({ metamask }: BridgeAppState) =>
      selectMinimumBalanceForRentExemptionInSOL(metamask),
    getQuoteRequest,
    getTxAlerts,
    _getFromNativeBalance,
    getFromTokenBalance,
    ({ bridge: { txAlertStatus } }: BridgeAppState) => txAlertStatus,
  ],
  (
    { activeQuote, quotesLastFetchedMs, isLoading, quotesRefreshCount },
    validatedSrcAmount,
    fromToken,
    fromTokenInputValue,
    minimumBalanceForRentExemptionInSOL,
    quoteRequest,
    txAlert,
    nativeBalance,
    fromTokenBalance,
    txAlertStatus,
  ) => {
    const { gasIncluded, gasIncluded7702, gasSponsored } =
      activeQuote?.quote ?? {};
    const isGasless = gasIncluded7702 || gasIncluded || gasSponsored;

    const srcChainId =
      quoteRequest.srcChainId ?? activeQuote?.quote?.srcChainId;
    const minimumBalanceToUse =
      srcChainId && isSolanaChainId(srcChainId)
        ? minimumBalanceForRentExemptionInSOL
        : '0';

    return {
      isTxAlertPresent: Boolean(txAlert),
      isTxAlertLoading: txAlertStatus === RequestStatus.LOADING,
      isNoQuotesAvailable: Boolean(
        !activeQuote &&
          isValidQuoteRequest(quoteRequest) &&
          quotesLastFetchedMs &&
          !isLoading &&
          quotesRefreshCount > 0,
      ),
      // Shown prior to fetching quotes
      isInsufficientGasBalance: Boolean(
        nativeBalance &&
          !activeQuote &&
          validatedSrcAmount &&
          fromToken &&
          !isGasless &&
          (isNativeAddress(fromToken.assetId)
            ? new BigNumber(nativeBalance)
                .sub(minimumBalanceToUse)
                .lte(validatedSrcAmount)
            : new BigNumber(nativeBalance).lte(0)),
      ),
      // Shown after fetching quotes
      isInsufficientGasForQuote: Boolean(
        nativeBalance &&
          activeQuote &&
          fromToken &&
          fromTokenInputValue &&
          !isGasless &&
          (isNativeAddress(fromToken.assetId)
            ? new BigNumber(nativeBalance)
                .sub(activeQuote.totalNetworkFee.amount)
                .sub(activeQuote.sentAmount.amount)
                .sub(minimumBalanceToUse)
                .lte(0)
            : new BigNumber(nativeBalance).lte(
                activeQuote.totalNetworkFee.amount,
              )),
      ),
      isInsufficientBalance:
        validatedSrcAmount &&
        fromTokenBalance &&
        !isNaN(Number(fromTokenBalance))
          ? new BigNumber(fromTokenBalance).lt(validatedSrcAmount)
          : false,
      isEstimatedReturnLow:
        activeQuote?.sentAmount?.valueInCurrency &&
        activeQuote?.adjustedReturn?.valueInCurrency &&
        fromTokenInputValue
          ? new BigNumber(activeQuote.adjustedReturn.valueInCurrency).lt(
              new BigNumber(
                1 - BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
              ).times(activeQuote.sentAmount.valueInCurrency),
            )
          : false,
    };
  },
);

export const getWarningLabels = createSelector(
  [getValidationErrors],
  ({
    isEstimatedReturnLow,
    isNoQuotesAvailable,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
    isInsufficientBalance,
  }) => {
    const warnings: QuoteWarning[] = [];
    isEstimatedReturnLow && warnings.push('low_return');
    isNoQuotesAvailable && warnings.push('no_quotes');
    isInsufficientGasBalance && warnings.push('insufficient_gas_balance');
    isInsufficientGasForQuote &&
      warnings.push('insufficient_gas_for_selected_quote');
    isInsufficientBalance && warnings.push('insufficient_balance');
    return warnings;
  },
);

export const getWasTxDeclined = (state: BridgeAppState): boolean => {
  return state.bridge.wasTxDeclined;
};

export const getIsToOrFromNonEvm = createSelector(
  [getFromChainId, (state: BridgeAppState) => getToToken(state)?.chainId],
  (fromChainId, toChainId) => {
    if (!fromChainId || !toChainId) {
      return false;
    }

    // Parse the CAIP chain IDs to get their namespaces
    const { namespace: fromNamespace } = parseCaipChainId(fromChainId);
    const { namespace: toNamespace } = parseCaipChainId(toChainId);

    // Return true if chains are in different namespaces
    // This covers EVM <> non-EVM as well as non-EVM <> non-EVM (e.g., Solana <> Bitcoin)
    return fromNamespace !== toNamespace;
  },
);

export const getIsSolanaSwap = createSelector(
  [getFromChain, getToChain],
  (fromChain, toChain) => {
    if (!fromChain?.chainId || !toChain?.chainId) {
      return false;
    }

    const fromChainIsSolana = isSolanaChainId(fromChain.chainId);
    const toChainIsSolana = isSolanaChainId(toChain.chainId);

    // Return true if BOTH chains are Solana (Solana-to-Solana swap)
    return fromChainIsSolana && toChainIsSolana;
  },
);

export const getHardwareWalletName = (state: BridgeAppState) => {
  const type = getHardwareWalletType(state);
  switch (type) {
    case HardwareKeyringType.ledger:
      return HardwareKeyringNames.ledger;
    case HardwareKeyringType.trezor:
      return HardwareKeyringNames.trezor;
    case HardwareKeyringType.lattice:
      return HardwareKeyringNames.lattice;
    case HardwareKeyringType.oneKey:
      return HardwareKeyringNames.oneKey;
    default:
      return undefined;
  }
};

export const selectNoFeeAssets = createSelector(
  [getBridgeFeatureFlags, (_state, chainId?: string) => chainId],
  (bridgeFeatureFlags, chainId): string[] => {
    if (!chainId) {
      return [];
    }
    const caipChainId = formatChainIdToCaip(chainId);
    return (
      (
        bridgeFeatureFlags?.chains?.[caipChainId] as unknown as {
          noFeeAssets?: string[];
        }
      )?.noFeeAssets ?? []
    );
  },
);

// TODO this is blroken
const getIsGasIncludedSwapSupported = createSelector(
  [
    (state: BridgeAppState) => getFromChain(state)?.chainId,
    (_, isSendBundleSupportedForChain: boolean) =>
      isSendBundleSupportedForChain,
  ],
  (fromChainId, isSendBundleSupportedForChain) => {
    const hexChainId = getMaybeHexChainId(fromChainId);
    if (!hexChainId) {
      return false;
    }
    return isSendBundleSupportedForChain;
  },
);

export const getIsStxEnabled = createSelector(
  [
    (state: BridgeAppState) => getFromChain(state)?.chainId,
    (state: BridgeAppState) => state,
  ],
  (fromChainId, state) => {
    const hexChainId = getMaybeHexChainId(fromChainId);
    if (!hexChainId) {
      return false;
    }
    return getIsSmartTransaction(state, hexChainId);
  },
);

export const getIsGasIncluded = createSelector(
  [getIsStxEnabled, getIsGasIncludedSwapSupported],
  (isStxEnabled, isGasIncludedSwapSupported) => {
    return isStxEnabled && isGasIncludedSwapSupported;
  },
);
