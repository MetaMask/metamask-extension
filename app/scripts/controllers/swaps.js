import Web3 from 'web3'
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
  // QUOTES_EXPIRED_ERROR,
  // ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
} from '../../../ui/app/helpers/constants/swaps'
import { fetchTradesInfo } from '../../../ui/app/pages/swaps/swaps.util'

const METASWAP_ADDRESS = '0x9537C111Ea62a8dc39E99718140686f7aD856321'

function getERC20Allowance (contractAddress, walletAddress, eth) {
  const contract = eth.contract(abi).at(contractAddress)
  return new Promise((resolve, reject) => {
    contract.allowance(walletAddress, METASWAP_ADDRESS, (error, result) => {
      if (error) {
        return reject(error)
      }
      return resolve(result)
    })
  })
}

// This is the amount of time to wait, after successfully fetching quotes and their gas estimates, before fetching for new quotes
const QUOTE_POLLING_INTERVAL = 50 * 1000

const initialState = {
  swapsState: {
    quotes: {},
    quoteStatus: '',
    fetchParams: null,
    tokens: null,
    showAwaitingSwapScreen: false,
    tradeTxId: null,
    approveTxId: null,
    maxMode: false,
    quotesLastFetched: null,
    quotesStatus: '',
    balanceError: null,
    customMaxGas: '',
    customGasPrice: null,
    selectedAggId: null,
    customApproveTxData: '',
    errorKey: '',
  },
}

export default class SwapsController {
  constructor ({
    getBufferedGasLimit,
    provider,
    getProviderConfig,
    tokenRatesStore,
  }) {
    this.store = new ObservableStore({
      swapsState: { ...initialState.swapsState },
    })

    this.getBufferedGasLimit = getBufferedGasLimit
    this.tokenRatesStore = tokenRatesStore

    this.pollCount = 0
    this.getProviderConfig = getProviderConfig

    this.web3 = new Web3(provider)
  }

  // TODO: remove before final merge
  // The metaswap test net is added as a custom rpc with a chainId of 1. For the purposes of the test phase,
  // If we have a custom rpcTarget with a chainId of 1, we regard it to be the metaswap test net.
  _isMetaSwapTestNet () {
    const providerConfig = this.getProviderConfig()
    return providerConfig.chainId === '1' && providerConfig.rpcTarget.length > 0
  }

