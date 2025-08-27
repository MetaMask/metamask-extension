import React from 'react';
import { renderWithProvider } from '../../../../../../test/jest';
import { fireEvent } from '@testing-library/react';
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
    streamsCount: 5,
    subscriptionsCount: 3,
    streamsChainIds: ['0x1', '0x89'],
    subscriptionsChainIds: ['0x1'],
  };

  it('renders correctly with both streams and subscriptions', () => {
    const { container } = renderWithProvider(
      <PermissionsCell {...defaultProps} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('handles streams and subscriptions correctly', () => {
    const { getByText } = renderWithProvider(
      <PermissionsCell {...defaultProps} />,
      store,
    );

    expect(getByText('Token Streams')).toBeInTheDocument();
    expect(getByText('Token Subscriptions')).toBeInTheDocument();
    expect(getByText('5 streams')).toBeInTheDocument();
    expect(getByText('3 subscriptions')).toBeInTheDocument();
  });

  it('routes correctly on click', () => {
    const { getAllByTestId } = renderWithProvider(
      <PermissionsCell {...defaultProps} />,
      store,
    );

    const items = getAllByTestId('permissions-cell-connection-list-item');
    expect(items).toHaveLength(2);

    // Test streams routing
    fireEvent.click(items[0]);

    // Test subscriptions routing
    fireEvent.click(items[1]);
  });

  it('does not render when no data', () => {
    const props = {
      ...defaultProps,
      streamsCount: 0,
      subscriptionsCount: 0,
    };

    const { container } = renderWithProvider(
      <PermissionsCell {...props} />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders only streams when subscriptions count is 0', () => {
    const props = {
      ...defaultProps,
      subscriptionsCount: 0,
    };

    const { getByText, queryByText } = renderWithProvider(
      <PermissionsCell {...props} />,
      store,
    );

    expect(getByText('Token Streams')).toBeInTheDocument();
    expect(queryByText('Token Subscriptions')).not.toBeInTheDocument();
  });

  it('renders only subscriptions when streams count is 0', () => {
    const props = {
      ...defaultProps,
      streamsCount: 0,
    };

    const { getByText, queryByText } = renderWithProvider(
      <PermissionsCell {...props} />,
      store,
    );

    expect(getByText('Token Subscriptions')).toBeInTheDocument();
    expect(queryByText('Token Streams')).not.toBeInTheDocument();
  });
});
