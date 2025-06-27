import '@testing-library/jest-dom';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { SolScope, BtcScope } from '@metamask/keyring-api';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { getWalletsWithAccounts } from '../../../selectors/multichain-accounts/account-tree';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { getMetaMaskHdKeyrings } from '../../../selectors';
import WalletDetails from './wallet-details.component';

// Mock the useI18nContext hook
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

// Mock the WalletClientType enum and useMultichainWalletSnapClient hook
const mockCreateAccount = jest.fn();
const mockSolanaClient = {
  createAccount: mockCreateAccount,
};
const mockBitcoinClient = {
  createAccount: mockCreateAccount,
};

jest.mock('../../../hooks/accounts/useMultichainWalletSnapClient', () => ({
  WalletClientType: {
    Bitcoin: 'bitcoin-wallet-snap',
    Solana: 'solana-wallet-snap',
  },
  useMultichainWalletSnapClient: jest.fn((clientType) => {
    if (clientType === 'solana-wallet-snap') {
      return mockSolanaClient;
    } else if (clientType === 'bitcoin-wallet-snap') {
      return mockBitcoinClient;
    }
    return null;
  }),
}));

const mockAddNewAccount = jest.fn();
const mockSetAccountLabel = jest.fn();
const mockGetNextAvailableAccountName = jest.fn();

jest.mock('../../../store/actions', () => ({
  setAccountDetailsAddress: jest.fn(() => ({
    type: 'SET_ACCOUNT_DETAILS_ADDRESS',
  })),
  addNewAccount:
    (...args: unknown[]) =>
    () =>
      mockAddNewAccount(...args),
  setAccountLabel:
    (...args: unknown[]) =>
    () =>
      mockSetAccountLabel(...args),
  getNextAvailableAccountName: (...args: unknown[]) =>
    mockGetNextAvailableAccountName(...args),
}));

jest.mock('../../../selectors', () => ({
  getMetaMaskHdKeyrings: jest.fn(),
  getIsBitcoinSupportEnabled: jest.fn(() => true),
  getIsSolanaSupportEnabled: jest.fn(() => true),
}));

type Account = {
  id: string;
  address: string;
  metadata: { name: string };
};

type MockAccountItemProps = {
  account: Account;
  onClick: (account: Account) => void;
  onBalanceUpdate: (accountId: string, balance: string) => void;
  className: string;
};

type MockAccountTypeSelectionProps = {
  onAccountTypeSelect: (accountType: string) => void;
  onClose: () => void;
};

type WalletGroups = {
  [groupId: string]: {
    id: string;
    metadata: { name: string };
    accounts: Account[];
  };
};

type WalletsMap = {
  [walletId: string]: {
    id: string;
    metadata: { name: string };
    groups: WalletGroups;
  };
};

type ComponentProps = {
  children?: React.ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  onClose?: () => void;
  isOpen?: boolean;
  startAccessory?: React.ReactNode;
  name?: string;
  ariaLabel?: string;
  [key: string]: unknown;
};

// Basic mocks
jest.mock('react-router-dom', () => ({
  useHistory: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  getWalletsWithAccounts: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  getMetaMaskHdKeyrings: jest.fn(),
}));

jest.mock('../../../ducks/metamask/metamask', () => ({
  getIsPrimarySeedPhraseBackedUp: jest.fn(),
}));

// Simple component mocks
jest.mock('../../../components/component-library', () => ({
  Box: ({ children, ...props }: ComponentProps) => (
    <div {...props}>{children}</div>
  ),
  ButtonIcon: ({ onClick, children, ariaLabel, ...props }: ComponentProps) => (
    <button onClick={onClick} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  ),
  ButtonIconSize: { Sm: 'sm' },
  Icon: ({ name, ...props }: ComponentProps) => <span {...props}>{name}</span>,
  IconName: { ArrowLeft: 'arrow-left', ArrowRight: 'arrow-right', Add: 'add' },
  IconSize: { Sm: 'sm', Md: 'md' },
  IconColor: { iconAlternative: 'alternative', primaryDefault: 'primary' },
  Text: ({ children, ...props }: ComponentProps) => (
    <span {...props}>{children}</span>
  ),
  BannerAlert: ({ children, ...props }: ComponentProps) => (
    <div {...props}>{children}</div>
  ),
  BannerAlertSeverity: { Danger: 'danger' },
  Modal: ({ children, isOpen, ...props }: ComponentProps) =>
    isOpen ? <div {...props}>{children}</div> : null,
  ModalOverlay: ({ ...props }: ComponentProps) => <div {...props} />,
}));

