import type { GeolocationControllerGetGeolocationAction } from '@metamask/geolocation-controller';
import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { MoneyAccountUpgradeControllerMessenger } from '@metamask/money-account-upgrade-controller';
import type { NetworkControllerGetStateAction } from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from '../../controllers/onboarding';
import type {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import type { LegacyBackgroundApiServiceAddNetworkAction } from '../../services/legacy-background-api-service-method-action-types';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the MoneyAccountUpgradeController.
 *
 * Beyond the actions the upgrade steps call, the controller drives its own
 * bootstrap: it subscribes to the feature-flag and keyring state and reads
 * both to decide when to arm itself, hence the two `getState` actions and
 * `stateChange` events.
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountUpgradeController messenger.
 */
export function getMoneyAccountUpgradeControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MoneyAccountUpgradeControllerMessenger>,
    MessengerEvents<MoneyAccountUpgradeControllerMessenger>
  >,
): MoneyAccountUpgradeControllerMessenger {
  const controllerMessenger: MoneyAccountUpgradeControllerMessenger =
    new Messenger({
      namespace: 'MoneyAccountUpgradeController',
      parent: messenger,
    });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AuthenticatedUserStorageService:createDelegation',
      'AuthenticatedUserStorageService:listDelegations',
      'ChompApiService:associateAddress',
      'ChompApiService:createIntents',
      'ChompApiService:createUpgrade',
      'ChompApiService:getAssociatedAddresses',
      'ChompApiService:getIntentsByAddress',
      'ChompApiService:getServiceDetails',
      'ChompApiService:verifyDelegation',
      'DelegationController:signDelegation',
      'KeyringController:getState',
      'KeyringController:signEip7702Authorization',
      'KeyringController:signPersonalMessage',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
    ],
    events: [
      'KeyringController:stateChange',
      'RemoteFeatureFlagController:stateChange',
    ],
  });

  return controllerMessenger;
}

type AllowedInitializationActions =
  | GeolocationControllerGetGeolocationAction
  | LegacyBackgroundApiServiceAddNetworkAction
  | NetworkControllerGetStateAction
  | OnboardingControllerGetStateAction
  | PreferencesControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction;

type AllowedInitializationEvents =
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent;

export type MoneyAccountUpgradeControllerInitMessenger = ReturnType<
  typeof getMoneyAccountUpgradeControllerInitMessenger
>;

/**
 * Create a messenger for the hooks the MoneyAccountUpgradeController's
 * bootstrap is constructed with, and for the extension-only triggers that
 * re-run its gating.
 *
 * The controller itself watches the feature flags and the keyring; the
 * extension additionally gates on onboarding being complete with basic
 * functionality enabled (read here, re-triggered by both state change
 * events) and on a fail-closed geolocation check. The network state and
 * `addNetwork` are for configuring the Money chain before the bootstrap
 * validates it.
 *
 * @param messenger - The root messenger.
 * @returns The MoneyAccountUpgradeController init messenger.
 */
export function getMoneyAccountUpgradeControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const initMessenger = new Messenger<
    'MoneyAccountUpgradeControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'MoneyAccountUpgradeControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: initMessenger,
    actions: [
      'GeolocationController:getGeolocation',
      'LegacyBackgroundApiService:addNetwork',
      'NetworkController:getState',
      'OnboardingController:getState',
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    events: [
      'OnboardingController:stateChange',
      'PreferencesController:stateChange',
    ],
  });

  return initMessenger;
}
