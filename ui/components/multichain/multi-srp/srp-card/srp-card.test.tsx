import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';

import { KeyringTypes } from '@metamask/keyring-controller';
import type { AccountGroupId, AccountWalletId } from '@metamask/account-api';

import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { FirstTimeFlowType } from '../../../../../shared/constants/onboarding';
import { SrpCard } from './srp-card';

const mockWalletId = 'mock-wallet-id' as AccountWalletId;
const mockTotalFiatBalance = '$100.00';

const mocks = {
  useSingleWalletAccountsBalanceCallback: jest
    .fn()
    .mockReturnValue((_: AccountGroupId) => mockTotalFiatBalance),
  onActionComplete: jest.fn(),
  useWalletInfoCallback: jest.fn().mockReturnValue({
    multichainAccounts: [
      {
        accountId: 'mock-account-id-1' as AccountGroupId,
        metadata: {
          name: 'Mock Account 1',
        },
      },
    ],
    keyringId: '01JKAF3DSGM3AB87EM9N0K41AJ',
    isSRPBackedUp: true,
  }),
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

const render = (shouldTriggerBackup: boolean) => {
  const store = configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      keyrings: [...mockState.metamask.keyrings, mockSecondHdKeyring],
      firstTimeFlowType: FirstTimeFlowType.create,
      seedPhraseBackedUp: false,
    },
  });

  return renderWithProvider(
    <SrpCard
      index={0}
      walletId={mockWalletId}
      shouldTriggerBackup={shouldTriggerBackup}
      onActionComplete={mocks.onActionComplete}
    />,
    store,
  );
};

describe('SrpCard', () => {
  it('renders the secret recovery phrases card', () => {
    const { getByText } = render(false);
    expect(getByText('Secret Recovery Phrase 1')).toBeInTheDocument();
  });

  it('shows/hides accounts when clicking show/hide text', () => {
    const { getByText } = render(false);
    const showAccountsButton = getByText('Show 1 account');
    fireEvent.click(showAccountsButton);
    expect(getByText('Hide 1 account')).toBeInTheDocument();
  });

  it('calls onActionComplete when clicking a keyring', () => {
    const { getByTestId } = render(true);
    const firstKeyringId = mockState.metamask.keyrings[0].metadata.id;

    const keyring = getByTestId(`hd-keyring-${firstKeyringId}`);
    fireEvent.click(keyring);

    expect(mocks.onActionComplete).toHaveBeenCalledWith(firstKeyringId, true);
  });
});
