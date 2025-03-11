import type {
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  NetworkConfiguration,
  ///: END:ONLY_INCLUDE_IF
  NetworkState,
} from '@metamask/network-controller';
import { SolAccountType } from '@metamask/keyring-api';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { orderBy, uniqBy } from 'lodash';
import { createSelector } from 'reselect';
import type { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { BigNumber } from 'bignumber.js';
import { calcTokenAmount } from '@metamask/notification-services-controller/push-services';
import { CaipChainId, Hex } from '@metamask/utils';
import {
  MultichainNetworks,
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  MULTICHAIN_PROVIDER_CONFIGS,
  ///: END:ONLY_INCLUDE_IF
} from '../../../shared/constants/multichain/networks';
import {
  getIsBridgeEnabled,
  getMarketData,
  getUSDConversionRate,
  getUSDConversionRateByChainId,
  selectConversionRateByChainId,
} from '../../selectors/selectors';
import {
  ALLOWED_BRIDGE_CHAIN_IDS,
  BRIDGE_PREFERRED_GAS_ESTIMATE,
  BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
} from '../../../shared/constants/bridge';
import type {
  BridgeControllerState,
  SolanaFees,
} from '../../../shared/types/bridge';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../shared/constants/swaps';
import { getNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/networks';
import { getConversionRate, getGasFeeEstimates } from '../metamask/metamask';
import {
  type L1GasFees,
  type BridgeToken,
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
  BridgeFeatureFlagsKey,
  RequestStatus,
} from '../../../shared/types/bridge';
import {
  calcAdjustedReturn,
  calcCost,
  calcRelayerFee,
  calcSentAmount,
  calcSwapRate,
  calcToAmount,
  calcEstimatedAndMaxTotalGasFee,
  calcSolanaTotalNetworkFee,
} from '../../pages/bridge/utils/quote';
import {
  isNativeAddress,
  formatChainIdToCaip,
} from '../../../shared/modules/bridge-utils/caip-formatters';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  FEATURED_RPCS,
} from '../../../shared/constants/network';
import {
  getMultichainCoinRates,
  getMultichainProviderConfig,
  getImageForChainId,
} from '../../selectors/multichain';
import { getAssetsRates } from '../../selectors/assets';
import {
  exchangeRateFromMarketData,
  exchangeRatesFromNativeAndCurrencyRates,
  tokenPriceInNativeAsset,
} from './utils';
import type { BridgeState } from './bridge';

export type BridgeAppState = {
  metamask: BridgeControllerState &
    NetworkState &
    AccountsControllerState & {
      useExternalServices: boolean;
      currencyRates: {
        [currency: string]: {
          conversionRate: number;
          usdConversionRate?: number;
        };
      };
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

export const getFromChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  (state: BridgeAppState) => state.metamask.bridgeState?.bridgeFeatureFlags,
  (state: BridgeAppState) => hasSolanaAccounts(state),
  (allBridgeableNetworks, bridgeFeatureFlags, hasSolanaAccount) => {
    // First filter out Solana from source chains if no Solana account exists
    const filteredNetworks = hasSolanaAccount
      ? allBridgeableNetworks
      : allBridgeableNetworks.filter(
          // @ts-expect-error: gotta fix type here.
          ({ chainId }) => chainId !== MultichainNetworks.SOLANA,
        );

    // Then apply the standard filter for active source chains
    return filteredNetworks.filter(
      ({ chainId }) =>
        bridgeFeatureFlags[BridgeFeatureFlagsKey.EXTENSION_CONFIG].chains[
          formatChainIdToCaip(chainId)
        ]?.isActiveSrc,
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
  (state: BridgeAppState) => state.metamask.bridgeState?.bridgeFeatureFlags,
  (allBridgeableNetworks, bridgeFeatureFlags) =>
    uniqBy([...allBridgeableNetworks, ...FEATURED_RPCS], 'chainId').filter(
      ({ chainId }) =>
        bridgeFeatureFlags?.[BridgeFeatureFlagsKey.EXTENSION_CONFIG]?.chains?.[
          formatChainIdToCaip(chainId)
        ]?.isActiveDest,
    ),
);

export const getTopAssetsFromFeatureFlags = (
  state: BridgeAppState,
  chainId?: CaipChainId | Hex,
) => {
  if (!chainId) {
    return undefined;
  }
  const bridgeFeatureFlags = state.metamask.bridgeState?.bridgeFeatureFlags;
  return bridgeFeatureFlags?.[BridgeFeatureFlagsKey.EXTENSION_CONFIG].chains[
    formatChainIdToCaip(chainId)
  ]?.topAssets;
};

export const getToChain = createSelector(
  getToChains,
  (state: BridgeAppState) => state.bridge?.toChainId,
  (toChains, toChainId) =>
    toChainId
      ? toChains.find(
          ({ chainId }) =>
            chainId === toChainId || formatChainIdToCaip(chainId) === toChainId,
        )
      : undefined,
);

export const getFromToken = createSelector(
  (state: BridgeAppState) => state.bridge.fromToken,
  getFromChain,
  (fromToken, fromChain): BridgeToken | null => {
    if (!fromChain?.chainId) {
      return null;
    }
    if (fromToken?.address) {
      return fromToken;
    }
    return {
      ...SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
        fromChain.chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
      ],
      chainId: formatChainIdToCaip(fromChain.chainId),
      image:
        CHAIN_ID_TOKEN_IMAGE_MAP[
          fromChain.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
        ] ?? getImageForChainId(fromChain.chainId),
      balance: '0',
      string: '0',
    };
  },
);

export const getToToken = (state: BridgeAppState): BridgeToken | null => {
  return state.bridge.toToken;
};

export const getFromAmount = (state: BridgeAppState): string | null =>
  state.bridge.fromTokenInputValue;

export const getSlippage = (state: BridgeAppState) => state.bridge.slippage;

export const getQuoteRequest = (state: BridgeAppState) => {
  const { quoteRequest } = state.metamask.bridgeState;
  return quoteRequest;
};

export const getBridgeQuotesConfig = (state: BridgeAppState) =>
  state.metamask.bridgeState?.bridgeFeatureFlags[
    BridgeFeatureFlagsKey.EXTENSION_CONFIG
  ] ?? {};

export const getQuoteRefreshRate = createSelector(
  getBridgeQuotesConfig,
  getFromChain,
  (extensionConfig, fromChain) =>
    (fromChain &&
      extensionConfig.chains[formatChainIdToCaip(fromChain.chainId)]
        ?.refreshRate) ??
    extensionConfig.refreshRate,
);

const _getBridgeFeesPerGas = createSelector(
  getGasFeeEstimates,
  (gasFeeEstimates) => ({
    estimatedBaseFeeInDecGwei: (gasFeeEstimates as GasFeeEstimates)
      ?.estimatedBaseFee,
    maxPriorityFeePerGasInDecGwei: (gasFeeEstimates as GasFeeEstimates)?.[
      BRIDGE_PREFERRED_GAS_ESTIMATE
    ]?.suggestedMaxPriorityFeePerGas,
    maxFeePerGasInDecGwei: (gasFeeEstimates as GasFeeEstimates)?.high
      ?.suggestedMaxFeePerGas,
    maxFeePerGas: decGWEIToHexWEI(
      (gasFeeEstimates as GasFeeEstimates)?.high?.suggestedMaxFeePerGas,
    ),
    maxPriorityFeePerGas: decGWEIToHexWEI(
      (gasFeeEstimates as GasFeeEstimates)?.high?.suggestedMaxPriorityFeePerGas,
    ),
  }),
);

export const getBridgeSortOrder = (state: BridgeAppState) =>
  state.bridge.sortOrder;

export const getFromTokenConversionRate = createSelector(
  getFromChain,
  getMarketData,
  getAssetsRates,
  getFromToken,
  getUSDConversionRate,
  getMultichainCoinRates,
  getConversionRate,
  (state) => state.bridge.fromTokenExchangeRate,
  (
    fromChain,
    marketData,
    assetsRates,
    fromToken,
    nativeToUsdRate,
    nonEvmNativeConversionRate,
    nativeToCurrencyRate,
    fromTokenExchangeRate,
  ) => {
    if (fromChain?.chainId && fromToken) {
      if (fromChain.chainId === MultichainNetworks.SOLANA) {
        // For SOLANA tokens, we use the conversion rates provided by the multichain rates controller
        const tokenToNativeAssetRate = tokenPriceInNativeAsset(
          assetsRates[fromToken.address]?.rate,
          nonEvmNativeConversionRate?.sol?.conversionRate,
        );
        return exchangeRatesFromNativeAndCurrencyRates(
          tokenToNativeAssetRate,
          nonEvmNativeConversionRate?.sol?.conversionRate,
          nonEvmNativeConversionRate?.sol?.usdConversionRate,
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
  getToChain,
  getMarketData,
  getAssetsRates, // multichain equivalent of getMarketData
  getToToken,
  getNetworkConfigurationsByChainId,
  (state) => ({
    state,
    toTokenExchangeRate: state.bridge.toTokenExchangeRate,
    toTokenUsdExchangeRate: state.bridge.toTokenUsdExchangeRate,
  }),
  getMultichainCoinRates, // multichain native rates
  (
    toChain,
    marketData,
    assetsRates,
    toToken,
    allNetworksByChainId,
    { state, toTokenExchangeRate, toTokenUsdExchangeRate },
    nonEvmNativeConversionRate,
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
      if (toChain.chainId === MultichainNetworks.SOLANA) {
        // For SOLANA tokens, we use the conversion rates provided by the multichain rates controller
        const tokenToNativeAssetRate = tokenPriceInNativeAsset(
          assetsRates[toToken.address]?.rate,
          nonEvmNativeConversionRate.sol.conversionRate,
        );
        return exchangeRatesFromNativeAndCurrencyRates(
          tokenToNativeAssetRate,
          nonEvmNativeConversionRate.sol.conversionRate,
          nonEvmNativeConversionRate.sol.usdConversionRate,
        );
      }

      const { chainId } = toChain;

      const nativeToCurrencyRate = selectConversionRateByChainId(
        state,
        chainId,
      );
      const nativeToUsdRate = getUSDConversionRateByChainId(chainId)(state);
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

const _getQuotesWithMetadata = createSelector(
  (state: BridgeAppState) => state.metamask.bridgeState.quotes,
  getToTokenConversionRate,
  getFromTokenConversionRate,
  getConversionRate,
  getMultichainCoinRates,
  getUSDConversionRate,
  _getBridgeFeesPerGas,
  (
    quotes,
    toTokenExchangeRate,
    fromTokenExchangeRate,
    nativeToDisplayCurrencyExchangeRate,
    nonEvmNativeConversionRate,
    nativeToUsdExchangeRate,
    {
      estimatedBaseFeeInDecGwei,
      maxPriorityFeePerGasInDecGwei,
      maxFeePerGasInDecGwei,
    },
  ): (QuoteResponse & QuoteMetadata)[] => {
    const newQuotes = quotes.map((quote: QuoteResponse & SolanaFees) => {
      const isSolanaQuote =
        formatChainIdToCaip(quote.quote.srcChainId) ===
          MultichainNetworks.SOLANA && quote.solanaFeesInLamports;

      const toTokenAmount = calcToAmount(
        quote.quote,
        toTokenExchangeRate.valueInCurrency,
        toTokenExchangeRate.usd,
      );
      let totalEstimatedNetworkFee, gasFee, totalMaxNetworkFee;
      if (isSolanaQuote) {
        totalEstimatedNetworkFee = calcSolanaTotalNetworkFee(
          quote,
          nonEvmNativeConversionRate.sol.conversionRate,
          nonEvmNativeConversionRate.sol.usdConversionRate,
        );
        gasFee = totalEstimatedNetworkFee;
        totalMaxNetworkFee = totalEstimatedNetworkFee;
      } else {
        gasFee = calcEstimatedAndMaxTotalGasFee({
          bridgeQuote: quote,
          estimatedBaseFeeInDecGwei,
          maxFeePerGasInDecGwei,
          maxPriorityFeePerGasInDecGwei,
          nativeToDisplayCurrencyExchangeRate,
          nativeToUsdExchangeRate,
        });
        const relayerFee = calcRelayerFee(
          quote,
          nativeToDisplayCurrencyExchangeRate,
          nativeToUsdExchangeRate,
        );
        totalEstimatedNetworkFee = {
          amount: gasFee.amount.plus(relayerFee.amount),
          valueInCurrency:
            gasFee.valueInCurrency?.plus(relayerFee.valueInCurrency || '0') ??
            null,
          usd: gasFee.usd?.plus(relayerFee.usd || '0') ?? null,
        };
        totalMaxNetworkFee = {
          amount: gasFee.amountMax.plus(relayerFee.amount),
          valueInCurrency:
            gasFee.valueInCurrencyMax?.plus(
              relayerFee.valueInCurrency || '0',
            ) ?? null,
          usd: gasFee.usdMax?.plus(relayerFee.usd || '0') ?? null,
        };
      }

      const sentAmount = calcSentAmount(
        quote.quote,
        fromTokenExchangeRate.valueInCurrency,
        fromTokenExchangeRate.usd,
      );
      const adjustedReturn = calcAdjustedReturn(
        toTokenAmount,
        totalEstimatedNetworkFee,
      );
      return {
        ...quote,
        // QuoteMetadata fields
        toTokenAmount,
        sentAmount,
        totalNetworkFee: totalEstimatedNetworkFee,
        totalMaxNetworkFee,
        adjustedReturn,
        gasFee,
        swapRate: calcSwapRate(sentAmount.amount, toTokenAmount.amount),
        cost: calcCost(adjustedReturn, sentAmount),
      };
    });

    return newQuotes;
  },
);

const _getSortedQuotesWithMetadata = createSelector(
  _getQuotesWithMetadata,
  getBridgeSortOrder,
  (quotesWithMetadata, sortOrder) => {
    switch (sortOrder) {
      case SortOrder.ETA_ASC:
        return orderBy(
          quotesWithMetadata,
          (quote) => quote.estimatedProcessingTimeInSeconds,
          'asc',
        );
      default:
        return orderBy(
          quotesWithMetadata,
          ({ cost }) => cost.valueInCurrency?.toNumber(),
          'asc',
        );
    }
  },
);

// Generates a pseudo-unique string that identifies each quote
// by aggregator, bridge, steps and value
const _getQuoteIdentifier = ({ quote }: QuoteResponse & L1GasFees) =>
  `${quote.bridgeId}-${quote.bridges[0]}-${quote.steps.length}`;

const _getSelectedQuote = createSelector(
  (state: BridgeAppState) => state.metamask.bridgeState.quotesRefreshCount,
  (state: BridgeAppState) => state.bridge.selectedQuote,
  _getSortedQuotesWithMetadata,
  (quotesRefreshCount, selectedQuote, sortedQuotesWithMetadata) =>
    quotesRefreshCount <= 1
      ? selectedQuote
      : // Find match for selectedQuote in new quotes
        sortedQuotesWithMetadata.find((quote) =>
          selectedQuote
            ? _getQuoteIdentifier(quote) === _getQuoteIdentifier(selectedQuote)
            : false,
        ),
);

export const getBridgeQuotes = createSelector(
  [
    _getSortedQuotesWithMetadata,
    _getSelectedQuote,
    (state) => state.metamask.bridgeState.quotesLastFetched,
    (state) =>
      state.metamask.bridgeState.quotesLoadingStatus === RequestStatus.LOADING,
    (state: BridgeAppState) => state.metamask.bridgeState.quotesRefreshCount,
    (state: BridgeAppState) => state.metamask.bridgeState.quotesInitialLoadTime,
    (state: BridgeAppState) => state.metamask.bridgeState.quoteFetchError,
    getBridgeQuotesConfig,
    getQuoteRequest,
  ],
  (
    sortedQuotesWithMetadata,
    selectedQuote,
    quotesLastFetchedMs,
    isLoading,
    quotesRefreshCount,
    quotesInitialLoadTimeMs,
    quoteFetchError,
    { maxRefreshCount },
    { insufficientBal },
  ) => ({
    sortedQuotes: sortedQuotesWithMetadata,
    recommendedQuote: sortedQuotesWithMetadata[0],
    activeQuote: selectedQuote ?? sortedQuotesWithMetadata[0],
    quotesLastFetchedMs,
    isLoading,
    quoteFetchError,
    quotesRefreshCount,
    quotesInitialLoadTimeMs,
    isQuoteGoingToRefresh: insufficientBal
      ? false
      : quotesRefreshCount < maxRefreshCount,
  }),
);

export const getIsBridgeTx = createDeepEqualSelector(
  getFromChain,
  getToChain,
  (state: BridgeAppState) => getIsBridgeEnabled(state),
  (fromChain, toChain, isBridgeEnabled: boolean) =>
    isBridgeEnabled && toChain && fromChain?.chainId
      ? fromChain.chainId !== toChain.chainId
      : false,
);

const _getValidatedSrcAmount = createSelector(
  getFromToken,
  (state: BridgeAppState) =>
    state.metamask.bridgeState.quoteRequest.srcTokenAmount,
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
      if (fromTokenToCurrencyExchangeRate && fromTokenToUsdExchangeRate) {
        return {
          valueInCurrency: new BigNumber(validatedSrcAmount).mul(
            new BigNumber(fromTokenToCurrencyExchangeRate.toString() ?? 1),
          ),
          usd: new BigNumber(validatedSrcAmount).mul(
            new BigNumber(fromTokenToUsdExchangeRate.toString() ?? 1),
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

export const getValidationErrors = createDeepEqualSelector(
  getBridgeQuotes,
  _getValidatedSrcAmount,
  getFromToken,
  getFromAmount,
  (
    { activeQuote, quotesLastFetchedMs, isLoading },
    validatedSrcAmount,
    fromToken,
    fromTokenInputValue,
  ) => {
    return {
      isNoQuotesAvailable: Boolean(
        !activeQuote && quotesLastFetchedMs && !isLoading,
      ),
      // Shown prior to fetching quotes
      isInsufficientGasBalance: (balance?: BigNumber) => {
        if (balance && !activeQuote && validatedSrcAmount && fromToken) {
          return isNativeAddress(fromToken.address)
            ? balance.eq(validatedSrcAmount)
            : balance.lte(0);
        }
        return false;
      },
      // Shown after fetching quotes
      isInsufficientGasForQuote: (balance?: BigNumber) => {
        if (balance && activeQuote && fromToken && fromTokenInputValue) {
          return isNativeAddress(fromToken.address)
            ? balance
                .sub(activeQuote.totalMaxNetworkFee.amount)
                .sub(activeQuote.sentAmount.amount)
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
          ? activeQuote.adjustedReturn.valueInCurrency.lt(
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
 * Checks if Solana is enabled as either a fromChain or toChain for bridging
 */
export const isBridgeSolanaEnabled = createDeepEqualSelector(
  (state: BridgeAppState) => state.metamask.bridgeState?.bridgeFeatureFlags,
  (bridgeFeatureFlags) => {
    const solanaChainId = MultichainNetworks.SOLANA;
    const solanaChainIdCaip = formatChainIdToCaip(solanaChainId);

    // Directly check if Solana is enabled as a source or destination chain
    const solanaConfig =
      bridgeFeatureFlags?.[BridgeFeatureFlagsKey.EXTENSION_CONFIG]?.chains?.[
        solanaChainIdCaip
      ];
    return Boolean(solanaConfig?.isActiveSrc || solanaConfig?.isActiveDest);
  },
);

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

    const isSolanaDestination =
      formatChainIdToCaip(toChain.chainId) === MultichainNetworks.SOLANA;

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

    const fromChainIsSolana =
      formatChainIdToCaip(fromChain.chainId) === MultichainNetworks.SOLANA;
    const toChainIsSolana =
      formatChainIdToCaip(toChain.chainId) === MultichainNetworks.SOLANA;

    // Only return true if either chain is Solana and the other is EVM
    return toChainIsSolana !== fromChainIsSolana;
  },
);
