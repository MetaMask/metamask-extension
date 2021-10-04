import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import reactRouterDom from 'react-router-dom';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import {
  ONBOARDING_PIN_EXTENSION_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
} from '../../../helpers/constants/routes';
import CreationSuccessful from './creation-successful';

describe('Creation Successful Onboarding View', () => {
  const useHistoryOriginal = reactRouterDom.useHistory;
  const pushMock = jest.fn();
  beforeAll(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: pushMock });
  });
  afterAll(() => {
    reactRouterDom.useHistory = useHistoryOriginal;
  });

  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
    },
  };
  const store = configureMockStore()(mockStore);

  it('should redirect to pin-extension view when "Done" button is clicked', () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />, store);
    const doneButton = getByText('Done');
    fireEvent.click(doneButton);
    expect(pushMock).toHaveBeenCalledWith(ONBOARDING_PIN_EXTENSION_ROUTE);
  });

  it('should redirect to privacy-settings view when "Set advanced privacy settings" button is clicked', () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />, store);
    const privacySettingsButton = getByText('Set advanced privacy settings');
    fireEvent.click(privacySettingsButton);
    expect(pushMock).toHaveBeenCalledWith(ONBOARDING_PRIVACY_SETTINGS_ROUTE);
  });
});
