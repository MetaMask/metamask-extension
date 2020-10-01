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
} from '../../../ui/app/helpers/constants/swaps'
import {
  fetchTradesInfo as defaultFetchTradesInfo,
} from '../../../ui/app/pages/swaps/swaps.util'

const METASWAP_ADDRESS = '0x9537C111Ea62a8dc39E99718140686f7aD856321'

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
    showAwaitingSwapScreen: false,
    tradeTxId: null,
    approveTxId: null,
    maxMode: false,
    quotesLastFetched: null,
    customMaxGas: '',
    customGasPrice: null,
    selectedAggId: null,
    customApproveTxData: '',
    errorKey: '',
    topAggId: null,
    routeState: '',
  },
}

export default class SwapsController {
  constructor ({
    getBufferedGasLimit,
    provider,
    getProviderConfig,
    tokenRatesStore,
    fetchTradesInfo = defaultFetchTradesInfo,
  }) {
    this.store = new ObservableStore({
      swapsState: { ...initialState.swapsState },
    })

    this._fetchTradesInfo = fetchTradesInfo

    this.getBufferedGasLimit = getBufferedGasLimit
    this.tokenRatesStore = tokenRatesStore

    this.pollCount = 0
    this.getProviderConfig = getProviderConfig

    this.ethersProvider = new ethers.providers.Web3Provider(provider)
  }

