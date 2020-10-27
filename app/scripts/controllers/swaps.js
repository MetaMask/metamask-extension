import { ethers } from 'ethers'
import log from 'loglevel'
import BigNumber from 'bignumber.js'
import ObservableStore from 'obs-store'
import { mapValues } from 'lodash'
import abi from 'human-standard-token-abi'
import { calcTokenAmount } from '../../../ui/app/helpers/utils/token-util'
import { calcGasTotal } from '../../../ui/app/pages/send/send.utils'
import { conversionUtil } from '../../../ui/app/helpers/utils/conversion-util'
import {
  ETH_SWAPS_TOKEN_ADDRESS,
  DEFAULT_ERC20_APPROVE_GAS,
  QUOTES_EXPIRED_ERROR,
  QUOTES_NOT_AVAILABLE_ERROR,
  SWAPS_FETCH_ORDER_CONFLICT,
} from '../../../ui/app/helpers/constants/swaps'
import {
  fetchTradesInfo as defaultFetchTradesInfo,
  fetchSwapsFeatureLiveness as defaultFetchSwapsFeatureLiveness,
} from '../../../ui/app/pages/swaps/swaps.util'
import { MAINNET_CHAIN_ID } from './network/enums'

const METASWAP_ADDRESS = '0x881d40237659c251811cec9c364ef91dc08d300c'

// The MAX_GAS_LIMIT is a number that is higher than the maximum gas costs we have observed on any aggregator
const MAX_GAS_LIMIT = 2500000

// To ensure that our serves are not spammed if MetaMask is left idle, we limit the number of fetches for quotes that are made on timed intervals.
// 3 seems to be an appropriate balance of giving users the time they need when MetaMask is not left idle, and turning polling off when it is.
const POLL_COUNT_LIMIT = 3

function calculateGasEstimateWithRefund (maxGas = MAX_GAS_LIMIT, estimatedRefund = 0, estimatedGas = 0) {
  const maxGasMinusRefund = new BigNumber(
    maxGas,
    10,
  )
    .minus(estimatedRefund, 10)

  const gasEstimateWithRefund = maxGasMinusRefund.lt(
    estimatedGas,
    16,
  )
    ? maxGasMinusRefund.toString(16)
    : estimatedGas

  return gasEstimateWithRefund
}

// This is the amount of time to wait, after successfully fetching quotes and their gas estimates, before fetching for new quotes
const QUOTE_POLLING_INTERVAL = 50 * 1000

const initialState = {
  swapsState: {
    quotes: {},
    fetchParams: null,
    tokens: null,
    tradeTxId: null,
    approveTxId: null,
    quotesLastFetched: null,
    customMaxGas: '',
    customGasPrice: null,
    selectedAggId: null,
    customApproveTxData: '',
    errorKey: '',
    topAggId: null,
    routeState: '',
    swapsFeatureIsLive: false,
  },
}

export default class SwapsController {
  constructor ({
    getBufferedGasLimit,
    provider,
    getProviderConfig,
    tokenRatesStore,
    fetchTradesInfo = defaultFetchTradesInfo,
    fetchSwapsFeatureLiveness = defaultFetchSwapsFeatureLiveness,
  }) {
    this.store = new ObservableStore({
      swapsState: { ...initialState.swapsState },
    })

    this._fetchTradesInfo = fetchTradesInfo
    this._fetchSwapsFeatureLiveness = fetchSwapsFeatureLiveness

    this.getBufferedGasLimit = getBufferedGasLimit
    this.tokenRatesStore = tokenRatesStore

    this.pollCount = 0
    this.getProviderConfig = getProviderConfig

    this.indexOfNewestCallInFlight = 0

    // The chain ID is hard-coded as Mainnet because swaps is only used on Mainnet
    this.ethersProvider = new ethers.providers.Web3Provider(provider, parseInt(MAINNET_CHAIN_ID, 16))

    this._setupSwapsLivenessFetching()
  }

  // Once quotes are fetched, we poll for new ones to keep the quotes up to date. Market and aggregator contract conditions can change fast enough
  // that quotes will no longer be available after 1 or 2 minutes. When fetchAndSetQuotes is first called it, receives fetch that parameters are stored in
  // state. These stored parameters are used on subsequent calls made during polling.
  // Note: we stop polling after 3 requests, until new quotes are explicitly asked for. The logic that enforces that maximum is in the body of fetchAndSetQuotes
  pollForNewQuotes () {
    this.pollingTimeout = setTimeout(() => {
      const { swapsState } = this.store.getState()
      this.fetchAndSetQuotes(swapsState.fetchParams, swapsState.fetchParams.metaData, true)
    }, QUOTE_POLLING_INTERVAL)
  }

