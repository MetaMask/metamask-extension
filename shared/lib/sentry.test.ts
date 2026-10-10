import type * as Sentry from '@sentry/browser';
import { captureException, captureMessage, TRACE_ID_TAG } from './sentry';

describe('Sentry', () => {
  const originalSentry = globalThis.sentry;

  beforeEach(() => {
    jest.resetAllMocks();

    globalThis.sentry = {
      ...globalThis.sentry,
      getActiveSpan: jest.fn().mockReturnValue(undefined),
    };
  });

  afterEach(() => {
    globalThis.sentry = originalSentry;
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

    it('adds the active trace_id tag to captureException', () => {
      jest.spyOn(console, 'error').mockImplementation(jest.fn());
      const captureExceptionSpy = jest.spyOn(
        globalThis.sentry,
        'captureException',
      );
      jest.mocked(globalThis.sentry.getActiveSpan).mockReturnValue({
        spanContext: jest.fn().mockReturnValue({
          traceId: 'trace-123',
        }),
      } as unknown as Sentry.Span);

      const testError = new Error('Test error');

      captureException(testError, { extra: { foo: 'bar' } });

      expect(captureExceptionSpy).toHaveBeenCalledWith(testError, {
        extra: { foo: 'bar' },
        tags: { [TRACE_ID_TAG]: 'trace-123' },
      });
    });

    it('does not override an existing trace_id tag on captureException', () => {
      jest.spyOn(console, 'error').mockImplementation(jest.fn());
      const captureExceptionSpy = jest.spyOn(
        globalThis.sentry,
        'captureException',
      );
      jest.mocked(globalThis.sentry.getActiveSpan).mockReturnValue({
        spanContext: jest.fn().mockReturnValue({
          traceId: 'trace-123',
        }),
      } as unknown as Sentry.Span);

      const testError = new Error('Test error');

      captureException(testError, {
        extra: { foo: 'bar' },
        tags: { [TRACE_ID_TAG]: 'existing-trace-id', foo: 'bar' },
      });

      expect(captureExceptionSpy).toHaveBeenCalledWith(testError, {
        extra: { foo: 'bar' },
        tags: { [TRACE_ID_TAG]: 'existing-trace-id', foo: 'bar' },
      });
    });

    it('preserves a scope-callback hint and sets trace_id on the scope', () => {
      jest.spyOn(console, 'error').mockImplementation(jest.fn());
      const captureExceptionSpy = jest.spyOn(
        globalThis.sentry,
        'captureException',
      );
      jest.mocked(globalThis.sentry.getActiveSpan).mockReturnValue({
        spanContext: jest.fn().mockReturnValue({
          traceId: 'trace-123',
        }),
      } as unknown as Sentry.Span);

      const testError = new Error('Test error');
      const callerCallback = jest.fn((scope) => scope);

      captureException(testError, callerCallback);

      // The hint handed to Sentry must still be a function (callback preserved),
      // not replaced by a plain tags object — otherwise the callback's scope
      // mutations would be dropped.
      const passedHint = captureExceptionSpy.mock.calls[0][1];
      expect(typeof passedHint).toBe('function');

      // Running the wrapper sets the trace id and invokes the caller's callback.
      const scope = { setTag: jest.fn() } as unknown as Sentry.Scope;
      (passedHint as (s: Sentry.Scope) => Sentry.Scope)(scope);
      expect(scope.setTag).toHaveBeenCalledWith(TRACE_ID_TAG, 'trace-123');
      expect(callerCallback).toHaveBeenCalledWith(scope);
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
