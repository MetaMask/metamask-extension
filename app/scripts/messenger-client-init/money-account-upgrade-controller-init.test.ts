import type { GeolocationControllerGetGeolocationAction } from '@metamask/geolocation-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  type ActionConstraint,
  type MockAnyNamespace,
} from '@metamask/messenger';
import {
  MissingMoneyAccountVaultConfigError,
  MoneyAccountUpgradeController,
  type MoneyAccountUpgradeControllerHooks,
  type MoneyAccountUpgradeControllerMessenger,
} from '@metamask/money-account-upgrade-controller';
import type { NetworkControllerGetStateAction } from '@metamask/network-controller';
import type {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerState,
} from '@metamask/remote-feature-flag-controller';
import { CHAIN_IDS } from '../../../shared/constants/chain-ids';
import { FEATURED_RPCS } from '../../../shared/constants/network';
import {
  MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME,
  MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME,
} from '../../../shared/lib/money/feature-flags';
import { captureException } from '../../../shared/lib/sentry';
import type {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
  OnboardingControllerState,
} from '../controllers/onboarding';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../controllers/preferences-controller';
import type { LegacyBackgroundApiServiceAddNetworkAction } from '../services/legacy-background-api-service-method-action-types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getMoneyAccountUpgradeControllerInitMessenger,
  getMoneyAccountUpgradeControllerMessenger,
  type MoneyAccountUpgradeControllerInitMessenger,
} from './messengers/money-account-upgrade-controller-messenger';
import { MoneyAccountUpgradeControllerInit } from './money-account-upgrade-controller-init';
import type { MessengerClientInitRequest } from './types';

jest.mock('@metamask/money-account-upgrade-controller');
jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const VAULT_CONFIG = {
  chainId: CHAIN_IDS.MONAD,
  boringVault: '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae',
  tellerAddress: '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117',
  accountantAddress: '0x7382c5b8B51B8C4f127B3123C1039581BAA5A06B',
  lensAddress: '0xA816ECd922de94c6879AD23B9A884dB257F20947',
  underlyingToken: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
} as const;

const MONAD_NETWORK_CONFIGURATION = FEATURED_RPCS.find(
  ({ chainId }) => chainId === CHAIN_IDS.MONAD,
);

type BaseMessenger = Messenger<
  MockAnyNamespace,
  | ActionConstraint
  | GeolocationControllerGetGeolocationAction
  | LegacyBackgroundApiServiceAddNetworkAction
  | NetworkControllerGetStateAction
  | OnboardingControllerGetStateAction
  | PreferencesControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction,
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
 * @param options.isEnabled - Whether the Money Account feature flag is on.
 * @param options.geolocation - The GeolocationController country code.
 * @param options.networkConfigured - Whether the Money chain already exists.
 * @returns The base messenger, its mutable config, and the addNetwork mock.
 */
