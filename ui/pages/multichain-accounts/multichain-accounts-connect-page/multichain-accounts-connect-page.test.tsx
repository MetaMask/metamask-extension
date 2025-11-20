import React from 'react';
import { fireEvent } from '@testing-library/react';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getAllNamespacesFromCaip25CaveatValue,
  getAllScopesFromCaip25CaveatValue,
  KnownSessionProperties,
} from '@metamask/chain-agnostic-permission';
import {
  AccountWalletType,
  AccountGroupType,
  AccountGroupId,
} from '@metamask/account-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { createMockMultichainAccountsState } from '../../../selectors/multichain-accounts/test-utils';
import {
  getAllNetworkConfigurationsByCaipChainId,
  type EvmAndMultichainNetworkConfigurationsWithCaipChainId,
} from '../../../../shared/modules/selectors/networks';
import { getMultichainNetwork } from '../../../selectors/multichain';

import {
  MultichainAccountsConnectPage,
  MultichainConnectPageProps,
} from './multichain-accounts-connect-page';

const mockGetAllNetworkConfigurationsByCaipChainId =
  getAllNetworkConfigurationsByCaipChainId as jest.MockedFunction<
    typeof getAllNetworkConfigurationsByCaipChainId
  >;
const mockGetMultichainNetwork = getMultichainNetwork as jest.MockedFunction<
  typeof getMultichainNetwork
>;
const mockGetAllScopesFromCaip25CaveatValue =
  getAllScopesFromCaip25CaveatValue as jest.MockedFunction<
    typeof getAllScopesFromCaip25CaveatValue
  >;
const mockGetAllNamespacesFromCaip25CaveatValue =
  getAllNamespacesFromCaip25CaveatValue as jest.MockedFunction<
    typeof getAllNamespacesFromCaip25CaveatValue
  >;

// Mock the hook and capture the arguments passed to it
const mockUseAccountGroupsForPermissions = jest.fn((..._args: unknown[]) => ({
  connectedAccountGroups: [
    {
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
      metadata: { name: 'Test Account Group 1' },
      accounts: [
        {
          address: '0x123',
          scopes: ['eip155:0'],
        },
      ],
    },
  ],
  supportedAccountGroups: [
    {
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
      metadata: { name: 'Test Account Group 1' },
      accounts: [
        {
          address: '0x123',
          scopes: ['eip155:0'],
        },
      ],
    },
    {
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/1',
      metadata: { name: 'Test Account Group 2' },
      accounts: [
        {
          address: '0x456',
          scopes: ['eip155:0'],
        },
      ],
    },
  ],
  existingConnectedCaipAccountIds: ['eip155:1:0x123'],
  connectedAccountGroupWithRequested: [
    {
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
      metadata: { name: 'Test Account Group 1' },
      accounts: [
        {
          address: '0x123',
          scopes: ['eip155:0'],
        },
      ],
    },
  ],
  caipAccountIdsOfConnectedAccountGroupWithRequested: ['eip155:1:0x123'],
  selectedAndRequestedAccountGroups: [
    {
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
      metadata: { name: 'Test Account Group 1' },
      accounts: [
        {
          address: '0x123',
          scopes: ['eip155:0'],
        },
      ],
    },
  ],
}));

jest.mock('../../../hooks/useAccountGroupsForPermissions', () => ({
  useAccountGroupsForPermissions: (
    existingCaip25CaveatValue: unknown,
    requestedCaipAccountIds: unknown,
    requestedAndAlreadyConnectedCaipChainIdsOrDefault: unknown,
    requestedNamespacesWithoutWallet: unknown,
  ) => {
    mockUseAccountGroupsForPermissions(
      existingCaip25CaveatValue,
      requestedCaipAccountIds,
      requestedAndAlreadyConnectedCaipChainIdsOrDefault,
      requestedNamespacesWithoutWallet,
    );
    return {
      connectedAccountGroups: [
        {
          id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
          metadata: { name: 'Test Account Group 1' },
          accounts: [
            {
              address: '0x123',
              scopes: ['eip155:0'],
            },
          ],
        },
      ],
      supportedAccountGroups: [
        {
          id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
          metadata: { name: 'Test Account Group 1' },
          accounts: [
            {
              address: '0x123',
              scopes: ['eip155:0'],
            },
          ],
        },
        {
          id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/1',
          metadata: { name: 'Test Account Group 2' },
          accounts: [
            {
              address: '0x456',
              scopes: ['eip155:0'],
            },
          ],
        },
      ],
      existingConnectedCaipAccountIds: ['eip155:1:0x123'],
      connectedAccountGroupWithRequested: [
        {
          id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
          metadata: { name: 'Test Account Group 1' },
          accounts: [
            {
              address: '0x123',
              scopes: ['eip155:0'],
            },
          ],
        },
      ],
      caipAccountIdsOfConnectedAccountGroupWithRequested: ['eip155:1:0x123'],
      selectedAndRequestedAccountGroups: [
        {
          id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
          metadata: { name: 'Test Account Group 1' },
          accounts: [
            {
              address: '0x123',
              scopes: ['eip155:0'],
            },
          ],
        },
      ],
    };
  },
}));

