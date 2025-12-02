import React from 'react';
import configureMockStore from 'redux-mock-store';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom-v5-compat';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  LOCK_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import OnboardingFlowSwitch from './onboarding-flow-switch';

type LocationCaptureProps = {
  onLocationChange: (path: string) => void;
};

// Test component to capture the current location
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function LocationCapture({ onLocationChange }: LocationCaptureProps) {
  const location = useLocation();
  React.useEffect(() => {
    onLocationChange(location.pathname);
  }, [location.pathname, onLocationChange]);
  return null;
}

LocationCapture.propTypes = {
  onLocationChange: PropTypes.func.isRequired,
};

describe('Onboaring Flow Switch Component', () => {
  let currentPath: string;

  it('should route to default route when completed onboarding', () => {
    const mockState = {
      metamask: {
        completedOnboarding: true,
      },
    };

    const mockStore = configureMockStore()(mockState);
    renderWithProvider(
      <>
        <OnboardingFlowSwitch />
        <LocationCapture
          onLocationChange={(path) => {
            currentPath = path;
          }}
        />
      </>,
      mockStore,
    );

    expect(currentPath).toStrictEqual(DEFAULT_ROUTE);
  });

  it('should route to completed onboarding route when seed phrase is other than null', () => {
    const mockState = {
      metamask: {
        seedPhraseBackedUp: false,
      },
    };

    const mockStore = configureMockStore()(mockState);
    renderWithProvider(
      <>
        <OnboardingFlowSwitch />
        <LocationCapture
          onLocationChange={(path) => {
            currentPath = path;
          }}
        />
      </>,
      mockStore,
    );

    expect(currentPath).toStrictEqual(ONBOARDING_COMPLETION_ROUTE);
  });

  it('should route to lock when seedPhrase is not backed up and unlocked', () => {
    const mockState = {
      metamask: {
        seedPhraseBackedUp: null,
        isUnlocked: true,
      },
    };

    const mockStore = configureMockStore()(mockState);
    renderWithProvider(
      <>
        <OnboardingFlowSwitch />
        <LocationCapture
          onLocationChange={(path) => {
            currentPath = path;
          }}
        />
      </>,
      mockStore,
    );

    expect(currentPath).toStrictEqual(LOCK_ROUTE);
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
    renderWithProvider(
      <>
        <OnboardingFlowSwitch />
        <LocationCapture
          onLocationChange={(path) => {
            currentPath = path;
          }}
        />
      </>,
      mockStore,
    );

    expect(currentPath).toStrictEqual(ONBOARDING_UNLOCK_ROUTE);
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
    renderWithProvider(
      <>
        <OnboardingFlowSwitch />
        <LocationCapture
          onLocationChange={(path) => {
            currentPath = path;
          }}
        />
      </>,
      mockStore,
    );

    expect(currentPath).toStrictEqual(ONBOARDING_WELCOME_ROUTE);
  });
});
