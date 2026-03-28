import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore, { MetaMaskReduxState } from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  ONBOARDING_REVIEW_SRP_ROUTE,
  REVEAL_SEED_ROUTE,
} from '../../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../../shared/constants/onboarding';
import { RevealSrpList } from './reveal-srp-list';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
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

  it('displays a list of hd keyrings', () => {
    const { getByTestId } = render();
    const srpListItem = getByTestId(`hd-keyring-${mockKeyringId}`);

    expect(srpListItem).toBeInTheDocument();
    expect(srpListItem).toHaveTextContent('Reveal');

    fireEvent.click(srpListItem);

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${REVEAL_SEED_ROUTE}/${mockKeyringId}`,
    );
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

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true&isFromSettingsSecurity=true`,
    );
  });

  it('navigates to reveal seed page when a HD keyring is selected', () => {
    const { getByTestId } = render();

    const hdKeyring = getByTestId(`hd-keyring-${mockKeyringId}`);

    fireEvent.click(hdKeyring);

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${REVEAL_SEED_ROUTE}/${mockKeyringId}`,
    );
  });
});
