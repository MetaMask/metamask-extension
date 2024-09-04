export type ManifestFlags = {
  circleci?: {
    enabled: boolean;
    branch?: string;
    buildNum?: number;
    job?: string;
    nodeIndex?: number;
    prNumber?: number;
  };
  doNotForceSentryForThisTest?: boolean;
};

/**
 * Get the runtime flags that were placed in manifest.json by alterBuiltManifest.ts
 *
 * @returns flags if they exist, otherwise an empty object
 */
export function getManifestFlags(): ManifestFlags {
  return chrome.runtime.getManifest()._flags || {};
}
