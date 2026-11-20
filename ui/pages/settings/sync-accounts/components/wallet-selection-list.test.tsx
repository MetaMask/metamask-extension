import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import {
  AccountGroupId,
  AccountWalletType,
  toAccountWalletId,
} from '@metamask/account-api';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import { AccountTreeWallets } from '../../../../selectors/multichain-accounts/account-tree.types';
import { WalletSelectionList } from './wallet-selection-list';

const mockStableWalletBalances = { wallets: {} };

jest.mock('../../../../selectors/assets', () => ({
  selectBalanceForAllWallets: () => mockStableWalletBalances,
}));

jest.mock('../../../../selectors', () => ({
  getShowDefaultAddressPreference: () => false,
}));

jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number, currency: string) =>
      `${value} ${currency}`,
  }),
}));

jest.mock(
  '../../../../components/ui/virtualized-list/virtualized-list',
  () => ({
    VirtualizedList: ({
      data,
      renderItem,
      keyExtractor,
    }: {
      data: unknown[];
      renderItem: (info: { item: unknown }) => React.ReactNode;
      keyExtractor: (item: unknown) => string;
    }) => (
      <div>
        {data.map((item) => (
          <div key={keyExtractor(item)}>{renderItem({ item })}</div>
        ))}
      </div>
    ),
  }),
);

jest.mock(
  '../../../../components/multichain-accounts/multichain-account-cell',
  () => ({
    MultichainAccountCell: ({
      accountId,
      accountName,
      accountNameAccessory,
      avatarSeedAddress,
      balance,
      onClick,
      selected,
      startAccessory,
      disableHoverEffect,
    }: {
      accountId: AccountGroupId;
      accountName: string;
      accountNameAccessory?: React.ReactNode;
      avatarSeedAddress?: string;
      balance?: string;
      onClick?: (accountId: AccountGroupId) => void;
      selected?: boolean;
      startAccessory?: React.ReactNode;
      disableHoverEffect?: boolean;
    }) => (
      <div
        data-testid="account-cell"
        data-selected={selected}
        data-hover-disabled={disableHoverEffect}
        data-avatar-seed={avatarSeedAddress}
        onClick={() => onClick?.(accountId)}
      >
        <span>{accountName}</span>
        {accountNameAccessory}
        <span>{balance}</span>
        <div onClick={(event) => event.stopPropagation()}>{startAccessory}</div>
      </div>
    ),
  }),
);

const walletId = toAccountWalletId(AccountWalletType.Entropy, 'entropy1');
const groupOneId = `${walletId}/0` as AccountGroupId;
const groupTwoId = `${walletId}/1` as AccountGroupId;
const secondWalletId = toAccountWalletId(AccountWalletType.Entropy, 'entropy2');
const groupThreeId = `${secondWalletId}/0` as AccountGroupId;

const mockWallets = {
  [walletId]: {
    id: walletId,
    type: AccountWalletType.Entropy,
    metadata: { name: 'My Wallet', entropy: { id: 'entropy1' } },
    groups: {
      [groupOneId]: {
        id: groupOneId,
        metadata: { name: 'Account 1' },
      },
      [groupTwoId]: {
        id: groupTwoId,
        metadata: { name: 'Account 2' },
      },
    },
  },
} as unknown as AccountTreeWallets;

const mockTwoWallets = {
  ...mockWallets,
  [secondWalletId]: {
    id: secondWalletId,
    type: AccountWalletType.Entropy,
    metadata: { name: 'Second Wallet', entropy: { id: 'entropy2' } },
    groups: {
      [groupThreeId]: {
        id: groupThreeId,
        metadata: { name: 'Account 3' },
      },
    },
  },
} as unknown as AccountTreeWallets;

const render = (
  props: Partial<React.ComponentProps<typeof WalletSelectionList>> = {},
) => {
  const store = configureStore({ metamask: {} });
  return renderWithProvider(
    <WalletSelectionList
      wallets={mockWallets}
      selectedAccountGroups={[]}
      onSelectionChange={jest.fn()}
      {...props}
    />,
    store,
  );
};

describe('WalletSelectionList', () => {
  it('renders a single wallet expanded by default with its account count', () => {
    render();

    expect(screen.getByText('My Wallet')).toBeInTheDocument();
    expect(screen.getByText('(2 accounts)')).toBeInTheDocument();
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
    expect(screen.getByTestId(`qr-sync-account-row-${groupOneId}`)).toHaveClass(
      '[&_.multichain-account-cell]:!py-3',
    );
    const accountCells = screen.getAllByTestId('account-cell');
    expect(accountCells[0]).not.toHaveAttribute(
      'data-avatar-seed',
      accountCells[1].getAttribute('data-avatar-seed'),
    );
    expect(screen.getByText('94857.55 USD')).toBeInTheDocument();
    expect(screen.getByText('12500.25 USD')).toBeInTheDocument();
  });

  it('renders multiple wallets expanded by default', () => {
    render({ wallets: mockTwoWallets });

    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 3')).toBeInTheDocument();
  });

  it('renders a divider between wallets', () => {
    render({ wallets: mockTwoWallets });

    expect(screen.getAllByTestId('qr-sync-wallet-divider')).toHaveLength(1);
  });

  it('renders the selection state for each account', () => {
    render({ selectedAccountGroups: [groupOneId] });

    expect(
      document.querySelector(`input[id="account-select-${groupOneId}"]`),
    ).toBeChecked();
    expect(
      document.querySelector(`input[id="account-select-${groupTwoId}"]`),
    ).not.toBeChecked();
  });

  it('selects an individual account', () => {
    const onSelectionChange = jest.fn();
    render({ onSelectionChange });

    const checkbox = document.querySelector(
      `input[id="account-select-${groupOneId}"]`,
    ) as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(onSelectionChange).toHaveBeenCalledWith([groupOneId]);
  });

  it('selects all accounts when the wallet header checkbox is clicked', () => {
    const onSelectionChange = jest.fn();
    render({ onSelectionChange });

    const checkbox = document.querySelector(
      `input[id="wallet-select-${walletId}"]`,
    ) as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(onSelectionChange).toHaveBeenCalledWith([groupOneId, groupTwoId]);
  });

  it('marks imported accounts as imported and prevents selecting them again', () => {
    const onSelectionChange = jest.fn();
    render({
      importedAccountGroups: [groupOneId],
      onSelectionChange,
    });

    const importedCheckbox = document.querySelector(
      `input[id="account-select-${groupOneId}"]`,
    ) as HTMLInputElement;
    const importedAccount = screen
      .getByText('Account 1')
      .closest('[data-testid="account-cell"]');

    expect(importedCheckbox).toBeChecked();
    expect(importedCheckbox).toBeDisabled();
    expect(
      screen.getByText('Already imported').closest('.shrink-0'),
    ).toBeInTheDocument();
    expect(importedAccount).toHaveAttribute('data-hover-disabled', 'true');
    expect(screen.getByTestId(`qr-sync-account-row-${groupOneId}`)).toHaveStyle(
      { opacity: 0.5 },
    );
    expect(
      screen.getByTestId(`qr-sync-account-row-${groupOneId}`),
    ).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(importedAccount as HTMLElement);

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('excludes imported accounts when selecting a wallet', () => {
    const onSelectionChange = jest.fn();
    render({
      importedAccountGroups: [groupOneId],
      onSelectionChange,
    });

    const checkbox = document.querySelector(
      `input[id="wallet-select-${walletId}"]`,
    ) as HTMLInputElement;
    fireEvent.click(checkbox);

    expect(onSelectionChange).toHaveBeenCalledWith([groupTwoId]);
  });
});
