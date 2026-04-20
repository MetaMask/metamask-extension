export const ASSETS_UNIFY_STATE_FLAG = 'assetsUnifyState';

export const ASSETS_UNIFY_STATE_VERSION_1 = '1';

export type AssetsUnifyStateFeatureFlag = {
  enabled: boolean;
  featureVersion: string | null;
};

/**
 * Shared helper to check whether the assets-unify-state feature is enabled
 * for a given application version. This keeps background and UI gating logic in sync.
 *
 * @param featureFlag - The assets-unify-state feature flag.
 * @param featureVersion - The feature version to check.
 * @returns boolean - True if the feature is enabled, false otherwise.
 */
export const isAssetsUnifyStateFeatureEnabled = (
  featureFlag: AssetsUnifyStateFeatureFlag | undefined | null,
  featureVersion: string,
): boolean => {
  console.log('process.env.IN_TEST +++++++', process.env.IN_TEST);
  console.log(
    'process.env.METAMASK_ENVIRONMENT +++++++',
    process.env.METAMASK_ENVIRONMENT,
  );
  if (
    process.env.IN_TEST &&
    process.env.METAMASK_ENVIRONMENT === 'development'
  ) {
    return true;
  }

  return (
    Boolean(featureFlag?.enabled) &&
    featureFlag?.featureVersion === featureVersion
  );
};
