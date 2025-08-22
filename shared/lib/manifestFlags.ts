import { Json } from '@metamask/utils';
import browser from 'webextension-polyfill';

/**
 * Flags that we use to control runtime behavior of the extension. Typically
 * used for E2E tests.
 *
 * These flags are added to `manifest.json` for runtime querying.
 */
export type ManifestFlags = {
  /**
   * CI metadata for the current run
   */
  ci?: {
    /**
     * Whether CI manifest flags are enabled.
     */
    enabled: boolean;
    /**
     * The name of the branch that triggered the current run on CI
     */
    branch?: string;
    /**
     * The current CI commit hash
     */
    commitHash?: string;
    /**
     * The name of the CI job currently running
     */
    job?: string;
    /**
     * For jobs with CI parallelism enabled, this is the index of the current machine.
     */
    matrixIndex?: number;
    /**
     * The number of the pull request that triggered the current run
     */
    prNumber?: number;
    /**
     * The number of minutes to allow the E2E tests to run before timing out
     */
    timeoutMinutes?: number;
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
  /**
   * Feature flags to control business logic behavior
   */
  remoteFeatureFlags?: {
    [key: string]: Json;
  };
  /**
   * Testing flags to control testing behavior
   */
  testing?: {
    /**
     * Whether to force the ExtensionStore class to be used during testing
     */
    forceExtensionStore?: boolean;
    /**
     * The public key used to verify deep links
     */
    deepLinkPublicKey?: string;
    /**
     * Whether to disable all of the syncing features that get automatically enabled in migrations 158 and 167
     */
    disableSync?: boolean;
    /**
     * Whether to simulate an unresponsive background by ignoring connections from the UI
     */
    simulateUnresponsiveBackground: boolean;
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    (browser.runtime.getManifest() as WebExtensionManifestWithFlags)._flags ||
    {}
  );
}
