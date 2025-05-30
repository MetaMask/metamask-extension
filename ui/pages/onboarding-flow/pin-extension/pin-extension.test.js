import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest';
import {
  setCompletedOnboarding,
  toggleExternalServices,
} from '../../../store/actions';
import PinExtension from './pin-extension';

jest.mock('../../../store/actions', () => ({
  toggleExternalServices: jest.fn(),
  setCompletedOnboarding: jest.fn(),
}));

const mockPromises = [];

const mockDispatch = jest.fn().mockImplementation(() => {
  const promise = Promise.resolve();
  mockPromises.push(promise);
  return promise;
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

describe('Creation Successful Onboarding View', () => {
  const arrangeMocks = (
    stateOverrides = {
      metamask: {
        isBackupAndSyncEnabled: false,
        participateInMetaMetrics: true,
        isSignedIn: false,
        useExternalServices: true,
      },
      appState: {
        externalServicesOnboardingToggleState: true,
      },
    },
  ) => {
    const mockStore = {
      metamask: {
        providerConfig: {
          type: 'test',
        },
        ...stateOverrides.metamask,
      },
      appState: {
        ...stateOverrides.appState,
      },
    };
    const store = configureMockStore([thunk])(mockStore);

    toggleExternalServices.mockClear();
    setCompletedOnboarding.mockClear();

    return store;
  };

  describe('When the "Done" button is clicked', () => {
    it('should call toggleExternalServices, setCompletedOnboarding and signIn when the "Done" button is clicked', async () => {
      const store = arrangeMocks();

      const { getByText } = renderWithProvider(<PinExtension />, store);
      const nextButton = getByText('Next');
      fireEvent.click(nextButton);
      const gotItButton = getByText('Done');
      fireEvent.click(gotItButton);
      await Promise.all(mockPromises);
      expect(toggleExternalServices).toHaveBeenCalledTimes(1);
      expect(setCompletedOnboarding).toHaveBeenCalledTimes(1);
    });
  });
});
