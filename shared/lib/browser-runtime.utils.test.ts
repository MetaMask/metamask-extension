import Bowser from 'bowser';
import browser from 'webextension-polyfill';
import log from 'loglevel';
import * as BrowserRuntimeUtil from './browser-runtime.utils';

const mockLastError = { message: 'error', stack: [] as string[] };

let mockRuntimeLastError: { message: string; stack?: string[] } | undefined;

jest.mock('webextension-polyfill', () => ({
  runtime: {
    get lastError() {
      return mockRuntimeLastError;
    },
  },
}));

describe('Browser Runtime Utils', () => {
  beforeEach(() => {
    mockRuntimeLastError = undefined;
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
});
