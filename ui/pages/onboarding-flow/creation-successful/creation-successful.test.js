import React from 'react';
import { fireEvent } from '@testing-library/react';
import reactRouterDom from 'react-router-dom';
import {
  ONBOARDING_PIN_EXTENSION_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
} from '../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../test/jest';
import CreationSuccessful from './creation-successful';

describe('Creation Successful Onboarding View', () => {
  const pushMock = jest.fn();
  beforeAll(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: pushMock });
  });

  it('should redirect to pin-extension view when "Done" button is clicked', () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />);
    const doneButton = getByText('Done');
    fireEvent.click(doneButton);
    expect(pushMock).toHaveBeenCalledWith(ONBOARDING_PIN_EXTENSION_ROUTE);
  });

  it('should redirect to privacy-settings view when "Set advanced privacy settings" button is clicked', () => {
    const { getByText } = renderWithProvider(<CreationSuccessful />);
    const privacySettingsButton = getByText('Set advanced privacy settings');
    fireEvent.click(privacySettingsButton);
    expect(pushMock).toHaveBeenCalledWith(ONBOARDING_PRIVACY_SETTINGS_ROUTE);
  });
});
