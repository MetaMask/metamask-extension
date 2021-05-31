import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import PigIcon from './pig-icon';

describe('PigIcon', () => {
  it('renders the component', () => {
    const { container } = renderWithProvider(<PigIcon />);
    expect(container.firstChild.nodeName).toBe('svg');
  });
});
