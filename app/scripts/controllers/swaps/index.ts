import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { BaseController, StateMetadata } from '@metamask/base-controller';
import { GasFeeState } from '@metamask/gas-fee-controller';
import { TransactionParams } from '@metamask/transaction-controller';
import { captureException } from '@sentry/browser';
import { BigNumber } from 'bignumber.js';
import abi from 'human-standard-token-abi';
import { cloneDeep, mapValues } from 'lodash';
import { NetworkClient, NetworkClientId } from '@metamask/network-controller';
import { Hex } from '@metamask/utils';
import { EtherDenomination } from '../../../../shared/constants/common';
import { GasEstimateTypes } from '../../../../shared/constants/gas';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventErrorType,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER,
  FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME,
  FALLBACK_SMART_TRANSACTIONS_DEADLINE,
} from '../../../../shared/constants/smartTransactions';
import {
  DEFAULT_ERC20_APPROVE_GAS,
  QUOTES_EXPIRED_ERROR,
  QUOTES_NOT_AVAILABLE_ERROR,
  SWAPS_CHAINID_CONTRACT_ADDRESS_MAP,
  SWAPS_FETCH_ORDER_CONFLICT,
} from '../../../../shared/constants/swaps';
import { SECOND } from '../../../../shared/constants/time';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import {
  fetchTradesInfo as defaultFetchTradesInfo,
  getBaseApi,
} from '../../../../shared/lib/swaps-utils';
import {
  calcGasTotal,
  calcTokenAmount,
} from '../../../../shared/lib/transactions-controller-utils';
import {
  decGWEIToHexWEI,
  sumHexes,
} from '../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../shared/modules/Numeric';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { isSwapsDefaultTokenAddress } from '../../../../shared/modules/swaps.utils';
import {
  controllerName,
  FALLBACK_QUOTE_REFRESH_TIME,
  MAX_GAS_LIMIT,
  POLL_COUNT_LIMIT,
  getDefaultSwapsControllerState,
} from './swaps.constants';
import {
  calculateGasEstimateWithRefund,
  getMedianEthValueQuote,
} from './swaps.utils';
import type {
  FetchTradesInfoParams,
  FetchTradesInfoParamsMetadata,
  SwapsControllerMessenger,
  SwapsControllerOptions,
  SwapsControllerState,
  Quote,
  QuoteSavings,
  Trade,
} from './swaps.types';

type Network = {
  client: NetworkClient;
  clientId: NetworkClientId;
  chainId: Hex;
  ethersProvider: Web3Provider;
};

const metadata: StateMetadata<SwapsControllerState> = {
  swapsState: {
    persist: false,
    anonymous: false,
  },
};

export default class SwapsController extends BaseController<
  typeof controllerName,
  SwapsControllerState,
  SwapsControllerMessenger
