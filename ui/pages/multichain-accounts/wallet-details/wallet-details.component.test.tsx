import '@testing-library/jest-dom';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { KeyringTypes } from '@metamask/keyring-controller';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import WalletDetails from './wallet-details.component';

// Types for mock components
type MockAccountItemProps = {
  account: {
    id: string;
    metadata: { name: string };
  };
  onClick: (account: { id: string; metadata: { name: string } }) => void;
  onBalanceUpdate: (accountId: string, balance: string) => void;
  className: string;
};

type MockCurrencyDisplayProps = {
  value: string;
};

type MockSRPQuizProps = {
  isOpen: boolean;
  onClose: () => void;
};

type WalletGroups = {
  [key: string]: {
    id: string;
    metadata: { name: string };
    accounts: MergedInternalAccount[];
  };
};

type WalletsMap = {
  [key: string]: {
    id: string;
    metadata: { name: string };
    groups: WalletGroups;
  };
};

// Consolidated mocks
jest.mock('react-router-dom', () => ({
  useHistory: jest.fn(),
  useParams: jest.fn(),
  useLocation: jest.fn(),
  matchPath: jest.fn(() => false),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  getWalletsWithAccounts: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  getMetaMaskHdKeyrings: jest.fn(),
  getInternalAccountByAddress: jest.fn(),
  getMetaMaskAccountsOrdered: jest.fn(),
  getMetaMaskKeyrings: jest.fn(),
  getUseBlockie: jest.fn(),
  getHDEntropyIndex: jest.fn(),
}));

jest.mock('../../../ducks/metamask/metamask', () => ({
  getIsPrimarySeedPhraseBackedUp: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  setAccountDetailsAddress: jest.fn(() => ({
    type: 'SET_ACCOUNT_DETAILS_ADDRESS',
  })),
  clearAccountDetails: jest.fn(() => ({
    type: 'CLEAR_ACCOUNT_DETAILS',
  })),
  hideWarning: jest.fn(() => ({
    type: 'HIDE_WARNING',
  })),
}));

// Simplified mock components
jest.mock(
  '../../../components/multichain/multichain-accounts/wallet-details-account-item/wallet-details-account-item',
  () => (props: MockAccountItemProps) => {
    setTimeout(
      () => props.onBalanceUpdate(props.account.id, '1000000000000000000'),
      0,
    );
    return (
      <div
        className={props.className}
        onClick={() => props.onClick(props.account)}
      >
        {props.account.metadata.name}
      </div>
    );
  },
);

jest.mock(
  '../../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component',
  () => (props: MockCurrencyDisplayProps) =>
    <div data-testid="mock-currency-display">{props.value}</div>,
);

jest.mock(
  '../../../components/app/srp-quiz-modal',
  () => (props: MockSRPQuizProps) =>
    props.isOpen ? (
      <div data-testid="mock-srp-quiz">
        <button onClick={props.onClose}>Close SRP Quiz</button>
      </div>
    ) : null,
);

