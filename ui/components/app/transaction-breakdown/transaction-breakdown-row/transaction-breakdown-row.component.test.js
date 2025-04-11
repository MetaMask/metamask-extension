import React from 'react';

import TransactionBreakdownRow from '.';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import Button from '../../../ui/button';

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
