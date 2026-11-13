type Mv3Utils = typeof import('./mv3.utils');

/**
 * Builds the smallest manifest `getManifest` can return.
 * Extension manifests use the snake_case `manifest_version` field.
 *
 * @param manifestVersion - Manifest version to report.
 * @returns A manifest whose version is `manifestVersion`.
 */
function manifestWithVersion(
  manifestVersion: 2 | 3,
): Pick<chrome.runtime.Manifest, 'manifest_version'> {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    manifest_version: manifestVersion,
  };
}

/**
 * Manifest detection runs once, when the module is first evaluated.
 *
 * @returns A freshly evaluated copy of mv3.utils.
 */
function loadMv3Utils(): Mv3Utils {
  let loaded: Mv3Utils | undefined;

  jest.isolateModules(() => {
    loaded = jest.requireActual<Mv3Utils>('./mv3.utils');
  });

  if (!loaded) {
    throw new Error('Failed to load mv3.utils');
  }

  return loaded;
}

describe('mv3.utils', () => {
  const originalChrome = global.chrome;
  const originalBrowser = global.browser;
  const originalEnableMv3 = process.env.ENABLE_MV3;

  afterEach(() => {
    global.chrome = originalChrome;
    global.browser = originalBrowser;

    if (originalEnableMv3 === undefined) {
      delete process.env.ENABLE_MV3;
    } else {
      process.env.ENABLE_MV3 = originalEnableMv3;
    }
  });

  it('reads manifest version 3 from chrome.runtime.getManifest', () => {
    const getBrowserManifest = jest.fn(() => manifestWithVersion(2));
    global.chrome = {
      offscreen: {},
      runtime: {
        getManifest: () => manifestWithVersion(3),
      },
    } as typeof global.chrome;
    global.browser = {
      runtime: {
        getManifest: getBrowserManifest,
      },
    } as unknown as typeof global.browser;
    process.env.ENABLE_MV3 = 'false';

    const {
      isManifestV3,
      isOffscreenAvailable,
      isMv3ButOffscreenDocIsMissing,
    } = loadMv3Utils();

    expect(isManifestV3).toBe(true);
    expect(isOffscreenAvailable).toBe(true);
    expect(isMv3ButOffscreenDocIsMissing).toBe(false);
    expect(getBrowserManifest).not.toHaveBeenCalled();
  });

  it('reads manifest version 2 from chrome.runtime.getManifest', () => {
    global.chrome = {
      runtime: {
        getManifest: () => manifestWithVersion(2),
      },
    } as typeof global.chrome;
    process.env.ENABLE_MV3 = 'true';

    const {
      isManifestV3,
      isOffscreenAvailable,
      isMv3ButOffscreenDocIsMissing,
    } = loadMv3Utils();

    expect(isManifestV3).toBe(false);
    expect(isOffscreenAvailable).toBe(false);
    expect(isMv3ButOffscreenDocIsMissing).toBe(false);
  });

  it('falls back to browser.runtime.getManifest when chrome has no runtime', () => {
    global.chrome = {} as typeof global.chrome;
    global.browser = {
      runtime: {
        getManifest: () => manifestWithVersion(2),
      },
    } as unknown as typeof global.browser;
    process.env.ENABLE_MV3 = 'true';

    expect(loadMv3Utils().isManifestV3).toBe(false);
  });

  it('does not throw when chrome and browser have no runtime', () => {
    global.chrome = {
      runtime: {},
    } as typeof global.chrome;
    global.browser = {} as typeof global.browser;
    process.env.ENABLE_MV3 = 'false';

    expect(loadMv3Utils().isManifestV3).toBe(false);
  });

  it('treats an unset ENABLE_MV3 as manifest version 3 when no runtime manifest exists', () => {
    global.chrome = {} as typeof global.chrome;
    global.browser = {} as typeof global.browser;
    delete process.env.ENABLE_MV3;

    const { isManifestV3, isMv3ButOffscreenDocIsMissing } = loadMv3Utils();

    expect(isManifestV3).toBe(true);
    expect(isMv3ButOffscreenDocIsMissing).toBe(true);
  });
});
