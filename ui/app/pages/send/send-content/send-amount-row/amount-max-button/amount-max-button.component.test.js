import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import AmountMaxButton from './amount-max-button.component';

describe('AmountMaxButton Component', () => {
  let wrapper;
  let instance;

  const propsMethodSpies = {
    setAmountToMax: sinon.spy(),
    setMaxModeTo: sinon.spy(),
  };

  const MOCK_EVENT = { preventDefault: () => undefined };

  beforeAll(() => {
    sinon.spy(AmountMaxButton.prototype, 'setMaxAmount');
  });

  beforeEach(() => {
    wrapper = shallow(
      <AmountMaxButton
        balance="mockBalance"
        gasTotal="mockGasTotal"
        maxModeOn={false}
        sendToken={{ address: 'mockTokenAddress' }}
        setAmountToMax={propsMethodSpies.setAmountToMax}
        setMaxModeTo={propsMethodSpies.setMaxModeTo}
        tokenBalance="mockTokenBalance"
      />,
      {
        context: {
          t: (str) => `${str}_t`,
          metricsEvent: () => undefined,
        },
      },
    );
    instance = wrapper.instance();
  });

  afterEach(() => {
    propsMethodSpies.setAmountToMax.resetHistory();
    propsMethodSpies.setMaxModeTo.resetHistory();
    AmountMaxButton.prototype.setMaxAmount.resetHistory();
  });

  afterAll(() => {
    sinon.restore();
  });

  describe('setMaxAmount', () => {
    it('should call setAmountToMax with the correct params', () => {
      expect(propsMethodSpies.setAmountToMax.callCount).toStrictEqual(0);
      instance.setMaxAmount();
      expect(propsMethodSpies.setAmountToMax.callCount).toStrictEqual(1);
      expect(propsMethodSpies.setAmountToMax.getCall(0).args).toStrictEqual([
        {
          balance: 'mockBalance',
          gasTotal: 'mockGasTotal',
          sendToken: { address: 'mockTokenAddress' },
          tokenBalance: 'mockTokenBalance',
        },
      ]);
    });
  });

  describe('render', () => {
    it('should render an element with a send-v2__amount-max class', () => {
      expect(wrapper.find('.send-v2__amount-max')).toHaveLength(1);
    });

    it('should call setMaxModeTo and setMaxAmount when the checkbox is checked', () => {
      const { onClick } = wrapper.find('.send-v2__amount-max').props();

      expect(AmountMaxButton.prototype.setMaxAmount.callCount).toStrictEqual(0);
      expect(propsMethodSpies.setMaxModeTo.callCount).toStrictEqual(0);
      onClick(MOCK_EVENT);
      expect(AmountMaxButton.prototype.setMaxAmount.callCount).toStrictEqual(1);
      expect(propsMethodSpies.setMaxModeTo.callCount).toStrictEqual(1);
      expect(propsMethodSpies.setMaxModeTo.getCall(0).args).toStrictEqual([
        true,
      ]);
    });

    it('should render the expected text when maxModeOn is false', () => {
      wrapper.setProps({ maxModeOn: false });
      expect(wrapper.find('.send-v2__amount-max').text()).toStrictEqual(
        'max_t',
      );
    });
  });
});
