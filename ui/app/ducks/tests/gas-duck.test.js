import assert from 'assert'
import sinon from 'sinon'

import GasReducer, {
  basicGasEstimatesLoadingStarted,
  basicGasEstimatesLoadingFinished,
  setBasicGasEstimateData,
  setCustomGasPrice,
  setCustomGasLimit,
  setCustomGasTotal,
  setCustomGasErrors,
  resetCustomGasState,
  fetchGasEstimates,
} from '../gas.duck.js'

describe('Gas Duck', () => {
  let tempFetch
  const fetchStub = sinon.stub().returns(new Promise(resolve => resolve({
    json: () => new Promise(resolve => resolve({
      average: 'mockAverage',
      avgWait: 'mockAvgWait',
      block_time: 'mockBlock_time',
      blockNum: 'mockBlockNum',
      fast: 'mockFast',
      fastest: 'mockFastest',
      fastestWait: 'mockFastestWait',
      fastWait: 'mockFastWait',
      safeLow: 'mockSafeLow',
      safeLowWait: 'mockSafeLowWait',
      speed: 'mockSpeed',
    })),
  })))

  beforeEach(() => {
    tempFetch = global.fetch
    global.fetch = fetchStub
  })

  afterEach(() => {
    global.fetch = tempFetch
  })

  const mockState = {
    gas: {
      mockProp: 123,
    },
  }
  const initState = {
    customData: {
      price: 0,
      limit: 21000,
    },
    basicEstimates: {
      average: null,
      fastestWait: null,
      fastWait: null,
      fast: null,
      safeLowWait: null,
      blockNum: null,
      avgWait: null,
      blockTime: null,
      speed: null,
      fastest: null,
      safeLow: null,
    },
    basicEstimateIsLoading: true,
    errors: {},
  }
  const BASIC_GAS_ESTIMATE_LOADING_FINISHED = 'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_FINISHED'
  const BASIC_GAS_ESTIMATE_LOADING_STARTED = 'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_STARTED'
  const RESET_CUSTOM_GAS_STATE = 'metamask/gas/RESET_CUSTOM_GAS_STATE'
  const SET_BASIC_GAS_ESTIMATE_DATA = 'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA'
  const SET_CUSTOM_GAS_ERRORS = 'metamask/gas/SET_CUSTOM_GAS_ERRORS'
  const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT'
  const SET_CUSTOM_GAS_PRICE = 'metamask/gas/SET_CUSTOM_GAS_PRICE'
  const SET_CUSTOM_GAS_TOTAL = 'metamask/gas/SET_CUSTOM_GAS_TOTAL'

  describe('GasReducer()', () => {
    it('should initialize state', () => {
      assert.deepEqual(
        GasReducer({}),
        initState
      )
    })

    it('should return state unchanged if it does not match a dispatched actions type', () => {
      assert.deepEqual(
        GasReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
        Object.assign({}, mockState.gas)
      )
    })

    it('should set basicEstimateIsLoading to true when receiving a BASIC_GAS_ESTIMATE_LOADING_STARTED action', () => {
      assert.deepEqual(
        GasReducer(mockState, {
          type: BASIC_GAS_ESTIMATE_LOADING_STARTED,
        }),
        Object.assign({basicEstimateIsLoading: true}, mockState.gas)
      )
    })

    it('should set basicEstimateIsLoading to false when receiving a BASIC_GAS_ESTIMATE_LOADING_FINISHED action', () => {
      assert.deepEqual(
        GasReducer(mockState, {
          type: BASIC_GAS_ESTIMATE_LOADING_FINISHED,
        }),
        Object.assign({basicEstimateIsLoading: false}, mockState.gas)
      )
    })

    it('should return a new object (and not just modify the existing state object)', () => {
      assert.deepEqual(GasReducer(mockState), mockState.gas)
      assert.notEqual(GasReducer(mockState), mockState.gas)
    })

    it('should set basicEstimates when receiving a SET_BASIC_GAS_ESTIMATE_DATA action', () => {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: { someProp: 'someData123' },
        }),
        Object.assign({basicEstimates: {someProp: 'someData123'} }, mockState.gas)
      )
    })

    it('should set customData.price when receiving a SET_CUSTOM_GAS_PRICE action', () => {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_PRICE,
          value: 4321,
        }),
        Object.assign({customData: {price: 4321} }, mockState.gas)
      )
    })

    it('should set customData.limit when receiving a SET_CUSTOM_GAS_LIMIT action', () => {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_LIMIT,
          value: 9876,
        }),
        Object.assign({customData: {limit: 9876} }, mockState.gas)
      )
    })

    it('should set customData.total when receiving a SET_CUSTOM_GAS_TOTAL action', () => {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_TOTAL,
          value: 10000,
        }),
        Object.assign({customData: {total: 10000} }, mockState.gas)
      )
    })

    it('should set errors when receiving a SET_CUSTOM_GAS_ERRORS action', () => {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_ERRORS,
          value: { someError: 'error_error' },
        }),
        Object.assign({errors: {someError: 'error_error'} }, mockState.gas)
      )
    })

    it('should return the initial state in response to a RESET_CUSTOM_GAS_STATE action', () => {
      assert.deepEqual(
        GasReducer(mockState, {
          type: RESET_CUSTOM_GAS_STATE,
        }),
        Object.assign({}, initState)
      )
    })
  })

  describe('basicGasEstimatesLoadingStarted', () => {
    it('should create the correct action', () => {
      assert.deepEqual(
        basicGasEstimatesLoadingStarted(),
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED }
      )
    })
  })

  describe('basicGasEstimatesLoadingFinished', () => {
    it('should create the correct action', () => {
      assert.deepEqual(
        basicGasEstimatesLoadingFinished(),
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED }
      )
    })
  })

  describe('fetchGasEstimates', () => {
    const mockDistpatch = sinon.spy()
    it('should call fetch with the expected params', async () => {
      await fetchGasEstimates()(mockDistpatch)
      assert.deepEqual(
        mockDistpatch.getCall(0).args,
        [{ type: BASIC_GAS_ESTIMATE_LOADING_STARTED} ]
      )
      assert.deepEqual(
        global.fetch.getCall(0).args,
        [
          'https://ethgasstation.info/json/ethgasAPI.json',
          {
            'headers': {},
            'referrer': 'http://ethgasstation.info/json/',
            'referrerPolicy': 'no-referrer-when-downgrade',
            'body': null,
            'method': 'GET',
            'mode': 'cors',
          },
        ]
      )
      assert.deepEqual(
        mockDistpatch.getCall(1).args,
        [{
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 'mockAverage',
            avgWait: 'mockAvgWait',
            blockTime: 'mockBlock_time',
            blockNum: 'mockBlockNum',
            fast: 'mockFast',
            fastest: 'mockFastest',
            fastestWait: 'mockFastestWait',
            fastWait: 'mockFastWait',
            safeLow: 'mockSafeLow',
            safeLowWait: 'mockSafeLowWait',
            speed: 'mockSpeed',
          },
        }]
      )
      assert.deepEqual(
        mockDistpatch.getCall(2).args,
        [{ type: BASIC_GAS_ESTIMATE_LOADING_FINISHED }]
      )
    })
  })


  describe('setBasicGasEstimateData', () => {
    it('should create the correct action', () => {
      assert.deepEqual(
        setBasicGasEstimateData('mockBasicEstimatData'),
        { type: SET_BASIC_GAS_ESTIMATE_DATA, value: 'mockBasicEstimatData' }
      )
    })
  })

  describe('setCustomGasPrice', () => {
    it('should create the correct action', () => {
      assert.deepEqual(
        setCustomGasPrice('mockCustomGasPrice'),
        { type: SET_CUSTOM_GAS_PRICE, value: 'mockCustomGasPrice' }
      )
    })
  })

  describe('setCustomGasLimit', () => {
    it('should create the correct action', () => {
      assert.deepEqual(
        setCustomGasLimit('mockCustomGasLimit'),
        { type: SET_CUSTOM_GAS_LIMIT, value: 'mockCustomGasLimit' }
      )
    })
  })

  describe('setCustomGasTotal', () => {
    it('should create the correct action', () => {
      assert.deepEqual(
        setCustomGasTotal('mockCustomGasTotal'),
        { type: SET_CUSTOM_GAS_TOTAL, value: 'mockCustomGasTotal' }
      )
    })
  })

  describe('setCustomGasErrors', () => {
    it('should create the correct action', () => {
      assert.deepEqual(
        setCustomGasErrors('mockErrorObject'),
        { type: SET_CUSTOM_GAS_ERRORS, value: 'mockErrorObject' }
      )
    })
  })

  describe('resetCustomGasState', () => {
    it('should create the correct action', () => {
      assert.deepEqual(
        resetCustomGasState(),
        { type: RESET_CUSTOM_GAS_STATE }
      )
    })
  })

})
