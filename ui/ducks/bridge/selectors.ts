import type {
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps,bitcoin)
  NetworkConfiguration,
  ///: END:ONLY_INCLUDE_IF
  NetworkState,
} from '@metamask/network-controller';
import {
  isSolanaChainId,
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
} from '@metamask/bridge-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { SolAccountType } from '@metamask/keyring-api';
import type { AccountsControllerState } from '@metamask/accounts-controller';
import { uniqBy } from 'lodash';
import { createSelector } from 'reselect';
import type { GasFeeState } from '@metamask/gas-fee-controller';
import { BigNumber } from 'bignumber.js';
import { calcTokenAmount } from '@metamask/notification-services-controller/push-services';
import type { CaipAssetType, CaipChainId, Hex } from '@metamask/utils';
import type {
  CurrencyRateState,
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
  MultichainBalancesControllerState,
  RatesControllerState,
  TokenListState,
  TokenRatesControllerState,
} from '@metamask/assets-controllers';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import type { MultichainNetworkControllerState } from '@metamask/multichain-network-controller';
import {
  MultichainNetworks,
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps,bitcoin)
  MULTICHAIN_PROVIDER_CONFIGS,
  ///: END:ONLY_INCLUDE_IF
} from '../../../shared/constants/multichain/networks';
import {
  getHardwareWalletType,
  getUSDConversionRateByChainId,
  selectConversionRateByChainId,
} from '../../selectors/selectors';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/networks';
import {} from '../../pages/bridge/utils/quote';
import { FEATURED_RPCS } from '../../../shared/constants/network';
import {
  getMultichainCoinRates,
  getMultichainProviderConfig,
} from '../../selectors/multichain';
import { getAssetsRates } from '../../selectors/assets';
import {
  HardwareKeyringNames,
  HardwareKeyringType,
} from '../../../shared/constants/hardware-wallets';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { getRemoteFeatureFlags } from '../../selectors/remote-feature-flags';
import {
  exchangeRateFromMarketData,
  exchangeRatesFromNativeAndCurrencyRates,
  tokenPriceInNativeAsset,
  getDefaultToToken,
  toBridgeToken,
} from './utils';
import type { BridgeState } from './types';

export type BridgeAppState = {
  metamask: BridgeAppStateFromController &
    GasFeeState &
    NetworkState &
    AccountsControllerState &
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

// checks if the user has any solana accounts created
const hasSolanaAccounts = (state: BridgeAppState) => {
  // Access accounts from the state
  const accounts = state.metamask.internalAccounts?.accounts || {};

  // Check if any account is a Solana account
  return Object.values(accounts).some((account) => {
    const { DataAccount } = SolAccountType;
    return Boolean(account && account.type === DataAccount);
  });
};

// only includes networks user has added
export const getAllBridgeableNetworks = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  (networkConfigurationsByChainId) => {
    return uniqBy(
      [
        ...Object.values(networkConfigurationsByChainId),
        ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
        // TODO: get this from network controller, use placeholder values for now
        {
          ...MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA],
          blockExplorerUrls: [],
          name: MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA].nickname,
          nativeCurrency:
            MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA].ticker,
          rpcEndpoints: [{ url: '', type: '', networkClientId: '' }],
          defaultRpcEndpointIndex: 0,
          chainId: MultichainNetworks.SOLANA,
        } as unknown as NetworkConfiguration,
        {
          ...MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN],
          blockExplorerUrls: [],
          name: MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN]
            .nickname,
          nativeCurrency:
            MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN].ticker,
          rpcEndpoints: [{ url: '', type: '', networkClientId: '' }],
          defaultRpcEndpointIndex: 0,
          chainId: MultichainNetworks.BITCOIN,
        } as unknown as NetworkConfiguration,
        ///: END:ONLY_INCLUDE_IF
      ],
      'chainId',
    ).filter(({ chainId }) =>
      ALLOWED_BRIDGE_CHAIN_IDS.includes(
        chainId as (typeof ALLOWED_BRIDGE_CHAIN_IDS)[number],
      ),
    );
  },
);

