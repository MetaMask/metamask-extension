import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import initializedMockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import {
  setFirstTimeFlowType,
  setTermsOfUseLastAgreed,
} from '../../../store/actions';
import {
  ONBOARDING_METAMETRICS,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
} from '../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import OnboardingWelcome from './welcome';

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
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

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
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
        { replace: true },
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
      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_COMPLETION_ROUTE,
        { replace: true },
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
        expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS);
      });
    });
  });
});
