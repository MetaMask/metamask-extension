import {
  defaultRewardsControllerState,
  RewardsController,
} from '../controllers/rewards/rewards-controller';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import {
  validatedVersionGatedFeatureFlag,
  VersionGatedFeatureFlag,
} from '../../../shared/lib/feature-flags/version-gating';
import {
  RewardsControllerInitMessenger,
  RewardsControllerMessenger,
} from './messengers/rewards-controller-messenger';
import { ControllerInitFunction } from './types';

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
export const RewardsControllerInit: ControllerInitFunction<
  RewardsController,
  RewardsControllerMessenger,
  RewardsControllerInitMessenger
> = (request) => {
  const { controllerMessenger, persistedState, initMessenger } = request;

  const rewardsControllerState =
    persistedState.RewardsController ?? defaultRewardsControllerState;

  const controller = new RewardsController({
    messenger: controllerMessenger,
    state: rewardsControllerState,
    isDisabled: () => {
      const { remoteFeatureFlags } = initMessenger.call(
        'RemoteFeatureFlagController:getState',
      );
      const rewardsFeatureFlag = remoteFeatureFlags?.rewardsEnabled as
        | VersionGatedFeatureFlag
        | undefined;

      // Seed with manifest override first; fallback to remote flag
      const manifestFlag =
        getManifestFlags().remoteFeatureFlags?.rewardsEnabled;
      const featureFlagEnabled =
        manifestFlag === undefined
          ? resolveFlag(rewardsFeatureFlag)
          : resolveFlag(manifestFlag);

      // Check if basic functionality is enabled
      const { useExternalServices } = initMessenger.call(
        'PreferencesController:getState',
      );
      return !featureFlagEnabled || !useExternalServices;
    },
    isBitcoinDisabled: () => {
      const { remoteFeatureFlags } = initMessenger.call(
        'RemoteFeatureFlagController:getState',
      );
      const bitcoinFeatureFlag =
        remoteFeatureFlags?.rewardsBitcoinEnabledExtension as
          | VersionGatedFeatureFlag
          | undefined;

      // Seed with manifest override first; fallback to remote flag
      const manifestFlag =
        getManifestFlags().remoteFeatureFlags?.rewardsBitcoinEnabledExtension;
      const featureFlagEnabled =
        manifestFlag === undefined
          ? resolveFlag(bitcoinFeatureFlag)
          : resolveFlag(manifestFlag);

      return !featureFlagEnabled;
    },
    isTronDisabled: () => {
      const { remoteFeatureFlags } = initMessenger.call(
        'RemoteFeatureFlagController:getState',
      );
      const tronFeatureFlag =
        remoteFeatureFlags?.rewardsTronEnabledExtension as
          | VersionGatedFeatureFlag
          | undefined;

      // Seed with manifest override first; fallback to remote flag
      const manifestFlag =
        getManifestFlags().remoteFeatureFlags?.rewardsTronEnabledExtension;
      const featureFlagEnabled =
        manifestFlag === undefined
          ? resolveFlag(tronFeatureFlag)
          : resolveFlag(manifestFlag);

      return !featureFlagEnabled;
    },
  });

  return { controller };
};
