import {
  DeFiPositionsControllerV2,
  DeFiPositionsControllerV2Messenger,
} from '@metamask/assets-controllers';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  DeFiPositionsControllerV2InitMessenger,
  getDeFiPositionsControllerV2InitMessenger,
  getDeFiPositionsControllerV2Messenger,
} from '../messengers/defi-positions/defi-positions-controller-v2-messenger';
import { getRootMessenger } from '../../lib/messenger';
import { DEFI_CONTROLLER_V2_FLAG } from '../../../../shared/lib/defi-controller-v2/remote-feature-flag';
import { DeFiPositionsControllerV2Init } from './defi-positions-controller-v2-init';

jest.mock('@metamask/assets-controllers');

jest.mock('@metamask/core-backend', () => ({
  createApiPlatformClient: jest.fn().mockReturnValue({ mockApiClient: true }),
}));

function buildInitRequestMock(
  options: {
    useExternalServices?: boolean;
    completedOnboarding?: boolean;
    currentCurrency?: string;
    defiControllerV2Enabled?: boolean;
  } = {},
): jest.Mocked<
  MessengerClientInitRequest<
    DeFiPositionsControllerV2Messenger,
    DeFiPositionsControllerV2InitMessenger
  >
> {
  const {
    useExternalServices = true,
    completedOnboarding = true,
    currentCurrency = 'usd',
    defiControllerV2Enabled = true,
  } = options;

  const baseControllerMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getDeFiPositionsControllerV2Messenger(
      baseControllerMessenger,
    ),
    initMessenger: getDeFiPositionsControllerV2InitMessenger(
      baseControllerMessenger,
    ),
  };

  requestMock.initMessenger.call = jest.fn().mockImplementation((action) => {
    if (action === 'RemoteFeatureFlagController:getState') {
      return {
        remoteFeatureFlags: {
          [DEFI_CONTROLLER_V2_FLAG]: { enabled: defiControllerV2Enabled },
        },
      };
    }
    if (action === 'CurrencyRateController:getState') {
      return { currentCurrency };
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

describe('DeFiPositionsControllerV2Init', () => {
  const defiPositionsControllerV2ClassMock = jest.mocked(
    DeFiPositionsControllerV2,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      DeFiPositionsControllerV2Init(requestMock).messengerClient,
    ).toBeInstanceOf(DeFiPositionsControllerV2);
  });

  it('returns null persistedStateKey', () => {
    const requestMock = buildInitRequestMock();
    expect(
      DeFiPositionsControllerV2Init(requestMock).persistedStateKey,
    ).toBeNull();
  });

  it('initializes with messenger, apiClient, isEnabled, and getVsCurrency', () => {
    const requestMock = buildInitRequestMock();
    DeFiPositionsControllerV2Init(requestMock);

    expect(defiPositionsControllerV2ClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      apiClient: { mockApiClient: true },
      isEnabled: expect.any(Function),
      getVsCurrency: expect.any(Function),
    });
  });

  describe('isEnabled', () => {
    it('returns true when onboarding is complete, external services are on, and V2 flag is enabled', () => {
      const requestMock = buildInitRequestMock();
      DeFiPositionsControllerV2Init(requestMock);

      const { isEnabled } = defiPositionsControllerV2ClassMock.mock.calls[0][0];
      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(true);
    });

    it('returns false when onboarding is incomplete', () => {
      const requestMock = buildInitRequestMock({
        completedOnboarding: false,
      });
      DeFiPositionsControllerV2Init(requestMock);

      const { isEnabled } = defiPositionsControllerV2ClassMock.mock.calls[0][0];
      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('returns false when external services are disabled', () => {
      const requestMock = buildInitRequestMock({
        useExternalServices: false,
      });
      DeFiPositionsControllerV2Init(requestMock);

      const { isEnabled } = defiPositionsControllerV2ClassMock.mock.calls[0][0];
      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });

    it('returns false when V2 feature flag is disabled', () => {
      const requestMock = buildInitRequestMock({
        defiControllerV2Enabled: false,
      });
      DeFiPositionsControllerV2Init(requestMock);

      const { isEnabled } = defiPositionsControllerV2ClassMock.mock.calls[0][0];
      expect(isEnabled).toBeDefined();
      expect(isEnabled?.()).toBe(false);
    });
  });

  describe('getVsCurrency', () => {
    it('returns the current currency from CurrencyRateController', () => {
      const requestMock = buildInitRequestMock({ currentCurrency: 'eur' });
      DeFiPositionsControllerV2Init(requestMock);

      const { getVsCurrency } =
        defiPositionsControllerV2ClassMock.mock.calls[0][0];
      expect(getVsCurrency).toBeDefined();
      expect(getVsCurrency?.()).toBe('eur');
    });
  });
});
