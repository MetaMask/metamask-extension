import browser from 'webextension-polyfill';

/**
 * Flags that we use to control runtime behavior of the extension. Typically
 * used for E2E tests.
 *
 * These flags are added to `manifest.json` for runtime querying.
 */
export type ManifestFlags = {
  /**
   * CircleCI metadata for the current run
   */
  circleci?: {
    /**
     * Whether CircleCI manifest flags are enabled.
     */
    enabled: boolean;
    /**
     * The name of the branch that triggered the current run on CircleCI
     */
    branch?: string;
    /**
     * The current CircleCI build number
     */
    buildNum?: number;
    /**
     * The name of the CircleCI job currently running
     */
    job?: string;
    /**
     * For jobs with CircleCI parallelism enabled, this is the index of the current machine.
     */
    nodeIndex?: number;
    /**
     * The number of the pull request that triggered the current run
     */
    prNumber?: number;
  };
  /**
   * Sentry flags
   */
  sentry?: {
    /**
     * Override the performance trace sample rate
     */
    tracesSampleRate?: number;
    /**
     * Sub-sample rate for lazy-loaded components.
     *
     * Multiply this rate by tracesSampleRate to get the actual probability of sampling the load
     * time of a lazy-loaded component.
     */
    lazyLoadSubSampleRate?: number;
    /**
     * Force enable Sentry (this is typically set by individual E2E tests in spec files)
     */
    forceEnable?: boolean;
  };
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- you can't extend a type, we want this to be an interface
interface WebExtensionManifestWithFlags
  extends browser.Manifest.WebExtensionManifest {
  _flags?: ManifestFlags;
}

/**
 * Get the runtime flags that were placed in manifest.json by manifest-flag-mocha-hooks.ts
 *
 * @returns flags if they exist, otherwise an empty object
 */
export function getManifestFlags(): ManifestFlags {
  // If this is running in a unit test, there's no manifest, so just return an empty object
  if (
    process.env.JEST_WORKER_ID === undefined ||
    !browser.runtime.getManifest
  ) {
    return {};
  }

  return (
    (browser.runtime.getManifest() as WebExtensionManifestWithFlags)._flags ||
    {}
  );
}
