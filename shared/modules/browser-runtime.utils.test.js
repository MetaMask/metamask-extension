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
    it('should return false when given a chrome browser with working prerender', () => {
      const browserBeforeBroken = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
      );
      let result =
        BrowserRuntimeUtil.getIsBrowserPrerenderBroken(browserBeforeBroken);
      expect(result).toStrictEqual(false);

      const browserWhenFixed = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      );
      result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(browserWhenFixed);
      expect(result).toStrictEqual(false);
    });
    it('should return true when given a chrome browser with broken prerender', () => {
      const browserWhenBroken = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
      );
      let result =
        BrowserRuntimeUtil.getIsBrowserPrerenderBroken(browserWhenBroken);
      expect(result).toStrictEqual(true);

      const browserBeforeFixed = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );
      result =
        BrowserRuntimeUtil.getIsBrowserPrerenderBroken(browserBeforeFixed);
      expect(result).toStrictEqual(true);
    });
    it('should return false when given an edge browser with working prerender', () => {
      const browserBeforeBroken = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.0.0',
      );
      let result =
        BrowserRuntimeUtil.getIsBrowserPrerenderBroken(browserBeforeBroken);
      expect(result).toStrictEqual(false);

      const browserWhenFixed = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
      );
      result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(browserWhenFixed);
      expect(result).toStrictEqual(false);
    });
    it('should return true when given an edge browser with broken prerender', () => {
      const browserWhenBroken = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edge/113.0.0.0',
      );
      let result =
        BrowserRuntimeUtil.getIsBrowserPrerenderBroken(browserWhenBroken);
      expect(result).toStrictEqual(true);

      const browserBeforeFixed = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edge/120.0.0.0',
      );
      result =
        BrowserRuntimeUtil.getIsBrowserPrerenderBroken(browserBeforeFixed);
      expect(result).toStrictEqual(true);
    });
    it('should return false when given a firefox browser', () => {
      const browser = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/91.0',
      );
      const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(browser);
      expect(result).toStrictEqual(false);
    });
    it('should return false when given an opera browser', () => {
      const browser = Bowser.getParser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.3578.98 Safari/537.36 OPR/76.0.3135.47',
      );
      const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(browser);
      expect(result).toStrictEqual(false);
    });
    it('should return false when given an unknown browser', () => {
      const browser = Bowser.getParser(
        'Mozilla/5.0 (Nintendo Switch; WebApplet) AppleWebKit/609.4 (KHTML, like Gecko) NF/6.0.2.21.3 NintendoBrowser/5.1.0.22474',
      );
      const result = BrowserRuntimeUtil.getIsBrowserPrerenderBroken(browser);
      expect(result).toStrictEqual(false);
    });
  });
});
