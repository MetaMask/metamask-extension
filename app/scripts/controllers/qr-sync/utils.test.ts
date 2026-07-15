import {
  ErrorCode as MwpCoreErrorCode,
  SessionError as MwpCoreSessionError,
  SessionRequest,
} from '@metamask/mobile-wallet-protocol-core';
import {
  QR_SYNC_PHASES,
  QrSyncErrorCodes,
} from '../../../../shared/constants/qr-sync';
import { QrSyncActionTypes, QrSyncErrorMessages } from './constants';
import {
  assertQrSyncPhase,
  createInitSyncSessionMessage,
  generateQrCode,
  getSyncCompletionFailureError,
  getSyncCompletionTimeoutMs,
  getSyncOfferFailureError,
  canAcceptSyncOffer,
  isQrExpiredError,
  isQrSyncOffer,
  MWP_REQUEST_EXPIRED_CODE,
  normalizeQrSyncMessage,
  parseJsonMessage,
  parseSessionError,
  resolveQrSyncErrorCode,
} from './utils';
import { QrSyncOffer } from './types';

const TEST_SESSION_REQUEST: SessionRequest = {
  id: 'session-abc',
  expiresAt: 1_700_000_000_000,
  mode: 'untrusted',
  channel: 'websocket',
  publicKeyB64: 'public-key-b64',
};

