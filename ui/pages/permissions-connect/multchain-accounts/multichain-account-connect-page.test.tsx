import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { KnownCaipNamespace } from '@metamask/utils';
import { RpcEndpointType } from '@metamask/network-controller';
import { AccountWalletType, AccountGroupType } from '@metamask/account-api';
import { InternalKeyringType } from '../../../../shared/constants/keyring';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import {
  MultichainAccountConnectPage,
  MultichainAccountConnectPageProps,
} from './multichain-account-connect-page';
import { createMockInternalAccount } from '../../../../test/jest/mocks';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const mockTestDappUrl = 'https://test.dapp';

const mockTargetSubjectMetadata = {
  extensionId: null,
  iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  name: 'E2E Test Dapp',
  origin: 'https://metamask.github.io',
  subjectType: 'website',
};

const WALLET_ID = 'entropy:wallet-123';

const mockAccountGroup1 = {
  id: `${WALLET_ID}/0`,
  type: AccountGroupType.MultichainAccount,
  metadata: {
    name: 'Test Account 1',
    keyring: { type: InternalKeyringType.hdKeyTree },
    entropy: { groupIndex: 0 },
    hidden: false,
    pinned: false,
  },
  accounts: ['account-1'],
};

const mockAccountGroup2 = {
  id: `${WALLET_ID}/1`,
  type: AccountGroupType.MultichainAccount,
  metadata: {
    name: 'Test Account 2',
    keyring: { type: InternalKeyringType.hdKeyTree },
    entropy: { groupIndex: 1 },
    hidden: false,
    pinned: false,
  },
  accounts: ['account-2'],
};

const mockState = {
  metamask: {
    permissions: {
      [mockTestDappUrl]: {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': {
                    accounts: [
                      'eip155:1:0x1234567890123456789012345678901234567890',
                    ],
                  },
                },
                sessionProperties: {},
                isMultichainOrigin: false,
              },
            },
          ],
        },
      },
    },
    subjects: {
      [mockTestDappUrl]: {
        permissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'eip155:1': {
                      accounts: [
                        'eip155:1:0x1234567890123456789012345678901234567890',
                      ],
                    },
                  },
                  sessionProperties: {},
                  isMultichainOrigin: false,
                },
              },
            ],
          },
        },
      },
    },
    permissionHistory: {},
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH' },
        rpcUrl: 'https://mainnet.infura.io',
        ticker: 'ETH',
        blockExplorerUrls: [],
        rpcEndpoints: [
          {
            url: 'https://mainnet.infura.io',
            type: RpcEndpointType.Custom,
            networkClientId: 'mainnet',
          },
        ],
        defaultRpcEndpointIndex: 0,
      },
    },
    multichainNetworkConfigurationsByChainId: {},
    allNetworkConfigurations: {
      'eip155:1': {
        chainId: 'eip155:1',
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH' },
        rpcUrl: 'https://mainnet.infura.io',
        ticker: 'ETH',
      },
    },
    providerConfig: {
      chainId: '0x1',
    },
    selectedNetworkClientId: 'mainnet',
    accountTree: {
      wallets: {
        'entropy-wallet-1': {
          id: 'entropy-wallet-1',
          type: 'entropy',
          metadata: { name: 'MetaMask Wallet' },
          groups: {
            [`${WALLET_ID}/0`]: mockAccountGroup1,
            [`${WALLET_ID}/1`]: mockAccountGroup2,
          },
        },
      },
      selectedAccountGroup: `${WALLET_ID}/0`,
    },
    accountsByChainId: {
      'eip155:1': {
        [`${WALLET_ID}/0`]: mockAccountGroup1,
        [`${WALLET_ID}/1`]: mockAccountGroup2,
      },
    },
    accountGroupsByScopes: {
      [`${KnownCaipNamespace.Eip155}:0`]: [
        mockAccountGroup1,
        mockAccountGroup2,
      ],
    },
    accountGroups: [mockAccountGroup1, mockAccountGroup2],
    accounts: {
      'account-1': createMockInternalAccount({
        id: 'account-1',
        address: '0x1234567890123456789012345678901234567890',
        name: 'Test Account 1',
      }),
      'account-2': createMockInternalAccount({
        id: 'account-2',
        address: '0x0987654321098765432109876543210987654321',
        name: 'Test Account 2',
      }),
    },
    internalAccounts: {
      accounts: {
        'account-1': {
          ...createMockInternalAccount({
            id: 'account-1',
            address: '0x1234567890123456789012345678901234567890',
            name: 'Test Account 1',
          }),
          scopes: ['eip155:0'],
        },
        'account-2': {
          ...createMockInternalAccount({
            id: 'account-2',
            address: '0x0987654321098765432109876543210987654321',
            name: 'Test Account 2',
          }),
          scopes: ['eip155:0'],
        },
      },
      selectedAccount: 'account-1',
    },
    completedOnboarding: true,
    pinnedAccountsList: [],
    hiddenAccountsList: [],
    connectedAccountsForActiveTab: [],
    orderedAccountsList: ['account-1', 'account-2'],
  },
  appState: {
    modal: { open: false },
  },
  localeMessages: {
    current: {},
    currentLocale: 'en',
  },
};

