import Web3 from 'web3'
import log from 'loglevel'
import BigNumber from 'bignumber.js'
import ObservableStore from 'obs-store'
import { mapValues } from 'lodash'
import abi from 'human-standard-token-abi'
import { calcTokenAmount } from '../../../ui/app/helpers/utils/token-util'
import { calcGasTotal } from '../../../ui/app/pages/send/send.utils'
import { conversionUtil } from '../../../ui/app/helpers/utils/conversion-util'

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

const INTERVAL = 50 * 1000

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

  constructor ({ getBufferedGasLimit, provider, getProviderConfig, tokenRatesStore }) {
    const initState = Object.assign(initialState)
    this.store = new ObservableStore(initState)

    this.getBufferedGasLimit = getBufferedGasLimit
    this.tokenRatesStore = tokenRatesStore

    this.pollCount = 0
    this.getProviderConfig = getProviderConfig

    this.web3 = new Web3(provider)
  }

  _isMetaSwapTestNet () {
    const providerConfig = this.getProviderConfig()
    const isMetaSwapTestNet = providerConfig.chainId === '1' && providerConfig.rpcTarget.length > 0
    return isMetaSwapTestNet
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
    this.setQuotesStatus('')
    let newQuotes = await fetchTradesInfo(fetchParams)
    const quotesLastFetched = Date.now()

    let approvalNeeded = false
    if (fetchParams.sourceToken !== '0x0000000000000000000000000000000000000000') {
      const allowance = await getERC20Allowance(fetchParams.sourceToken, fetchParams.fromAddress, this.web3.eth)
      approvalNeeded = !allowance.gt(0)
      if (!approvalNeeded) {
        newQuotes = mapValues(newQuotes, (quote) => ({ ...quote, approvalNeeded: null }))
      } else if (newFetchParams) {
        const { gasLimit: approvalGas } = await this.timedoutGasReturn({ ...newQuotes[0].approvalNeeded, gas: '0x1d4c0' })
        newQuotes = mapValues(newQuotes, (quote) => ({
          ...quote,
          approvalNeeded: { ...quote.approvalNeeded, gas: approvalGas || '0x1d4c0' },
        }))
      }
    }

    const { topAggId, isBest } = this._findTopQuoteAggId(newQuotes)
    let selectedAggId = swapsState.selectedAggId || topAggId
    if (isBest) {
      newQuotes[topAggId].isBestQuote = true
    }

    // We can reduce time on the loading screen by only doing this after the loading screen and best quote have rendered
    if (!approvalNeeded && !newFetchParams?.balanceError) {
      newQuotes = await this.getAllQuotesWithGasEstimates(newQuotes)

      if (Object.values(newQuotes).length === 0) {
        this.setQuotesStatus('notAvailable')
      } else {
        const { topAggId: topAggIdAfterGasEstimates, isBest: isBestAfterGasEstimates } = this._findTopQuoteAggId(newQuotes)
        if (isBestAfterGasEstimates) {
          newQuotes[topAggId].isBestQuote = true
        }
        if (!selectedAggId || !newQuotes[selectedAggId]) {
          selectedAggId = topAggIdAfterGasEstimates
        }
      }
    }

    this.store.updateState({ swapsState: { ...swapsState, quotes: newQuotes, fetchParams, quotesLastFetched, selectedAggId } })

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
      return newQuotes
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
    }, INTERVAL)
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
    const quoteGasData = await Promise.all(Object.values(quotes).map(async (quote) => {
      const { gasLimit, simulationFails } = await this.timedoutGasReturn({ ...quote.trade, gas: `0x${quote.maxGas.toString(16)}` })
      return [gasLimit, simulationFails, quote.aggregator]
    }))

    const newQuotes = {}
    quoteGasData.forEach(([gasLimit, simulationFails, aggId]) => {
      if (gasLimit && !simulationFails) {
        newQuotes[aggId] = {
          ...quotes[aggId],
          gasEstimate: gasLimit,
        }
      } else if (quotes[aggId].approvalNeeded) {
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

    const { gasLimit: newGasEstimate, simulationFails } = await this.timedoutGasReturn({ ...updatedQuotes[initialAggId].trade, gas: baseGasEstimate })

    if (newGasEstimate && !simulationFails) {
      updatedQuotes[initialAggId].gasEstimate = newGasEstimate
    }

    this.store.updateState({ swapsState: { ...swapsState, quotes: updatedQuotes } })
  }

  setShowAwaitingSwapScreen (showAwaitingSwapScreen) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, showAwaitingSwapScreen } })
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
    this.store.updateState({ swapsState: { ...swapsState, customGasPrice: gasPrice } })
  }

  setSwapsTxGasLimit (gasLimit) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, customMaxGas: gasLimit } })
  }

  setCustomApproveTxData (data) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, customApproveTxData: data } })
  }

  setBackgoundSwapRouteState (routeState) {
    const { swapsState } = this.store.getState()
    this.store.updateState({ swapsState: { ...swapsState, routeState } })
  }

  resetPostFetchState () {
    const { swapsState } = this.store.getState()

    this.store.updateState({ swapsState: { ...initialState.swapsState, tokens: swapsState.tokens, fetchParams: swapsState.fetchParams } })
    clearTimeout(this.timeout)
  }

  resetSwapsState () {
    const { swapsState } = this.store.getState()

    this.store.updateState({ swapsState: { ...initialState.swapsState, tokens: swapsState.tokens } })
    clearTimeout(this.timeout)
  }

  _findTopQuoteAggId (quotes) {
    const tokenConversionRates = this.tokenRatesStore.getState().contractExchangeRates
    const { swapsState: { customGasPrice = '0x1' } } = this.store.getState()

    if (!quotes?.length) {
      return {}
    }

    let topAggId = ''
    let ethValueOfTradeForBestQuote = 0

    Object.values(quotes).forEach((quote) => {
      const { destinationAmount = 0, destinationToken, trade, approvalNeeded, averageGas, gasEstimate, aggregator } = quote

      const tradeGasLimitForCalculation = gasEstimate ? (new BigNumber(gasEstimate, 16)) : (new BigNumber(averageGas, 10))
      const totalGasLimitForCalculation = tradeGasLimitForCalculation.plus(approvalNeeded?.gas || '0x0', 16).toString(16)
      const gasTotalInWeiHex = calcGasTotal(totalGasLimitForCalculation, customGasPrice)
      const totalEthCost = (new BigNumber(gasTotalInWeiHex, 16)).plus(trade.value, 10)
      const ethFee = conversionUtil(totalEthCost, {
        fromCurrency: 'ETH',
        fromDenomination: 'WEI',
        toDenomination: 'ETH',
        fromNumericBase: 'BN',
        numberOfDecimals: 6,
      })

      const tokenConversionRate = tokenConversionRates[destinationToken]

      const ethValueOfTrade = destinationToken.symbol === 'ETH'
        ? calcTokenAmount(destinationAmount, 18).minus(ethFee, 10)
        : (new BigNumber(tokenConversionRate || 1, 10))
          .times(calcTokenAmount(destinationAmount, destinationToken.decimals || 18), 10)
          .minus(tokenConversionRate ? ethFee : 0, 10)

      if (ethValueOfTrade.gt(ethValueOfTradeForBestQuote)) {
        topAggId = aggregator
        ethValueOfTradeForBestQuote = ethValueOfTrade
      }
    })

    const isBest = (quotes[0]?.destinationToken?.symbol === 'ETH') || Boolean(tokenConversionRates[quotes[0]?.destinationToken])

    return { topAggId, isBest }
  }

}
