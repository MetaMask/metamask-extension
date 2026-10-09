import { RewardsController } from '../controllers/rewards/rewards-controller';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import {
  RewardsControllerMessenger,
  RewardsControllerState,
} from '../controllers/rewards/rewards-controller.types';
import { getRootMessenger } from '../lib/messenger';
import {
  getRewardsControllerMessenger,
  getRewardsControllerInitMessenger,
} from './messengers/rewards-controller-messenger';
import { buildControllerInitRequestMock } from './test/utils';
import { RewardsControllerInit } from './rewards-controller-init';
import type { RewardsControllerInitMessenger } from './messengers/rewards-controller-messenger';
import type { MessengerClientInitRequest } from './types';

jest.mock('../controllers/rewards/rewards-controller');
jest.mock('../../../shared/lib/manifestFlags');
jest.mock('../../../shared/lib/feature-flags/version-gating');

const mockGetManifestFlags = jest.mocked(getManifestFlags);

function buildInitRequestMock(
  remoteFeatureFlags?: Record<string, unknown>,
  useExternalServices = true,
  completedOnboarding = true,
): jest.Mocked<
  MessengerClientInitRequest<
    RewardsControllerMessenger,
    RewardsControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  const initMessenger = getRewardsControllerInitMessenger(
    baseControllerMessenger,
  );

  // Mock the RemoteFeatureFlagController:getState and PreferencesController:getState calls
  // Always set up the mock, defaulting to empty remoteFeatureFlags if not provided
  jest.spyOn(initMessenger, 'call').mockImplementation((action: string) => {
    if (action === 'RemoteFeatureFlagController:getState') {
      return { remoteFeatureFlags: remoteFeatureFlags ?? {} } as never;
    }
    if (action === 'PreferencesController:getState') {
      return { useExternalServices } as never;
    }
    if (action === 'OnboardingController:getState') {
      return { completedOnboarding } as never;
    }
    return undefined as never;
  });

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getRewardsControllerMessenger(baseControllerMessenger),
    initMessenger,
  };
}

describe('RewardsControllerInit', () => {
  const RewardsControllerClassMock = jest.mocked(RewardsController);

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetManifestFlags.mockReturnValue({
      remoteFeatureFlags: undefined,
    } as never);
  });

  describe('controller instantiation', () => {
    it('returns controller instance', () => {
      const requestMock = buildInitRequestMock();
      const result = RewardsControllerInit(requestMock);

      expect(result.messengerClient).toBeInstanceOf(RewardsController);
    });

    it('initializes with correct messenger', () => {
      const requestMock = buildInitRequestMock();
      RewardsControllerInit(requestMock);

      expect(RewardsControllerClassMock).toHaveBeenCalledWith({
        messenger: requestMock.controllerMessenger,
        state: expect.any(Object),
        isDisabled: expect.any(Function),
        isVipDisabled: expect.any(Function),
      });
    });

    it('uses persisted state when available', () => {
      const requestMock = buildInitRequestMock();
      const mockPersistedState = {
        rewardsActiveAccount: null,
        rewardsAccounts: {},
        rewardsSubscriptions: {},
        rewardsSeasons: {},
        rewardsSeasonStatuses: {},
        rewardsSubscriptionTokens: {},
      } as Partial<RewardsControllerState>;
      requestMock.persistedState.RewardsController = mockPersistedState;

      RewardsControllerInit(requestMock);

      expect(RewardsControllerClassMock).toHaveBeenCalledWith({
        messenger: requestMock.controllerMessenger,
        state: mockPersistedState,
        isDisabled: expect.any(Function),
        isVipDisabled: expect.any(Function),
      });
    });

    it('uses default state when no persisted state', () => {
      const requestMock = buildInitRequestMock();

      RewardsControllerInit(requestMock);

      const [constructorArgs] = RewardsControllerClassMock.mock.calls[0];
      expect(constructorArgs.state).toBeDefined();
    });
  });

  describe('isDisabled', () => {
    it('returns false when basic functionality is enabled and onboarding is complete', () => {
      const requestMock = buildInitRequestMock({}, true, true);

      RewardsControllerInit(requestMock);

      const [constructorArgs] = RewardsControllerClassMock.mock.calls[0];
      expect(constructorArgs.isDisabled()).toBe(false);
    });

    it('returns true before onboarding is complete', () => {
      const requestMock = buildInitRequestMock({}, true, false);

      RewardsControllerInit(requestMock);

      const [constructorArgs] = RewardsControllerClassMock.mock.calls[0];
      expect(constructorArgs.isDisabled()).toBe(true);
    });

    it('starts silent auth once onboarding completes', () => {
      const requestMock = buildInitRequestMock();
      const listeners: ((state: { completedOnboarding: boolean }) => void)[] =
        [];
      jest
        .spyOn(requestMock.initMessenger, 'subscribe')
        .mockImplementation(((
          event: string,
          listener: (state: { completedOnboarding: boolean }) => void,
        ) => {
          if (event === 'OnboardingController:stateChange') {
            listeners.push(listener);
          }
          return undefined;
        }) as never);

      const result = RewardsControllerInit(requestMock);
      const handleAuthenticationTrigger = jest
        .fn()
        .mockResolvedValue(undefined);
      result.messengerClient.handleAuthenticationTrigger =
        handleAuthenticationTrigger;

      listeners[0]?.({ completedOnboarding: false });
      expect(handleAuthenticationTrigger).not.toHaveBeenCalled();

      listeners[0]?.({ completedOnboarding: true });
      listeners[0]?.({ completedOnboarding: true });
      expect(handleAuthenticationTrigger).toHaveBeenCalledTimes(1);
      expect(handleAuthenticationTrigger).toHaveBeenCalledWith(
        'Onboarding completed',
      );
    });

    it('returns true when basic functionality is disabled', () => {
      const requestMock = buildInitRequestMock({}, false);

      RewardsControllerInit(requestMock);

      const [constructorArgs] = RewardsControllerClassMock.mock.calls[0];
      expect(constructorArgs.isDisabled()).toBe(true);
    });
  });

  describe('isVipDisabled', () => {
    it('returns false when vipProgramEnabled is true', () => {
      const requestMock = buildInitRequestMock({
        vipProgramEnabled: true,
      });

      RewardsControllerInit(requestMock);

      const [constructorArgs] = RewardsControllerClassMock.mock.calls[0];
      expect(constructorArgs.isVipDisabled()).toBe(false);
    });

    it('returns true when vipProgramEnabled is false', () => {
      const requestMock = buildInitRequestMock({
        vipProgramEnabled: false,
      });

      RewardsControllerInit(requestMock);

      const [constructorArgs] = RewardsControllerClassMock.mock.calls[0];
      expect(constructorArgs.isVipDisabled()).toBe(true);
    });

    it('returns true when vipProgramEnabled is not set', () => {
      const requestMock = buildInitRequestMock({});

      RewardsControllerInit(requestMock);

      const [constructorArgs] = RewardsControllerClassMock.mock.calls[0];
      expect(constructorArgs.isVipDisabled()).toBe(true);
    });
  });
});
