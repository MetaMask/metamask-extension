import merge from 'lodash/merge';
import { MANIFEST_DEV_KEY } from '../../../../build/constants';
import type { Args } from '../../cli';
/**
 * Returns a function that will transform a manifest JSON object based on the
 * given build args.
 *
 * Applies the following transformations:
 * - If `test` is `true`, adds the "tabs" permission to the manifest in MV2
 *
 * @param args
 * @param args.test
 * @param args.manifest_version
 * @param isDevelopment
 * @param manifestOverridesPath
 * @returns a function that will transform the manifest JSON object
 * @throws an error if the manifest already contains the "tabs" permission and
 * `test` is `true` in MV2
 */
export function transformManifest(
  args: Pick<Args, 'test' | 'manifest_version'>,
  isDevelopment: boolean,
  manifestOverridesPath?: string | undefined,
) {
  const transforms: ((
    manifest: chrome.runtime.Manifest,
    browser?: string,
  ) => chrome.runtime.Manifest | void)[] = [];

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

  function addManifestKey(browserManifest: chrome.runtime.Manifest) {
    if (!browserManifest.key) {
      browserManifest.key = MANIFEST_DEV_KEY;
    }
  }

  if (isDevelopment || args.test) {
    transforms.push(addManifestKey);
  }

  function applyOcapKernelChanges(
    browserManifest: chrome.runtime.Manifest,
  ): void {
    const mv3Manifest = browserManifest as chrome.runtime.ManifestV3;
    if (!Array.isArray(mv3Manifest.sandbox?.pages)) {
      merge(mv3Manifest, { sandbox: { pages: [] } });
    }
    (mv3Manifest.sandbox as { pages: string[] }).pages.push(
      'ocap-kernel/vat/iframe.html',
    );
    mv3Manifest.devtools_page = 'devtools/devtools.html';
    if (mv3Manifest.content_security_policy?.extension_pages) {
      mv3Manifest.content_security_policy.extension_pages =
        mv3Manifest.content_security_policy.extension_pages.replace(
          "frame-ancestors 'none';",
          "frame-ancestors 'self' devtools://*;",
        );
    }
  }

  if (args.manifest_version === 3) {
    transforms.push(applyOcapKernelChanges);
  }

  return transforms.length
    ? (browserManifest: chrome.runtime.Manifest, _browser: string) => {
        const manifestClone = structuredClone(browserManifest);
        transforms.forEach((transform) => transform(manifestClone));
        return manifestClone;
      }
    : undefined;
}
