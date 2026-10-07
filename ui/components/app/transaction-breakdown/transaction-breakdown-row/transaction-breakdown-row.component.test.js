import React from 'react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import Button from '../../../ui/button/button.component';
import TransactionBreakdownRow from './transaction-breakdown-row.component';

describe('TransactionBreakdownRow Component', () => {
  it('should match snapshot', () => {
    const props = {
      title: 'test',
      className: 'test-class',
    };

    const { container } = renderWithProvider(
      <TransactionBreakdownRow {...props}>
        <Button onClick={() => undefined}>Button</Button>
      </TransactionBreakdownRow>,
    );

    expect(container).toMatchSnapshot();
  });
});
