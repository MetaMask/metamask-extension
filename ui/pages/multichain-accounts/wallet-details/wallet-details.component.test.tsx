import '@testing-library/jest-dom';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { KeyringTypes } from '@metamask/keyring-controller';
import configureStore from '../../../store/store';
import type { ConsolidatedWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import mockState from '../../../../test/data/mock-state.json';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import WalletDetails from './wallet-details.component';

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
  getSeedPhraseBackedUp: jest.fn(),
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

jest.mock(
  '../../../components/multichain/multichain-accounts/wallet-details-account-item/wallet-details-account-item',
  () => {
    return function MockWalletDetailsAccountItem(props: {
      account: {
        id: string;
        address: string;
        metadata: { name: string };
      };
      onClick: (account: {
        id: string;
        address: string;
        metadata: { name: string };
      }) => void;
      onBalanceUpdate: (accountId: string, balance: string) => void;
      className: string;
    }) {
      const { account, onClick, onBalanceUpdate, className } = props;

      // Simulate async balance update
      setTimeout(() => {
        onBalanceUpdate(account.id, '1000000000000000000');
      }, 0);

      return (
        <div className={className} onClick={() => onClick(account)}>
          {account.metadata.name}
        </div>
      );
    };
  },
);

jest.mock(
  '../../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component',
  () => {
    return function MockUserPreferencedCurrencyDisplay(props: {
      value: string;
      type: string;
      ethNumberOfDecimals: number;
      hideTitle: boolean;
      showFiat: boolean;
      isAggregatedFiatOverviewBalance: boolean;
      hideLabel: boolean;
      textProps: { color: string; variant: string };
    }) {
      return <div data-testid="mock-currency-display">{props.value}</div>;
    };
  },
);

describe('WalletDetails', () => {
  const mockHistory = {
    push: jest.fn(),
    goBack: jest.fn(),
  };

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

  const mockWallet: ConsolidatedWallets[typeof WALLET_ID] = {
    id: WALLET_ID,
    metadata: {
      name: 'Test Wallet',
    },
    groups: {
      [GROUP_ID]: {
        id: GROUP_ID,
        metadata: {
          name: 'Test Group',
        },
        accounts: [mockAccount],
      },
    },
  };

  const mockEntropyWallet: ConsolidatedWallets[typeof ENTROPY_WALLET_ID] = {
    id: ENTROPY_WALLET_ID,
    metadata: {
      name: 'Test Entropy Wallet',
    },
    groups: {
      [ENTROPY_GROUP_ID]: {
        id: ENTROPY_GROUP_ID,
        metadata: {
          name: 'Test Group',
        },
        accounts: [mockAccount],
      },
    },
  };

  const mockHdKeyring = {
    type: KeyringTypes.hd,
    accounts: ['0x123'],
    metadata: { id: ENTROPY_WALLET_ID, name: 'HD Key Tree' },
  };

  const renderComponent = (customState = mockState) => {
    const store = configureStore(customState);
    return render(
      <Provider store={store}>
        <WalletDetails />
      </Provider>,
    );
  };

  beforeEach(() => {
    (useHistory as jest.Mock).mockReturnValue(mockHistory);
    (useParams as jest.Mock).mockReturnValue(mockParams);
    (useLocation as jest.Mock).mockReturnValue({
      pathname: '/wallet-details/test-wallet-id',
    });

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
    const { getSeedPhraseBackedUp } = jest.requireMock(
      '../../../ducks/metamask/metamask',
    );

    getWalletsWithAccounts.mockReturnValue({
      'test-wallet-id': mockWallet,
      'test-wallet-id-entropy': mockEntropyWallet,
    });
    getMetaMaskHdKeyrings.mockReturnValue([mockHdKeyring]);
    getSeedPhraseBackedUp.mockReturnValue(true);

    // Mock selectors used by AccountDetails
    getInternalAccountByAddress.mockReturnValue(mockAccount);
    getMetaMaskAccountsOrdered.mockReturnValue([mockAccount]);
    getMetaMaskKeyrings.mockReturnValue([mockHdKeyring]);
    getUseBlockie.mockReturnValue(false);
    getHDEntropyIndex.mockReturnValue(0);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders wallet details correctly', () => {
    const { getByText } = renderComponent();

    expect(getByText('Test Wallet')).toBeInTheDocument();
    expect(getByText('Test Account')).toBeInTheDocument();
  });

  it('shows backup reminder for first HD keyring when not backed up', () => {
    (useParams as jest.Mock).mockReturnValue({
      id: 'entropy:test-entropy-wallet',
    });

    const customState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        seedPhraseBackedUp: false,
      },
    };

    const entropyHdKeyring = {
      type: KeyringTypes.hd,
      accounts: ['0x123'],
      metadata: { id: 'test-entropy-wallet', name: 'HD Key Tree' },
    };

    const { getWalletsWithAccounts } = jest.requireMock(
      '../../../selectors/multichain-accounts/account-tree',
    );
    const { getMetaMaskHdKeyrings } = jest.requireMock('../../../selectors');
    const { getSeedPhraseBackedUp } = jest.requireMock(
      '../../../ducks/metamask/metamask',
    );

    getWalletsWithAccounts.mockReturnValue({
      'entropy:test-entropy-wallet': mockEntropyWallet,
    });
    getMetaMaskHdKeyrings.mockReturnValue([entropyHdKeyring]);
    getSeedPhraseBackedUp.mockReturnValue(false);

    const { getByText } = renderComponent(customState);

    // Look for the actual backup text that appears in the component
    expect(getByText('backup')).toBeInTheDocument();
  });

  it('does not show backup reminder when seed phrase is backed up', () => {
    const { queryByText } = renderComponent();

    expect(queryByText('Backup')).not.toBeInTheDocument();
  });

  it('handles wallet with no accounts', () => {
    const emptyWallet = {
      ...mockWallet,
      groups: {
        [GROUP_ID]: {
          id: GROUP_ID,
          metadata: { name: 'Test Group' },
          accounts: [],
        },
      },
      metadata: {
        name: 'Test Wallet',
      },
    };
    const { getWalletsWithAccounts } = jest.requireMock(
      '../../../selectors/multichain-accounts/account-tree',
    );
    getWalletsWithAccounts.mockReturnValue({
      'test-wallet-id': emptyWallet,
    });

    const { getByText } = renderComponent();

    expect(getByText('Test Wallet')).toBeInTheDocument();
  });

  it('handles wallet with no groups', () => {
    const noGroupsWallet = {
      ...mockWallet,
      groups: {},
      metadata: {
        name: 'Test Wallet',
      },
    };
    const { getWalletsWithAccounts } = jest.requireMock(
      '../../../selectors/multichain-accounts/account-tree',
    );
    getWalletsWithAccounts.mockReturnValue({
      'test-wallet-id': noGroupsWallet,
    });

    const { getByText } = renderComponent();

    expect(getByText('Test Wallet')).toBeInTheDocument();
  });

  it('handles wallet with empty groups', () => {
    const emptyGroupsWallet = {
      ...mockWallet,
      groups: {
        [GROUP_ID]: {
          id: GROUP_ID,
          metadata: { name: 'Test Group' },
          accounts: [],
        },
      },
      metadata: {
        name: 'Test Wallet',
      },
    };
    const { getWalletsWithAccounts } = jest.requireMock(
      '../../../selectors/multichain-accounts/account-tree',
    );
    getWalletsWithAccounts.mockReturnValue({
      'test-wallet-id': emptyGroupsWallet,
    });

    const { getByText } = renderComponent();

    expect(getByText('Test Wallet')).toBeInTheDocument();
  });

  it('handles wallet with undefined accounts', () => {
    const undefinedAccountsWallet = {
      ...mockWallet,
      groups: {
        [GROUP_ID]: {
          id: GROUP_ID,
          metadata: { name: 'Test Group' },
          accounts: [],
        },
      },
      metadata: {
        name: 'Test Wallet',
      },
    };
    const { getWalletsWithAccounts } = jest.requireMock(
      '../../../selectors/multichain-accounts/account-tree',
    );
    getWalletsWithAccounts.mockReturnValue({
      'test-wallet-id': undefinedAccountsWallet,
    });

    const { getByText } = renderComponent();

    expect(getByText('Test Wallet')).toBeInTheDocument();
  });

  it('dispatches setAccountDetailsAddress when account is clicked', () => {
    const { getByText } = renderComponent();
    const { setAccountDetailsAddress } = jest.requireMock(
      '../../../store/actions',
    );

    const accountElement = getByText('Test Account');
    fireEvent.click(accountElement);

    expect(setAccountDetailsAddress).toHaveBeenCalledWith('0x123');
  });

  it('navigates back when back button is clicked', () => {
    const { getByLabelText } = renderComponent();

    const backButton = getByLabelText('back');
    fireEvent.click(backButton);

    expect(mockHistory.goBack).toHaveBeenCalled();
  });

  it('calculates total balance correctly', async () => {
    const { getByTestId } = renderComponent();

    // Wait for the async balance update to complete
    await waitFor(() => {
      const currencyDisplay = getByTestId('mock-currency-display');
      expect(currencyDisplay.textContent).toBe('1000000000000000000');
    });
  });
});
