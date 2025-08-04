import React from 'react';
import { fireEvent } from '@testing-library/react';
import reactRouterDom from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest';
import {
  ONBOARDING_PIN_EXTENSION_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import DownloadApp from './download-app';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

const pushMock = jest.fn();
const replaceMock = jest.fn();

type StateOverrides = {
  metamask: {
    isBackupAndSyncEnabled?: boolean;
    participateInMetaMetrics?: boolean;
    isSignedIn?: boolean;
    useExternalServices?: boolean;
    internalAccounts?: {
      accounts: {
        accountId?: {
          address: string;
          metadata: {
            keyring: {
              type: string;
              accounts: string[];
            };
          };
        };
      };
      selectedAccount: string;
    };
    keyrings?: {
      type: string;
      accounts: string[];
    }[];
    firstTimeFlowType?: FirstTimeFlowType;
    seedPhraseBackedUp?: boolean;
  };
  appState?: {
    externalServicesOnboardingToggleState: boolean;
  };
};

const initialState: StateOverrides = {
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
};

const arrangeMocks = (stateOverrides: StateOverrides = initialState) => {
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

  jest
    .spyOn(reactRouterDom, 'useHistory')
    .mockImplementation()
    .mockReturnValue({ push: pushMock, replace: replaceMock });

  return store;
};

describe('Download App Onboarding View', () => {
  describe('When the "Done" button is clicked', () => {
    it('should redirect to the onboarding pin extension route', async () => {
      const store = arrangeMocks();

      const { getByText } = renderWithProvider(<DownloadApp />, store);
      const continueButton = getByText('Continue');

      fireEvent.click(continueButton);

      expect(pushMock).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith(ONBOARDING_PIN_EXTENSION_ROUTE);
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
      renderWithProvider(<DownloadApp />, store);

      expect(replaceMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE);
    });
  });
});
