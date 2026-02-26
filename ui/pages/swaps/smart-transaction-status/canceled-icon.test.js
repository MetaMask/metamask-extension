import React from 'react';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import CanceledIcon from './canceled-icon';

describe('CanceledIcon', () => {
  it('renders the CanceledIcon component', () => {
    const { container } = renderWithProvider(<CanceledIcon />);
    expect(container).toMatchSnapshot();
  });
});
