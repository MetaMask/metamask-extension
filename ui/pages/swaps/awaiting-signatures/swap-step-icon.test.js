import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import SwapStepIcon from './swap-step-icon';

describe('SwapStepIcon', () => {
  it('renders the component with step 1 by default', () => {
    const { container } = renderWithProvider(<SwapStepIcon />);
    expect(container).toMatchSnapshot();
  });

  it('renders the component with step 2', () => {
    const { container } = renderWithProvider(<SwapStepIcon stepNumber={2} />);
    expect(container).toMatchSnapshot();
  });
});
