import { SessionRequest } from '@metamask/mobile-wallet-protocol-core';
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
  isQrSyncOffer,
  normalizeQrSyncMessage,
  parseJsonMessage,
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
});
