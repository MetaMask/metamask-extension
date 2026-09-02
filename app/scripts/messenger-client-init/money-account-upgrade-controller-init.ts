import {
  MissingMoneyAccountVaultConfigError,
  MoneyAccountUpgradeController,
  type MoneyAccountUpgradeControllerMessenger,
} from '@metamask/money-account-upgrade-controller';
import { createProjectLogger } from '@metamask/utils';
import {
  getMoneyAccountGeoBlockedCountries,
  isMoneyAccountEnabled,
  isMoneyAccountGeoEligible,
} from '../../../shared/lib/money/feature-flags';
import { captureException } from '../../../shared/lib/sentry';
import { createMoneyChainConfigurator } from '../lib/money/money-chain-config';
import type { MoneyAccountUpgradeControllerInitMessenger } from './messengers/money-account-upgrade-controller-messenger';
import type { MessengerClientInitFunction } from './types';

const log = createProjectLogger('money-account-upgrade-controller');

/**
 * Initialize the MoneyAccountUpgradeController.
 *
 * Construction restores the persisted upgrade records and wires the
 * extension-specific parts of the controller's bootstrap as hooks; the
 * controller owns the bootstrap itself (feature flag, unlock, vault config,
 * serialized re-runs). `init()` — which subscribes and runs the first sync —
 * is deliberately not called here: it makes messenger calls, so
 * `MetamaskController` calls it once every controller and service is
 * constructed, keeping this init function free of ordering constraints.
 *
 * The extension-specific gates are:
 * - onboarding complete with basic functionality enabled, folded into
 * `isEnabled` and re-triggered through `sync()` on the two state changes the
 * controller cannot see itself, and
 * - the same fail-closed geolocation check `MoneyAccountAvailabilityService`
 * makes, as `isEligible`.
 *
 * The Money chain is configured through the shared configurator so this
 * bootstrap and the availability service serialize their `addNetwork` calls
 * against each other.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger for the bootstrap hooks and
 * extension-only triggers.
 * @param request.persistedState - The persisted state to restore.
 * @returns The initialized controller.
 */
export const MoneyAccountUpgradeControllerInit: MessengerClientInitFunction<
  MoneyAccountUpgradeController,
  MoneyAccountUpgradeControllerMessenger,
  MoneyAccountUpgradeControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const areExternalServicesAllowed = () => {
    const { completedOnboarding } = initMessenger.call(
      'OnboardingController:getState',
    );
    const { useExternalServices } = initMessenger.call(
      'PreferencesController:getState',
    );

    return completedOnboarding && Boolean(useExternalServices);
  };

  const messengerClient = new MoneyAccountUpgradeController({
    messenger: controllerMessenger,
    state: persistedState.MoneyAccountUpgradeController,
    hooks: {
      isEnabled: (remoteFeatureFlags) =>
        areExternalServicesAllowed() &&
        isMoneyAccountEnabled(remoteFeatureFlags),
      isEligible: async () => {
        const { remoteFeatureFlags } = initMessenger.call(
          'RemoteFeatureFlagController:getState',
        );
        const blockedCountries =
          getMoneyAccountGeoBlockedCountries(remoteFeatureFlags);
        const location = await initMessenger.call(
          'GeolocationController:getGeolocation',
        );

        return isMoneyAccountGeoEligible(location, blockedCountries);
      },
      ensureChainConfigured: createMoneyChainConfigurator(initMessenger),
      onBootstrapError: (error) => {
        log('Money account upgrade bootstrap failed', error);

        // A missing vault config is a flag misconfiguration that silently
        // disables upgrades; the controller reports it once per background
        // lifetime. Ordinary bootstrap failures (network, CHOMP outages)
        // retry on the next trigger and are only logged.
        if (error instanceof MissingMoneyAccountVaultConfigError) {
          captureException(error);
        }
      },
    },
  });

  const onClientGateChange = () => messengerClient.sync();
  initMessenger.subscribe('OnboardingController:stateChange', onClientGateChange);
  initMessenger.subscribe(
    'PreferencesController:stateChange',
    onClientGateChange,
  );

  return { messengerClient };
};
