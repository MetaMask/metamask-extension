import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  AccountWalletType,
  toMultichainAccountGroupId,
  toMultichainAccountWalletId,
} from '@metamask/account-api';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import mockState from '../../../test/data/mock-state.json';
import { shortenAddress } from '../../helpers/utils/util';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { KeyringType } from '../../../shared/constants/keyring';
import { SnapAccountCard } from './snap-account-card';

const mockSnap = {
  id: 'npm:@metamask/test-snap',
  name: 'Test Snap',
};

const mockSnapAccount = createMockInternalAccount({
  name: 'Snap Account 1',
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  keyringType: KeyringType.snap,
  snapOptions: {
    enabled: true,
    ...mockSnap,
  },
});

const mockWalletId = toMultichainAccountWalletId('wallet-1');
const mockGroupId = toMultichainAccountGroupId(mockWalletId, 0);
const mockAccountTree = {
  wallets: {
    [mockWalletId]: {
      id: mockWalletId,
      type: AccountWalletType.Entropy,
      metadata: {
        name: 'Test Wallet',
      },
      groups: {
        [mockGroupId]: {
          id: mockGroupId,
          metadata: {
            name: 'Test Snap Account',
          },
          accounts: [mockSnapAccount.id],
        },
      },
    },
  },
  selectedAccountGroup: mockGroupId,
};

const mockBalanceForAllWallets = {
  wallets: {
    [mockWalletId]: {
      walletId: mockWalletId,
      totalBalanceInUserCurrency: 1000.5,
      groups: {
        [mockGroupId]: {
          walletId: mockWalletId,
          groupId: mockGroupId,
          totalBalanceInUserCurrency: 1000.5,
          userCurrency: 'usd',
        },
      },
    },
  },
  totalBalanceInUserCurrency: 1000.5,
  userCurrency: 'usd',
};

const mockDefaultState = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    internalAccounts: {
      selectedAccount: mockSnapAccount.id,
      accounts: {
        [mockSnapAccount.id]: mockSnapAccount,
      },
    },
    accountTree: mockAccountTree,
    keyrings: [
      {
        type: KeyringType.snap,
        accounts: [mockSnapAccount.address],
      },
    ],
    snapsMetadata: {
      [mockSnap.id]: {
        name: mockSnap.name,
      },
    },
    preferences: {
      privacyMode: false,
    },
    currentCurrency: 'usd',
  },
};

const defaultProps = {
  address: mockSnapAccount.address,
  remove: false,
};

describe('SnapAccountCard', () => {
  it('renders account with checksum address', () => {
    const mockStore = configureMockStore([])(mockDefaultState);

    const { getByText } = renderWithProvider(
      <SnapAccountCard {...defaultProps} />,
      mockStore,
    );

    const expectedCheckSumAddress = shortenAddress(
      toChecksumHexAddress(defaultProps.address),
    );

    expect(getByText(expectedCheckSumAddress)).toBeInTheDocument();
  });

  it('displays formatted balance when available', () => {
    const mockStore = configureMockStore([])(mockDefaultState);

    // Mock the selectBalanceForAllWallets result
    jest.mock('../../selectors/assets', () => ({
      ...jest.requireActual('../../selectors/assets'),
      selectBalanceForAllWallets: () => mockBalanceForAllWallets,
    }));

    const { getByTestId } = renderWithProvider(
      <SnapAccountCard {...defaultProps} />,
      mockStore,
    );

    const balanceElement = getByTestId('account-balance');
    expect(balanceElement).toBeInTheDocument();
  });

  it('displays account group name', () => {
    const mockStore = configureMockStore([])(mockDefaultState);

    const { getByText } = renderWithProvider(
      <SnapAccountCard {...defaultProps} />,
      mockStore,
    );

    expect(getByText('Test Snap Account')).toBeInTheDocument();
  });

  it('applies remove styling when remove prop is true', () => {
    const mockStore = configureMockStore([])(mockDefaultState);

    const { container } = renderWithProvider(
      <SnapAccountCard {...defaultProps} remove={true} />,
      mockStore,
    );

    const cardElement = container.querySelector('.snap-account-card-remove');
    expect(cardElement).toBeInTheDocument();
  });

  it('hides balance when privacy mode is enabled', () => {
    const mockStore = configureMockStore([])({
      ...mockDefaultState,
      metamask: {
        ...mockDefaultState.metamask,
        preferences: {
          privacyMode: true,
        },
      },
    });

    const { getByTestId } = renderWithProvider(
      <SnapAccountCard {...defaultProps} />,
      mockStore,
    );

    const balanceElement = getByTestId('account-balance');
    expect(balanceElement).toContainHTML('••••••');
  });
});
