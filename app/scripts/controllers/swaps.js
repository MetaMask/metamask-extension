import { ethers } from 'ethers';
import log from 'loglevel';
import BigNumber from 'bignumber.js';
import { ObservableStore } from '@metamask/obs-store';
import { mapValues, cloneDeep } from 'lodash';
import abi from 'human-standard-token-abi';
import {
  conversionUtil,
  decGWEIToHexWEI,
  addCurrencies,
} from '../../../shared/modules/conversion.utils';
import {
  DEFAULT_ERC20_APPROVE_GAS,
  QUOTES_EXPIRED_ERROR,
  QUOTES_NOT_AVAILABLE_ERROR,
  SWAPS_FETCH_ORDER_CONFLICT,
  SWAPS_CHAINID_CONTRACT_ADDRESS_MAP,
} from '../../../shared/constants/swaps';
import { GAS_ESTIMATE_TYPES } from '../../../shared/constants/gas';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME,
  FALLBACK_SMART_TRANSACTIONS_DEADLINE,
  FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER,
} from '../../../shared/constants/smartTransactions';

import { isSwapsDefaultTokenAddress } from '../../../shared/modules/swaps.utils';
import { sumHexes } from '../../../ui/helpers/utils/transactions.util';

import {
  fetchTradesInfo as defaultFetchTradesInfo,
  getBaseApi,
} from '../../../shared/lib/swaps-utils';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { MINUTE, SECOND } from '../../../shared/constants/time';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import {
  calcGasTotal,
  calcTokenAmount,
} from '../../../shared/lib/transactions-controller-utils';
import fetchEstimatedL1Fee from '../../../ui/helpers/utils/optimism/fetchEstimatedL1Fee';

import { NETWORK_EVENTS } from './network';

// The MAX_GAS_LIMIT is a number that is higher than the maximum gas costs we have observed on any aggregator
const MAX_GAS_LIMIT = 2500000;

// To ensure that our serves are not spammed if MetaMask is left idle, we limit the number of fetches for quotes that are made on timed intervals.
// 3 seems to be an appropriate balance of giving users the time they need when MetaMask is not left idle, and turning polling off when it is.
const POLL_COUNT_LIMIT = 3;

// If for any reason the MetaSwap API fails to provide a refresh time,
// provide a reasonable fallback to avoid further errors
const FALLBACK_QUOTE_REFRESH_TIME = MINUTE;

function calculateGasEstimateWithRefund(
  maxGas = MAX_GAS_LIMIT,
  estimatedRefund = 0,
  estimatedGas = 0,
) {
  const maxGasMinusRefund = new BigNumber(maxGas, 10).minus(
    estimatedRefund,
    10,
  );
  const isMaxGasMinusRefundNegative = maxGasMinusRefund.lt(0);

  const gasEstimateWithRefund =
    !isMaxGasMinusRefundNegative && maxGasMinusRefund.lt(estimatedGas, 16)
      ? `0x${maxGasMinusRefund.toString(16)}`
      : estimatedGas;

  return gasEstimateWithRefund;
}

const initialState = {
  swapsState: {
    quotes: {},
    quotesPollingLimitEnabled: false,
    fetchParams: null,
    tokens: null,
    tradeTxId: null,
    approveTxId: null,
    quotesLastFetched: null,
    customMaxGas: '',
    customGasPrice: null,
    customMaxFeePerGas: null,
    customMaxPriorityFeePerGas: null,
    swapsUserFeeLevel: '',
    selectedAggId: null,
    customApproveTxData: '',
    errorKey: '',
    topAggId: null,
    routeState: '',
    swapsFeatureIsLive: true,
    saveFetchedQuotes: false,
    swapsQuoteRefreshTime: FALLBACK_QUOTE_REFRESH_TIME,
    swapsQuotePrefetchingRefreshTime: FALLBACK_QUOTE_REFRESH_TIME,
    swapsStxBatchStatusRefreshTime: FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME,
    swapsStxGetTransactionsRefreshTime:
      FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME,
    swapsStxMaxFeeMultiplier: FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER,
    swapsFeatureFlags: {},
  },
};