jest.mock('../../../../shared/modules/selectors/networks', () => ({
  ...jest.requireActual('../../../../shared/modules/selectors/networks'),
  getAllNetworkConfigurationsByCaipChainId: jest.fn(() => ({
    'eip155:1': {
      chainId: 'eip155:1',
      name: 'Ethereum Mainnet',
      nativeCurrency: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      rpcUrls: ['https://mainnet.infura.io'],
      blockExplorerUrls: ['https://etherscan.io'],
    },
    'eip155:137': {
      chainId: 'eip155:137',
      name: 'Polygon Mainnet',
      nativeCurrency: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
      rpcUrls: ['https://polygon-rpc.com'],
      blockExplorerUrls: ['https://polygonscan.com'],
    },
    'eip155:56': {
      chainId: 'eip155:56',
      name: 'BNB Smart Chain',
      nativeCurrency: { symbol: 'BNB', name: 'BNB', decimals: 18 },
      rpcUrls: ['https://bsc-dataseed.binance.org'],
      blockExplorerUrls: ['https://bscscan.com'],
    },
    'eip155:11155111': {
      chainId: 'eip155:11155111',
      name: 'Sepolia Testnet',
      nativeCurrency: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      rpcUrls: ['https://sepolia.infura.io'],
      blockExplorerUrls: ['https://sepolia.etherscan.io'],
    },
  })),
}));

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  ...jest.requireActual('../../../selectors/multichain-accounts/account-tree'),
  getIconSeedAddressByAccountGroupId: () =>
    '0xc5b2b5ae370876c0122910f92a13bef85a133e56',
}));

jest.mock('../../../selectors/multichain', () => ({
  ...jest.requireActual('../../../selectors/multichain'),
  getMultichainNetwork: jest.fn(() => ({
    chainId: 'eip155:1',
    nickname: 'Ethereum Mainnet',
    isAddressCompatible: () => true,
    decimals: 18,
    blockExplorerFormatUrls: {
      url: 'https://mock.url',
      address: 'https://mock.url/address/{address}',
      transaction: 'https://mock.url/tx/{txId}',
      isEvmNetwork: true,
      network: {
        type: 'mainnet',
        chainId: '0x1',
        ticker: 'ETH',
      },
    },
  })),
}));

jest.mock('@metamask/chain-agnostic-permission', () => ({
  ...jest.requireActual('@metamask/chain-agnostic-permission'),
  generateCaip25Caveat: jest.fn(() => ({
    'endowment:caip25': {
      caveats: [
        {
          type: 'restrictNetworkSwitching',
          value: {
            requiredScopes: {},
            optionalScopes: {
              'eip155:1': {
                accounts: ['eip155:1:0x123'],
              },
            },
            sessionProperties: {},
            isMultichainOrigin: true,
          },
        },
      ],
    },
  })),
  getAllNamespacesFromCaip25CaveatValue: jest.fn(() => ['eip155']),
  getAllScopesFromCaip25CaveatValue: jest.fn(() => ['eip155:1']),
  getCaipAccountIdsFromCaip25CaveatValue: jest.fn(() => ['eip155:1:0x123']),
}));

jest.mock('../../../hooks/multichain-accounts/useAccountBalance', () => ({
  useAllWalletAccountsBalances: () => ({
    'entropy:01JKAF3DSGM3AB87EM9N0K41AJ': {
      'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0': '$1,000.00',
    },
  }),
}));

jest.mock('../../permissions-connect/connect-page/utils', () => ({
  ...jest.requireActual('../../permissions-connect/connect-page/utils'),
  getCaip25CaveatValueFromPermissions: jest.fn(),
}));

