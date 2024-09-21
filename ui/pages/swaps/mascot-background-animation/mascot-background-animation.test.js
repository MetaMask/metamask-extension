import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import MascotBackgroundAnimation from './mascot-background-animation';

describe('MascotBackgroundAnimation', () => {
  it('renders the component', () => {
    const { getByTestId } = renderWithProvider(<MascotBackgroundAnimation />);
    expect(
      getByTestId('mascot-background-animation-background-1'),
    ).toBeInTheDocument();
    expect(
      getByTestId('mascot-background-animation-background-2'),
    ).toBeInTheDocument();
    expect(
      getByTestId('mascot-background-animation-mascot-container'),
    ).toBeInTheDocument();
  });
});
