import React from 'react';
import { fireEvent } from '@testing-library/react';
import { CaipChainId } from '@metamask/utils';
import { BoxSpacing, IconName } from '@metamask/design-system-react';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { PermissionsCellConnectionListItem } from './permissions-cell-connection-list-item';

describe('PermissionsCellConnectionListItem', () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  const mockNetworks = [
    {
      chainId: '0x1',
      name: 'Ethereum Mainnet',
      caipChainId: 'eip155:1' as CaipChainId,
    },
    {
      chainId: '0x89',
      name: 'Polygon',
      caipChainId: 'eip155:137' as CaipChainId,
    },
  ];

  const defaultProps = {
    title: 'Token Streams',
    iconName: IconName.Coin,
    count: 5,
    networks: mockNetworks,
    countMessage: 'streams',
    paddingTopValue: 0 as BoxSpacing,
    paddingBottomValue: 2 as BoxSpacing,
    onClick: jest.fn(),
  };

  it('renders correctly with required props', () => {
    const { container, getByTestId } = renderWithProvider(
      <PermissionsCellConnectionListItem {...defaultProps} />,
      store,
    );

    expect(container).toMatchSnapshot();
    const item = getByTestId('permissions-cell-connection-list-item');
    expect(item).toBeDefined();
  });

  it('displays title and count correctly', () => {
    const { getByText } = renderWithProvider(
      <PermissionsCellConnectionListItem {...defaultProps} />,
      store,
    );

    expect(getByText('Token Streams')).toBeInTheDocument();
    expect(getByText('5 streams')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    const props = { ...defaultProps, onClick: mockOnClick };

    const { getByTestId } = renderWithProvider(
      <PermissionsCellConnectionListItem {...props} />,
      store,
    );

    const listItem = getByTestId('permissions-cell-connection-list-item');
    fireEvent.click(listItem);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders with different countMessage', () => {
    const props = { ...defaultProps, countMessage: 'subscriptions' };

    const { getByText } = renderWithProvider(
      <PermissionsCellConnectionListItem {...props} />,
      store,
    );

    expect(getByText('5 subscriptions')).toBeInTheDocument();
  });
});
