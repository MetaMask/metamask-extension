import { ClientConfigApiService } from '@metamask/remote-feature-flag-controller';
import { Messenger } from '@metamask/messenger';
import { ENVIRONMENT } from '../../../shared/constants/build';
import {
  getConfigForRemoteFeatureFlagRequest,
  getRemoteFeatureFlagClientConfigApiService,
  setupRemoteFeatureFlagToggle,
} from './remote-feature-flags';

jest.mock('@metamask/messenger', () => ({
  Messenger: jest.fn(),
}));

type ToggleArgs = Parameters<typeof setupRemoteFeatureFlagToggle>[0];

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Wires `setupRemoteFeatureFlagToggle` with a mock messenger (that captures the
 * subscribed handlers by event name) and a mock controller, so tests can drive
 * the handlers directly.
 *
 * @param preferencesState - The initial PreferencesController state.
 * @param onboardingState - The initial OnboardingController state.
 * @returns The captured stateChange handlers and the mock controller.
 */
function setupToggle(
  preferencesState: Partial<ToggleArgs['preferencesState']>,
  onboardingState: Partial<ToggleArgs['onboardingState']>,
) {
  const handlers: Record<string, (state: unknown) => void> = {};
  // The function creates a namespaced child messenger internally and subscribes
  // on it, so capture the handlers via the mocked `Messenger` constructor.
  const toggleMessenger = {
    subscribe: jest.fn((event: string, handler: (state: unknown) => void) => {
      handlers[event] = handler;
    }),
  };
  (Messenger as jest.Mock).mockImplementation(() => toggleMessenger);

  const delegate = jest.fn();
  const messenger = { delegate } as unknown as ToggleArgs['messenger'];

  const remoteFeatureFlagController = {
    enable: jest.fn(),
    disable: jest.fn(),
    updateRemoteFeatureFlags: jest.fn().mockResolvedValue(undefined),
  };

  setupRemoteFeatureFlagToggle({
    messenger,
    remoteFeatureFlagController:
      remoteFeatureFlagController as unknown as ToggleArgs['remoteFeatureFlagController'],
    preferencesState: preferencesState as ToggleArgs['preferencesState'],
    onboardingState: onboardingState as ToggleArgs['onboardingState'],
  });

  return { handlers, remoteFeatureFlagController, delegate };
}

describe('setupRemoteFeatureFlagToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates the watched events and subscribes to Preferences and Onboarding state changes', () => {
    const { handlers, delegate } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: true },
    );

    expect(delegate).toHaveBeenCalledWith(
      expect.objectContaining({
        events: [
          'PreferencesController:stateChange',
          'OnboardingController:stateChange',
        ],
      }),
    );
    expect(Object.keys(handlers)).toStrictEqual([
      'PreferencesController:stateChange',
      'OnboardingController:stateChange',
    ]);
  });

  it('enables and refreshes flags when onboarding completes (external services already on)', () => {
    const { handlers, remoteFeatureFlagController } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: false },
    );

    handlers['OnboardingController:stateChange']({ completedOnboarding: true });

    expect(remoteFeatureFlagController.enable).toHaveBeenCalledTimes(1);
    expect(
      remoteFeatureFlagController.updateRemoteFeatureFlags,
    ).toHaveBeenCalledTimes(1);
    expect(remoteFeatureFlagController.disable).not.toHaveBeenCalled();
  });

  it('disables when external services are turned off', () => {
    const { handlers, remoteFeatureFlagController } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: true },
    );

    handlers['PreferencesController:stateChange']({
      useExternalServices: false,
    });

    expect(remoteFeatureFlagController.disable).toHaveBeenCalledTimes(1);
    expect(remoteFeatureFlagController.enable).not.toHaveBeenCalled();
    expect(
      remoteFeatureFlagController.updateRemoteFeatureFlags,
    ).not.toHaveBeenCalled();
  });

  it('does nothing when the watched field does not change', () => {
    const { handlers, remoteFeatureFlagController } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: true },
    );

    // `useExternalServices` is unchanged from the initial value.
    handlers['PreferencesController:stateChange']({
      useExternalServices: true,
    });

    expect(remoteFeatureFlagController.enable).not.toHaveBeenCalled();
    expect(remoteFeatureFlagController.disable).not.toHaveBeenCalled();
    expect(
      remoteFeatureFlagController.updateRemoteFeatureFlags,
    ).not.toHaveBeenCalled();
  });

  it('disables again when onboarding is reverted to incomplete', () => {
    const { handlers, remoteFeatureFlagController } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: true },
    );

    // `completedOnboarding` can revert to `false` after having been `true`.
    handlers['OnboardingController:stateChange']({
      completedOnboarding: false,
    });

    expect(remoteFeatureFlagController.disable).toHaveBeenCalledTimes(1);
    expect(remoteFeatureFlagController.enable).not.toHaveBeenCalled();
    expect(
      remoteFeatureFlagController.updateRemoteFeatureFlags,
    ).not.toHaveBeenCalled();
  });

  it('tracks successive changes (enable, then no-op, then disable)', () => {
    const { handlers, remoteFeatureFlagController } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: false },
    );

    // false -> true: enable + refresh.
    handlers['OnboardingController:stateChange']({ completedOnboarding: true });
    // true -> true: no change, no further calls (exercises the cached-previous
    // value comparison, not just the initial-value one).
    handlers['OnboardingController:stateChange']({ completedOnboarding: true });
    // true -> false: disable.
    handlers['OnboardingController:stateChange']({
      completedOnboarding: false,
    });

    expect(remoteFeatureFlagController.enable).toHaveBeenCalledTimes(1);
    expect(
      remoteFeatureFlagController.updateRemoteFeatureFlags,
    ).toHaveBeenCalledTimes(1);
    expect(remoteFeatureFlagController.disable).toHaveBeenCalledTimes(1);
  });

  it('logs and swallows a failed flag refresh instead of throwing', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const error = new Error('network down');
    const { handlers, remoteFeatureFlagController } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: false },
    );
    remoteFeatureFlagController.updateRemoteFeatureFlags.mockRejectedValue(
      error,
    );

    expect(() =>
      handlers['OnboardingController:stateChange']({
        completedOnboarding: true,
      }),
    ).not.toThrow();
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to update remote feature flags:',
      error,
    );
    consoleErrorSpy.mockRestore();
  });
});

describe('getConfigForRemoteFeatureFlagRequest', () => {
  it('returns config in mapping', () => {
    const result = getConfigForRemoteFeatureFlagRequest();
    expect(result).toStrictEqual({
      distribution: 'main',
      environment: 'dev',
    });
  });

  it('returns config when not matching default mapping', () => {
    process.env.METAMASK_BUILD_TYPE = 'non-existent-distribution';
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.RELEASE_CANDIDATE;

    const result = getConfigForRemoteFeatureFlagRequest();
    expect(result).toStrictEqual({
      distribution: 'main',
      environment: 'rc',
    });
  });

  // @ts-expect-error ESLint is misconfigured and not applying Jest types to this file
  it.each(Object.values(ENVIRONMENT))(
    'returns main-exp for experimental build in "%s" environment',
    async (environment: keyof typeof ENVIRONMENT) => {
      process.env.METAMASK_BUILD_TYPE = 'experimental';
      process.env.METAMASK_ENVIRONMENT = environment;

      const result = getConfigForRemoteFeatureFlagRequest();
      expect(result).toStrictEqual({
        distribution: 'main',
        environment: 'exp',
      });
    },
  );
});

describe('getRemoteFeatureFlagClientConfigApiService', () => {
  it('returns a configured ClientConfigApiService', () => {
    expect(getRemoteFeatureFlagClientConfigApiService()).toBeInstanceOf(
      ClientConfigApiService,
    );
  });
});
