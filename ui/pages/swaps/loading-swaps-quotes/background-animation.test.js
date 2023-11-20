import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import BackgroundAnimation from './background-animation';

describe('BackgroundAnimation', () => {
  it('renders the component', () => {
    const { container, getByTestId } = renderWithProvider(
      <BackgroundAnimation />,
    );
    expect(
      getByTestId('loading-swaps-quotes-background-1'),
    ).toBeInTheDocument();
    expect(
      getByTestId('loading-swaps-quotes-background-2'),
    ).toBeInTheDocument();
    expect(container.firstChild.firstChild.nodeName).toBe('svg');
  });
});
