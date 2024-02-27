import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_PIN_EXTENSION_ROUTE,
} from '../../../helpers/constants/routes';
import { setBackgroundConnection } from '../../../store/background-connection';
import { renderWithProvider } from '../../../../test/jest';
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
    },
  };
  const store = configureMockStore([thunk])(mockStore);
  setBackgroundConnection({ completeOnboarding: completeOnboardingStub });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should redirect to privacy-settings view when "Advanced configuration" button is clicked', () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />, store);
    const privacySettingsButton = getByText('Advanced configuration');
    fireEvent.click(privacySettingsButton);
    expect(mockHistoryPush).toHaveBeenCalledWith(
      ONBOARDING_PRIVACY_SETTINGS_ROUTE,
    );
  });

  it('should route to pin extension route when "Got it" button is clicked', () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />, store);
    const gotItButton = getByText('Got it');
    fireEvent.click(gotItButton);
    expect(mockHistoryPush).toHaveBeenCalledWith(
      ONBOARDING_PIN_EXTENSION_ROUTE,
    );
  });
});
