import merge from 'lodash/merge';
import { MANIFEST_DEV_KEY } from '../../../../build/constants';
/**
 * Returns a function that will transform a manifest JSON object based on the
 * given build args.
 *
 * Applies the following transformations:
 * - If `lockdown` is `false`, removes lockdown scripts from content_scripts
 * - If `test` is `true`, adds the "tabs" permission to the manifest
 *
 * @param args
 * @param args.lockdown
 * @param args.test
 * @param isDevelopment
 * @param manifestOverridesPath
 * @returns a function that will transform the manifest JSON object
 * @throws an error if the manifest already contains the "tabs" permission and
 * `test` is `true`
 */
export function transformManifest(
  args: { lockdown: boolean; test: boolean },
  isDevelopment: boolean,
  manifestOverridesPath?: string | undefined,
) {
  const transforms: ((
    manifest: chrome.runtime.Manifest,
    browser?: string,
  ) => chrome.runtime.Manifest | void)[] = [];

  function removeLockdown(browserManifest: chrome.runtime.Manifest) {
    const mainScripts = browserManifest.content_scripts?.[0];
    if (mainScripts) {
      const keep = ['scripts/contentscript.js', 'scripts/inpage.js'];
      mainScripts.js = mainScripts.js?.filter((js) => keep.includes(js));
    }
  }

  if (!args.lockdown) {
    // remove lockdown scripts from content_scripts
    transforms.push(removeLockdown);
  }

  /**
   * This function sets predefined flags in the manifest's _flags property
   * that are stored in the file specified by the `MANIFEST_OVERRIDES` build variable
   *
   * @param browserManifest - The Chrome extension manifest object to modify
   */
  function addManifestFlags(browserManifest: chrome.runtime.Manifest): void {
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
    // Add manifest flags only for development builds
    transforms.push(addManifestFlags);
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

  function addManifestKeyAndPermissions(
    browserManifest: chrome.runtime.Manifest,
    browser?: string,
  ) {
    if (!browserManifest.key) {
      browserManifest.key = MANIFEST_DEV_KEY;
    }

    if (browser === 'firefox') {
      // Firefox requires the identity as the installation permission
      if (browserManifest.permissions?.includes('identity')) {
        throw new Error(
          "manifest contains 'identity' already; this transform should be removed.",
        );
      } else {
        browserManifest.permissions?.push('identity');
      }
    } else if (browserManifest.optional_permissions?.includes('identity')) {
      throw new Error(
        "manifest contains 'identity' already; this transform should be removed.",
      );
    } else {
      browserManifest.optional_permissions?.push('identity');
    }
  }

  if (isDevelopment || args.test) {
    transforms.push(addManifestKeyAndPermissions);
  }

  return transforms.length
    ? (browserManifest: chrome.runtime.Manifest, browser: string) => {
        const manifestClone = structuredClone(browserManifest);
        transforms.forEach((transform) => transform(manifestClone, browser));
        return manifestClone;
      }
    : undefined;
}
