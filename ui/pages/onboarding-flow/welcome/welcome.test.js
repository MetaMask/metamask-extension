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
      const createWallet = screen.getByTestId('onboarding-create-wallet');
      fireEvent.click(createWallet);

      const modalBody = screen
        .getByRole('dialog')
        .querySelector('.mm-modal-body');
      Object.defineProperties(modalBody, {
        scrollHeight: { configurable: true, get: () => 1000 },
        clientHeight: { configurable: true, get: () => 400 },
      });
      fireEvent.scroll(modalBody, { target: { scrollTop: 1000 } });

      const termsCheckbox = screen.getByRole('checkbox');
      fireEvent.click(termsCheckbox);
      const acceptButton = screen.getByRole('button', { name: /agree/iu });
      fireEvent.click(acceptButton);

      expect(setTermsOfUseLastAgreed).toHaveBeenCalled();
      expect(setFirstTimeFlowType).toHaveBeenCalledWith(
        FirstTimeFlowType.create,
      );
    });

    it('should set first time flow to import and route to metametrics', async () => {
      renderWithProvider(<OnboardingWelcome />, mockStore);
      const importWallet = screen.getByTestId('onboarding-import-wallet');
      fireEvent.click(importWallet);

      const modalBody = screen
        .getByRole('dialog')
        .querySelector('.mm-modal-body');
      Object.defineProperties(modalBody, {
        scrollHeight: { configurable: true, get: () => 1000 },
        clientHeight: { configurable: true, get: () => 400 },
      });
      fireEvent.scroll(modalBody, { target: { scrollTop: 1000 } });

      const termsCheckbox = screen.getByRole('checkbox');
      fireEvent.click(termsCheckbox);
      const acceptButton = screen.getByRole('button', { name: /agree/iu });
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(setTermsOfUseLastAgreed).toHaveBeenCalled();
        expect(setFirstTimeFlowType).toHaveBeenCalledWith('import');
        expect(mockHistoryPush).toHaveBeenCalledWith(ONBOARDING_METAMETRICS);
      });
    });
  });

  describe('Terms of Use Modal', () => {
    const mockStore = configureMockStore([thunk])(mockState);

    it('should show modal when create wallet is clicked', () => {
      renderWithProvider(<OnboardingWelcome />, mockStore);
      const createWallet = screen.getByTestId('onboarding-create-wallet');
      fireEvent.click(createWallet);

      expect(
        screen.getByText('Review our latest terms of use'),
      ).toBeInTheDocument();
    });

    it('should show modal when import wallet is clicked', () => {
      renderWithProvider(<OnboardingWelcome />, mockStore);
      const importWallet = screen.getByTestId('onboarding-import-wallet');
      fireEvent.click(importWallet);

      expect(
        screen.getByText('Review our latest terms of use'),
      ).toBeInTheDocument();
    });

    it('should have terms checkbox disabled initially and accept button disabled', () => {
      renderWithProvider(<OnboardingWelcome />, mockStore);
      const createWallet = screen.getByTestId('onboarding-create-wallet');
      fireEvent.click(createWallet);

      const termsCheckbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByRole('button', { name: /agree/iu });

      expect(termsCheckbox).toBeDisabled();
      expect(acceptButton).toBeDisabled();
    });

    it('should enable checkbox after scrolling to bottom', () => {
      renderWithProvider(<OnboardingWelcome />, mockStore);
      const createWallet = screen.getByTestId('onboarding-create-wallet');
      fireEvent.click(createWallet);

      const modalBody = screen
        .getByRole('dialog')
        .querySelector('.mm-modal-body');
      if (!modalBody) {
        throw new Error('Modal body not found');
      }

      Object.defineProperties(modalBody, {
        scrollHeight: { configurable: true, get: () => 1000 },
        clientHeight: { configurable: true, get: () => 400 },
      });

      fireEvent.scroll(modalBody, { target: { scrollTop: 1000 } });

      const termsCheckbox = screen.getByRole('checkbox');
      expect(termsCheckbox).not.toBeDisabled();
    });

    it('should enable accept button only after terms are agreed', async () => {
      renderWithProvider(<OnboardingWelcome />, mockStore);
      const createWallet = screen.getByTestId('onboarding-create-wallet');
      fireEvent.click(createWallet);

      const modalBody = screen
        .getByRole('dialog')
        .querySelector('.mm-modal-body');
      if (!modalBody) {
        throw new Error('Modal body not found');
      }

      Object.defineProperties(modalBody, {
        scrollHeight: { configurable: true, get: () => 1000 },
        clientHeight: { configurable: true, get: () => 400 },
      });

      fireEvent.scroll(modalBody, { target: { scrollTop: 1000 } });

      const termsCheckbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByRole('button', { name: /agree/iu });

      expect(acceptButton).toBeDisabled();

      fireEvent.click(termsCheckbox);
      expect(acceptButton).not.toBeDisabled();
    });

    it('should close modal when clicking outside', () => {
      renderWithProvider(<OnboardingWelcome />, mockStore);
      const createWallet = screen.getByTestId('onboarding-create-wallet');
      fireEvent.click(createWallet);

      // The modal overlay is rendered at the document.body level
      const modalOverlay = document.querySelector('.mm-modal-overlay');
      if (!modalOverlay) {
        throw new Error('Modal overlay not found');
      }

      fireEvent.mouseDown(modalOverlay);

      expect(
        screen.queryByText('Review our latest terms of use'),
      ).not.toBeInTheDocument();
    });
  });
});