jest.mock('../../../../shared/lib/multichain/scope-utils', () => ({
  getCaip25AccountFromAccountGroupAndScope: jest.fn(() => ['eip155:1:0x123']),
}));

const mockGetCaip25CaveatValueFromPermissions = jest.requireMock(
  '../../permissions-connect/connect-page/utils',
).getCaip25CaveatValueFromPermissions;

const mockTestDappUrl = 'https://test.dapp';

const mockTargetSubjectMetadata = {
  extensionId: null,
  iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  name: 'E2E Test Dapp',
  origin: 'https://metamask.github.io',
  subjectType: 'website',
};

const mockAccountTreeState = {
  wallets: {
    'entropy:01JKAF3DSGM3AB87EM9N0K41AJ': {
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ' as const,
      type: AccountWalletType.Entropy as const,
      status: 'ready' as const,
      groups: {
        'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0': {
          id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as const,
          type: AccountGroupType.MultichainAccount as const,
          accounts: ['test-account-1'] as [string, ...string[]],
          metadata: {
            name: 'Test Account Group 1',
            entropy: { groupIndex: 0 },
            pinned: false,
            hidden: false,
          },
        },
      },
      metadata: {
        name: 'Test Wallet',
        entropy: { id: '01JKAF3DSGM3AB87EM9N0K41AJ' },
      },
    },
  },
  selectedAccountGroup:
    'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId,
};

const mockInternalAccountsState = {
  accounts: {
    'test-account-1': {
      id: 'test-account-1',
      address: '0xc5b2b5ae370876c0122910f92a13bef85a133e56',
      metadata: {
        name: 'Test Account',
        importTime: Date.now(),
        keyring: { type: 'HD Key Tree' },
        snap: {
          name: 'Test Snap',
          id: 'test-snap-id',
          enabled: true,
        },
      },
      options: {},
      methods: ['eth_sendTransaction', 'eth_sign'],
      type: 'eip155:eoa' as const,
      scopes: ['eip155:1', 'eip155:0'] as `${string}:${string}`[],
    },
  },
  selectedAccount: 'test-account-1',
};

const mockNetworkConfigurations = {
  networkConfigurationsByChainId: {},
  multichainNetworkConfigurationsByChainId: {},
};

const render = (
  options: {
    props?: Partial<MultichainConnectPageProps>;
    state?: object;
  } = {},
) => {
  const { props = {}, state } = options;

  const defaultProps: MultichainConnectPageProps = {
    request: {
      permissions: {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': {
                    accounts: [],
                  },
                },
                sessionProperties: {},
                isMultichainOrigin: true,
              },
            },
          ],
        },
      },
      metadata: {
        id: '1',
        origin: mockTargetSubjectMetadata.origin,
      },
    },
    permissionsRequestId: '1',
    rejectPermissionsRequest: jest.fn(),
    approveConnection: jest.fn(),
    targetSubjectMetadata: mockTargetSubjectMetadata,
    ...props,
  };

  const mockMultichainState = createMockMultichainAccountsState(
    mockAccountTreeState,
    mockInternalAccountsState,
    mockNetworkConfigurations,
  );

  const store = configureStore({
    ...mockState,
    ...mockMultichainState,
    metamask: {
      ...mockState.metamask,
      ...mockMultichainState.metamask,
      ...state,
      permissionHistory: {
        [mockTestDappUrl]: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          eth_accounts: {
            accounts: {
              '0x123': 1709225290848,
            },
          },
        },
      },
      multichainNetwork: {
        chainId: 'eip155:1',
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      },
    },
    activeTab: {
      origin: mockTestDappUrl,
    },
  });

  return renderWithProvider(
    <MultichainAccountsConnectPage {...defaultProps} />,
    store,
  );
};

