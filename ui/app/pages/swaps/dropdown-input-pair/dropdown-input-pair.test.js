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
    const { getByPlaceholderText } = renderWithProvider(
      <DropdownInputPair {...props} />,
    );
    expect(getByPlaceholderText('0')).toBeInTheDocument();
    expect(
      document.querySelector('.dropdown-input-pair__input'),
    ).toMatchSnapshot();
  });
});
