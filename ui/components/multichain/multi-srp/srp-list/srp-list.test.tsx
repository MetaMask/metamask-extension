import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { KeyringTypes } from '@metamask/keyring-controller';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
import { InternalAccountWithBalance } from '../../../../selectors';
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
};

const mockSecondHdKeyringMetadata = {
  id: '01JN31PKMJ3ANWYFJZM3Z8MYT4',
  name: '',
};

const render = () => {
  const store = configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      keyrings: [...mockState.metamask.keyrings, mockSecondHdKeyring],
      keyringsMetadata: [
        ...mockState.metamask.keyringsMetadata,
        mockSecondHdKeyringMetadata,
      ],
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
    const showAccountsButton = getByText('Show 2 accounts');
    fireEvent.click(showAccountsButton);
    expect(getByText('Hide 2 accounts')).toBeInTheDocument();
  });

  it('calls onActionComplete when clicking a keyring', () => {
    const { getByTestId } = render();
    const firstKeyringId = mockState.metamask.keyringsMetadata[0].id;

    const keyring = getByTestId(`hd-keyring-${firstKeyringId}`);
    fireEvent.click(keyring);

    expect(mocks.onActionComplete).toHaveBeenCalledWith(firstKeyringId);
  });
});
