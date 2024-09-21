import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
  fireEvent,
} from '../../../../../test/jest';
import ItemList from '.';

const createProps = (customProps = {}) => {
  return {
    defaultToAll: true,
    listTitle: 'listTitle',
    onClickItem: jest.fn(),
    results: [
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

describe('ItemList', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { getByText } = renderWithProvider(<ItemList {...props} />, store);
    expect(getByText(props.listTitle)).toBeInTheDocument();
    expect(
      document.querySelector('.searchable-item-list__item'),
    ).toMatchSnapshot();
  });

  it('clicks on a list item', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { getByText, getByTestId } = renderWithProvider(
      <ItemList {...props} />,
      store,
    );
    expect(getByText(props.listTitle)).toBeInTheDocument();
    fireEvent.click(getByTestId('searchable-item-list__item'));
    expect(props.onClickItem).toHaveBeenCalledWith(props.results[0]);
  });

  it('presses the "Enter" key on a list item', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
    const { getByText, getByTestId } = renderWithProvider(
      <ItemList {...props} />,
      store,
    );
    expect(getByText(props.listTitle)).toBeInTheDocument();
    fireEvent.keyUp(getByTestId('searchable-item-list__item'), {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
    });
    expect(props.onClickItem).toHaveBeenCalledWith(props.results[0]);
  });
});
