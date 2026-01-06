import React from 'react';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import ArrowIcon from './arrow-icon';

describe('ArrowIcon', () => {
  it('renders the ArrowIcon component', () => {
    const { container } = renderWithProvider(<ArrowIcon />);
    expect(container).toMatchSnapshot();
  });
});
