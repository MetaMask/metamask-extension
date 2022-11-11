import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
  fireEvent,
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

jest.mock('../searchable-item-list', () => jest.fn(() => null));

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

  it('renders the component, opens the list and closes it', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { getByTestId } = renderWithProvider(
      <DropdownSearchList {...props} />,
      store,
    );
    const dropdownSearchList = getByTestId('dropdown-search-list');
    expect(dropdownSearchList).toBeInTheDocument();
    fireEvent.click(dropdownSearchList);
    const closeButton = getByTestId('dropdown-search-list__close-area');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    expect(closeButton).not.toBeInTheDocument();
  });
});
