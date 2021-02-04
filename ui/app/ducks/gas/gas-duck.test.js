import assert from 'assert';
import nock from 'nock';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

const fakeStorage = {};

const GasDuck = proxyquire('./gas.duck.js', {
  '../../../lib/storage-helpers': fakeStorage,
});

const {
  basicGasEstimatesLoadingStarted,
  basicGasEstimatesLoadingFinished,
  setBasicGasEstimateData,
  setCustomGasPrice,
  setCustomGasLimit,
  resetCustomGasState,
  fetchBasicGasEstimates,
} = GasDuck;
const GasReducer = GasDuck.default;

describe('Gas Duck', function () {
  let tempDateNow;
  const mockGasPriceApiResponse = {
    SafeGasPrice: 10,
    ProposeGasPrice: 20,
    FastGasPrice: 30,
  };

  beforeEach(function () {
    tempDateNow = global.Date.now;

    fakeStorage.getStorageItem = sinon.stub();
    fakeStorage.setStorageItem = sinon.spy();
    global.Date.now = () => 2000000;
  });

  afterEach(function () {
    sinon.restore();

    global.Date.now = tempDateNow;
  });

  const mockState = {
    mockProp: 123,
  };
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
    basicPriceEstimatesLastRetrieved: 0,
  };
  const BASIC_GAS_ESTIMATE_LOADING_FINISHED =
    'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_FINISHED';
  const BASIC_GAS_ESTIMATE_LOADING_STARTED =
    'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_STARTED';
  const RESET_CUSTOM_GAS_STATE = 'metamask/gas/RESET_CUSTOM_GAS_STATE';
  const SET_BASIC_GAS_ESTIMATE_DATA =
    'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA';
  const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT';
  const SET_CUSTOM_GAS_PRICE = 'metamask/gas/SET_CUSTOM_GAS_PRICE';
  const SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED =
    'metamask/gas/SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED';

  describe('GasReducer()', function () {
    it('should initialize state', function () {
      assert.deepStrictEqual(GasReducer(undefined, {}), initState);
    });

    it('should return state unchanged if it does not match a dispatched actions type', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
        mockState,
      );
    });

    it('should set basicEstimateIsLoading to true when receiving a BASIC_GAS_ESTIMATE_LOADING_STARTED action', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, { type: BASIC_GAS_ESTIMATE_LOADING_STARTED }),
        { basicEstimateIsLoading: true, ...mockState },
      );
    });

    it('should set basicEstimateIsLoading to false when receiving a BASIC_GAS_ESTIMATE_LOADING_FINISHED action', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED }),
        { basicEstimateIsLoading: false, ...mockState },
      );
    });

    it('should set basicEstimates when receiving a SET_BASIC_GAS_ESTIMATE_DATA action', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: { someProp: 'someData123' },
        }),
        { basicEstimates: { someProp: 'someData123' }, ...mockState },
      );
    });

    it('should set customData.price when receiving a SET_CUSTOM_GAS_PRICE action', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_PRICE,
          value: 4321,
        }),
        { customData: { price: 4321 }, ...mockState },
      );
    });

    it('should set customData.limit when receiving a SET_CUSTOM_GAS_LIMIT action', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_LIMIT,
          value: 9876,
        }),
        { customData: { limit: 9876 }, ...mockState },
      );
    });

    it('should return the initial state in response to a RESET_CUSTOM_GAS_STATE action', function () {
      assert.deepStrictEqual(
        GasReducer(mockState, { type: RESET_CUSTOM_GAS_STATE }),
        initState,
      );
    });
  });

  describe('basicGasEstimatesLoadingStarted', function () {
    it('should create the correct action', function () {
      assert.deepStrictEqual(basicGasEstimatesLoadingStarted(), {
        type: BASIC_GAS_ESTIMATE_LOADING_STARTED,
      });
    });
  });

  describe('basicGasEstimatesLoadingFinished', function () {
    it('should create the correct action', function () {
      assert.deepStrictEqual(basicGasEstimatesLoadingFinished(), {
        type: BASIC_GAS_ESTIMATE_LOADING_FINISHED,
      });
    });
  });

  describe('fetchBasicGasEstimates', function () {
    it('should call fetch with the expected params', async function () {
      const mockDistpatch = sinon.spy();

      const windowFetchSpy = sinon.spy(window, 'fetch');

      nock('https://api.metaswap.codefi.network')
        .get('/gasPrices')
        .reply(200, mockGasPriceApiResponse);

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState, basicPriceAEstimatesLastRetrieved: 1000000 },
      }));
      assert.deepStrictEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ]);
      assert.ok(
        windowFetchSpy
          .getCall(0)
          .args[0].startsWith('https://api.metaswap.codefi.network/gasPrices'),
        'should fetch metaswap /gasPrices',
      );
      assert.deepStrictEqual(mockDistpatch.getCall(1).args, [
        { type: SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED, value: 2000000 },
      ]);
      assert.deepStrictEqual(mockDistpatch.getCall(2).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 20,
            fast: 30,
            safeLow: 10,
          },
        },
      ]);
      assert.deepStrictEqual(mockDistpatch.getCall(3).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ]);
    });

    it('should fetch recently retrieved estimates from storage', async function () {
      const mockDistpatch = sinon.spy();

      const windowFetchSpy = sinon.spy(window, 'fetch');

      fakeStorage.getStorageItem
        .withArgs('BASIC_PRICE_ESTIMATES_LAST_RETRIEVED')
        .returns(2000000 - 1); // one second ago from "now"
      fakeStorage.getStorageItem.withArgs('BASIC_PRICE_ESTIMATES').returns({
        average: 25,
        fast: 35,
        safeLow: 15,
      });

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState },
      }));
      assert.deepStrictEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ]);
      assert.ok(windowFetchSpy.notCalled);
      assert.deepStrictEqual(mockDistpatch.getCall(1).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 25,
            fast: 35,
            safeLow: 15,
          },
        },
      ]);
      assert.deepStrictEqual(mockDistpatch.getCall(2).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ]);
    });

    it('should fallback to network if retrieving estimates from storage fails', async function () {
      const mockDistpatch = sinon.spy();

      const windowFetchSpy = sinon.spy(window, 'fetch');

      nock('https://api.metaswap.codefi.network')
        .get('/gasPrices')
        .reply(200, mockGasPriceApiResponse);

      fakeStorage.getStorageItem
        .withArgs('BASIC_PRICE_ESTIMATES_LAST_RETRIEVED')
        .returns(2000000 - 1); // one second ago from "now"

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState },
      }));
      assert.deepStrictEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ]);
      assert.ok(
        windowFetchSpy
          .getCall(0)
          .args[0].startsWith('https://api.metaswap.codefi.network/gasPrices'),
        'should fetch metaswap /gasPrices',
      );

      assert.deepStrictEqual(mockDistpatch.getCall(1).args, [
        { type: SET_BASIC_PRICE_ESTIMATES_LAST_RETRIEVED, value: 2000000 },
      ]);
      assert.deepStrictEqual(mockDistpatch.getCall(2).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            safeLow: 10,
            average: 20,
            fast: 30,
          },
        },
      ]);
      assert.deepStrictEqual(mockDistpatch.getCall(3).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ]);
    });
  });

  describe('setBasicGasEstimateData', function () {
    it('should create the correct action', function () {
      assert.deepStrictEqual(setBasicGasEstimateData('mockBasicEstimatData'), {
        type: SET_BASIC_GAS_ESTIMATE_DATA,
        value: 'mockBasicEstimatData',
      });
    });
  });

  describe('setCustomGasPrice', function () {
    it('should create the correct action', function () {
      assert.deepStrictEqual(setCustomGasPrice('mockCustomGasPrice'), {
        type: SET_CUSTOM_GAS_PRICE,
        value: 'mockCustomGasPrice',
      });
    });
  });

  describe('setCustomGasLimit', function () {
    it('should create the correct action', function () {
      assert.deepStrictEqual(setCustomGasLimit('mockCustomGasLimit'), {
        type: SET_CUSTOM_GAS_LIMIT,
        value: 'mockCustomGasLimit',
      });
    });
  });

  describe('resetCustomGasState', function () {
    it('should create the correct action', function () {
      assert.deepStrictEqual(resetCustomGasState(), {
        type: RESET_CUSTOM_GAS_STATE,
      });
    });
  });
});
