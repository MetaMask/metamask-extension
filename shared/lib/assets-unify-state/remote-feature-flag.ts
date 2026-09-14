export const ASSETS_UNIFY_STATE_FLAG = 'assetsUnifyState';

export type AssetsUnifyStateFeatureFlag = {
  /**
   * When true, AssetsController emits Sentry traces via
   * `traceAsControllerCallback`.
   */
  tracesEnabled?: boolean;
};

/**
 * Returns true when AssetsController Sentry tracing should run.
 *
 * Defaults to false when the field is absent.
 *
 * @param featureFlag - The assets-unify-state feature flag.
 * @returns boolean
 */
export const isAssetsUnifyStateTracesEnabled = (
  featureFlag: AssetsUnifyStateFeatureFlag | undefined | null,
): boolean => {
  return featureFlag?.tracesEnabled === true;
};
