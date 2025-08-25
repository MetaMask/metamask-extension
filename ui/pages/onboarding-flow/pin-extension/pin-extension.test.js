import React from 'react';
import { fireEvent } from '@testing-library/react';
import reactRouterDom from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest';
import {
  setCompletedOnboarding,
  toggleExternalServices,
} from '../../../store/actions';
import {
  DEFAULT_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
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

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

const pushMock = jest.fn();
const replaceMock = jest.fn();

describe('Creation Successful Onboarding View', () => {
  const arrangeMocks = (
    stateOverrides = {
      metamask: {
        isBackupAndSyncEnabled: false,
        participateInMetaMetrics: true,
        isSignedIn: false,
        useExternalServices: true,
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

    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: pushMock, replace: replaceMock });

    return store;
  };

  describe('When the "Done" button is clicked', () => {
    it('should call toggleExternalServices, setCompletedOnboarding and signIn when the "Done" button is clicked', async () => {
      const store = arrangeMocks();

      const { getByText } = renderWithProvider(<PinExtension />, store);
      const doneButton = getByText('Done');

      fireEvent.click(doneButton);

      await Promise.all(mockPromises);
      expect(toggleExternalServices).toHaveBeenCalledTimes(1);
      expect(setCompletedOnboarding).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  describe('When the user has not created a wallet', () => {
    it('should redirect to the onboarding welcome route', () => {
      const mockState = {
        metamask: {
          internalAccounts: {
            accounts: {},
            selectedAccount: '',
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
      };

      const store = arrangeMocks(mockState);
      renderWithProvider(<PinExtension />, store);

      expect(replaceMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE);
    });
  });
});
