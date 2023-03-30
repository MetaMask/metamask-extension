import log from 'loglevel';
import { isErrorWithMessage, logErrorWithMessage } from './error';

jest.mock('loglevel');

describe('error module', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('isErrorWithMessage', () => {
    it('returns true when passed an instance of an Error', () => {
      expect(isErrorWithMessage(new Error('test'))).toBe(true);
    });

    it('returns false when passed a string', () => {
      expect(isErrorWithMessage('test')).toBe(false);
    });
  });

  describe('logErrorWithMessage', () => {
    it('calls loglevel.error with the error.message when passed an instance of Error', () => {
      logErrorWithMessage(new Error('test'));
      expect(log.error).toHaveBeenCalledWith('test');
    });

    it('calls loglevel.error with the parameter passed in when parameter is not an instance of Error', () => {
      logErrorWithMessage({ test: 'test' });
      expect(log.error).toHaveBeenCalledWith({ test: 'test' });
    });
  });
});
