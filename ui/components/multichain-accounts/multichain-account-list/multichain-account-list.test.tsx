import React from 'react';
import { screen } from '@testing-library/react';
import {
  AccountGroupType,
  AccountWalletType,
  toAccountWalletId,
  toDefaultAccountGroupId,
} from '@metamask/account-api';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  MultichainAccountList,
  MultichainAccountListProps,
} from './multichain-account-list';

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: () => ({
      push: mockHistoryPush,
    }),
  };
});

jest.mock('../../../store/actions', () => {
  const actualActions = jest.requireActual('../../../store/actions');
  const mockSetSelectedMultichainAccount = jest.fn().mockImplementation(() => {
    return async function () {
      await Promise.resolve();
    };
  });

  return {
    ...actualActions,
    setSelectedMultichainAccount: mockSetSelectedMultichainAccount,
  };
});

const mockSetSelectedMultichainAccount = jest.requireMock(
  '../../../store/actions',
).setSelectedMultichainAccount;
const mockWalletOneEntropySource = '01JKAF3DSGM3AB87EM9N0K41AJ';
const mockWalletTwoEntropySource = '01JKAF3PJ247KAM6C03G5Q0NP8';

const walletOneId = toAccountWalletId(
  AccountWalletType.Entropy,
  mockWalletOneEntropySource,
);
const walletOneGroupId = toDefaultAccountGroupId(walletOneId);
const walletTwoId = toAccountWalletId(
  AccountWalletType.Entropy,
  mockWalletTwoEntropySource,
);
const walletTwoGroupId = toDefaultAccountGroupId(walletTwoId);

const mockWallets = {
  [walletOneId]: {
    id: walletOneId,
    type: AccountWalletType.Entropy,
    metadata: {
      name: 'Wallet 1',
      entropy: {
        id: mockWalletOneEntropySource,
      },
    },
    groups: {
      [walletOneGroupId]: {
        id: walletOneGroupId,
        type: AccountGroupType.MultichainAccount,
        metadata: {
          name: 'Account 1 from wallet 1',
          entropy: {
            groupIndex: 0,
          },
          pinned: false,
          hidden: false,
        },
        accounts: ['cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'],
      },
    },
  },
  [walletTwoId]: {
    id: walletTwoId,
    type: AccountWalletType.Entropy,
    metadata: {
      name: 'Wallet 2',
      entropy: {
        id: mockWalletTwoEntropySource,
      },
    },
    groups: {
      [walletTwoGroupId]: {
        id: walletTwoGroupId,
        type: AccountGroupType.MultichainAccount,
        metadata: {
          name: 'Account 1 from wallet 2',
          entropy: {
            groupIndex: 0,
          },
          pinned: false,
          hidden: false,
        },
        accounts: ['784225f4-d30b-4e77-a900-c8bbce735b88'],
      },
    },
  },
} as AccountTreeWallets;

describe('MultichainAccountList', () => {
  const defaultProps: MultichainAccountListProps = {
    wallets: mockWallets,
    selectedAccountGroups: [walletOneGroupId],
  };

  const renderComponent = (props = {}) => {
    const store = configureStore(mockDefaultState);

    return renderWithProvider(
      <MultichainAccountList {...defaultProps} {...props} />,
      store,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders wallet headers and account cells correctly', () => {
    renderComponent();

    expect(screen.getByText('Wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Wallet 2')).toBeInTheDocument();

    const walletHeaders = screen.getAllByTestId(
      'multichain-account-tree-wallet-header',
    );
    expect(walletHeaders).toHaveLength(2);

    expect(
      screen.getByTestId(`multichain-account-cell-${walletOneGroupId}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`multichain-account-cell-${walletTwoGroupId}`),
    ).toBeInTheDocument();

    expect(screen.getByText('Account 1 from wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Account 1 from wallet 2')).toBeInTheDocument();
  });

  it('marks only the selected account with a check icon and dispatches action on click', () => {
    renderComponent();

    // Check that the correct account is initially selected
    const selectedAccountIcon = screen.getByTestId(
      `multichain-account-cell-${walletOneGroupId}-selected-icon`,
    );
    expect(selectedAccountIcon).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-icon`,
      ),
    ).not.toBeInTheDocument();

    // Find and click the second account cell (wallet two)
    const accountCell = screen.getByTestId(
      `multichain-account-cell-${walletTwoGroupId}`,
    );
    accountCell.click();

    // Verify that the action was dispatched with the correct account group ID
    expect(mockSetSelectedMultichainAccount).toHaveBeenCalledWith(
      walletTwoGroupId,
    );
    expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('updates selected account when selectedAccountGroup changes', () => {
    const { rerender } = renderComponent();

    expect(
      screen.getByTestId(
        `multichain-account-cell-${walletOneGroupId}-selected-icon`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-icon`,
      ),
    ).not.toBeInTheDocument();

    // Change the selected account to wallet two
    rerender(
      <MultichainAccountList
        wallets={mockWallets}
        selectedAccountGroups={[walletTwoGroupId]}
      />,
    );

    // Now wallet two should be selected (has selected icon)
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletOneGroupId}-selected-icon`,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-icon`,
      ),
    ).toBeInTheDocument();
  });

  it('handles multiple account groups within a single wallet', () => {
    const secondGroupId = `${walletOneId}/group2`;
    const multiGroupWallets = {
      [walletOneId]: {
        ...mockWallets[walletOneId],
        groups: {
          [walletOneGroupId]: {
            ...mockWallets[walletOneId].groups[walletOneGroupId],
          },
          [secondGroupId]: {
            id: secondGroupId,
            metadata: {
              name: 'Account 2 from wallet 1',
            },
          },
        },
      },
    };

    renderComponent({ wallets: multiGroupWallets });

    expect(
      screen.getAllByTestId('multichain-account-tree-wallet-header'),
    ).toHaveLength(1);
    expect(
      screen.getByTestId(`multichain-account-cell-${walletOneGroupId}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`multichain-account-cell-${secondGroupId}`),
    ).toBeInTheDocument();

    expect(screen.getByText('Account 1 from wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2 from wallet 1')).toBeInTheDocument();
  });
});
