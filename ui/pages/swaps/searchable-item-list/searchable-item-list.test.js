import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import SearchableItemList from '.';

const createProps = (customProps = {}) => {
  return {
    defaultToAll: true,
    listTitle: 'listTitle',
    itemsToSearch: [
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
    ...customProps,
  };
};

describe('SearchableItemList', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { getByText } = renderWithProvider(
      <SearchableItemList {...props} />,
      store,
    );
    expect(getByText(props.listTitle)).toBeInTheDocument();
    expect(getByText(props.itemsToSearch[0].primaryLabel)).toBeInTheDocument();
    expect(
      getByText(props.itemsToSearch[0].secondaryLabel),
    ).toBeInTheDocument();
    expect(
      getByText(props.itemsToSearch[0].rightPrimaryLabel),
    ).toBeInTheDocument();
    expect(
      getByText(props.itemsToSearch[0].rightSecondaryLabel),
    ).toBeInTheDocument();
    expect(
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      document.querySelector('.searchable-item-list__search'),
    ).toMatchSnapshot();
    expect(
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      document.querySelector('.searchable-item-list__item'),
    ).toMatchSnapshot();
  });
});
