import browser from 'webextension-polyfill';

export type ManifestFlags = {
  circleci?: {
    enabled: boolean;
    branch?: string;
    buildNum?: number;
    job?: string;
    nodeIndex?: number;
    prNumber?: number;
  };
  sentry?: {
    tracesSampleRate?: number;
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
  return (
    (browser.runtime.getManifest() as WebExtensionManifestWithFlags)._flags ||
    {}
  );
}
