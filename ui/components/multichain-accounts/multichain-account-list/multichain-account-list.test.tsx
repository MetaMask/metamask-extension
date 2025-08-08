import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  AccountWalletCategory,
  toAccountWalletId,
  toDefaultAccountGroupId,
} from '@metamask/account-api';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import {
  MultichainAccountList,
  MultichainAccountListProps,
} from './multichain-account-list';

const mockWalletOneEntropySource = '01JKAF3DSGM3AB87EM9N0K41AJ';
const mockWalletTwoEntropySource = '01JKAF3PJ247KAM6C03G5Q0NP8';

const walletOneId = toAccountWalletId(
  AccountWalletCategory.Entropy,
  mockWalletOneEntropySource,
);
const walletOneGroupId = toDefaultAccountGroupId(walletOneId);
const walletTwoId = toAccountWalletId(
  AccountWalletCategory.Entropy,
  mockWalletTwoEntropySource,
);
const walletTwoGroupId = toDefaultAccountGroupId(walletTwoId);

const mockWallets = {
  [walletOneId]: {
    id: walletOneId,
    metadata: {
      name: 'Wallet 1',
      type: AccountWalletCategory.Entropy,
      entropy: {
        id: mockWalletOneEntropySource,
        index: 0,
      },
    },
    groups: {
      [walletOneGroupId]: {
        id: walletOneGroupId,
        metadata: {
          name: 'Account 1 from wallet 1',
        },
        accounts: ['cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'],
      },
    },
  },
  [walletTwoId]: {
    id: walletTwoId,
    metadata: {
      name: 'Wallet 2',
      type: AccountWalletCategory.Entropy,
      entropy: {
        id: mockWalletTwoEntropySource,
        index: 1,
      },
    },
    groups: {
      [walletTwoGroupId]: {
        id: walletTwoGroupId,
        metadata: {
          name: 'Account 1 from wallet 2',
        },
        accounts: ['784225f4-d30b-4e77-a900-c8bbce735b88'],
      },
    },
  },
} as AccountTreeWallets;

describe('MultichainAccountList', () => {
  const defaultProps: MultichainAccountListProps = {
    wallets: mockWallets,
    selectedAccountGroup: walletOneGroupId,
  };

  const renderComponent = (props = {}) => {
    return render(<MultichainAccountList {...defaultProps} {...props} />);
  };

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

  it('marks only the selected account with a check icon', () => {
    renderComponent();

    const selectedAccountIcon = screen.getByTestId(
      `multichain-account-cell-${walletOneGroupId}-selected-icon`,
    );
    expect(selectedAccountIcon).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `multichain-account-cell-${walletTwoGroupId}-selected-icon`,
      ),
    ).not.toBeInTheDocument();
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
        selectedAccountGroup={walletTwoGroupId}
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
