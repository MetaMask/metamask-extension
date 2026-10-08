import {
  defaultRewardsControllerState,
  RewardsController,
} from '../controllers/rewards/rewards-controller';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import {
  validatedVersionGatedFeatureFlag,
  VersionGatedFeatureFlag,
} from '../../../shared/lib/feature-flags/version-gating';
import { RewardsControllerMessenger } from '../controllers/rewards/rewards-controller.types';
import { RewardsControllerInitMessenger } from './messengers/rewards-controller-messenger';
import { MessengerClientInitFunction } from './types';

/**
 * Helper function to resolve a feature flag value.
 *
 * @param flag - The feature flag value to resolve.
 * @returns The resolved boolean value.
 */
const resolveFlag = (flag: unknown) => {
  if (typeof flag === 'boolean') {
    return flag;
  }
  return Boolean(
    validatedVersionGatedFeatureFlag(flag as VersionGatedFeatureFlag),
  );
};

/**
 * Initialize the RewardsController.
 *
 * @param request - The request object.
 * @returns The RewardsController.
 */
export const RewardsControllerInit: MessengerClientInitFunction<
  RewardsController,
  RewardsControllerMessenger,
  RewardsControllerInitMessenger
> = (request) => {
  const { controllerMessenger, persistedState, initMessenger } = request;

  const rewardsControllerState =
    persistedState.RewardsController ?? defaultRewardsControllerState;

  const messengerClient = new RewardsController({
    messenger: controllerMessenger,
    state: rewardsControllerState,
    isDisabled: () => {
      const { useExternalServices } = initMessenger.call(
        'PreferencesController:getState',
      );
      return !useExternalServices;
    },
    isVipDisabled: () => {
      const { remoteFeatureFlags } = initMessenger.call(
        'RemoteFeatureFlagController:getState',
      );
      const vipFeatureFlag = remoteFeatureFlags?.vipProgramEnabled as
        | VersionGatedFeatureFlag
        | undefined;

      // Seed with manifest override first; fallback to remote flag
      const manifestFlag =
        getManifestFlags().remoteFeatureFlags?.vipProgramEnabled;
      const featureFlagEnabled =
        manifestFlag === undefined
          ? resolveFlag(vipFeatureFlag)
          : resolveFlag(manifestFlag);

      return !featureFlagEnabled;
    },
  });

  return { messengerClient };
};
