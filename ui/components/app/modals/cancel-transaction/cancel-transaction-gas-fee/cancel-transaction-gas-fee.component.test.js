import React from 'react';
import { shallow } from 'enzyme';
import UserPreferencedCurrencyDisplay from '../../../user-preferenced-currency-display';
import CancelTransactionGasFee from './cancel-transaction-gas-fee.component';

describe('CancelTransactionGasFee Component', () => {
  it('should render', () => {
    const wrapper = shallow(<CancelTransactionGasFee value="0x3b9aca00" />);

    expect(wrapper.find('.cancel-transaction-gas-fee')).toHaveLength(1);
    expect(wrapper.find(UserPreferencedCurrencyDisplay)).toHaveLength(2);
    const ethDisplay = wrapper.find(UserPreferencedCurrencyDisplay).at(0);
    const fiatDisplay = wrapper.find(UserPreferencedCurrencyDisplay).at(1);

    expect(ethDisplay.props().value).toStrictEqual('0x3b9aca00');
    expect(ethDisplay.props().className).toStrictEqual(
      'cancel-transaction-gas-fee__eth',
    );

    expect(fiatDisplay.props().value).toStrictEqual('0x3b9aca00');
    expect(fiatDisplay.props().className).toStrictEqual(
      'cancel-transaction-gas-fee__fiat',
    );
  });
});
