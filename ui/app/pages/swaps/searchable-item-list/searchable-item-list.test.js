import React from 'react';

import { renderWithProvider } from '../../../../../test/jest';
import SearchableItemList from '.';

describe('SearchableItemList', () => {
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
      ...customProps,
    };
  };

  it('renders the component with initial props', () => {
    const props = createProps();
    const { container, getByText } = renderWithProvider(
      <SearchableItemList {...props} />,
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
    expect(container).toMatchSnapshot();
  });
});
