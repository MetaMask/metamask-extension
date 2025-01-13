import React from 'react';
import { fireEvent } from '@testing-library/react';
import reactRouterDom from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest';
import {
  setCompletedOnboarding,
  toggleExternalServices,
  performSignIn,
} from '../../../store/actions';
import PinExtension from './pin-extension';

jest.mock('../../../store/actions', () => ({
  toggleExternalServices: jest.fn(),
  setCompletedOnboarding: jest.fn(),
  performSignIn: jest.fn(),
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

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => []),
}));

describe('Creation Successful Onboarding View', () => {
  const arrangeMocks = (
    stateOverrides = {
      metamask: {
        isProfileSyncingEnabled: false,
        participateInMetaMetrics: true,
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
    performSignIn.mockClear();

    const pushMock = jest.fn();
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: pushMock });

    return store;
  };

  describe('When the "Done" button is clicked', () => {
    it('should call completeOnboarding in the background when Done" button is clicked', async () => {
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

    it.each`
      isProfileSyncingEnabled | participateInMetaMetrics | externalServicesOnboardingToggleState
      ${true}                 | ${true}                  | ${true}
      ${true}                 | ${false}                 | ${true}
      ${false}                | ${true}                  | ${true}
    `(
      'should call performSignIn when isProfileSyncingEnabled is $isProfileSyncingEnabled, participateInMetaMetrics is $participateInMetaMetrics and externalServicesOnboardingToggleState is $externalServicesOnboardingToggleState',
      async ({
        isProfileSyncingEnabled,
        participateInMetaMetrics,
        externalServicesOnboardingToggleState,
      }) => {
        const store = arrangeMocks({
          metamask: {
            isProfileSyncingEnabled,
            participateInMetaMetrics,
          },
          appState: {
            externalServicesOnboardingToggleState,
          },
        });

        const { getByText } = renderWithProvider(<PinExtension />, store);
        const nextButton = getByText('Next');
        fireEvent.click(nextButton);
        const gotItButton = getByText('Done');
        fireEvent.click(gotItButton);
        await Promise.all(mockPromises);
        expect(performSignIn).toHaveBeenCalledTimes(1);
      },
    );

    it('should not call performSignIn when both isProfileSyncingEnabled and participateInMetaMetrics are false', async () => {
      const store = arrangeMocks({
        metamask: {
          isProfileSyncingEnabled: false,
          participateInMetaMetrics: false,
        },
      });

      const { getByText } = renderWithProvider(<PinExtension />, store);
      const nextButton = getByText('Next');
      fireEvent.click(nextButton);
      const gotItButton = getByText('Done');
      fireEvent.click(gotItButton);
      await Promise.all(mockPromises);
      expect(performSignIn).not.toHaveBeenCalled();
    });

    it('should not call performSignIn when externalServicesOnboardingToggleState is false', async () => {
      const store = arrangeMocks({
        appState: {
          externalServicesOnboardingToggleState: false,
        },
      });

      const { getByText } = renderWithProvider(<PinExtension />, store);
      const nextButton = getByText('Next');
      fireEvent.click(nextButton);
      const gotItButton = getByText('Done');
      fireEvent.click(gotItButton);
      await Promise.all(mockPromises);
      expect(performSignIn).not.toHaveBeenCalled();
    });
  });
});
