import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { KeyringTypes } from '@metamask/keyring-controller';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
import { InternalAccountWithBalance } from '../../../../selectors';
import { shortenAddress } from '../../../../helpers/utils/util';
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../../app/scripts/lib/multichain/address';
import { FirstTimeFlowType } from '../../../../../shared/constants/onboarding';
import { SrpList } from './srp-list';

const mockTotalFiatBalance = '100';
const mocks = {
  useMultichainAccountTotalFiatBalance: jest.fn().mockReturnValue({
    totalFiatBalance: mockTotalFiatBalance,
  }),
  onActionComplete: jest.fn(),
};

jest.mock('../../../../hooks/useMultichainAccountTotalFiatBalance', () => ({
  useMultichainAccountTotalFiatBalance: (account: InternalAccountWithBalance) =>
    mocks.useMultichainAccountTotalFiatBalance(account),
}));

const mockSecondHdKeyring = {
  accounts: [],
  type: KeyringTypes.hd,
  metadata: {
    id: '01JN31PKMJ3ANWYFJZM3Z8MYT4',
    name: '',
  },
};

const render = () => {
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

  it('shows/hides accounts when clicking show/hide text', () => {
    const { getByText } = render();
    const showAccountsButton = getByText('Show 4 accounts');
    fireEvent.click(showAccountsButton);
    expect(getByText('Hide 4 accounts')).toBeInTheDocument();
  });

  it('calls onActionComplete when clicking a keyring', () => {
    const { getByTestId } = render();
    const firstKeyringId = mockState.metamask.keyrings[0].metadata.id;

    const keyring = getByTestId(`hd-keyring-${firstKeyringId}`);
    fireEvent.click(keyring);

    expect(mocks.onActionComplete).toHaveBeenCalledWith(firstKeyringId, true);
  });

  it('displays the correct accounts for a keyring and ensures no duplicates', () => {
    const { getByText, getAllByText } = render();
    const firstKeyringAccounts = mockState.metamask.keyrings[0].accounts;
    const account1Address = firstKeyringAccounts[0];
    const account2Address = firstKeyringAccounts[1];

    const showAccountsButton = getByText('Show 4 accounts');
    fireEvent.click(showAccountsButton);

    const shortenedAccount1 = shortenAddress(
      normalizeSafeAddress(account1Address),
    );
    const shortenedAccount2 = shortenAddress(
      normalizeSafeAddress(account2Address),
    );

    expect(getByText(shortenedAccount1)).toBeInTheDocument();
    expect(getByText(shortenedAccount2)).toBeInTheDocument();

    // Ensure no duplicates by checking the count of each shortened address.
    expect(getAllByText(shortenedAccount1).length).toBe(1);
    expect(getAllByText(shortenedAccount2).length).toBe(1);
  });
});