export default class SwapsController {
  constructor({
    getBufferedGasLimit,
    networkController,
    provider,
    getProviderConfig,
    getTokenRatesState,
    fetchTradesInfo = defaultFetchTradesInfo,
    getCurrentChainId,
    getEIP1559GasFeeEstimates,
  }) {
    this.store = new ObservableStore({
      swapsState: { ...initialState.swapsState },
    });

    this.resetState = () => {
      this.store.updateState({ swapsState: { ...initialState.swapsState } });
    };

    this._fetchTradesInfo = fetchTradesInfo;
    this._getCurrentChainId = getCurrentChainId;
    this._getEIP1559GasFeeEstimates = getEIP1559GasFeeEstimates;

    this.getBufferedGasLimit = getBufferedGasLimit;
    this.getTokenRatesState = getTokenRatesState;

    this.pollCount = 0;
    this.getProviderConfig = getProviderConfig;

    this.indexOfNewestCallInFlight = 0;

    this.ethersProvider = new ethers.providers.Web3Provider(provider);
    this._currentNetwork = networkController.store.getState().network;
    networkController.on(NETWORK_EVENTS.NETWORK_DID_CHANGE, (network) => {
      if (network !== 'loading' && network !== this._currentNetwork) {
        this._currentNetwork = network;
        this.ethersProvider = new ethers.providers.Web3Provider(provider);
      }
    });
  }

