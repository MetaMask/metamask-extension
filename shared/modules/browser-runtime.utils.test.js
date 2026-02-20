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

  describe('getBrowserName', () => {
    it('should return the name of the browser', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/91.0',
      );
      const result = BrowserRuntimeUtil.getBrowserName(bowser);
      expect(result).toStrictEqual('Firefox');
    });
    it('should return Brave when given a brave browser', () => {
      const bowser = Bowser.getParser(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      );
      const result = BrowserRuntimeUtil.getBrowserName(bowser, {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        brave: {},
      });
      expect(result).toStrictEqual('Brave');
    });
  });
});
