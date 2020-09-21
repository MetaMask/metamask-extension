import assert from 'assert'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

import { createTestProviderTools, getTestAccounts } from '../../../stub/provider'

const MOCK_GET_BUFFERED_GAS_LIMIT = () => ({ gasLimit: 2000000, simulationFails: undefined })

const EMPTY_INIT_STATE = {
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

const fetchTradesInfoStub = sinon.stub()

const { default: SwapsController } = proxyquire(
  '../../../../app/scripts/controllers/swaps',
  {
    '../../../ui/app/pages/swaps/swaps.uti': { fetchTradesInfo: fetchTradesInfoStub },
  },
)

describe.only('SwapsController', function () {
  let providerResultStub, provider

  describe('constructor', function () {
    it('should setup correctly', function () {
      providerResultStub = {
      // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0x',
      }
      provider = createTestProviderTools({ scaffold: providerResultStub }).provider

      const swapsController = new SwapsController({ getBufferedGasLimit: MOCK_GET_BUFFERED_GAS_LIMIT, provider, getProviderConfig: undefined, tokenRatesStore: undefined })
      assert.deepStrictEqual(swapsController.store.getState(), EMPTY_INIT_STATE)
      assert.deepStrictEqual(swapsController.getBufferedGasLimit, MOCK_GET_BUFFERED_GAS_LIMIT)
      assert.strictEqual(swapsController.pollCount, 0)
      // assert.deepStrictEqual(swapsController.getProviderConfig, )
      // assert.deepStrictEqual(swapsController.ethersProvider, )

    })
  })

  describe('setters', function () {
    let swapsController
    beforeEach(function () {
      providerResultStub = {
      // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0x',
      }
      provider = createTestProviderTools({ scaffold: providerResultStub }).provider

      swapsController = new SwapsController({ getBufferedGasLimit: MOCK_GET_BUFFERED_GAS_LIMIT, provider, getProviderConfig: undefined, tokenRatesStore: undefined })

    })
    it('should set quotes', function () {
      const quotes = {}
      swapsController.setQuotes(quotes)
      assert.deepStrictEqual(swapsController.store.getState().swapsState.quotes, quotes)
    })
    it('should set selected quote agg id', function () {
      const selectedAggId = 'test'
      swapsController.setSelectedQuoteAggId(selectedAggId)
      assert.deepStrictEqual(swapsController.store.getState().swapsState.selectedAggId, selectedAggId)
    })
    it('should set swaps tokens', function () {
      const tokens = []
      swapsController.setSwapsTokens(tokens)
      assert.deepStrictEqual(swapsController.store.getState().swapsState.tokens, tokens)
    })
    it('should set swaps error key', function () {
      const errorKey = 'test'
      swapsController.setSwapsErrorKey(errorKey)
      assert.deepStrictEqual(swapsController.store.getState().swapsState.errorKey, errorKey)
    })
  })

  describe('fetchAndSetQuotes', function () {
    let swapsController
    beforeEach(function () {
      providerResultStub = {
      // 1 gwei
        eth_gasPrice: '0x0de0b6b3a7640000',
        // by default, all accounts are external accounts (not contracts)
        eth_getCode: '0x',
      }
      provider = createTestProviderTools({ scaffold: providerResultStub }).provider

      swapsController = new SwapsController({ getBufferedGasLimit: MOCK_GET_BUFFERED_GAS_LIMIT, provider, getProviderConfig: undefined, tokenRatesStore: undefined })
    })

    it('returns null if fetchParams is not provided', async function () {
      const quotes = await swapsController.fetchAndSetQuotes(undefined)
      assert.strictEqual(quotes, null)
    })

    it('calls fetchTradesInfo with the given fetchParams', async function () {
      const quotes = await swapsController.fetchAndSetQuotes(undefined)
    })
  })
})
