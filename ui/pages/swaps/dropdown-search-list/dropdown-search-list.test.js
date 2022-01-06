import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import DropdownSearchList from '.';

const createProps = (customProps = {}) => {
  return {
    startingItem: {
      iconUrl: 'iconUrl',
      symbol: 'symbol',
    },
    ...customProps,
  };
};

describe('DropdownSearchList', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { container, getByText } = renderWithProvider(
      <DropdownSearchList {...props} />,
      store,
    );
    expect(container).toMatchSnapshot();
    expect(getByText('symbol')).toBeInTheDocument();
  });
});
