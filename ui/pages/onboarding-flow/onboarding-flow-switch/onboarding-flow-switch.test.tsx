import React from 'react';
import configureMockStore from 'redux-mock-store';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_EXPERIMENTAL_AREA,
  ONBOARDING_METAMETRICS,
  ONBOARDING_UNLOCK_ROUTE,
  LOCK_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import OnboardingFlowSwitch from './onboarding-flow-switch';

jest.mock('../../../../shared/lib/build-types', () => ({
  isFlask: jest.fn().mockReturnValue(false),
  isMain: jest.fn().mockReturnValue(true),
  isBeta: jest.fn().mockReturnValue(false),
  isExperimental: jest.fn().mockReturnValue(false),
}));

jest.mock('../../../hooks/useIsFirefox', () => ({
  useIsFirefox: jest.fn().mockReturnValue(false),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const buildTypes = jest.requireMock('../../../../shared/lib/build-types');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useIsFirefox } = jest.requireMock('../../../hooks/useIsFirefox');

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

  beforeEach(() => {
    buildTypes.isFlask.mockReturnValue(false);
    buildTypes.isMain.mockReturnValue(true);
    buildTypes.isBeta.mockReturnValue(false);
    buildTypes.isExperimental.mockReturnValue(false);
    jest.mocked(useIsFirefox).mockReturnValue(false);
  });

  it('routes to default route when completed onboarding', () => {
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

  it('routes to completed onboarding route when seed phrase is other than null', () => {
    const mockState = {
      metamask: {
        seedPhraseBackedUp: false,
        completedMetaMetricsOnboarding: true,
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

  it('routes to metametrics route when seed phrase is other than null and metrics onboarding is incomplete', () => {
    const mockState = {
      metamask: {
        seedPhraseBackedUp: false,
        completedMetaMetricsOnboarding: false,
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

    expect(currentPath).toStrictEqual(ONBOARDING_METAMETRICS);
  });

  it('routes to lock when seedPhrase is not backed up and unlocked', () => {
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

  it('routes to unlock when with appropriate state', () => {
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

  it('routes to welcome route when not initialized', () => {
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

  it('routes to experimental area when build type is Flask and not initialized', () => {
    buildTypes.isFlask.mockReturnValue(true);
    buildTypes.isMain.mockReturnValue(false);

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

    expect(currentPath).toStrictEqual(ONBOARDING_EXPERIMENTAL_AREA);
  });

  it('routes to metametrics route when on Firefox and not initialized', () => {
    jest.mocked(useIsFirefox).mockReturnValue(true);

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

    expect(currentPath).toStrictEqual(ONBOARDING_METAMETRICS);
  });

  it('logs the unreachable-code error when build type is unknown and not initialized', () => {
    buildTypes.isFlask.mockReturnValue(false);
    buildTypes.isMain.mockReturnValue(false);
    buildTypes.isBeta.mockReturnValue(false);
    buildTypes.isExperimental.mockReturnValue(false);

    // React Router's error boundary catches the throw and logs it via console.error
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const mockState = {
      metamask: {
        seedPhraseBackedUp: null,
        isUnlocked: false,
        isInitialized: false,
      },
    };

    const mockStore = configureMockStore()(mockState);
    renderWithProvider(<OnboardingFlowSwitch />, mockStore);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error handled by React Router'),
      expect.objectContaining({
        message: expect.stringContaining('unreachable code'),
      }),
    );

    consoleSpy.mockRestore();
  });

  it('routes to create-password when social user is authenticated and flow is socialCreate', () => {
    const mockState = {
      metamask: {
        seedPhraseBackedUp: null,
        isUnlocked: false,
        isInitialized: false,
        isSeedlessOnboardingUserAuthenticated: true,
        authConnection: 'google',
        socialLoginEmail: 'user@example.com',
        firstTimeFlowType: FirstTimeFlowType.socialCreate,
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

    expect(currentPath).toStrictEqual(ONBOARDING_CREATE_PASSWORD_ROUTE);
  });
});