  async fetchSwapsNetworkConfig(chainId) {
    const response = await fetchWithCache(
      getBaseApi('network', chainId),
      { method: 'GET' },
      { cacheRefreshTime: 600000 },
    );
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

  // Sets the network config from the MetaSwap API.
  async _setSwapsNetworkConfig() {
    const chainId = this._getCurrentChainId();
    let swapsNetworkConfig;
    try {
      swapsNetworkConfig = await this.fetchSwapsNetworkConfig(chainId);
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
        swapsStxStatusDeadline:
          swapsNetworkConfig?.stxStatusDeadline ||
          FALLBACK_SMART_TRANSACTIONS_DEADLINE,
        swapsStxMaxFeeMultiplier:
          swapsNetworkConfig?.stxMaxFeeMultiplier ||
          FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER,
      },
    });
  }

  // Once quotes are fetched, we poll for new ones to keep the quotes up to date. Market and aggregator contract conditions can change fast enough
  // that quotes will no longer be available after 1 or 2 minutes. When fetchAndSetQuotes is first called, it receives fetch parameters that are stored in
  // state. These stored parameters are used on subsequent calls made during polling.
  // Note: we stop polling after 3 requests, until new quotes are explicitly asked for. The logic that enforces that maximum is in the body of fetchAndSetQuotes
  pollForNewQuotes() {
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
    this.pollingTimeout = setTimeout(() => {
      const { swapsState } = this.store.getState();
      this.fetchAndSetQuotes(
        swapsState.fetchParams,
        swapsState.fetchParams?.metaData,
        true,
      );
    }, quotesRefreshRateInMs);
  }

  stopPollingForQuotes() {
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
    }
  }

  async fetchAndSetQuotes(
    fetchParams,
    fetchParamsMetaData = {},
    isPolledRequest,
  ) {
    const { chainId } = fetchParamsMetaData;
    const {
      swapsState: { quotesPollingLimitEnabled, saveFetchedQuotes },
    } = this.store.getState();

    if (!fetchParams) {
      return null;
    }
    // Every time we get a new request that is not from the polling, we reset the poll count so we can poll for up to three more sets of quotes with these new params.
    if (!isPolledRequest) {
      this.pollCount = 0;
    }

    // If there are any pending poll requests, clear them so that they don't get call while this new fetch is in process
    clearTimeout(this.pollingTimeout);

    if (!isPolledRequest) {
      this.setSwapsErrorKey('');
    }

    const indexOfCurrentCall = this.indexOfNewestCallInFlight + 1;
    this.indexOfNewestCallInFlight = indexOfCurrentCall;

    if (!saveFetchedQuotes) {
      this.setSaveFetchedQuotes(true);
    }

    let [newQuotes] = await Promise.all([
      this._fetchTradesInfo(fetchParams, {
        ...fetchParamsMetaData,
      }),
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

    newQuotes = mapValues(newQuotes, (quote) => ({
      ...quote,
      sourceTokenInfo: fetchParamsMetaData.sourceTokenInfo,
      destinationTokenInfo: fetchParamsMetaData.destinationTokenInfo,
    }));

    if (chainId === CHAIN_IDS.OPTIMISM && Object.values(newQuotes).length > 0) {
      await Promise.all(
        Object.values(newQuotes).map(async (quote) => {
          if (quote.trade) {
            const multiLayerL1TradeFeeTotal = await fetchEstimatedL1Fee(
              {
                txParams: quote.trade,
                chainId,
              },
              this.ethersProvider,
            );
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
      } else if (!isPolledRequest) {
        const { gasLimit: approvalGas } = await this.timedoutGasReturn(
          firstQuote.approvalNeeded,
        );

        newQuotes = mapValues(newQuotes, (quote) => ({
          ...quote,
          approvalNeeded: {
            ...quote.approvalNeeded,
            gas: approvalGas || DEFAULT_ERC20_APPROVE_GAS,
          },
        }));
      }
    }

    let topAggId = null;

    // We can reduce time on the loading screen by only doing this after the
    // loading screen and best quote have rendered.
    if (!approvalRequired && !fetchParams?.balanceError) {
      newQuotes = await this.getAllQuotesWithGasEstimates(newQuotes);
    }

    if (Object.values(newQuotes).length === 0) {
      this.setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR);
    } else {
      const [_topAggId, quotesWithSavingsAndFeeData] =
        await this._findTopQuoteAndCalculateSavings(newQuotes);
      topAggId = _topAggId;
      newQuotes = quotesWithSavingsAndFeeData;
    }

    // If a newer call has been made, don't update state with old information
    // Prevents timing conflicts between fetches
    if (this.indexOfNewestCallInFlight !== indexOfCurrentCall) {
      throw new Error(SWAPS_FETCH_ORDER_CONFLICT);
    }

    const { swapsState } = this.store.getState();
    let { selectedAggId } = swapsState;
    if (!newQuotes[selectedAggId]) {
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
      // Otherwise we won't increase pollCount, so polling will run without a limit.
      this.pollCount += 1;
    }

    if (!quotesPollingLimitEnabled || this.pollCount < POLL_COUNT_LIMIT + 1) {
      this.pollForNewQuotes();
    } else {
      this.resetPostFetchState();
      this.setSwapsErrorKey(QUOTES_EXPIRED_ERROR);
      return null;
    }

    return [newQuotes, topAggId];
  }

  safeRefetchQuotes() {
    const { swapsState } = this.store.getState();
    if (!this.pollingTimeout && swapsState.fetchParams) {
      this.fetchAndSetQuotes(swapsState.fetchParams);
    }
  }

  setSelectedQuoteAggId(selectedAggId) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, selectedAggId } });
  }

  setSwapsTokens(tokens) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, tokens } });
  }

  clearSwapsQuotes() {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, quotes: {} } });
  }

  setSwapsErrorKey(errorKey) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, errorKey } });
  }

  async getAllQuotesWithGasEstimates(quotes) {
    const quoteGasData = await Promise.all(
      Object.values(quotes).map(async (quote) => {
        const { gasLimit, simulationFails } = await this.timedoutGasReturn(
          quote.trade,
        );
        return [gasLimit, simulationFails, quote.aggregator];
      }),
    );

    const newQuotes = {};
    quoteGasData.forEach(([gasLimit, simulationFails, aggId]) => {
      if (gasLimit && !simulationFails) {
        const gasEstimateWithRefund = calculateGasEstimateWithRefund(
          quotes[aggId].maxGas,
          quotes[aggId].estimatedRefund,
          gasLimit,
        );

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

  timedoutGasReturn(tradeTxParams) {
    return new Promise((resolve) => {
      let gasTimedOut = false;

      const gasTimeout = setTimeout(() => {
        gasTimedOut = true;
        resolve({ gasLimit: null, simulationFails: true });
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
          log.error(e);
          if (!gasTimedOut) {
            clearTimeout(gasTimeout);
            resolve({ gasLimit: null, simulationFails: true });
          }
        });
    });
  }

  async setInitialGasEstimate(initialAggId) {
    const { swapsState } = this.store.getState();

    const quoteToUpdate = { ...swapsState.quotes[initialAggId] };

    const { gasLimit: newGasEstimate, simulationFails } =
      await this.timedoutGasReturn(quoteToUpdate.trade);

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

  setApproveTxId(approveTxId) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, approveTxId } });
  }

  setTradeTxId(tradeTxId) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, tradeTxId } });
  }

  setQuotesLastFetched(quotesLastFetched) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, quotesLastFetched },
    });
  }

  setSwapsTxGasPrice(gasPrice) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, customGasPrice: gasPrice },
    });
  }

  setSwapsTxMaxFeePerGas(maxFeePerGas) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, customMaxFeePerGas: maxFeePerGas },
    });
  }

  setSwapsUserFeeLevel(swapsUserFeeLevel) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, swapsUserFeeLevel },
    });
  }

  setSwapsQuotesPollingLimitEnabled(quotesPollingLimitEnabled) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, quotesPollingLimitEnabled },
    });
  }

  setSwapsTxMaxFeePriorityPerGas(maxPriorityFeePerGas) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: {
        ...swapsState,
        customMaxPriorityFeePerGas: maxPriorityFeePerGas,
      },
    });
  }

  setSwapsTxGasLimit(gasLimit) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, customMaxGas: gasLimit },
    });
  }

  setCustomApproveTxData(data) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, customApproveTxData: data },
    });
  }

  setBackgroundSwapRouteState(routeState) {
    const { swapsState } = this.store.getState();
    this.store.updateState({ swapsState: { ...swapsState, routeState } });
  }

  setSaveFetchedQuotes(status) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, saveFetchedQuotes: status },
    });
  }

  setSwapsLiveness(swapsLiveness) {
    const { swapsState } = this.store.getState();
    const { swapsFeatureIsLive } = swapsLiveness;
    this.store.updateState({
      swapsState: { ...swapsState, swapsFeatureIsLive },
    });
  }

  setSwapsFeatureFlags(swapsFeatureFlags) {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: { ...swapsState, swapsFeatureFlags },
    });
  }

  resetPostFetchState() {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: {
        ...initialState.swapsState,
        tokens: swapsState.tokens,
        fetchParams: swapsState.fetchParams,
        swapsFeatureIsLive: swapsState.swapsFeatureIsLive,
        swapsQuoteRefreshTime: swapsState.swapsQuoteRefreshTime,
        swapsQuotePrefetchingRefreshTime:
          swapsState.swapsQuotePrefetchingRefreshTime,
        swapsFeatureFlags: swapsState.swapsFeatureFlags,
      },
    });
    clearTimeout(this.pollingTimeout);
  }

  resetSwapsState() {
    const { swapsState } = this.store.getState();
    this.store.updateState({
      swapsState: {
        ...initialState.swapsState,
        swapsQuoteRefreshTime: swapsState.swapsQuoteRefreshTime,
        swapsQuotePrefetchingRefreshTime:
          swapsState.swapsQuotePrefetchingRefreshTime,
      },
    });
    clearTimeout(this.pollingTimeout);
  }

  async _findTopQuoteAndCalculateSavings(quotes = {}) {
    const { contractExchangeRates: tokenConversionRates } =
      this.getTokenRatesState();
    const {
      swapsState: { customGasPrice, customMaxPriorityFeePerGas },
    } = this.store.getState();
    const chainId = this._getCurrentChainId();

    const numQuotes = Object.keys(quotes).length;
    if (!numQuotes) {
      return {};
    }

    const newQuotes = cloneDeep(quotes);

    const { gasFeeEstimates, gasEstimateType } =
      await this._getEIP1559GasFeeEstimates();

    let usedGasPrice = '0x0';

    if (gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
      const {
        high: { suggestedMaxPriorityFeePerGas },
        estimatedBaseFee,
      } = gasFeeEstimates;

      usedGasPrice = addCurrencies(
        customMaxPriorityFeePerGas || // Is already in hex WEI.
          decGWEIToHexWEI(suggestedMaxPriorityFeePerGas),
        decGWEIToHexWEI(estimatedBaseFee),
        {
          aBase: 16,
          bBase: 16,
          toNumericBase: 'hex',
          numberOfDecimals: 6,
        },
      );
    } else if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
      usedGasPrice = customGasPrice || decGWEIToHexWEI(gasFeeEstimates.high);
    } else if (gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
      usedGasPrice =
        customGasPrice || decGWEIToHexWEI(gasFeeEstimates.gasPrice);
    }

    let topAggId = null;
    let overallValueOfBestQuoteForSorting = null;

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
      const totalWeiCost = new BigNumber(gasTotalInWeiHex, 16).plus(
        trade.value,
        16,
      );

      const totalEthCost = conversionUtil(totalWeiCost, {
        fromCurrency: 'ETH',
        fromDenomination: 'WEI',
        toDenomination: 'ETH',
        fromNumericBase: 'BN',
        numberOfDecimals: 6,
      });

      // The total fee is aggregator/exchange fees plus gas fees.
      // If the swap is from the selected chain's default token, subtract
      // the sourceAmount from the total cost. Otherwise, the total fee
      // is simply trade.value plus gas fees.
      const ethFee = isSwapsDefaultTokenAddress(sourceToken, chainId)
        ? conversionUtil(
            totalWeiCost.minus(sourceAmount, 10), // sourceAmount is in wei
            {
              fromCurrency: 'ETH',
              fromDenomination: 'WEI',
              toDenomination: 'ETH',
              fromNumericBase: 'BN',
              numberOfDecimals: 6,
            },
          )
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

      const tokenConversionRate =
        tokenConversionRates[
          Object.keys(tokenConversionRates).find((tokenAddress) =>
            isEqualCaseInsensitive(tokenAddress, destinationToken),
          )
        ];
      const conversionRateForSorting = tokenConversionRate || 1;

      const ethValueOfTokens = decimalAdjustedDestinationAmount.times(
        conversionRateForSorting.toString(10),
        10,
      );

      const conversionRateForCalculations = isSwapsDefaultTokenAddress(
        destinationToken,
        chainId,
      )
        ? 1
        : tokenConversionRate;

      const overallValueOfQuoteForSorting =
        conversionRateForCalculations === undefined
          ? ethValueOfTokens
          : ethValueOfTokens.minus(ethFee, 10);

      quote.ethFee = ethFee.toString(10);

      if (conversionRateForCalculations !== undefined) {
        quote.ethValueOfTokens = ethValueOfTokens.toString(10);
        quote.overallValueOfQuote = overallValueOfQuoteForSorting.toString(10);
        quote.metaMaskFeeInEth = metaMaskFeeInTokens
          .times(conversionRateForCalculations.toString(10))
          .toString(10);
      }

      if (
        overallValueOfBestQuoteForSorting === null ||
        overallValueOfQuoteForSorting.gt(overallValueOfBestQuoteForSorting)
      ) {
        topAggId = aggregator;
        overallValueOfBestQuoteForSorting = overallValueOfQuoteForSorting;
      }
    });

    const isBest =
      isSwapsDefaultTokenAddress(
        newQuotes[topAggId].destinationToken,
        chainId,
      ) ||
      Boolean(
        tokenConversionRates[
          Object.keys(tokenConversionRates).find((tokenAddress) =>
            isEqualCaseInsensitive(
              tokenAddress,
              newQuotes[topAggId]?.destinationToken,
            ),
          )
        ],
      );

    let savings = null;

    if (isBest) {
      const bestQuote = newQuotes[topAggId];

      savings = {};

      const {
        ethFee: medianEthFee,
        metaMaskFeeInEth: medianMetaMaskFee,
        ethValueOfTokens: medianEthValueOfTokens,
      } = getMedianEthValueQuote(Object.values(newQuotes));

      // Performance savings are calculated as:
      //   (ethValueOfTokens for the best trade) - (ethValueOfTokens for the media trade)
      savings.performance = new BigNumber(bestQuote.ethValueOfTokens, 10).minus(
        medianEthValueOfTokens,
        10,
      );

      // Fee savings are calculated as:
      //   (fee for the median trade) - (fee for the best trade)
      savings.fee = new BigNumber(medianEthFee).minus(bestQuote.ethFee, 10);

      savings.metaMaskFee = bestQuote.metaMaskFeeInEth;

      // Total savings are calculated as:
      //   performance savings + fee savings - metamask fee
      savings.total = savings.performance
        .plus(savings.fee)
        .minus(savings.metaMaskFee)
        .toString(10);
      savings.performance = savings.performance.toString(10);
      savings.fee = savings.fee.toString(10);
      savings.medianMetaMaskFee = medianMetaMaskFee;

      newQuotes[topAggId].isBestQuote = true;
      newQuotes[topAggId].savings = savings;
    }

    return [topAggId, newQuotes];
  }

  async _getERC20Allowance(contractAddress, walletAddress, chainId) {
    const contract = new ethers.Contract(
      contractAddress,
      abi,
      this.ethersProvider,
    );
    return await contract.allowance(
      walletAddress,
      SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[chainId],
    );
  }
}