function buildBaseMessenger({
  completedOnboarding = true,
  useExternalServices = true,
  isEnabled = true,
  geolocation = 'US',
  networkConfigured = true,
}: {
  completedOnboarding?: boolean;
  useExternalServices?: boolean;
  isEnabled?: boolean;
  geolocation?: string;
  networkConfigured?: boolean;
} = {}) {
  const config = {
    completedOnboarding,
    useExternalServices,
    isEnabled,
    geolocation,
    networkConfigured,
  };
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
  );
  messenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    () =>
      ({
        remoteFeatureFlags: {
          [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
            enabled: config.isEnabled,
            minimumVersion: '0.0.1',
          },
          [MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME]: {
            blockedRegions: ['GB'],
          },
        },
        cacheTimestamp: Date.now(),
      }) as unknown as RemoteFeatureFlagControllerState,
  );
  messenger.registerActionHandler('GeolocationController:getGeolocation', () =>
    Promise.resolve(config.geolocation),
  );
  messenger.registerActionHandler(
    'NetworkController:getState',
    () =>
      ({
        networkConfigurationsByChainId: config.networkConfigured
          ? { [CHAIN_IDS.MONAD]: MONAD_NETWORK_CONFIGURATION }
          : {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
  );
  const addNetwork = jest.fn().mockResolvedValue(MONAD_NETWORK_CONFIGURATION);
  messenger.registerActionHandler(
    'LegacyBackgroundApiService:addNetwork',
    addNetwork,
  );

  return { messenger, config, addNetwork };
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
    MoneyAccountUpgradeControllerMessenger,
    MoneyAccountUpgradeControllerInitMessenger
  >
> {
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger:
      getMoneyAccountUpgradeControllerMessenger(baseMessenger),
    initMessenger: getMoneyAccountUpgradeControllerInitMessenger(baseMessenger),
  };
}

/**
 * Initialize the controller against a base messenger and hand back the hooks
 * it was constructed with, so each hook can be exercised directly — the
 * controller class itself is mocked.
 *
 * @param baseMessenger - The base messenger.
 * @returns The messenger client and the hooks passed to the constructor.
 */
function initWithHooks(baseMessenger: BaseMessenger) {
  const { messengerClient } = MoneyAccountUpgradeControllerInit(
    getInitRequestMock(baseMessenger),
  );
  const { hooks } = jest.mocked(MoneyAccountUpgradeController).mock
    .calls[0][0] as {
    hooks: MoneyAccountUpgradeControllerHooks;
  };

  return { messengerClient, hooks };
}

describe('MoneyAccountUpgradeControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller without calling its init()', () => {
    const { messenger } = buildBaseMessenger();

    const { messengerClient } = MoneyAccountUpgradeControllerInit(
      getInitRequestMock(messenger),
    );

    expect(messengerClient).toBeInstanceOf(MoneyAccountUpgradeController);
    expect(jest.mocked(messengerClient.init)).not.toHaveBeenCalled();
  });

  it('restores the persisted state', () => {
    const { messenger } = buildBaseMessenger();
    const request = getInitRequestMock(messenger);
    const persistedState = { upgradedAccounts: {} };
    request.persistedState = {
      MoneyAccountUpgradeController: persistedState,
    };

    MoneyAccountUpgradeControllerInit(request);

    expect(jest.mocked(MoneyAccountUpgradeController)).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: persistedState,
      hooks: expect.any(Object),
    });
  });

  it('persists state under the default key', () => {
    const { messenger } = buildBaseMessenger();

    const result = MoneyAccountUpgradeControllerInit(
      getInitRequestMock(messenger),
    );

    expect(result.persistedStateKey).toBeUndefined();
    expect(result.memStateKey).toBeUndefined();
  });

  it('re-syncs the controller when onboarding or preferences state changes', () => {
    const { messenger } = buildBaseMessenger();
    const { messengerClient } = MoneyAccountUpgradeControllerInit(
      getInitRequestMock(messenger),
    );
    const sync = jest.mocked(messengerClient.sync);

    messenger.publish(
      'OnboardingController:stateChange',
      {} as OnboardingControllerState,
      [],
    );
    expect(sync).toHaveBeenCalledTimes(1);

    messenger.publish(
      'PreferencesController:stateChange',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
      [],
    );
    expect(sync).toHaveBeenCalledTimes(2);
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

  describe('isEligible hook', () => {
    it('is true for an unblocked region', async () => {
      const { messenger } = buildBaseMessenger({ geolocation: 'US' });
      const { hooks } = initWithHooks(messenger);

      expect(await hooks.isEligible?.()).toBe(true);
    });

    it('is false for a blocked region', async () => {
      const { messenger } = buildBaseMessenger({ geolocation: 'GB' });
      const { hooks } = initWithHooks(messenger);

      expect(await hooks.isEligible?.()).toBe(false);
    });

    it('fails closed on an unknown geolocation', async () => {
      const { messenger } = buildBaseMessenger({ geolocation: 'UNKNOWN' });
      const { hooks } = initWithHooks(messenger);

      expect(await hooks.isEligible?.()).toBe(false);
    });
  });

  describe('ensureChainConfigured hook', () => {
    it('adds the Money chain when it is missing', async () => {
      const { messenger, addNetwork } = buildBaseMessenger({
        networkConfigured: false,
      });
      const { hooks } = initWithHooks(messenger);

      await hooks.ensureChainConfigured?.(VAULT_CONFIG);

      expect(addNetwork).toHaveBeenCalledWith(MONAD_NETWORK_CONFIGURATION, {
        setActive: false,
      });
    });

    it('does not add the Money chain when it is already configured', async () => {
      const { messenger, addNetwork } = buildBaseMessenger({
        networkConfigured: true,
      });
      const { hooks } = initWithHooks(messenger);

      await hooks.ensureChainConfigured?.(VAULT_CONFIG);

      expect(addNetwork).not.toHaveBeenCalled();
    });
  });

  describe('onBootstrapError hook', () => {
    it('reports a missing vault config to Sentry', () => {
      const { messenger } = buildBaseMessenger();
      const { hooks } = initWithHooks(messenger);
      const error = new MissingMoneyAccountVaultConfigError();

      hooks.onBootstrapError?.(error);

      expect(jest.mocked(captureException)).toHaveBeenCalledWith(error);
    });

    it('only logs ordinary bootstrap failures', () => {
      const { messenger } = buildBaseMessenger();
      const { hooks } = initWithHooks(messenger);

      hooks.onBootstrapError?.(new Error('CHOMP outage'));

      expect(jest.mocked(captureException)).not.toHaveBeenCalled();
    });
  });
});
