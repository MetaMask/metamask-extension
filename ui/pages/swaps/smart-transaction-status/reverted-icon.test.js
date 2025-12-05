import React from 'react';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import RevertedIcon from './reverted-icon';

describe('RevertedIcon', () => {
  it('renders the RevertedIcon component', () => {
    const { container } = renderWithProvider(<RevertedIcon />);
    expect(container).toMatchSnapshot();
  });
});
