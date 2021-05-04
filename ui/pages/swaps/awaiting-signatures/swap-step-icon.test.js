import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import SwapStepIcon from './swap-step-icon';

describe('SwapStepIcon', () => {
  it('renders the component', () => {
    const { container } = renderWithProvider(<SwapStepIcon />);
    expect(container).toMatchSnapshot();
  });
});
