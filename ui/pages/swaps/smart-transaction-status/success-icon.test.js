import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import SuccessIcon from './success-icon';

describe('SuccessIcon', () => {
  it('renders the SuccessIcon component', () => {
    const { container } = renderWithProvider(<SuccessIcon />);
    expect(container).toMatchSnapshot();
  });
});
