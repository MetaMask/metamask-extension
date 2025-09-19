import React from 'react';
import { CaipChainId } from '@metamask/utils';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import { AccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree.types';
import { EvmAndMultichainNetworkConfigurationsWithCaipChainId } from '../../../../selectors/selectors.types';
import { getIconSeedAddressesByAccountGroups } from '../../../../selectors/multichain-accounts/account-tree';
import {
  BNB_DISPLAY_NAME,
  LINEA_MAINNET_DISPLAY_NAME,
  MAINNET_DISPLAY_NAME,
  POLYGON_DISPLAY_NAME,
  ZK_SYNC_ERA_DISPLAY_NAME,
} from '../../../../../shared/constants/network';
import {
  MultichainSiteCellTooltip,
  MultichainSiteCellTooltipProps,
} from './multichain-site-cell-tooltip';

jest.mock('../../../../selectors/multichain-accounts/account-tree', () => ({
  ...jest.requireActual(
    '../../../../selectors/multichain-accounts/account-tree',
  ),
  getIconSeedAddressesByAccountGroups: jest.fn(),
}));

const mockGetIconSeedAddressesByAccountGroups =
  getIconSeedAddressesByAccountGroups as jest.MockedFunction<
    typeof getIconSeedAddressesByAccountGroups
  >;

describe('MultichainSiteCellTooltip', () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  beforeEach(() => {
    mockGetIconSeedAddressesByAccountGroups.mockImplementation(
      (_, accountGroups) => {
        const seedAddresses: Record<string, string> = {};
        accountGroups.forEach((group, index) => {
          const addresses = [
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
            '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
            '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
            '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
            '0xb552685e3d2790efd64a175b00d51f02cdafee5d',
          ];
          seedAddresses[group.id] = addresses[index % addresses.length];
        });
        return seedAddresses;
      },
    );
  });

  const mockAccountGroups = [
    {
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
      metadata: {
        name: 'Account 1',
        pinned: false,
        hidden: false,
      },
      accounts: [
        createMockInternalAccount({
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          name: 'Test Account',
        }),
        createMockInternalAccount({
          address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
          name: 'Test Account 2',
        }),
      ],
    },
    {
      id: 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0',
      metadata: {
        name: 'Account 2',
        pinned: false,
        hidden: false,
      },
      accounts: [
        createMockInternalAccount({
          address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          name: 'Test Account 1',
        }),
      ],
    },
    {
      id: 'snap:local:custody:test/0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
      metadata: {
        name: 'Snap Account 1',
        pinned: false,
        hidden: false,
      },
      accounts: [
        createMockInternalAccount({
          address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
          name: 'Another Snap Account 1',
        }),
      ],
    },
  ] as unknown as AccountGroupWithInternalAccounts[];

  const mockNetworks: EvmAndMultichainNetworkConfigurationsWithCaipChainId[] = [
    {
      name: MAINNET_DISPLAY_NAME,
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
      name: ZK_SYNC_ERA_DISPLAY_NAME,
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
      name: BNB_DISPLAY_NAME,
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
      name: POLYGON_DISPLAY_NAME,
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
      name: LINEA_MAINNET_DISPLAY_NAME,
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
      '[data-testid^="avatar-"]:not([data-testid="avatar-group"])',
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
    // Create 8 account groups to test overflow (limit is 4)
    const manyAccountGroups = Array.from({ length: 8 }, (_, index) => ({
      id: `test-group-${index}`,
      metadata: {
        name: `Account ${index + 1}`,
        pinned: false,
        hidden: false,
      },
      accounts: [
        createMockInternalAccount({
          address: `0x${index.toString(16).padStart(40, '0')}`,
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

    // Should show exactly 4 avatars (the limit)
    const visibleAccountAvatars = container.querySelectorAll(
      '[data-testid^="avatar-"]:not([data-testid="avatar-group"])',
    );
    expect(visibleAccountAvatars.length).toBe(4);

    // Should show overflow indicator (+4) since we have 8 groups but limit is 4
    const overflowIndicator = container.querySelector('.mm-text--body-sm');
    expect(overflowIndicator).toHaveTextContent('+4');
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
    // Create 6 account groups to test overflow (limit is 4)
    const manyAccountGroups = Array.from({ length: 6 }, (_, index) => ({
      id: `test-group-overflow-${index}`,
      metadata: {
        name: `Account ${index + 1}`,
        pinned: false,
        hidden: false,
      },
      accounts: [
        createMockInternalAccount({
          address: `0x${(index + 10).toString(16).padStart(40, '0')}`,
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

    // Should show exactly 4 avatars (the limit)
    const visibleAccountAvatars = container.querySelectorAll(
      '[data-testid^="avatar-"]:not([data-testid="avatar-group"])',
    );
    expect(visibleAccountAvatars.length).toBe(4);

    // Should show overflow indicator (+2) since we have 6 groups but limit is 4
    const overflowIndicator = container.querySelector('.mm-text--body-sm');
    expect(overflowIndicator).toHaveTextContent('+2');
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
      '[data-testid^="avatar-"]:not([data-testid="avatar-group"])',
    );
    expect(accountAvatars.length).toBe(3);
  });

  it('renders network avatars with correct images', () => {
    const { container } = renderWithProvider(
      <MultichainSiteCellTooltip accountGroups={[]} networks={mockNetworks} />,
      store,
    );

    const networkImages = container.querySelectorAll(
      '[data-testid^="network-avatar-"]',
    );
    expect(networkImages.length).toBeGreaterThan(0);
  });
});
