import React from 'react';
import { shallow } from 'enzyme';
import Button from '../../../ui/button';
import TransactionBreakdownRow from './transaction-breakdown-row.component';

describe('TransactionBreakdownRow Component', () => {
  it('should render text properly', () => {
    const wrapper = shallow(
      <TransactionBreakdownRow title="test" className="test-class">
        Test
      </TransactionBreakdownRow>,
    );

    expect(wrapper.hasClass('transaction-breakdown-row')).toStrictEqual(true);
    expect(
      wrapper.find('.transaction-breakdown-row__title').text(),
    ).toStrictEqual('test');
    expect(
      wrapper.find('.transaction-breakdown-row__value').text(),
    ).toStrictEqual('Test');
  });

  it('should render components properly', () => {
    const wrapper = shallow(
      <TransactionBreakdownRow title="test" className="test-class">
        <Button onClick={() => undefined}>Button</Button>
      </TransactionBreakdownRow>,
    );

    expect(wrapper.hasClass('transaction-breakdown-row')).toStrictEqual(true);
    expect(
      wrapper.find('.transaction-breakdown-row__title').text(),
    ).toStrictEqual('test');
    expect(
      wrapper.find('.transaction-breakdown-row__value').find(Button),
    ).toHaveLength(1);
  });
});
