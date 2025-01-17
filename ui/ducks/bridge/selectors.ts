import type {
  AddNetworkFields,
  NetworkConfiguration,
  NetworkState,
} from '@metamask/network-controller';
import { orderBy, uniqBy } from 'lodash';
import { createSelector } from 'reselect';
import type { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { BigNumber } from 'bignumber.js';
import { calcTokenAmount } from '@metamask/notification-services-controller/push-services';
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
import type { BridgeControllerState } from '../../../shared/types/bridge';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../shared/constants/swaps';
import {
  getProviderConfig,
  getNetworkConfigurationsByChainId,
} from '../../../shared/modules/selectors/networks';
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
  isNativeAddress,
} from '../../pages/bridge/utils/quote';
import { AssetType } from '../../../shared/constants/transaction';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  FEATURED_RPCS,
} from '../../../shared/constants/network';
import {
  exchangeRatesFromNativeAndCurrencyRates,
  exchangeRateFromMarketData,
  tokenPriceInNativeAsset,
} from './utils';
import type { BridgeState } from './bridge';

type BridgeAppState = {
  metamask: { bridgeState: BridgeControllerState } & NetworkState & {
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

// only includes networks user has added
export const getAllBridgeableNetworks = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  (networkConfigurationsByChainId) => {
    return uniqBy(
      Object.values(networkConfigurationsByChainId),
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
  (allBridgeableNetworks, bridgeFeatureFlags) =>
    allBridgeableNetworks.filter(
      ({ chainId }) =>
        bridgeFeatureFlags[BridgeFeatureFlagsKey.EXTENSION_CONFIG].chains[
          chainId
        ]?.isActiveSrc,
    ),
);

export const getFromChain = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  getProviderConfig,
  (
    networkConfigurationsByChainId,
    providerConfig,
  ): NetworkConfiguration | undefined =>
    providerConfig?.chainId
      ? networkConfigurationsByChainId[providerConfig.chainId]
      : undefined,
);

export const getToChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  (state: BridgeAppState) => state.metamask.bridgeState?.bridgeFeatureFlags,
  (
    allBridgeableNetworks,
    bridgeFeatureFlags,
  ): (AddNetworkFields | NetworkConfiguration)[] =>
    uniqBy([...allBridgeableNetworks, ...FEATURED_RPCS], 'chainId').filter(
      ({ chainId }) =>
        bridgeFeatureFlags[BridgeFeatureFlagsKey.EXTENSION_CONFIG].chains[
          chainId
        ]?.isActiveDest,
    ),
);

export const getToChain = createDeepEqualSelector(
  getToChains,
  (state: BridgeAppState) => state.bridge.toChainId,
  (toChains, toChainId): NetworkConfiguration | AddNetworkFields | undefined =>
    toChains.find(({ chainId }) => chainId === toChainId),
);

export const getToTokens = createDeepEqualSelector(
  (state: BridgeAppState) => state.metamask.bridgeState.destTokens,
  (state: BridgeAppState) => state.metamask.bridgeState.destTopAssets,
  (state: BridgeAppState) =>
    state.metamask.bridgeState.destTokensLoadingStatus ===
    RequestStatus.LOADING,
  (toTokens, toTopAssets, isLoading) => {
    return {
      isLoading,
      toTokens: toTokens ?? {},
      toTopAssets: toTopAssets ?? [],
    };
  },
);

export const getFromToken = createSelector(
  (state: BridgeAppState) => state.bridge.fromToken,
  getFromChain,
  (fromToken, fromChain): BridgeToken => {
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
      chainId: fromChain.chainId,
      image:
        CHAIN_ID_TOKEN_IMAGE_MAP[
          fromChain.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
        ],
      balance: '0',
      string: '0',
      type: AssetType.native,
    };
  },
);

export const getToToken = (state: BridgeAppState): BridgeToken => {
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
  getFromToken,
  getUSDConversionRate,
  getConversionRate,
  (state) => state.bridge.fromTokenExchangeRate,
  (
    fromChain,
    marketData,
    fromToken,
    nativeToUsdRate,
    nativeToCurrencyRate,
    fromTokenExchangeRate,
  ) => {
    if (fromChain?.chainId && fromToken && marketData) {
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
  getToToken,
  getNetworkConfigurationsByChainId,
  (state) => ({
    state,
    toTokenExchangeRate: state.bridge.toTokenExchangeRate,
    toTokenUsdExchangeRate: state.bridge.toTokenUsdExchangeRate,
  }),
  (
    toChain,
    marketData,
    toToken,
    allNetworksByChainId,
    { state, toTokenExchangeRate, toTokenUsdExchangeRate },
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
    if (toChain?.chainId && toToken && marketData) {
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
  _getBridgeFeesPerGas,
  (
    quotes,
    toTokenExchangeRate,
    fromTokenExchangeRate,
    nativeExchangeRate,
    {
      estimatedBaseFeeInDecGwei,
      maxPriorityFeePerGasInDecGwei,
      maxFeePerGasInDecGwei,
    },
  ): (QuoteResponse & QuoteMetadata)[] => {
    const newQuotes = quotes.map((quote: QuoteResponse) => {
      const toTokenAmount = calcToAmount(
        quote.quote,
        toTokenExchangeRate.valueInCurrency,
      );
      const gasFee = calcEstimatedAndMaxTotalGasFee({
        bridgeQuote: quote,
        estimatedBaseFeeInDecGwei,
        maxFeePerGasInDecGwei,
        maxPriorityFeePerGasInDecGwei,
        nativeExchangeRate,
      });
      const relayerFee = calcRelayerFee(quote, nativeExchangeRate);
      const totalEstimatedNetworkFee = {
        amount: gasFee.amount.plus(relayerFee.amount),
        valueInCurrency:
          gasFee.valueInCurrency?.plus(relayerFee.valueInCurrency || '0') ??
          null,
      };
      const totalMaxNetworkFee = {
        amount: gasFee.amountMax.plus(relayerFee.amount),
        valueInCurrency:
          gasFee.valueInCurrencyMax?.plus(relayerFee.valueInCurrency || '0') ??
          null,
      };

      const sentAmount = calcSentAmount(
        quote.quote,
        fromTokenExchangeRate.valueInCurrency,
      );
      const adjustedReturn = calcAdjustedReturn(
        toTokenAmount.valueInCurrency,
        totalEstimatedNetworkFee.valueInCurrency,
      );

      return {
        ...quote,
        toTokenAmount,
        sentAmount,
        totalNetworkFee: totalEstimatedNetworkFee,
        totalMaxNetworkFee,
        adjustedReturn,
        gasFee,
        swapRate: calcSwapRate(sentAmount.amount, toTokenAmount.amount),
        cost: calcCost(
          adjustedReturn.valueInCurrency,
          sentAmount.valueInCurrency,
        ),
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
    { valueInCurrency: fromTokenToCurrencyExchangeRate },
  ) => {
    if (fromToken?.symbol && fromChain?.chainId && validatedSrcAmount) {
      if (fromTokenToCurrencyExchangeRate) {
        return new BigNumber(validatedSrcAmount).mul(
          new BigNumber(fromTokenToCurrencyExchangeRate.toString() ?? 1),
        );
      }
    }
    return new BigNumber(0);
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
                BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
              ).times(activeQuote.sentAmount.valueInCurrency),
            )
          : false,
    };
  },
);

export const getWasTxDeclined = (state: BridgeAppState): boolean => {
  return state.bridge.wasTxDeclined;
};