const getBridgeFeatureFlags = createDeepEqualSelector(
  [(state) => getRemoteFeatureFlags(state).bridgeConfig],
  (bridgeConfig) => {
    const validatedFlags = selectBridgeFeatureFlags({
      remoteFeatureFlags: { bridgeConfig },
    });
    return validatedFlags;
  },
);

export const getFromChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  getBridgeFeatureFlags,
  (state: BridgeAppState) => hasSolanaAccounts(state),
  (allBridgeableNetworks, bridgeFeatureFlags, hasSolanaAccount) => {
    // First filter out Solana from source chains if no Solana account exists
    const filteredNetworks = hasSolanaAccount
      ? allBridgeableNetworks
      : allBridgeableNetworks.filter(
          ({ chainId }) => !isSolanaChainId(chainId),
        );

    // Then apply the standard filter for active source chains
    return filteredNetworks.filter(
      ({ chainId }) =>
        bridgeFeatureFlags.chains[formatChainIdToCaip(chainId)]?.isActiveSrc,
    );
  },
);

export const getFromChain = createDeepEqualSelector(
  getMultichainProviderConfig,
  getFromChains,
  (providerConfig, fromChains) => {
    return providerConfig?.chainId
      ? fromChains.find(({ chainId }) => chainId === providerConfig.chainId)
      : undefined;
  },
);

export const getToChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  getBridgeFeatureFlags,
  (allBridgeableNetworks, bridgeFeatureFlags) =>
    uniqBy([...allBridgeableNetworks, ...FEATURED_RPCS], 'chainId').filter(
      ({ chainId }) =>
        bridgeFeatureFlags?.chains?.[formatChainIdToCaip(chainId)]
          ?.isActiveDest,
    ),
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

// If the user has selected a toChainId, return it as the destination chain
// Otherwise, use the source chain as the destination chain (default to swap params)
export const getToChain = createSelector(
  [
    getFromChain,
    getToChains,
    (state: BridgeAppState) => state.bridge?.toChainId,
  ],
  (fromChain, toChains, toChainId) =>
    toChainId
      ? toChains.find(
          ({ chainId }) =>
            chainId === toChainId || formatChainIdToCaip(chainId) === toChainId,
        )
      : fromChain,
);

export const getFromToken = createSelector(
  [(state: BridgeAppState) => state.bridge.fromToken, getFromChain],
  (fromToken, fromChain) => {
    if (!fromChain?.chainId) {
      return null;
    }
    if (fromToken?.address) {
      return fromToken;
    }
    const { iconUrl, ...nativeAsset } = getNativeAssetForChainId(
      fromChain.chainId,
    );
    const newToToken = toBridgeToken(nativeAsset);
    return newToToken
      ? {
          ...newToToken,
          chainId: formatChainIdToCaip(fromChain.chainId),
        }
      : newToToken;
  },
);

export const getToToken = createSelector(
  [getFromToken, getToChain, (state) => state.bridge.toToken],
  (fromToken, toChain, toToken) => {
    if (!toChain || !fromToken) {
      return null;
    }
    // If the user has selected a token, return it
    if (toToken) {
      return toToken;
    }
    // Otherwise, determine the default token to use based on fromToken and toChain
    const defaultToken = getDefaultToToken(toChain, fromToken);
    return defaultToken ? toBridgeToken(defaultToken) : null;
  },
);

export const getFromAmount = (state: BridgeAppState): string | null =>
  state.bridge.fromTokenInputValue;

export const getSlippage = (state: BridgeAppState) => state.bridge.slippage;

export const getQuoteRequest = (state: BridgeAppState) => {
  const { quoteRequest } = state.metamask;
  return quoteRequest;
};

export const getQuoteRefreshRate = createSelector(
  getBridgeFeatureFlags,
  getFromChain,
  (extensionConfig, fromChain) =>
    (fromChain &&
      extensionConfig.chains[formatChainIdToCaip(fromChain.chainId)]
        ?.refreshRate) ??
    extensionConfig.refreshRate,
);
export const getBridgeSortOrder = (state: BridgeAppState) =>
  state.bridge.sortOrder;

