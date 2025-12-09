import React from 'react';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import UnknownIcon from './unknown-icon';

describe('UnknownIcon', () => {
  it('renders the UnknownIcon component', () => {
    const { container } = renderWithProvider(<UnknownIcon />);
    expect(container).toMatchSnapshot();
  });
});
