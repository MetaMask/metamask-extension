import assert from 'assert';
import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import CurrencyDisplay from '../../ui/currency-display';
import * as currencyHook from '../../../hooks/useCurrencyDisplay';
import * as currencyPrefHook from '../../../hooks/useUserPreferencedCurrency';
import UserPreferencedCurrencyDisplay from './user-preferenced-currency-display.component';

describe('UserPreferencedCurrencyDisplay Component', function () {
  describe('rendering', function () {
    beforeEach(function () {
      sinon.stub(currencyHook, 'useCurrencyDisplay').returns(['1', {}]);
      sinon
        .stub(currencyPrefHook, 'useUserPreferencedCurrency')
        .returns({ currency: 'ETH', decimals: 6 });
    });
    it('should render properly', function () {
      const wrapper = shallow(<UserPreferencedCurrencyDisplay />);

      assert.ok(wrapper);
      assert.strictEqual(wrapper.find(CurrencyDisplay).length, 1);
    });

    it('should pass all props to the CurrencyDisplay child component', function () {
      const wrapper = shallow(
        <UserPreferencedCurrencyDisplay prop1 prop2="test" prop3={1} />,
      );

      assert.ok(wrapper);
      assert.strictEqual(wrapper.find(CurrencyDisplay).length, 1);
      assert.strictEqual(wrapper.find(CurrencyDisplay).props().prop1, true);
      assert.strictEqual(wrapper.find(CurrencyDisplay).props().prop2, 'test');
      assert.strictEqual(wrapper.find(CurrencyDisplay).props().prop3, 1);
    });
    afterEach(function () {
      sinon.restore();
    });
  });
});
