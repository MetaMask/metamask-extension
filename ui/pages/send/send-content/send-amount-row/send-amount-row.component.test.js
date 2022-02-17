import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import SendRowWrapper from '../send-row-wrapper/send-row-wrapper.component';
import UserPreferencedTokenInput from '../../../../components/app/user-preferenced-token-input';
import { ASSET_TYPES } from '../../../../ducks/send';
import SendAmountRow from './send-amount-row.component';

import AmountMaxButton from './amount-max-button/amount-max-button';

describe('SendAmountRow Component', () => {
  describe('updateAmount', () => {
    it('should call updateSendAmount', () => {
      const {
        instance,
        propsMethodSpies: { updateSendAmount },
      } = shallowRenderSendAmountRow();

      expect(updateSendAmount.callCount).toStrictEqual(0);

      instance.handleChange('someAmount');

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
      const { wrapper } = shallowRenderSendAmountRow();
      const { onChange, error, value } = wrapper
        .find(SendRowWrapper)
        .childAt(1)
        .props();

      expect(error).toStrictEqual(false);
      expect(value).toStrictEqual('mockAmount');

      onChange('mockNewAmount');
    });
  });
});

function shallowRenderSendAmountRow() {
  const updateSendAmount = sinon.spy();
  const wrapper = shallow(
    <SendAmountRow
      amount="mockAmount"
      inError={false}
      asset={{
        type: ASSET_TYPES.TOKEN,
        balance: 'mockTokenBalance',
        details: { address: 'mockTokenAddress' },
      }}
      updateSendAmount={updateSendAmount}
    />,
    { context: { t: (str) => `${str}_t` } },
  );
  const instance = wrapper.instance();

  return {
    instance,
    wrapper,
    propsMethodSpies: {
      updateSendAmount,
    },
  };
}
