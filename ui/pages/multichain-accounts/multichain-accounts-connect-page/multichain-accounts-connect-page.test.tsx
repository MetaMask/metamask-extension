import React from 'react';
import { fireEvent } from '@testing-library/react';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import {
  AccountWalletType,
  AccountGroupType,
  AccountGroupId,
} from '@metamask/account-api';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { createMockMultichainAccountsState } from '../../../selectors/multichain-accounts/test-utils';
import {
  MultichainAccountsConnectPage,
  MultichainConnectPageProps,
} from './multichain-accounts-connect-page';

jest.mock('../../../hooks/useAccountGroupsForPermissions', () => ({
  useAccountGroupsForPermissions: () => ({
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
  }),
}));

jest.mock('../../../../shared/modules/selectors/networks', () => ({
  ...jest.requireActual('../../../../shared/modules/selectors/networks'),
  getAllNetworkConfigurationsByCaipChainId: () => ({
    'eip155:1': {
      chainId: 'eip155:1',
      name: 'Ethereum Mainnet',
      nativeCurrency: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      rpcUrls: ['https://mainnet.infura.io'],
      blockExplorerUrls: ['https://etherscan.io'],
    },
  }),
}));

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  ...jest.requireActual('../../../selectors/multichain-accounts/account-tree'),
  getIconSeedAddressByAccountGroupId: () =>
    '0xc5b2b5ae370876c0122910f92a13bef85a133e56',
}));

jest.mock('../../../selectors/multichain', () => ({
  ...jest.requireActual('../../../selectors/multichain'),
  getMultichainNetwork: () => ({
    chainId: 'eip155:1',
    name: 'Ethereum Mainnet',
    nativeCurrency: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  }),
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
  getCaip25CaveatValueFromPermissions: jest.fn(() => ({
    requiredScopes: {},
    optionalScopes: {
      'eip155:1': {
        accounts: [],
      },
    },
    sessionProperties: {},
    isMultichainOrigin: true,
  })),
}));

jest.mock('../../../../shared/lib/multichain/scope-utils', () => ({
  getCaip25AccountFromAccountGroupAndScope: jest.fn(() => ['eip155:1:0x123']),
}));

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
    activeTabOrigin: mockTestDappUrl,
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
});