export const getFromTokenConversionRate = createSelector(
  [
    getFromChain,
    (state: BridgeAppState) => state.metamask.marketData, // rates for non-native evm tokens
    getAssetsRates, // non-evm conversion rates multichain equivalent of getMarketData
    getFromToken,
    getMultichainCoinRates, // RatesController rates for native assets
    (state: BridgeAppState) => state.metamask.currencyRates, // EVM only
    (state: BridgeAppState) => state.bridge.fromTokenExchangeRate,
  ],
  (
    fromChain,
    marketData,
    conversionRates,
    fromToken,
    rates,
    currencyRates,
    fromTokenExchangeRate,
  ) => {
    if (fromChain?.chainId && fromToken) {
      const nativeAssetId = getNativeAssetForChainId(
        fromChain.chainId,
      )?.assetId;
      const tokenAssetId = toAssetId(
        fromToken.address,
        formatChainIdToCaip(fromChain.chainId),
      );
      const nativeToCurrencyRate = isSolanaChainId(fromChain.chainId)
        ? Number(
            conversionRates?.[nativeAssetId as CaipAssetType]?.rate ?? null,
          )
        : (currencyRates[fromChain.nativeCurrency]?.conversionRate ?? null);
      const nativeToUsdRate = isSolanaChainId(fromChain.chainId)
        ? Number(
            rates?.[fromChain.nativeCurrency.toLowerCase()]
              ?.usdConversionRate ?? null,
          )
        : (currencyRates[fromChain.nativeCurrency]?.usdConversionRate ?? null);

      if (isNativeAddress(fromToken.address)) {
        return {
          valueInCurrency: nativeToCurrencyRate,
          usd: nativeToUsdRate,
        };
      }
      if (isSolanaChainId(fromChain.chainId) && nativeAssetId && tokenAssetId) {
        // For SOLANA tokens, we use the conversion rates provided by the multichain rates controller
        const tokenToNativeAssetRate = tokenPriceInNativeAsset(
          Number(
            conversionRates?.[tokenAssetId]?.rate ??
              fromTokenExchangeRate ??
              null,
          ),
          Number(
            conversionRates?.[nativeAssetId as CaipAssetType]?.rate ??
              rates?.sol?.conversionRate ??
              null,
          ),
        );
        return exchangeRatesFromNativeAndCurrencyRates(
          tokenToNativeAssetRate,
          Number(nativeToCurrencyRate),
          Number(nativeToUsdRate),
        );
      }
      // For EVM tokens, we use the market data to get the exchange rate
      const tokenToNativeAssetRate =
        exchangeRateFromMarketData(
          fromChain.chainId,
          fromToken.address,
          marketData,
        ) ??
        tokenPriceInNativeAsset(fromTokenExchangeRate, nativeToCurrencyRate);

      return exchangeRatesFromNativeAndCurrencyRates(
        tokenToNativeAssetRate,
        nativeToCurrencyRate,
        nativeToUsdRate,
      );
    }
    return exchangeRatesFromNativeAndCurrencyRates();
  },
);

