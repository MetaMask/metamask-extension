import { maskObject } from '../../../shared/lib/object.utils';
import { SENTRY_UI_STATE } from './sentry-state';

describe('sentry-state', () => {
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

    it('exposes recovery signals without exposing Seedless secrets', () => {
      const state = {
        metamask: {
          passwordChangePhase: 'KEY_SYNC_PENDING',
          passwordOutdatedCache: {
            isExpiredPwd: true,
            timestamp: 123,
          },
          encryptedKeyringEncryptionKey: 'encrypted-key',
          vault: 'vault',
          decryptedBackupData: {
            secret: 'secret',
          },
        },
      };

      expect(maskObject(state, SENTRY_UI_STATE)).toStrictEqual({
        metamask: {
          passwordChangePhase: 'KEY_SYNC_PENDING',
          passwordOutdatedCache: {
            isExpiredPwd: true,
            timestamp: 'number',
          },
          encryptedKeyringEncryptionKey: 'string',
          vault: 'string',
          decryptedBackupData: 'object',
        },
      });
    });
  });
});
