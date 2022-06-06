import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import RevertedIcon from './reverted-icon';

describe('RevertedIcon', () => {
  it('renders the RevertedIcon component', () => {
    const { container } = renderWithProvider(<RevertedIcon />);
    expect(container).toMatchSnapshot();
  });
});
