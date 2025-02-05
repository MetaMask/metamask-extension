import React from 'react';
import configureStore, { MetaMaskReduxState } from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { RevealSRPList } from './reveal-srp-list';

const mockKeyringId = 'hd-keyring-01JKAF3DSGM3AB87EM9N0K41AJ';

const render = (newState: Partial<MetaMaskReduxState> = {}) => {
  const mockStore = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...newState.metamask,
    },
  });

  return renderWithProvider(<RevealSRPList />, mockStore);
};

describe('RevealSRPList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays a list of hd keyrings', async () => {
    const { getByTestId } = render();

    expect(getByTestId(mockKeyringId)).toBeInTheDocument();
  });

  it('displays the SRP Quiz when a HD keyring is selected', async () => {
    const { getByTestId } = render();

    const hdKeyring = getByTestId(mockKeyringId);

    hdKeyring.click();

    expect(getByTestId('srp-quiz-get-started')).toBeInTheDocument();
  });
});
