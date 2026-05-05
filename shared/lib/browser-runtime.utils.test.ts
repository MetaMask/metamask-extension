import Bowser from 'bowser';
import browser from 'webextension-polyfill';
import log from 'loglevel';
import * as BrowserRuntimeUtil from './browser-runtime.utils';

const mockLastError = { message: 'error', stack: [] as string[] };

let mockRuntimeLastError: { message: string; stack?: string[] } | undefined;

const mockGetURL = browser.runtime.getURL as jest.MockedFunction<
  typeof browser.runtime.getURL
>;

jest.mock('webextension-polyfill', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Jest ESM interop
  __esModule: true,
  default: {
    runtime: {
      get lastError() {
        return mockRuntimeLastError;
      },
      getURL: jest.fn(),
    },
  },
}));

describe('Browser Runtime Utils', () => {
  beforeEach(() => {
    mockRuntimeLastError = undefined;
    mockGetURL.mockReset();
  });

  describe('checkForLastError', () => {
    it('returns undefined if no lastError found', () => {
      expect(BrowserRuntimeUtil.checkForLastError()).toBeUndefined();
    });

    it('returns the lastError (Error object) if lastError is found', () => {
      mockRuntimeLastError = mockLastError;

      expect(BrowserRuntimeUtil.checkForLastError()).toStrictEqual(
        mockLastError,
      );
    });

    it('returns an Error object if the lastError is found with no stack', () => {
      mockRuntimeLastError = { message: mockLastError.message };

      const result = BrowserRuntimeUtil.checkForLastError();

      expect(result).toStrictEqual(expect.any(Error));
      expect(result).toHaveProperty('stack');
      expect((result as Error).message).toBe(mockLastError.message);
    });
  });

  describe('checkForLastErrorAndLog', () => {
    it('logs and returns error if error was found', () => {
      mockRuntimeLastError = { ...mockLastError };
      const logErrorSpy = jest
        .spyOn(log, 'error')
        .mockImplementation(() => undefined);

      const result = BrowserRuntimeUtil.checkForLastErrorAndLog();

      expect(logErrorSpy).toHaveBeenCalledWith(result);
      expect(result).toStrictEqual(mockLastError);
    });
  });

  describe('checkForLastErrorAndWarn', () => {
    it('warns and returns error if error was found', () => {
      mockRuntimeLastError = { ...mockLastError };
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        // noop
      });

      const result = BrowserRuntimeUtil.checkForLastErrorAndWarn();

      expect(warnSpy).toHaveBeenCalledWith(result);
      expect(result).toStrictEqual(mockLastError);

      warnSpy.mockRestore();
    });
  });

  describe('getIsBrowserPrerenderBroken', () => {
    it('calls Bowser.getParser when no parameter is passed', () => {
      const spy = jest.spyOn(Bowser, 'getParser');
      BrowserRuntimeUtil.getIsBrowserPrerenderBroken();
      expect(spy).toHaveBeenCalled();
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['windows', '112.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['windows', '120.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['macos', '112.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['macos', '120.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['linux', '112.0.0.0', 'X11; Linux x86_64'],
      ['linux', '121.0.0.0', 'X11; Linux x86_64'],
    ])(
      'returns false when given a chrome browser with working prerender in %s on version %s',
      (_: string, version: string, os: string) => {
        const bowser = Bowser.getParser(
          `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`,
        );
        const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
        expect(result).toStrictEqual(false);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['windows', '113.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['windows', '119.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['macos', '113.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['macos', '119.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['linux', '113.0.0.0', 'X11; Linux x86_64'],
      ['linux', '120.0.0.0', 'X11; Linux x86_64'],
    ])(
      'returns true when given a chrome browser with broken prerender in %s on version %s',
      (_: string, version: string, os: string) => {
        const bowser = Bowser.getParser(
          `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`,
        );
        const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
        expect(result).toStrictEqual(true);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['windows', '112.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['windows', '120.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['macos', '112.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['macos', '120.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['linux', '112.0.0.0', 'X11; Linux x86_64'],
      ['linux', '121.0.0.0', 'X11; Linux x86_64'],
    ])(
      'returns false when given an edge browser with working prerender in %s on version %s',
      (_: string, version: string, os: string) => {
        const bowser = Bowser.getParser(
          `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/i${version} Safari/537.36 Edg/${version}`,
        );
        const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
        expect(result).toStrictEqual(false);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['windows', '113.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['windows', '119.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['macos', '113.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['macos', '119.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['linux', '113.0.0.0', 'X11; Linux x86_64'],
      ['linux', '120.0.0.0', 'X11; Linux x86_64'],
    ])(
      'returns true when given an edge browser with broken prerender in %s on version %s',
      (_: string, version: string, os: string) => {
        const bowser = Bowser.getParser(
          `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/i${version} Safari/537.36 Edg/${version}`,
        );
        const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
        expect(result).toStrictEqual(true);
      },
    );

    it('returns false when given a firefox browser', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/91.0',
      );
      const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
      expect(result).toStrictEqual(false);
    });

    it('returns false when given an opera browser', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.3578.98 Safari/537.36 OPR/76.0.3135.47',
      );
      const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
      expect(result).toStrictEqual(false);
    });

    it('returns false when given an unknown browser', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Nintendo Switch; WebApplet) AppleWebKit/609.4 (KHTML, like Gecko) NF/6.0.2.21.3 NintendoBrowser/5.1.0.22474',
      );
      const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
      expect(result).toStrictEqual(false);
    });
  });

  describe('getBrowserName', () => {
    it('returns the name of the browser', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/91.0',
      );
      const result = BrowserRuntimeUtil.getBrowserName(bowser);
      expect(result).toStrictEqual('Firefox');
    });

    it('returns Brave when given a brave browser', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      );
      const result = BrowserRuntimeUtil.getBrowserName(bowser, {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        brave: {},
      } as unknown as Navigator);
      expect(result).toStrictEqual('Brave');
    });
  });

  describe('isFirefoxBrowser', () => {
    it('uses window.navigator defaults when called with no arguments', () => {
      const getParserSpy = jest.spyOn(Bowser, 'getParser');
      const explicit = BrowserRuntimeUtil.isFirefoxBrowser(
        Bowser.getParser(window.navigator.userAgent),
        window.navigator,
      );
      getParserSpy.mockClear();

      const implicit = BrowserRuntimeUtil.isFirefoxBrowser();

      expect(getParserSpy).toHaveBeenCalledTimes(1);
      expect(getParserSpy).toHaveBeenCalledWith(window.navigator.userAgent);
      expect(implicit).toBe(explicit);
      getParserSpy.mockRestore();
    });

    it('returns true for Firefox user agent', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
      );
      expect(BrowserRuntimeUtil.isFirefoxBrowser(bowser)).toBe(true);
    });

    it('returns false for Chrome user agent', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );
      expect(BrowserRuntimeUtil.isFirefoxBrowser(bowser)).toBe(false);
    });
  });

  describe('getChromiumCameraSettingsUrl', () => {
    it('uses window.navigator defaults when called with no arguments', () => {
      const getParserSpy = jest.spyOn(Bowser, 'getParser');
      const explicit = BrowserRuntimeUtil.getChromiumCameraSettingsUrl(
        Bowser.getParser(window.navigator.userAgent),
        window.navigator,
      );
      getParserSpy.mockClear();

      const implicit = BrowserRuntimeUtil.getChromiumCameraSettingsUrl();

      expect(getParserSpy).toHaveBeenCalledTimes(1);
      expect(getParserSpy).toHaveBeenCalledWith(window.navigator.userAgent);
      expect(implicit).toBe(explicit);
      getParserSpy.mockRestore();
    });

    it('returns Brave URL when navigator exposes brave', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
      const bowser = Bowser.getParser(ua);
      const nav = {
        userAgent: ua,
        brave: {},
      } as unknown as Navigator;
      expect(BrowserRuntimeUtil.getChromiumCameraSettingsUrl(bowser, nav)).toBe(
        'brave://settings/content/camera',
      );
    });

    it('returns Edge URL for Edge user agent', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
      const bowser = Bowser.getParser(ua);
      expect(
        BrowserRuntimeUtil.getChromiumCameraSettingsUrl(bowser, {
          userAgent: ua,
        } as Navigator),
      ).toBe('edge://settings/content/camera');
    });

    it('returns Chrome URL for Chrome user agent', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const bowser = Bowser.getParser(ua);
      expect(
        BrowserRuntimeUtil.getChromiumCameraSettingsUrl(bowser, {
          userAgent: ua,
        } as Navigator),
      ).toBe('chrome://settings/content/camera');
    });

    it('returns Edge URL when getBrowserName returns Microsoft Edge', () => {
      const mockBowser = {
        getBrowserName: jest.fn().mockReturnValue('Microsoft Edge'),
      } as unknown as Bowser.Parser.Parser;
      const nav = {
        userAgent: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1)',
      } as Navigator;

      expect(
        BrowserRuntimeUtil.getChromiumCameraSettingsUrl(mockBowser, nav),
      ).toBe('edge://settings/content/camera');
    });
  });

  describe('getChromiumExtensionCameraSiteSettingsUrl', () => {
    const extensionRoot =
      'chrome-extension://hebhblbkkdabgoldnojllkipeoacjioc/';
    const encodedSite = encodeURIComponent(extensionRoot);

    beforeEach(() => {
      mockGetURL.mockReturnValue(extensionRoot);
    });

    it('uses window.navigator defaults when called with no arguments', () => {
      const getParserSpy = jest.spyOn(Bowser, 'getParser');
      const explicit =
        BrowserRuntimeUtil.getChromiumExtensionCameraSiteSettingsUrl(
          Bowser.getParser(window.navigator.userAgent),
          window.navigator,
        );
      getParserSpy.mockClear();

      const implicit =
        BrowserRuntimeUtil.getChromiumExtensionCameraSiteSettingsUrl();

      expect(getParserSpy).toHaveBeenCalledTimes(1);
      expect(getParserSpy).toHaveBeenCalledWith(window.navigator.userAgent);
      expect(implicit).toBe(explicit);
      getParserSpy.mockRestore();
    });

    it('returns Chrome site-details URL with encoded extension site', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const bowser = Bowser.getParser(ua);
      expect(
        BrowserRuntimeUtil.getChromiumExtensionCameraSiteSettingsUrl(bowser, {
          userAgent: ua,
        } as Navigator),
      ).toBe(`chrome://settings/content/siteDetails?site=${encodedSite}`);
    });

    it('returns Brave site-details URL when navigator exposes brave', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
      const bowser = Bowser.getParser(ua);
      const nav = {
        userAgent: ua,
        brave: {},
      } as unknown as Navigator;
      expect(
        BrowserRuntimeUtil.getChromiumExtensionCameraSiteSettingsUrl(
          bowser,
          nav,
        ),
      ).toBe(`brave://settings/content/siteDetails?site=${encodedSite}`);
    });

    it('returns Edge site-details URL for Edge user agent', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
      const bowser = Bowser.getParser(ua);
      expect(
        BrowserRuntimeUtil.getChromiumExtensionCameraSiteSettingsUrl(bowser, {
          userAgent: ua,
        } as Navigator),
      ).toBe(`edge://settings/content/siteDetails?site=${encodedSite}`);
    });
  });

  describe('getMozExtensionOriginForDisplay', () => {
    it('returns a truncated moz-extension origin', () => {
      mockGetURL.mockReturnValue(
        'moz-extension://ab5f75ae-cfd3-4ace-830e-155830d4aa03/',
      );
      expect(BrowserRuntimeUtil.getMozExtensionOriginForDisplay()).toBe(
        'moz-extension://ab5f75ae…0d4aa03',
      );
    });

    it('returns the full getURL string when it is not a moz-extension origin', () => {
      const chromeUrl = 'chrome-extension://abcdefghijklmnopqrstuvwxyz012345/';
      mockGetURL.mockReturnValue(chromeUrl);

      expect(BrowserRuntimeUtil.getMozExtensionOriginForDisplay()).toBe(
        chromeUrl,
      );
    });

    it('returns full moz-extension URL when the id is short after removing hyphens', () => {
      mockGetURL.mockReturnValue('moz-extension://abc-def-ghi/');

      expect(BrowserRuntimeUtil.getMozExtensionOriginForDisplay()).toBe(
        'moz-extension://abc-def-ghi',
      );
    });

    it('returns full moz-extension URL when compact id length is exactly 15', () => {
      mockGetURL.mockReturnValue('moz-extension://abcdefghijklmno/');

      expect(BrowserRuntimeUtil.getMozExtensionOriginForDisplay()).toBe(
        'moz-extension://abcdefghijklmno',
      );
    });

    it('returns empty string when runtime.getURL throws', () => {
      mockGetURL.mockImplementation(() => {
        throw new Error('unavailable');
      });

      expect(BrowserRuntimeUtil.getMozExtensionOriginForDisplay()).toBe('');
    });
  });
});
