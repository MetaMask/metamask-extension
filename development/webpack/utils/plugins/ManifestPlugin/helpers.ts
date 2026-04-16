import merge from 'lodash/merge';
import {
  CHROME_MANIFEST_KEY_NON_PRODUCTION,
  CHROME_MANIFEST_KEY_RELEASE_CANDIDATE,
  ENVIRONMENTS,
} from '../../constants';
import type { Args } from '../../cli';
import type { Browser } from '../../helpers';

/**
 * Returns the appropriate manifest key based on the given environment.
 *
 * @param env - The environment for which to get the manifest key
 * @returns The manifest key for the given environment, or `undefined` for
 * production.
 */
function getManifestKey(env: Pick<Args, 'env'>['env']): string | undefined {
  switch (env) {
    case ENVIRONMENTS.PRODUCTION:
      return undefined;
    case ENVIRONMENTS.RELEASE_CANDIDATE:
      return CHROME_MANIFEST_KEY_RELEASE_CANDIDATE;
    default:
      return CHROME_MANIFEST_KEY_NON_PRODUCTION;
  }
}

/**
 * Returns a function that will transform a manifest JSON object based on the
 * given build args.
 *
 * Applies the following transformations:
 * - For non-firefox builds, if `env` is `release-candidate`, sets the
 * release-candidate manifest key, otherwise sets the default non-production
 * manifest key.
 * - If `isDevelopment` is `true`, merges manifest override flags from the file
 * specified by `MANIFEST_OVERRIDES`
 * - If `test` is `true`, adds the "tabs" permission to the manifest
 *
 * @param args
 * @param args.env
 * @param args.test
 * @param isDevelopment
 * @param manifestOverridesPath
 * @returns a function that will transform the manifest JSON object. The
 * returned function throws if `test` is `true` and the manifest already
 * contains the "tabs" permission.
 */
export function transformManifest(
  args: Pick<Args, 'env' | 'test'>,
  isDevelopment: boolean,
  manifestOverridesPath?: string | undefined,
) {
  const transforms: ((
    manifest: chrome.runtime.Manifest,
    browser: Browser,
  ) => chrome.runtime.Manifest | void)[] = [];

  const manifestKey = getManifestKey(args.env);

  /**
   * Adds a fixed `key` value to the manifest for consistent extension ID in
   * non-production Chrome builds.
   *
   * This is necessary to ensure that the extension ID remains consistent
   * across builds, which is required for OAuth authentication outside
   * production. In production, the Chrome Web Store generates a unique key, so
   * we do not set a fixed key.
   *
   * This transform needs to be applied before the manifest flags transform,
   * otherwise the manifest flags transform would not be able to override the
   * key when the manifest overrides file is used to set a different one.
   *
   * @param browserManifest - The extension manifest object to modify
   * @param browser - The target browser for the manifest
   */
  function addManifestKey(
    browserManifest: chrome.runtime.Manifest,
    browser: Browser,
  ) {
    if (browser === 'chrome') {
      // firefox uses a different key generation method and does not need this
      // fixed Chrome manifest key.
      browserManifest.key = manifestKey;
    }
  }

  if (manifestKey) {
    transforms.push(addManifestKey);
  }

  /**
   * This function merges manifest overrides from the file specified by
   * `MANIFEST_OVERRIDES` into the manifest.
   *
   * @param browserManifest - The extension manifest object to modify
   */
  function applyManifestOverrides(
    browserManifest: chrome.runtime.Manifest,
  ): void {
    let manifestFlags;

    if (manifestOverridesPath) {
      try {
        const fs = require('node:fs');
        const path = require('node:path');
        const manifestFlagsContent = fs.readFileSync(
          path.resolve(process.cwd(), manifestOverridesPath),
          'utf8',
        );
        manifestFlags = JSON.parse(manifestFlagsContent);
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === 'ENOENT'
        ) {
          // Only throw if ENOENT and manifestOverridesPath was provided
          throw new Error(
            `Manifest override file not found: ${manifestOverridesPath}`,
          );
        }
      }
    }

    if (manifestFlags) {
      merge(browserManifest, manifestFlags);
    }
  }

  if (isDevelopment) {
    // Apply manifest overrides only for development builds
    transforms.push(applyManifestOverrides);
  }

  function addTabsPermission(browserManifest: chrome.runtime.Manifest) {
    if (browserManifest.permissions) {
      if (browserManifest.permissions.includes('tabs')) {
        throw new Error(
          "manifest contains 'tabs' already; this transform should be removed.",
        );
      }
      browserManifest.permissions.push('tabs');
    } else {
      browserManifest.permissions = ['tabs'];
    }
  }

  if (args.test) {
    // test builds need "tabs" permission for switchToWindowWithTitle
    transforms.push(addTabsPermission);
  }

  return transforms.length
    ? (browserManifest: chrome.runtime.Manifest, browser: Browser) => {
        const manifestClone = structuredClone(browserManifest);
        transforms.forEach((transform) => transform(manifestClone, browser));
        return manifestClone;
      }
    : undefined;
}
