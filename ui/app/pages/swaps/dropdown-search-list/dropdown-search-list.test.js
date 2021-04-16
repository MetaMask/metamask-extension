import React from 'react';

import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import DropdownSearchList from './index';

describe('DropdownSearchList', () => {
  const createProps = (customProps = {}) => {
    return {
      startingItem: {
        iconUrl: 'iconUrl',
        symbol: 'symbol',
      },
      ...customProps,
    };
  };

  test('renders the component with initial props', () => {
    const props = createProps();
    const { container, getByText } = renderWithProvider(
      <DropdownSearchList {...props} />,
    );
    expect(container).toMatchSnapshot();
    expect(getByText('symbol')).toBeInTheDocument();
  });
});
