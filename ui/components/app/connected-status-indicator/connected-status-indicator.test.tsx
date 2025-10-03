import React from 'react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/jest';
import {
  Color,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_CONNECTED_TO_SNAP,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import ConnectedStatusIndicator from './connected-status-indicator';

// Mock ConnectedSiteMenu to test props passed to it
jest.mock('../../multichain', () => ({
  ConnectedSiteMenu: jest.fn(({ status, globalMenuColor, text, disabled }) => (
    <div
      data-testid="connection-menu"
      data-status={status}
      data-global-menu-color={globalMenuColor}
      data-text={text}
      className={`multichain-connected-site-menu${disabled ? '--disabled' : ''}`}
    />
  )),
}));

jest.mock('@metamask/chain-agnostic-permission', () => ({
  isInternalAccountInPermittedAccountIds: jest.fn(),
  getCaip25PermissionFromSubject: jest.fn(),
  getCaip25CaveatFromPermission: jest.fn(),
  getCaipAccountIdsFromCaip25CaveatValue: jest.fn(),
  getAllScopesFromPermission: jest.fn(),
  getPermittedEthChainIds: jest.fn(),
  getEthAccounts: jest.fn(),
}));

const {
  isInternalAccountInPermittedAccountIds,
  getCaip25PermissionFromSubject,
  getCaip25CaveatFromPermission,
  getCaipAccountIdsFromCaip25CaveatValue,
  getAllScopesFromPermission,
  getPermittedEthChainIds,
  getEthAccounts,
} = jest.requireMock('@metamask/chain-agnostic-permission');

describe('ConnectedStatusIndicator', () => {
  const mockAccount1 = createMockInternalAccount({
    id: 'account1',
    address: '0x1234567890123456789012345678901234567890',
    name: 'Account 1',
  });
  const mockAccount2 = createMockInternalAccount({
    id: 'account2',
    address: '0x0987654321098765432109876543210987654321',
    name: 'Account 2',
  });

  const mockAccountGroup1 = 'entropy:wallet1/0';

  const createMockState = (overrides = {}) => ({
    activeTab: {
      origin: 'https://test.dapp',
    },
    metamask: {
      internalAccounts: {
        accounts: {
          [mockAccount1.id]: mockAccount1,
          [mockAccount2.id]: mockAccount2,
        },
        selectedAccount: mockAccount1.id,
      },
      subjects: {
        'https://test.dapp': {
          permissions: {},
        },
      },
      subjectMetadata: {
        'https://test.dapp': {
          name: 'Test Dapp',
          iconUrl: 'https://test.dapp/icon.png',
        },
      },
      permissionHistory: {
        'https://test.dapp': {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          eth_accounts: {
            accounts: {},
          },
        },
      },
      domainMetadata: {
        'https://test.dapp': {
          name: 'Test Dapp',
          icon: 'https://test.dapp/icon.png',
        },
      },
      keyrings: [],
      balances: {
        [mockAccount1.address]: '0x0',
        [mockAccount2.address]: '0x0',
      },
      cachedBalances: {
        [CHAIN_IDS.MAINNET]: {
          [mockAccount1.address]: '0x0',
          [mockAccount2.address]: '0x0',
        },
      },
      networkConfigurations: {
        [CHAIN_IDS.MAINNET]: {
          chainId: CHAIN_IDS.MAINNET,
          rpcUrl: 'https://mainnet.infura.io/v3/test',
          ticker: 'ETH',
          nickname: 'Ethereum Mainnet',
          type: 'custom',
        },
      },
      providerConfig: {
        chainId: CHAIN_IDS.MAINNET,
        ticker: 'ETH',
        nickname: 'Ethereum Mainnet',
        type: 'mainnet',
      },
      tokens: [],
      allTokens: {},
      tokenBalances: {},
      allTokenBalances: {},
      seedPhraseBackedUp: false,
      dismissSeedBackUpReminder: false,
      accountTree: {
        selectedAccountGroup: mockAccountGroup1,
        wallets: {
          'entropy:wallet1': {
            id: 'entropy:wallet1',
            type: 'entropy',
            status: 'ready',
            groups: {
              [mockAccountGroup1]: {
                id: mockAccountGroup1,
                type: 'multichainAccount',
                accounts: [mockAccount1.id, mockAccount2.id],
                metadata: {
                  name: 'Wallet 1',
                  entropy: { groupIndex: 0 },
                  pinned: false,
                  hidden: false,
                },
              },
            },
            metadata: {
              name: 'Wallet 1',
              entropy: { id: 'wallet1' },
            },
          },
        },
      },
      ...overrides,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    isInternalAccountInPermittedAccountIds.mockReturnValue(false);
    getCaip25PermissionFromSubject.mockReturnValue(null);
    getCaip25CaveatFromPermission.mockReturnValue(null);
    getCaipAccountIdsFromCaip25CaveatValue.mockReturnValue([]);
    getAllScopesFromPermission.mockReturnValue({});
    getPermittedEthChainIds.mockReturnValue([]);
    getEthAccounts.mockReturnValue([]);
  });

  const mockStore = configureStore([]);

  describe('Connection status display', () => {
    it('displays connected status when current account group has permissions', () => {
      isInternalAccountInPermittedAccountIds
        .mockReturnValueOnce(true) // First account in group is connected
        .mockReturnValueOnce(false); // Second account is not

      const mockState = createMockState({
        permissionHistory: {
          'https://test.dapp': {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            eth_accounts: {
              accounts: {
                [mockAccount1.address]: 1234567890,
              },
            },
          },
        },
      });

      const store = mockStore(mockState);
      const { getByTestId } = renderWithProvider(
        <ConnectedStatusIndicator />,
        store,
      );

      const menu = getByTestId('connection-menu');
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveClass('multichain-connected-site-menu');
      expect(menu).toHaveAttribute('data-status', STATUS_CONNECTED);
      expect(menu).toHaveAttribute(
        'data-global-menu-color',
        Color.successDefault,
      );
    });

    it('displays connected to another account status when only external accounts have permissions', () => {
      // Reset the mock for this test to ensure no account is connected
      isInternalAccountInPermittedAccountIds.mockReturnValue(false);

      const mockPermission = {
        caveats: [
          {
            type: 'authorizedScopes',
            value: {
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: [
                  'eip155:1:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
                ],
              },
            },
          },
        ],
      };
      getCaip25PermissionFromSubject.mockReturnValue(mockPermission);
      getCaip25CaveatFromPermission.mockReturnValue(mockPermission.caveats[0]);
      getCaipAccountIdsFromCaip25CaveatValue.mockReturnValue([
        'eip155:1:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      ]);

      const mockState = createMockState({
        subjects: {
          'https://test.dapp': {
            permissions: {
              'endowment:caip25': mockPermission,
            },
          },
        },
        permissionHistory: {
          'https://test.dapp': {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            eth_accounts: {
              accounts: {
                '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': 1234567890,
              },
            },
          },
        },
      });

      const store = mockStore(mockState);
      const { getByTestId } = renderWithProvider(
        <ConnectedStatusIndicator />,
        store,
      );

      const menu = getByTestId('connection-menu');
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveClass('multichain-connected-site-menu');
      expect(menu).toHaveAttribute(
        'data-status',
        STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
      );
      expect(menu).toHaveAttribute(
        'data-global-menu-color',
        BackgroundColor.backgroundDefault,
      );
    });

    it('displays snap connection status when wallet snap permissions exist', () => {
      const mockState = createMockState({
        subjects: {
          'https://test.dapp': {
            permissions: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              wallet_snap: {
                caveats: [],
                date: 1234567890,
                id: 'test-permission-id',
                invoker: 'https://test.dapp',
                parentCapability: 'wallet_snap',
              },
            },
          },
        },
      });

      const store = mockStore(mockState);
      const { getByTestId } = renderWithProvider(
        <ConnectedStatusIndicator />,
        store,
      );

      const menu = getByTestId('connection-menu');
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveClass('multichain-connected-site-menu');
      expect(menu).toHaveAttribute('data-status', STATUS_CONNECTED_TO_SNAP);
      expect(menu).toHaveAttribute(
        'data-global-menu-color',
        BackgroundColor.backgroundDefault,
      );
    });

    it('displays not connected status when no permissions exist', () => {
      const mockState = createMockState();

      const store = mockStore(mockState);
      const { getByTestId } = renderWithProvider(
        <ConnectedStatusIndicator />,
        store,
      );

      const menu = getByTestId('connection-menu');
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveClass('multichain-connected-site-menu');
      expect(menu).toHaveAttribute('data-status', STATUS_NOT_CONNECTED);
      expect(menu).toHaveAttribute(
        'data-global-menu-color',
        Color.iconAlternative,
      );
    });
  });

  describe('Error handling and edge cases', () => {
    it('renders correctly when no account group is selected', () => {
      const mockState = createMockState({
        accountTree: {
          selectedAccountGroup: null,
          wallets: {},
        },
      });

      const store = mockStore(mockState);
      const { getByTestId } = renderWithProvider(
        <ConnectedStatusIndicator />,
        store,
      );

      const menu = getByTestId('connection-menu');
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveClass('multichain-connected-site-menu');
    });

    it('renders correctly when account group contains no accounts', () => {
      const mockState = createMockState({
        accountTree: {
          selectedAccountGroup: mockAccountGroup1,
          wallets: {
            'entropy:wallet1': {
              id: 'entropy:wallet1',
              type: 'entropy',
              status: 'ready',
              groups: {
                [mockAccountGroup1]: {
                  id: mockAccountGroup1,
                  type: 'multichainAccount',
                  accounts: [],
                  metadata: {
                    name: 'Wallet 1',
                    entropy: { groupIndex: 0 },
                    pinned: false,
                    hidden: false,
                  },
                },
              },
              metadata: {
                name: 'Wallet 1',
                entropy: { id: 'wallet1' },
              },
            },
          },
        },
      });

      const store = mockStore(mockState);
      const { getByTestId } = renderWithProvider(
        <ConnectedStatusIndicator />,
        store,
      );

      const menu = getByTestId('connection-menu');
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveClass('multichain-connected-site-menu');
    });

    it('renders correctly when active tab has no permissions', () => {
      const mockState = createMockState();

      const store = mockStore(mockState);
      const { getByTestId } = renderWithProvider(
        <ConnectedStatusIndicator />,
        store,
      );

      const menu = getByTestId('connection-menu');
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveClass('multichain-connected-site-menu');
    });

    it('renders correctly when multiple snap permissions exist', () => {
      const mockState = createMockState({
        subjects: {
          'https://test.dapp': {
            permissions: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              wallet_snap: {
                caveats: [],
                date: 1234567890,
                id: 'test-permission-id',
                invoker: 'https://test.dapp',
                parentCapability: 'wallet_snap',
              },
              'endowment:network-access': {
                caveats: [],
                date: 1234567890,
                id: 'test-permission-id-2',
                invoker: 'https://test.dapp',
                parentCapability: 'endowment:network-access',
              },
            },
          },
        },
      });

      const store = mockStore(mockState);
      const { getByTestId } = renderWithProvider(
        <ConnectedStatusIndicator />,
        store,
      );

      const menu = getByTestId('connection-menu');
      expect(menu).toBeInTheDocument();
    });

    it('prioritizes account connection status over snap connection status', () => {
      isInternalAccountInPermittedAccountIds
        .mockReturnValueOnce(true) // Account in selected group is connected
        .mockReturnValueOnce(false);

      const mockState = createMockState({
        subjects: {
          'https://test.dapp': {
            permissions: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              wallet_snap: {
                caveats: [],
                date: 1234567890,
                id: 'test-permission-id',
                invoker: 'https://test.dapp',
                parentCapability: 'wallet_snap',
              },
            },
          },
        },
        permissionHistory: {
          'https://test.dapp': {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            eth_accounts: {
              accounts: {
                [mockAccount1.address]: 1234567890,
              },
            },
          },
        },
      });

      const store = mockStore(mockState);
      const { getByTestId } = renderWithProvider(
        <ConnectedStatusIndicator />,
        store,
      );

      const menu = getByTestId('connection-menu');
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveAttribute('data-status', STATUS_CONNECTED);
      expect(menu).toHaveAttribute(
        'data-global-menu-color',
        Color.successDefault,
      );
    });
  });
});
