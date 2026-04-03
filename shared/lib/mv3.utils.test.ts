describe('mv3.utils', () => {
  const originalChrome = global.chrome;
  const originalEnableMv3 = process.env.ENABLE_MV3;

  afterEach(() => {
    global.chrome = originalChrome;
    process.env.ENABLE_MV3 = originalEnableMv3;
  });

  function loadModule(): typeof import('./mv3.utils') {
    let mod: typeof import('./mv3.utils');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('./mv3.utils');
    });
    // @ts-expect-error assigned inside isolateModules
    return mod;
  }

  describe('isManifestV3', () => {
    it('returns true when the runtime manifest version is 3', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).chrome = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        runtime: { getManifest: () => ({ manifest_version: 3 }) },
      };
      const { isManifestV3 } = loadModule();
      expect(isManifestV3).toBe(true);
    });

    it('returns false when the runtime manifest version is 2', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).chrome = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        runtime: { getManifest: () => ({ manifest_version: 2 }) },
      };
      const { isManifestV3 } = loadModule();
      expect(isManifestV3).toBe(false);
    });

    it('returns true when there is no runtime manifest and ENABLE_MV3 is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).chrome = undefined;
      delete process.env.ENABLE_MV3;
      const { isManifestV3 } = loadModule();
      expect(isManifestV3).toBe(true);
    });

    it('returns true when there is no runtime manifest and ENABLE_MV3 is "true"', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).chrome = undefined;
      process.env.ENABLE_MV3 = 'true';
      const { isManifestV3 } = loadModule();
      expect(isManifestV3).toBe(true);
    });

    it('returns false when there is no runtime manifest and ENABLE_MV3 is "false"', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).chrome = undefined;
      process.env.ENABLE_MV3 = 'false';
      const { isManifestV3 } = loadModule();
      expect(isManifestV3).toBe(false);
    });
  });

  describe('isOffscreenAvailable', () => {
    it('returns false when chrome.offscreen is not available', () => {
      const { isOffscreenAvailable } = loadModule();
      expect(isOffscreenAvailable).toBe(false);
    });

    it('returns true when chrome.offscreen is available', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).chrome = {
        ...global.chrome,
        offscreen: {},
      };
      const { isOffscreenAvailable } = loadModule();
      expect(isOffscreenAvailable).toBe(true);
    });
  });

  describe('isMv3ButOffscreenDocIsMissing', () => {
    it('returns true when manifest is v3 and offscreen is not available', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).chrome = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        runtime: { getManifest: () => ({ manifest_version: 3 }) },
      };
      const { isMv3ButOffscreenDocIsMissing } = loadModule();
      expect(isMv3ButOffscreenDocIsMissing).toBe(true);
    });

    it('returns false when manifest is v2', () => {
      const { isMv3ButOffscreenDocIsMissing } = loadModule();
      expect(isMv3ButOffscreenDocIsMissing).toBe(false);
    });

    it('returns false when manifest is v3 and offscreen is available', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).chrome = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        runtime: { getManifest: () => ({ manifest_version: 3 }) },
        offscreen: {},
      };
      const { isMv3ButOffscreenDocIsMissing } = loadModule();
      expect(isMv3ButOffscreenDocIsMissing).toBe(false);
    });
  });
});