/**
 * Calculates the median overallValueOfQuote of a sample of quotes.
 *
 * @param {Array} _quotes - A sample of quote objects with overallValueOfQuote, ethFee, metaMaskFeeInEth, and ethValueOfTokens properties
 * @returns {object} An object with the ethValueOfTokens, ethFee, and metaMaskFeeInEth of the quote with the median overallValueOfQuote
 */
function getMedianEthValueQuote(_quotes) {
  if (!Array.isArray(_quotes) || _quotes.length === 0) {
    throw new Error('Expected non-empty array param.');
  }

  const quotes = [..._quotes];

  quotes.sort((quoteA, quoteB) => {
    const overallValueOfQuoteA = new BigNumber(quoteA.overallValueOfQuote, 10);
    const overallValueOfQuoteB = new BigNumber(quoteB.overallValueOfQuote, 10);
    if (overallValueOfQuoteA.equals(overallValueOfQuoteB)) {
      return 0;
    }
    return overallValueOfQuoteA.lessThan(overallValueOfQuoteB) ? -1 : 1;
  });

  if (quotes.length % 2 === 1) {
    // return middle values
    const medianOverallValue =
      quotes[(quotes.length - 1) / 2].overallValueOfQuote;
    const quotesMatchingMedianQuoteValue = quotes.filter(
      (quote) => medianOverallValue === quote.overallValueOfQuote,
    );
    return meansOfQuotesFeesAndValue(quotesMatchingMedianQuoteValue);
  }

  // return mean of middle two values
  const upperIndex = quotes.length / 2;
  const lowerIndex = upperIndex - 1;

  const overallValueAtUpperIndex = quotes[upperIndex].overallValueOfQuote;
  const overallValueAtLowerIndex = quotes[lowerIndex].overallValueOfQuote;

  const quotesMatchingUpperIndexValue = quotes.filter(
    (quote) => overallValueAtUpperIndex === quote.overallValueOfQuote,
  );
  const quotesMatchingLowerIndexValue = quotes.filter(
    (quote) => overallValueAtLowerIndex === quote.overallValueOfQuote,
  );

  const feesAndValueAtUpperIndex = meansOfQuotesFeesAndValue(
    quotesMatchingUpperIndexValue,
  );
  const feesAndValueAtLowerIndex = meansOfQuotesFeesAndValue(
    quotesMatchingLowerIndexValue,
  );

  return {
    ethFee: new BigNumber(feesAndValueAtUpperIndex.ethFee, 10)
      .plus(feesAndValueAtLowerIndex.ethFee, 10)
      .dividedBy(2)
      .toString(10),
    metaMaskFeeInEth: new BigNumber(
      feesAndValueAtUpperIndex.metaMaskFeeInEth,
      10,
    )
      .plus(feesAndValueAtLowerIndex.metaMaskFeeInEth, 10)
      .dividedBy(2)
      .toString(10),
    ethValueOfTokens: new BigNumber(
      feesAndValueAtUpperIndex.ethValueOfTokens,
      10,
    )
      .plus(feesAndValueAtLowerIndex.ethValueOfTokens, 10)
      .dividedBy(2)
      .toString(10),
  };
}

