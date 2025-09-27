import React from 'react';
import { CaipChainId } from '@metamask/utils';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import { AccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree.types';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../../selectors/selectors.types';
import {
  MultichainSiteCellTooltip,
  MultichainSiteCellTooltipProps,
} from './multichain-site-cell-tooltip';

describe('MultichainSiteCellTooltip', () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  const mockAccountGroups = [
    {
      id: 'keyring:HD Key Tree/0',
      metadata: {
        name: 'Account 4',
        pinned: false,
        hidden: false,
      },
      accounts: [
        createMockInternalAccount({
          address: '0x8F03351D53585a2616a7F3262Cc5439a5D1EA1Cd',
          name: 'Account 4',
        }),
      ],
    },
    {
      id: 'keyring:HD Key Tree/1',
      metadata: {
        name: 'Account 5',
        pinned: false,
        hidden: false,
      },
      accounts: [
        createMockInternalAccount({
          address: '0x28F6a7A59d37d1DE987616991fC35Ca9A72E0406',
          name: 'Account 5',
        }),
      ],
    },
    {
      id: 'keyring:HD Key Tree/2',
      metadata: {
        name: 'Account 6',
        pinned: false,
        hidden: false,
      },
      accounts: [
        createMockInternalAccount({
          address: '0x632A13185e4974D5EA81c838Bfc48EB4C666157D',
          name: 'Account 6',
        }),
      ],
    },
  ] as unknown as AccountGroupWithInternalAccounts[];

  const mockNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] = [
    {
      name: 'Ethereum Mainnet',
      chainId: '0x1',
      caipChainId: 'eip155:1' as CaipChainId,
      blockExplorerUrls: ['mock-mainnet-url'],
      defaultRpcEndpointIndex: 0,
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          networkClientId: 'mainnet',
          type: RpcEndpointType.Custom,
          url: 'mock-mainnet-url',
        },
      ],
    },
    {
      name: 'zkSync Era Mainnet',
      chainId: '0x144',
      caipChainId: 'eip155:324' as CaipChainId,
      blockExplorerUrls: ['mock-zksync-url'],
      defaultRpcEndpointIndex: 0,
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          networkClientId: 'zksync',
          type: RpcEndpointType.Custom,
          url: 'mock-zksync-url',
        },
      ],
    },
    {
      name: 'Binance Smart Chain',
      chainId: '0x38',
      caipChainId: 'eip155:56' as CaipChainId,
      blockExplorerUrls: ['mock-bsc-url'],
      defaultRpcEndpointIndex: 0,
      nativeCurrency: 'BNB',
      rpcEndpoints: [
        {
          networkClientId: 'bsc',
          type: RpcEndpointType.Custom,
          url: 'mock-bsc-url',
        },
      ],
    },
    {
      name: 'Polygon',
      chainId: '0x89',
      caipChainId: 'eip155:137' as CaipChainId,
      blockExplorerUrls: ['mock-polygon-url'],
      defaultRpcEndpointIndex: 0,
      nativeCurrency: 'MATIC',
      rpcEndpoints: [
        {
          networkClientId: 'polygon',
          type: RpcEndpointType.Custom,
          url: 'mock-polygon-url',
        },
      ],
    },
    {
      name: 'Linea Mainnet',
      chainId: '0xe708',
      caipChainId: 'eip155:59144' as CaipChainId,
      blockExplorerUrls: ['mock-linea-url'],
      defaultRpcEndpointIndex: 0,
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          networkClientId: 'linea',
          type: RpcEndpointType.Custom,
          url: 'mock-linea-url',
        },
      ],
    },
  ];

  const defaultProps: MultichainSiteCellTooltipProps = {
    accountGroups: mockAccountGroups,
    networks: mockNetworks,
  };

  it('renders account and network avatar groups when both are provided', () => {
    const { getAllByTestId } = renderWithProvider(
      <MultichainSiteCellTooltip {...defaultProps} />,
      store,
    );

    const avatarGroups = getAllByTestId('avatar-group');
    expect(avatarGroups).toHaveLength(2); // 1 for accounts, 1 for networks
  });

  it('renders account avatar groups when account groups are provided', () => {
    const { container } = renderWithProvider(
      <MultichainSiteCellTooltip {...defaultProps} />,
      store,
    );

    const accountAvatars = container.querySelectorAll(
      '[data-testid^="avatar-account-"]',
    );
    expect(accountAvatars.length).toBeGreaterThan(0);
  });

  it('renders network avatar groups when networks are provided', () => {
    const { container } = renderWithProvider(
      <MultichainSiteCellTooltip {...defaultProps} />,
      store,
    );

    const avatarGroups = container.getElementsByClassName(
      'multichain-avatar-group',
    );
    expect(avatarGroups.length).toBeGreaterThan(0);
  });

  it('displays account avatar groups correctly', () => {
    const { getAllByTestId } = renderWithProvider(
      <MultichainSiteCellTooltip {...defaultProps} />,
      store,
    );

    const avatarGroups = getAllByTestId('avatar-group');
    expect(avatarGroups).toHaveLength(2); // 1 for accounts, 1 for networks
  });

  it('displays network avatar groups correctly', () => {
    const { getAllByTestId } = renderWithProvider(
      <MultichainSiteCellTooltip {...defaultProps} />,
      store,
    );

    const avatarGroups = getAllByTestId('avatar-group');
    expect(avatarGroups).toHaveLength(2); // 1 for accounts, 1 for networks
  });

  it('shows overflow indicator for many accounts in avatar group', () => {
    const manyAccountGroups = Array.from({ length: 10 }, (_, index) => ({
      id: `keyring:HD Key Tree/${index}`,
      metadata: {
        name: `Account ${index + 1}`,
        pinned: false,
        hidden: false,
      },
      accounts: [
        createMockInternalAccount({
          address: `0x${(index + 1).toString(16)}`,
          name: `Account ${index + 1}`,
        }),
      ],
    })) as unknown as AccountGroupWithInternalAccounts[];

    const { getByTestId, container } = renderWithProvider(
      <MultichainSiteCellTooltip
        accountGroups={manyAccountGroups}
        networks={[]}
      />,
      store,
    );

    const avatarGroup = getByTestId('avatar-group');
    expect(avatarGroup).toBeInTheDocument();

    // Accounts avatar group caps visible members at 4
    const visibleAccountAvatars = container.querySelectorAll(
      '[data-testid^="avatar-account-"]',
    );
    expect(visibleAccountAvatars.length).toBe(4);
  });

  it('shows overflow indicator for many networks in avatar group', () => {
    const manyNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] =
      Array.from({ length: 10 }, (_, index) => ({
        name: `Network ${index + 1}`,
        chainId: `0x${index + 1}`,
        caipChainId: `eip155:${index + 1}` as CaipChainId,
        blockExplorerUrls: [`https://explorer${index + 1}.com`],
        defaultRpcEndpointIndex: 0,
        nativeCurrency: `TOKEN${index + 1}`,
        rpcEndpoints: [
          {
            networkClientId: `network-${index + 1}`,
            type: RpcEndpointType.Custom,
            url: `https://rpc${index + 1}.com`,
          },
        ],
      }));

    const { getByTestId, container } = renderWithProvider(
      <MultichainSiteCellTooltip accountGroups={[]} networks={manyNetworks} />,
      store,
    );

    const avatarGroup = getByTestId('avatar-group');
    expect(avatarGroup).toBeInTheDocument();

    // Should show overflow indicator (+6) since we have 10 networks but avatar limit is 4
    const overflowIndicator = container.querySelector('.mm-text--body-sm');
    expect(overflowIndicator).toHaveTextContent('+6');
  });

  it('shows avatar group overflow indicator for many accounts', () => {
    const manyAccountGroups = Array.from({ length: 6 }, (_, index) => ({
      id: `keyring:HD Key Tree/${index}`,
      metadata: {
        name: `Account ${index + 1}`,
        pinned: false,
        hidden: false,
      },
      accounts: [
        createMockInternalAccount({
          address: `0x${(index + 1).toString(16)}`,
          name: `Account ${index + 1}`,
        }),
      ],
    })) as unknown as AccountGroupWithInternalAccounts[];

    const { getByTestId, container } = renderWithProvider(
      <MultichainSiteCellTooltip
        accountGroups={manyAccountGroups}
        networks={[]}
      />,
      store,
    );

    const avatarGroup = getByTestId('avatar-group');
    expect(avatarGroup).toBeInTheDocument();

    // Accounts avatar group caps visible members at 4
    const visibleAccountAvatars = container.querySelectorAll(
      '[data-testid^="avatar-account-"]',
    );
    expect(visibleAccountAvatars.length).toBe(4);
  });

  it('renders only account avatar group when no networks provided', () => {
    const { getAllByTestId } = renderWithProvider(
      <MultichainSiteCellTooltip
        accountGroups={mockAccountGroups}
        networks={[]}
      />,
      store,
    );

    const avatarGroups = getAllByTestId('avatar-group');
    expect(avatarGroups).toHaveLength(1); // Only accounts
  });

  it('renders only network avatar group when no accounts provided', () => {
    const { getAllByTestId } = renderWithProvider(
      <MultichainSiteCellTooltip accountGroups={[]} networks={mockNetworks} />,
      store,
    );

    const avatarGroups = getAllByTestId('avatar-group');
    expect(avatarGroups).toHaveLength(1); // Only networks
  });

  it('renders no avatar groups when both arrays are empty', () => {
    const { queryAllByTestId } = renderWithProvider(
      <MultichainSiteCellTooltip accountGroups={[]} networks={[]} />,
      store,
    );

    const avatarGroups = queryAllByTestId('avatar-group');
    expect(avatarGroups).toHaveLength(0);
  });

  it('renders account avatars with correct addresses', () => {
    const { container } = renderWithProvider(
      <MultichainSiteCellTooltip
        accountGroups={mockAccountGroups}
        networks={[]}
      />,
      store,
    );

    const accountAvatars = container.querySelectorAll(
      '[data-testid^="avatar-account-"]',
    );
    expect(accountAvatars.length).toBe(3);
  });

  it('renders network avatars with correct images', () => {
    const { container } = renderWithProvider(
      <MultichainSiteCellTooltip accountGroups={[]} networks={mockNetworks} />,
      store,
    );

    const networkImages = container.querySelectorAll(
      '.mm-avatar-token__token-image',
    );
    expect(networkImages.length).toBeGreaterThan(0);
  });
});