jest.mock(
  '../../../components/component-library/modal-content/deprecated',
  () => ({
    ModalContent: ({ children, ...props }: ComponentProps) => (
      <div {...props}>{children}</div>
    ),
  }),
);

jest.mock('../../../components/component-library/modal-header', () => ({
  ModalHeader: ({ children, onClose, ...props }: ComponentProps) => (
    <div {...props}>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('../../../components/multichain/pages/page', () => ({
  Content: ({ children, ...props }: ComponentProps) => (
    <div {...props}>{children}</div>
  ),
  Header: ({ children, startAccessory, ...props }: ComponentProps) => (
    <div {...props}>
      {startAccessory}
      {children}
    </div>
  ),
  Page: ({ children, ...props }: ComponentProps) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock(
  '../../../components/multichain/multichain-accounts/wallet-details-account-item/wallet-details-account-item',
  () => (props: MockAccountItemProps) => {
    return (
      <div
        data-testid="mock-account-item"
        onClick={() => props.onClick(props.account)}
        className={props.className}
      >
        {props.account.metadata.name}
      </div>
    );
  },
);

jest.mock(
  '../../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component',
  () =>
    ({ value }: { value: string }) =>
      <div data-testid="mock-currency-display">{value}</div>,
);

jest.mock(
  '../../../components/app/srp-quiz-modal',
  () =>
    ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
      isOpen ? (
        <div data-testid="mock-srp-quiz">
          <button onClick={onClose}>Close SRP Quiz</button>
        </div>
      ) : null,
);

jest.mock(
  '../../../components/multichain/multichain-accounts/wallet-details-account-type-selection',
  () => ({
    WalletDetailsAccountTypeSelection: (
      props: MockAccountTypeSelectionProps,
    ) => (
      <div data-testid="mock-account-type-selection">
        <button
          data-testid="select-ethereum-account"
          onClick={() => props.onAccountTypeSelect('EVM')}
        >
          Ethereum Account
        </button>
        <button
          data-testid="select-solana-account"
          onClick={() => props.onAccountTypeSelect('solana-wallet-snap')}
        >
          Solana Account
        </button>
        <button
          data-testid="select-bitcoin-account"
          onClick={() => props.onAccountTypeSelect('bitcoin-wallet-snap')}
        >
          Bitcoin Account
        </button>
        <button onClick={props.onClose}>Close</button>
      </div>
    ),
  }),
);

describe('WalletDetails', () => {
  const mockHistory = { push: jest.fn(), goBack: jest.fn() };
  const mockParams = { id: 'wallet:test-wallet' };
  const GROUP_ID = 'wallet:test-wallet:default';

  const createMockWallet = (id: string, groups: WalletGroups) => ({
    id,
    metadata: { name: 'Test Wallet' },
    groups,
  });

  const createMockAccount = (
    id: string,
    address: string,
    name: string,
  ): Account => ({
    id,
    address,
    metadata: { name },
  });

  const setupMocks = (wallets: WalletsMap = {}) => {
    const defaultWallet = createMockWallet('wallet:test-wallet', {
      [GROUP_ID]: {
        id: GROUP_ID,
        metadata: { name: 'Test Group' },
        accounts: [createMockAccount('account-1', '0x123', 'Test Account')],
      },
    });

    const mockWallets = {
      'wallet:test-wallet': defaultWallet,
      ...wallets,
    };

    (
      getWalletsWithAccounts as jest.MockedFunction<
        typeof getWalletsWithAccounts
      >
    ).mockReturnValue(mockWallets);
    (getMetaMaskHdKeyrings as jest.Mock).mockReturnValue([
      { metadata: { id: 'test-wallet' } },
    ]);
    (getIsPrimarySeedPhraseBackedUp as jest.Mock).mockReturnValue(true);
  };

  const setupEntropyWalletTest = (isFirstHdKeyring: boolean = false) => {
    const entropyWallet = createMockWallet('wallet:test-entropy-wallet', {
      [GROUP_ID]: {
        id: GROUP_ID,
        metadata: { name: 'Test Group' },
        accounts: [createMockAccount('account-1', '0x123', 'Test Account')],
      },
    });

    const mockWallets = {
      'wallet:test-entropy-wallet': entropyWallet,
    };

    (
      getWalletsWithAccounts as jest.MockedFunction<
        typeof getWalletsWithAccounts
      >
    ).mockReturnValue(mockWallets);
    (getMetaMaskHdKeyrings as jest.Mock).mockReturnValue([
      {
        metadata: {
          id: isFirstHdKeyring ? 'test-entropy-wallet' : 'other-wallet',
        },
      },
    ]);
    (getIsPrimarySeedPhraseBackedUp as jest.Mock).mockReturnValue(false);

    const entropyMockParams = { id: 'wallet:test-entropy-wallet' };
    (useParams as jest.Mock).mockReturnValue(entropyMockParams);

    return render(
      <Provider store={configureStore(mockState)}>
        <WalletDetails />
      </Provider>,
    );
  };

  const renderComponent = () => {
    return render(
      <Provider store={configureStore(mockState)}>
        <WalletDetails />
      </Provider>,
    );
  };

  beforeEach(() => {
    (useHistory as jest.Mock).mockReturnValue(mockHistory);
    (useParams as jest.Mock).mockReturnValue(mockParams);
    setupMocks();

    // Reset action mocks
    mockAddNewAccount.mockClear();
    mockSetAccountLabel.mockClear();
    mockGetNextAvailableAccountName.mockClear();
    mockCreateAccount.mockClear();

    // Mock console.error to prevent error logs during tests
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    (console.error as jest.Mock).mockRestore();
  });

  it('renders wallet details correctly', () => {
    const { getByText } = renderComponent();
    expect(getByText('Test Wallet')).toBeInTheDocument();
    expect(getByText('Test Account')).toBeInTheDocument();
  });

  it('shows SRP button for entropy wallets', () => {
    const { getByText } = setupEntropyWalletTest();
    expect(getByText('secretRecoveryPhrase')).toBeInTheDocument();
  });

  it('opens SRP quiz modal when SRP button is clicked', () => {
    const { getByText, getByTestId } = setupEntropyWalletTest();
    fireEvent.click(getByText('secretRecoveryPhrase'));
    expect(getByTestId('mock-srp-quiz')).toBeInTheDocument();
  });

  it('dispatches setAccountDetailsAddress when account is clicked', () => {
    const { getByText } = renderComponent();
    const { setAccountDetailsAddress } = jest.requireMock(
      '../../../store/actions',
    );
    fireEvent.click(getByText('Test Account'));
    expect(setAccountDetailsAddress).toHaveBeenCalledWith('0x123');
  });

  it('navigates back when back button is clicked', () => {
    const { getByLabelText } = renderComponent();
    fireEvent.click(getByLabelText('back'));
    expect(mockHistory.goBack).toHaveBeenCalled();
  });

  // Add Account Button Tests
  describe('Add Account Button', () => {
    it('renders add account button when wallet has accounts', () => {
      const { getByText } = renderComponent();
      expect(getByText('addAccount')).toBeInTheDocument();
    });

    it('does not render add account button when wallet has no accounts', () => {
      const testWallet = createMockWallet('wallet:test-wallet', {
        [GROUP_ID]: {
          id: GROUP_ID,
          metadata: { name: 'Test Group' },
          accounts: [],
        },
      });
      setupMocks({ 'wallet:test-wallet': testWallet });
      const { queryByText } = renderComponent();
      expect(queryByText('addAccount')).not.toBeInTheDocument();
    });

    it('opens account type selection modal when add account button is clicked', () => {
      const { getByText, getByTestId } = renderComponent();
      const addAccountButton = getByText('addAccount');
      fireEvent.click(addAccountButton);
      expect(getByTestId('mock-account-type-selection')).toBeInTheDocument();
    });

    it('closes modal when cancel button is clicked in account type selection', async () => {
      const { getByText, getByTestId, queryByTestId } = renderComponent();

      // Open modal
      const addAccountButton = getByText('addAccount');
      fireEvent.click(addAccountButton);
      expect(getByTestId('mock-account-type-selection')).toBeInTheDocument();

      // Close modal
      const closeButton = getByTestId(
        'mock-account-type-selection',
      ).querySelector('button:last-child');
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      await waitFor(() => {
        expect(
          queryByTestId('mock-account-type-selection'),
        ).not.toBeInTheDocument();
      });
    });

    it('creates Ethereum account directly when Ethereum button is clicked', async () => {
      const mockNewAccount = {
        address: '0x456',
        id: 'new-account-id',
      };
      mockAddNewAccount.mockResolvedValue(mockNewAccount);
      mockGetNextAvailableAccountName.mockResolvedValue('Account 2');

      const { getByText, getByTestId, queryByTestId } = renderComponent();

      // Open modal and select Ethereum
      const addAccountButton = getByText('addAccount');
      fireEvent.click(addAccountButton);
      const ethereumButton = getByTestId('select-ethereum-account');
      fireEvent.click(ethereumButton);

      await waitFor(() => {
        expect(mockAddNewAccount).toHaveBeenCalledWith('test-wallet');
        expect(mockSetAccountLabel).toHaveBeenCalledWith('0x456', 'Account 2');
        expect(
          queryByTestId('mock-account-type-selection'),
        ).not.toBeInTheDocument();
      });
    });

    it('handles Ethereum account creation error gracefully', async () => {
      const error = new Error('Account creation failed');
      mockAddNewAccount.mockRejectedValue(error);
      mockGetNextAvailableAccountName.mockResolvedValue('Account 2');

      const { getByText, getByTestId } = renderComponent();

      // Open modal and select Ethereum
      const addAccountButton = getByText('addAccount');
      fireEvent.click(addAccountButton);
      const ethereumButton = getByTestId('select-ethereum-account');
      fireEvent.click(ethereumButton);

      await waitFor(() => {
        expect(mockAddNewAccount).toHaveBeenCalledWith('test-wallet');
        // Should not call setAccountLabel when account creation fails
        expect(mockSetAccountLabel).not.toHaveBeenCalled();
      });
    });

    it('uses correct keyringId for entropy wallets', async () => {
      const mockNewAccount = {
        address: '0x456',
        id: 'new-account-id',
      };
      mockAddNewAccount.mockResolvedValue(mockNewAccount);
      mockGetNextAvailableAccountName.mockResolvedValue('Account 2');

      const { getByText, getByTestId } = setupEntropyWalletTest(true);

      // Open modal and select Ethereum
      const addAccountButton = getByText('addAccount');
      fireEvent.click(addAccountButton);
      const ethereumButton = getByTestId('select-ethereum-account');
      fireEvent.click(ethereumButton);

      await waitFor(() => {
        expect(mockAddNewAccount).toHaveBeenCalledWith('test-entropy-wallet');
      });
    });

    it('creates Solana account directly when Solana button is clicked', async () => {
      const { getByText, getByTestId, queryByTestId } = renderComponent();

      // Open modal and select Solana
      const addAccountButton = getByText('addAccount');
      fireEvent.click(addAccountButton);
      const solanaButton = getByTestId('select-solana-account');
      fireEvent.click(solanaButton);

      await waitFor(() => {
        expect(mockCreateAccount).toHaveBeenCalledWith(
          {
            scope: SolScope.Mainnet,
            entropySource: 'test-wallet',
          },
          {
            displayConfirmation: false,
            displayAccountNameSuggestion: false,
            setSelectedAccount: false,
          },
        );
        expect(
          queryByTestId('mock-account-type-selection'),
        ).not.toBeInTheDocument();
      });
    });

    it('creates Bitcoin account directly when Bitcoin button is clicked', async () => {
      const { getByText, getByTestId, queryByTestId } = renderComponent();

      // Open modal and select Bitcoin
      const addAccountButton = getByText('addAccount');
      fireEvent.click(addAccountButton);
      const bitcoinButton = getByTestId('select-bitcoin-account');
      fireEvent.click(bitcoinButton);

      await waitFor(() => {
        expect(mockCreateAccount).toHaveBeenCalledWith(
          {
            scope: BtcScope.Mainnet,
            entropySource: 'test-wallet',
          },
          {
            displayConfirmation: false,
            displayAccountNameSuggestion: false,
            setSelectedAccount: false,
          },
        );
        expect(
          queryByTestId('mock-account-type-selection'),
        ).not.toBeInTheDocument();
      });
    });
  });
});
