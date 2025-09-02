import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { PermissionsCell } from './permissions-cell';

describe('PermissionsCell', () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  const mockNetworks = [
    {
      chainId: '0x1' as const,
      caipChainId: 'eip155:1' as const,
      name: 'Ethereum Mainnet',
      isEvm: true,
      nativeCurrency: 'ETH',
      rpcEndpoints: [],
      blockExplorerUrls: ['https://etherscan.io'],
      defaultRpcEndpointIndex: 0,
      defaultBlockExplorerUrlIndex: 0,
    },
    {
      chainId: '0x89' as const,
      caipChainId: 'eip155:137' as const,
      name: 'Polygon',
      isEvm: true,
      nativeCurrency: 'MATIC',
      rpcEndpoints: [],
      blockExplorerUrls: ['https://polygonscan.com'],
      defaultRpcEndpointIndex: 0,
      defaultBlockExplorerUrlIndex: 0,
    },
  ];

  const defaultProps = {
    nonTestNetworks: mockNetworks,
    testNetworks: [],
    totalCount: 8,
    chainIds: ['0x1', '0x89'],
  };

  it('renders correctly with token transfer permissions', () => {
    const { container } = renderWithProvider(
      <PermissionsCell {...defaultProps} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('handles token transfer permissions correctly', () => {
    const { getByText } = renderWithProvider(
      <PermissionsCell {...defaultProps} />,
      store,
    );

    expect(getByText('Token Transfer')).toBeInTheDocument();
    expect(getByText('8 Permissions')).toBeInTheDocument();
  });

  it('routes correctly on click', () => {
    const { getAllByTestId } = renderWithProvider(
      <PermissionsCell {...defaultProps} />,
      store,
    );

    const items = getAllByTestId('permissions-cell-connection-list-item');
    expect(items).toHaveLength(1);

    // Test token transfer routing
    fireEvent.click(items[0]);
  });

  it('does not render when no data', () => {
    const props = {
      ...defaultProps,
      totalCount: 0,
    };

    const { container } = renderWithProvider(
      <PermissionsCell {...props} />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders with single permission', () => {
    const props = {
      ...defaultProps,
      totalCount: 1,
    };

    const { getByText } = renderWithProvider(
      <PermissionsCell {...props} />,
      store,
    );

    expect(getByText('Token Transfer')).toBeInTheDocument();
    expect(getByText('1 Permission')).toBeInTheDocument();
  });
});
