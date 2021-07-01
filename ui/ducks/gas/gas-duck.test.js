import nock from 'nock';
import sinon from 'sinon';
import BN from 'bn.js';

import GasReducer, {
  setBasicEstimateStatus,
  setBasicGasEstimateData,
  setCustomGasPrice,
  setCustomGasLimit,
  fetchBasicGasEstimates,
} from './gas.duck';

import {
  BASIC_GAS_ESTIMATE_STATUS,
  SET_BASIC_GAS_ESTIMATE_DATA,
  SET_CUSTOM_GAS_PRICE,
  SET_CUSTOM_GAS_LIMIT,
  SET_ESTIMATE_SOURCE,
} from './gas-action-constants';

jest.mock('../../helpers/utils/storage-helpers.js', () => ({
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
    basicEstimateStatus: 'LOADING',
    estimateSource: '',
  };

  const providerState = {
    chainId: '0x1',
    nickname: '',
    rpcPrefs: {},
    rpcUrl: '',
    ticker: 'ETH',
    type: 'mainnet',
  };

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

    it('should set basicEstimateStatus to LOADING when receiving a BASIC_GAS_ESTIMATE_STATUS action with value LOADING', () => {
      expect(
        GasReducer(mockState, {
          type: BASIC_GAS_ESTIMATE_STATUS,
          value: 'LOADING',
        }),
      ).toStrictEqual({ basicEstimateStatus: 'LOADING', ...mockState });
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

  it('should set estimateSource to Metaswaps when receiving a SET_ESTIMATE_SOURCE action with value Metaswaps', () => {
    expect(
      GasReducer(mockState, { type: SET_ESTIMATE_SOURCE, value: 'Metaswaps' }),
    ).toStrictEqual({ estimateSource: 'Metaswaps', ...mockState });
  });

  describe('basicEstimateStatus', () => {
    it('should create the correct action', () => {
      expect(setBasicEstimateStatus('LOADING')).toStrictEqual({
        type: BASIC_GAS_ESTIMATE_STATUS,
        value: 'LOADING',
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
        { type: 'metamask/gas/BASIC_GAS_ESTIMATE_STATUS', value: 'LOADING' },
      ]);

      expect(
        windowFetchSpy
          .getCall(0)
          .args[0].startsWith('https://api.metaswap.codefi.network/gasPrices'),
      ).toStrictEqual(true);

      expect(mockDistpatch.getCall(2).args).toStrictEqual([
        { type: 'metamask/gas/SET_ESTIMATE_SOURCE', value: 'MetaSwaps' },
      ]);

      expect(mockDistpatch.getCall(4).args).toStrictEqual([
        { type: 'metamask/gas/BASIC_GAS_ESTIMATE_STATUS', value: 'READY' },
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
        { type: 'metamask/gas/BASIC_GAS_ESTIMATE_STATUS', value: 'LOADING' },
      ]);
      expect(mockDistpatch.getCall(1).args).toStrictEqual([
        { type: 'metamask/gas/SET_ESTIMATE_SOURCE', value: 'eth_gasprice' },
      ]);
      expect(mockDistpatch.getCall(2).args).toStrictEqual([
        {
          type: SET_BASIC_GAS_ESTIMATE_DATA,
          value: {
            average: 0.0482,
          },
        },
      ]);
      expect(mockDistpatch.getCall(3).args).toStrictEqual([
        { type: 'metamask/gas/BASIC_GAS_ESTIMATE_STATUS', value: 'READY' },
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
