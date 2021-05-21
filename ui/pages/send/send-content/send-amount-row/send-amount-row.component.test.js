import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import SendRowWrapper from '../send-row-wrapper/send-row-wrapper.component';
import UserPreferencedTokenInput from '../../../../components/app/user-preferenced-token-input';
import SendAmountRow from './send-amount-row.component';

import AmountMaxButton from './amount-max-button/amount-max-button.container';

describe('SendAmountRow Component', () => {
  describe('validateAmount', () => {
    it('should call updateSendAmountError with the correct params', () => {
      const {
        instance,
        propsMethodSpies: { updateSendAmountError },
      } = shallowRenderSendAmountRow();

      expect(updateSendAmountError.callCount).toStrictEqual(0);

      instance.validateAmount('someAmount');

      expect(
        updateSendAmountError.calledOnceWithExactly({
          amount: 'someAmount',
          balance: 'mockBalance',
          conversionRate: 7,
          gasTotal: 'mockGasTotal',
          primaryCurrency: 'mockPrimaryCurrency',
          sendToken: { address: 'mockTokenAddress' },
          tokenBalance: 'mockTokenBalance',
        }),
      ).toStrictEqual(true);
    });

    it('should call updateGasFeeError if sendToken is truthy', () => {
      const {
        instance,
        propsMethodSpies: { updateGasFeeError },
      } = shallowRenderSendAmountRow();

      expect(updateGasFeeError.callCount).toStrictEqual(0);

      instance.validateAmount('someAmount');

      expect(
        updateGasFeeError.calledOnceWithExactly({
          balance: 'mockBalance',
          conversionRate: 7,
          gasTotal: 'mockGasTotal',
          primaryCurrency: 'mockPrimaryCurrency',
          sendToken: { address: 'mockTokenAddress' },
          tokenBalance: 'mockTokenBalance',
        }),
      ).toStrictEqual(true);
    });

    it('should call not updateGasFeeError if sendToken is falsey', () => {
      const {
        wrapper,
        instance,
        propsMethodSpies: { updateGasFeeError },
      } = shallowRenderSendAmountRow();

      wrapper.setProps({ sendToken: null });

      expect(updateGasFeeError.callCount).toStrictEqual(0);

      instance.validateAmount('someAmount');

      expect(updateGasFeeError.callCount).toStrictEqual(0);
    });
  });

  describe('updateAmount', () => {
    it('should call setMaxModeTo', () => {
      const {
        instance,
        propsMethodSpies: { setMaxModeTo },
      } = shallowRenderSendAmountRow();

      expect(setMaxModeTo.callCount).toStrictEqual(0);

      instance.updateAmount('someAmount');

      expect(setMaxModeTo.calledOnceWithExactly(false)).toStrictEqual(true);
    });

    it('should call updateSendAmount', () => {
      const {
        instance,
        propsMethodSpies: { updateSendAmount },
      } = shallowRenderSendAmountRow();

      expect(updateSendAmount.callCount).toStrictEqual(0);

      instance.updateAmount('someAmount');

      expect(
        updateSendAmount.calledOnceWithExactly('someAmount'),
      ).toStrictEqual(true);
    });
  });

  describe('render', () => {
    it('should render a SendRowWrapper component', () => {
      const { wrapper } = shallowRenderSendAmountRow();

      expect(wrapper.find(SendRowWrapper)).toHaveLength(1);
    });

    it('should pass the correct props to SendRowWrapper', () => {
      const { wrapper } = shallowRenderSendAmountRow();
      const { errorType, label, showError } = wrapper
        .find(SendRowWrapper)
        .props();

      expect(errorType).toStrictEqual('amount');
      expect(label).toStrictEqual('amount_t:');
      expect(showError).toStrictEqual(false);
    });

    it('should render an AmountMaxButton as the first child of the SendRowWrapper', () => {
      const { wrapper } = shallowRenderSendAmountRow();

      expect(
        wrapper.find(SendRowWrapper).childAt(0).is(AmountMaxButton),
      ).toStrictEqual(true);
    });

    it('should render a UserPreferencedTokenInput as the second child of the SendRowWrapper', () => {
      const { wrapper } = shallowRenderSendAmountRow();

      expect(
        wrapper.find(SendRowWrapper).childAt(1).is(UserPreferencedTokenInput),
      ).toStrictEqual(true);
    });

    it('should render the UserPreferencedTokenInput with the correct props', () => {
      const {
        wrapper,
        instanceSpies: { updateGas, updateAmount, validateAmount },
      } = shallowRenderSendAmountRow();
      const { onChange, error, value } = wrapper
        .find(SendRowWrapper)
        .childAt(1)
        .props();

      expect(error).toStrictEqual(false);
      expect(value).toStrictEqual('mockAmount');
      expect(updateGas.callCount).toStrictEqual(0);
      expect(updateAmount.callCount).toStrictEqual(0);
      expect(validateAmount.callCount).toStrictEqual(0);

      onChange('mockNewAmount');

      expect(updateGas.calledOnceWithExactly('mockNewAmount')).toStrictEqual(
        true,
      );
      expect(updateAmount.calledOnceWithExactly('mockNewAmount')).toStrictEqual(
        true,
      );
      expect(
        validateAmount.calledOnceWithExactly('mockNewAmount'),
      ).toStrictEqual(true);
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
