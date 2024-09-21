import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import QuotesTimeoutIcon from './quotes-timeout-icon';

describe('QuotesTimeoutIcon', () => {
  it('renders the component', () => {
    const { container } = renderWithProvider(<QuotesTimeoutIcon />);
    expect(container).toMatchSnapshot();
  });
});
