import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { FirstTimeFlowType } from '../../../../../shared/constants/onboarding';
import { SrpList } from './srp-list';

const mockTotalFiatBalance = '$100.00';

const mocks = {
  useSingleWalletAccountsBalanceCallback: jest
    .fn()
    .mockReturnValue((_: AccountGroupId) => mockTotalFiatBalance),
  onActionComplete: jest.fn(),
  useWalletInfoCallback: jest.fn(),
};

jest.mock('../../../../hooks/multichain-accounts/useWalletBalance', () => ({
  useSingleWalletAccountsBalanceCallback: (walletId: AccountWalletId) =>
    mocks.useSingleWalletAccountsBalanceCallback(walletId),
}));

jest.mock('../../../../hooks/multichain-accounts/useWalletInfo', () => ({
  useWalletInfo: (walletId: AccountWalletId) =>
    mocks.useWalletInfoCallback(walletId),
}));

const mockSecondHdKeyring = {
  accounts: [],
  type: KeyringTypes.hd,
  metadata: {
    id: '01JN31PKMJ3ANWYFJZM3Z8MYT4',
    name: '',
  },
};

// Second wallet entry for accountTree to match the second keyring
const mockSecondWallet = {
  id: 'entropy:01JN31PKMJ3ANWYFJZM3Z8MYT4' as AccountWalletId,
  type: 'entropy',
  groups: {
    'entropy:01JN31PKMJ3ANWYFJZM3Z8MYT4/0': {
      id: 'entropy:01JN31PKMJ3ANWYFJZM3Z8MYT4/0' as AccountGroupId,
      type: 'multichain-account',
      accounts: ['mock-account-id-2'],
      metadata: {
        name: 'Account 2',
        entropy: { groupIndex: 0 },
        hidden: false,
        pinned: false,
      },
    },
  },
  metadata: {
    name: 'Wallet 2',
    entropy: { id: '01JN31PKMJ3ANWYFJZM3Z8MYT4' },
  },
};

const render = () => {
  // Set up useWalletInfo mock to return correct data for each wallet
  mocks.useWalletInfoCallback.mockImplementation((walletId: AccountWalletId) => {
      if (walletId === 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ') {
        return {
          multichainAccounts: [
            {
              id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId,
              metadata: { name: 'Account 1' },
            },
          ],
          keyringId: '01JKAF3DSGM3AB87EM9N0K41AJ',
          isSRPBackedUp: false,
        };
      }
      if (walletId === 'entropy:01JN31PKMJ3ANWYFJZM3Z8MYT4') {
        return {
          multichainAccounts: [
            {
              id: 'entropy:01JN31PKMJ3ANWYFJZM3Z8MYT4/0' as AccountGroupId,
              metadata: { name: 'Account 2' },
            },
          ],
          keyringId: '01JN31PKMJ3ANWYFJZM3Z8MYT4',
          isSRPBackedUp: true,
        };
      }
      return { multichainAccounts: [], keyringId: undefined };
    },
  );

  const store = configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      keyrings: [...mockState.metamask.keyrings, mockSecondHdKeyring],
      accountTree: {
        ...mockState.metamask.accountTree,
        wallets: {
          ...mockState.metamask.accountTree.wallets,
          'entropy:01JN31PKMJ3ANWYFJZM3Z8MYT4': mockSecondWallet,
        },
      },
      firstTimeFlowType: FirstTimeFlowType.create,
      seedPhraseBackedUp: false,
    },
  });

  return renderWithProvider(
    <SrpList onActionComplete={mocks.onActionComplete} />,
    store,
  );
};

describe('SrpList', () => {
  it('renders list of secret recovery phrases', () => {
    const { getByText } = render();
    expect(getByText('Secret Recovery Phrase 1')).toBeInTheDocument();
    expect(getByText('Secret Recovery Phrase 2')).toBeInTheDocument();
  });

  it('calls onActionComplete when clicking a keyring', () => {
    const { getByTestId } = render();
    const firstKeyringId = mockState.metamask.keyrings[0].metadata.id;

    const keyring = getByTestId(`hd-keyring-${firstKeyringId}`);
    fireEvent.click(keyring);

    expect(mocks.onActionComplete).toHaveBeenCalledWith(firstKeyringId, true);
  });
});
