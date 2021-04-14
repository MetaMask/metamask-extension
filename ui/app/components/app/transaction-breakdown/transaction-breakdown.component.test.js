import React from 'react';
import { shallow } from 'enzyme';
import { TRANSACTION_STATUSES } from '../../../../../shared/constants/transaction';
import TransactionBreakdown from './transaction-breakdown.component';

describe('TransactionBreakdown Component', () => {
  it('should render properly', () => {
    const transaction = {
      history: [],
      id: 1,
      status: TRANSACTION_STATUSES.CONFIRMED,
      txParams: {
        from: '0x1',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        nonce: '0xa4',
        to: '0x2',
        value: '0x2386f26fc10000',
      },
    };

    const wrapper = shallow(
      <TransactionBreakdown transaction={transaction} className="test-class" />,
      { context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) } },
    );

    expect(wrapper.hasClass('transaction-breakdown')).toStrictEqual(true);
    expect(wrapper.hasClass('test-class')).toStrictEqual(true);
  });
});
