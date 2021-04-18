import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import UserPreferencedCurrencyDisplay from '../../../../../components/app/user-preferenced-currency-display';
import GasFeeDisplay from './gas-fee-display.component';

const propsMethodSpies = {
  showCustomizeGasModal: sinon.spy(),
  onReset: sinon.spy(),
};

describe('GasFeeDisplay Component', () => {
  let wrapper;

  describe('render', () => {
    beforeEach(() => {
      wrapper = shallow(
        <GasFeeDisplay
          conversionRate={20}
          gasTotal="mockGasTotal"
          primaryCurrency="mockPrimaryCurrency"
          convertedCurrency="mockConvertedCurrency"
          showGasButtonGroup={propsMethodSpies.showCustomizeGasModal}
          onReset={propsMethodSpies.onReset}
        />,
        { context: { t: (str) => `${str}_t` } },
      );
    });

    afterEach(() => {
      propsMethodSpies.showCustomizeGasModal.resetHistory();
    });

    it('should render a CurrencyDisplay component', () => {
      expect(wrapper.find(UserPreferencedCurrencyDisplay)).toHaveLength(2);
    });

    it('should render the CurrencyDisplay with the correct props', () => {
      const { type, value } = wrapper
        .find(UserPreferencedCurrencyDisplay)
        .at(0)
        .props();
      expect(type).toStrictEqual('PRIMARY');
      expect(value).toStrictEqual('mockGasTotal');
    });

    it('should render the reset button with the correct props', () => {
      const { onClick, className } = wrapper.find('button').props();
      expect(className).toStrictEqual('gas-fee-reset');
      expect(propsMethodSpies.onReset.callCount).toStrictEqual(0);
      onClick();
      expect(propsMethodSpies.onReset.callCount).toStrictEqual(1);
    });

    it('should render the reset button with the correct text', () => {
      expect(wrapper.find('button').text()).toStrictEqual('reset_t');
    });
  });
});
