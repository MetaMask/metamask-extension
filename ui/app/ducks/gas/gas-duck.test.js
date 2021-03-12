import assert from 'assert';
import nock from 'nock';
import sinon from 'sinon';
import BN from 'bn.js';

import GasDuck, {
  basicGasEstimatesLoadingStarted,
  basicGasEstimatesLoadingFinished,
  setBasicGasEstimateData,
  setCustomGasPrice,
  setCustomGasLimit,
  fetchBasicGasEstimates,
} from './gas.duck';

const mockGasPriceApiResponse = {
  SafeGasPrice: 10,
  ProposeGasPrice: 20,
  FastGasPrice: 30,
};

const GasReducer = GasDuck;

describe('Gas Duck', function () {
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
  };

  const providerState = {
    chainId: '0x1',
    nickname: '',
    rpcPrefs: {},
    rpcUrl: '',
    ticker: 'ETH',
    type: 'mainnet',
  };

  const BASIC_GAS_ESTIMATE_LOADING_FINISHED =
    'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_FINISHED';
  const BASIC_GAS_ESTIMATE_LOADING_STARTED =
    'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_STARTED';
  const SET_BASIC_GAS_ESTIMATE_DATA =
    'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA';
  const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT';
  const SET_CUSTOM_GAS_PRICE = 'metamask/gas/SET_CUSTOM_GAS_PRICE';

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
        gas: { ...initState },
        metamask: { provider: { ...providerState } },
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

      assert.deepStrictEqual(mockDistpatch.getCall(2).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ]);
    });

    it('should call fetch with the expected params for test network', async function () {
      global.eth = { gasPrice: sinon.fake.returns(new BN(48199313, 10)) };

      const mockDistpatch = sinon.spy();
      const providerStateForTestNetwork = {
        chainId: '0x5',
        nickname: '',
        rpcPrefs: {},
        rpcUrl: '',
        ticker: 'ETH',
        type: 'goerli',
      };

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState },
        metamask: { provider: { ...providerStateForTestNetwork } },
      }));
      assert.deepStrictEqual(mockDistpatch.getCall(0).args, [
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ]);
      assert.deepStrictEqual(mockDistpatch.getCall(1).args, [
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 0.0482,
          },
        },
      ]);
      assert.deepStrictEqual(mockDistpatch.getCall(2).args, [
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
});
