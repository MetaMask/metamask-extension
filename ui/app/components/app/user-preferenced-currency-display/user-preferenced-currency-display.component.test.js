import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import CurrencyDisplay from '../../ui/currency-display';
import * as currencyHook from '../../../hooks/useCurrencyDisplay';
import * as currencyPrefHook from '../../../hooks/useUserPreferencedCurrency';
import UserPreferencedCurrencyDisplay from './user-preferenced-currency-display.component';

describe('UserPreferencedCurrencyDisplay Component', () => {
  describe('rendering', () => {
    beforeEach(() => {
      sinon.stub(currencyHook, 'useCurrencyDisplay').returns(['1', {}]);
      sinon
        .stub(currencyPrefHook, 'useUserPreferencedCurrency')
        .returns({ currency: 'ETH', decimals: 6 });
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should render properly', () => {
      const wrapper = shallow(<UserPreferencedCurrencyDisplay />);

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find(CurrencyDisplay)).toHaveLength(1);
    });

    it('should pass all props to the CurrencyDisplay child component', () => {
      const wrapper = shallow(
        <UserPreferencedCurrencyDisplay prop1 prop2="test" prop3={1} />,
      );

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find(CurrencyDisplay)).toHaveLength(1);
      expect(wrapper.find(CurrencyDisplay).props().prop1).toStrictEqual(true);
      expect(wrapper.find(CurrencyDisplay).props().prop2).toStrictEqual('test');
      expect(wrapper.find(CurrencyDisplay).props().prop3).toStrictEqual(1);
    });
  });
});
