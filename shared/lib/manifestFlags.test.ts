import { getManifestFlags } from './manifestFlags';

type Globals = {
  browser?: unknown;
  chrome?: unknown;
};

const globals = globalThis as unknown as Globals;

/**
 * A `runtime.getManifest` that returns the given manifest object.
 *
 * @param manifest - what `getManifest()` should return.
 * @returns an object shaped like an extension global.
 */
function extensionGlobal(manifest: Record<string, unknown>) {
  return { runtime: { id: 'test-extension', getManifest: () => manifest } };
}

describe('getManifestFlags', () => {
  const originalBrowser = globals.browser;
  const originalChrome = globals.chrome;

  afterEach(() => {
    globals.browser = originalBrowser;
    globals.chrome = originalChrome;
  });

  it('returns an empty object outside an extension instead of throwing', () => {
    // The regression this guards (extension#46664): six e2e benchmark flows
    // reach this module from Node through `app/scripts/lib/messenger`, and a
    // top-level `webextension-polyfill` import ended the process here before
    // any guard could run.
    delete globals.browser;
    delete globals.chrome;

    expect(() => getManifestFlags()).not.toThrow();
    expect(getManifestFlags()).toStrictEqual({});
  });

  it('reads `_flags` off `chrome.runtime` when only `chrome` is present', () => {
    delete globals.browser;
    globals.chrome = extensionGlobal({
      manifest_version: 3,
      _flags: { sentry: { tracesSampleRate: 1 } },
    });

    expect(getManifestFlags()).toStrictEqual({
      sentry: { tracesSampleRate: 1 },
    });
  });

  it('reads `_flags` off `browser.runtime` when `browser` is present', () => {
    globals.browser = extensionGlobal({
      manifest_version: 2,
      _flags: { testing: { fixtureServerPort: 12345 } },
    });
    delete globals.chrome;

    expect(getManifestFlags()).toStrictEqual({
      testing: { fixtureServerPort: 12345 },
    });
  });

  it('falls through to `chrome` when `browser` exists without a `runtime`', () => {
    // The shape `test/setup.js` installs: a `browser` global carrying only
    // `permissions`. Keying the fallback on `browser` itself rather than on
    // `browser.runtime` would read `undefined` here and lose the flags.
    globals.browser = { permissions: {} };
    globals.chrome = extensionGlobal({
      manifest_version: 3,
      _flags: { ci: { enabled: true } },
    });

    expect(getManifestFlags()).toStrictEqual({ ci: { enabled: true } });
  });

  it('returns an empty object when the manifest carries no `_flags`', () => {
    delete globals.browser;
    globals.chrome = extensionGlobal({ manifest_version: 3 });

    expect(getManifestFlags()).toStrictEqual({});
  });
});