  stopPollingForQuotes () {
    clearTimeout(this.pollingTimeout)
  }

  async fetchAndSetQuotes (fetchParams, fetchParamsMetaData = {}, isPolledRequest) {
    if (!fetchParams) {
      return null
    }

    // Every time we get a new request that is not from the polling, we reset the poll count so we can poll for up to three more sets of quotes with these new params.
    if (!isPolledRequest) {
      this.pollCount = 0
    }

    // If there are any pending poll requests, clear them so that they don't get call while this new fetch is in process
    clearTimeout(this.pollingTimeout)

    if (!isPolledRequest) {
      this.setSwapsErrorKey('')
    }

    const indexOfCurrentCall = this.indexOfNewestCallInFlight + 1
    this.indexOfNewestCallInFlight = indexOfCurrentCall

    let newQuotes = await this._fetchTradesInfo(fetchParams)

    newQuotes = mapValues(newQuotes, (quote) => ({
      ...quote,
      sourceTokenInfo: fetchParamsMetaData.sourceTokenInfo,
      destinationTokenInfo: fetchParamsMetaData.destinationTokenInfo,
    }))

    const quotesLastFetched = Date.now()

    let approvalRequired = false
    if (fetchParams.sourceToken !== ETH_SWAPS_TOKEN_ADDRESS && Object.values(newQuotes).length) {
      const allowance = await this._getERC20Allowance(
        fetchParams.sourceToken,
        fetchParams.fromAddress,
      )

      // For a user to be able to swap a token, they need to have approved the MetaSwap contract to withdraw that token.
      // _getERC20Allowance() returns the amount of the token they have approved for withdrawal. If that amount is greater
      // than 0, it means that approval has already occured and is not needed. Otherwise, for tokens to be swapped, a new
      // call of the ERC-20 approve method is required.
      approvalRequired = allowance.eq(0)
      if (!approvalRequired) {
        newQuotes = mapValues(newQuotes, (quote) => ({
          ...quote,
          approvalNeeded: null,
        }))
      } else if (!isPolledRequest) {
        const { gasLimit: approvalGas } = await this.timedoutGasReturn(Object.values(newQuotes)[0].approvalNeeded)

        newQuotes = mapValues(newQuotes, (quote) => ({
          ...quote,
          approvalNeeded: {
            ...quote.approvalNeeded,
            gas: approvalGas || DEFAULT_ERC20_APPROVE_GAS,
          },
        }))
      }
    }

    let topAggId = null

    // We can reduce time on the loading screen by only doing this after the
    // loading screen and best quote have rendered.
    if (!approvalRequired && !fetchParams?.balanceError) {
      newQuotes = await this.getAllQuotesWithGasEstimates(newQuotes)
    }

    if (Object.values(newQuotes).length === 0) {
      this.setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR)
    } else {
      const topQuoteData = await this._findTopQuoteAndCalculateSavings(newQuotes)

      if (topQuoteData.topAggId) {
        topAggId = topQuoteData.topAggId
        newQuotes[topAggId].isBestQuote = topQuoteData.isBest
        newQuotes[topAggId].savings = topQuoteData.savings
      }
    }

    // If a newer call has been made, don't update state with old information
    // Prevents timing conflicts between fetches
    if (this.indexOfNewestCallInFlight !== indexOfCurrentCall) {
      throw new Error(SWAPS_FETCH_ORDER_CONFLICT)
    }

