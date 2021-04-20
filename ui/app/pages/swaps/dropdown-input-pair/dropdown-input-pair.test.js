import React from 'react';

import { renderWithProvider } from '../../../../../test/jest';
import DropdownInputPair from '.';

const createProps = (customProps = {}) => {
  return {
    ...customProps,
  };
};

describe('DropdownInputPair', () => {
  it('renders the component with initial props', () => {
    const props = createProps();
    const { container, getByPlaceholderText } = renderWithProvider(
      <DropdownInputPair {...props} />,
    );
    expect(container).toMatchSnapshot();
    expect(getByPlaceholderText('0')).toBeInTheDocument();
  });
});