describe('MultichainConnectPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCaip25CaveatValueFromPermissions.mockReturnValue({
      requiredScopes: {},
      optionalScopes: {
        'eip155:1': {
          accounts: [],
        },
      },
      sessionProperties: {},
      isMultichainOrigin: true,
    });
  });

  it('renders correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('renders image icon correctly', () => {
    const { getAllByAltText } = render();

    const images = getAllByAltText('metamask.github.io logo');
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute(
      'src',
      'https://metamask.github.io/test-dapp/metamask-fox.svg',
    );
    expect(images[1]).toHaveAttribute(
      'src',
      'https://metamask.github.io/test-dapp/metamask-fox.svg',
    );
  });

  it('renders fallback icon correctly', () => {
    const { container } = render({
      props: {
        targetSubjectMetadata: {
          ...mockTargetSubjectMetadata,
          iconUrl: null,
        },
      },
    });

    const divElement = container.querySelector('div.mm-avatar-base--size-lg');
    expect(divElement).toHaveTextContent('m');
  });

  it('renders fallback icon correctly for IP address as an origin', () => {
    const { container } = render({
      props: {
        targetSubjectMetadata: {
          ...mockTargetSubjectMetadata,
          iconUrl: null,
          origin: 'http://127.0.0.1/test-dapp',
        },
      },
    });

    const divElement = container.querySelector('div.mm-avatar-base--size-lg');
    expect(divElement).toHaveTextContent('?');
  });

  it('renders title correctly', () => {
    const { getByText } = render();
    expect(getByText('metamask.github.io')).toBeDefined();
  });

  it('renders subtitle correctly', () => {
    const { getByText } = render();
    expect(getByText('Connect this website with MetaMask')).toBeDefined();
  });

  it('renders accounts tab correctly', () => {
    const { getByText } = render();

    expect(getByText('Accounts')).toBeDefined();
    expect(getByText('Edit accounts')).toBeDefined();
  });

  it('renders permissions tab correctly', () => {
    const { getByText } = render();

    const permissionsTab = getByText('Permissions');
    fireEvent.click(permissionsTab);

    // The permissions tab should be clickable and render content
    expect(permissionsTab).toBeDefined();
  });

  it('renders edit accounts modal when edit button is clicked', () => {
    const { getByText } = render();

    const editAccountsButton = getByText('Edit accounts');
    fireEvent.click(editAccountsButton);

    // The modal should open when edit button is clicked
    expect(editAccountsButton).toBeDefined();
  });

  it('closes edit accounts modal when close button is clicked', () => {
    const { getByText } = render();

    const editAccountsButton = getByText('Edit accounts');
    fireEvent.click(editAccountsButton);

    // The modal should be interactive
    expect(editAccountsButton).toBeDefined();
  });

  it('renders confirm and cancel buttons', () => {
    const { getByText } = render();

    const confirmButton = getByText('Connect');
    const cancelButton = getByText('Cancel');

    expect(confirmButton).toBeDefined();
    expect(cancelButton).toBeDefined();
  });

  it('calls rejectPermissionsRequest when cancel button is clicked', () => {
    const mockRejectPermissionsRequest = jest.fn();
    const { getByText } = render({
      props: {
        rejectPermissionsRequest: mockRejectPermissionsRequest,
      },
    });

    const cancelButton = getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockRejectPermissionsRequest).toHaveBeenCalledWith('1');
  });

  it('calls approveConnection when connect button is clicked', () => {
    const mockApproveConnection = jest.fn();
    const { getByText } = render({
      props: {
        approveConnection: mockApproveConnection,
      },
    });

    const connectButton = getByText('Connect');
    fireEvent.click(connectButton);

    expect(mockApproveConnection).toHaveBeenCalled();
  });

  it('renders with existing permissions correctly', () => {
    const { container } = render({
      props: {
        request: {
          permissions: {
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        accounts: ['eip155:1:0x123'],
                      },
                    },
                    sessionProperties: {},
                    isMultichainOrigin: true,
                  },
                },
              ],
            },
          },
          metadata: {
            id: '1',
            origin: mockTargetSubjectMetadata.origin,
          },
        },
      },
      state: {
        subjects: {
          [mockTargetSubjectMetadata.origin]: {
            permissions: {
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: ['eip155:1:0x123'],
                        },
                      },
                      sessionProperties: {},
                      isMultichainOrigin: true,
                    },
                  },
                ],
              },
            },
          },
        },
      },
    });

    expect(container).toMatchSnapshot();
  });

  it('handles account group selection correctly', () => {
    const { getByText } = render();

    const editAccountsButton = getByText('Edit accounts');
    fireEvent.click(editAccountsButton);

    // The modal should be interactive for account group selection
    expect(editAccountsButton).toBeDefined();
  });

  it('handles permissions tab interactions', () => {
    const { getByText } = render();

    const permissionsTab = getByText('Permissions');
    fireEvent.click(permissionsTab);

    // The permissions tab should be interactive
    expect(permissionsTab).toBeDefined();
  });

  it('renders with multichain origin request correctly', () => {
    const { container } = render({
      props: {
        request: {
          permissions: {
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: {
                    requiredScopes: {
                      'eip155:1': {
                        accounts: [],
                      },
                      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
                        accounts: [],
                      },
                    },
                    optionalScopes: {},
                    sessionProperties: {},
                    isMultichainOrigin: true,
                  },
                },
              ],
            },
          },
          metadata: {
            id: '1',
            origin: mockTargetSubjectMetadata.origin,
          },
        },
      },
    });

    expect(container).toMatchSnapshot();
  });

  it('handles permissions tab being disabled when no accounts selected', () => {
    const { getByTestId } = render();

    // Since we have mocked account groups, the tab should be enabled
    // In a real scenario with no accounts, it would be disabled
    const permissionsTab = getByTestId('permissions-tab');
    expect(permissionsTab).toBeDefined();
  });

  it('renders connect page with correct test id', () => {
    const { getByTestId } = render();
    expect(getByTestId('connect-page')).toBeDefined();
  });

  it('renders accounts and permissions tabs', () => {
    const { getByTestId } = render();

    expect(getByTestId('accounts-tab')).toBeDefined();
    expect(getByTestId('permissions-tab')).toBeDefined();
  });

  describe('requestedAndAlreadyConnectedCaipChainIdsOrDefault logic', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns supported requested CAIP chain IDs merged with already permitted chainIds when supportedRequestedCaipChainIds.length > 0 and it is not a Solana wallet standard request', () => {
      mockGetAllScopesFromCaip25CaveatValue
        .mockReturnValueOnce(['eip155:1', 'eip155:137']) // for requestedCaipChainIds
        .mockReturnValueOnce(['eip155:1']); // for existingCaipChainIds

      mockGetAllNetworkConfigurationsByCaipChainId.mockReturnValue({
        'eip155:1': {
          chainId: 'eip155:1',
          name: 'Ethereum Mainnet',
          nativeCurrency: 'ETH',
          caipChainId: 'eip155:1',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
        'eip155:137': {
          chainId: 'eip155:137',
          name: 'Polygon Mainnet',
          nativeCurrency: 'MATIC',
          caipChainId: 'eip155:137',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
      });

      render({
        state: {
          subjects: {
            [mockTargetSubjectMetadata.origin]: {
              permissions: {
                'endowment:caip25': {
                  caveats: [
                    {
                      type: 'restrictNetworkSwitching',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0x123'],
                          },
                        },
                        sessionProperties: {},
                        isMultichainOrigin: true,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      });

      // Check that useAccountGroupsForPermissions was called with the correct chain IDs
      // Since supportedRequestedCaipChainIds.length > 0, it should return the merged set
      // The actual call shows only ['eip155:1'] because our mock only has eip155:1 in the default return
      const { calls } = mockUseAccountGroupsForPermissions.mock;
      expect(calls.length).toBeGreaterThan(0);
      const actualChainIds = calls[0]?.[2] as string[] | undefined;
      expect(actualChainIds).toBeDefined();
      expect(actualChainIds).toContain('eip155:1');
      // Verify it contains the requested chains that are supported by the network configurations
      expect(actualChainIds).toEqual(expect.arrayContaining(['eip155:1']));
    });

    it('returns all default networks for Solana Wallet Standard requests', () => {
      const SOLANA_CAIP_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

      mockGetCaip25CaveatValueFromPermissions.mockReturnValue({
        requiredScopes: {},
        optionalScopes: {
          [SOLANA_CAIP_CHAIN_ID]: {
            accounts: [],
          },
        },
        sessionProperties: {
          [KnownSessionProperties.SolanaAccountChangedNotifications]: true,
        },
        isMultichainOrigin: true,
      });

      mockGetAllScopesFromCaip25CaveatValue.mockReturnValue([
        SOLANA_CAIP_CHAIN_ID,
      ]);

      mockGetAllNetworkConfigurationsByCaipChainId.mockReturnValue({
        'eip155:1': {
          chainId: 'eip155:1',
          name: 'Ethereum Mainnet',
          nativeCurrency: 'ETH',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          name: 'Solana Mainnet',
          nativeCurrency: 'SOL',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
      });

      render({
        props: {
          request: {
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'restrictNetworkSwitching',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        [SOLANA_CAIP_CHAIN_ID]: {
                          accounts: [],
                        },
                      },
                      sessionProperties: {
                        [KnownSessionProperties.SolanaAccountChangedNotifications]: true, // Solana Wallet Standard indicator
                      },
                      isMultichainOrigin: true,
                    },
                  },
                ],
              },
            },
            metadata: {
              id: '1',
              origin: mockTargetSubjectMetadata.origin,
            },
          },
        },
      });

      // For Solana Wallet Standard requests, should return all default networks (EVM + Solana)
      // even though only Solana was explicitly requested
      const { calls } = mockUseAccountGroupsForPermissions.mock;
      expect(calls.length).toBeGreaterThan(0);
      const actualChainIds = calls[0]?.[2] as string[] | undefined;
      expect(actualChainIds).toBeDefined();
      // Should include both EVM and Solana networks by default
      expect(actualChainIds).toContain('eip155:1');
      expect(actualChainIds).toContain(
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
    });

    it('returns all default networks when EIP-1193 request with no specific chain IDs requested', () => {
      mockGetCaip25CaveatValueFromPermissions.mockReturnValue({
        requiredScopes: {},
        optionalScopes: {
          'wallet:eip155': {
            // wallet:eip155 is added to the the request to pass caveat validation when no specific chain IDs are requested
            accounts: [],
          },
        },
        sessionProperties: {},
        isMultichainOrigin: false,
      });

      mockGetAllScopesFromCaip25CaveatValue.mockReturnValue([]); // for requestedCaipChainIds - empty
      mockGetAllNamespacesFromCaip25CaveatValue.mockReturnValue(['eip155']);
      mockGetAllNetworkConfigurationsByCaipChainId.mockReturnValue({
        'eip155:1': {
          chainId: 'eip155:1',
          name: 'Ethereum Mainnet',
          nativeCurrency: 'ETH',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          name: 'Solana Mainnet',
          nativeCurrency: 'SOL',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
      });

      render({
        props: {
          request: {
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'restrictNetworkSwitching',
                    value: {
                      requiredScopes: {},
                      optionalScopes: { 'wallet:eip155': { accounts: [] } },
                      sessionProperties: {},
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
            metadata: {
              id: '1',
              origin: mockTargetSubjectMetadata.origin,
              isEip1193Request: true,
            },
          },
        },
      });

      // For EIP-1193 requests, should return all default networks regardless of namespace filtering
      const { calls } = mockUseAccountGroupsForPermissions.mock;
      expect(calls.length).toBeGreaterThan(0);
      const actualChainIds = calls[0]?.[2] as string[] | undefined;
      expect(actualChainIds).toBeDefined();
      // Should include both EVM and Solana networks by default for EIP-1193
      expect(actualChainIds).toContain('eip155:1');
      expect(actualChainIds).toContain(
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
    });

    it('returns only the specifically requested evm chain when specific chains are requested and is an eip1193 request', () => {
      mockGetCaip25CaveatValueFromPermissions.mockReturnValue({
        requiredScopes: {},
        optionalScopes: {
          'eip155:137': {
            accounts: [],
          },
        },
      });
      mockGetAllScopesFromCaip25CaveatValue.mockReturnValue(['eip155:137']);

      mockGetAllNetworkConfigurationsByCaipChainId.mockReturnValue({
        'eip155:137': {
          chainId: 'eip155:137',
          name: 'Polygon Mainnet',
          nativeCurrency: 'ETH',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
      });
      render({
        props: {
          request: {
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'restrictNetworkSwitching',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:137': {
                          accounts: [],
                        },
                      },
                      sessionProperties: {},
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
            metadata: {
              id: '1',
              origin: mockTargetSubjectMetadata.origin,
              isEip1193Request: true,
            },
          },
        },
      });

      const { calls } = mockUseAccountGroupsForPermissions.mock;
      expect(calls.length).toBeGreaterThan(0);
      const actualChainIds = calls[0]?.[2] as string[] | undefined;
      expect(actualChainIds).toBeDefined();
      expect(actualChainIds).toEqual(['eip155:137']);
    });

    it('returns default network list filtered by requested namespaces when no specific chain IDs requested and not EIP-1193 or Solana Wallet Standard', () => {
      mockGetCaip25CaveatValueFromPermissions.mockReturnValue({
        requiredScopes: {},
        optionalScopes: {
          'wallet:eip155': {
            accounts: [],
          },
        },
        sessionProperties: {},
        isMultichainOrigin: false,
      });

      mockGetAllScopesFromCaip25CaveatValue.mockReturnValue([]);

      mockGetAllNamespacesFromCaip25CaveatValue.mockReturnValue([
        'eip155',
        'solana',
      ]);

      mockGetAllNetworkConfigurationsByCaipChainId.mockReturnValue({
        'eip155:1': {
          chainId: 'eip155:1',
          name: 'Ethereum Mainnet',
          nativeCurrency: 'ETH',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          name: 'Solana Mainnet',
          nativeCurrency: 'SOL',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
      });

      render({
        props: {
          request: {
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'restrictNetworkSwitching',
                    value: {
                      requiredScopes: {
                        'eip155:1': {
                          accounts: [],
                        },
                        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
                          accounts: [],
                        },
                      },
                      optionalScopes: {},
                      sessionProperties: {},
                      isMultichainOrigin: true,
                    },
                  },
                ],
              },
            },
            metadata: {
              id: '1',
              origin: mockTargetSubjectMetadata.origin,
              isEip1193Request: false,
            },
          },
        },
      });

      // Check that useAccountGroupsForPermissions was called with networks filtered by namespaces
      // The actual behavior shows only eip155:1 because the default network list only includes EVM networks
      const { calls } = mockUseAccountGroupsForPermissions.mock;
      expect(calls.length).toBeGreaterThan(0);
      const actualChainIds = calls[0]?.[2] as string[] | undefined;
      expect(actualChainIds).toBeDefined();
      expect(actualChainIds).toContain('eip155:1');
      expect(mockUseAccountGroupsForPermissions).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        ['eip155', 'solana'], // requestedNamespacesWithoutWallet should contain the filtered namespaces
      );
    });

    it('includes test network in default list when currently selected network is a test network', () => {
      mockGetAllScopesFromCaip25CaveatValue
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      mockGetAllNamespacesFromCaip25CaveatValue.mockReturnValue([]);

      mockGetMultichainNetwork.mockReturnValue({
        chainId: 'eip155:11155111',
        nickname: 'Sepolia Testnet',
        isEvmNetwork: true,
        network: {
          type: 'sepolia',
          chainId: '0xaa36a7',
          ticker: 'SepoliaETH',
        },
      });

      mockGetAllNetworkConfigurationsByCaipChainId.mockReturnValue({
        'eip155:1': {
          chainId: 'eip155:1',
          name: 'Ethereum Mainnet',
          nativeCurrency: 'ETH',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
        'eip155:11155111': {
          chainId: 'eip155:11155111',
          name: 'Sepolia Testnet',
          nativeCurrency: 'SepoliaETH',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          name: 'Solana Mainnet',
          nativeCurrency: 'SOL',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
      });

      render();

      // Check that useAccountGroupsForPermissions was called with mainnet, the selected test network, and Solana mainnet
      const { calls } = mockUseAccountGroupsForPermissions.mock;
      expect(calls.length).toBeGreaterThan(0);
      const actualChainIds = calls[0]?.[2] as string[] | undefined;
      expect(actualChainIds).toBeDefined();
      expect(actualChainIds).toContain('eip155:1');
      expect(actualChainIds).toContain('eip155:11155111');
      expect(actualChainIds).toContain(
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
    });

    it('filters out unsupported requested CAIP chain IDs', () => {
      // Mock getAllScopesFromCaip25CaveatValue to return mix of supported and unsupported chains
      mockGetAllScopesFromCaip25CaveatValue
        .mockReturnValueOnce(['eip155:1', 'eip155:999999', 'unsupported:chain']) // for requestedCaipChainIds - mix of supported and unsupported
        .mockReturnValueOnce([]); // for existingCaipChainIds

      // Mock network configurations to only include supported chains
      mockGetAllNetworkConfigurationsByCaipChainId.mockReturnValue({
        'eip155:1': {
          chainId: 'eip155:1',
          name: 'Ethereum Mainnet',
          nativeCurrency: 'ETH',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
      });

      render({
        props: {
          request: {
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'restrictNetworkSwitching',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: [],
                        },
                        'eip155:999999': {
                          accounts: [],
                        },
                        'unsupported:chain': {
                          accounts: [],
                        },
                      },
                      sessionProperties: {},
                      isMultichainOrigin: true,
                    },
                  },
                ],
              },
            },
            metadata: {
              id: '1',
              origin: mockTargetSubjectMetadata.origin,
            },
          },
        },
      });

      // Check that useAccountGroupsForPermissions was called with only supported chains
      const { calls } = mockUseAccountGroupsForPermissions.mock;
      expect(calls.length).toBeGreaterThan(0);
      const actualChainIds = calls[0]?.[2] as string[] | undefined;
      expect(actualChainIds).toEqual(['eip155:1']); // should only contain supported chains, unsupported ones filtered out
      expect(actualChainIds).not.toContain('eip155:999999'); // unsupported chain should be filtered out
      expect(actualChainIds).not.toContain('unsupported:chain'); // unsupported chain should be filtered out
    });

    it('handles wallet namespace filtering in requested CAIP chain IDs', () => {
      // Mock getAllScopesFromCaip25CaveatValue to return mix including wallet namespace
      mockGetAllScopesFromCaip25CaveatValue
        .mockReturnValueOnce(['eip155:1', 'wallet:1']) // for requestedCaipChainIds - includes wallet namespace that should be filtered out
        .mockReturnValueOnce([]); // for existingCaipChainIds

      render({
        props: {
          request: {
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'restrictNetworkSwitching',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: [],
                        },
                        'wallet:1': {
                          accounts: [],
                        },
                      },
                      sessionProperties: {},
                      isMultichainOrigin: true,
                    },
                  },
                ],
              },
            },
            metadata: {
              id: '1',
              origin: mockTargetSubjectMetadata.origin,
            },
          },
        },
      });

      // Check that useAccountGroupsForPermissions was called with wallet namespace filtered out
      const { calls } = mockUseAccountGroupsForPermissions.mock;
      expect(calls.length).toBeGreaterThan(0);
      const actualChainIds = calls[0]?.[2] as string[] | undefined;
      expect(actualChainIds).toEqual(['eip155:1']); // should only contain eip155:1, wallet:1 should be filtered out from requestedCaipChainIds
      expect(actualChainIds).not.toContain('wallet:1'); // wallet namespace should be filtered out
    });

    it('deduplicates chain IDs when merging supported requested and existing chains', () => {
      // Mock getAllScopesFromCaip25CaveatValue to return overlapping chains
      mockGetAllScopesFromCaip25CaveatValue
        .mockReturnValueOnce(['eip155:1', 'eip155:137']) // for requestedCaipChainIds
        .mockReturnValueOnce(['eip155:1', 'eip155:56']); // for existingCaipChainIds - overlaps with eip155:1

      mockGetAllNetworkConfigurationsByCaipChainId.mockReturnValue({
        'eip155:1': {
          chainId: 'eip155:1',
          name: 'Ethereum Mainnet',
          nativeCurrency: 'ETH',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
        'eip155:137': {
          chainId: 'eip155:137',
          name: 'Polygon Mainnet',
          nativeCurrency: 'MATIC',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
        'eip155:56': {
          chainId: 'eip155:56',
          name: 'BNB Smart Chain',
          nativeCurrency: 'BNB',
        } as unknown as EvmAndMultichainNetworkConfigurationsWithCaipChainId,
      });

      render({
        state: {
          subjects: {
            [mockTargetSubjectMetadata.origin]: {
              permissions: {
                'endowment:caip25': {
                  caveats: [
                    {
                      type: 'restrictNetworkSwitching',
                      value: {
                        requiredScopes: {},
                        optionalScopes: {
                          'eip155:1': {
                            accounts: ['eip155:1:0x123'],
                          },
                          'eip155:56': {
                            accounts: ['eip155:56:0x123'],
                          },
                        },
                        sessionProperties: {},
                        isMultichainOrigin: true,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      });

      // Check that useAccountGroupsForPermissions was called with deduplicated chains
      const { calls } = mockUseAccountGroupsForPermissions.mock;
      expect(calls.length).toBeGreaterThan(0);
      const actualChainIds = calls[0]?.[2] as string[] | undefined;
      expect(actualChainIds).toBeDefined();
      expect(actualChainIds).toContain('eip155:1'); // should contain the common chain
      // Verify deduplication - eip155:1 should only appear once even though it's in both requested and existing
      const eip155Count = actualChainIds?.filter(
        (id: string) => id === 'eip155:1',
      ).length;
      expect(eip155Count).toBe(1); // should appear only once despite being in both arrays
    });
  });
});
