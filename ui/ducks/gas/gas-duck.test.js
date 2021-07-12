import sinon from 'sinon';

import GasReducer, { setCustomGasPrice, setCustomGasLimit } from './gas.duck';

import {
  SET_CUSTOM_GAS_PRICE,
  SET_CUSTOM_GAS_LIMIT,
} from './gas-action-constants';

describe('Gas Duck', () => {
  let tempDateNow;
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
