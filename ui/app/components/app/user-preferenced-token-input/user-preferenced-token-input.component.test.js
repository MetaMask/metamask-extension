import React from 'react';
import { shallow } from 'enzyme';
import TokenInput from '../../ui/token-input';
import UserPreferencedTokenInput from './user-preferenced-token-input.component';

describe('UserPreferencedCurrencyInput Component', () => {
  describe('rendering', () => {
    it('should render properly', () => {
      const wrapper = shallow(
        <UserPreferencedTokenInput token={{ address: '0x0' }} />,
      );

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find(TokenInput)).toHaveLength(1);
    });

    it('should render showFiat for TokenInput based on preferences.useNativeCurrencyAsPrimaryCurrency', () => {
      const wrapper = shallow(
        <UserPreferencedTokenInput
          token={{ address: '0x0' }}
          useNativeCurrencyAsPrimaryCurrency
        />,
      );

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find(TokenInput)).toHaveLength(1);
      expect(wrapper.find(TokenInput).props().showFiat).toStrictEqual(false);
      wrapper.setProps({ useNativeCurrencyAsPrimaryCurrency: false });
      expect(wrapper.find(TokenInput).props().showFiat).toStrictEqual(true);
    });
  });
});
