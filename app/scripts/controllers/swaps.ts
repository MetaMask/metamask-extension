import { Contract } from '@ethersproject/contracts';
import {
  ExternalProvider,
  JsonRpcFetchFunc,
  Web3Provider,
} from '@ethersproject/providers';
import type { ChainId } from '@metamask/controller-utils';
import { GasFeeState } from '@metamask/gas-fee-controller';
import { ProviderConfig } from '@metamask/network-controller';
import { ObservableStore } from '@metamask/obs-store';
import { TransactionParams } from '@metamask/transaction-controller';
import { captureException } from '@sentry/browser';
import { BigNumber } from 'bignumber.js';
import abi from 'human-standard-token-abi';
import { cloneDeep, mapValues } from 'lodash';
import { EtherDenomination } from '../../../shared/constants/common';
import { GasEstimateTypes } from '../../../shared/constants/gas';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventErrorType,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER,
  FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME,
} from '../../../shared/constants/smartTransactions';
import {
  DEFAULT_ERC20_APPROVE_GAS,
  QUOTES_EXPIRED_ERROR,
  QUOTES_NOT_AVAILABLE_ERROR,
  SWAPS_CHAINID_CONTRACT_ADDRESS_MAP,
  SWAPS_FETCH_ORDER_CONFLICT,
} from '../../../shared/constants/swaps';
import { SECOND } from '../../../shared/constants/time';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import {
  fetchTradesInfo as defaultFetchTradesInfo,
  getBaseApi,
} from '../../../shared/lib/swaps-utils';
import {
  calcGasTotal,
  calcTokenAmount,
} from '../../../shared/lib/transactions-controller-utils';
import {
  decGWEIToHexWEI,
  sumHexes,
} from '../../../shared/modules/conversion.utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import { isSwapsDefaultTokenAddress } from '../../../shared/modules/swaps.utils';
import {
  FALLBACK_QUOTE_REFRESH_TIME,
  MAX_GAS_LIMIT,
  POLL_COUNT_LIMIT,
  swapsControllerInitialState,
} from './swaps.constants';
import type {
  FetchTradesInfoParams,
  FetchTradesInfoParamsMetadata,
  Quote,
  QuoteSavings,
  SwapsControllerOptions,
  SwapsControllerState,
  SwapsControllerStore,
  Trade,
} from './swaps.types';
import {
  calculateGasEstimateWithRefund,
  getMedianEthValueQuote,
} from './swaps.utils';

export default class SwapsController {
  public store: SwapsControllerStore;

  public getBufferedGasLimit: (
    params: {
      txParams: {
        value: string;
        data: string;
        to: string;
        from: string;
      };
    },
    factor: number,
  ) => Promise<{ gasLimit: string; simulationFails: boolean }>;

  public: () => ProviderConfig;

  public getTokenRatesState: () => {
    marketData: Record<
      string,
      {
        [tokenAddress: string]: {
          price: number;
        };
      }
    >;
  };

  public resetState: () => void;

  public trackMetaMetricsEvent: (event: {
    event: MetaMetricsEventName;
    category: MetaMetricsEventCategory;
    properties: Record<string, string | boolean | number | null>;
  }) => void;

  private _ethersProvider: Web3Provider;

  private _ethersProviderChainId: ChainId;

  private _indexOfNewestCallInFlight: number;

  private _pollCount: number;

  private _pollingTimeout: ReturnType<typeof setTimeout> | null = null;

  private _provider: ExternalProvider | JsonRpcFetchFunc;

  private _fetchTradesInfo: (
    fetchParams: FetchTradesInfoParams,
    fetchMetadata: { chainId: ChainId },
  ) => Promise<{
    [aggId: string]: Quote;
  }> = defaultFetchTradesInfo;

  private _getCurrentChainId: () => ChainId;

  private _getEIP1559GasFeeEstimates: () => Promise<GasFeeState>;

  private _getLayer1GasFee: (params: {
    transactionParams: TransactionParams;
    chainId: ChainId;
  }) => Promise<string>;

