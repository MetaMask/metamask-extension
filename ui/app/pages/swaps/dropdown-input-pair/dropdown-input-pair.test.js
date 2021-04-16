import React from 'react';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import DropdownInputPair from './index';

describe('DropdownInputPair', () => {
  const createProps = (customProps = {}) => {
    return {
      ...customProps,
    };
  };

  test('renders the component with initial props', () => {
    const props = createProps();
    const { container, getByPlaceholderText } = renderWithProvider(
      <DropdownInputPair {...props} />,
    );
    expect(container).toMatchSnapshot();
    expect(getByPlaceholderText('0')).toBeInTheDocument();
  });
});
