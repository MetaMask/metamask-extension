import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest';
import {
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_SOLANA_MAINNET,
} from '../../../../test/data/mock-accounts';
import { ACCOUNT_DETAILS_QR_CODE_ROUTE } from '../../../helpers/constants/routes';
import { KeyringType } from '../../../../shared/constants/keyring';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { BaseAccountDetails } from './base-account-details';

const middleware = [thunk];
const mockStore = configureMockStore(middleware);

// Mock the useHistory hook
const mockPush = jest.fn();
const mockGoBack = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockPush,
    goBack: mockGoBack,
  }),
}));

const createMockState = (
  address: string,
  account = MOCK_ACCOUNT_EOA,
  useBlockie = false,
  walletName = 'Mock Wallet',
) => ({
  appState: {
    accountDetailsAddress: address,
  },
  activeTab: {
    id: 1,
    title: 'Test Dapp',
    origin: 'https://test-dapp.com',
    protocol: 'https:',
    url: 'https://test-dapp.com',
  },
  metamask: {
    useBlockie,
    internalAccounts: {
      accounts: {
        [account.id]: {
          ...account,
          address,
        },
      },
      selectedAccount: account.id,
    },
    accountTree: {
      wallets: {
        'mock-wallet-id': {
          id: 'mock-wallet-id',
          metadata: {
            name: walletName,
          },
          groups: {
            'mock-wallet-id:default': {
              id: 'mock-wallet-id:default',
              metadata: {
                name: 'Default',
              },
              accounts: [account.id],
            },
          },
        },
      },
    },
    // Required for network selectors
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        blockExplorerUrls: ['https://etherscan.io'],
        rpcEndpoints: [
          {
            url: 'https://mainnet.infura.io/v3/your-project-id',
            type: 'infura',
            networkClientId: 'mainnet',
          },
        ],
        defaultRpcEndpointIndex: 0,
        defaultBlockExplorerUrlIndex: 0,
      },
    },
    selectedNetworkClientId: 'mainnet',
    // Required for account balance selectors
    accountsByChainId: {
      '0x1': {
        [address]: {
          balance: '0x0',
          address,
        },
      },
    },
    // Required for keyring selectors
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [address],
        index: 0,
        metadata: {
          id: 'mock-hd-keyring-id',
          name: 'HD Key Tree',
        },
      },
    ],
    // Required for permission selectors
    permissionHistory: {
      'https://test-dapp.com': {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eth_accounts: {
          accounts: {
            [address]: Date.now(),
          },
        },
      },
    },
    // Required for account lists
    pinnedAccountsList: [],
    hiddenAccountsList: [],
    connectedAccounts: [],
  },
});