  async fetchAndSetQuotes (newFetchParams) {
    const { swapsState } = this.store.getState()
    if (newFetchParams) {
      clearTimeout(this.timeout)
      this.pollCount = 0
    }

    const fetchParams = newFetchParams || swapsState.fetchParams
    if (!fetchParams) {
      return null
    }

    if (newFetchParams) {
      this.setSwapsErrorKey('')
    }
    let newQuotes = await fetchTradesInfo(fetchParams)
    const quotesLastFetched = Date.now()

    let approvalNeeded = false
    if (fetchParams.sourceToken !== ETH_SWAPS_TOKEN_ADDRESS) {
      const allowance = await getERC20Allowance(
        fetchParams.sourceToken,
        fetchParams.fromAddress,
        this.web3.eth,
      )

      approvalNeeded = !allowance.gt(0)
      if (!approvalNeeded) {
        newQuotes = mapValues(newQuotes, (quote) => ({
          ...quote,
          approvalNeeded: null,
        }))
      } else if (newFetchParams) {
        const { gasLimit: approvalGas } = await this.timedoutGasReturn({
          ...newQuotes[0].approvalNeeded,
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

    const { topAggId, isBest } = this._findTopQuoteAggId(newQuotes)

    let selectedAggId = swapsState.selectedAggId || topAggId
    if (isBest) {
      newQuotes[topAggId].isBestQuote = true
    }

    // We can reduce time on the loading screen by only doing this after the
    // loading screen and best quote have rendered.
    if (!approvalNeeded && !newFetchParams?.balanceError) {
      newQuotes = await this.getAllQuotesWithGasEstimates(newQuotes)

      if (Object.values(newQuotes).length === 0) {
        this.setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR)
      } else {
        const {
          topAggId: topAggIdAfterGasEstimates,
          isBest: isBestAfterGasEstimates,
        } = this._findTopQuoteAggId(newQuotes)
        if (isBestAfterGasEstimates) {
          newQuotes[topAggId].isBestQuote = true
        }
        if (!selectedAggId || !newQuotes[selectedAggId]) {
          selectedAggId = topAggIdAfterGasEstimates
        }
      }
    }

    this.store.updateState({
      swapsState: {
        ...swapsState,
        quotes: newQuotes,
        fetchParams,
        quotesLastFetched,
        selectedAggId,
      },
    })

    this.pollCount += 1
    if (this.pollCount < 4) {
      clearTimeout(this.timeout)
      this.pollForNewQuotes()
    } else {
      clearTimeout(this.timeout)
      this.resetPostFetchState()
      this.setQuotesStatus('expired')
      return null
    }

    if (newFetchParams) {
      return [newQuotes, selectedAggId]
    }
    return null
  }

  safeRefetchQuotes () {
    const { swapsState } = this.store.getState()
    if (!this.timeout && swapsState.fetchParams) {
      this.fetchAndSetQuotes(swapsState.fetchParams)
    }
  }

  pollForNewQuotes () {
    this.timeout = setTimeout(() => {
      this.fetchAndSetQuotes()
    }, QUOTE_POLLING_INTERVAL)
  }

  stopPollingForQuotes () {
    clearTimeout(this.timeout)
    this.setQuotes({})
    this.setQuotesStatus('')
    this.setQuotesLastFetched(null)
  }

  setFetchParams (fetchParams) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, fetchParams } })
  }

  setQuotes (quotes) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, quotes } })
  }

  setQuotesStatus (quotesStatus) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, quotesStatus } })
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
    const isMetaSwapTestNet = this._isMetaSwapTestNet()
    const quoteGasData = await Promise.all(
      Object.values(quotes).map(async (quote) => {
        const { gasLimit, simulationFails } = await this.timedoutGasReturn({
          ...quote.trade,
          gas: `0x${quote.maxGas.toString(16)}`,
        })
        return [gasLimit, simulationFails, quote.aggregator]
      }),
    )

    const newQuotes = {}
    quoteGasData.forEach(([gasLimit, simulationFails, aggId]) => {
      if (gasLimit && !simulationFails) {
        const maxGasMinusRefund = new BigNumber(quotes[aggId].maxGas, 16)
          .minus(quotes[aggId].estimatedRefund || 0, 10)
          .toString(16)

        const gasEstimateWithRefund = new BigNumber(maxGasMinusRefund, 16).lt(
          gasLimit,
          16,
        )
          ? maxGasMinusRefund
          : gasLimit

        newQuotes[aggId] = {
          ...quotes[aggId],
          gasEstimate: gasLimit,
          gasEstimateWithRefund,
        }
      } else if (quotes[aggId].approvalNeeded || isMetaSwapTestNet) {
        newQuotes[aggId] = quotes[aggId]
      }
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

    const updatedQuotes = { ...swapsState.quotes }

    const {
      gasLimit: newGasEstimate,
      simulationFails,
    } = await this.timedoutGasReturn({
      ...updatedQuotes[initialAggId].trade,
      gas: baseGasEstimate,
    })

    if (newGasEstimate && !simulationFails) {
      const maxGasMinusRefund = new BigNumber(
        updatedQuotes[initialAggId].maxGas,
        16,
      )
        .minus(updatedQuotes[initialAggId].estimatedRefund || 0, 10)
        .toString(16)

      const gasEstimateWithRefund = new BigNumber(maxGasMinusRefund, 16).lt(
        newGasEstimate,
        16,
      )
        ? maxGasMinusRefund
        : newGasEstimate

      updatedQuotes[initialAggId].gasEstimate = newGasEstimate
      updatedQuotes[initialAggId].gasEstimateWithRefund = gasEstimateWithRefund
    }

    this.store.updateState({
      swapsState: { ...swapsState, quotes: updatedQuotes },
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

  setBackgoundSwapRouteState (routeState) {
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
    clearTimeout(this.timeout)
  }

  resetSwapsState () {
    const { swapsState } = this.store.getState()

    this.store.updateState({
      swapsState: { ...initialState.swapsState, tokens: swapsState.tokens },
    })
    clearTimeout(this.timeout)
  }

  _findTopQuoteAggId (quotes) {
    const tokenConversionRates = this.tokenRatesStore.getState()
      .contractExchangeRates
    const {
      swapsState: { customGasPrice },
    } = this.store.getState()

    if (!Object.values(quotes)?.length) {
      return {}
    }

    let topAggId = ''
    let ethValueOfTradeForBestQuote = null

    Object.values(quotes).forEach((quote) => {
      const {
        destinationAmount = 0,
        destinationToken,
        trade,
        approvalNeeded,
        averageGas,
        gasEstimate,
        aggregator,
      } = quote
      const tradeGasLimitForCalculation = gasEstimate
        ? new BigNumber(gasEstimate, 16)
        : new BigNumber(averageGas, 10)
      const totalGasLimitForCalculation = tradeGasLimitForCalculation
        .plus(approvalNeeded?.gas || '0x0', 16)
        .toString(16)
      const gasTotalInWeiHex = calcGasTotal(
        totalGasLimitForCalculation,
        customGasPrice || '0x1',
      )
      const totalEthCost = new BigNumber(gasTotalInWeiHex, 16).plus(
        trade.value,
        10,
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
        destinationToken.symbol === 'ETH'
          ? calcTokenAmount(destinationAmount, 18).minus(ethFee, 10)
          : new BigNumber(tokenConversionRate || 1, 10)
            .times(
              calcTokenAmount(
                destinationAmount,
                destinationToken.decimals || 18,
              ),
              10,
            )
            .minus(tokenConversionRate ? ethFee : 0, 10)

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
}
