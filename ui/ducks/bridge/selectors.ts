import {
  NetworkConfiguration,
  NetworkState,
} from '@metamask/network-controller';
import { orderBy, uniqBy } from 'lodash';
import { createSelector } from 'reselect';
import { add0x } from '@metamask/utils';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { BigNumber } from 'bignumber.js';
import { zeroAddress } from 'ethereumjs-util';
import {
  getNetworkConfigurationsByChainId,
  getIsBridgeEnabled,
  getCurrentCurrency,
} from '../../selectors/selectors';
import {
  ALLOWED_BRIDGE_CHAIN_IDS,
  BRIDGE_MIN_FIAT_SRC_AMOUNT,
  BRIDGE_QUOTE_MAX_ETA_SECONDS as MAX_ETA_SECONDS,
  BRIDGE_QUOTE_MAXRETURN_VALUE_DIFFERENCE_PERCENTAGE as MAX_RETURN_VALUE_DIFF_PERCENTAGE,
} from '../../../shared/constants/bridge';
import {
  BridgeControllerState,
  BridgeFeatureFlagsKey,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/bridge/types';
import { createDeepEqualSelector } from '../../selectors/util';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../shared/constants/swaps';
import {
  getConversionRate,
  getGasFeeEstimates,
  getProviderConfig,
} from '../metamask/metamask';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { RequestStatus } from '../../../app/scripts/controllers/bridge/constants';
import {
  BridgeToken,
  QuoteMetadata,
  QuoteResponse,
  SortOrder,
} from '../../pages/bridge/types';
import {
  calcAdjustedReturn,
  calcCost,
  calcSentAmount,
  calcSwapRate,
  calcToAmount,
  calcTotalNetworkFee,
} from '../../pages/bridge/utils/quote';
import {
  decEthToConvertedCurrency,
  decGWEIToHexWEI,
} from '../../../shared/modules/conversion.utils';
import { BridgeState } from './bridge';

export type BridgeAppState = {
  metamask: NetworkState & { bridgeState: BridgeControllerState } & {
    useExternalServices: boolean;
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
  (state: BridgeAppState) => state.metamask.bridgeState?.bridgeFeatureFlags,
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
  (state: BridgeAppState) => state.bridge.toChainId,
  (toChains, toChainId): NetworkConfiguration | undefined =>
    toChains.find(({ chainId }) => chainId === toChainId),
);

export const getApprovalGasMultipliers = (state: BridgeAppState) => {
  return (
    state.metamask.bridgeState.bridgeFeatureFlags.approvalGasMultiplier ?? {}
  );
};

export const getBridgeGasMultipliers = (state: BridgeAppState) => {
  return (
    state.metamask.bridgeState.bridgeFeatureFlags.bridgeGasMultiplier ?? {}
  );
};

export const getFromTokens = (state: BridgeAppState) => {
  return state.metamask.bridgeState.srcTokens ?? {};
};

export const getFromTopAssets = (state: BridgeAppState) => {
  return state.metamask.bridgeState.srcTopAssets ?? [];
};

export const getToTopAssets = (state: BridgeAppState) => {
  return state.bridge.toChainId ? state.metamask.bridgeState.destTopAssets : [];
};

export const getToTokens = (state: BridgeAppState) => {
  return state.bridge.toChainId ? state.metamask.bridgeState.destTokens : {};
};

export const getFromToken = createSelector(
  (state: BridgeAppState) => state.bridge.fromToken,
  getFromChain,
  (fromToken, fromChain): BridgeToken | null => {
    if (!fromChain?.chainId) {
      return null;
    }
    return fromToken?.address
      ? fromToken
      : SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
          fromChain.chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
        ];
  },
);

export const getToToken = (state: BridgeAppState): BridgeToken | null => {
  return state.bridge.toToken;
};

export const getFromAmount = (state: BridgeAppState): string | null =>
  state.bridge.fromTokenInputValue;

export const getSlippage = (state: BridgeAppState) => state.bridge.slippage;

export const getBridgeFeesPerGas = createSelector(
  getGasFeeEstimates,
  (gasFeeEstimates) => ({
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

const _getSelectedQuote = (state: BridgeAppState) => state.bridge.selectedQuote;

const _getQuotesWithMetadata = createDeepEqualSelector(
  (state) => state.metamask.bridgeState.quotes,
  _getSelectedQuote,
  (state: BridgeAppState) => state.bridge.toTokenExchangeRate,
  (state: BridgeAppState) => state.bridge.toNativeExchangeRate,
  (state: BridgeAppState) => state.bridge.fromTokenExchangeRate,
  (state: BridgeAppState) => state.bridge.fromNativeExchangeRate,
  getBridgeFeesPerGas,
  (
    quotes,
    selectedQuote,
    toTokenExchangeRate,
    toNativeExchangeRate,
    fromTokenExchangeRate,
    fromNativeExchangeRate,
    { maxFeePerGas, maxPriorityFeePerGas },
  ): (QuoteResponse & QuoteMetadata)[] => {
    const newQuotes = quotes.map((quote: QuoteResponse) => {
      const toTokenAmount = calcToAmount(
        quote.quote,
        toTokenExchangeRate,
        toNativeExchangeRate,
      );
      const totalNetworkFee = calcTotalNetworkFee(
        quote,
        add0x(maxFeePerGas),
        add0x(maxPriorityFeePerGas),
        fromNativeExchangeRate || undefined,
      );
      const sentAmount = calcSentAmount(
        quote.quote,
        fromTokenExchangeRate,
        fromNativeExchangeRate,
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
        swapRate: calcSwapRate(sentAmount.raw, toTokenAmount.raw),
        cost: calcCost(adjustedReturn.fiat, sentAmount.fiat),
      };
    });
    // TODO if quote is exactly the same excluding requestId, dedupe it as well and replace with new one
    return selectedQuote
      ? uniqBy(newQuotes.concat(selectedQuote), 'quote.requestId')
      : newQuotes;
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
      case SortOrder.ADJUSTED_RETURN_DESC:
      default:
        return orderBy(
          quotesWithMetadata,
          ({ adjustedReturn }) => adjustedReturn.fiat,
          'desc',
        );
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
            .gte(MAX_RETURN_VALUE_DIFF_PERCENTAGE)
        : true;

    const isBestPricedQuoteETAReasonable = (
      estimatedProcessingTimeInSeconds: number,
    ) => estimatedProcessingTimeInSeconds < MAX_ETA_SECONDS;

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

export const getBridgeQuotes = createSelector(
  _getSortedQuotesWithMetadata,
  _getRecommendedQuote,
  _getSelectedQuote,
  (state) => state.metamask.bridgeState.quotesLastFetched,
  (state) =>
    state.metamask.bridgeState.quotesLoadingStatus === RequestStatus.LOADING,
  (
    sortedQuotesWithMetadata,
    recommendedQuote,
    selectedQuote,
    quotesLastFetchedMs,
    isLoading,
  ) => ({
    sortedQuotes: sortedQuotesWithMetadata,
    recommendedQuote,
    activeQuote: selectedQuote ?? recommendedQuote,
    quotesLastFetchedMs,
    isLoading,
  }),
);

export const getQuoteRequest = (state: BridgeAppState) => {
  const { quoteRequest } = state.metamask.bridgeState;
  return quoteRequest;
};

export const getFromAmountInFiat = createSelector(
  getFromToken,
  getFromChain,
  getFromAmount,
  (state: BridgeAppState) => state.bridge.fromTokenExchangeRate,
  (state: BridgeAppState) => state.bridge.fromNativeExchangeRate,
  getConversionRate,
  getCurrentCurrency,
  (
    fromToken,
    fromChain,
    fromAmount,
    fromTokenExchangeRate,
    fromNativeExchangeRate,
    cachedFromNativeExchangeRate,
    currentCurrency,
  ) => {
    const nativeExchangeRate =
      fromNativeExchangeRate ?? cachedFromNativeExchangeRate;
    if (
      fromToken?.symbol &&
      fromChain?.chainId &&
      fromAmount &&
      nativeExchangeRate
    ) {
      if (fromToken.address === zeroAddress()) {
        return new BigNumber(
          decEthToConvertedCurrency(
            fromAmount,
            currentCurrency,
            nativeExchangeRate,
          ).toString(),
        );
      }
      if (fromTokenExchangeRate) {
        return new BigNumber(fromAmount).mul(
          new BigNumber(fromTokenExchangeRate.toString() ?? 1),
        );
      }
    }
    return new BigNumber(0);
  },
);

export const getValidationErrors = createDeepEqualSelector(
  getBridgeQuotes,
  getFromAmountInFiat,
  getFromAmount,
  (
    { activeQuote, quotesLastFetchedMs, isLoading },
    fromAmountInFiat,
    fromAmount,
  ) => {
    return {
      isNoQuotesAvailable: !activeQuote && quotesLastFetchedMs && !isLoading,
      isSrcAmountLessThan30:
        activeQuote?.sentAmount.fiat?.lt(30) &&
        activeQuote?.sentAmount.fiat?.gt(BRIDGE_MIN_FIAT_SRC_AMOUNT),
      isSrcAmountTooLow:
        fromAmount && fromAmountInFiat.lte(BRIDGE_MIN_FIAT_SRC_AMOUNT),
      isInsufficientBalance: (balance?: BigNumber) =>
        fromAmount && balance !== undefined ? balance.lt(fromAmount) : false,
    };
  },
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
