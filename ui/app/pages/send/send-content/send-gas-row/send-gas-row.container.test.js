import assert from 'assert';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

let mapDispatchToProps;
let mergeProps;

const actionSpies = {
  showModal: sinon.spy(),
  setGasPrice: sinon.spy(),
  setGasTotal: sinon.spy(),
  setGasLimit: sinon.spy(),
};

const sendDuckSpies = {
  showGasButtonGroup: sinon.spy(),
};

const gasDuckSpies = {
  resetCustomData: sinon.spy(),
  setCustomGasPrice: sinon.spy(),
  setCustomGasLimit: sinon.spy(),
};

proxyquire('./send-gas-row.container.js', {
  'react-redux': {
    connect: (_, md, mp) => {
      mapDispatchToProps = md;
      mergeProps = mp;
      return () => ({});
    },
  },
  '../../../../selectors': {
    getSendMaxModeState: (s) => `mockMaxModeOn:${s}`,
  },
  '../../send.utils.js': {
    isBalanceSufficient: ({ amount, gasTotal, balance, conversionRate }) =>
      `${amount}:${gasTotal}:${balance}:${conversionRate}`,
    calcGasTotal: (gasLimit, gasPrice) => gasLimit + gasPrice,
  },
  '../../../../store/actions': actionSpies,
  '../../../../ducks/send/send.duck': sendDuckSpies,
  '../../../../ducks/gas/gas.duck': gasDuckSpies,
});

describe('send-gas-row container', function () {
  describe('mapDispatchToProps()', function () {
    let dispatchSpy;
    let mapDispatchToPropsObject;

    beforeEach(function () {
      dispatchSpy = sinon.spy();
      mapDispatchToPropsObject = mapDispatchToProps(dispatchSpy);
      actionSpies.setGasTotal.resetHistory();
    });

    describe('showCustomizeGasModal()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.showCustomizeGasModal();
        assert(dispatchSpy.calledOnce);
        assert.deepStrictEqual(actionSpies.showModal.getCall(0).args[0], {
          name: 'CUSTOMIZE_GAS',
          hideBasic: true,
        });
      });
    });

    describe('setGasPrice()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.setGasPrice({
          gasPrice: 'mockNewPrice',
          gasLimit: 'mockLimit',
        });
        assert(dispatchSpy.calledThrice);
        assert(actionSpies.setGasPrice.calledOnce);
        assert.strictEqual(
          actionSpies.setGasPrice.getCall(0).args[0],
          'mockNewPrice',
        );
        assert.strictEqual(
          gasDuckSpies.setCustomGasPrice.getCall(0).args[0],
          'mockNewPrice',
        );
        assert(actionSpies.setGasTotal.calledOnce);
        assert.strictEqual(
          actionSpies.setGasTotal.getCall(0).args[0],
          'mockLimitmockNewPrice',
        );
      });
    });

    describe('setGasLimit()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.setGasLimit('mockNewLimit', 'mockPrice');
        assert(dispatchSpy.calledThrice);
        assert(actionSpies.setGasLimit.calledOnce);
        assert.strictEqual(
          actionSpies.setGasLimit.getCall(0).args[0],
          'mockNewLimit',
        );
        assert.strictEqual(
          gasDuckSpies.setCustomGasLimit.getCall(0).args[0],
          'mockNewLimit',
        );
        assert(actionSpies.setGasTotal.calledOnce);
        assert.strictEqual(
          actionSpies.setGasTotal.getCall(0).args[0],
          'mockNewLimitmockPrice',
        );
      });
    });

    describe('showGasButtonGroup()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.showGasButtonGroup();
        assert(dispatchSpy.calledOnce);
        assert(sendDuckSpies.showGasButtonGroup.calledOnce);
      });
    });

    describe('resetCustomData()', function () {
      it('should dispatch an action', function () {
        mapDispatchToPropsObject.resetCustomData();
        assert(dispatchSpy.calledOnce);
        assert(gasDuckSpies.resetCustomData.calledOnce);
      });
    });
  });

  describe('mergeProps', function () {
    it('should return the expected props when isConfirm is true', function () {
      const stateProps = {
        gasPriceButtonGroupProps: {
          someGasPriceButtonGroupProp: 'foo',
          anotherGasPriceButtonGroupProp: 'bar',
        },
        someOtherStateProp: 'baz',
      };
      const dispatchProps = {
        setGasPrice: sinon.spy(),
        someOtherDispatchProp: sinon.spy(),
      };
      const ownProps = { someOwnProp: 123 };
      const result = mergeProps(stateProps, dispatchProps, ownProps);

      assert.strictEqual(result.someOtherStateProp, 'baz');
      assert.strictEqual(
        result.gasPriceButtonGroupProps.someGasPriceButtonGroupProp,
        'foo',
      );
      assert.strictEqual(
        result.gasPriceButtonGroupProps.anotherGasPriceButtonGroupProp,
        'bar',
      );
      assert.strictEqual(result.someOwnProp, 123);

      assert.strictEqual(dispatchProps.setGasPrice.callCount, 0);
      result.gasPriceButtonGroupProps.handleGasPriceSelection();
      assert.strictEqual(dispatchProps.setGasPrice.callCount, 1);

      assert.strictEqual(dispatchProps.someOtherDispatchProp.callCount, 0);
      result.someOtherDispatchProp();
      assert.strictEqual(dispatchProps.someOtherDispatchProp.callCount, 1);
    });
  });
});