describe('qr-sync utils', () => {
  describe('createInitSyncSessionMessage', () => {
    it('returns the init-sync-session payload', () => {
      expect(createInitSyncSessionMessage()).toStrictEqual({
        type: QrSyncActionTypes.INIT_SYNC_SESSION,
        version: '1.0.0',
      });
    });
  });

  describe('generateQrCode', () => {
    it('encodes the session request into a metamask MWP QR payload', () => {
      const qrPayload = generateQrCode(TEST_SESSION_REQUEST);

      expect(qrPayload).toMatch(
        /^metamask:\/\/connect\/mwp\?p=[A-Za-z0-9%+/=_-]*$/u,
      );

      const base64Payload = new URL(qrPayload).searchParams.get('p');
      const decoded = JSON.parse(
        Buffer.from(base64Payload ?? '', 'base64').toString('utf8'),
      );
      expect(decoded).toStrictEqual(TEST_SESSION_REQUEST);
    });

    it('percent-encodes base64 characters that are unsafe in query parameters', () => {
      const sessionRequest: SessionRequest = {
        id: '>sess',
        expiresAt: 1,
        mode: 'untrusted',
        channel: 'websocket',
        publicKeyB64: 'pk',
      };
      const qrPayload = generateQrCode(sessionRequest);

      expect(qrPayload).toContain('%3D');

      const decoded = JSON.parse(
        Buffer.from(
          new URL(qrPayload).searchParams.get('p') ?? '',
          'base64',
        ).toString('utf8'),
      );
      expect(decoded).toStrictEqual(sessionRequest);
    });
  });

  describe('parseJsonMessage', () => {
    it('returns non-string values unchanged', () => {
      const message = { type: QrSyncActionTypes.SYNC_OFFER };
      expect(parseJsonMessage(message)).toBe(message);
    });

    it('parses valid JSON strings', () => {
      expect(parseJsonMessage('{"type":"sync-offer"}')).toStrictEqual({
        type: QrSyncActionTypes.SYNC_OFFER,
      });
    });

    it('returns null for invalid JSON strings', () => {
      expect(parseJsonMessage('{invalid')).toBeNull();
    });
  });

  describe('normalizeQrSyncMessage', () => {
    it('normalizes a valid message object', () => {
      expect(
        normalizeQrSyncMessage({
          type: QrSyncActionTypes.SYNC_COMPLETED,
          version: '1.0.0',
        }),
      ).toStrictEqual({
        type: QrSyncActionTypes.SYNC_COMPLETED,
        version: '1.0.0',
      });
    });

    it('normalizes a valid JSON string message', () => {
      expect(
        normalizeQrSyncMessage(
          JSON.stringify({
            type: QrSyncActionTypes.SYNC_CANCEL,
            version: '1.0.0',
          }),
        ),
      ).toStrictEqual({
        type: QrSyncActionTypes.SYNC_CANCEL,
        version: '1.0.0',
      });
    });

    it('returns null when the message has no type', () => {
      expect(normalizeQrSyncMessage({ version: '1.0.0' })).toBeNull();
    });

    it('returns null for invalid JSON strings', () => {
      expect(normalizeQrSyncMessage('{invalid')).toBeNull();
    });
  });

  describe('isQrSyncOffer', () => {
    it('returns true for valid QrSyncOffer objects', () => {
      const mockQrSyncOffer: QrSyncOffer = {
        sessionId: 'session-abc',
        isOnboardingCompleted: true,
      };
      expect(isQrSyncOffer(mockQrSyncOffer)).toBe(true);
      expect(
        isQrSyncOffer({ ...mockQrSyncOffer, isOnboardingCompleted: false }),
      ).toBe(true);
    });

    it('returns false for offers missing isOnboardingCompleted', () => {
      expect(isQrSyncOffer({ sessionId: 'session-abc' })).toBe(false);
    });

    it('returns false for offers missing sessionId', () => {
      expect(isQrSyncOffer({ isOnboardingCompleted: true })).toBe(false);
    });

    it('returns false for non-object payloads', () => {
      expect(isQrSyncOffer(null)).toBe(false);
      expect(isQrSyncOffer('isOnboardingCompleted')).toBe(false);
    });
  });

  describe('isQrExpiredError', () => {
    it('returns true when the error code is REQUEST_EXPIRED', () => {
      const error = Object.assign(
        new Error('Did not receive handshake offer from wallet in time.'),
        { code: MWP_REQUEST_EXPIRED_CODE },
      );
      expect(isQrExpiredError(error)).toBe(true);
    });

    it('returns true when the error name is REQUEST_EXPIRED', () => {
      const error = new Error(
        'Did not receive handshake offer from wallet in time.',
      );
      error.name = MWP_REQUEST_EXPIRED_CODE;
      expect(isQrExpiredError(error)).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      expect(isQrExpiredError(new Error('Relay error'))).toBe(false);
      expect(isQrExpiredError({ code: 'SESSION_EXPIRED' })).toBe(false);
    });

    it('returns false for non-object values', () => {
      expect(isQrExpiredError(null)).toBe(false);
      expect(isQrExpiredError('REQUEST_EXPIRED')).toBe(false);
    });
  });

  describe('resolveQrSyncErrorCode', () => {
    it('resolves REQUEST_EXPIRED errors to QR_EXPIRED', () => {
      const error = Object.assign(
        new Error('Did not receive handshake offer from wallet in time.'),
        { code: MWP_REQUEST_EXPIRED_CODE },
      );
      expect(resolveQrSyncErrorCode(error, QrSyncErrorCodes.QR_EXPIRED)).toBe(
        QrSyncErrorCodes.QR_EXPIRED,
      );
    });

    it('falls back to the default code when no detector matches', () => {
      expect(
        resolveQrSyncErrorCode(
          new Error('Relay error'),
          QrSyncErrorCodes.UNKNOWN,
        ),
      ).toBe(QrSyncErrorCodes.UNKNOWN);
    });

    it('falls back to the default code for non-error values', () => {
      expect(resolveQrSyncErrorCode(undefined, QrSyncErrorCodes.UNKNOWN)).toBe(
        QrSyncErrorCodes.UNKNOWN,
      );
    });
  });

  describe('canAcceptSyncOffer', () => {
    it('returns true when the extension can accept a sync offer', () => {
      expect(
        canAcceptSyncOffer({
          hasDappClient: true,
          connectionStatus: 'connected',
          phase: QR_SYNC_PHASES.AWAITING_SYNC_OFFER,
        }),
      ).toBe(true);
    });

    it('returns false when the dapp client is unavailable', () => {
      expect(
        canAcceptSyncOffer({
          hasDappClient: false,
          connectionStatus: 'connected',
          phase: QR_SYNC_PHASES.AWAITING_SYNC_OFFER,
        }),
      ).toBe(false);
    });

    it('returns false when the dapp client is not connected', () => {
      expect(
        canAcceptSyncOffer({
          hasDappClient: true,
          connectionStatus: 'connecting',
          phase: QR_SYNC_PHASES.AWAITING_SYNC_OFFER,
        }),
      ).toBe(false);
    });

    it('returns false when the flow is not awaiting a sync offer', () => {
      expect(
        canAcceptSyncOffer({
          hasDappClient: true,
          connectionStatus: 'connected',
          phase: QR_SYNC_PHASES.AWAITING_OTP_INPUT,
        }),
      ).toBe(false);
    });
  });

  describe('assertQrSyncPhase', () => {
    it('allows actions in an expected phase', () => {
      expect(() => {
        assertQrSyncPhase(QR_SYNC_PHASES.AWAITING_OTP_INPUT, [
          QR_SYNC_PHASES.AWAITING_OTP_INPUT,
        ]);
      }).not.toThrow();
    });

    it('throws when the current phase is not allowed', () => {
      expect(() => {
        assertQrSyncPhase(QR_SYNC_PHASES.IDLE, [
          QR_SYNC_PHASES.AWAITING_OTP_INPUT,
        ]);
      }).toThrow(
        'QrSyncController action invalid in phase "idle". Expected one of: awaiting-otp-input',
      );
    });
  });

  describe('getSyncCompletionTimeoutMs', () => {
    it('uses the remaining time until the deadline', () => {
      jest.useFakeTimers();
      try {
        jest.setSystemTime(1_000);
        expect(getSyncCompletionTimeoutMs(6_000, 60_000)).toBe(5_000);
      } finally {
        jest.useRealTimers();
      }
    });

    it('falls back when the deadline has already passed', () => {
      jest.useFakeTimers();
      try {
        jest.setSystemTime(10_000);
        expect(getSyncCompletionTimeoutMs(5_000, 60_000)).toBe(60_000);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('getSyncOfferFailureError', () => {
    it('maps sync offer timeouts to SESSION_EXPIRED', () => {
      expect(
        getSyncOfferFailureError(
          new Error(QrSyncErrorMessages.SYNC_OFFER_TIMED_OUT),
        ),
      ).toStrictEqual({
        code: QrSyncErrorCodes.SESSION_EXPIRED,
        message: QrSyncErrorMessages.SYNC_OFFER_TIMED_OUT,
      });
    });

    it('maps other failures to SYNC_FAILED', () => {
      expect(getSyncOfferFailureError(new Error('Relay error'))).toStrictEqual({
        code: QrSyncErrorCodes.SYNC_FAILED,
        message: 'Relay error',
      });
    });
  });

  describe('getSyncCompletionFailureError', () => {
    it('maps sync completion timeouts to SESSION_EXPIRED', () => {
      expect(
        getSyncCompletionFailureError(
          new Error(QrSyncErrorMessages.SYNC_COMPLETION_TIMED_OUT),
        ),
      ).toStrictEqual({
        code: QrSyncErrorCodes.SESSION_EXPIRED,
        message: QrSyncErrorMessages.SYNC_COMPLETION_TIMED_OUT,
      });
    });

    it('maps other failures to SYNC_FAILED', () => {
      expect(
        getSyncCompletionFailureError(new Error('Mobile error')),
      ).toStrictEqual({
        code: QrSyncErrorCodes.SYNC_FAILED,
        message: 'Mobile error',
      });
    });
  });

  describe('parseSessionError', () => {
    it('returns the default unknown error for non-session errors', () => {
      expect(parseSessionError(new Error('Relay unavailable'))).toStrictEqual({
        code: QrSyncErrorCodes.UNKNOWN,
        message: QrSyncErrorMessages.UNKNOWN,
      });
    });

    it('returns the default unknown error for non-error values', () => {
      expect(parseSessionError(undefined)).toStrictEqual({
        code: QrSyncErrorCodes.UNKNOWN,
        message: QrSyncErrorMessages.UNKNOWN,
      });
    });

    it('maps OTP_MAX_ATTEMPTS_REACHED to OTP_ATTEMPTS_EXCEEDED', () => {
      const error = new MwpCoreSessionError(
        MwpCoreErrorCode.OTP_MAX_ATTEMPTS_REACHED,
        'Too many attempts.',
      );

      expect(parseSessionError(error)).toStrictEqual({
        code: QrSyncErrorCodes.OTP_ATTEMPTS_EXCEEDED,
        message: 'Too many attempts.',
      });
    });

    it('maps OTP_ENTRY_TIMEOUT to OTP_EXPIRED', () => {
      const error = new MwpCoreSessionError(
        MwpCoreErrorCode.OTP_ENTRY_TIMEOUT,
        'OTP entry timed out.',
      );

      expect(parseSessionError(error)).toStrictEqual({
        code: QrSyncErrorCodes.OTP_EXPIRED,
        message: 'OTP entry timed out.',
      });
    });

    it('maps OTP_INCORRECT to OTP_INVALID', () => {
      const error = new MwpCoreSessionError(
        MwpCoreErrorCode.OTP_INCORRECT,
        'Incorrect code',
      );

      expect(parseSessionError(error)).toStrictEqual({
        code: QrSyncErrorCodes.OTP_INVALID,
        message: 'Incorrect code',
      });
    });

    it('maps REQUEST_EXPIRED to QR_EXPIRED', () => {
      const error = new MwpCoreSessionError(
        MwpCoreErrorCode.REQUEST_EXPIRED,
        'Did not receive handshake offer from wallet in time.',
      );

      expect(parseSessionError(error)).toStrictEqual({
        code: QrSyncErrorCodes.QR_EXPIRED,
        message: 'Did not receive handshake offer from wallet in time.',
      });
    });

    it('maps SESSION_EXPIRED to SESSION_EXPIRED', () => {
      const error = new MwpCoreSessionError(
        MwpCoreErrorCode.SESSION_EXPIRED,
        'Session expired.',
      );

      expect(parseSessionError(error)).toStrictEqual({
        code: QrSyncErrorCodes.SESSION_EXPIRED,
        message: 'Session expired.',
      });
    });

    it('maps TRANSPORT_DISCONNECTED to CHANNEL_DISCONNECTED', () => {
      const error = new MwpCoreSessionError(
        MwpCoreErrorCode.TRANSPORT_DISCONNECTED,
        'Transport disconnected.',
      );

      expect(parseSessionError(error)).toStrictEqual({
        code: QrSyncErrorCodes.CHANNEL_DISCONNECTED,
        message: 'Transport disconnected.',
      });
    });

    it('keeps the unknown code for unmapped session error codes', () => {
      const error = new MwpCoreSessionError(
        MwpCoreErrorCode.UNKNOWN,
        'Something went wrong.',
      );

      expect(parseSessionError(error)).toStrictEqual({
        code: QrSyncErrorCodes.UNKNOWN,
        message: 'Something went wrong.',
      });
    });
  });
});
