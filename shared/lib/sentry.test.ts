import { checkOrSetAlreadyCaught } from '@sentry/core';
import {
  captureException,
  captureMessage,
  markErrorAsCaptured,
} from './sentry';

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

  describe('markErrorAsCaptured', () => {
    it('returns the same error', () => {
      const testError = new Error('Test error');

      expect(markErrorAsCaptured(testError)).toBe(testError);
    });

    it('keeps the mark off enumerable output', () => {
      // Must stay invisible to `extraErrorDataIntegration` and to any
      // serialization of the error, e.g. over the critical-error port.
      const testError = markErrorAsCaptured(
        Object.assign(new Error('Test error'), { detail: 'kept' }),
      );

      expect(Object.keys(testError)).toStrictEqual(['detail']);
      expect(JSON.stringify(testError)).toStrictEqual('{"detail":"kept"}');
    });

    it('handles primitives without throwing', () => {
      // Primitives cannot carry the mark, matching the SDK's own behaviour.
      const primitives = ['not an error', null, undefined, 42];

      for (const value of primitives) {
        expect(markErrorAsCaptured(value)).toBe(value);
      }
    });

    it('marks any value the SDK could also mark', () => {
      // The SDK attempts `defineProperty` on whatever it is given, so gating on
      // `typeof === 'object'` would leave a thrown function markable by the SDK
      // but not by us, and it would then be reported twice.
      const thrownFunction = markErrorAsCaptured(function boom() {
        // Never called; only thrown.
      });

      expect(checkOrSetAlreadyCaught(thrownFunction)).toBe(true);
    });

    it('does not throw when the error is frozen', () => {
      const frozenError = Object.freeze(new Error('Test error'));

      expect(() => markErrorAsCaptured(frozenError)).not.toThrow();
      // The mark could not be applied, so the error stays reportable. This
      // fails open: it may be reported, never silently lost.
      expect(checkOrSetAlreadyCaught(frozenError)).toBe(false);
    });

    // Pins our marker to the Sentry SDK internal it piggybacks on. If an SDK
    // upgrade renames `__sentry_captured__` this fails, which is the signal to
    // revisit `markErrorAsCaptured`. Without the pin, a rename would silently
    // start reporting errors we intend to suppress.
    it('marks errors with the property the SDK itself checks', () => {
      const testError = markErrorAsCaptured(new Error('Test error'));

      // `checkOrSetAlreadyCaught` is what `Client.captureException` and
      // `Client.captureEvent` call to drop repeat captures of one object.
      expect(checkOrSetAlreadyCaught(testError)).toBe(true);
    });

    it('leaves an unmarked error reportable', () => {
      expect(checkOrSetAlreadyCaught(new Error('Test error'))).toBe(false);
    });
  });
});
