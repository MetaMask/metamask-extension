/**
 * Get the runtime flags that were placed in manifest.json by alterBuiltManifest.ts
 *
 * @returns flags if they exist, otherwise an empty object
 */
export function getManifestFlags() {
  return chrome.runtime.getManifest()._flags || {};
}
