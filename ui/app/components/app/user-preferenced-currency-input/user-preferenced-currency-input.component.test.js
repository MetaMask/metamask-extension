import assert from 'assert';
import React from 'react';
import { shallow } from 'enzyme';
import CurrencyInput from '../../ui/currency-input';
import UserPreferencedCurrencyInput from './user-preferenced-currency-input.component';

describe('UserPreferencedCurrencyInput Component', function () {
  describe('rendering', function () {
    it('should render properly', function () {
      const wrapper = shallow(<UserPreferencedCurrencyInput />);

      assert.ok(wrapper);
      assert.strictEqual(wrapper.find(CurrencyInput).length, 1);
    });

    it('should render useFiat for CurrencyInput based on preferences.useNativeCurrencyAsPrimaryCurrency', function () {
      const wrapper = shallow(
        <UserPreferencedCurrencyInput useNativeCurrencyAsPrimaryCurrency />,
      );

      assert.ok(wrapper);
      assert.strictEqual(wrapper.find(CurrencyInput).length, 1);
      assert.strictEqual(wrapper.find(CurrencyInput).props().useFiat, false);
      wrapper.setProps({ useNativeCurrencyAsPrimaryCurrency: false });
      assert.strictEqual(wrapper.find(CurrencyInput).props().useFiat, true);
    });
  });
});
