import sinon from 'sinon';

import {
  setCustomGasPrice,
  setCustomGasLimit,
} from '../../../../ducks/gas/gas.duck';

import { updateGasPrice, updateGasLimit } from '../../../../ducks/send';

let mapDispatchToProps;

jest.mock('react-redux', () => ({
  connect: (_, md) => {
    mapDispatchToProps = md;
    return () => ({});
  },
}));

jest.mock('../../../../ducks/send', () => {
  const original = jest.requireActual('../../../../ducks/send');
  return {
    ...original,
    getSendMaxModeState: (s) => `mockMaxModeOn:${s}`,
    updateGasPrice: jest.fn(),
    updateGasLimit: jest.fn(),
  };
});

jest.mock('../../../../ducks/gas/gas.duck', () => ({
  setCustomGasPrice: jest.fn(),
  setCustomGasLimit: jest.fn(),
}));

jest.mock('../../send.utils.js', () => ({
  isBalanceSufficient: ({ amount, gasTotal, balance, conversionRate }) =>
    `${amount}:${gasTotal}:${balance}:${conversionRate}`,

  calcGasTotal: (gasLimit, gasPrice) => gasLimit + gasPrice,
}));

require('./send-gas-row.container');

describe('send-gas-row container', () => {
  describe('mapDispatchToProps()', () => {
    let dispatchSpy;
    let mapDispatchToPropsObject;

    beforeEach(() => {
      dispatchSpy = sinon.spy();
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy);
    });

    describe('updateGasPrice()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.updateGasPrice('mockNewPrice');
        expect(dispatchSpy.calledTwice).toStrictEqual(true);
        expect(updateGasPrice).toHaveBeenCalled();
        expect(setCustomGasPrice).toHaveBeenCalledWith('mockNewPrice');
      });
    });

    describe('updateGasLimit()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.updateGasLimit('mockNewLimit');
        expect(dispatchSpy.calledTwice).toStrictEqual(true);
        expect(updateGasLimit).toHaveBeenCalled();
        expect(setCustomGasLimit).toHaveBeenCalledWith('mockNewLimit');
      });
    });
  });
});
