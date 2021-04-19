import React from 'react';

import { renderWithProvider } from '../../../../../test/jest';
import DropdownInputPair from '.';

describe('DropdownInputPair', () => {
  const createProps = (customProps = {}) => {
    return {
      ...customProps,
    };
  };

  it('renders the component with initial props', () => {
    const props = createProps();
    const { container, getByPlaceholderText } = renderWithProvider(
      <DropdownInputPair {...props} />,
    );
    expect(container).toMatchSnapshot();
    expect(getByPlaceholderText('0')).toBeInTheDocument();
  });
});