  // TODO: remove before final merge
  // The metaswap test net is added as a custom rpc with a chainId of 1. For the purposes of the test phase,
  // If we have a custom rpcTarget with a chainId of 1, we regard it to be the metaswap test net.
  _isMetaSwapTestNet () {
    const providerConfig = this.getProviderConfig()
    return providerConfig.chainId === '1' && providerConfig.rpcTarget.length > 0
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
    this.setQuotes({})
    this.setQuotesLastFetched(null)
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
        const { gasLimit: approvalGas } = await this.timedoutGasReturn({
          ...Object.values(newQuotes)[0].approvalNeeded,
          gas: DEFAULT_ERC20_APPROVE_GAS,
        })

        newQuotes = mapValues(newQuotes, (quote) => ({
          ...quote,
          approvalNeeded: {
            ...quote.approvalNeeded,
            gas: approvalGas || DEFAULT_ERC20_APPROVE_GAS,
          },
        }))
      }
    }

    const topAggIdData = await this._findTopQuoteAggId(newQuotes)
    let { topAggId } = topAggIdData
    const { isBest } = topAggIdData

    if (isBest) {
      newQuotes[topAggId].isBestQuote = true
    }

    // We can reduce time on the loading screen by only doing this after the
    // loading screen and best quote have rendered.
    if (!approvalRequired && !fetchParams?.balanceError) {
      newQuotes = await this.getAllQuotesWithGasEstimates(newQuotes)

      if (Object.values(newQuotes).length === 0) {
        this.setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR)
      } else {
        const {
          topAggId: topAggIdAfterGasEstimates,
          isBest: isBestAfterGasEstimates,
        } = await this._findTopQuoteAggId(newQuotes)
        topAggId = topAggIdAfterGasEstimates
        if (isBestAfterGasEstimates) {
          newQuotes = mapValues(newQuotes, (quote) => ({ ...quote, isBestQuote: false }))
          newQuotes[topAggId].isBestQuote = true
        }
      }
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

  setQuotes (quotes) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, quotes } })
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
    // TODO: remove isMetaSwapTestNet logic before final merge
    const isMetaSwapTestNet = this._isMetaSwapTestNet()
    const quoteGasData = await Promise.all(
      Object.values(quotes).map(async (quote) => {
        const { gasLimit, simulationFails } = await this.timedoutGasReturn({
          ...quote.trade,
          gas: `0x${(quote.maxGas || MAX_GAS_LIMIT).toString(16)}`,
        })
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
      } else if (quotes[aggId].approvalNeeded || isMetaSwapTestNet) {
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

      this.getBufferedGasLimit({ txParams: tradeTxParams }, 1)
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

  async setInitialGasEstimate (initialAggId, baseGasEstimate) {
    const { swapsState } = this.store.getState()

    const quoteToUpdate = { ...swapsState.quotes[initialAggId] }

    const {
      gasLimit: newGasEstimate,
      simulationFails,
    } = await this.timedoutGasReturn({
      ...quoteToUpdate.trade,
      gas: baseGasEstimate,
    })

    if (newGasEstimate && !simulationFails) {
      const gasEstimateWithRefund = calculateGasEstimateWithRefund(quoteToUpdate.maxGas, quoteToUpdate.estimatedRefund, newGasEstimate)

      quoteToUpdate.gasEstimate = newGasEstimate
      quoteToUpdate.gasEstimateWithRefund = gasEstimateWithRefund
    }

    this.store.updateState({
      swapsState: { ...swapsState, quotes: { ...swapsState.quotes, [initialAggId]: quoteToUpdate } },
    })
  }

  setShowAwaitingSwapScreen (showAwaitingSwapScreen) {
    const { swapsState } = this.store.getState()
    this.store.updateState({
      swapsState: { ...swapsState, showAwaitingSwapScreen },
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

  setMaxMode (maxMode) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, maxMode } })
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

  resetPostFetchState () {
    const { swapsState } = this.store.getState()

    this.store.updateState({
      swapsState: {
        ...initialState.swapsState,
        tokens: swapsState.tokens,
        fetchParams: swapsState.fetchParams,
      },
    })
    clearTimeout(this.pollingTimeout)
  }

  resetSwapsState () {
    const { swapsState } = this.store.getState()

    this.store.updateState({
      swapsState: { ...initialState.swapsState, tokens: swapsState.tokens },
    })
    clearTimeout(this.pollingTimeout)
  }

  async _findTopQuoteAggId (quotes) {
    const tokenConversionRates = this.tokenRatesStore.getState()
      .contractExchangeRates
    const {
      swapsState: { customGasPrice },
    } = this.store.getState()

    if (!Object.values(quotes).length) {
      return {}
    }

    let usedGasPrice = customGasPrice

    if (!usedGasPrice) {
      usedGasPrice = await this.ethersProvider.getGasPrice()
      usedGasPrice = usedGasPrice.toHexString()
    }

    let topAggId = ''
    let ethValueOfTradeForBestQuote = null

    Object.values(quotes).forEach((quote) => {
      const {
        destinationAmount = 0,
        destinationToken,
        destinationTokenInfo,
        trade,
        approvalNeeded,
        averageGas,
        gasEstimate,
        aggregator,
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
      const totalEthCost = new BigNumber(gasTotalInWeiHex, 16).plus(
        trade.value,
        16,
      )
      const ethFee = conversionUtil(totalEthCost, {
        fromCurrency: 'ETH',
        fromDenomination: 'WEI',
        toDenomination: 'ETH',
        fromNumericBase: 'BN',
        numberOfDecimals: 6,
      })

      const tokenConversionRate = tokenConversionRates[destinationToken]
      const ethValueOfTrade =
        destinationTokenInfo.symbol === 'ETH'
          ? calcTokenAmount(destinationAmount, 18).minus(ethFee, 10)
          : new BigNumber(tokenConversionRate || 1, 10)
            .times(
              calcTokenAmount(
                destinationAmount,
                destinationTokenInfo.decimals,
              ),
              10,
            )
            .minus(tokenConversionRate ? ethFee.toString(10) : 0, 10)

      if (
        ethValueOfTradeForBestQuote === null ||
        ethValueOfTrade.gt(ethValueOfTradeForBestQuote)
      ) {
        topAggId = aggregator
        ethValueOfTradeForBestQuote = ethValueOfTrade
      }
    })

    const isBest =
      quotes[topAggId]?.destinationTokenInfo?.symbol === 'ETH' ||
      Boolean(tokenConversionRates[quotes[topAggId]?.destinationToken])

    return { topAggId, isBest }
  }

  async _getERC20Allowance (contractAddress, walletAddress) {
    const contract = new ethers.Contract(
      contractAddress, abi, this.ethersProvider,
    )
    return await contract.allowance(walletAddress, METASWAP_ADDRESS)
  }
}
