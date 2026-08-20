import { Messenger } from '@metamask/messenger';
import { setupRemoteFeatureFlagToggle } from './remote-feature-flags';

jest.mock('@metamask/messenger', () => ({
  Messenger: jest.fn(),
}));

type ToggleArgs = Parameters<typeof setupRemoteFeatureFlagToggle>[0];

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const UPDATE_ACTION = 'RemoteFeatureFlagController:updateRemoteFeatureFlags';

/**
 * Wires `setupRemoteFeatureFlagToggle` with a mock messenger that captures the
 * subscribed handlers by event name and the controller actions it calls, so
 * tests can drive the handlers directly.
 *
 * @param preferencesState - The initial PreferencesController state.
 * @param onboardingState - The initial OnboardingController state.
 * @returns The captured stateChange handlers, the child messenger `call` mock,
 * and the parent `delegate` mock.
 */
function setupToggle(
  preferencesState: Partial<ToggleArgs['preferencesState']>,
  onboardingState: Partial<ToggleArgs['onboardingState']>,
) {
  const handlers: Record<string, (state: unknown) => void> = {};
  // The toggle drives the controller over a namespaced child messenger it
  // creates internally, so capture its `call`s and subscribed handlers via the
  // mocked `Messenger` constructor. `updateRemoteFeatureFlags` is awaited, so
  // it must return a promise.
  const call = jest.fn((action: string) =>
    action === UPDATE_ACTION ? Promise.resolve() : undefined,
  );
  const toggleMessenger = {
    call,
    subscribe: jest.fn((event: string, handler: (state: unknown) => void) => {
      handlers[event] = handler;
    }),
  };
  (Messenger as jest.Mock).mockImplementation(() => toggleMessenger);

  const delegate = jest.fn();
  const messenger = { delegate } as unknown as ToggleArgs['messenger'];

  setupRemoteFeatureFlagToggle({
    messenger,
    preferencesState: preferencesState as ToggleArgs['preferencesState'],
    onboardingState: onboardingState as ToggleArgs['onboardingState'],
  });

  return { handlers, call, delegate };
}

describe('setupRemoteFeatureFlagToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates the watched actions and events and subscribes to Preferences and Onboarding state changes', () => {
    const { handlers, delegate } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: true },
    );

    expect(delegate).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'RemoteFeatureFlagController:enable',
          'RemoteFeatureFlagController:disable',
          UPDATE_ACTION,
        ],
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
    const { handlers, call } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: false },
    );

    handlers['OnboardingController:stateChange']({ completedOnboarding: true });

    expect(call).toHaveBeenCalledWith('RemoteFeatureFlagController:enable');
    expect(call).toHaveBeenCalledWith(UPDATE_ACTION);
    expect(call).not.toHaveBeenCalledWith(
      'RemoteFeatureFlagController:disable',
    );
  });

  it('disables when external services are turned off', () => {
    const { handlers, call } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: true },
    );

    handlers['PreferencesController:stateChange']({
      useExternalServices: false,
    });

    expect(call).toHaveBeenCalledWith('RemoteFeatureFlagController:disable');
    expect(call).not.toHaveBeenCalledWith('RemoteFeatureFlagController:enable');
    expect(call).not.toHaveBeenCalledWith(UPDATE_ACTION);
  });

  it('does nothing when the watched field does not change', () => {
    const { handlers, call } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: true },
    );

    // `useExternalServices` is unchanged from the initial value.
    handlers['PreferencesController:stateChange']({
      useExternalServices: true,
    });

    expect(call).not.toHaveBeenCalled();
  });

  it('disables again when onboarding is reverted to incomplete', () => {
    const { handlers, call } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: true },
    );

    // `completedOnboarding` can revert to `false` after having been `true`.
    handlers['OnboardingController:stateChange']({
      completedOnboarding: false,
    });

    expect(call).toHaveBeenCalledWith('RemoteFeatureFlagController:disable');
    expect(call).not.toHaveBeenCalledWith('RemoteFeatureFlagController:enable');
    expect(call).not.toHaveBeenCalledWith(UPDATE_ACTION);
  });

  it('tracks successive changes (enable, then no-op, then disable)', () => {
    const { handlers, call } = setupToggle(
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

    expect(call).toHaveBeenCalledWith('RemoteFeatureFlagController:enable');
    expect(call).toHaveBeenCalledWith(UPDATE_ACTION);
    expect(call).toHaveBeenCalledWith('RemoteFeatureFlagController:disable');
    // enable + update (from the single enable) + disable, with no extra calls
    // for the no-op middle change.
    expect(call).toHaveBeenCalledTimes(3);
  });

  it('logs and swallows a failed flag refresh instead of throwing', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const error = new Error('network down');
    const { handlers, call } = setupToggle(
      { useExternalServices: true },
      { completedOnboarding: false },
    );
    call.mockImplementation((action: string) =>
      action === UPDATE_ACTION ? Promise.reject(error) : undefined,
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
