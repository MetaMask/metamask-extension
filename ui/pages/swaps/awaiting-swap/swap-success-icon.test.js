import React from 'react';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import SwapSuccessIcon from './swap-success-icon';

describe('SwapSuccessIcon', () => {
  it('renders the component', () => {
    const { container } = renderWithProvider(<SwapSuccessIcon />);
    expect(container).toMatchSnapshot();
  });
});
