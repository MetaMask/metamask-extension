import {
  Infer,
  type,
  boolean,
  nullable,
  string,
  array,
  assert,
  optional,
} from '@metamask/superstruct';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from '../../../shared/lib/selectors/remote-feature-flags';
import {
  ASSETS_UNIFY_STATE_FLAG,
  ASSETS_UNIFY_STATE_VERSION_1,
  isAssetsUnifyStateFeatureEnabled,
} from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../shared/lib/environment';

const AssetsUnifyStateFeatureFlag = type({
  enabled: boolean(),
  featureVersion: nullable(string()),
  minimumVersion: optional(nullable(string())),
  deprecatedControllers: optional(array(string())),
  tracesEnabled: optional(boolean()),
});

export type AssetsUnifyStateFeatureFlagType = Infer<
  typeof AssetsUnifyStateFeatureFlag
>;

export const getAssetsUnifyStateRemoteFeatureFlag = (
  state: RemoteFeatureFlagsState,
): AssetsUnifyStateFeatureFlagType | undefined => {
  try {
    const assetsUnifyStateFeatureFlag =
      getRemoteFeatureFlags(state)[ASSETS_UNIFY_STATE_FLAG];

    assert(assetsUnifyStateFeatureFlag, AssetsUnifyStateFeatureFlag);

    return assetsUnifyStateFeatureFlag;
  } catch (error) {
    return undefined;
  }
};

export const getIsAssetsUnifyStateEnabled = (
  state: RemoteFeatureFlagsState,
): boolean => {
  if (!getIsAssetsUnifiedStateIncludedInBuild()) {
    return false;
  }
  const remoteFlag = getAssetsUnifyStateRemoteFeatureFlag(state);
  return isAssetsUnifyStateFeatureEnabled(
    remoteFlag,
    ASSETS_UNIFY_STATE_VERSION_1,
  );
};

export const getIsControllerDeprecated = (
  state: RemoteFeatureFlagsState,
  controllerName: string,
): boolean => {
  if (process.env.IN_TEST) {
    return true;
  }

  if (!getIsAssetsUnifyStateEnabled(state)) {
    return false;
  }

  const featureFlag = getAssetsUnifyStateRemoteFeatureFlag(state);
  return featureFlag?.deprecatedControllers?.includes(controllerName) ?? false;
};

export const getIsTokenListControllerDeprecated = (
  state: RemoteFeatureFlagsState,
): boolean => getIsControllerDeprecated(state, 'TokenListController');
