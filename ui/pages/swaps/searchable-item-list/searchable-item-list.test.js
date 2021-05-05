import React from 'react';

import { renderWithProvider } from '../../../../test/jest';
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
    const props = createProps();
    const { getByText } = renderWithProvider(<SearchableItemList {...props} />);
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
      document.querySelector('.searchable-item-list__search'),
    ).toMatchSnapshot();
    expect(
      document.querySelector('.searchable-item-list__item'),
    ).toMatchSnapshot();
  });
});
