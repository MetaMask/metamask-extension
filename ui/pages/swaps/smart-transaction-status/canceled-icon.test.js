import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import CanceledIcon from './canceled-icon';

describe('CanceledIcon', () => {
  it('renders the CanceledIcon component', () => {
    const { container } = renderWithProvider(<CanceledIcon />);
    expect(container).toMatchSnapshot();
  });
});
