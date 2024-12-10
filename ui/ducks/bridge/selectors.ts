import { NetworkConfiguration } from '@metamask/network-controller';
import { orderBy, uniqBy } from 'lodash';
import { createSelector } from 'reselect';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { BigNumber } from 'bignumber.js';
import {
  getIsBridgeEnabled,
  getSwapsDefaultToken,
  SwapsEthToken,
} from '../../selectors/selectors';
import {
  ALLOWED_BRIDGE_CHAIN_IDS,
  BRIDGE_PREFERRED_GAS_ESTIMATE,
  BRIDGE_QUOTE_MAX_ETA_SECONDS,
  BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
} from '../../../shared/constants/bridge';
import {
  BridgeFeatureFlagsKey,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/bridge/types';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import {
  getProviderConfig,
  getNetworkConfigurationsByChainId,
} from '../../../shared/modules/selectors/networks';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import { getConversionRate, getGasFeeEstimates } from '../metamask/metamask';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { RequestStatus } from '../../../app/scripts/controllers/bridge/constants';
import {
  L1GasFees,
  QuoteMetadata,
  QuoteResponse,
  SortOrder,
} from '../../pages/bridge/types';
import {
  calcAdjustedReturn,
  calcCost,
  calcRelayerFee,
  calcSentAmount,
  calcSwapRate,
  calcToAmount,
  calcTotalGasFee,
  isNativeAddress,
} from '../../pages/bridge/utils/quote';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import { MetaMaskReduxState } from '../../store/store';

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
  (state: MetaMaskReduxState) =>
    state.metamask.BridgeController.bridgeState?.bridgeFeatureFlags,
  (allBridgeableNetworks, bridgeFeatureFlags) =>
    allBridgeableNetworks.filter(({ chainId }) =>
      bridgeFeatureFlags[BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST].includes(
        chainId,
      ),
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
  getFromChain,
  getAllBridgeableNetworks,
  (state) => state.metamask.BridgeController.bridgeState?.bridgeFeatureFlags,
  (
    fromChain,
    allBridgeableNetworks,
    bridgeFeatureFlags,
  ): NetworkConfiguration[] =>
    allBridgeableNetworks.filter(
      ({ chainId }) =>
        fromChain?.chainId &&
        chainId !== fromChain.chainId &&
        bridgeFeatureFlags[
          BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST
        ].includes(chainId),
    ),
);

export const getToChain = createDeepEqualSelector(
  getToChains,
  (state: MetaMaskReduxState) => state.bridge.toChainId,
  (toChains, toChainId): NetworkConfiguration | undefined =>
    toChains.find(({ chainId }) => chainId === toChainId),
);

export const getFromTokens = (state: MetaMaskReduxState) => {
  return state.metamask.BridgeController.bridgeState.srcTokens ?? {};
};

export const getFromTopAssets = (state: MetaMaskReduxState) => {
  return state.metamask.BridgeController.bridgeState.srcTopAssets ?? [];
};

export const getToTopAssets = (state: MetaMaskReduxState) => {
  return state.bridge.toChainId
    ? state.metamask.BridgeController.bridgeState.destTopAssets
    : [];
};

export const getToTokens = (state: MetaMaskReduxState) => {
  return state.bridge.toChainId
    ? state.metamask.BridgeController.bridgeState.destTokens
    : {};
};

export const getFromToken = (
  state: MetaMaskReduxState,
): SwapsTokenObject | SwapsEthToken | null => {
  return state.bridge.fromToken?.address
    ? state.bridge.fromToken
    : getSwapsDefaultToken(state);
};

export const getToToken = (
  state: MetaMaskReduxState,
): SwapsTokenObject | SwapsEthToken | null => {
  return state.bridge.toToken;
};

export const getFromAmount = (state: MetaMaskReduxState): string | null =>
  state.bridge.fromTokenInputValue;

export const getQuoteRequest = (state: MetaMaskReduxState) => {
  const { quoteRequest } = state.metamask.BridgeController.bridgeState;
  return quoteRequest;
};

export const getBridgeQuotesConfig = (state: MetaMaskReduxState) =>
  state.metamask.BridgeController.bridgeState?.bridgeFeatureFlags[
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
    maxFeePerGas: decGWEIToHexWEI(
      (gasFeeEstimates as GasFeeEstimates)?.high?.suggestedMaxFeePerGas,
    ),
    maxPriorityFeePerGas: decGWEIToHexWEI(
      (gasFeeEstimates as GasFeeEstimates)?.high?.suggestedMaxPriorityFeePerGas,
    ),
  }),
);

export const getBridgeSortOrder = (state: MetaMaskReduxState) =>
  state.bridge.sortOrder;

// A dest network can be selected before it's imported
// The cached exchange rate won't be available so the rate from the bridge state is used
const _getToTokenExchangeRate = createSelector(
  (state) => state.metamask.CurrencyController.currencyRates,
  (state: MetaMaskReduxState) => state.bridge.toTokenExchangeRate,
  getToChain,
  getToToken,
  (cachedCurrencyRates, toTokenExchangeRate, toChain, toToken) => {
    return (
      toTokenExchangeRate ??
      (isNativeAddress(toToken?.address) && toChain?.nativeCurrency
        ? cachedCurrencyRates[toChain.nativeCurrency]?.conversionRate
        : null)
    );
  },
);