  constructor(
    opts: SwapsControllerOptions,
    state: { swapsState: SwapsControllerState },
  ) {
    // The store is initialized with the initial state, and then updated with the state from storage
    this.store = new ObservableStore({
      swapsState: {
        ...swapsControllerInitialState.swapsState,
        swapsFeatureFlags: state?.swapsState?.swapsFeatureFlags || {},
      },
    });

    this.getBufferedGasLimit = opts.getBufferedGasLimit;
    this.getTokenRatesState = opts.getTokenRatesState;
    this.getProviderConfig = opts.getProviderConfig;
    this.trackMetaMetricsEvent = opts.trackMetaMetricsEvent;

    // The resetState function is used to reset the state to the initial state, but keep the swapsFeatureFlags
    this.resetState = () => {
      this.store.updateState({
        swapsState: {
          ...swapsControllerInitialState.swapsState,
          swapsFeatureFlags: state?.swapsState?.swapsFeatureFlags,
        },
      });
    };

    this._fetchTradesInfo = opts.fetchTradesInfo || defaultFetchTradesInfo;
    this._getCurrentChainId = opts.getCurrentChainId;
    this._getEIP1559GasFeeEstimates = opts.getEIP1559GasFeeEstimates;
    this._getLayer1GasFee = opts.getLayer1GasFee;
    this._ethersProvider = new Web3Provider(opts.provider);
    this._ethersProviderChainId = this._getCurrentChainId();
    this._indexOfNewestCallInFlight = 0;
    this._pollCount = 0;
    this._provider = opts.provider;
  }

