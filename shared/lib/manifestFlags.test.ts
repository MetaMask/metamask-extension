import { getManifestFlags } from './manifestFlags';

type Globals = {
  browser?: unknown;
  chrome?: unknown;
};

const globals = globalThis as unknown as Globals;

/**
 * A `runtime.getManifest` returning a manifest that carries the given flags.
 *
 * @param flags - the value of the manifest's `_flags` key. Omit for a manifest
 * that carries none.
 * @returns an object shaped like an extension global.
 */
function extensionGlobal(flags?: Record<string, unknown>) {
  /* eslint-disable @typescript-eslint/naming-convention -- `manifest_version`
     and `_flags` are key names fixed by the WebExtension manifest format. */
  const manifest = flags
    ? { manifest_version: 3, _flags: flags }
    : { manifest_version: 3 };
  /* eslint-enable @typescript-eslint/naming-convention */
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
    globals.chrome = extensionGlobal({ sentry: { tracesSampleRate: 1 } });

    expect(getManifestFlags()).toStrictEqual({
      sentry: { tracesSampleRate: 1 },
    });
  });

  it('reads `_flags` off `browser.runtime` when `browser` is present', () => {
    globals.browser = extensionGlobal({
      testing: { fixtureServerPort: 12345 },
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
    globals.chrome = extensionGlobal({ ci: { enabled: true } });

    expect(getManifestFlags()).toStrictEqual({ ci: { enabled: true } });
  });

  it('returns an empty object when the manifest carries no `_flags`', () => {
    delete globals.browser;
    globals.chrome = extensionGlobal();

    expect(getManifestFlags()).toStrictEqual({});
  });
});
