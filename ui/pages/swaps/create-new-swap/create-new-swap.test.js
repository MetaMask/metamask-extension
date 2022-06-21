import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
import CreateNewSwap from '.';

const createProps = (customProps = {}) => {
  return {
    sensitiveProperties: {},
    ...customProps,
  };
};

describe('CreateNewSwap', () => {
  it('renders the component with initial props', () => {
    const props = createProps();
    const { getByText } = renderWithProvider(<CreateNewSwap {...props} />);
    expect(getByText('Create a new swapp')).toBeInTheDocument();
  });
});
