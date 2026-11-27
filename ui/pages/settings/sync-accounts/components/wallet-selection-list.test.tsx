import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import {
  AccountGroupId,
  AccountWalletType,
  toAccountWalletId,
} from '@metamask/account-api';
import { KeyringTypes } from '@metamask/keyring-controller';
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
      accountName,
      startAccessory,
      selected,
      onClick,
    }: {
      accountName: string;
      startAccessory?: React.ReactNode;
      selected?: boolean;
      onClick?: () => void;
    }) => (
      <div
        data-testid="account-cell"
        data-selected={String(Boolean(selected))}
        onClick={onClick}
      >
        <span>{accountName}</span>
        {startAccessory}
      </div>
    ),
  }),
);

const walletId = toAccountWalletId(AccountWalletType.Entropy, 'entropy1');
const groupOneId = `${walletId}/0` as AccountGroupId;
const groupTwoId = `${walletId}/1` as AccountGroupId;

const secondWalletId = toAccountWalletId(AccountWalletType.Entropy, 'entropy2');
const secondWalletGroupId = `${secondWalletId}/0` as AccountGroupId;

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
  [secondWalletId]: {
    id: secondWalletId,
    type: AccountWalletType.Entropy,
    metadata: { name: 'Second Wallet', entropy: { id: 'entropy2' } },
    groups: {
      [secondWalletGroupId]: {
        id: secondWalletGroupId,
        metadata: { name: 'Account 3' },
      },
    },
  },
} as unknown as AccountTreeWallets;

const importedWalletId = toAccountWalletId(
  AccountWalletType.Keyring,
  'imported',
);
const importedGroupOneId = `${importedWalletId}/0` as AccountGroupId;
const importedGroupTwoId = `${importedWalletId}/1` as AccountGroupId;

const importedWallets = {
  [importedWalletId]: {
    id: importedWalletId,
    type: AccountWalletType.Keyring,
    metadata: { name: 'Imported', keyring: { type: KeyringTypes.simple } },
    groups: {
      [importedGroupOneId]: {
        id: importedGroupOneId,
        metadata: { name: 'Imported Account 1' },
      },
      [importedGroupTwoId]: {
        id: importedGroupTwoId,
        metadata: { name: 'Imported Account 2' },
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
  it('renders the wallet header and account rows', () => {
    render();

    expect(screen.getByText('My Wallet')).toBeInTheDocument();
    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.getByText('Account 2')).toBeInTheDocument();
  });

  it('shows the account count next to each wallet name', () => {
    render();

    expect(screen.getByText(/\(2 accounts\)/u)).toBeInTheDocument();
    expect(screen.getByText(/\(1 account\)/u)).toBeInTheDocument();
  });

  it('separates wallets with a divider', () => {
    render();

    expect(screen.getAllByTestId('qr-sync-wallet-divider')).toHaveLength(1);
  });

  it('does not render account checkboxes inside an SRP wallet', () => {
    render({ selectedAccountGroups: [groupOneId, groupTwoId] });

    expect(
      document.querySelector(`input[id="account-select-${groupOneId}"]`),
    ).toBeNull();
    expect(
      document.querySelector(`input[id="account-select-${groupTwoId}"]`),
    ).toBeNull();
  });

  it('shows the wallet as selected when all of its accounts are selected', () => {
    render({ selectedAccountGroups: [groupOneId, groupTwoId] });

    expect(
      document.querySelector<HTMLInputElement>(
        `input[id="wallet-select-${walletId}"]`,
      ),
    ).toBeChecked();
  });

  it('shows the wallet as not selected when none of its accounts are selected', () => {
    render({ selectedAccountGroups: [] });

    expect(
      document.querySelector<HTMLInputElement>(
        `input[id="wallet-select-${walletId}"]`,
      ),
    ).not.toBeChecked();
  });

  it('does not change the selection when an SRP account row is clicked', () => {
    const onSelectionChange = jest.fn();
    render({
      selectedAccountGroups: [groupOneId, groupTwoId],
      onSelectionChange,
    });

    fireEvent.click(screen.getByText('Account 1'));

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('deselects every account in a wallet when its checkbox is clicked while selected', () => {
    const onSelectionChange = jest.fn();
    render({
      selectedAccountGroups: [groupOneId, groupTwoId, secondWalletGroupId],
      onSelectionChange,
    });

    fireEvent.click(
      document.querySelector(
        `input[id="wallet-select-${walletId}"]`,
      ) as HTMLInputElement,
    );

    expect(onSelectionChange).toHaveBeenCalledWith([secondWalletGroupId]);
  });

  describe('imported private-key accounts', () => {
    it('renders a checkbox for each account that reflects the selection', () => {
      render({
        wallets: importedWallets,
        selectedAccountGroups: [importedGroupOneId],
      });

      expect(
        document.querySelector<HTMLInputElement>(
          `input[id="account-select-${importedGroupOneId}"]`,
        ),
      ).toBeChecked();
      expect(
        document.querySelector<HTMLInputElement>(
          `input[id="account-select-${importedGroupTwoId}"]`,
        ),
      ).not.toBeChecked();
    });

    it('adds a single account to the selection when its checkbox is clicked', () => {
      const onSelectionChange = jest.fn();
      render({
        wallets: importedWallets,
        selectedAccountGroups: [importedGroupOneId],
        onSelectionChange,
      });

      fireEvent.click(
        document.querySelector(
          `input[id="account-select-${importedGroupTwoId}"]`,
        ) as HTMLInputElement,
      );

      expect(onSelectionChange).toHaveBeenCalledWith([
        importedGroupOneId,
        importedGroupTwoId,
      ]);
    });

    it('removes a single account from the selection when its row is clicked', () => {
      const onSelectionChange = jest.fn();
      render({
        wallets: importedWallets,
        selectedAccountGroups: [importedGroupOneId, importedGroupTwoId],
        onSelectionChange,
      });

      fireEvent.click(screen.getByText('Imported Account 1'));

      expect(onSelectionChange).toHaveBeenCalledWith([importedGroupTwoId]);
    });
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

  it('keeps accounts from other wallets when the wallet header checkbox is clicked', () => {
    const onSelectionChange = jest.fn();
    render({
      selectedAccountGroups: [secondWalletGroupId],
      onSelectionChange,
    });

    fireEvent.click(
      document.querySelector(
        `input[id="wallet-select-${walletId}"]`,
      ) as HTMLInputElement,
    );

    expect(onSelectionChange).toHaveBeenCalledWith([
      secondWalletGroupId,
      groupOneId,
      groupTwoId,
    ]);
  });
});
