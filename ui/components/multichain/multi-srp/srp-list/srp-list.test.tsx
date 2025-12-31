import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { KeyringTypes } from '@metamask/keyring-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { InternalAccountWithBalance } from '../../../../selectors';
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

  it('calls onActionComplete when clicking a keyring', () => {
    const { getByTestId } = render();
    const firstKeyringId = mockState.metamask.keyrings[0].metadata.id;

    const keyring = getByTestId(`hd-keyring-${firstKeyringId}`);
    fireEvent.click(keyring);

    expect(mocks.onActionComplete).toHaveBeenCalledWith(firstKeyringId, true);
  });
});
