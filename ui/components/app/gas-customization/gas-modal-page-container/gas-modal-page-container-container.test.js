import sinon from 'sinon';

import { hideModal } from '../../../../store/actions';

import {
  setCustomGasPrice,
  setCustomGasLimit,
  resetCustomData,
} from '../../../../ducks/gas/gas.duck';

import {
  useCustomGas,
  updateGasLimit,
  updateGasPrice,
} from '../../../../ducks/send';

let mapDispatchToProps;
let mergeProps;

jest.mock('react-redux', () => ({
  connect: (_, md, mp) => {
    mapDispatchToProps = md;
    mergeProps = mp;
    return () => ({});
  },
}));

jest.mock('../../../../selectors', () => ({
  getBasicGasEstimateLoadingStatus: (s) =>
    `mockBasicGasEstimateLoadingStatus:${Object.keys(s).length}`,
  getRenderableBasicEstimateData: (s) =>
    `mockRenderableBasicEstimateData:${Object.keys(s).length}`,
  getDefaultActiveButtonIndex: (a, b) => a + b,
  getCurrentEthBalance: (state) => state.metamask.balance || '0x0',
  getCustomGasPrice: (state) => state.gas.customData.price || '0x0',
  getCustomGasLimit: (state) => state.gas.customData.limit || '0x0',
  getCurrentCurrency: jest.fn().mockReturnValue('usd'),
  conversionRateSelector: jest.fn().mockReturnValue(50),
  getSendMaxModeState: jest.fn().mockReturnValue(false),
  getPreferences: jest.fn(() => ({
    showFiatInTestnets: false,
  })),
  getIsMainnet: jest.fn().mockReturnValue(false),
  isCustomPriceSafe: jest.fn().mockReturnValue(true),
}));

jest.mock('../../../../store/actions', () => ({
  hideModal: jest.fn(),
  updateTransaction: jest.fn(),
}));

jest.mock('../../../../ducks/gas/gas.duck', () => ({
  setCustomGasPrice: jest.fn(),
  setCustomGasLimit: jest.fn(),
  resetCustomData: jest.fn(),
}));

jest.mock('../../../../ducks/send', () => {
  const { ASSET_TYPES } = jest.requireActual('../../../../ducks/send');
  return {
    useCustomGas: jest.fn(),
    updateGasLimit: jest.fn(),
    updateGasPrice: jest.fn(),
    getSendAsset: jest.fn(() => ({ type: ASSET_TYPES.NATIVE })),
  };
});

require('./gas-modal-page-container.container');