describe('BaseAccountDetails', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGoBack.mockClear();
  });

  describe('Component Rendering', () => {
    it('should render with EVM account correctly', () => {
      const state = createMockState(MOCK_ACCOUNT_EOA.address);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={MOCK_ACCOUNT_EOA.address}
            account={MOCK_ACCOUNT_EOA}
          />
        </MemoryRouter>,
        store,
      );

      // Check if account name is displayed in header
      expect(screen.getAllByText('Account 1')).toHaveLength(2); // Header + details section

      // Check if account details section is rendered
      expect(screen.getByText('Account name')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Wallet')).toBeInTheDocument();

      // Check if shortened address is displayed (short address stays as-is)
      expect(screen.getByText('0xa0b86...f5e4b')).toBeInTheDocument();

      // Check if wallet name is displayed
      expect(screen.getByText('Mock Wallet')).toBeInTheDocument();
    });

    it('should render with non-EVM (Solana) account correctly', () => {
      const state = createMockState(
        MOCK_ACCOUNT_SOLANA_MAINNET.address,
        MOCK_ACCOUNT_SOLANA_MAINNET,
      );
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={MOCK_ACCOUNT_SOLANA_MAINNET.address}
            account={MOCK_ACCOUNT_SOLANA_MAINNET}
          />
        </MemoryRouter>,
        store,
      );

      // Check if Solana account name is displayed (allow multiple occurrences)
      expect(screen.getAllByText('Solana Account')).toHaveLength(2);

      // Check if Solana address is displayed correctly (7 chars + ... + 5 chars)
      expect(screen.getByText('8A4AptC...aaLGC')).toBeInTheDocument();

      // Check if wallet name is displayed
      expect(screen.getByText('Mock Wallet')).toBeInTheDocument();
    });

    it('should render children when passed', () => {
      const state = createMockState(MOCK_ACCOUNT_EOA.address);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={MOCK_ACCOUNT_EOA.address}
            account={MOCK_ACCOUNT_EOA}
          >
            <div data-testid="test-child">Test Child Component</div>
          </BaseAccountDetails>
        </MemoryRouter>,
        store,
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Child Component')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should go back when back button is clicked', () => {
      const state = createMockState(MOCK_ACCOUNT_EOA.address);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={MOCK_ACCOUNT_EOA.address}
            account={MOCK_ACCOUNT_EOA}
          />
        </MemoryRouter>,
        store,
      );

      const backButton = screen.getByLabelText('Back');
      fireEvent.click(backButton);

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it('should navigate to QR code route when address row is clicked', () => {
      const state = createMockState(MOCK_ACCOUNT_EOA.address);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={MOCK_ACCOUNT_EOA.address}
            account={MOCK_ACCOUNT_EOA}
          />
        </MemoryRouter>,
        store,
      );

      // Find all "next" buttons and click the first one (address row)
      const nextButtons = screen.getAllByLabelText('Next');
      const addressRowButton = nextButtons[0];
      fireEvent.click(addressRowButton);

      expect(mockPush).toHaveBeenCalledWith(
        `${ACCOUNT_DETAILS_QR_CODE_ROUTE}/${MOCK_ACCOUNT_EOA.address}`,
      );
    });

    it('should navigate to wallet details when wallet row is clicked', () => {
      const state = createMockState(MOCK_ACCOUNT_EOA.address);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={MOCK_ACCOUNT_EOA.address}
            account={MOCK_ACCOUNT_EOA}
          />
        </MemoryRouter>,
        store,
      );

      // Find all "next" buttons and click the second one (wallet row)
      const nextButtons = screen.getAllByLabelText('Next');
      const walletRowButton = nextButtons[1];
      fireEvent.click(walletRowButton);

      expect(mockPush).toHaveBeenCalledWith('/wallet-details/mock-wallet-id');
    });
  });

  describe('Account Name Editing', () => {
    it('should open edit account name modal when edit button is clicked', () => {
      const state = createMockState(MOCK_ACCOUNT_EOA.address);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={MOCK_ACCOUNT_EOA.address}
            account={MOCK_ACCOUNT_EOA}
          />
        </MemoryRouter>,
        store,
      );

      const editButton = screen.getByLabelText('Edit');
      fireEvent.click(editButton);

      // Check if modal is opened by looking for the edit modal text
      expect(screen.getByText('Edit account name')).toBeInTheDocument();
    });
  });

  describe('Address Formatting', () => {
    it('should display checksummed and shortened address for EVM accounts', () => {
      const mockEvmAccount = {
        ...MOCK_ACCOUNT_EOA,
        address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      };
      const state = createMockState(mockEvmAccount.address, mockEvmAccount);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={mockEvmAccount.address}
            account={mockEvmAccount}
          />
        </MemoryRouter>,
        store,
      );

      // Should display shortened checksummed address (7 chars + ... + 5 chars)
      expect(screen.getByText('0xabcde...def12')).toBeInTheDocument();
    });

    it('should display non-EVM address as-is without checksumming', () => {
      const state = createMockState(
        MOCK_ACCOUNT_SOLANA_MAINNET.address,
        MOCK_ACCOUNT_SOLANA_MAINNET,
      );
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={MOCK_ACCOUNT_SOLANA_MAINNET.address}
            account={MOCK_ACCOUNT_SOLANA_MAINNET}
          />
        </MemoryRouter>,
        store,
      );

      // Should display shortened Solana address without checksumming (7 chars + ... + 5 chars)
      expect(screen.getByText('8A4AptC...aaLGC')).toBeInTheDocument();
    });
  });

  describe('Modal Integration', () => {
    it('should render EditAccountNameModal with correct props when editing', () => {
      const state = createMockState(MOCK_ACCOUNT_EOA.address);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={MOCK_ACCOUNT_EOA.address}
            account={MOCK_ACCOUNT_EOA}
          />
        </MemoryRouter>,
        store,
      );

      // Open the modal
      const editButton = screen.getByLabelText('Edit');
      fireEvent.click(editButton);

      // Check if modal is rendered by looking for the modal text content
      expect(screen.getByText('Edit account name')).toBeInTheDocument();
    });
  });

  describe('Account Removal', () => {
    it('should display remove account button for removable accounts', () => {
      const hardwareAccount = {
        ...MOCK_ACCOUNT_EOA,
        id: 'hardware-account',
        metadata: {
          ...MOCK_ACCOUNT_EOA.metadata,
          name: 'Hardware Account',
          keyring: {
            type: KeyringType.trezor,
          },
        },
      };

      const state = createMockState(hardwareAccount.address, hardwareAccount);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={hardwareAccount.address}
            account={hardwareAccount}
          />
        </MemoryRouter>,
        store,
      );

      const removeButton = screen.getByText('Remove account');
      expect(removeButton).toBeInTheDocument();

      // Verify that the modal is triggered and present
      fireEvent.click(removeButton);

      expect(
        screen.getByText('This account will be removed from MetaMask.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Make sure you have the Secret Recovery Phrase or private key for this account before removing.',
        ),
      ).toBeInTheDocument();
    });

    it('should not display remove account button for non-removable accounts', () => {
      const hdKeyTreeAccount = {
        ...MOCK_ACCOUNT_EOA,
        id: 'hd-account',
        metadata: {
          ...MOCK_ACCOUNT_EOA.metadata,
          name: 'HD Account',
          keyring: {
            type: KeyringType.hdKeyTree,
          },
        },
      };

      const state = createMockState(hdKeyTreeAccount.address, hdKeyTreeAccount);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={hdKeyTreeAccount.address}
            account={hdKeyTreeAccount}
          />
        </MemoryRouter>,
        store,
      );

      const removeButton = screen.queryByText('Remove account');
      expect(removeButton).not.toBeInTheDocument();

      const solanaAccount = {
        ...MOCK_ACCOUNT_SOLANA_MAINNET,
        id: 'solana-account',
        metadata: {
          ...MOCK_ACCOUNT_SOLANA_MAINNET.metadata,
          name: 'Solana Account',
          keyring: {
            type: KeyringType.snap,
          },
        },
      };

      const solanaState = createMockState(solanaAccount.address, solanaAccount);
      const solanaStore = mockStore(solanaState);

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={solanaAccount.address}
            account={solanaAccount}
          />
        </MemoryRouter>,
        solanaStore,
      );

      const solanaRemoveButton = screen.queryByText('Remove account');
      expect(solanaRemoveButton).not.toBeInTheDocument();
    });

    it('should not display remove account button for social login accounts', () => {
      const hardwareAccount = {
        ...MOCK_ACCOUNT_EOA,
        id: 'hardware-account',
        metadata: {
          ...MOCK_ACCOUNT_EOA.metadata,
          name: 'Hardware Account',
          keyring: {
            type: KeyringType.trezor,
          },
        },
      };

      const state = createMockState(hardwareAccount.address, hardwareAccount);
      const store = mockStore({
        ...state,
        metamask: {
          ...state.metamask,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      });

      renderWithProvider(
        <MemoryRouter>
          <BaseAccountDetails
            address={hardwareAccount.address}
            account={hardwareAccount}
          />
        </MemoryRouter>,
        store,
      );

      const removeButton = screen.queryByText('Remove account');
      expect(removeButton).not.toBeInTheDocument();
    });
  });
});