describe('WalletDetails', () => {
  const mockHistory = { push: jest.fn(), goBack: jest.fn() };
  const mockParams = { id: 'test-wallet-id' };

  const WALLET_ID = 'keyring:test-wallet' as const;
  const ENTROPY_WALLET_ID = 'entropy:test-entropy-wallet' as const;
  const GROUP_ID = 'keyring:test-wallet:test-group' as const;
  const ENTROPY_GROUP_ID = 'entropy:test-entropy-wallet:test-group' as const;

  const mockAccount = {
    id: 'test-account-id',
    address: '0x123',
    type: 'eip155:eoa' as const,
    methods: [
      'personal_sign',
      'eth_signTransaction',
      'eth_signTypedData_v1',
      'eth_signTypedData_v3',
      'eth_signTypedData_v4',
    ],
    options: {},
    scopes: ['eip155:0'] as const,
    balance: '0x0',
    metadata: {
      name: 'Test Account',
      importTime: 0,
      keyring: { type: 'HD Key Tree' },
    },
    pinned: false,
    hidden: false,
    lastSelected: 0,
    active: true,
    keyring: { type: 'HD Key Tree' },
    label: null,
  } as MergedInternalAccount;

  const createMockWallet = (id: string, groups: WalletGroups) => ({
    id,
    metadata: { name: 'Test Wallet' },
    groups,
  });

  const mockWallet = createMockWallet(WALLET_ID, {
    [GROUP_ID]: {
      id: GROUP_ID,
      metadata: { name: 'Test Group' },
      accounts: [mockAccount],
    },
  });

  const mockEntropyWallet = createMockWallet(ENTROPY_WALLET_ID, {
    [ENTROPY_GROUP_ID]: {
      id: ENTROPY_GROUP_ID,
      metadata: { name: 'Test Group' },
      accounts: [mockAccount],
    },
  });

  const mockHdKeyring = {
    type: KeyringTypes.hd,
    accounts: ['0x123'],
    metadata: { id: 'test-entropy-wallet', name: 'HD Key Tree' },
  };

  // Helper functions
  const renderComponent = (customState = mockState) => {
    const store = configureStore(customState);
    return render(
      <Provider store={store}>
        <WalletDetails />
      </Provider>,
    );
  };

  const setupMocks = (
    wallets: WalletsMap = { 'test-wallet-id': mockWallet },
    seedPhraseBackedUp = true,
  ) => {
    const { getWalletsWithAccounts } = jest.requireMock(
      '../../../selectors/multichain-accounts/account-tree',
    );
    const {
      getMetaMaskHdKeyrings,
      getInternalAccountByAddress,
      getMetaMaskAccountsOrdered,
      getMetaMaskKeyrings,
      getUseBlockie,
      getHDEntropyIndex,
    } = jest.requireMock('../../../selectors');
    const { getIsPrimarySeedPhraseBackedUp } = jest.requireMock(
      '../../../ducks/metamask/metamask',
    );

    getWalletsWithAccounts.mockReturnValue(wallets);
    getMetaMaskHdKeyrings.mockReturnValue([mockHdKeyring]);
    getIsPrimarySeedPhraseBackedUp.mockReturnValue(seedPhraseBackedUp);
    getInternalAccountByAddress.mockReturnValue(mockAccount);
    getMetaMaskAccountsOrdered.mockReturnValue([mockAccount]);
    getMetaMaskKeyrings.mockReturnValue([mockHdKeyring]);
    getUseBlockie.mockReturnValue(false);
    getHDEntropyIndex.mockReturnValue(0);
  };

  const setupEntropyWalletTest = (seedPhraseBackedUp: boolean) => {
    (useParams as jest.Mock).mockReturnValue({
      id: 'entropy:test-entropy-wallet',
    });
    setupMocks(
      { 'entropy:test-entropy-wallet': mockEntropyWallet },
      seedPhraseBackedUp,
    );
    return renderComponent();
  };

  const clickSRPButton = (getByText: (text: string) => HTMLElement) => {
    const srpButton = getByText('secretRecoveryPhrase').parentElement
      ?.parentElement;
    if (!srpButton) {
      throw new Error('SRP button not found');
    }
    fireEvent.click(srpButton);
  };

  beforeEach(() => {
    (useHistory as jest.Mock).mockReturnValue(mockHistory);
    (useParams as jest.Mock).mockReturnValue(mockParams);
    (useLocation as jest.Mock).mockReturnValue({
      pathname: '/wallet-details/test-wallet-id',
    });
    setupMocks();
  });

  afterEach(() => jest.clearAllMocks());

  it('renders wallet details correctly', async () => {
    const { getByText, getByTestId, queryByText } = renderComponent();
    expect(getByText('Test Wallet')).toBeInTheDocument();
    expect(getByText('Test Account')).toBeInTheDocument();
    await waitFor(() => {
      expect(getByTestId('mock-currency-display').textContent).toBe(
        '1000000000000000000',
      );
    });
    // does not show backup reminder when seed phrase is backed up
    expect(queryByText('Backup')).not.toBeInTheDocument();
  });

  it('shows backup reminder for first HD keyring when not backed up', () => {
    (useParams as jest.Mock).mockReturnValue({
      id: 'entropy:test-entropy-wallet',
    });
    const customState = {
      ...mockState,
      metamask: { ...mockState.metamask, seedPhraseBackedUp: false },
    };
    setupMocks({ 'entropy:test-entropy-wallet': mockEntropyWallet }, false);
    const { getByText } = renderComponent(customState);
    expect(getByText('backup')).toBeInTheDocument();
  });

  it('navigates to backup route when SRP button is clicked and backup reminder is shown', () => {
    const { getByText } = setupEntropyWalletTest(false);
    clickSRPButton(getByText);
    expect(mockHistory.push).toHaveBeenCalledWith(
      '/onboarding/review-recovery-phrase/?isFromReminder=true',
    );
  });

  it('opens SRP quiz when SRP button is clicked and seed phrase is backed up', () => {
    const { getByText, getByTestId } = setupEntropyWalletTest(true);
    clickSRPButton(getByText);
    expect(mockHistory.push).not.toHaveBeenCalled();
    expect(getByTestId('mock-srp-quiz')).toBeInTheDocument();
  });

  // Individual edge case tests
  it('handles wallet with no accounts', () => {
    const testWallet = createMockWallet('test-wallet-id', {
      [GROUP_ID]: {
        id: GROUP_ID,
        metadata: { name: 'Test Group' },
        accounts: [],
      },
    });
    setupMocks({ 'test-wallet-id': testWallet });
    const { getByText } = renderComponent();
    expect(getByText('Test Wallet')).toBeInTheDocument();
  });

  it('handles wallet with no groups', () => {
    const testWallet = createMockWallet('test-wallet-id', {});
    setupMocks({ 'test-wallet-id': testWallet });
    const { getByText } = renderComponent();
    expect(getByText('Test Wallet')).toBeInTheDocument();
  });

  it('handles wallet with empty groups', () => {
    const testWallet = createMockWallet('test-wallet-id', {
      [GROUP_ID]: {
        id: GROUP_ID,
        metadata: { name: 'Test Group' },
        accounts: [],
      },
    });
    setupMocks({ 'test-wallet-id': testWallet });
    const { getByText } = renderComponent();
    expect(getByText('Test Wallet')).toBeInTheDocument();
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
});
