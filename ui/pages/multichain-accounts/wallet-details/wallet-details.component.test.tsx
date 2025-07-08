import '@testing-library/jest-dom';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { SolScope } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type {
  AccountGroupId,
  AccountWalletId,
} from '@metamask/account-tree-controller';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { getWalletsWithAccounts } from '../../../selectors/multichain-accounts/account-tree';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { getMetaMaskHdKeyrings } from '../../../selectors';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import WalletDetails from './wallet-details.component';

// Shared mock functions
const mockCreateAccount = jest.fn();
const mockAddNewAccount = jest.fn();
const mockSetAccountLabel = jest.fn();
const mockGetNextAvailableAccountName = jest.fn();

// Shared mock clients
const mockSolanaClient = { createAccount: mockCreateAccount };
const mockBitcoinClient = { createAccount: mockCreateAccount };

// Shared component mock factory
const createComponentMock =
  (tag: string) =>
  ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) =>
    React.createElement(tag, props, children);

// Consolidated mocks
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../hooks/accounts/useMultichainWalletSnapClient', () => ({
  WalletClientType: {
    Bitcoin: 'bitcoin-wallet-snap',
    Solana: 'solana-wallet-snap',
  },
  EVM_WALLET_TYPE: 'evm',
  useMultichainWalletSnapClient: jest.fn((clientType) => {
    if (clientType === 'solana-wallet-snap') {
      return mockSolanaClient;
    }
    if (clientType === 'bitcoin-wallet-snap') {
      return mockBitcoinClient;
    }
    return null;
  }),
}));

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

jest.mock('react-router-dom', () => ({
  useHistory: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  getWalletsWithAccounts: jest.fn(),
}));

jest.mock('../../../ducks/metamask/metamask', () => ({
  getIsPrimarySeedPhraseBackedUp: jest.fn(),
}));

// Consolidated component mocks
jest.mock('../../../components/component-library', () => ({
  Box: createComponentMock('div'),
  ButtonIcon: ({
    children,
    ariaLabel,
    ...props
  }: {
    children?: React.ReactNode;
    ariaLabel?: string;
    [key: string]: unknown;
  }) => {
    const buttonProps = { ...props };
    if (ariaLabel) {
      buttonProps['aria-label'] = ariaLabel;
    }
    return createComponentMock('button')({ children, ...buttonProps });
  },
  ButtonIconSize: { Sm: 'sm' },
  Icon: createComponentMock('span'),
  IconName: { ArrowLeft: 'arrow-left', ArrowRight: 'arrow-right', Add: 'add' },
  IconSize: { Sm: 'sm', Md: 'md' },
  IconColor: { iconAlternative: 'alternative', primaryDefault: 'primary' },
  Text: createComponentMock('span'),
  BannerAlert: createComponentMock('div'),
  BannerAlertSeverity: { Danger: 'danger' },
  Modal: ({
    children,
    isOpen,
    ...props
  }: {
    children?: React.ReactNode;
    isOpen?: boolean;
    [key: string]: unknown;
  }) => (isOpen ? <div {...props}>{children}</div> : null),
  ModalOverlay: createComponentMock('div'),
}));

jest.mock(
  '../../../components/component-library/modal-content/deprecated',
  () => ({
    ModalContent: createComponentMock('div'),
  }),
);

