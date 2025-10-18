import {
  defaultRewardsControllerState,
  RewardsController,
  RewardsControllerMessenger,
} from '../controllers/rewards/rewards-controller';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import {
  validatedVersionGatedFeatureFlag,
  VersionGatedFeatureFlag,
} from '../../../shared/lib/feature-flags/version-gating';
import { RewardsControllerInitMessenger } from './messengers/rewards-controller-messenger';
import { ControllerInitFunction } from './types';

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

  const { remoteFeatureFlags } = initMessenger.call(
    'RemoteFeatureFlagController:getState',
  );
  const rewardsFeatureFlag = remoteFeatureFlags?.rewardsEnabled as
    | VersionGatedFeatureFlag
    | undefined;

  // Seed with manifest override first; fallback to remote flag
  const manifestFlag = getManifestFlags().remoteFeatureFlags?.rewardsEnabled;
  const resolveFlag = (flag: unknown) => {
    if (typeof flag === 'boolean') {
      return flag;
    }
    return Boolean(
      validatedVersionGatedFeatureFlag(flag as VersionGatedFeatureFlag),
    );
  };
  const effectiveEnabled =
    manifestFlag === undefined
      ? resolveFlag(rewardsFeatureFlag)
      : resolveFlag(manifestFlag);

  const controller = new RewardsController({
    messenger: controllerMessenger,
    state: rewardsControllerState,
    rewardsEnabled: effectiveEnabled,
  });

  return { controller };
};

export { RewardsController };
export type { RewardsControllerMessenger };
