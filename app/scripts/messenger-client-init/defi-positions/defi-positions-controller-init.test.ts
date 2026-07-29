import {
  DeFiPositionsControllerMessenger,
  DeFiPositionsController,
} from '@metamask/assets-controllers';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  DeFiPositionsControllerInitMessenger,
  getDeFiPositionsControllerInitMessenger,
  getDeFiPositionsControllerMessenger,
} from '../messengers/defi-positions/defi-positions-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';
import { FeatureFlagNames } from '../../../../shared/lib/feature-flags';
import { DEFI_CONTROLLER_V2_FLAG } from '../../../../shared/lib/defi-controller-v2/remote-feature-flag';
import { DeFiPositionsControllerInit } from './defi-positions-controller-init';

jest.mock('@metamask/assets-controllers');

jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.fn(() => ({
    addProperties: jest.fn().mockReturnThis(),
    addSensitiveProperties: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  })),
  trackEvent: jest.fn(),
}));

function buildInitRequestMock(
  options: {
    useExternalServices?: boolean;
    completedOnboarding?: boolean;
    assetsDefiPositionsEnabled?: boolean;
    defiControllerV2Enabled?: boolean;
  } = {},
): jest.Mocked<
  MessengerClientInitRequest<
    DeFiPositionsControllerMessenger,
    DeFiPositionsControllerInitMessenger
  >
> {
  const {
    useExternalServices = true,
    completedOnboarding = true,
    assetsDefiPositionsEnabled = true,
    defiControllerV2Enabled = false,
  } = options;

  const baseControllerMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getDeFiPositionsControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getDeFiPositionsControllerInitMessenger(
      baseControllerMessenger,
    ),
  };

  requestMock.initMessenger.call = jest.fn().mockImplementation((action) => {
    if (action === 'RemoteFeatureFlagController:getState') {
      return {
        remoteFeatureFlags: {
          [FeatureFlagNames.AssetsDefiPositionsEnabled]:
            assetsDefiPositionsEnabled,
          [DEFI_CONTROLLER_V2_FLAG]: { enabled: defiControllerV2Enabled },
        },
      };
    }
    throw new Error(`Unexpected action: ${action}`);
  });

  // @ts-expect-error: Partial mock.
  requestMock.getMessengerClient.mockImplementation((name: string) => {
    if (name === 'PreferencesController') {
      return { state: { useExternalServices } };
    }
    if (name === 'OnboardingController') {
      return { state: { completedOnboarding } };
    }
    throw new Error(`Unexpected messenger client: ${name}`);
  });

  return requestMock;
}

describe('DefiPositionsControllerInit', () => {
  const defiPositionsControllerClassMock = jest.mocked(DeFiPositionsController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      DeFiPositionsControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(DeFiPositionsController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    DeFiPositionsControllerInit(requestMock);

    expect(defiPositionsControllerClassMock).toHaveBeenCalled();
  });

  describe('isEnabled', () => {
    it('returns true when legacy conditions are met and V2 is disabled', () => {
      const requestMock = buildInitRequestMock();
      DeFiPositionsControllerInit(requestMock);

      const { isEnabled } = defiPositionsControllerClassMock.mock.calls[0][0];
      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(true);
    });

    it('returns false when V2 feature flag is enabled', () => {
      const requestMock = buildInitRequestMock({
        defiControllerV2Enabled: true,
      });
      DeFiPositionsControllerInit(requestMock);

      const { isEnabled } = defiPositionsControllerClassMock.mock.calls[0][0];
      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('returns false when onboarding is incomplete', () => {
      const requestMock = buildInitRequestMock({
        completedOnboarding: false,
      });
      DeFiPositionsControllerInit(requestMock);

      const { isEnabled } = defiPositionsControllerClassMock.mock.calls[0][0];
      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('returns false when external services are disabled', () => {
      const requestMock = buildInitRequestMock({
        useExternalServices: false,
      });
      DeFiPositionsControllerInit(requestMock);

      const { isEnabled } = defiPositionsControllerClassMock.mock.calls[0][0];
      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('returns false when assets DeFi positions flag is disabled', () => {
      const requestMock = buildInitRequestMock({
        assetsDefiPositionsEnabled: false,
      });
      DeFiPositionsControllerInit(requestMock);

      const { isEnabled } = defiPositionsControllerClassMock.mock.calls[0][0];
      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });
  });
});
