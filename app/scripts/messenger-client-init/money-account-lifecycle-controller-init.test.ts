import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  type ActionConstraint,
  type MockAnyNamespace,
} from '@metamask/messenger';
import {
  MoneyAccountLifecycleController,
  type MoneyAccountLifecycleControllerHooks,
  type MoneyAccountLifecycleControllerMessenger,
} from '@metamask/money-account-lifecycle-controller';
import { MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME } from '../../../shared/lib/money/feature-flags';
import type {
  OnboardingControllerGetStateAction,
  OnboardingControllerState,
  OnboardingControllerStateChangeEvent,
} from '../controllers/onboarding';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerState,
  PreferencesControllerStateChangeEvent,
} from '../controllers/preferences-controller';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getMoneyAccountLifecycleControllerInitMessenger,
  getMoneyAccountLifecycleControllerMessenger,
  type MoneyAccountLifecycleControllerInitMessenger,
} from './messengers/money-account-lifecycle-controller-messenger';
import { MoneyAccountLifecycleControllerInit } from './money-account-lifecycle-controller-init';
import type { MessengerClientInitRequest } from './types';

jest.mock('@metamask/money-account-lifecycle-controller');

type BaseMessenger = Messenger<
  MockAnyNamespace,
  | ActionConstraint
  | OnboardingControllerGetStateAction
  | PreferencesControllerGetStateAction,
  OnboardingControllerStateChangeEvent | PreferencesControllerStateChangeEvent
>;

/**
 * Build a base messenger with the state the init hooks read. The returned
 * `config` is read live by the action handlers, so tests can flip any value
 * between calls.
 *
 * @param options - Options.
 * @param options.completedOnboarding - Whether onboarding has completed.
 * @param options.useExternalServices - Whether basic functionality is on.
 * @returns The base messenger and its mutable config.
 */
function buildBaseMessenger({
  completedOnboarding = true,
  useExternalServices = true,
}: {
  completedOnboarding?: boolean;
  useExternalServices?: boolean;
} = {}) {
  const config = { completedOnboarding, useExternalServices };
  const messenger: BaseMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });

  messenger.registerActionHandler(
    'OnboardingController:getState',
    () =>
      ({
        completedOnboarding: config.completedOnboarding,
      }) as OnboardingControllerState,
  );
  messenger.registerActionHandler(
    'PreferencesController:getState',
    () =>
      ({
        useExternalServices: config.useExternalServices,
      }) as PreferencesControllerState,
  );

  return { messenger, config };
}

/**
 * Build the init request for the given base messenger.
 *
 * @param baseMessenger - The base messenger.
 * @returns The init request.
 */
function getInitRequestMock(
  baseMessenger: BaseMessenger,
): jest.Mocked<
  MessengerClientInitRequest<
    MoneyAccountLifecycleControllerMessenger,
    MoneyAccountLifecycleControllerInitMessenger
  >
> {
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger:
      getMoneyAccountLifecycleControllerMessenger(baseMessenger),
    initMessenger:
      getMoneyAccountLifecycleControllerInitMessenger(baseMessenger),
  };
}

/**
 * Initialize the controller against a base messenger and hand back the hooks
 * it was constructed with, so the hook can be exercised directly.
 *
 * @param baseMessenger - The base messenger.
 * @returns The messenger client and the hooks passed to the constructor.
 */
function initWithHooks(baseMessenger: BaseMessenger) {
  const { messengerClient } = MoneyAccountLifecycleControllerInit(
    getInitRequestMock(baseMessenger),
  );
  const { hooks } = jest.mocked(MoneyAccountLifecycleController).mock
    .calls[0][0] as {
    hooks: MoneyAccountLifecycleControllerHooks;
  };

  return { messengerClient, hooks };
}

describe('MoneyAccountLifecycleControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller without calling its init()', () => {
    const { messenger } = buildBaseMessenger();

    const { messengerClient } = MoneyAccountLifecycleControllerInit(
      getInitRequestMock(messenger),
    );

    expect(messengerClient).toBeInstanceOf(MoneyAccountLifecycleController);
    expect(jest.mocked(messengerClient.init)).not.toHaveBeenCalled();
  });

  it('does not persist or flatten its state', () => {
    const { messenger } = buildBaseMessenger();

    const result = MoneyAccountLifecycleControllerInit(
      getInitRequestMock(messenger),
    );

    expect(result.persistedStateKey).toBeNull();
    expect(result.memStateKey).toBeNull();
  });

  it('re-syncs the controller when onboarding or preferences state changes', () => {
    const { messenger } = buildBaseMessenger();
    const { messengerClient } = MoneyAccountLifecycleControllerInit(
      getInitRequestMock(messenger),
    );
    const refresh = jest.mocked(messengerClient.refresh);
    refresh.mockResolvedValue(undefined);

    messenger.publish(
      'OnboardingController:stateChange',
      {} as OnboardingControllerState,
      [],
    );
    expect(refresh).toHaveBeenCalledTimes(1);

    messenger.publish(
      'PreferencesController:stateChange',
      {} as PreferencesControllerState,
      [],
    );
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  describe('isEnabled hook', () => {
    const flagsWith = (enabled: boolean) => ({
      [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
        enabled,
        minimumVersion: '0.0.1',
      },
    });

    it('is true when onboarding is complete, basic functionality is on, and the flag is enabled', () => {
      const { messenger } = buildBaseMessenger();
      const { hooks } = initWithHooks(messenger);

      expect(hooks.isEnabled(flagsWith(true))).toBe(true);
    });

    it('is false when the flag is off', () => {
      const { messenger } = buildBaseMessenger();
      const { hooks } = initWithHooks(messenger);

      expect(hooks.isEnabled(flagsWith(false))).toBe(false);
    });

    it('is false before onboarding completes', () => {
      const { messenger } = buildBaseMessenger({ completedOnboarding: false });
      const { hooks } = initWithHooks(messenger);

      expect(hooks.isEnabled(flagsWith(true))).toBe(false);
    });

    it('is false while basic functionality is disabled', () => {
      const { messenger } = buildBaseMessenger({ useExternalServices: false });
      const { hooks } = initWithHooks(messenger);

      expect(hooks.isEnabled(flagsWith(true))).toBe(false);
    });

    it('re-reads live state on every call', () => {
      const { messenger, config } = buildBaseMessenger({
        useExternalServices: false,
      });
      const { hooks } = initWithHooks(messenger);
      expect(hooks.isEnabled(flagsWith(true))).toBe(false);

      config.useExternalServices = true;

      expect(hooks.isEnabled(flagsWith(true))).toBe(true);
    });
  });
});
