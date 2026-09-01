import React from 'react';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import PigIcon from './pig-icon';

describe('PigIcon', () => {
  it('renders the component', () => {
    const { container } = renderWithProvider(<PigIcon />);
    expect(container.firstChild.nodeName).toBe('svg');
  });
});