    const { swapsState } = this.store.getState()
    let { selectedAggId } = swapsState
    if (!newQuotes[selectedAggId]) {
      selectedAggId = null
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
    })

    // We only want to do up to a maximum of three requests from polling.
    this.pollCount += 1
    if (this.pollCount < POLL_COUNT_LIMIT + 1) {
      this.pollForNewQuotes()
    } else {
      this.resetPostFetchState()
      this.setSwapsErrorKey(QUOTES_EXPIRED_ERROR)
      return null
    }

    return [newQuotes, topAggId]
  }

  safeRefetchQuotes () {
    const { swapsState } = this.store.getState()
    if (!this.pollingTimeout && swapsState.fetchParams) {
      this.fetchAndSetQuotes(swapsState.fetchParams)
    }
  }

  setSelectedQuoteAggId (selectedAggId) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, selectedAggId } })
  }

  setSwapsTokens (tokens) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, tokens } })
  }

  setSwapsErrorKey (errorKey) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, errorKey } })
  }

  async getAllQuotesWithGasEstimates (quotes) {
    const quoteGasData = await Promise.all(
      Object.values(quotes).map(async (quote) => {
        const { gasLimit, simulationFails } = await this.timedoutGasReturn(quote.trade)
        return [gasLimit, simulationFails, quote.aggregator]
      }),
    )

    const newQuotes = {}
    quoteGasData.forEach(([gasLimit, simulationFails, aggId]) => {
      if (gasLimit && !simulationFails) {
        const gasEstimateWithRefund = calculateGasEstimateWithRefund(quotes[aggId].maxGas, quotes[aggId].estimatedRefund, gasLimit)

        newQuotes[aggId] = {
          ...quotes[aggId],
          gasEstimate: gasLimit,
          gasEstimateWithRefund,
        }
      } else if (quotes[aggId].approvalNeeded) {
        // If gas estimation fails, but an ERC-20 approve is needed, then we do not add any estimate property to the quote object
        // Such quotes will rely on the maxGas and averageGas properties from the api
        newQuotes[aggId] = quotes[aggId]
      }
      // If gas estimation fails and no approval is needed, then we filter that quote out, so that it is not shown to the user
    })
    return newQuotes
  }

  timedoutGasReturn (tradeTxParams) {
    return new Promise((resolve) => {
      let gasTimedOut = false

      const gasTimeout = setTimeout(() => {
        gasTimedOut = true
        resolve({ gasLimit: null, simulationFails: true })
      }, 5000)

      // Remove gas from params that will be passed to the `estimateGas` call
      // Including it can cause the estimate to fail if the actual gas needed
      // exceeds the passed gas
      const tradeTxParamsForGasEstimate = {
        data: tradeTxParams.data,
        from: tradeTxParams.from,
        to: tradeTxParams.to,
        value: tradeTxParams.value,
      }

      this.getBufferedGasLimit({ txParams: tradeTxParamsForGasEstimate }, 1)
        .then(({ gasLimit, simulationFails }) => {
          if (!gasTimedOut) {
            clearTimeout(gasTimeout)
            resolve({ gasLimit, simulationFails })
          }
        })
        .catch((e) => {
          log.error(e)
          if (!gasTimedOut) {
            clearTimeout(gasTimeout)
            resolve({ gasLimit: null, simulationFails: true })
          }
        })
    })
  }

  async setInitialGasEstimate (initialAggId) {
    const { swapsState } = this.store.getState()

    const quoteToUpdate = { ...swapsState.quotes[initialAggId] }

    const {
      gasLimit: newGasEstimate,
      simulationFails,
    } = await this.timedoutGasReturn(quoteToUpdate.trade)

    if (newGasEstimate && !simulationFails) {
      const gasEstimateWithRefund = calculateGasEstimateWithRefund(quoteToUpdate.maxGas, quoteToUpdate.estimatedRefund, newGasEstimate)

      quoteToUpdate.gasEstimate = newGasEstimate
      quoteToUpdate.gasEstimateWithRefund = gasEstimateWithRefund
    }

    this.store.updateState({
      swapsState: { ...swapsState, quotes: { ...swapsState.quotes, [initialAggId]: quoteToUpdate } },
    })
  }

  setApproveTxId (approveTxId) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, approveTxId } })
  }

  setTradeTxId (tradeTxId) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, tradeTxId } })
  }

  setQuotesLastFetched (quotesLastFetched) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, quotesLastFetched } })
  }

  setSwapsTxGasPrice (gasPrice) {
    const { swapsState } = this.store.getState()
    this.store.updateState({
      swapsState: { ...swapsState, customGasPrice: gasPrice },
    })
  }

  setSwapsTxGasLimit (gasLimit) {
    const { swapsState } = this.store.getState()
    this.store.updateState({
      swapsState: { ...swapsState, customMaxGas: gasLimit },
    })
  }

  setCustomApproveTxData (data) {
    const { swapsState } = this.store.getState()
    this.store.updateState({
      swapsState: { ...swapsState, customApproveTxData: data },
    })
  }

  setBackgroundSwapRouteState (routeState) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, routeState } })
  }

  setSwapsLiveness (swapsFeatureIsLive) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, swapsFeatureIsLive } })
  }

  resetPostFetchState () {
    const { swapsState } = this.store.getState()

    this.store.updateState({
      swapsState: {
        ...initialState.swapsState,
        tokens: swapsState.tokens,
        fetchParams: swapsState.fetchParams,
        swapsFeatureIsLive: swapsState.swapsFeatureIsLive,
      },
    })
    clearTimeout(this.pollingTimeout)
  }

  resetSwapsState () {
    const { swapsState } = this.store.getState()

    this.store.updateState({
      swapsState: { ...initialState.swapsState, tokens: swapsState.tokens, swapsFeatureIsLive: swapsState.swapsFeatureIsLive },
    })
    clearTimeout(this.pollingTimeout)
  }

  async _getEthersGasPrice () {
    const ethersGasPrice = await this.ethersProvider.getGasPrice()
    return ethersGasPrice.toHexString()
  }

  async _findTopQuoteAndCalculateSavings (quotes = {}) {
    const tokenConversionRates = this.tokenRatesStore.getState()
      .contractExchangeRates
    const {
      swapsState: { customGasPrice },
    } = this.store.getState()

    const numQuotes = Object.keys(quotes).length
    if (!numQuotes) {
      return {}
    }

    const usedGasPrice = customGasPrice || await this._getEthersGasPrice()

    let topAggId = ''
    let ethTradeValueOfBestQuote = null
    let ethFeeForBestQuote = null
    const allEthTradeValues = []
    const allEthFees = []

    Object.values(quotes).forEach((quote) => {
      const {
        aggregator,
        approvalNeeded,
        averageGas,
        destinationAmount = 0,
        destinationToken,
        destinationTokenInfo,
        gasEstimate,
        sourceAmount,
        sourceToken,
        trade,
      } = quote

      const tradeGasLimitForCalculation = gasEstimate
        ? new BigNumber(gasEstimate, 16)
        : new BigNumber(averageGas || MAX_GAS_LIMIT, 10)

      const totalGasLimitForCalculation = tradeGasLimitForCalculation
        .plus(approvalNeeded?.gas || '0x0', 16)
        .toString(16)

      const gasTotalInWeiHex = calcGasTotal(
        totalGasLimitForCalculation,
        usedGasPrice,
      )

      // trade.value is a sum of different values depending on the transaction.
      // It always includes any external fees charged by the quote source. In
      // addition, if the source asset is ETH, trade.value includes the amount
      // of swapped ETH.
      const totalWeiCost = new BigNumber(gasTotalInWeiHex, 16)
        .plus(trade.value, 16)

      const totalEthCost = conversionUtil(totalWeiCost, {
        fromCurrency: 'ETH',
        fromDenomination: 'WEI',
        toDenomination: 'ETH',
        fromNumericBase: 'BN',
        numberOfDecimals: 6,
      })

      // The total fee is aggregator/exchange fees plus gas fees.
      // If the swap is from ETH, subtract the sourceAmount from the total cost.
      // Otherwise, the total fee is simply trade.value plus gas fees.
      const ethFee = sourceToken === ETH_SWAPS_TOKEN_ADDRESS
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
        : totalEthCost

      const tokenConversionRate = tokenConversionRates[destinationToken]
      const ethValueOfTrade =
        destinationToken === ETH_SWAPS_TOKEN_ADDRESS
          ? calcTokenAmount(destinationAmount, 18).minus(totalEthCost, 10)
          : new BigNumber(tokenConversionRate || 1, 10)
            .times(
              calcTokenAmount(
                destinationAmount,
                destinationTokenInfo.decimals,
              ),
              10,
            )
            .minus(tokenConversionRate ? totalEthCost : 0, 10)

      // collect values for savings calculation
      allEthTradeValues.push(ethValueOfTrade)
      allEthFees.push(ethFee)

      if (
        ethTradeValueOfBestQuote === null ||
        ethValueOfTrade.gt(ethTradeValueOfBestQuote)
      ) {
        topAggId = aggregator
        ethTradeValueOfBestQuote = ethValueOfTrade
        ethFeeForBestQuote = ethFee
      }
    })

    const isBest =
      quotes[topAggId].destinationToken === ETH_SWAPS_TOKEN_ADDRESS ||
      Boolean(tokenConversionRates[quotes[topAggId]?.destinationToken])

    let savings = null

    if (isBest) {
      savings = {}
      // Performance savings are calculated as:
      //   valueForBestTrade - medianValueOfAllTrades
      savings.performance = ethTradeValueOfBestQuote.minus(
        getMedian(allEthTradeValues),
        10,
      )

      // Performance savings are calculated as:
      //   medianFeeOfAllTrades - feeForBestTrade
      savings.fee = getMedian(allEthFees).minus(
        ethFeeForBestQuote,
        10,
      )

      // Total savings are the sum of performance and fee savings
      savings.total = savings.performance.plus(savings.fee, 10).toString(10)
      savings.performance = savings.performance.toString(10)
      savings.fee = savings.fee.toString(10)
    }

    return { topAggId, isBest, savings }
  }

  async _getERC20Allowance (contractAddress, walletAddress) {
    const contract = new ethers.Contract(
      contractAddress, abi, this.ethersProvider,
    )
    return await contract.allowance(walletAddress, METASWAP_ADDRESS)
  }

  /**
   * Sets up the fetching of the swaps feature liveness flag from our API.
   * Performs an initial fetch when called, then fetches on a 10-minute
   * interval.
   *
   * If the browser goes offline, the interval is cleared and swaps are disabled
   * until the value can be fetched again.
   */
  _setupSwapsLivenessFetching () {
    const TEN_MINUTES_MS = 10 * 60 * 1000
    let intervalId = null

    const fetchAndSetupInterval = () => {
      if (window.navigator.onLine && intervalId === null) {
        // Set the interval first to prevent race condition between listener and
        // initial call to this function.
        intervalId = setInterval(this._fetchAndSetSwapsLiveness.bind(this), TEN_MINUTES_MS)
        this._fetchAndSetSwapsLiveness()
      }
    }

    window.addEventListener('online', fetchAndSetupInterval)
    window.addEventListener('offline', () => {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null

        const { swapsState } = this.store.getState()
        if (swapsState.swapsFeatureIsLive) {
          this.setSwapsLiveness(false)
        }
      }
    })

    fetchAndSetupInterval()
  }

  /**
   * This function should only be called via _setupSwapsLivenessFetching.
   *
   * Attempts to fetch the swaps feature liveness flag from our API. Tries
   * to fetch three times at 5-second intervals before giving up, in which
   * case the value defaults to 'false'.
   *
   * Only updates state if the fetched/computed flag value differs from current
   * state.
   */
  async _fetchAndSetSwapsLiveness () {
    const { swapsState } = this.store.getState()
    const { swapsFeatureIsLive: oldSwapsFeatureIsLive } = swapsState
    let swapsFeatureIsLive = false
    let successfullyFetched = false
    let numAttempts = 0

    const fetchAndIncrementNumAttempts = async () => {
      try {
        swapsFeatureIsLive = Boolean(await this._fetchSwapsFeatureLiveness())
        successfullyFetched = true
      } catch (err) {
        log.error(err)
        numAttempts += 1
      }
    }

    await fetchAndIncrementNumAttempts()

    // The loop conditions are modified by fetchAndIncrementNumAttempts.
    // eslint-disable-next-line no-unmodified-loop-condition
    while (!successfullyFetched && numAttempts < 3) {
      await new Promise((resolve) => {
        setTimeout(resolve, 5000) // 5 seconds
      })
      await fetchAndIncrementNumAttempts()
    }

    if (!successfullyFetched) {
      log.error('Failed to fetch swaps feature flag 3 times. Setting to false and trying again next interval.')
    }

    if (swapsFeatureIsLive !== oldSwapsFeatureIsLive) {
      this.setSwapsLiveness(swapsFeatureIsLive)
    }
  }
}

/**
 * Calculates the median of a sample of BigNumber values.
 *
 * @param {import('bignumber.js').BigNumber[]} values - A sample of BigNumber
 * values. The array will be sorted in place.
 * @returns {import('bignumber.js').BigNumber} The median of the sample.
 */
function getMedian (values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Expected non-empty array param.')
  }

  values.sort((a, b) => {
    if (a.equals(b)) {
      return 0
    }
    return a.lessThan(b) ? -1 : 1
  })

  if (values.length % 2 === 1) {
    // return middle value
    return values[(values.length - 1) / 2]
  }

  // return mean of middle two values
  const upperIndex = values.length / 2
  return values[upperIndex]
    .plus(values[upperIndex - 1])
    .dividedBy(2)
}

export const utils = {
  getMedian,
}
