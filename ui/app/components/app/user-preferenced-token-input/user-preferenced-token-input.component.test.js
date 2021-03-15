import assert from 'assert';
import React from 'react';
import { shallow } from 'enzyme';
import TokenInput from '../../ui/token-input';
import UserPreferencedTokenInput from './user-preferenced-token-input.component';

describe('UserPreferencedCurrencyInput Component', function () {
  describe('rendering', function () {
    it('should render properly', function () {
      const wrapper = shallow(
        <UserPreferencedTokenInput token={{ address: '0x0' }} />,
      );

      assert.ok(wrapper);
      assert.strictEqual(wrapper.find(TokenInput).length, 1);
    });

    it('should render showFiat for TokenInput based on preferences.useNativeCurrencyAsPrimaryCurrency', function () {
      const wrapper = shallow(
        <UserPreferencedTokenInput
          token={{ address: '0x0' }}
          useNativeCurrencyAsPrimaryCurrency
        />,
      );

      assert.ok(wrapper);
      assert.strictEqual(wrapper.find(TokenInput).length, 1);
      assert.strictEqual(wrapper.find(TokenInput).props().showFiat, false);
      wrapper.setProps({ useNativeCurrencyAsPrimaryCurrency: false });
      assert.strictEqual(wrapper.find(TokenInput).props().showFiat, true);
    });
  });
});
