import manifestFlags from '../../../../../manifest-flags.json';

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
 * @returns a function that will transform the manifest JSON object
 * @throws an error if the manifest already contains the "tabs" permission and
 * `test` is `true`
 */
export function transformManifest(args: { lockdown: boolean; test: boolean }) {
  const transforms: ((manifest: chrome.runtime.Manifest) => void)[] = [];

  function removeLockdown(browserManifest: chrome.runtime.Manifest) {
    const mainScripts = browserManifest.content_scripts?.[0];
    if (mainScripts) {
      const keep = ['scripts/contentscript.js', 'scripts/inpage.js'];
      mainScripts.js = mainScripts.js?.filter((js) => keep.includes(js));
    }
  }

  /**
   * This function sets predefined flags in the manifest's _flags property.
   *
   * @param browserManifest - The Chrome extension manifest object to modify
   */
  function addManifestFlags(browserManifest: chrome.runtime.Manifest) {
    browserManifest._flags = manifestFlags;
  }

  transforms.push(addManifestFlags);

  if (!args.lockdown) {
    // remove lockdown scripts from content_scripts
    transforms.push(removeLockdown);
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
    ? (browserManifest: chrome.runtime.Manifest, _browser: string) => {
        const clone = structuredClone(browserManifest);
        transforms.forEach((transform) => transform(clone));
        return clone;
      }
    : undefined;
}
