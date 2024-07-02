import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_PIN_EXTENSION_ROUTE,
} from '../../../helpers/constants/routes';
import { setBackgroundConnection } from '../../../store/background-connection';
import { renderWithProvider } from '../../../../test/jest';
import initializedMockState from '../../../../test/data/mock-state.json';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import CreationSuccessful from './creation-successful';

const mockHistoryPush = jest.fn();

const completeOnboardingStub = jest
  .fn()
  .mockImplementation(() => Promise.resolve());

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

describe('Creation Successful Onboarding View', () => {
  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
      },
      firstTimeFlowType: FirstTimeFlowType.import,
    },
  };
  const store = configureMockStore([thunk])(mockStore);
  setBackgroundConnection({ completeOnboarding: completeOnboardingStub });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should remind the user to not loose the SRP and keep it safe (Import case)', () => {
    const importFirstTimeFlowState = {
      ...initializedMockState,
      metamask: {
        ...initializedMockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.import,
      },
    };
    const customMockStore = configureMockStore([thunk])(
      importFirstTimeFlowState,
    );

    const { getByText } = renderWithProvider(
      <CreationSuccessful />,
      customMockStore,
    );

    expect(getByText('Your wallet is ready')).toBeInTheDocument();
    expect(
      getByText(
        /Remember, if you lose your Secret Recovery Phrase, you lose access to your wallet/u,
      ),
    ).toBeInTheDocument();
  });

  it('should show the Congratulations! message to the user (New wallet & backed up SRP)', () => {
    const importFirstTimeFlowState = {
      ...initializedMockState,
      metamask: {
        ...initializedMockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.create,
        seedPhraseBackedUp: true,
      },
    };
    const customMockStore = configureMockStore([thunk])(
      importFirstTimeFlowState,
    );

    const { getByText } = renderWithProvider(
      <CreationSuccessful />,
      customMockStore,
    );

    expect(getByText('Congratulations!')).toBeInTheDocument();
    expect(
      getByText(/Your wallet is protected and ready to use/u),
    ).toBeInTheDocument();
  });

  it('should show the Reminder set! message to the user (New wallet & did not backed up SRP)', () => {
    const importFirstTimeFlowState = {
      ...initializedMockState,
      metamask: {
        ...initializedMockState.metamask,
        firstTimeFlowType: FirstTimeFlowType.create,
        seedPhraseBackedUp: false,
      },
    };
    const customMockStore = configureMockStore([thunk])(
      importFirstTimeFlowState,
    );

    const { getByText } = renderWithProvider(
      <CreationSuccessful />,
      customMockStore,
    );

    expect(getByText('Reminder set!')).toBeInTheDocument();
    expect(
      getByText(
        /If you get locked out of the app or get a new device, you will lose your funds./u,
      ),
    ).toBeInTheDocument();
  });

  it('should redirect to privacy-settings view when "Manage default settings" button is clicked', () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />, store);
    const privacySettingsButton = getByText('Manage default settings');
    fireEvent.click(privacySettingsButton);
    expect(mockHistoryPush).toHaveBeenCalledWith(
      ONBOARDING_PRIVACY_SETTINGS_ROUTE,
    );
  });

  it('should route to pin extension route when "Done" button is clicked', async () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />, store);
    const doneButton = getByText('Done');
    fireEvent.click(doneButton);
    await waitFor(() => {
      expect(mockHistoryPush).toHaveBeenCalledWith(
        ONBOARDING_PIN_EXTENSION_ROUTE,
      );
    });
  });
});