> {
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

  public resetState: () => void;

  public trackMetaMetricsEvent: (event: {
    event: MetaMetricsEventName;
    category: MetaMetricsEventCategory;
    properties: Record<string, string | boolean | number | null>;
  }) => void;

  #indexOfNewestCallInFlight: number;

  #pollCount: number;

  #pollingTimeout: ReturnType<typeof setTimeout> | null = null;

  #getEIP1559GasFeeEstimates: (options?: {
    networkClientId?: NetworkClientId;
    shouldUpdateState?: boolean;
  }) => Promise<GasFeeState>;

  #getLayer1GasFee: (params: {
    transactionParams: TransactionParams;
    networkClientId: NetworkClientId;
  }) => Promise<string>;

  #network: Network | undefined;

  private _fetchTradesInfo: (
    fetchParams: FetchTradesInfoParams,
    fetchMetadata: { chainId: Hex },
  ) => Promise<{
    [aggId: string]: Quote;
  }> = defaultFetchTradesInfo;

  constructor(opts: SwapsControllerOptions, state: SwapsControllerState) {
    super({
      name: controllerName,
      metadata,
      messenger: opts.messenger,
      state: {
        swapsState: {
          ...getDefaultSwapsControllerState().swapsState,
          swapsFeatureFlags: state?.swapsState?.swapsFeatureFlags || {},
        },
      },
    });

    this.messagingSystem.registerActionHandler(
      `SwapsController:fetchAndSetQuotes`,
      this.fetchAndSetQuotes.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setSelectedQuoteAggId`,
      this.setSelectedQuoteAggId.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:resetSwapsState`,
      this.resetSwapsState.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setSwapsTokens`,
      this.setSwapsTokens.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:clearSwapsQuotes`,
      this.clearSwapsQuotes.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setApproveTxId`,
      this.setApproveTxId.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setTradeTxId`,
      this.setTradeTxId.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setSwapsTxGasPrice`,
      this.setSwapsTxGasPrice.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setSwapsTxGasLimit`,
      this.setSwapsTxGasLimit.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setSwapsTxMaxFeePerGas`,
      this.setSwapsTxMaxFeePerGas.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setSwapsTxMaxFeePriorityPerGas`,
      this.setSwapsTxMaxFeePriorityPerGas.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:safeRefetchQuotes`,
      this.safeRefetchQuotes.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:stopPollingForQuotes`,
      this.stopPollingForQuotes.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setBackgroundSwapRouteState`,
      this.setBackgroundSwapRouteState.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:resetPostFetchState`,
      this.resetPostFetchState.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setSwapsErrorKey`,
      this.setSwapsErrorKey.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setInitialGasEstimate`,
      this.setInitialGasEstimate.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setCustomApproveTxData`,
      this.setCustomApproveTxData.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setSwapsLiveness`,
      this.setSwapsLiveness.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setSwapsFeatureFlags`,
      this.setSwapsFeatureFlags.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setSwapsUserFeeLevel`,
      this.setSwapsUserFeeLevel.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `SwapsController:setSwapsQuotesPollingLimitEnabled`,
      this.setSwapsQuotesPollingLimitEnabled.bind(this),
    );

    this.getBufferedGasLimit = opts.getBufferedGasLimit;
    this.trackMetaMetricsEvent = opts.trackMetaMetricsEvent;

    // The resetState function is used to reset the state to the initial state, but keep the swapsFeatureFlags
    this.resetState = () => {
      this.update((_state) => {
        _state.swapsState = {
          ...getDefaultSwapsControllerState().swapsState,
          swapsFeatureFlags: _state?.swapsState.swapsFeatureFlags,
        };
      });
    };

    this.#getEIP1559GasFeeEstimates = opts.getEIP1559GasFeeEstimates;
    this.#getLayer1GasFee = opts.getLayer1GasFee;
    this.#indexOfNewestCallInFlight = 0;
    this.#pollCount = 0;

    // TODO: this should be private, but since a lot of tests depends on spying on it
    // we cannot enforce privacy 100%
    this._fetchTradesInfo = opts.fetchTradesInfo || defaultFetchTradesInfo;
  }

  public clearSwapsQuotes() {
    this.update((_state) => {
      _state.swapsState.quotes = {};
      _state.swapsState.selectedAggId = null;
      _state.swapsState.topAggId = null;
    });
  }

  public async fetchAndSetQuotes(
    fetchParams: FetchTradesInfoParams,
    fetchParamsMetaData: FetchTradesInfoParamsMetadata,
    isPolledRequest = false,
  ): Promise<[Record<string, Quote> | null, string | null] | null> {
    if (!fetchParams) {
      return null;
    }

    let network;
    if (this.#network?.clientId === fetchParamsMetaData.networkClientId) {
      network = this.#network;
    } else {
      network = this.#setNetwork(fetchParamsMetaData.networkClientId);
    }

    const { quotesPollingLimitEnabled, saveFetchedQuotes } =
      this.state.swapsState;

    // Every time we get a new request that is not from the polling, we reset the poll count so we can poll for up to three more sets of quotes with these new params.
    if (!isPolledRequest) {
      this.#pollCount = 0;
    }

    // If there are any pending poll requests, clear them so that they don't get call while this new fetch is in process
    if (this.#pollingTimeout) {
      clearTimeout(this.#pollingTimeout);
    }

    if (!isPolledRequest) {
      this.setSwapsErrorKey('');
    }

    const indexOfCurrentCall = this.#indexOfNewestCallInFlight + 1;
    this.#indexOfNewestCallInFlight = indexOfCurrentCall;

    if (!saveFetchedQuotes) {
      this._setSaveFetchedQuotes(true);
    }

    let [newQuotes] = await Promise.all([
      this._fetchTradesInfo(fetchParams, { chainId: network.chainId }),
      this._setSwapsNetworkConfig(network),
    ]);

    const { saveFetchedQuotes: saveFetchedQuotesAfterResponse } =
      this.state.swapsState;

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

    const isOptimism = network.chainId === CHAIN_IDS.OPTIMISM.toString();
    const isBase = network.chainId === CHAIN_IDS.BASE.toString();

    if ((isOptimism || isBase) && Object.values(newQuotes).length > 0) {
      await Promise.all(
        Object.values(newQuotes).map(async (quote) => {
          if (quote.trade) {
            const multiLayerL1TradeFeeTotal = await this.#getLayer1GasFee({
              transactionParams: quote.trade,
              networkClientId: network.clientId,
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
      !isSwapsDefaultTokenAddress(fetchParams.sourceToken, network.chainId) &&
      Object.values(newQuotes).length
    ) {
      const allowance = await this._getERC20Allowance(
        fetchParams.sourceToken,
        fetchParams.fromAddress,
        network,
      );
      const [firstQuote] = Object.values(newQuotes);

      // For a user to be able to swap a token, they need to have approved the MetaSwap contract to withdraw that token.
      // _getERC20Allowance() returns the amount of the token they have approved for withdrawal. If that amount is either
      // zero or less than the soucreAmount of the swap, a new call of the ERC-20 approve method is required.
      approvalRequired =
        firstQuote.approvalNeeded &&
        (allowance.eq(0) || allowance.lt(firstQuote.sourceAmount)) &&
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
      const topQuoteAndSavings = await this.getTopQuoteWithCalculatedSavings({
        quotes: newQuotes,
      });
      if (Array.isArray(topQuoteAndSavings)) {
        topAggId = topQuoteAndSavings[0];
        newQuotes = topQuoteAndSavings[1];
      }
    }

    // If a newer call has been made, don't update state with old information
    // Prevents timing conflicts between fetches
    if (this.#indexOfNewestCallInFlight !== indexOfCurrentCall) {
      throw new Error(SWAPS_FETCH_ORDER_CONFLICT);
    }

    let { selectedAggId } = this.state.swapsState;
    if (!selectedAggId || !newQuotes[selectedAggId]) {
      selectedAggId = null;
    }

    this.update((_state) => {
      _state.swapsState.quotes = newQuotes;
      _state.swapsState.fetchParams = {
        ...fetchParams,
        metaData: fetchParamsMetaData,
      };
      _state.swapsState.quotesLastFetched = quotesLastFetched;
      _state.swapsState.selectedAggId = selectedAggId;
      _state.swapsState.topAggId = topAggId;
    });

    if (quotesPollingLimitEnabled) {
      // We only want to do up to a maximum of three requests from polling if polling limit is enabled.
      // Otherwise we won't increase #pollCount, so polling will run without a limit.
      this.#pollCount += 1;
    }

    if (!quotesPollingLimitEnabled || this.#pollCount < POLL_COUNT_LIMIT + 1) {
      this._pollForNewQuotes();
    } else {
      this.resetPostFetchState();
      this.setSwapsErrorKey(QUOTES_EXPIRED_ERROR);
      return null;
    }

    return [newQuotes, topAggId];
  }

  public async getTopQuoteWithCalculatedSavings({
    quotes,
    networkClientId,
  }: {
    quotes: Record<string, Quote>;
    networkClientId?: NetworkClientId;
  }): Promise<[string | null, Record<string, Quote>] | Record<string, never>> {
    let chainId;
    if (networkClientId) {
      const networkClient = this.messagingSystem.call(
        'NetworkController:getNetworkClientById',
        networkClientId,
      );
      chainId = networkClient.configuration.chainId;
    } else if (this.#network === undefined) {
      throw new Error('There is no network set');
    } else {
      chainId = this.#network.chainId;
    }

    const { marketData } = this._getTokenRatesState();
    const tokenConversionRates = marketData?.[chainId] ?? {};

    const { customGasPrice, customMaxPriorityFeePerGas } =
      this.state.swapsState;

    const numQuotes = Object.keys(quotes).length;
    if (numQuotes === 0) {
      return {};
    }

    const newQuotes = cloneDeep(quotes);

    const { gasFeeEstimates, gasEstimateType } =
      await this.#getEIP1559GasFeeEstimates({ networkClientId });

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
        destinationAmount,
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
        destinationAmount ?? '0',
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

  public resetPostFetchState() {
    this.update((_state) => {
      _state.swapsState = {
        ...getDefaultSwapsControllerState().swapsState,
        tokens: _state.swapsState.tokens,
        fetchParams: _state.swapsState.fetchParams,
        swapsFeatureIsLive: _state.swapsState.swapsFeatureIsLive,
        swapsQuoteRefreshTime: _state.swapsState.swapsQuoteRefreshTime,
        swapsQuotePrefetchingRefreshTime:
          _state.swapsState.swapsQuotePrefetchingRefreshTime,
        swapsFeatureFlags: _state.swapsState.swapsFeatureFlags,
      };
    });
    if (this.#pollingTimeout) {
      clearTimeout(this.#pollingTimeout);
    }
  }

  public resetSwapsState() {
    this.update((_state) => {
      _state.swapsState = {
        ...getDefaultSwapsControllerState().swapsState,
        swapsQuoteRefreshTime: _state.swapsState.swapsQuoteRefreshTime,
        swapsQuotePrefetchingRefreshTime:
          _state.swapsState.swapsQuotePrefetchingRefreshTime,
        swapsFeatureFlags: _state.swapsState.swapsFeatureFlags,
      };
    });

    if (this.#pollingTimeout) {
      clearTimeout(this.#pollingTimeout);
    }
  }

  public safeRefetchQuotes() {
    if (!this.#pollingTimeout && this.state.swapsState.fetchParams) {
      this.fetchAndSetQuotes(this.state.swapsState.fetchParams, {
        ...this.state.swapsState.fetchParams.metaData,
      });
    }
  }

  public setApproveTxId(approveTxId: string | null) {
    this.update((_state) => {
      _state.swapsState.approveTxId = approveTxId;
    });
  }

  public setBackgroundSwapRouteState(routeState: string) {
    this.update((_state) => {
      _state.swapsState.routeState = routeState;
    });
  }

  public setCustomApproveTxData(customApproveTxData: string) {
    this.update((_state) => {
      _state.swapsState.customApproveTxData = customApproveTxData;
    });
  }

  public async setInitialGasEstimate(initialAggId: string) {
    const quoteToUpdate = { ...this.state.swapsState.quotes[initialAggId] };

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

    this.update((_state) => {
      _state.swapsState.quotes = {
        ..._state.swapsState.quotes,
        [initialAggId]: quoteToUpdate,
      };
    });
  }

  public setSelectedQuoteAggId(selectedAggId: string) {
    this.update((_state) => {
      _state.swapsState.selectedAggId = selectedAggId;
    });
  }

  public setSwapsFeatureFlags(swapsFeatureFlags: Record<string, boolean>) {
    this.update((_state) => {
      _state.swapsState.swapsFeatureFlags = swapsFeatureFlags;
    });
  }

  public setSwapsErrorKey(errorKey: string) {
    this.update((_state) => {
      _state.swapsState.errorKey = errorKey;
    });
  }

  public setSwapsLiveness(swapsLiveness: { swapsFeatureIsLive: boolean }) {
    const { swapsFeatureIsLive } = swapsLiveness;
    this.update((_state) => {
      _state.swapsState.swapsFeatureIsLive = swapsFeatureIsLive;
    });
  }

  public setSwapsQuotesPollingLimitEnabled(quotesPollingLimitEnabled: boolean) {
    this.update((_state) => {
      _state.swapsState.quotesPollingLimitEnabled = quotesPollingLimitEnabled;
    });
  }

  public setSwapsTokens(tokens: string[]) {
    this.update((_state) => {
      _state.swapsState.tokens = tokens;
    });
  }

  public setSwapsTxGasLimit(customMaxGas: string) {
    this.update((_state) => {
      _state.swapsState.customMaxGas = customMaxGas;
    });
  }

  public setSwapsTxGasPrice(customGasPrice: string | null) {
    this.update((_state) => {
      _state.swapsState.customGasPrice = customGasPrice;
    });
  }

  public setSwapsTxMaxFeePerGas(customMaxFeePerGas: string | null) {
    this.update((_state) => {
      _state.swapsState.customMaxFeePerGas = customMaxFeePerGas;
    });
  }

  public setSwapsTxMaxFeePriorityPerGas(
    customMaxPriorityFeePerGas: string | null,
  ) {
    this.update((_state) => {
      _state.swapsState.customMaxPriorityFeePerGas = customMaxPriorityFeePerGas;
    });
  }

  public setSwapsUserFeeLevel(swapsUserFeeLevel: string) {
    this.update((_state) => {
      _state.swapsState.swapsUserFeeLevel = swapsUserFeeLevel;
    });
  }

  public setTradeTxId(tradeTxId: string | null) {
    this.update((_state) => {
      _state.swapsState.tradeTxId = tradeTxId;
    });
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
    if (this.#pollingTimeout) {
      clearTimeout(this.#pollingTimeout);
    }
  }

  /**
   * This method is used to update the state of the controller for testing purposes.
   * DO NOT USE OUTSIDE OF TESTING
   *
   * @param newState - The new state to set
   */
  public __test__updateState = (newState: Partial<SwapsControllerState>) => {
    this.update((oldState) => {
      return { swapsState: { ...oldState.swapsState, ...newState.swapsState } };
    });
  };

  // Private Methods
  private async _fetchSwapsNetworkConfig(network: Network) {
    const response = await fetchWithCache({
      url: getBaseApi('network', network.chainId),
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
    network: Network,
  ) {
    const contract = new Contract(contractAddress, abi, network.ethersProvider);
    return await contract.allowance(
      walletAddress,
      SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[
        network.chainId as keyof typeof SWAPS_CHAINID_CONTRACT_ADDRESS_MAP
      ],
    );
  }

  private _getTokenRatesState(): {
    marketData: Record<
      string,
      {
        [tokenAddress: string]: {
          price: number;
        };
      }
    >;
  } {
    const { marketData } = this.messagingSystem.call(
      'TokenRatesController:getState',
    );
    return { marketData };
  }

  private _pollForNewQuotes() {
    const {
      swapsQuoteRefreshTime,
      swapsQuotePrefetchingRefreshTime,
      quotesPollingLimitEnabled,
    } = this.state.swapsState;
    // swapsQuoteRefreshTime is used on the View Quote page, swapsQuotePrefetchingRefreshTime is used on the Build Quote page.
    const quotesRefreshRateInMs = quotesPollingLimitEnabled
      ? swapsQuoteRefreshTime
      : swapsQuotePrefetchingRefreshTime;
    this.#pollingTimeout = setTimeout(() => {
      this.fetchAndSetQuotes(
        this.state.swapsState.fetchParams as FetchTradesInfoParams,
        this.state.swapsState.fetchParams
          ?.metaData as FetchTradesInfoParamsMetadata,
        true,
      );
    }, quotesRefreshRateInMs);
  }

  private _setSaveFetchedQuotes(status: boolean) {
    this.update((_state) => {
      _state.swapsState.saveFetchedQuotes = status;
    });
  }

  // Sets the network config from the MetaSwap API.
  private async _setSwapsNetworkConfig(network: Network) {
    let swapsNetworkConfig: {
      quotes: number;
      quotesPrefetching: number;
      stxGetTransactions: number;
      stxBatchStatus: number;
      stxStatusDeadline: number;
      stxMaxFeeMultiplier: number;
    } | null = null;

    try {
      swapsNetworkConfig = await this._fetchSwapsNetworkConfig(network);
    } catch (e) {
      console.error('Request for Swaps network config failed: ', e);
    }
    this.update((_state) => {
      _state.swapsState.swapsQuoteRefreshTime =
        swapsNetworkConfig?.quotes || FALLBACK_QUOTE_REFRESH_TIME;
      _state.swapsState.swapsQuotePrefetchingRefreshTime =
        swapsNetworkConfig?.quotesPrefetching || FALLBACK_QUOTE_REFRESH_TIME;
      _state.swapsState.swapsStxGetTransactionsRefreshTime =
        swapsNetworkConfig?.stxGetTransactions ||
        FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME;
      _state.swapsState.swapsStxBatchStatusRefreshTime =
        swapsNetworkConfig?.stxBatchStatus ||
        FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME;
      _state.swapsState.swapsStxMaxFeeMultiplier =
        swapsNetworkConfig?.stxMaxFeeMultiplier ||
        FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER;
      _state.swapsState.swapsStxStatusDeadline =
        swapsNetworkConfig?.stxStatusDeadline ||
        FALLBACK_SMART_TRANSACTIONS_DEADLINE;
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

  #setNetwork(networkClientId: NetworkClientId) {
    const networkClient = this.messagingSystem.call(
      'NetworkController:getNetworkClientById',
      networkClientId,
    );
    const { chainId } = networkClient.configuration;
    // Web3Provider (via JsonRpcProvider) creates two extra network requests, so
    // we cache the object so that we can reuse it for subsequent contract
    // interactions for the same network
    const ethersProvider = new Web3Provider(networkClient.provider);

    const network = {
      client: networkClient,
      clientId: networkClientId,
      chainId,
      ethersProvider,
    };
    this.#network = network;
    return network;
  }
}
