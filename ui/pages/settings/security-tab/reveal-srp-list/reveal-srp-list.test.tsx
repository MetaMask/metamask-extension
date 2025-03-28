import React from 'react';
import configureStore, { MetaMaskReduxState } from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { RevealSrpList } from './reveal-srp-list';

const mockKeyringId = mockState.metamask.keyringsMetadata[0].id;

const render = (newState: Partial<MetaMaskReduxState> = {}) => {
  const mockStore = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...newState.metamask,
    },
  });

  return renderWithProvider(<RevealSrpList />, mockStore);
};

describe('RevealSrpList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays a list of hd keyrings', async () => {
    const { getByTestId } = render();

    expect(getByTestId(`hd-keyring-${mockKeyringId}`)).toBeInTheDocument();
  });

  it('displays the SRP Quiz when a HD keyring is selected', async () => {
    const { getByTestId } = render();

    const hdKeyring = getByTestId(`hd-keyring-${mockKeyringId}`);

    hdKeyring.click();

    expect(getByTestId('srp-quiz-get-started')).toBeInTheDocument();
  });
});