jest.mock('../../../components/component-library/modal-header', () => ({
  ModalHeader: ({
    children,
    onClose,
    ...props
  }: {
    children?: React.ReactNode;
    onClose?: () => void;
    [key: string]: unknown;
  }) => (
    <div {...props}>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('../../../components/multichain/pages/page', () => ({
  Content: createComponentMock('div'),
  Header: ({
    children,
    startAccessory,
    ...props
  }: {
    children?: React.ReactNode;
    startAccessory?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div {...props}>
      {startAccessory}
      {children}
    </div>
  ),
  Page: createComponentMock('div'),
}));

jest.mock(
  '../../../components/multichain/multichain-accounts/wallet-details-account-item/wallet-details-account-item',
  () =>
    ({
      account,
      onClick,
      className,
    }: {
      account: InternalAccount;
      onClick: (account: InternalAccount) => void;
      className: string;
    }) => (
      <div
        data-testid="mock-account-item"
        onClick={() => onClick(account)}
        className={className}
      >
        {account.metadata.name}
      </div>
    ),
);

jest.mock(
  '../../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component',
  () =>
    ({ value }: { value: string }) => (
      <div data-testid="mock-currency-display">{value}</div>
    ),
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
    WalletDetailsAccountTypeSelection: ({
      onAccountTypeSelect,
      onClose,
    }: {
      onAccountTypeSelect: (accountType: string) => void;
      onClose: () => void;
    }) => (
      <div data-testid="mock-account-type-selection">
        <button
          data-testid="select-ethereum-account"
          onClick={() => onAccountTypeSelect('evm')}
        >
          Ethereum Account
        </button>
        <button
          data-testid="select-solana-account"
          onClick={() => onAccountTypeSelect('solana-wallet-snap')}
        >
          Solana Account
        </button>
        <button
          data-testid="select-bitcoin-account"
          onClick={() => onAccountTypeSelect('bitcoin-wallet-snap')}
        >
          Bitcoin Account
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ),
  }),
);

describe('WalletDetails', () => {
  const mockHistory = { push: jest.fn(), goBack: jest.fn() };
  const mockParams = { id: 'entropy:test-wallet' };
  const GROUP_ID = 'entropy:test-wallet:default' as unknown as AccountGroupId;

  // Helper functions
  const createMockWallet = (id: string, groups: Record<string, unknown>) => ({
    id: id as unknown as AccountWalletId,
    metadata: { name: 'Test Wallet' },
    groups,
  });

  const createMockConsolidatedAccountGroup = (
    groupId: string,
    accounts: InternalAccount[],
  ) => ({
    id: groupId as unknown as AccountGroupId,
    metadata: { name: 'Test Group' },
    accounts,
  });

  const setupMocks = (wallets: Record<string, unknown> = {}) => {
    const mockAccount = createMockInternalAccount({
      address: '0x123',
      name: 'Test Account',
    });
    const defaultWallet = createMockWallet('entropy:test-wallet', {
      [GROUP_ID]: createMockConsolidatedAccountGroup(GROUP_ID, [mockAccount]),
    });
    const mockWallets = {
      ['entropy:test-wallet' as unknown as AccountWalletId]: defaultWallet,
      ...wallets,
    };

    (
      getWalletsWithAccounts as jest.MockedFunction<
        typeof getWalletsWithAccounts
      >
    ).mockReturnValue(
      mockWallets as unknown as ReturnType<typeof getWalletsWithAccounts>,
    );
    (getMetaMaskHdKeyrings as jest.Mock).mockReturnValue([
      { metadata: { id: 'test-wallet' } },
    ]);
    (getIsPrimarySeedPhraseBackedUp as jest.Mock).mockReturnValue(true);
  };

  const setupEntropyWalletTest = (isFirstHdKeyring: boolean = false) => {
    const entropyGroupId =
      'entropy:test-entropy-wallet:default' as unknown as AccountGroupId;
    const entropyWallet = createMockWallet('entropy:test-entropy-wallet', {
      [entropyGroupId]: createMockConsolidatedAccountGroup(entropyGroupId, [
        createMockInternalAccount({
          address: '0x123',
          name: 'Test Account',
        }),
      ]),
    });

    (
      getWalletsWithAccounts as jest.MockedFunction<
        typeof getWalletsWithAccounts
      >
    ).mockReturnValue({
      ['entropy:test-entropy-wallet' as unknown as AccountWalletId]:
        entropyWallet,
    } as unknown as ReturnType<typeof getWalletsWithAccounts>);

    (getMetaMaskHdKeyrings as jest.Mock).mockReturnValue([
      {
        metadata: {
          id: isFirstHdKeyring ? 'test-entropy-wallet' : 'other-wallet',
        },
      },
    ]);
    (getIsPrimarySeedPhraseBackedUp as jest.Mock).mockReturnValue(false);
    (useParams as jest.Mock).mockReturnValue({
      id: 'entropy:test-entropy-wallet',
    });

    return render(
      <Provider store={configureStore(mockState)}>
        <WalletDetails />
      </Provider>,
    );
  };

  const renderComponent = () =>
    render(
      <Provider store={configureStore(mockState)}>
        <WalletDetails />
      </Provider>,
    );

  beforeEach(() => {
    (useHistory as jest.Mock).mockReturnValue(mockHistory);
    (useParams as jest.Mock).mockReturnValue(mockParams);
    setupMocks();
    [
      mockAddNewAccount,
      mockSetAccountLabel,
      mockGetNextAvailableAccountName,
      mockCreateAccount,
    ].forEach((mock) => mock.mockClear());
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

  describe('Add Account Button', () => {
    it('renders add account button when wallet has accounts', () => {
      const { getByText } = renderComponent();
      expect(getByText('addAccount')).toBeInTheDocument();
    });

    it('does not render add account button when wallet has no accounts', () => {
      const testWallet = createMockWallet('entropy:test-wallet', {
        [GROUP_ID]: createMockConsolidatedAccountGroup(GROUP_ID, []),
      });
      setupMocks({
        ['entropy:test-wallet' as unknown as AccountWalletId]: testWallet,
      });
      const { queryByText } = renderComponent();
      expect(queryByText('addAccount')).not.toBeInTheDocument();
    });

    it('opens account type selection modal when add account button is clicked', () => {
      const { getByText, getByTestId } = renderComponent();
      fireEvent.click(getByText('addAccount'));
      expect(getByTestId('mock-account-type-selection')).toBeInTheDocument();
    });

    it('creates Ethereum account directly when Ethereum button is clicked', async () => {
      const mockNewAccount = { address: '0x456', id: 'new-account-id' };
      mockAddNewAccount.mockResolvedValue(mockNewAccount);

      const { getByText, getByTestId, queryByTestId } = renderComponent();
      fireEvent.click(getByText('addAccount'));
      fireEvent.click(getByTestId('select-ethereum-account'));

      await waitFor(() => {
        expect(mockAddNewAccount).toHaveBeenCalledWith('test-wallet');
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
      fireEvent.click(getByText('addAccount'));
      fireEvent.click(getByTestId('select-ethereum-account'));

      await waitFor(() => {
        expect(mockAddNewAccount).toHaveBeenCalledWith('test-wallet');
        expect(mockSetAccountLabel).not.toHaveBeenCalled();
      });
    });

    it('uses correct keyringId for entropy wallets', async () => {
      const mockNewAccount = { address: '0x456', id: 'new-account-id' };
      mockAddNewAccount.mockResolvedValue(mockNewAccount);
      mockGetNextAvailableAccountName.mockResolvedValue('Account 2');

      const { getByText, getByTestId } = setupEntropyWalletTest(true);
      fireEvent.click(getByText('addAccount'));
      fireEvent.click(getByTestId('select-ethereum-account'));

      await waitFor(() => {
        expect(mockAddNewAccount).toHaveBeenCalledWith('test-entropy-wallet');
      });
    });

    it('creates Solana account directly when Solana button is clicked', async () => {
      const { getByText, getByTestId, queryByTestId } = renderComponent();
      fireEvent.click(getByText('addAccount'));
      fireEvent.click(getByTestId('select-solana-account'));

      await waitFor(() => {
        expect(mockCreateAccount).toHaveBeenCalledWith(
          { scope: SolScope.Mainnet, entropySource: 'test-wallet' },
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
