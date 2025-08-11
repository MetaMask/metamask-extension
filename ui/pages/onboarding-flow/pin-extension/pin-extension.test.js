import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
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

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockNavigate,
  };
});

describe('Creation Successful Onboarding View', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

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
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
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

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE, {
        replace: true,
      });
    });
  });
});