/**
 * Calculates the arithmetic mean for each of three properties - ethFee, metaMaskFeeInEth and ethValueOfTokens - across
 * an array of objects containing those properties.
 *
 * @param {Array} quotes - A sample of quote objects with overallValueOfQuote, ethFee, metaMaskFeeInEth and
 * ethValueOfTokens properties
 * @returns {object} An object with the arithmetic mean each of the ethFee, metaMaskFeeInEth and ethValueOfTokens of
 * the passed quote objects
 */
function meansOfQuotesFeesAndValue(quotes) {
  const feeAndValueSumsAsBigNumbers = quotes.reduce(
    (feeAndValueSums, quote) => ({
      ethFee: feeAndValueSums.ethFee.plus(quote.ethFee, 10),
      metaMaskFeeInEth: feeAndValueSums.metaMaskFeeInEth.plus(
        quote.metaMaskFeeInEth,
        10,
      ),
      ethValueOfTokens: feeAndValueSums.ethValueOfTokens.plus(
        quote.ethValueOfTokens,
        10,
      ),
    }),
    {
      ethFee: new BigNumber(0, 10),
      metaMaskFeeInEth: new BigNumber(0, 10),
      ethValueOfTokens: new BigNumber(0, 10),
    },
  );

  return {
    ethFee: feeAndValueSumsAsBigNumbers.ethFee
      .div(quotes.length, 10)
      .toString(10),
    metaMaskFeeInEth: feeAndValueSumsAsBigNumbers.metaMaskFeeInEth
      .div(quotes.length, 10)
      .toString(10),
    ethValueOfTokens: feeAndValueSumsAsBigNumbers.ethValueOfTokens
      .div(quotes.length, 10)
      .toString(10),
  };
}

export const utils = {
  getMedianEthValueQuote,
  meansOfQuotesFeesAndValue,
};
