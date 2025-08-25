import { captureException, captureMessage } from './sentry';

describe('Sentry', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('captureException', () => {
    it('prints a console error when Sentry is not initialized', () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(jest.fn());
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(jest.fn());
      jest.replaceProperty(globalThis, 'sentry', undefined);
      const testError = new Error('Test error');

      captureException(testError, { extra: { foo: 'bar' } });

      expect(consoleWarnSpy).toHaveBeenCalledWith('Sentry not initialized');
      expect(consoleErrorSpy).toHaveBeenCalledWith(testError, {
        extra: { foo: 'bar' },
      });
    });

    it('calls global Sentry captureException', () => {
      const captureExceptionSpy = jest.spyOn(
        globalThis.sentry,
        'captureException',
      );
      const testError = new Error('Test error');

      captureException(testError);

      expect(captureExceptionSpy).toHaveBeenCalledWith(testError);
    });

    it('calls global Sentry captureException with extra data', () => {
      const captureExceptionSpy = jest.spyOn(
        globalThis.sentry,
        'captureException',
      );
      const testError = new Error('Test error');

      captureException(testError, { extra: { foo: 'bar' } });

      expect(captureExceptionSpy).toHaveBeenCalledWith(testError, {
        extra: { foo: 'bar' },
      });
    });
  });

  describe('captureMessage', () => {
    it('prints a console log when Sentry is not initialized', () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(jest.fn());
      const consoleLogSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(jest.fn());
      jest.replaceProperty(globalThis, 'sentry', undefined);

      captureMessage('Test message', 'info');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Sentry not initialized');
      expect(consoleLogSpy).toHaveBeenCalledWith('Test message', 'info');
    });

    it('calls global Sentry captureMessage', () => {
      const captureMessageSpy = jest.spyOn(globalThis.sentry, 'captureMessage');

      captureMessage('Test message');

      expect(captureMessageSpy).toHaveBeenCalledWith('Test message');
    });

    it('calls global Sentry captureMessage with severity level/context', () => {
      const captureMessageSpy = jest.spyOn(globalThis.sentry, 'captureMessage');

      captureMessage('Test message', 'info');

      expect(captureMessageSpy).toHaveBeenCalledWith('Test message', 'info');
    });
  });
});
