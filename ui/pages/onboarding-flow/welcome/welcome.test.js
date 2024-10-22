import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import initializedMockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import {
  setFirstTimeFlowType,
  setTermsOfUseLastAgreed,
  addNetwork,
  updateNetworksList,
} from '../../../store/actions';
import {
  ONBOARDING_METAMETRICS,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
} from '../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import OnboardingWelcome from './welcome';

const mockHistoryReplace = jest.fn();
const mockHistoryPush = jest.fn();

jest.mock('../../../store/actions.ts', () => ({
  setFirstTimeFlowType: jest.fn().mockReturnValue(
    jest.fn((type) => {
      return type;
    }),
  ),
  setTermsOfUseLastAgreed: jest.fn().mockReturnValue(
    jest.fn((type) => {
      return type;
    }),
  ),
  setParticipateInMetaMetrics: jest.fn().mockReturnValue(
    jest.fn((type) => {
      return type;
    }),
  ),
  addNetwork: jest.fn(),
  updateNetworksList: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
    replace: mockHistoryReplace,
  }),
}));

describe('Onboarding Welcome Component', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {},
        selectedAccount: '',
      },
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialized State Conditionals with keyrings and firstTimeFlowType', () => {
    it('should route to secure your wallet when keyring is present but not imported first time flow type', () => {
      const mockStore = configureMockStore([thunk])(initializedMockState);

      renderWithProvider(<OnboardingWelcome />, mockStore);
      expect(mockHistoryReplace).toHaveBeenCalledWith(
        ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
      );
    });

    it('should route to completion when keyring is present and imported first time flow type', () => {
      const importFirstTimeFlowState = {
        ...initializedMockState,
        metamask: {
          ...initializedMockState.metamask,
          firstTimeFlowType: FirstTimeFlowType.import,
        },
      };
      const mockStore = configureMockStore([thunk])(importFirstTimeFlowState);

      renderWithProvider(<OnboardingWelcome />, mockStore);
      expect(mockHistoryReplace).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
      );
    });
  });

  describe('Welcome Component', () => {
    const mockStore = configureMockStore([thunk])(mockState);

    it('should render', () => {
      renderWithProvider(<OnboardingWelcome />, mockStore);
      const onboardingWelcome = screen.queryByTestId('onboarding-welcome');
      expect(onboardingWelcome).toBeInTheDocument();
    });

    it('should set first time flow to create and route to metametrics', () => {
      renderWithProvider(<OnboardingWelcome />, mockStore);
      const termsCheckbox = screen.getByTestId('onboarding-terms-checkbox');
      fireEvent.click(termsCheckbox);
      const createWallet = screen.getByTestId('onboarding-create-wallet');
      fireEvent.click(createWallet);

      expect(setTermsOfUseLastAgreed).toHaveBeenCalled();
      expect(setFirstTimeFlowType).toHaveBeenCalledWith(
        FirstTimeFlowType.create,
      );
    });

    it('should set first time flow to import and route to metametrics', async () => {
      renderWithProvider(<OnboardingWelcome />, mockStore);
      const termsCheckbox = screen.getByTestId('onboarding-terms-checkbox');
      fireEvent.click(termsCheckbox);

      const createWallet = screen.getByTestId('onboarding-import-wallet');
      fireEvent.click(createWallet);

      await waitFor(() => {
        expect(setTermsOfUseLastAgreed).toHaveBeenCalled();
        expect(setFirstTimeFlowType).toHaveBeenCalledWith('import');
        expect(mockHistoryPush).toHaveBeenCalledWith(ONBOARDING_METAMETRICS);
      });
    });

    describe('useEffect for adding networks', () => {
      it('should add networks when onboarding is incomplete', async () => {
        // Render the component
        renderWithProvider(<OnboardingWelcome />, mockStore);

        await waitFor(() => {
          // Verify addNetwork is called with Arbitrum (or other networks)
          expect(addNetwork).toHaveBeenCalledWith({
            chainId: '0xa4b1', // Arbitrum's chain ID
            blockExplorerUrls: ['https://explorer.arbitrum.io'], // Arbitrum block explorer
            defaultRpcEndpointIndex: 0,
            defaultBlockExplorerUrlIndex: 0,
            name: 'Arbitrum One',
            nativeCurrency: 'ETH',
            rpcEndpoints: [
              {
                url: 'https://arbitrum-mainnet.infura.io/v3/undefined',
                type: 'custom',
              },
            ],
          });
        });
      });

      it('should not add networks when onboarding is completed', async () => {
        const mockCompletedOnboardingState = {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            completedOnboarding: true, // Simulate completed onboarding
          },
        };
        const mockStore2 = configureMockStore([thunk])(
          mockCompletedOnboardingState,
        );

        renderWithProvider(<OnboardingWelcome />, mockStore2);

        // Wait to ensure the effect runs (or doesn't in this case)
        await waitFor(() => {
          // Expect that neither addNetwork nor updateNetworksList was called
          expect(addNetwork).not.toHaveBeenCalled();
          expect(updateNetworksList).not.toHaveBeenCalled();
        });
      });
    });
  });
});
