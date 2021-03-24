import assert from 'assert';
import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import SendRowWrapper from '../send-row-wrapper/send-row-wrapper.component';
import UserPreferencedTokenInput from '../../../../components/app/user-preferenced-token-input';
import SendAmountRow from './send-amount-row.component';

import AmountMaxButton from './amount-max-button/amount-max-button.container';

describe('SendAmountRow Component', function () {
  describe('validateAmount', function () {
    it('should call updateSendAmountError with the correct params', function () {
      const {
        instance,
        propsMethodSpies: { updateSendAmountError },
      } = shallowRenderSendAmountRow();

      assert.strictEqual(updateSendAmountError.callCount, 0);

      instance.validateAmount('someAmount');

      assert.ok(
        updateSendAmountError.calledOnceWithExactly({
          amount: 'someAmount',
          balance: 'mockBalance',
          conversionRate: 7,
          gasTotal: 'mockGasTotal',
          primaryCurrency: 'mockPrimaryCurrency',
          sendToken: { address: 'mockTokenAddress' },
          tokenBalance: 'mockTokenBalance',
        }),
      );
    });

    it('should call updateGasFeeError if sendToken is truthy', function () {
      const {
        instance,
        propsMethodSpies: { updateGasFeeError },
      } = shallowRenderSendAmountRow();

      assert.strictEqual(updateGasFeeError.callCount, 0);

      instance.validateAmount('someAmount');

      assert.ok(
        updateGasFeeError.calledOnceWithExactly({
          balance: 'mockBalance',
          conversionRate: 7,
          gasTotal: 'mockGasTotal',
          primaryCurrency: 'mockPrimaryCurrency',
          sendToken: { address: 'mockTokenAddress' },
          tokenBalance: 'mockTokenBalance',
        }),
      );
    });

    it('should call not updateGasFeeError if sendToken is falsey', function () {
      const {
        wrapper,
        instance,
        propsMethodSpies: { updateGasFeeError },
      } = shallowRenderSendAmountRow();

      wrapper.setProps({ sendToken: null });

      assert.strictEqual(updateGasFeeError.callCount, 0);

      instance.validateAmount('someAmount');

      assert.strictEqual(updateGasFeeError.callCount, 0);
    });
  });

  describe('updateAmount', function () {
    it('should call setMaxModeTo', function () {
      const {
        instance,
        propsMethodSpies: { setMaxModeTo },
      } = shallowRenderSendAmountRow();

      assert.strictEqual(setMaxModeTo.callCount, 0);

      instance.updateAmount('someAmount');

      assert.ok(setMaxModeTo.calledOnceWithExactly(false));
    });

    it('should call updateSendAmount', function () {
      const {
        instance,
        propsMethodSpies: { updateSendAmount },
      } = shallowRenderSendAmountRow();

      assert.strictEqual(updateSendAmount.callCount, 0);

      instance.updateAmount('someAmount');

      assert.ok(updateSendAmount.calledOnceWithExactly('someAmount'));
    });
  });

  describe('render', function () {
    it('should render a SendRowWrapper component', function () {
      const { wrapper } = shallowRenderSendAmountRow();

      assert.strictEqual(wrapper.find(SendRowWrapper).length, 1);
    });

    it('should pass the correct props to SendRowWrapper', function () {
      const { wrapper } = shallowRenderSendAmountRow();
      const { errorType, label, showError } = wrapper
        .find(SendRowWrapper)
        .props();

      assert.strictEqual(errorType, 'amount');
      assert.strictEqual(label, 'amount_t:');
      assert.strictEqual(showError, false);
    });

    it('should render an AmountMaxButton as the first child of the SendRowWrapper', function () {
      const { wrapper } = shallowRenderSendAmountRow();

      assert(wrapper.find(SendRowWrapper).childAt(0).is(AmountMaxButton));
    });

    it('should render a UserPreferencedTokenInput as the second child of the SendRowWrapper', function () {
      const { wrapper } = shallowRenderSendAmountRow();

      assert(
        wrapper.find(SendRowWrapper).childAt(1).is(UserPreferencedTokenInput),
      );
    });

    it('should render the UserPreferencedTokenInput with the correct props', function () {
      const {
        wrapper,
        instanceSpies: { updateGas, updateAmount, validateAmount },
      } = shallowRenderSendAmountRow();
      const { onChange, error, value } = wrapper
        .find(SendRowWrapper)
        .childAt(1)
        .props();

      assert.strictEqual(error, false);
      assert.strictEqual(value, 'mockAmount');
      assert.strictEqual(updateGas.callCount, 0);
      assert.strictEqual(updateAmount.callCount, 0);
      assert.strictEqual(validateAmount.callCount, 0);

      onChange('mockNewAmount');

      assert.ok(updateGas.calledOnceWithExactly('mockNewAmount'));
      assert.ok(updateAmount.calledOnceWithExactly('mockNewAmount'));
      assert.ok(validateAmount.calledOnceWithExactly('mockNewAmount'));
    });
  });
});

function shallowRenderSendAmountRow() {
  const setMaxModeTo = sinon.spy();
  const updateGasFeeError = sinon.spy();
  const updateSendAmount = sinon.spy();
  const updateSendAmountError = sinon.spy();
  const wrapper = shallow(
    <SendAmountRow
      amount="mockAmount"
      balance="mockBalance"
      conversionRate={7}
      convertedCurrency="mockConvertedCurrency"
      gasTotal="mockGasTotal"
      inError={false}
      primaryCurrency="mockPrimaryCurrency"
      sendToken={{ address: 'mockTokenAddress' }}
      setMaxModeTo={setMaxModeTo}
      tokenBalance="mockTokenBalance"
      updateGasFeeError={updateGasFeeError}
      updateSendAmount={updateSendAmount}
      updateSendAmountError={updateSendAmountError}
      updateGas={() => undefined}
    />,
    { context: { t: (str) => `${str}_t` } },
  );
  const instance = wrapper.instance();
  const updateAmount = sinon.spy(instance, 'updateAmount');
  const updateGas = sinon.spy(instance, 'updateGas');
  const validateAmount = sinon.spy(instance, 'validateAmount');

  return {
    instance,
    wrapper,
    propsMethodSpies: {
      setMaxModeTo,
      updateGasFeeError,
      updateSendAmount,
      updateSendAmountError,
    },
    instanceSpies: {
      updateAmount,
      updateGas,
      validateAmount,
    },
  };
}
