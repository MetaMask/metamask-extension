import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import {
  validatedVersionGatedFeatureFlag,
  type VersionGatedFeatureFlag,
} from '../../../shared/lib/feature-flags/version-gating';
import {
  RewardsMoneyController,
  getDefaultRewardsMoneyControllerState,
} from '../controllers/rewards-money/rewards-money-controller';
import { RewardsMoneyControllerMessenger } from '../controllers/rewards-money/rewards-money-controller-types';
import { RewardsMoneyControllerInitMessenger } from './messengers/rewards-money-controller-messenger';
import { MessengerClientInitFunction } from './types';

export const REWARDS_MONEY_CONTROLLER_FLAG = 'rewardsMoneyControllerEnabled';

/**
 * Whether `rewardsMoneyControllerEnabled` is on for this client version.
 * A missing or invalid flag is off. There is no environment-variable fallback.
 *
 * @param flag - Remote or manifest value for the flag.
 * @returns Whether the controller surface is enabled.
 */
function isRewardsMoneyControllerFlagEnabled(flag: unknown): boolean {
  return (
    validatedVersionGatedFeatureFlag(flag as VersionGatedFeatureFlag) ?? false
  );
}

/**
 * Initialize the RewardsMoneyController.
 *
 * Disabled unless basic functionality allows external services and the
 * `rewardsMoneyControllerEnabled` remote flag is on, matching mobile.
 *
 * @param request - The request object.
 * @returns The RewardsMoneyController.
 */
export const RewardsMoneyControllerInit: MessengerClientInitFunction<
  RewardsMoneyController,
  RewardsMoneyControllerMessenger,
  RewardsMoneyControllerInitMessenger
> = (request) => {
  const { controllerMessenger, persistedState, initMessenger } = request;
  const rewardsMoneyControllerState =
    persistedState.RewardsMoneyController ??
    getDefaultRewardsMoneyControllerState();

  const messengerClient = new RewardsMoneyController({
    messenger: controllerMessenger,
    state: rewardsMoneyControllerState,
    isDisabled: () => {
      const { remoteFeatureFlags } = initMessenger.call(
        'RemoteFeatureFlagController:getState',
      );
      const manifestFlag =
        getManifestFlags().remoteFeatureFlags?.[REWARDS_MONEY_CONTROLLER_FLAG];
      const remoteFlag = remoteFeatureFlags?.[REWARDS_MONEY_CONTROLLER_FLAG];
      const featureFlagEnabled = isRewardsMoneyControllerFlagEnabled(
        manifestFlag === undefined ? remoteFlag : manifestFlag,
      );

      const { useExternalServices } = initMessenger.call(
        'PreferencesController:getState',
      );
      return !featureFlagEnabled || !useExternalServices;
    },
  });

  return { messengerClient };
};
