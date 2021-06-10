import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import BackgroundAnimation from './background-animation';

describe('BackgroundAnimation', () => {
  it('renders the component', () => {
    const { container } = renderWithProvider(<BackgroundAnimation />);
    expect(container.firstChild.nodeName).toBe('DIV');
    expect(container.firstChild.firstChild.nodeName).toBe('svg');
  });
});