const _getQuotesWithMetadata = createDeepEqualSelector(
  (state) => state.metamask.BridgeController.bridgeState.quotes,
  _getToTokenExchangeRate,
  (state: MetaMaskReduxState) => state.bridge.fromTokenExchangeRate,
  getConversionRate,
  _getBridgeFeesPerGas,
  (
    quotes,
    toTokenExchangeRate,
    fromTokenExchangeRate,
    nativeExchangeRate,
    { estimatedBaseFeeInDecGwei, maxPriorityFeePerGasInDecGwei },
  ): (QuoteResponse & QuoteMetadata)[] => {
    const newQuotes = quotes.map((quote: QuoteResponse) => {
      const toTokenAmount = calcToAmount(quote.quote, toTokenExchangeRate);
      const gasFee = calcTotalGasFee(
        quote,
        estimatedBaseFeeInDecGwei,
        maxPriorityFeePerGasInDecGwei,
        nativeExchangeRate ?? undefined,
      );
      const relayerFee = calcRelayerFee(quote, nativeExchangeRate ?? undefined);
      const totalNetworkFee = {
        amount: gasFee.amount.plus(relayerFee.amount),
        fiat: gasFee.fiat?.plus(relayerFee.fiat || '0') ?? null,
      };
      const sentAmount = calcSentAmount(
        quote.quote,
        isNativeAddress(quote.quote.srcAsset.address)
          ? nativeExchangeRate
          : fromTokenExchangeRate,
      );
      const adjustedReturn = calcAdjustedReturn(
        toTokenAmount.fiat,
        totalNetworkFee.fiat,
      );

      return {
        ...quote,
        toTokenAmount,
        sentAmount,
        totalNetworkFee,
        adjustedReturn,
        gasFee,
        swapRate: calcSwapRate(sentAmount.amount, toTokenAmount.amount),
        cost: calcCost(adjustedReturn.fiat, sentAmount.fiat),
      };
    });

    return newQuotes;
  },
);

const _getSortedQuotesWithMetadata = createDeepEqualSelector(
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
      case SortOrder.COST_ASC:
      default:
        return orderBy(quotesWithMetadata, ({ cost }) => cost.fiat, 'asc');
    }
  },
);

const _getRecommendedQuote = createDeepEqualSelector(
  _getSortedQuotesWithMetadata,
  getBridgeSortOrder,
  (sortedQuotesWithMetadata, sortOrder) => {
    if (!sortedQuotesWithMetadata.length) {
      return undefined;
    }

    const bestReturnValue = BigNumber.max(
      sortedQuotesWithMetadata.map(
        ({ adjustedReturn }) => adjustedReturn.fiat ?? 0,
      ),
    );

    const isFastestQuoteValueReasonable = (
      adjustedReturnInFiat: BigNumber | null,
    ) =>
      adjustedReturnInFiat
        ? adjustedReturnInFiat
            .div(bestReturnValue)
            .gte(BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE)
        : true;

    const isBestPricedQuoteETAReasonable = (
      estimatedProcessingTimeInSeconds: number,
    ) => estimatedProcessingTimeInSeconds < BRIDGE_QUOTE_MAX_ETA_SECONDS;

    return (
      sortedQuotesWithMetadata.find((quote) => {
        return sortOrder === SortOrder.ETA_ASC
          ? isFastestQuoteValueReasonable(quote.adjustedReturn.fiat)
          : isBestPricedQuoteETAReasonable(
              quote.estimatedProcessingTimeInSeconds,
            );
      }) ?? sortedQuotesWithMetadata[0]
    );
  },
);

// Generates a pseudo-unique string that identifies each quote
// by aggregator, bridge, steps and value
const _getQuoteIdentifier = ({ quote }: QuoteResponse & L1GasFees) =>
  `${quote.bridgeId}-${quote.bridges[0]}-${quote.steps.length}`;

const _getSelectedQuote = createSelector(
  (state: MetaMaskReduxState) =>
    state.metamask.BridgeController.bridgeState.quotesRefreshCount,
  (state: MetaMaskReduxState) => state.bridge.selectedQuote,
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
  _getSortedQuotesWithMetadata,
  _getRecommendedQuote,
  _getSelectedQuote,
  (state) => state.metamask.BridgeController.bridgeState.quotesLastFetched,
  (state) =>
    state.metamask.BridgeController.bridgeState.quotesLoadingStatus ===
    RequestStatus.LOADING,
  (state: MetaMaskReduxState) =>
    state.metamask.BridgeController.bridgeState.quotesRefreshCount,
  getBridgeQuotesConfig,
  getQuoteRequest,
  (
    sortedQuotesWithMetadata,
    recommendedQuote,
    selectedQuote,
    quotesLastFetchedMs,
    isLoading,
    quotesRefreshCount,
    { maxRefreshCount },
    { insufficientBal },
  ) => ({
    sortedQuotes: sortedQuotesWithMetadata,
    recommendedQuote,
    activeQuote: selectedQuote ?? recommendedQuote,
    quotesLastFetchedMs,
    isLoading,
    quotesRefreshCount,
    isQuoteGoingToRefresh: insufficientBal
      ? false
      : quotesRefreshCount < maxRefreshCount,
  }),
);

export const getIsBridgeTx = createDeepEqualSelector(
  getFromChain,
  getToChain,
  (state: MetaMaskReduxState) => getIsBridgeEnabled(state),
  (fromChain, toChain, isBridgeEnabled: boolean) =>
    isBridgeEnabled && toChain && fromChain?.chainId
      ? fromChain.chainId !== toChain.chainId
      : false,
);
