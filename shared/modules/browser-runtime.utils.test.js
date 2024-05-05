import sinon from 'sinon';
import Bowser from 'bowser';
import browser from 'webextension-polyfill';
import log from 'loglevel';
import * as BrowserRuntimeUtil from './browser-runtime.utils';

const mockLastError = { message: 'error', stack: [] };

describe('Browser Runtime Utils', () => {
  beforeAll(() => {
    sinon.replace(browser, 'runtime', {
      lastError: undefined,
    });
  });

  describe('checkForLastError', () => {
    it('should return undefined if no lastError found', () => {
      expect(BrowserRuntimeUtil.checkForLastError()).toBeUndefined();
    });

    it('should return the lastError (Error object) if lastError is found', () => {
      sinon.stub(browser.runtime, 'lastError').value(mockLastError);

      expect(BrowserRuntimeUtil.checkForLastError()).toStrictEqual(
        mockLastError,
      );
    });

    it('should return an Error object if the lastError is found with no stack', () => {
      sinon
        .stub(browser.runtime, 'lastError')
        .value({ message: mockLastError.message });

      const result = BrowserRuntimeUtil.checkForLastError();

      expect(result).toStrictEqual(expect.any(Error));
      expect(result).toHaveProperty('stack');
      expect(result.message).toBe(mockLastError.message);
    });
  });

  describe('checkForLastErrorAndLog', () => {
    it('should log and return error if error was found', () => {
      sinon.stub(browser.runtime, 'lastError').value({ ...mockLastError });
      sinon.stub(log, 'error');

      const result = BrowserRuntimeUtil.checkForLastErrorAndLog();

      expect(log.error.calledWith(result)).toBeTruthy();
      expect(result).toStrictEqual(mockLastError);

      log.error.restore();
    });
  });

  describe('getIsBrowserPrerenderBroken', () => {
    it('should call Bowser.getParser when no parameter is passed', () => {
      const spy = jest.spyOn(Bowser, 'getParser');
      BrowserRuntimeUtil.getIsBrowserPrerenderBroken();
      expect(spy).toHaveBeenCalled();
    });
    it.each([
      ['windows', '112.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['windows', '120.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['macos', '112.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['macos', '120.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['linux', '112.0.0.0', 'X11; Linux x86_64'],
      ['linux', '121.0.0.0', 'X11; Linux x86_64'],
    ])(
      'should return false when given a chrome browser with working prerender in %s on version %s',
      (_, version, os) => {
        const bowser = Bowser.getParser(
          `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`,
        );
        const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
        expect(result).toStrictEqual(false);
      },
    );
    it.each([
      ['windows', '113.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['windows', '119.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['macos', '113.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['macos', '119.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['linux', '113.0.0.0', 'X11; Linux x86_64'],
      ['linux', '120.0.0.0', 'X11; Linux x86_64'],
    ])(
      'should return true when given a chrome browser with broken prerender in %s on version %s',
      (_, version, os) => {
        const bowser = Bowser.getParser(
          `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`,
        );
        const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
        expect(result).toStrictEqual(true);
      },
    );
    it.each([
      ['windows', '112.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['windows', '120.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['macos', '112.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['macos', '120.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['linux', '112.0.0.0', 'X11; Linux x86_64'],
      ['linux', '121.0.0.0', 'X11; Linux x86_64'],
    ])(
      'should return false when given an edge browser with working prerender in %s on version %s',
      (_, version, os) => {
        const bowser = Bowser.getParser(
          `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/i${version} Safari/537.36 Edg/${version}`,
        );
        const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
        expect(result).toStrictEqual(false);
      },
    );
    it.each([
      ['windows', '113.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['windows', '119.0.0.0', 'Windows NT 10.0; Win64; x64'],
      ['macos', '113.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['macos', '119.0.0.0', 'Macintosh; Intel Mac OS X 10_16_0'],
      ['linux', '113.0.0.0', 'X11; Linux x86_64'],
      ['linux', '120.0.0.0', 'X11; Linux x86_64'],
    ])(
      'should return true when given an edge browser with broken prerender in %s on version %s',
      (_, version, os) => {
        const bowser = Bowser.getParser(
          `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/i${version} Safari/537.36 Edg/${version}`,
        );
        const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
        expect(result).toStrictEqual(true);
      },
    );
    it('should return false when given a firefox browser', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/91.0',
      );
      const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
      expect(result).toStrictEqual(false);
    });
    it('should return false when given an opera browser', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.3578.98 Safari/537.36 OPR/76.0.3135.47',
      );
      const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
      expect(result).toStrictEqual(false);
    });
    it('should return false when given an unknown browser', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Nintendo Switch; WebApplet) AppleWebKit/609.4 (KHTML, like Gecko) NF/6.0.2.21.3 NintendoBrowser/5.1.0.22474',
      );
      const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(bowser);
      expect(result).toStrictEqual(false);
    });
  });
});