jest.mock('../../../contexts/metametrics', () => {
  const mockReact = require('react');
  return {
    MetaMetricsContext: mockReact.createContext(jest.fn()),
  };
});

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const renderComponent = (
  options: {
    props?: Partial<MultichainAccountConnectPageProps>;
    state?: object;
  } = {},
) => {
  const { props = {}, state } = options;

  const defaultProps: MultichainAccountConnectPageProps = {
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
                isMultichainOrigin: false,
              },
            },
          ],
        },
      },
      metadata: {
        id: '1',
        origin: mockTestDappUrl,
        isEip1193Request: false,
        promptToCreateSolanaAccount: false,
      },
    },
    permissionsRequestId: '1',
    rejectPermissionsRequest: jest.fn(),
    approveConnection: jest.fn(),
    activeTabOrigin: mockTestDappUrl,
    targetSubjectMetadata: mockTargetSubjectMetadata,
    ...props,
  };

  const store = mockStore({
    ...mockState,
    ...state,
  });

  return render(
    <MemoryRouter>
      <Provider store={store}>
        <MultichainAccountConnectPage {...defaultProps} />
      </Provider>
    </MemoryRouter>,
  );
};

describe('MultichainAccountConnectPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = renderComponent();
    expect(container).toMatchSnapshot();
  });

  it('should render the page with correct test id', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('connect-page')).toBeInTheDocument();
  });

  it('should render image icon correctly', () => {
    const { getAllByAltText } = renderComponent();

    const images = getAllByAltText('logo');
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

  it('should display account information correctly', () => {
    const { getByText, getByTestId } = renderComponent();

    // Only connected accounts should be displayed (Test Account 1 is connected)
    expect(getByText('Test Account 1')).toBeInTheDocument();

    // Check that the connected account's balance is displayed
    const balanceDisplays = document.querySelectorAll(
      '[data-testid="balance-display"]',
    );
    expect(balanceDisplays).toHaveLength(1);
    expect(balanceDisplays[0]).toHaveTextContent('$1337.00');

    // Check that the connected account cell is rendered
    expect(
      getByTestId('multichain-account-cell-entropy:wallet-123/0'),
    ).toBeInTheDocument();

    // Check that the connected account shows selected icon
    expect(
      getByTestId('multichain-account-cell-entropy:wallet-123/0-selected-icon'),
    ).toBeInTheDocument();

    // Edit accounts button should be available to add more accounts
    expect(getByTestId('edit')).toBeInTheDocument();
    expect(getByText('editAccounts')).toBeInTheDocument();
  });

  it('should only display accounts with existing permissions', () => {
    const { getByText, queryByText, getByTestId, queryByTestId } =
      renderComponent();

    // Test Account 1 has permissions and should be displayed
    expect(getByText('Test Account 1')).toBeInTheDocument();
    expect(
      getByTestId('multichain-account-cell-entropy:wallet-123/0'),
    ).toBeInTheDocument();
    expect(
      getByTestId('multichain-account-cell-entropy:wallet-123/0-selected-icon'),
    ).toBeInTheDocument();

    // Test Account 2 does NOT have permissions and should NOT be displayed
    expect(queryByText('Test Account 2')).not.toBeInTheDocument();
    expect(
      queryByTestId('multichain-account-cell-entropy:wallet-123/1'),
    ).not.toBeInTheDocument();
    expect(
      queryByTestId(
        'multichain-account-cell-entropy:wallet-123/1-selected-icon',
      ),
    ).not.toBeInTheDocument();

    // Only one account should be displayed (the one with permissions)
    const balanceDisplays = document.querySelectorAll(
      '[data-testid="balance-display"]',
    );
    expect(balanceDisplays).toHaveLength(1);

    // Verify that the permissions tab is enabled (accounts are connected)
    const permissionsTab = getByTestId('permissions-tab');
    expect(permissionsTab).not.toHaveClass('tab--disabled');
  });
});
