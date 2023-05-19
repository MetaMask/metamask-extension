import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import ListWithSearch from './list-with-search';

const createProps = (customProps = {}) => {
  return {
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
    onClickItem: jest.fn(),
    onOpenImportTokenModalClick: jest.fn(),
    setSearchQuery: jest.fn(),
    Placeholder: <></>,
    listTitle: 'listTitle',
    ...customProps,
  };
};

describe('ListWithSearch', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <ListWithSearch {...props} />,
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
      getByPlaceholderText('Enter token name or paste address'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('.list-with-search__text-search'),
    ).toMatchSnapshot();
  });

  it('renders the component with an empty list', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    props.itemsToSearch = [];
    const { getByText } = renderWithProvider(
      <ListWithSearch {...props} />,
      store,
    );
    expect(getByText('No tokens available matching')).toBeInTheDocument();
  });
});
