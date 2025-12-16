import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  DEFAULT_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
} from '../../../helpers/constants/routes';
import CreationSuccessful from './creation-successful';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => ({ search: '' }),
  };
});

jest.mock('./wallet-ready-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="wallet-ready-animation" />,
}));

describe('Wallet Ready Page', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {
          accountId: {
            address: '0x0000000000000000000000000000000000000000',
            metadata: {
              keyring: {
                type: 'HD Key Tree',
                accounts: ['0x0000000000000000000000000000000000000000'],
              },
            },
          },
        },
        selectedAccount: 'accountId',
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: ['0x0000000000000000000000000000000000000000'],
        },
      ],
      firstTimeFlowType: FirstTimeFlowType.create,
      seedPhraseBackedUp: true,
    },
    appState: {
      externalServicesOnboardingToggleState: true,
    },
  };

  it('should render the wallet ready content if the seed phrase is backed up', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    const { getByText } = renderWithProvider(<CreationSuccessful />, mockStore);

    expect(getByText('Your wallet is ready!')).toBeInTheDocument();
  });

  it('should render the wallet ready content if the seed phrase is not backed up', () => {
    const mockStore = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        seedPhraseBackedUp: false,
      },
    });
    const { getByText } = renderWithProvider(<CreationSuccessful />, mockStore);

    expect(getByText('Your wallet is ready!')).toBeInTheDocument();
  });

  it('should redirect to privacy-settings view when "Manage default settings" button is clicked', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    const { getByText } = renderWithProvider(<CreationSuccessful />, mockStore);
    const privacySettingsButton = getByText('Manage default settings');
    fireEvent.click(privacySettingsButton);
    expect(mockUseNavigate).toHaveBeenCalledWith(
      ONBOARDING_PRIVACY_SETTINGS_ROUTE,
    );
  });

  it('should route to pin extension route when "Done" button is clicked', async () => {
    const mockStore = configureMockStore([thunk])(mockState);
    const { getByTestId } = renderWithProvider(
      <CreationSuccessful />,
      mockStore,
    );
    const doneButton = getByTestId('onboarding-complete-done');
    fireEvent.click(doneButton);
    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });
});