  public clearSwapsQuotes() {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, quotes: {} } });
  }

  public async fetchAndSetQuotes(
    fetchParams: FetchTradesInfoParams,
    fetchParamsMetaData: FetchTradesInfoParamsMetadata,
    isPolledRequest = false,
  ) {
    if (!fetchParams) {
      return null;
    }

    const { chainId } = fetchParamsMetaData;

    if (chainId !== this._ethersProviderChainId) {
      this._ethersProvider = new Web3Provider(this._provider);
      this._ethersProviderChainId = chainId;
    }

    const {
      swapsState: { quotesPollingLimitEnabled, saveFetchedQuotes },
    } = this.store.getState();

    // Every time we get a new request that is not from the polling, we reset the poll count so we can poll for up to three more sets of quotes with these new params.
    if (!isPolledRequest) {
      this._pollCount = 0;
    }

    // If there are any pending poll requests, clear them so that they don't get call while this new fetch is in process
    if (this._pollingTimeout) {
      clearTimeout(this._pollingTimeout);
    }

    if (!isPolledRequest) {
      this.setSwapsErrorKey('');
    }

    const indexOfCurrentCall = this._indexOfNewestCallInFlight + 1;
    this._indexOfNewestCallInFlight = indexOfCurrentCall;

    if (!saveFetchedQuotes) {
      this._setSaveFetchedQuotes(true);
    }

    let [newQuotes] = await Promise.all([
      this._fetchTradesInfo(fetchParams, { ...fetchParamsMetaData }),
      this._setSwapsNetworkConfig(),
    ]);

    const {
      swapsState: { saveFetchedQuotes: saveFetchedQuotesAfterResponse },
    } = this.store.getState();

    // If saveFetchedQuotesAfterResponse is false, it means a user left Swaps (we cleaned the state)
    // and we don't want to set any API response with quotes into state.
    if (!saveFetchedQuotesAfterResponse) {
      return [
        {}, // quotes
        null, // selectedAggId
      ];
    }

    newQuotes = mapValues(newQuotes, (quote: Quote) => ({
      ...quote,
      sourceTokenInfo: fetchParamsMetaData?.sourceTokenInfo,
      destinationTokenInfo: fetchParamsMetaData?.destinationTokenInfo,
    }));

    const isOptimism = chainId === CHAIN_IDS.OPTIMISM.toString();
    const isBase = chainId === CHAIN_IDS.BASE.toString();

    if ((isOptimism || isBase) && Object.values(newQuotes).length > 0) {
      await Promise.all(
        Object.values(newQuotes).map(async (quote) => {
          if (quote.trade) {
            const multiLayerL1TradeFeeTotal = await this._getLayer1GasFee({
              transactionParams: quote.trade,
              chainId,
            });

            quote.multiLayerL1TradeFeeTotal = multiLayerL1TradeFeeTotal;
          }
          return quote;
        }),
      );
    }

    const quotesLastFetched = Date.now();

    let approvalRequired = false;
    if (
      !isSwapsDefaultTokenAddress(fetchParams.sourceToken, chainId) &&
      Object.values(newQuotes).length
    ) {
      const allowance = await this._getERC20Allowance(
        fetchParams.sourceToken,
        fetchParams.fromAddress,
        chainId,
      );
      const [firstQuote] = Object.values(newQuotes);

      // For a user to be able to swap a token, they need to have approved the MetaSwap contract to withdraw that token.
      // _getERC20Allowance() returns the amount of the token they have approved for withdrawal. If that amount is greater
      // than 0, it means that approval has already occurred and is not needed. Otherwise, for tokens to be swapped, a new
      // call of the ERC-20 approve method is required.
      approvalRequired =
        firstQuote.approvalNeeded &&
        allowance.eq(0) &&
        firstQuote.aggregator !== 'wrappedNative';
      if (!approvalRequired) {
        newQuotes = mapValues(newQuotes, (quote) => ({
          ...quote,
          approvalNeeded: null,
        }));
      } else if (!isPolledRequest && firstQuote.approvalNeeded) {
        const { gasLimit: approvalGas } = await this._timedoutGasReturn(
          firstQuote.approvalNeeded,
          firstQuote.aggregator,
        );

        newQuotes = mapValues(newQuotes, (quote) =>
          quote.approvalNeeded
            ? {
                ...quote,
                approvalNeeded: {
                  // approvalNeeded is guaranteed to be defined here because of the conditional above, since all quotes are from the same source token
                  // the approvalNeeded object will be present for all quotes
                  ...quote.approvalNeeded,
                  gas: approvalGas || DEFAULT_ERC20_APPROVE_GAS,
                },
              }
            : quote,
        );
      }
    }

    let topAggId = null;

    // We can reduce time on the loading screen by only doing this after the
    // loading screen and best quote have rendered.
    if (!approvalRequired && !fetchParams?.balanceError) {
      newQuotes = await this._getAllQuotesWithGasEstimates(newQuotes);
    }

    if (Object.values(newQuotes).length === 0) {
      this.setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR);
    } else {
      const topQuoteAndSavings = await this._findTopQuoteAndCalculateSavings(
        newQuotes,
      );
      if (Array.isArray(topQuoteAndSavings)) {
        topAggId = topQuoteAndSavings[0];
        newQuotes = topQuoteAndSavings[1];
      }
    }

    // If a newer call has been made, don't update state with old information
    // Prevents timing conflicts between fetches
    if (this._indexOfNewestCallInFlight !== indexOfCurrentCall) {
      throw new Error(SWAPS_FETCH_ORDER_CONFLICT);
    }

    const { swapsState } = this.store.getState();
    let { selectedAggId } = swapsState;
    if (!selectedAggId || !newQuotes[selectedAggId]) {
      selectedAggId = null;
    }

    this.store.updateState({
      swapsState: {
        ...swapsState,
        quotes: newQuotes,
        fetchParams: { ...fetchParams, metaData: fetchParamsMetaData },
        quotesLastFetched,
        selectedAggId,
        topAggId,
      },
    });

    if (quotesPollingLimitEnabled) {
      // We only want to do up to a maximum of three requests from polling if polling limit is enabled.
      // Otherwise we won't increase _pollCount, so polling will run without a limit.
      this._pollCount += 1;
    }

    if (!quotesPollingLimitEnabled || this._pollCount < POLL_COUNT_LIMIT + 1) {
      this._pollForNewQuotes();
    } else {
      this.resetPostFetchState();
      this.setSwapsErrorKey(QUOTES_EXPIRED_ERROR);
      return null;
    }

    return [newQuotes, topAggId];
  }

  public resetPostFetchState() {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: {
        ...swapsControllerInitialState.swapsState,
        tokens: swapsState.tokens,
        fetchParams: swapsState.fetchParams,
        swapsFeatureIsLive: swapsState.swapsFeatureIsLive,
        swapsQuoteRefreshTime: swapsState.swapsQuoteRefreshTime,
        swapsQuotePrefetchingRefreshTime:
          swapsState.swapsQuotePrefetchingRefreshTime,
        swapsFeatureFlags: swapsState.swapsFeatureFlags,
      },
    });
    if (this._pollingTimeout) {
      clearTimeout(this._pollingTimeout);
    }
  }

  public resetSwapsState() {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: {
        ...swapsControllerInitialState.swapsState,
        swapsQuoteRefreshTime: swapsState.swapsQuoteRefreshTime,
        swapsQuotePrefetchingRefreshTime:
          swapsState.swapsQuotePrefetchingRefreshTime,
        swapsFeatureFlags: swapsState.swapsFeatureFlags,
      },
    });
    if (this._pollingTimeout) {
      clearTimeout(this._pollingTimeout);
    }
  }

  public safeRefetchQuotes() {
    const { swapsState } = this.store.getState();
    if (!this._pollingTimeout && swapsState.fetchParams) {
      this.fetchAndSetQuotes(swapsState.fetchParams, {
        ...swapsState.fetchParams.metaData,
      });
    }
  }

  public setApproveTxId(approveTxId: string | null) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, approveTxId } });
  }

  public setBackgroundSwapRouteState(routeState: string) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, routeState } });
  }

  public setCustomApproveTxData(data: string) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, customApproveTxData: data },
    });
  }

  public async setInitialGasEstimate(initialAggId: string) {
    const { swapsState } = this.store.getState();

    const quoteToUpdate = { ...swapsState.quotes[initialAggId] };

    const { gasLimit: newGasEstimate, simulationFails } = quoteToUpdate.trade
      ? await this._timedoutGasReturn(
          quoteToUpdate.trade,
          quoteToUpdate.aggregator,
        )
      : { gasLimit: null, simulationFails: true };

    if (newGasEstimate && !simulationFails) {
      const gasEstimateWithRefund = calculateGasEstimateWithRefund(
        quoteToUpdate.maxGas,
        quoteToUpdate.estimatedRefund,
        newGasEstimate,
      );

      quoteToUpdate.gasEstimate = newGasEstimate;
      quoteToUpdate.gasEstimateWithRefund = gasEstimateWithRefund;
    }

    this.store.updateState({
      swapsState: {
        ...swapsState,
        quotes: { ...swapsState.quotes, [initialAggId]: quoteToUpdate },
      },
    });
  }

  public setSelectedQuoteAggId(selectedAggId: string) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, selectedAggId } });
  }

  public setSwapsFeatureFlags(swapsFeatureFlags: Record<string, boolean>) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, swapsFeatureFlags },
    });
  }

  public setSwapsErrorKey(errorKey: string) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, errorKey } });
  }

  public setSwapsLiveness(swapsLiveness: { swapsFeatureIsLive: boolean }) {
    const { swapsState } = this.store.getState();
    const { swapsFeatureIsLive } = swapsLiveness;
    this.store.updateState({
      swapsState: { ...swapsState, swapsFeatureIsLive },
    });
  }

  public setSwapsQuotesPollingLimitEnabled(quotesPollingLimitEnabled: boolean) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, quotesPollingLimitEnabled },
    });
  }

  public setSwapsTokens(tokens: string[]) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, tokens } });
  }

  public setSwapsTxGasLimit(gasLimit: string) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, customMaxGas: gasLimit },
    });
  }

  public setSwapsTxGasPrice(gasPrice: string | null) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, customGasPrice: gasPrice },
    });
  }

  public setSwapsTxMaxFeePerGas(maxFeePerGas: string | null) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, customMaxFeePerGas: maxFeePerGas },
    });
  }

  public setSwapsTxMaxFeePriorityPerGas(maxPriorityFeePerGas: string | null) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: {
        ...swapsState,
        customMaxPriorityFeePerGas: maxPriorityFeePerGas,
      },
    });
  }

  public setSwapsUserFeeLevel(swapsUserFeeLevel: string) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, swapsUserFeeLevel },
    });
  }

  public setTradeTxId(tradeTxId: string | null) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, tradeTxId } });
  }

  /**
   * Once quotes are fetched, we poll for new ones to keep the quotes up to date.
   * Market and aggregator contract conditions can change fast enough that quotes
   * will no longer be available after 1 or 2 minutes. When `fetchAndSetQuotes` is
   * first called, it receives fetch parameters that are stored in state. These stored
   * parameters are used on subsequent calls made during polling.
   *
   * Note: We stop polling after 3 requests, until new quotes are explicitly asked for.
   * The logic that enforces that maximum is in the body of `fetchAndSetQuotes`.
   */
  public stopPollingForQuotes() {
    if (this._pollingTimeout) {
      clearTimeout(this._pollingTimeout);
    }
  }

  // Private Methods

  private async _fetchSwapsNetworkConfig(chainId: ChainId) {
    const response = await fetchWithCache({
      url: getBaseApi('network', chainId),
      fetchOptions: { method: 'GET' },
      cacheOptions: { cacheRefreshTime: 600000 },
      functionName: '_fetchSwapsNetworkConfig',
    });
    const { refreshRates, parameters = {} } = response || {};
    if (
      !refreshRates ||
      typeof refreshRates.quotes !== 'number' ||
      typeof refreshRates.quotesPrefetching !== 'number'
    ) {
      throw new Error(
        `MetaMask - invalid response for refreshRates: ${response}`,
      );
    }
    // We presently use milliseconds in the UI.
    return {
      quotes: refreshRates.quotes * 1000,
      quotesPrefetching: refreshRates.quotesPrefetching * 1000,
      stxGetTransactions: refreshRates.stxGetTransactions * 1000,
      stxBatchStatus: refreshRates.stxBatchStatus * 1000,
      stxStatusDeadline: refreshRates.stxStatusDeadline,
      stxMaxFeeMultiplier: parameters.stxMaxFeeMultiplier,
    };
  }

  private async _findTopQuoteAndCalculateSavings(
    quotes: Record<string, Quote> = {},
  ): Promise<[string | null, Record<string, Quote>] | Record<string, never>> {
    const { marketData } = this.getTokenRatesState();
    const chainId = this._getCurrentChainId();
    const tokenConversionRates = marketData[chainId];

    const {
      swapsState: { customGasPrice, customMaxPriorityFeePerGas },
    } = this.store.getState();

    const numQuotes = Object.keys(quotes).length;
    if (numQuotes === 0) {
      return {};
    }

    const newQuotes = cloneDeep(quotes);

    const { gasFeeEstimates, gasEstimateType } =
      await this._getEIP1559GasFeeEstimates();

    let usedGasPrice = '0x0';

    if (gasEstimateType === GasEstimateTypes.feeMarket) {
      const {
        high: { suggestedMaxPriorityFeePerGas },
        estimatedBaseFee,
      } = gasFeeEstimates;

      const suggestedMaxPriorityFeePerGasInHexWEI = decGWEIToHexWEI(
        Number(suggestedMaxPriorityFeePerGas),
      );
      const estimatedBaseFeeNumeric = new Numeric(
        estimatedBaseFee,
        10,
        EtherDenomination.GWEI,
      ).toDenomination(EtherDenomination.WEI);

      usedGasPrice = new Numeric(
        customMaxPriorityFeePerGas || suggestedMaxPriorityFeePerGasInHexWEI,
        16,
      )
        .add(estimatedBaseFeeNumeric)
        .round(6)
        .toString();
    } else if (gasEstimateType === GasEstimateTypes.legacy) {
      usedGasPrice =
        customGasPrice || decGWEIToHexWEI(Number(gasFeeEstimates.high));
    } else if (gasEstimateType === GasEstimateTypes.ethGasPrice) {
      usedGasPrice =
        customGasPrice || decGWEIToHexWEI(Number(gasFeeEstimates.gasPrice));
    }

    let topAggId: string = '';
    let overallValueOfBestQuoteForSorting: BigNumber;

    Object.values(newQuotes).forEach((quote) => {
      const {
        aggregator,
        approvalNeeded,
        averageGas,
        destinationAmount = 0,
        destinationToken,
        destinationTokenInfo,
        gasEstimateWithRefund,
        sourceAmount,
        sourceToken,
        trade,
        fee: metaMaskFee,
        multiLayerL1TradeFeeTotal,
      } = quote;

      if (!trade || !destinationToken) {
        return;
      }

      const tradeGasLimitForCalculation = gasEstimateWithRefund
        ? new BigNumber(gasEstimateWithRefund, 16)
        : new BigNumber(averageGas || MAX_GAS_LIMIT, 10);

      const totalGasLimitForCalculation = tradeGasLimitForCalculation
        .plus(approvalNeeded?.gas || '0x0', 16)
        .toString(16);

      let gasTotalInWeiHex = calcGasTotal(
        totalGasLimitForCalculation,
        usedGasPrice,
      );
      if (multiLayerL1TradeFeeTotal !== null) {
        gasTotalInWeiHex = sumHexes(
          gasTotalInWeiHex || '0x0',
          multiLayerL1TradeFeeTotal || '0x0',
        );
      }

      // trade.value is a sum of different values depending on the transaction.
      // It always includes any external fees charged by the quote source. In
      // addition, if the source asset is the selected chain's default token, trade.value
      // includes the amount of that token.
      const totalWeiCost = new Numeric(
        gasTotalInWeiHex,
        16,
        EtherDenomination.WEI,
      ).add(new Numeric(trade.value, 16, EtherDenomination.WEI));

      const totalEthCost = totalWeiCost
        .toDenomination(EtherDenomination.ETH)
        .round(6).value;

      // The total fee is aggregator/exchange fees plus gas fees.
      // If the swap is from the selected chain's default token, subtract
      // the sourceAmount from the total cost. Otherwise, the total fee
      // is simply trade.value plus gas fees.
      const ethFee = isSwapsDefaultTokenAddress(sourceToken, chainId)
        ? totalWeiCost
            .minus(new Numeric(sourceAmount, 10))
            .toDenomination(EtherDenomination.ETH)
            .round(6).value
        : totalEthCost;

      const decimalAdjustedDestinationAmount = calcTokenAmount(
        destinationAmount,
        destinationTokenInfo.decimals,
      );

      const tokenPercentageOfPreFeeDestAmount = new BigNumber(100, 10)
        .minus(metaMaskFee, 10)
        .div(100);
      const destinationAmountBeforeMetaMaskFee =
        decimalAdjustedDestinationAmount.div(tokenPercentageOfPreFeeDestAmount);
      const metaMaskFeeInTokens = destinationAmountBeforeMetaMaskFee.minus(
        decimalAdjustedDestinationAmount,
      );

      const tokenConversionRateKey = Object.keys(tokenConversionRates).find(
        (tokenAddress) =>
          isEqualCaseInsensitive(tokenAddress, destinationToken),
      );

      const tokenConversionRate = tokenConversionRateKey
        ? tokenConversionRates[tokenConversionRateKey]
        : null;

      const conversionRateForSorting = tokenConversionRate?.price || 1;

      const ethValueOfTokens = decimalAdjustedDestinationAmount.times(
        conversionRateForSorting.toString(10),
        10,
      );

      const conversionRateForCalculations = isSwapsDefaultTokenAddress(
        destinationToken,
        chainId,
      )
        ? 1
        : tokenConversionRate?.price;

      const overallValueOfQuoteForSorting = conversionRateForCalculations
        ? ethValueOfTokens.minus(ethFee, 10)
        : ethValueOfTokens;

      quote.ethFee = ethFee.toString(10);

      if (conversionRateForCalculations) {
        quote.ethValueOfTokens = ethValueOfTokens.toString(10);
        quote.overallValueOfQuote = overallValueOfQuoteForSorting.toString(10);
        quote.metaMaskFeeInEth = metaMaskFeeInTokens
          .times(conversionRateForCalculations.toString(10))
          .toString(10);
      }

      if (
        !overallValueOfBestQuoteForSorting ||
        overallValueOfQuoteForSorting.gt(overallValueOfBestQuoteForSorting || 0)
      ) {
        topAggId = aggregator;
        overallValueOfBestQuoteForSorting = overallValueOfQuoteForSorting;
      }
    });

    const tokenConversionRateKey = Object.keys(tokenConversionRates).find(
      (tokenAddress) =>
        isEqualCaseInsensitive(
          tokenAddress,
          newQuotes[topAggId]?.destinationToken,
        ),
    );

    const tokenConversionRate = tokenConversionRateKey
      ? tokenConversionRates[tokenConversionRateKey]
      : null;

    const isBest =
      isSwapsDefaultTokenAddress(
        newQuotes[topAggId]?.destinationToken,
        chainId,
      ) || Boolean(tokenConversionRate?.price);

    if (isBest) {
      const bestQuote = newQuotes[topAggId];

      const {
        ethFee: medianEthFee,
        metaMaskFeeInEth: medianMetaMaskFee,
        ethValueOfTokens: medianEthValueOfTokens,
      } = getMedianEthValueQuote(Object.values(newQuotes));

      // Performance savings are calculated as:
      //   (ethValueOfTokens for the best trade) - (ethValueOfTokens for the media trade)
      const savingsPerformance = new BigNumber(bestQuote.ethValueOfTokens, 10)
        .minus(medianEthValueOfTokens, 10)
        .toString(10);

      // Fee savings are calculated as:
      //   (fee for the median trade) - (fee for the best trade)
      const fee = new BigNumber(medianEthFee)
        .minus(bestQuote.ethFee, 10)
        .toString(10);

      const metaMaskFee = bestQuote.metaMaskFeeInEth;

      // Total savings are calculated as:
      //   performance savings + fee savings - metamask fee
      const total = new BigNumber(savingsPerformance)
        .plus(fee)
        .minus(metaMaskFee)
        .toString(10);

      const savings: QuoteSavings = {
        performance: savingsPerformance,
        fee,
        total,
        metaMaskFee,
        medianMetaMaskFee,
      };

      newQuotes[topAggId].isBestQuote = true;
      newQuotes[topAggId].savings = savings;
    }

    return [topAggId, newQuotes];
  }

  private async _getAllQuotesWithGasEstimates(quotes: Record<string, Quote>) {
    const quoteGasData = await Promise.all(
      Object.values(quotes).map(async (quote) => {
        if (!quote.trade) {
          return {
            gasLimit: null,
            simulationFails: true,
            aggId: quote.aggregator,
          };
        }
        const { gasLimit, simulationFails } = await this._timedoutGasReturn(
          quote.trade,
          quote.aggregator,
        );
        return { gasLimit, simulationFails, aggId: quote.aggregator };
      }),
    );

    const newQuotes: Record<string, Quote> = {};
    quoteGasData.forEach(({ gasLimit, simulationFails, aggId }) => {
      if (gasLimit && !simulationFails) {
        const gasEstimateWithRefund = calculateGasEstimateWithRefund(
          quotes[aggId].maxGas,
          quotes[aggId].estimatedRefund,
          gasLimit,
        );

        // add to newQuotes object

        newQuotes[aggId] = {
          ...quotes[aggId],
          gasEstimate: gasLimit,
          gasEstimateWithRefund,
        };
      } else if (quotes[aggId].approvalNeeded) {
        // If gas estimation fails, but an ERC-20 approve is needed, then we do not add any estimate property to the quote object
        // Such quotes will rely on the maxGas and averageGas properties from the api
        newQuotes[aggId] = quotes[aggId];
      }
      // If gas estimation fails and no approval is needed, then we filter that quote out, so that it is not shown to the user
    });
    return newQuotes;
  }

  private async _getERC20Allowance(
    contractAddress: string,
    walletAddress: string,
    chainId: ChainId,
  ) {
    const contract = new Contract(contractAddress, abi, this._ethersProvider);
    return await contract.allowance(
      walletAddress,
      SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[
        chainId as keyof typeof SWAPS_CHAINID_CONTRACT_ADDRESS_MAP
      ],
    );
  }

  private _pollForNewQuotes() {
    const {
      swapsState: {
        swapsQuoteRefreshTime,
        swapsQuotePrefetchingRefreshTime,
        quotesPollingLimitEnabled,
      },
    } = this.store.getState();
    // swapsQuoteRefreshTime is used on the View Quote page, swapsQuotePrefetchingRefreshTime is used on the Build Quote page.
    const quotesRefreshRateInMs = quotesPollingLimitEnabled
      ? swapsQuoteRefreshTime
      : swapsQuotePrefetchingRefreshTime;
    this._pollingTimeout = setTimeout(() => {
      const { swapsState } = this.store.getState();
      this.fetchAndSetQuotes(
        swapsState.fetchParams as FetchTradesInfoParams,
        swapsState.fetchParams?.metaData as FetchTradesInfoParamsMetadata,
        true,
      );
    }, quotesRefreshRateInMs);
  }

  private _setSaveFetchedQuotes(status: boolean) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, saveFetchedQuotes: status },
    });
  }

  // Sets the network config from the MetaSwap API.
  private async _setSwapsNetworkConfig() {
    const chainId = this._getCurrentChainId();
    let swapsNetworkConfig;
    try {
      swapsNetworkConfig = await this._fetchSwapsNetworkConfig(chainId);
    } catch (e) {
      console.error('Request for Swaps network config failed: ', e);
    }
    const { swapsState: latestSwapsState } = this.store.getState();
    this.store.updateState({
      swapsState: {
        ...latestSwapsState,
        swapsQuoteRefreshTime:
          swapsNetworkConfig?.quotes || FALLBACK_QUOTE_REFRESH_TIME,
        swapsQuotePrefetchingRefreshTime:
          swapsNetworkConfig?.quotesPrefetching || FALLBACK_QUOTE_REFRESH_TIME,
        swapsStxGetTransactionsRefreshTime:
          swapsNetworkConfig?.stxGetTransactions ||
          FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME,
        swapsStxBatchStatusRefreshTime:
          swapsNetworkConfig?.stxBatchStatus ||
          FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME,
        swapsStxMaxFeeMultiplier:
          swapsNetworkConfig?.stxMaxFeeMultiplier ||
          FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER,
      },
    });
  }

  private _timedoutGasReturn(
    tradeTxParams: Trade,
    aggregator = '',
  ): Promise<{ gasLimit: string | null; simulationFails: boolean }> {
    return new Promise((resolve) => {
      let gasTimedOut = false;

      const gasTimeout = setTimeout(() => {
        gasTimedOut = true;
        this.trackMetaMetricsEvent({
          event: MetaMetricsEventName.QuoteError,
          category: MetaMetricsEventCategory.Swaps,
          properties: {
            error_type: MetaMetricsEventErrorType.GasTimeout,
            aggregator,
          },
        });
        resolve({
          gasLimit: null,
          simulationFails: true,
        });
      }, SECOND * 5);

      // Remove gas from params that will be passed to the `estimateGas` call
      // Including it can cause the estimate to fail if the actual gas needed
      // exceeds the passed gas
      const tradeTxParamsForGasEstimate = {
        data: tradeTxParams.data,
        from: tradeTxParams.from,
        to: tradeTxParams.to,
        value: tradeTxParams.value,
      };

      this.getBufferedGasLimit({ txParams: tradeTxParamsForGasEstimate }, 1)
        .then(({ gasLimit, simulationFails }) => {
          if (!gasTimedOut) {
            clearTimeout(gasTimeout);
            resolve({ gasLimit, simulationFails });
          }
        })
        .catch((e) => {
          captureException(e, {
            extra: {
              aggregator,
            },
          });
          if (!gasTimedOut) {
            clearTimeout(gasTimeout);
            resolve({ gasLimit: null, simulationFails: true });
          }
        });
    });
  }
}
