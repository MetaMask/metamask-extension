import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import SwapFailureIcon from './swap-failure-icon';

describe('SwapFailureIcon', () => {
  it('renders the component', () => {
    const { container } = renderWithProvider(<SwapFailureIcon />);
    expect(container).toMatchSnapshot();
  });
});
