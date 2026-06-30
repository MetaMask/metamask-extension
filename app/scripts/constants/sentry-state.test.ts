import { maskObject } from '../../../shared/lib/object.utils';
import { QR_SYNC_PHASES } from '../../../shared/constants/qr-sync';
import { SENTRY_BACKGROUND_STATE, SENTRY_UI_STATE } from './sentry-state';

describe('sentry-state', () => {
  describe('QrSyncController', () => {
    it('masks sensitive QR sync fields for Sentry', () => {
      const masked = maskObject(
        {
          qrSyncPhase: QR_SYNC_PHASES.DISPLAYING_QR,
          qrSyncConnectionStatus: 'connecting',
          qrSyncSessionId: 'session-abc',
          qrSyncCreatedAt: 1_700_000_000_000,
          qrSyncUpdatedAt: 1_700_000_000_001,
          qrSyncQrPayload: 'metamask://connect/mwp?p=secret',
          syncOffer: {
            sessionId: 'session-abc',
            isOnboardingCompleted: true,
          },
          qrSyncSelectedAccountIds: ['entropy-id'],
          qrSyncImportedAccountIds: ['imported-id'],
          qrSyncError: {
            code: 'OTP_INVALID',
            message: 'Incorrect code',
          },
        },
        SENTRY_BACKGROUND_STATE.QrSyncController,
      );

      expect(masked).toStrictEqual({
        qrSyncPhase: QR_SYNC_PHASES.DISPLAYING_QR,
        qrSyncConnectionStatus: 'connecting',
        qrSyncSessionId: 'string',
        qrSyncCreatedAt: 'number',
        qrSyncUpdatedAt: 'number',
        qrSyncQrPayload: 'string',
        syncOffer: 'object',
        qrSyncSelectedAccountIds: 'object',
        qrSyncImportedAccountIds: 'object',
        qrSyncError: {
          code: 'OTP_INVALID',
          message: 'Incorrect code',
        },
      });
    });
  });

  describe('SENTRY_UI_STATE', () => {
    it('does not include symbol keys in the metamask mask', () => {
      const symbolKeys = Reflect.ownKeys(SENTRY_UI_STATE.metamask).filter(
        (key) => typeof key === 'symbol',
      );

      expect(symbolKeys).toStrictEqual([]);
    });

    it('can mask UI state without throwing', () => {
      const state = {
        appState: {},
        gas: {},
        history: {},
        metamask: {
          anyKey: 'value',
        },
        unconnectedAccount: {},
      };

      expect(() => maskObject(state, SENTRY_UI_STATE)).not.toThrow();
    });
  });
});
