import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore, { MetaMaskReduxState } from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../../shared/constants/onboarding';
import { RevealSrpList } from './reveal-srp-list';

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

const mockKeyringId = mockState.metamask.keyrings[0].metadata.id;

const render = (newState: Partial<MetaMaskReduxState> = {}) => {
  const mockStore = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...(newState.metamask || {}),
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
    const srpListItem = getByTestId(`hd-keyring-${mockKeyringId}`);

    expect(srpListItem).toBeInTheDocument();
    expect(srpListItem).toHaveTextContent('Reveal');

    fireEvent.click(srpListItem);

    expect(getByTestId('srp-quiz-get-started')).toBeInTheDocument();
  });

  it('should render the backup state correctly', () => {
    const mockStore = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.create,
        seedPhraseBackedUp: false,
      },
    });

    const { getByTestId } = renderWithProvider(<RevealSrpList />, mockStore);
    const srpListItem = getByTestId(`hd-keyring-${mockKeyringId}`);

    expect(srpListItem).toBeInTheDocument();
    expect(srpListItem).toHaveTextContent('Backup');

    fireEvent.click(srpListItem);

    expect(mockHistoryPush).toHaveBeenCalledWith(
      `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true&isFromSettingsSecurity=true`,
    );
  });

  it('displays the SRP Quiz when a HD keyring is selected', async () => {
    const { getByTestId } = render();

    const hdKeyring = getByTestId(`hd-keyring-${mockKeyringId}`);

    hdKeyring.click();

    expect(getByTestId('srp-quiz-get-started')).toBeInTheDocument();
  });
});
