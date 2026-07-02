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

jest.mock('../../../../selectors/assets', () => ({
  selectBalanceForAllWallets: () => ({ wallets: {} }),
}));

jest.mock('../../../../selectors', () => ({
  getIsDefaultAddressEnabled: () => false,
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
    }: {
      accountName: string;
      startAccessory?: React.ReactNode;
    }) => (
      <div data-testid="account-cell">
        <span>{accountName}</span>
        {startAccessory}
      </div>
    ),
  }),
);

const walletId = toAccountWalletId(AccountWalletType.Keyring, 'wallet1');
const groupOneId = `${walletId}/0` as AccountGroupId;
const groupTwoId = `${walletId}/1` as AccountGroupId;

const mockWallets = {
  [walletId]: {
    id: walletId,
    type: AccountWalletType.Keyring,
    metadata: { name: 'My Wallet' },
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

  it('selects an account when its checkbox is clicked', () => {
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
});
