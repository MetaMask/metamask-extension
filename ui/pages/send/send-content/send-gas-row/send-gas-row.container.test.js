import sinon from 'sinon';

import { showModal } from '../../../../store/actions';

import {
  resetCustomData,
  setCustomGasPrice,
  setCustomGasLimit,
} from '../../../../ducks/gas/gas.duck';

import { updateGasPrice, updateGasLimit } from '../../../../ducks/send';

let mapDispatchToProps;
let mergeProps;

jest.mock('react-redux', () => ({
  connect: (_, md, mp) => {
    mapDispatchToProps = md;
    mergeProps = mp;
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

jest.mock('../../send.utils.js', () => ({
  isBalanceSufficient: ({ amount, gasTotal, balance, conversionRate }) =>
    `${amount}:${gasTotal}:${balance}:${conversionRate}`,

  calcGasTotal: (gasLimit, gasPrice) => gasLimit + gasPrice,
}));

jest.mock('../../../../store/actions', () => ({
  showModal: jest.fn(),
}));

jest.mock('../../../../ducks/gas/gas.duck', () => ({
  resetCustomData: jest.fn(),
  setCustomGasPrice: jest.fn(),
  setCustomGasLimit: jest.fn(),
}));

require('./send-gas-row.container.js');

describe('send-gas-row container', () => {
  describe('mapDispatchToProps()', () => {
    let dispatchSpy;
    let mapDispatchToPropsObject;

    beforeEach(() => {
      dispatchSpy = sinon.spy();
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy);
    });

    describe('showCustomizeGasModal()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.showCustomizeGasModal();
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(showModal).toHaveBeenCalledWith({
          name: 'CUSTOMIZE_GAS',
          hideBasic: true,
        });
      });
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

    describe('resetCustomData()', () => {
      it('should dispatch an action', () => {
        mapDispatchToPropsObject.resetCustomData();
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(resetCustomData).toHaveBeenCalled();
      });
    });
  });

  describe('mergeProps', () => {
    it('should return the expected props when isConfirm is true', () => {
      const stateProps = {
        gasPriceButtonGroupProps: {
          someGasPriceButtonGroupProp: 'foo',
          anotherGasPriceButtonGroupProp: 'bar',
        },
        someOtherStateProp: 'baz',
      };
      const dispatchProps = {
        updateGasPrice: sinon.spy(),
        someOtherDispatchProp: sinon.spy(),
      };
      const ownProps = { someOwnProp: 123 };
      const result = mergeProps(stateProps, dispatchProps, ownProps);

      expect(result.someOtherStateProp).toStrictEqual('baz');
      expect(
        result.gasPriceButtonGroupProps.someGasPriceButtonGroupProp,
      ).toStrictEqual('foo');
      expect(
        result.gasPriceButtonGroupProps.anotherGasPriceButtonGroupProp,
      ).toStrictEqual('bar');
      expect(result.someOwnProp).toStrictEqual(123);

      expect(dispatchProps.updateGasPrice.callCount).toStrictEqual(0);
      result.gasPriceButtonGroupProps.handleGasPriceSelection({
        gasPrice: undefined,
      });
      expect(dispatchProps.updateGasPrice.callCount).toStrictEqual(1);

      expect(dispatchProps.someOtherDispatchProp.callCount).toStrictEqual(0);
      result.someOtherDispatchProp();
      expect(dispatchProps.someOtherDispatchProp.callCount).toStrictEqual(1);
    });
  });
});
