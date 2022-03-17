import React from 'react';
import { fireEvent } from '@testing-library/react';
import reactRouterDom from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ONBOARDING_PRIVACY_SETTINGS_ROUTE } from '../../../helpers/constants/routes';
import {
  renderWithProvider,
  setBackgroundConnection,
} from '../../../../test/jest';
import CreationSuccessful from './creation-successful';

const completeOnboardingStub = jest
  .fn()
  .mockImplementation(() => Promise.resolve());

describe('Creation Successful Onboarding View', () => {
  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
    },
  };
  const store = configureMockStore([thunk])(mockStore);
  setBackgroundConnection({ completeOnboarding: completeOnboardingStub });

  const pushMock = jest.fn();
  beforeAll(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: pushMock });
  });

  it('should call completeOnboarding in the background when "Got it!" button is clicked', () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />, store);
    const gotItButton = getByText('Got it!');
    fireEvent.click(gotItButton);
    expect(completeOnboardingStub).toHaveBeenCalledTimes(1);
  });

  it('should redirect to privacy-settings view when "Set advanced privacy settings" button is clicked', () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />, store);
    const privacySettingsButton = getByText('Set advanced privacy settings');
    fireEvent.click(privacySettingsButton);
    expect(pushMock).toHaveBeenCalledWith(ONBOARDING_PRIVACY_SETTINGS_ROUTE);
  });
});
