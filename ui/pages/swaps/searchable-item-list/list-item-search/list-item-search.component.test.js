import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  createSwapsMockStore,
  fireEvent,
} from '../../../../../test/jest';
import ListItemSearch from './list-item-search.component';

const token = {
  erc20: true,
  symbol: 'BAT',
  decimals: 18,
  address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
};

jest.mock('../../swaps.util', () => {
  const original = jest.requireActual('../../swaps.util');
  return {
    ...original,
    fetchToken: jest.fn(() => {
      return token;
    }),
  };
});

const createProps = (customProps = {}) => {
  return {
    onSearch: jest.fn(),
    setSearchQuery: jest.fn(),
    listToSearch: [
      {
        iconUrl: 'iconUrl',
        selected: true,
        primaryLabel: 'primaryLabel',
        secondaryLabel: 'secondaryLabel',
        rightPrimaryLabel: 'rightPrimaryLabel',
        rightSecondaryLabel: 'rightSecondaryLabel',
      },
    ],
    fuseSearchKeys: [
      {
        name: 'name',
        weight: 0.499,
      },
      {
        name: 'symbol',
        weight: 0.499,
      },
      {
        name: 'address',
        weight: 0.002,
      },
    ],
    searchPlaceholderText: 'Search token',
    defaultToAll: true,
    ...customProps,
  };
};

const middleware = [thunk];

describe('ListItemSearch', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { getByTestId } = renderWithProvider(
      <ListItemSearch {...props} />,
      store,
    );
    expect(getByTestId('search-list-items')).toBeInTheDocument();
  });

  it('changes the search query', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByTestId } = renderWithProvider(
      <ListItemSearch {...props} />,
      store,
    );
    const input = getByTestId('search-list-items');
    fireEvent.change(input, { target: { value: 'USD' } });
    expect(props.setSearchQuery).toHaveBeenCalledWith('USD');
    expect(props.onSearch).toHaveBeenCalledWith({
      searchQuery: 'USD',
      results: [],
    });
  });

  it('imports a token', async () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps({ shouldSearchForImports: true });
    const { getByTestId } = renderWithProvider(
      <ListItemSearch {...props} />,
      store,
    );
    const input = getByTestId('search-list-items');
    await fireEvent.change(input, { target: { value: token.address } });
    expect(props.setSearchQuery).toHaveBeenCalledWith(token.address);
    expect(props.onSearch).toHaveBeenCalledWith({
      searchQuery: token.address,
      results: [token],
    });
  });
});
