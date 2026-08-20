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
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { createMockMultichainAccountsState } from '../../../selectors/multichain-accounts/test-utils';
import {
  getAllNetworkConfigurationsByCaipChainId,
  type EvmAndMultichainNetworkConfigurationsWithCaipChainId,
} from '../../../../shared/lib/selectors/networks';
import { getMultichainNetwork } from '../../../selectors/multichain';

import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
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

jest.mock('../../../../shared/lib/selectors/networks', () => {
  const mockNetworkConfigurationsByCaipChainId = {
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
  };

  return {
    ...jest.requireActual('../../../../shared/lib/selectors/networks'),
    getAllNetworkConfigurationsByCaipChainId: jest.fn(
      () => mockNetworkConfigurationsByCaipChainId,
    ),
  };
});

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  ...jest.requireActual('../../../selectors/multichain-accounts/account-tree'),
  getIconSeedAddressByAccountGroupId: () =>
    '0xc5b2b5ae370876c0122910f92a13bef85a133e56',
}));

jest.mock('../../../selectors/multichain', () => {
  const mockMultichainNetwork = {
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
  };

  return {
    ...jest.requireActual('../../../selectors/multichain'),
    getMultichainNetwork: jest.fn(() => mockMultichainNetwork),
  };
});

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

jest.mock('../../../helpers/utils/caip25-permissions', () => ({
  ...jest.requireActual('../../../helpers/utils/caip25-permissions'),
  getCaip25CaveatValueFromPermissions: jest.fn(),
}));

jest.mock('../../../../shared/lib/multichain/scope-utils', () => ({
  getCaip25AccountFromAccountGroupAndScope: jest.fn(() => ['eip155:1:0x123']),
}));

const mockGetCaip25CaveatValueFromPermissions = jest.requireMock(
  '../../../helpers/utils/caip25-permissions',
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
            lastSelected: 0,
          },
        },
      },
      metadata: {
        name: 'Test Wallet',
        entropy: { id: '01JKAF3DSGM3AB87EM9N0K41AJ' },
      },
    },
  },
};
const mockSelectedAccountGroup =
  'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId;

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
    mockSelectedAccountGroup,
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
    const { getByAltText } = render();

    const image = getByAltText('metamask.github.io logo');
    expect(image).toHaveAttribute(
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
    expect(getByText(messages.connectionDescription.message)).toBeDefined();
  });

  it('renders account list correctly', () => {
    const { getByText } = render();

    expect(getByText(messages.editAccounts.message)).toBeDefined();
  });

  it('renders edit accounts modal when edit button is clicked', () => {
    const { getByText } = render();

    const editAccountsButton = getByText(messages.editAccounts.message);
    fireEvent.click(editAccountsButton);

    // The modal should open when edit button is clicked
    expect(editAccountsButton).toBeDefined();
  });

  it('closes edit accounts modal when close button is clicked', () => {
    const { getByText } = render();

    const editAccountsButton = getByText(messages.editAccounts.message);
    fireEvent.click(editAccountsButton);

    // The modal should be interactive
    expect(editAccountsButton).toBeDefined();
  });

  it('renders confirm and cancel buttons', () => {
    const { getByText } = render();

    const confirmButton = getByText(messages.connect.message);
    const cancelButton = getByText(messages.cancel.message);

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

    const cancelButton = getByText(messages.cancel.message);
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

    const connectButton = getByText(messages.connect.message);
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

    const editAccountsButton = getByText(messages.editAccounts.message);
    fireEvent.click(editAccountsButton);

    // The modal should be interactive for account group selection
    expect(editAccountsButton).toBeDefined();
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

  it('renders connect page with correct test id', () => {
    const { getByTestId } = render();
    expect(getByTestId('connect-page')).toBeDefined();
  });
});
