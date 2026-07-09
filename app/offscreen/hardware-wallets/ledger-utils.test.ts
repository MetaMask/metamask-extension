import { TransportStatusError } from '@ledgerhq/errors';
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';

import { serializeError, serializeLedgerError } from './ledger-utils';

describe('ledger-utils', () => {
  describe('serializeError', () => {
    it('serializes a plain Error keeping message and name', () => {
      const error = new Error('boom');
      error.name = 'CustomError';

      expect(serializeError(error)).toEqual({
        message: 'boom',
        name: 'CustomError',
      });
    });

    it('preserves statusCode when present on the source error', () => {
      const error = new Error('transport rejected') as Error & {
        statusCode: number;
      };
      error.statusCode = 0x6985;

      expect(serializeError(error)).toEqual({
        message: 'transport rejected',
        statusCode: 0x6985,
        name: 'Error',
      });
    });

    it('coerces non-Error inputs to a string message', () => {
      expect(serializeError('plain string')).toEqual({
        message: 'plain string',
      });
      expect(serializeError(undefined)).toEqual({ message: 'undefined' });
      expect(serializeError({ foo: 'bar' })).toEqual({
        message: '{"foo":"bar"}',
      });
      expect(serializeError({ message: 'from object' })).toEqual({
        message: 'from object',
      });
    });
  });

  describe('serializeLedgerError', () => {
    describe('Ledger status-code path', () => {
      it('enriches known status codes with structured catalogue fields', () => {
        // 0x6985 -> UserRejected
        const error = new TransportStatusError(0x6985);

        const result = serializeLedgerError(error);

        expect(result.statusCode).toBe(0x6985);
        expect(result.message).toBe('User rejected action on device');
        expect(result.code).toBe(ErrorCode.UserRejected);
        expect(result.severity).toBe(Severity.Warning);
        expect(result.category).toBe(Category.UserAction);
        expect(result.userMessage).toEqual(expect.any(String));
      });

      it('falls back to serializeError for unknown status codes', () => {
        const error = new TransportStatusError(0x6fff);

        const result = serializeLedgerError(error);

        expect(result.statusCode).toBe(0x6fff);
        expect(result.code).toBeUndefined();
        expect(result.severity).toBeUndefined();
      });
    });

    describe('HardwareWalletError path', () => {
      it('preserves structured fields on a thrown HardwareWalletError', () => {
        const error = new HardwareWalletError('device locked', {
          code: ErrorCode.DeviceDisconnected,
          severity: Severity.Err,
          category: Category.Connection,
          userMessage: 'Please reconnect your device.',
        });

        const result = serializeLedgerError(error);

        // Without this branch the receiver would only see {message, name}
        // and would be unable to reconstruct the original error class.
        expect(result).toEqual({
          message: 'device locked',
          name: 'HardwareWalletError',
          code: ErrorCode.DeviceDisconnected,
          severity: Severity.Err,
          category: Category.Connection,
          userMessage: 'Please reconnect your device.',
        });
      });

      it('does not synthesise a statusCode for HardwareWalletError', () => {
        const error = new HardwareWalletError('any', {
          code: ErrorCode.Unknown,
          severity: Severity.Warning,
          category: Category.Unknown,
          userMessage: 'msg',
        });

        expect(serializeLedgerError(error).statusCode).toBeUndefined();
      });
    });

    describe('fallback path', () => {
      it('serializes generic Errors without structured fields', () => {
        const result = serializeLedgerError(new Error('generic'));

        expect(result).toEqual({ message: 'generic', name: 'Error' });
      });

      it('coerces non-Error inputs', () => {
        expect(serializeLedgerError(42)).toEqual({ message: '42' });
      });
    });
  });
});
