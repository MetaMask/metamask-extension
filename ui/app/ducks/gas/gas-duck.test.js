import assert from 'assert'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

const fakeLocalStorage = {}

const GasDuck = proxyquire('./gas.duck.js', {
  '../../../lib/local-storage-helpers': fakeLocalStorage,
})

const {
  basicGasEstimatesLoadingStarted,
  basicGasEstimatesLoadingFinished,
  setBasicGasEstimateData,
  setCustomGasPrice,
  setCustomGasLimit,
  setCustomGasTotal,
  setCustomGasErrors,
  resetCustomGasState,
  fetchBasicGasAndTimeEstimates,
  fetchBasicGasEstimates,
  gasEstimatesLoadingStarted,
  gasEstimatesLoadingFinished,
  setPricesAndTimeEstimates,
  fetchGasEstimates,
  setApiEstimatesLastRetrieved,
} = GasDuck
const GasReducer = GasDuck.default

describe('Gas Duck', function () {
  let tempFetch
  let tempDateNow
  const mockEthGasApiResponse = {
    average: 20,
    avgWait: 'mockAvgWait',
    block_time: 'mockBlock_time',
    blockNum: 'mockBlockNum',
    fast: 30,
    fastest: 40,
    fastestWait: 'mockFastestWait',
    fastWait: 'mockFastWait',
    safeLow: 10,
    safeLowWait: 'mockSafeLowWait',
    speed: 'mockSpeed',
    standard: 20,
  }
  const mockPredictTableResponse = [
    {
      expectedTime: 400,
      expectedWait: 40,
      gasprice: 0.25,
      somethingElse: 'foobar',
    },
    {
      expectedTime: 200,
      expectedWait: 20,
      gasprice: 0.5,
      somethingElse: 'foobar',
    },
    {
      expectedTime: 100,
      expectedWait: 10,
      gasprice: 1,
      somethingElse: 'foobar',
    },
    {
      expectedTime: 75,
      expectedWait: 7.5,
      gasprice: 1.5,
      somethingElse: 'foobar',
    },
    { expectedTime: 50, expectedWait: 5, gasprice: 2, somethingElse: 'foobar' },
    {
      expectedTime: 35,
      expectedWait: 4.5,
      gasprice: 3,
      somethingElse: 'foobar',
    },
    {
      expectedTime: 34,
      expectedWait: 4.4,
      gasprice: 3.1,
      somethingElse: 'foobar',
    },
    {
      expectedTime: 25,
      expectedWait: 4.2,
      gasprice: 3.5,
      somethingElse: 'foobar',
    },
    { expectedTime: 20, expectedWait: 4, gasprice: 4, somethingElse: 'foobar' },
    {
      expectedTime: 19,
      expectedWait: 3.9,
      gasprice: 4.1,
      somethingElse: 'foobar',
    },
    { expectedTime: 15, expectedWait: 3, gasprice: 7, somethingElse: 'foobar' },
    {
      expectedTime: 14,
      expectedWait: 2.9,
      gasprice: 7.1,
      somethingElse: 'foobar',
    },
    {
      expectedTime: 12,
      expectedWait: 2.5,
      gasprice: 8,
      somethingElse: 'foobar',
    },
    {
      expectedTime: 10,
      expectedWait: 2,
      gasprice: 10,
      somethingElse: 'foobar',
    },
    {
      expectedTime: 9,
      expectedWait: 1.9,
      gasprice: 10.1,
      somethingElse: 'foobar',
    },
    { expectedTime: 5, expectedWait: 1, gasprice: 15, somethingElse: 'foobar' },
    {
      expectedTime: 4,
      expectedWait: 0.9,
      gasprice: 15.1,
      somethingElse: 'foobar',
    },
    {
      expectedTime: 2,
      expectedWait: 0.8,
      gasprice: 17,
      somethingElse: 'foobar',
    },
    {
      expectedTime: 1.1,
      expectedWait: 0.6,
      gasprice: 19.9,
      somethingElse: 'foobar',
    },
    {
      expectedTime: 1,
      expectedWait: 0.5,
      gasprice: 20,
      somethingElse: 'foobar',
    },
  ]
  const fakeFetch = (url) =>
    new Promise((resolve) => {
      const dataToResolve = url.match(/ethgasAPI/u)
        ? mockEthGasApiResponse
        : mockPredictTableResponse
      resolve({
        json: () => Promise.resolve(dataToResolve),
      })
    })

  beforeEach(function () {
    tempFetch = window.fetch
    tempDateNow = global.Date.now

    fakeLocalStorage.loadLocalStorageData = sinon.stub()
    fakeLocalStorage.saveLocalStorageData = sinon.spy()
    window.fetch = sinon.stub().callsFake(fakeFetch)
    global.Date.now = () => 2000000
  })

  afterEach(function () {
    sinon.restore()

    window.fetch = tempFetch
    global.Date.now = tempDateNow
  })

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
    gasEstimatesLoading: true,
    priceAndTimeEstimates: [],
    priceAndTimeEstimatesLastRetrieved: 0,
    basicPriceAndTimeEstimatesLastRetrieved: 0,
    basicPriceEstimatesLastRetrieved: 0,
  }
  const BASIC_GAS_ESTIMATE_LOADING_FINISHED =
    'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_FINISHED'
  const BASIC_GAS_ESTIMATE_LOADING_STARTED =
    'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_STARTED'
  const GAS_ESTIMATE_LOADING_FINISHED =
    'metamask/gas/GAS_ESTIMATE_LOADING_FINISHED'
  const GAS_ESTIMATE_LOADING_STARTED =
    'metamask/gas/GAS_ESTIMATE_LOADING_STARTED'
  const RESET_CUSTOM_GAS_STATE = 'metamask/gas/RESET_CUSTOM_GAS_STATE'
  const SET_BASIC_GAS_ESTIMATE_DATA = 'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA'
  const SET_CUSTOM_GAS_ERRORS = 'metamask/gas/SET_CUSTOM_GAS_ERRORS'
  const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT'
  const SET_CUSTOM_GAS_PRICE = 'metamask/gas/SET_CUSTOM_GAS_PRICE'
  const SET_CUSTOM_GAS_TOTAL = 'metamask/gas/SET_CUSTOM_GAS_TOTAL'
  const SET_PRICE_AND_TIME_ESTIMATES =
    'metamask/gas/SET_PRICE_AND_TIME_ESTIMATES'
  const SET_API_ESTIMATES_LAST_RETRIEVED =
    'metamask/gas/SET_API_ESTIMATES_LAST_RETRIEVED'
  const SET_BASIC_API_ESTIMATES_LAST_RETRIEVED =
    'metamask/gas/SET_BASIC_API_ESTIMATES_LAST_RETRIEVED'
  const SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED =
    'metamask/gas/SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED'

  describe('GasReducer()', function () {
    it('should initialize state', function () {
      assert.deepEqual(GasReducer(undefined, {}), initState)
    })

    it('should return state unchanged if it does not match a dispatched actions type', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
        mockState,
      )
    })

    it('should set basicEstimateIsLoading to true when receiving a BASIC_GAS_ESTIMATE_LOADING_STARTED action', function () {
      assert.deepEqual(
        GasReducer(mockState, { type: BASIC_GAS_ESTIMATE_LOADING_STARTED }),
        { basicEstimateIsLoading: true, ...mockState },
      )
    })

    it('should set basicEstimateIsLoading to false when receiving a BASIC_GAS_ESTIMATE_LOADING_FINISHED action', function () {
      assert.deepEqual(
        GasReducer(mockState, { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED }),
        { basicEstimateIsLoading: false, ...mockState },
      )
    })

    it('should set gasEstimatesLoading to true when receiving a GAS_ESTIMATE_LOADING_STARTED action', function () {
      assert.deepEqual(
        GasReducer(mockState, { type: GAS_ESTIMATE_LOADING_STARTED }),
        { gasEstimatesLoading: true, ...mockState },
      )
    })

    it('should set gasEstimatesLoading to false when receiving a GAS_ESTIMATE_LOADING_FINISHED action', function () {
      assert.deepEqual(
        GasReducer(mockState, { type: GAS_ESTIMATE_LOADING_FINISHED }),
        { gasEstimatesLoading: false, ...mockState },
      )
    })

    it('should set basicEstimates when receiving a SET_BASIC_GAS_ESTIMATE_DATA action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: { someProp: 'someData123' },
        }),
        { basicEstimates: { someProp: 'someData123' }, ...mockState },
      )
    })

    it('should set priceAndTimeEstimates when receiving a SET_PRICE_AND_TIME_ESTIMATES action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_PRICE_AND_TIME_ESTIMATES,
          value: { someProp: 'someData123' },
        }),
        { priceAndTimeEstimates: { someProp: 'someData123' }, ...mockState },
      )
    })

    it('should set customData.price when receiving a SET_CUSTOM_GAS_PRICE action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_PRICE,
          value: 4321,
        }),
        { customData: { price: 4321 }, ...mockState },
      )
    })

    it('should set customData.limit when receiving a SET_CUSTOM_GAS_LIMIT action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_LIMIT,
          value: 9876,
        }),
        { customData: { limit: 9876 }, ...mockState },
      )
    })

    it('should set customData.total when receiving a SET_CUSTOM_GAS_TOTAL action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_TOTAL,
          value: 10000,
        }),
        { customData: { total: 10000 }, ...mockState },
      )
    })

    it('should set priceAndTimeEstimatesLastRetrieved when receiving a SET_API_ESTIMATES_LAST_RETRIEVED action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_API_ESTIMATES_LAST_RETRIEVED,
          value: 1500000000000,
        }),
        { priceAndTimeEstimatesLastRetrieved: 1500000000000, ...mockState },
      )
    })

    it('should set priceAndTimeEstimatesLastRetrieved when receiving a SET_BASIC_API_ESTIMATES_LAST_RETRIEVED action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_BASIC_API_ESTIMATES_LAST_RETRIEVED,
          value: 1700000000000,
        }),
        {
          basicPriceAndTimeEstimatesLastRetrieved: 1700000000000,
          ...mockState,
        },
      )
    })

    it('should set errors when receiving a SET_CUSTOM_GAS_ERRORS action', function () {
      assert.deepEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_ERRORS,
          value: { someError: 'error_error' },
        }),
        { errors: { someError: 'error_error' }, ...mockState },
      )
    })

    it('should return the initial state in response to a RESET_CUSTOM_GAS_STATE action', function () {
      assert.deepEqual(
        GasReducer(mockState, { type: RESET_CUSTOM_GAS_STATE }),
        initState,
      )
    })
  })

  describe('basicGasEstimatesLoadingStarted', function () {
    it('should create the correct action', function () {
      assert.deepEqual(basicGasEstimatesLoadingStarted(), {
        type: BASIC_GAS_ESTIMATE_LOADING_STARTED,
      })
    })
  })

  describe('basicGasEstimatesLoadingFinished', function () {
    it('should create the correct action', function () {
      assert.deepEqual(basicGasEstimatesLoadingFinished(), {
        type: BASIC_GAS_ESTIMATE_LOADING_FINISHED,
      })
    })
  })

  describe('fetchBasicGasEstimates', function () {
    it('should call fetch with the expected params', async function () {
      const mockDistpatch = sinon.spy()

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState, basicPriceAEstimatesLastRetrieved: 1000000 },
      }))
      assert.deepEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ])
      assert.ok(
        window.fetch
          .getCall(0)
          .args[0].startsWith('https://ethgasstation.info/json/ethgasAPI.json'),
        'should fetch ETH Gas Station',
      )
      assert.deepEqual(mockDistpatch.getCall(1).args, [
        { type: SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED, value: 2000000 },
      ])
      assert.deepEqual(mockDistpatch.getCall(2).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 2,
            blockTime: 'mockBlock_time',
            blockNum: 'mockBlockNum',
            fast: 3,
            fastest: 4,
            safeLow: 1,
          },
        },
      ])
      assert.deepEqual(mockDistpatch.getCall(3).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ])
    })

    it('should fetch recently retrieved estimates from local storage', async function () {
      const mockDistpatch = sinon.spy()
      fakeLocalStorage.loadLocalStorageData
        .withArgs('BASIC_PRICE_ESTIMATES_LAST_RETRIEVED')
        .returns(2000000 - 1) // one second ago from "now"
      fakeLocalStorage.loadLocalStorageData
        .withArgs('BASIC_PRICE_ESTIMATES')
        .returns({
          average: 25,
          blockTime: 'mockBlock_time',
          blockNum: 'mockBlockNum',
          fast: 35,
          fastest: 45,
          safeLow: 15,
        })

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState },
      }))
      assert.deepEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ])
      assert.ok(window.fetch.notCalled)
      assert.deepEqual(mockDistpatch.getCall(1).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 25,
            blockTime: 'mockBlock_time',
            blockNum: 'mockBlockNum',
            fast: 35,
            fastest: 45,
            safeLow: 15,
          },
        },
      ])
      assert.deepEqual(mockDistpatch.getCall(2).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ])
    })

    it('should fallback to network if retrieving estimates from local storage fails', async function () {
      const mockDistpatch = sinon.spy()
      fakeLocalStorage.loadLocalStorageData
        .withArgs('BASIC_PRICE_ESTIMATES_LAST_RETRIEVED')
        .returns(2000000 - 1) // one second ago from "now"

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState },
      }))
      assert.deepEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ])
      assert.ok(
        window.fetch
          .getCall(0)
          .args[0].startsWith('https://ethgasstation.info/json/ethgasAPI.json'),
        'should fetch ETH Gas Station',
      )
      assert.deepEqual(mockDistpatch.getCall(1).args, [
        { type: SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED, value: 2000000 },
      ])
      assert.deepEqual(mockDistpatch.getCall(2).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 2,
            blockTime: 'mockBlock_time',
            blockNum: 'mockBlockNum',
            fast: 3,
            fastest: 4,
            safeLow: 1,
          },
        },
      ])
      assert.deepEqual(mockDistpatch.getCall(3).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ])
    })
  })

  describe('fetchBasicGasAndTimeEstimates', function () {
    it('should call fetch with the expected params', async function () {
      const mockDistpatch = sinon.spy()

      await fetchBasicGasAndTimeEstimates()(mockDistpatch, () => ({
        gas: {
          ...initState,
          basicPriceAndTimeEstimatesLastRetrieved: 1000000,
        },
        metamask: { provider: { type: 'ropsten' } },
      }))
      assert.deepEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ])
      assert.ok(
        window.fetch
          .getCall(0)
          .args[0].startsWith('https://ethgasstation.info/json/ethgasAPI.json'),
        'should fetch ETH Gas Station',
      )

      assert.deepEqual(mockDistpatch.getCall(1).args, [
        { type: SET_BASIC_API_ESTIMATES_LAST_RETRIEVED, value: 2000000 },
      ])

      assert.deepEqual(mockDistpatch.getCall(2).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 2,
            avgWait: 'mockAvgWait',
            blockTime: 'mockBlock_time',
            blockNum: 'mockBlockNum',
            fast: 3,
            fastest: 4,
            fastestWait: 'mockFastestWait',
            fastWait: 'mockFastWait',
            safeLow: 1,
            safeLowWait: 'mockSafeLowWait',
            speed: 'mockSpeed',
          },
        },
      ])
      assert.deepEqual(mockDistpatch.getCall(3).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ])
    })

    it('should fetch recently retrieved estimates from local storage', async function () {
      const mockDistpatch = sinon.spy()
      fakeLocalStorage.loadLocalStorageData
        .withArgs('BASIC_GAS_AND_TIME_API_ESTIMATES_LAST_RETRIEVED')
        .returns(2000000 - 1) // one second ago from "now"
      fakeLocalStorage.loadLocalStorageData
        .withArgs('BASIC_GAS_AND_TIME_API_ESTIMATES')
        .returns({
          average: 5,
          avgWait: 'mockAvgWait',
          blockTime: 'mockBlock_time',
          blockNum: 'mockBlockNum',
          fast: 6,
          fastest: 7,
          fastestWait: 'mockFastestWait',
          fastWait: 'mockFastWait',
          safeLow: 1,
          safeLowWait: 'mockSafeLowWait',
          speed: 'mockSpeed',
        })

      await fetchBasicGasAndTimeEstimates()(mockDistpatch, () => ({
        gas: {
          ...initState,
        },
        metamask: { provider: { type: 'ropsten' } },
      }))
      assert.deepEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ])
      assert.ok(window.fetch.notCalled)

      assert.deepEqual(mockDistpatch.getCall(1).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 5,
            avgWait: 'mockAvgWait',
            blockTime: 'mockBlock_time',
            blockNum: 'mockBlockNum',
            fast: 6,
            fastest: 7,
            fastestWait: 'mockFastestWait',
            fastWait: 'mockFastWait',
            safeLow: 1,
            safeLowWait: 'mockSafeLowWait',
            speed: 'mockSpeed',
          },
        },
      ])
      assert.deepEqual(mockDistpatch.getCall(2).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ])
    })

    it('should fallback to network if retrieving estimates from local storage fails', async function () {
      const mockDistpatch = sinon.spy()
      fakeLocalStorage.loadLocalStorageData
        .withArgs('BASIC_GAS_AND_TIME_API_ESTIMATES_LAST_RETRIEVED')
        .returns(2000000 - 1) // one second ago from "now"

      await fetchBasicGasAndTimeEstimates()(mockDistpatch, () => ({
        gas: {
          ...initState,
        },
        metamask: { provider: { type: 'ropsten' } },
      }))
      assert.deepEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ])
      assert.ok(
        window.fetch
          .getCall(0)
          .args[0].startsWith('https://ethgasstation.info/json/ethgasAPI.json'),
        'should fetch ETH Gas Station',
      )

      assert.deepEqual(mockDistpatch.getCall(1).args, [
        { type: SET_BASIC_API_ESTIMATES_LAST_RETRIEVED, value: 2000000 },
      ])

      assert.deepEqual(mockDistpatch.getCall(2).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 2,
            avgWait: 'mockAvgWait',
            blockTime: 'mockBlock_time',
            blockNum: 'mockBlockNum',
            fast: 3,
            fastest: 4,
            fastestWait: 'mockFastestWait',
            fastWait: 'mockFastWait',
            safeLow: 1,
            safeLowWait: 'mockSafeLowWait',
            speed: 'mockSpeed',
          },
        },
      ])
      assert.deepEqual(mockDistpatch.getCall(3).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ])
    })
  })

  describe('fetchGasEstimates', function () {
    it('should call fetch with the expected params', async function () {
      const mockDistpatch = sinon.spy()

      await fetchGasEstimates(5)(mockDistpatch, () => ({
        gas: {
          ...initState,
          priceAndTimeEstimatesLastRetrieved: 1000000,
        },
        metamask: { provider: { type: 'ropsten' } },
      }))
      assert.deepEqual(mockDistpatch.getCall(0).args, [
        { type: GAS_ESTIMATE_LOADING_STARTED },
      ])
      assert.ok(
        window.fetch
          .getCall(0)
          .args[0].startsWith(
            'https://ethgasstation.info/json/predictTable.json',
          ),
        'should fetch ETH Gas Station',
      )

      assert.deepEqual(mockDistpatch.getCall(1).args, [
        { type: SET_API_ESTIMATES_LAST_RETRIEVED, value: 2000000 },
      ])

      const {
        type: thirdDispatchCallType,
        value: priceAndTimeEstimateResult,
      } = mockDistpatch.getCall(2).args[0]
      assert.equal(thirdDispatchCallType, SET_PRICE_AND_TIME_ESTIMATES)
      assert(
        priceAndTimeEstimateResult.length <
          mockPredictTableResponse.length * 3 - 2,
      )
      assert(!priceAndTimeEstimateResult.find((d) => d.expectedTime > 100))
      assert(
        !priceAndTimeEstimateResult.find(
          (d, _, a) => a[a + 1] && d.expectedTime > a[a + 1].expectedTime,
        ),
      )
      assert(
        !priceAndTimeEstimateResult.find(
          (d, _, a) => a[a + 1] && d.gasprice > a[a + 1].gasprice,
        ),
      )

      assert.deepEqual(mockDistpatch.getCall(3).args, [
        { type: GAS_ESTIMATE_LOADING_FINISHED },
      ])
    })

    it('should not call fetch if the estimates were retrieved < 75000 ms ago', async function () {
      const mockDistpatch = sinon.spy()

      await fetchGasEstimates(5)(mockDistpatch, () => ({
        gas: {
          ...initState,
          priceAndTimeEstimatesLastRetrieved: Date.now(),
          priceAndTimeEstimates: [
            {
              expectedTime: '10',
              expectedWait: 2,
              gasprice: 50,
            },
          ],
        },
        metamask: { provider: { type: 'ropsten' } },
      }))
      assert.deepEqual(mockDistpatch.getCall(0).args, [
        { type: GAS_ESTIMATE_LOADING_STARTED },
      ])
      assert.equal(window.fetch.callCount, 0)

      assert.deepEqual(mockDistpatch.getCall(1).args, [
        {
          type: SET_PRICE_AND_TIME_ESTIMATES,
          value: [
            {
              expectedTime: '10',
              expectedWait: 2,
              gasprice: 50,
            },
          ],
        },
      ])
      assert.deepEqual(mockDistpatch.getCall(2).args, [
        { type: GAS_ESTIMATE_LOADING_FINISHED },
      ])
    })
  })

  describe('gasEstimatesLoadingStarted', function () {
    it('should create the correct action', function () {
      assert.deepEqual(gasEstimatesLoadingStarted(), {
        type: GAS_ESTIMATE_LOADING_STARTED,
      })
    })
  })

  describe('gasEstimatesLoadingFinished', function () {
    it('should create the correct action', function () {
      assert.deepEqual(gasEstimatesLoadingFinished(), {
        type: GAS_ESTIMATE_LOADING_FINISHED,
      })
    })
  })

  describe('setPricesAndTimeEstimates', function () {
    it('should create the correct action', function () {
      assert.deepEqual(
        setPricesAndTimeEstimates('mockPricesAndTimeEstimates'),
        {
          type: SET_PRICE_AND_TIME_ESTIMATES,
          value: 'mockPricesAndTimeEstimates',
        },
      )
    })
  })

  describe('setBasicGasEstimateData', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setBasicGasEstimateData('mockBasicEstimatData'), {
        type: SET_BASIC_GAS_ESTIMATE_DATA,
        value: 'mockBasicEstimatData',
      })
    })
  })

  describe('setCustomGasPrice', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomGasPrice('mockCustomGasPrice'), {
        type: SET_CUSTOM_GAS_PRICE,
        value: 'mockCustomGasPrice',
      })
    })
  })

  describe('setCustomGasLimit', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomGasLimit('mockCustomGasLimit'), {
        type: SET_CUSTOM_GAS_LIMIT,
        value: 'mockCustomGasLimit',
      })
    })
  })

  describe('setCustomGasTotal', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomGasTotal('mockCustomGasTotal'), {
        type: SET_CUSTOM_GAS_TOTAL,
        value: 'mockCustomGasTotal',
      })
    })
  })

  describe('setCustomGasErrors', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setCustomGasErrors('mockErrorObject'), {
        type: SET_CUSTOM_GAS_ERRORS,
        value: 'mockErrorObject',
      })
    })
  })

  describe('setApiEstimatesLastRetrieved', function () {
    it('should create the correct action', function () {
      assert.deepEqual(setApiEstimatesLastRetrieved(1234), {
        type: SET_API_ESTIMATES_LAST_RETRIEVED,
        value: 1234,
      })
    })
  })

  describe('resetCustomGasState', function () {
    it('should create the correct action', function () {
      assert.deepEqual(resetCustomGasState(), { type: RESET_CUSTOM_GAS_STATE })
    })
  })
})
