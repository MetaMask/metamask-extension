import assert from 'assert'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

const mockGasPriceApiResponse = {
  SafeGasPrice: 10,
  ProposeGasPrice: 20,
  FastGasPrice: 30,
}

const GasDuck = proxyquire('./gas.duck.js', {
  // We have fetch-with-cache tests, so we can reasonably
  // return a specific mock response
  '../../helpers/utils/fetch-with-cache': {
    default: () => Promise.resolve(mockGasPriceApiResponse),
  },
})

const {
  basicGasEstimatesLoadingStarted,
  basicGasEstimatesLoadingFinished,
  setBasicGasEstimateData,
  setCustomGasPrice,
  setCustomGasLimit,
  fetchBasicGasEstimates,
} = GasDuck
const GasReducer = GasDuck.default

describe('Gas Duck', function () {
  const mockState = {
    mockProp: 123,
  }
  const initState = {
    customData: {
      price: null,
      limit: null,
    },
    basicEstimates: {
      average: null,
      fast: null,
      safeLow: null,
    },
    basicEstimateIsLoading: true,
  }
  const BASIC_GAS_ESTIMATE_LOADING_FINISHED =
    'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_FINISHED'
  const BASIC_GAS_ESTIMATE_LOADING_STARTED =
    'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_STARTED'
  const SET_BASIC_GAS_ESTIMATE_DATA = 'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA'
  const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT'
  const SET_CUSTOM_GAS_PRICE = 'metamask/gas/SET_CUSTOM_GAS_PRICE'

  describe('GasReducer()', function () {
    it('should initialize state', function () {
      assert.deepStrictEqual(GasReducer(undefined, {}), initState)
    })

    it('should return state unchanged if it does not match a dispatched actions type', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
        mockState,
      )
    })

    it('should set basicEstimateIsLoading to true when receiving a BASIC_GAS_ESTIMATE_LOADING_STARTED action', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, { type: BASIC_GAS_ESTIMATE_LOADING_STARTED }),
        { basicEstimateIsLoading: true, ...mockState },
      )
    })

    it('should set basicEstimateIsLoading to false when receiving a BASIC_GAS_ESTIMATE_LOADING_FINISHED action', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED }),
        { basicEstimateIsLoading: false, ...mockState },
      )
    })

    it('should set basicEstimates when receiving a SET_BASIC_GAS_ESTIMATE_DATA action', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: { someProp: 'someData123' },
        }),
        { basicEstimates: { someProp: 'someData123' }, ...mockState },
      )
    })

    it('should set customData.price when receiving a SET_CUSTOM_GAS_PRICE action', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_PRICE,
          value: 4321,
        }),
        { customData: { price: 4321 }, ...mockState },
      )
    })

    it('should set customData.limit when receiving a SET_CUSTOM_GAS_LIMIT action', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_LIMIT,
          value: 9876,
        }),
        { customData: { limit: 9876 }, ...mockState },
      )
    })
  })

  describe('basicGasEstimatesLoadingStarted', function () {
    it('should create the correct action', function () {
      assert.deepStrictEqual(basicGasEstimatesLoadingStarted(), {
        type: BASIC_GAS_ESTIMATE_LOADING_STARTED,
      })
    })
  })

  describe('basicGasEstimatesLoadingFinished', function () {
    it('should create the correct action', function () {
      assert.deepStrictEqual(basicGasEstimatesLoadingFinished(), {
        type: BASIC_GAS_ESTIMATE_LOADING_FINISHED,
      })
    })
  })

  describe('fetchBasicGasEstimates', function () {
    it('should call fetch with the expected params', async function () {
      const mockDistpatch = sinon.spy()

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState },
      }))
      assert.deepStrictEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ])

      assert.deepStrictEqual(mockDistpatch.getCall(1).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 20,
            fast: 30,
            safeLow: 10,
          },
        },
      ])
      assert.deepStrictEqual(mockDistpatch.getCall(2).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ])
    })
  })

  describe('setBasicGasEstimateData', function () {
    it('should create the correct action', function () {
      assert.deepStrictEqual(setBasicGasEstimateData('mockBasicEstimatData'), {
        type: SET_BASIC_GAS_ESTIMATE_DATA,
        value: 'mockBasicEstimatData',
      })
    })
  })

  describe('setCustomGasPrice', function () {
    it('should create the correct action', function () {
      assert.deepStrictEqual(setCustomGasPrice('mockCustomGasPrice'), {
        type: SET_CUSTOM_GAS_PRICE,
        value: 'mockCustomGasPrice',
      })
    })
  })

  describe('setCustomGasLimit', function () {
    it('should create the correct action', function () {
      assert.deepStrictEqual(setCustomGasLimit('mockCustomGasLimit'), {
        type: SET_CUSTOM_GAS_LIMIT,
        value: 'mockCustomGasLimit',
      })
    })
  })
})
