import React from 'react';
import configureMockStore from 'redux-mock-store';
import { waitFor } from '@testing-library/react';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  LOCK_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import OnboardingFlowSwitch from './onboarding-flow-switch';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('Onboaring Flow Switch Component', () => {
  it('should route to default route when completed onboarding', () => {
    const mockState = {
      metamask: {
        completedOnboarding: true,
      },
    };

    const mockStore = configureMockStore()(mockState);
    renderWithProvider(<OnboardingFlowSwitch />, mockStore);

    waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  it('should route to completed onboarding route when seed phrase is other than null', () => {
    const mockState = {
      metamask: {
        seedPhraseBackedUp: false,
      },
    };

    const mockStore = configureMockStore()(mockState);
    renderWithProvider(<OnboardingFlowSwitch />, mockStore);

    waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_COMPLETION_ROUTE);
    });
  });

  it('should route to lock when seedPhrase is not backed up and unlocked', () => {
    const mockState = {
      metamask: {
        seedPhraseBackedUp: null,
        isUnlocked: true,
      },
    };

    const mockStore = configureMockStore()(mockState);
    renderWithProvider(<OnboardingFlowSwitch />, mockStore);

    waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(LOCK_ROUTE);
    });
  });

  it('should route to unlock when with appropriate state', () => {
    const mockState = {
      metamask: {
        seedPhraseBackedUp: null,
        isUnlocked: false,
        isInitialized: true,
      },
    };

    const mockStore = configureMockStore()(mockState);
    renderWithProvider(<OnboardingFlowSwitch />, mockStore);

    waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_UNLOCK_ROUTE);
    });
  });

  it('should route to welcome route when not initialized', () => {
    const mockState = {
      metamask: {
        seedPhraseBackedUp: null,
        isUnlocked: false,
        isInitialized: false,
      },
    };

    const mockStore = configureMockStore()(mockState);
    renderWithProvider(<OnboardingFlowSwitch />, mockStore);

    waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_WELCOME_ROUTE);
    });
  });
});