describe('gas-modal-page-container container', () => {
  describe('mapDispatchToProps()', () => {
    let dispatchSpy;
    let mapDispatchToPropsObject;

    beforeEach(() => {
      dispatchSpy = sinon.spy();
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy);
    });

    afterEach(() => {
      dispatchSpy.resetHistory();
    });

    describe('useCustomGas()', () => {
      it('should dispatch a useCustomGas action', () => {
        mapDispatchToPropsObject.useCustomGas();
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(useCustomGas).toHaveBeenCalled();
      });
    });

    describe('cancelAndClose()', () => {
      it('should dispatch a hideModal action', () => {
        mapDispatchToPropsObject.cancelAndClose();
        expect(dispatchSpy.calledTwice).toStrictEqual(true);
        expect(hideModal).toHaveBeenCalled();
        expect(resetCustomData).toHaveBeenCalled();
      });
    });

    describe('updateCustomGasPrice()', () => {
      it('should dispatch a setCustomGasPrice action with the arg passed to updateCustomGasPrice hex prefixed', () => {
        mapDispatchToPropsObject.updateCustomGasPrice('ffff');
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(setCustomGasPrice).toHaveBeenCalled();
        expect(setCustomGasPrice).toHaveBeenCalledWith('0xffff');
        // expect(
        //   setCustomGasPrice.getCall(0).args[0],
        //   '0xffff',
        // );
      });

      it('should dispatch a setCustomGasPrice action', () => {
        mapDispatchToPropsObject.updateCustomGasPrice('0xffff');
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(setCustomGasPrice).toHaveBeenCalled();
        expect(setCustomGasPrice).toHaveBeenCalledWith('0xffff');
      });
    });

    describe('updateCustomGasLimit()', () => {
      it('should dispatch a setCustomGasLimit action', () => {
        mapDispatchToPropsObject.updateCustomGasLimit('0x10');
        expect(dispatchSpy.calledOnce).toStrictEqual(true);
        expect(setCustomGasLimit).toHaveBeenCalled();
        expect(setCustomGasLimit).toHaveBeenCalledWith('0x10');
      });
    });

    describe('setGasData()', () => {
      it('should dispatch a updateGasPrice and updateGasLimit action with the correct props', () => {
        mapDispatchToPropsObject.setGasData('ffff', 'aaaa');
        expect(dispatchSpy.calledTwice).toStrictEqual(true);
        expect(updateGasPrice).toHaveBeenCalled();
        expect(updateGasLimit).toHaveBeenCalled();
        expect(updateGasLimit).toHaveBeenCalledWith('ffff');
        expect(updateGasPrice).toHaveBeenCalledWith('aaaa');
      });
    });

    describe('updateConfirmTxGasAndCalculate()', () => {
      it('should dispatch a updateGasAndCalculate action with the correct props', () => {
        mapDispatchToPropsObject.updateConfirmTxGasAndCalculate('ffff', 'aaaa');
        expect(dispatchSpy.callCount).toStrictEqual(3);
        expect(setCustomGasPrice).toHaveBeenCalled();
        expect(setCustomGasLimit).toHaveBeenCalled();
        expect(setCustomGasLimit).toHaveBeenCalledWith('0xffff');
        expect(setCustomGasPrice).toHaveBeenCalledWith('0xaaaa');
      });
    });
  });

  describe('mergeProps', () => {
    let stateProps;
    let dispatchProps;
    let ownProps;

    beforeEach(() => {
      stateProps = {
        gasPriceButtonGroupProps: {
          someGasPriceButtonGroupProp: 'foo',
          anotherGasPriceButtonGroupProp: 'bar',
        },
        isConfirm: true,
        someOtherStateProp: 'baz',
        transaction: {},
      };
      dispatchProps = {
        updateCustomGasPrice: sinon.spy(),
        useCustomGas: sinon.spy(),
        setGasData: sinon.spy(),
        updateConfirmTxGasAndCalculate: sinon.spy(),
        someOtherDispatchProp: sinon.spy(),
        createSpeedUpTransaction: sinon.spy(),
        hideSidebar: sinon.spy(),
        hideModal: sinon.spy(),
        cancelAndClose: sinon.spy(),
      };
      ownProps = { someOwnProp: 123 };
    });

    it('should return the expected props when isConfirm is true', () => {
      const result = mergeProps(stateProps, dispatchProps, ownProps);

      expect(result.isConfirm).toStrictEqual(true);
      expect(result.someOtherStateProp).toStrictEqual('baz');
      expect(
        result.gasPriceButtonGroupProps.someGasPriceButtonGroupProp,
      ).toStrictEqual('foo');
      expect(
        result.gasPriceButtonGroupProps.anotherGasPriceButtonGroupProp,
      ).toStrictEqual('bar');
      expect(result.someOwnProp).toStrictEqual(123);

      expect(
        dispatchProps.updateConfirmTxGasAndCalculate.callCount,
      ).toStrictEqual(0);
      expect(dispatchProps.setGasData.callCount).toStrictEqual(0);
      expect(dispatchProps.useCustomGas.callCount).toStrictEqual(0);
      expect(dispatchProps.hideModal.callCount).toStrictEqual(0);

      result.onSubmit();

      expect(
        dispatchProps.updateConfirmTxGasAndCalculate.callCount,
      ).toStrictEqual(1);
      expect(dispatchProps.setGasData.callCount).toStrictEqual(0);
      expect(dispatchProps.useCustomGas.callCount).toStrictEqual(0);
      expect(dispatchProps.hideModal.callCount).toStrictEqual(1);

      expect(dispatchProps.updateCustomGasPrice.callCount).toStrictEqual(0);
      result.gasPriceButtonGroupProps.handleGasPriceSelection({
        gasPrice: '0x0',
      });
      expect(dispatchProps.updateCustomGasPrice.callCount).toStrictEqual(1);

      expect(dispatchProps.someOtherDispatchProp.callCount).toStrictEqual(0);
      result.someOtherDispatchProp();
      expect(dispatchProps.someOtherDispatchProp.callCount).toStrictEqual(1);
    });

    it('should return the expected props when isConfirm is false', () => {
      const result = mergeProps(
        { ...stateProps, isConfirm: false },
        dispatchProps,
        ownProps,
      );

      expect(result.isConfirm).toStrictEqual(false);
      expect(result.someOtherStateProp).toStrictEqual('baz');
      expect(
        result.gasPriceButtonGroupProps.someGasPriceButtonGroupProp,
      ).toStrictEqual('foo');
      expect(
        result.gasPriceButtonGroupProps.anotherGasPriceButtonGroupProp,
      ).toStrictEqual('bar');
      expect(result.someOwnProp).toStrictEqual(123);

      expect(
        dispatchProps.updateConfirmTxGasAndCalculate.callCount,
      ).toStrictEqual(0);
      expect(dispatchProps.setGasData.callCount).toStrictEqual(0);
      expect(dispatchProps.useCustomGas.callCount).toStrictEqual(0);
      expect(dispatchProps.cancelAndClose.callCount).toStrictEqual(0);

      result.onSubmit('mockNewLimit', 'mockNewPrice');

      expect(
        dispatchProps.updateConfirmTxGasAndCalculate.callCount,
      ).toStrictEqual(0);
      expect(dispatchProps.setGasData.callCount).toStrictEqual(1);
      expect(dispatchProps.setGasData.getCall(0).args).toStrictEqual([
        'mockNewLimit',
        'mockNewPrice',
      ]);
      expect(dispatchProps.useCustomGas.callCount).toStrictEqual(1);
      expect(dispatchProps.cancelAndClose.callCount).toStrictEqual(1);

      expect(dispatchProps.updateCustomGasPrice.callCount).toStrictEqual(0);
      result.gasPriceButtonGroupProps.handleGasPriceSelection({
        gasPrice: '0x0',
      });
      expect(dispatchProps.updateCustomGasPrice.callCount).toStrictEqual(1);

      expect(dispatchProps.someOtherDispatchProp.callCount).toStrictEqual(0);
      result.someOtherDispatchProp();
      expect(dispatchProps.someOtherDispatchProp.callCount).toStrictEqual(1);
    });

    it('should dispatch the expected actions from obSubmit when isConfirm is false and isSpeedUp is true', () => {
      const result = mergeProps(
        { ...stateProps, isSpeedUp: true, isConfirm: false },
        dispatchProps,
        ownProps,
      );

      result.onSubmit();

      expect(
        dispatchProps.updateConfirmTxGasAndCalculate.callCount,
      ).toStrictEqual(0);
      expect(dispatchProps.setGasData.callCount).toStrictEqual(0);
      expect(dispatchProps.useCustomGas.callCount).toStrictEqual(0);
      expect(dispatchProps.cancelAndClose.callCount).toStrictEqual(1);

      expect(dispatchProps.createSpeedUpTransaction.callCount).toStrictEqual(1);
      expect(dispatchProps.hideSidebar.callCount).toStrictEqual(1);
    });
  });
});
