import nock from 'nock';
import sinon from 'sinon';
import BN from 'bn.js';

import GasReducer, {
  basicGasEstimatesLoadingStarted,
  basicGasEstimatesLoadingFinished,
  setBasicGasEstimateData,
  setCustomGasPrice,
  setCustomGasLimit,
  fetchBasicGasEstimates,
} from './gas.duck';

jest.mock('../../../lib/storage-helpers.js', () => ({
  getStorageItem: jest.fn(),
  setStorageItem: jest.fn(),
}));

describe('Gas Duck', () => {
  let tempDateNow;
  const mockGasPriceApiResponse = {
    SafeGasPrice: 10,
    ProposeGasPrice: 20,
    FastGasPrice: 30,
  };

  beforeEach(() => {
    tempDateNow = global.Date.now;

    global.Date.now = () => 2000000;
  });

  afterEach(() => {
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

  describe('GasReducer()', () => {
    it('should initialize state', () => {
      expect(GasReducer(undefined, {})).toStrictEqual(initState);
    });

    it('should return state unchanged if it does not match a dispatched actions type', () => {
      expect(
        GasReducer(mockState, {
          type: 'someOtherAction',
          value: 'someValue',
        }),
      ).toStrictEqual(mockState);
    });

    it('should set basicEstimateIsLoading to true when receiving a BASIC_GAS_ESTIMATE_LOADING_STARTED action', () => {
      expect(
        GasReducer(mockState, { type: BASIC_GAS_ESTIMATE_LOADING_STARTED }),
      ).toStrictEqual({ basicEstimateIsLoading: true, ...mockState });
    });

    it('should set basicEstimateIsLoading to false when receiving a BASIC_GAS_ESTIMATE_LOADING_FINISHED action', () => {
      expect(
        GasReducer(mockState, { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED }),
      ).toStrictEqual({ basicEstimateIsLoading: false, ...mockState });
    });

    it('should set basicEstimates when receiving a SET_BASIC_GAS_ESTIMATE_DATA action', () => {
      expect(
        GasReducer(mockState, {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: { someProp: 'someData123' },
        }),
      ).toStrictEqual({
        basicEstimates: { someProp: 'someData123' },
        ...mockState,
      });
    });

    it('should set customData.price when receiving a SET_CUSTOM_GAS_PRICE action', () => {
      expect(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_PRICE,
          value: 4321,
        }),
      ).toStrictEqual({ customData: { price: 4321 }, ...mockState });
    });

    it('should set customData.limit when receiving a SET_CUSTOM_GAS_LIMIT action', () => {
      expect(
        GasReducer(mockState, {
          type: SET_CUSTOM_GAS_LIMIT,
          value: 9876,
        }),
      ).toStrictEqual({ customData: { limit: 9876 }, ...mockState });
    });
  });

  describe('basicGasEstimatesLoadingStarted', () => {
    it('should create the correct action', () => {
      expect(basicGasEstimatesLoadingStarted()).toStrictEqual({
        type: BASIC_GAS_ESTIMATE_LOADING_STARTED,
      });
    });
  });

  describe('basicGasEstimatesLoadingFinished', () => {
    it('should create the correct action', () => {
      expect(basicGasEstimatesLoadingFinished()).toStrictEqual({
        type: BASIC_GAS_ESTIMATE_LOADING_FINISHED,
      });
    });
  });

  describe('fetchBasicGasEstimates', () => {
    it('should call fetch with the expected params', async () => {
      const mockDistpatch = sinon.spy();
      const windowFetchSpy = sinon.spy(window, 'fetch');

      nock('https://api.metaswap.codefi.network')
        .get('/gasPrices')
        .reply(200, mockGasPriceApiResponse);

      await fetchBasicGasEstimates()(mockDistpatch, () => ({
        gas: { ...initState },
        metamask: { provider: { ...providerState } },
      }));

      expect(mockDistpatch.getCall(0).args).toStrictEqual([
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ]);

      expect(
        windowFetchSpy
          .getCall(0)
          .args[0].startsWith('https://api.metaswap.codefi.network/gasPrices'),
      ).toStrictEqual(true);

      expect(mockDistpatch.getCall(2).args).toStrictEqual([
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ]);
    });

    it('should call fetch with the expected params for test network', async () => {
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
        gas: { ...initState, basicPriceAEstimatesLastRetrieved: 1000000 },
        metamask: { provider: { ...providerStateForTestNetwork } },
      }));
      expect(mockDistpatch.getCall(0).args).toStrictEqual([
        { type: BASIC_GAS_ESTIMATE_LOADING_STARTED },
      ]);
      expect(mockDistpatch.getCall(1).args).toStrictEqual([
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 0.0482,
          },
        },
      ]);
      expect(mockDistpatch.getCall(2).args).toStrictEqual([
        { type: BASIC_GAS_ESTIMATE_LOADING_FINISHED },
      ]);
    });
  });

  describe('setBasicGasEstimateData', () => {
    it('should create the correct action', () => {
      expect(setBasicGasEstimateData('mockBasicEstimatData')).toStrictEqual({
        type: SET_BASIC_GAS_ESTIMATE_DATA,
        value: 'mockBasicEstimatData',
      });
    });
  });

  describe('setCustomGasPrice', () => {
    it('should create the correct action', () => {
      expect(setCustomGasPrice('mockCustomGasPrice')).toStrictEqual({
        type: SET_CUSTOM_GAS_PRICE,
        value: 'mockCustomGasPrice',
      });
    });
  });

  describe('setCustomGasLimit', () => {
    it('should create the correct action', () => {
      expect(setCustomGasLimit('mockCustomGasLimit')).toStrictEqual({
        type: SET_CUSTOM_GAS_LIMIT,
        value: 'mockCustomGasLimit',
      });
    });
  });
});