// A dest network can be selected before it's imported
// The cached exchange rate won't be available so the rate from the bridge state is used
export const getToTokenConversionRate = createDeepEqualSelector(
  [
    getToChain,
    (state: BridgeAppState) => state.metamask.marketData, // rates for non-native evm tokens
    getAssetsRates, // non-evm conversion rates, multichain equivalent of getMarketData
    getToToken,
    getNetworkConfigurationsByChainId,
    (state) => ({
      state,
      toTokenExchangeRate: state.bridge.toTokenExchangeRate,
      toTokenUsdExchangeRate: state.bridge.toTokenUsdExchangeRate,
    }),
    getMultichainCoinRates, // multichain native rates
  ],
  (
    toChain,
    marketData,
    conversionRates,
    toToken,
    allNetworksByChainId,
    { state, toTokenExchangeRate, toTokenUsdExchangeRate },
    rates,
  ) => {
    // When the toChain is not imported, the exchange rate to native asset is not available
    // The rate in the bridge state is used instead
    if (
      toChain?.chainId &&
      !allNetworksByChainId[toChain.chainId] &&
      toTokenExchangeRate
    ) {
      return {
        valueInCurrency: toTokenExchangeRate,
        usd: toTokenUsdExchangeRate,
      };
    }
    if (toChain?.chainId && toToken) {
      const nativeAssetId = getNativeAssetForChainId(toChain.chainId)?.assetId;
      const tokenAssetId = toAssetId(
        toToken.address,
        formatChainIdToCaip(toChain.chainId),
      );

      if (isSolanaChainId(toChain.chainId) && nativeAssetId && tokenAssetId) {
        // For SOLANA tokens, we use the conversion rates provided by the multichain rates controller
        const tokenToNativeAssetRate = tokenPriceInNativeAsset(
          Number(conversionRates?.[tokenAssetId]?.rate ?? null),
          Number(
            conversionRates?.[nativeAssetId as CaipAssetType]?.rate ?? null,
          ),
        );
        return exchangeRatesFromNativeAndCurrencyRates(
          tokenToNativeAssetRate,
          rates?.[toChain.nativeCurrency.toLowerCase()]?.conversionRate ?? null,
          rates?.[toChain.nativeCurrency.toLowerCase()]?.usdConversionRate ??
            null,
        );
      }

      const { chainId } = toChain;

      const nativeToCurrencyRate = selectConversionRateByChainId(
        state,
        chainId,
      );
      const nativeToUsdRate = getUSDConversionRateByChainId(chainId)(state);

      if (isNativeAddress(toToken.address)) {
        return {
          valueInCurrency: nativeToCurrencyRate,
          usd: nativeToUsdRate,
        };
      }

      const tokenToNativeAssetRate =
        exchangeRateFromMarketData(chainId, toToken.address, marketData) ??
        tokenPriceInNativeAsset(toTokenExchangeRate, nativeToCurrencyRate);
      return exchangeRatesFromNativeAndCurrencyRates(
        tokenToNativeAssetRate,
        nativeToCurrencyRate,
        nativeToUsdRate,
      );
    }
    return exchangeRatesFromNativeAndCurrencyRates();
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

export const getIsBridgeTx = createDeepEqualSelector(
  getFromChain,
  getToChain,
  (fromChain, toChain) =>
    toChain && fromChain?.chainId
      ? fromChain.chainId !== toChain.chainId
      : false,
);

export const getIsSwap = createDeepEqualSelector(
  getQuoteRequest,
  ({ srcChainId, destChainId }) =>
    Boolean(
      srcChainId &&
        destChainId &&
        formatChainIdToCaip(srcChainId) === formatChainIdToCaip(destChainId),
    ),
);

const _getValidatedSrcAmount = createSelector(
  getFromToken,
  (state: BridgeAppState) => state.metamask.quoteRequest.srcTokenAmount,
  (fromToken, srcTokenAmount) =>
    srcTokenAmount && fromToken?.decimals
      ? calcTokenAmount(srcTokenAmount, Number(fromToken.decimals)).toString()
      : null,
);

export const getFromAmountInCurrency = createSelector(
  getFromToken,
  getFromChain,
  _getValidatedSrcAmount,
  getFromTokenConversionRate,
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
  getBridgeQuotes,
  _getValidatedSrcAmount,
  getFromToken,
  getFromAmount,
  ({ metamask }: BridgeAppState) =>
    selectMinimumBalanceForRentExemptionInSOL(metamask),
  getQuoteRequest,
  getTxAlerts,
  (
    { activeQuote, quotesLastFetchedMs, isLoading, quotesRefreshCount },
    validatedSrcAmount,
    fromToken,
    fromTokenInputValue,
    minimumBalanceForRentExemptionInSOL,
    quoteRequest,
    txAlert,
  ) => {
    const { gasIncluded } = activeQuote?.quote ?? {};

    const srcChainId =
      quoteRequest.srcChainId ?? activeQuote?.quote?.srcChainId;
    const minimumBalanceToUse =
      srcChainId && isSolanaChainId(srcChainId)
        ? minimumBalanceForRentExemptionInSOL
        : '0';

    return {
      isTxAlertPresent: Boolean(txAlert),
      isNoQuotesAvailable: Boolean(
        !activeQuote &&
          isValidQuoteRequest(quoteRequest) &&
          quotesLastFetchedMs &&
          !isLoading &&
          quotesRefreshCount > 0,
      ),
      // Shown prior to fetching quotes
      isInsufficientGasBalance: (balance?: BigNumber) => {
        if (
          balance &&
          !activeQuote &&
          validatedSrcAmount &&
          fromToken &&
          !gasIncluded
        ) {
          return isNativeAddress(fromToken.address)
            ? balance.sub(minimumBalanceToUse).lte(validatedSrcAmount)
            : balance.lte(0);
        }
        return false;
      },
      // Shown after fetching quotes
      isInsufficientGasForQuote: (balance?: BigNumber) => {
        if (
          balance &&
          activeQuote &&
          fromToken &&
          fromTokenInputValue &&
          !gasIncluded
        ) {
          return isNativeAddress(fromToken.address)
            ? balance
                .sub(activeQuote.totalMaxNetworkFee.amount)
                .sub(activeQuote.sentAmount.amount)
                .sub(minimumBalanceToUse)
                .lte(0)
            : balance.lte(activeQuote.totalMaxNetworkFee.amount);
        }
        return false;
      },
      isInsufficientBalance: (balance?: BigNumber) =>
        validatedSrcAmount && balance !== undefined
          ? balance.lt(validatedSrcAmount)
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

export const getWasTxDeclined = (state: BridgeAppState): boolean => {
  return state.bridge.wasTxDeclined;
};

/**
 * Checks if the destination chain is Solana and the user has no Solana accounts
 */
export const needsSolanaAccountForDestination = createDeepEqualSelector(
  getToChain,
  (state: BridgeAppState) => hasSolanaAccounts(state),
  (toChain, hasSolanaAccount) => {
    if (!toChain) {
      return false;
    }

    const isSolanaDestination = isSolanaChainId(toChain.chainId);

    return isSolanaDestination && !hasSolanaAccount;
  },
);

export const getIsToOrFromSolana = createSelector(
  getFromChain,
  getToChain,
  (fromChain, toChain) => {
    if (!fromChain?.chainId || !toChain?.chainId) {
      return false;
    }

    const fromChainIsSolana = isSolanaChainId(fromChain.chainId);
    const toChainIsSolana = isSolanaChainId(toChain.chainId);

    // Only return true if either chain is Solana and the other is EVM
    return toChainIsSolana !== fromChainIsSolana;
  },
);

export const getIsSolanaSwap = createSelector(
  getFromChain,
  getToChain,
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

/**
 * Returns true if Unified UI swaps are enabled for the chain.
 * Falls back to false when the chain is missing from feature-flags.
 *
 * @param _state - Redux state (unused placeholder for reselect signature)
 * @param chainId - ChainId in either hex (e.g. 0x1) or CAIP format (eip155:1).
 */
export const getIsUnifiedUIEnabled = createSelector(
  [
    getBridgeFeatureFlags,
    (_state: BridgeAppState, chainId?: string | number) => chainId,
  ],
  (bridgeFeatureFlags, chainId): boolean => {
    if (chainId === undefined || chainId === null) {
      return false;
    }

    const caipChainId = formatChainIdToCaip(chainId);

    // TODO remove this when bridge-controller's types are updated
    return bridgeFeatureFlags?.chains?.[caipChainId]
      ? Boolean(
          'isSingleSwapBridgeButtonEnabled' in
            bridgeFeatureFlags.chains[caipChainId]
            ? (
                bridgeFeatureFlags.chains[caipChainId] as unknown as {
                  isSingleSwapBridgeButtonEnabled: boolean;
                }
              ).isSingleSwapBridgeButtonEnabled
            : false,
        )
      : false;
  },
);
