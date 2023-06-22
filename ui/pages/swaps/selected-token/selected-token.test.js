import React from 'react';

import { renderWithProvider, fireEvent } from '../../../../test/jest';
import SelectedToken from './selected-token';

const createProps = (customProps = {}) => {
  return {
    onClick: jest.fn(),
    selectedToken: {
      iconUrl: 'iconUrl',
      symbol: 'ETH',
    },
    ...customProps,
  };
};

describe('SelectedToken', () => {
  it('renders the component with initial props', () => {
    const props = createProps();
    const { container, getByText } = renderWithProvider(
      <SelectedToken {...props} />,
    );
    expect(container).toMatchSnapshot();
    expect(getByText('ETH')).toBeInTheDocument();
  });

  it('renders the component with no token selected', () => {
    const props = createProps();
    props.selectedToken.symbol = undefined;
    const { container, getByText } = renderWithProvider(
      <SelectedToken {...props} />,
    );
    expect(container).toMatchSnapshot();
    expect(getByText('Select token')).toBeInTheDocument();
  });

  it('renders the component and opens the list', () => {
    const props = createProps();
    const { getByTestId } = renderWithProvider(<SelectedToken {...props} />);
    const dropdownSearchList = getByTestId('dropdown-search-list');
    expect(dropdownSearchList).toBeInTheDocument();
    fireEvent.click(dropdownSearchList);
    expect(props.onClick).toHaveBeenCalledTimes(1);
  });
});
