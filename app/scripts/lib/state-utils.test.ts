import {
  SecretType,
  SeedlessOnboardingControllerState,
} from '@metamask/seedless-onboarding-controller';
import { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import { KeyringControllerState } from '@metamask/keyring-controller';
import { Patch } from 'immer';
import { sanitizePatches, sanitizeUIState } from './state-utils';

describe('State Utils', () => {
  describe('sanitizeUIState', () => {
    it('removes unsafe properties', () => {
      const state = {
        test1: 'value1',
        snapStates: true,
        unencryptedSnapStates: true,
        vault: true,
        test2: false,
      };

      const sanitizedState = sanitizeUIState(state);

      expect(sanitizedState).toStrictEqual({
        test1: 'value1',
        test2: false,
      });
    });

    it('strips large properties from snaps state', () => {
      const state = {
        test1: 'value1',
        test2: true,
        snaps: {
          snap1: {
            id: 'snap1',
            test3: 123,
            sourceCode: 'sourceCode1',
            auxiliaryFiles: 'auxiliaryFiles1',
          },
          snap2: {
            id: 'snap2',
            test4: 456,
            sourceCode: 'sourceCode2',
            auxiliaryFiles: 'auxiliaryFiles2',
          },
        },
      };

      const sanitizedState = sanitizeUIState(state);

      expect(sanitizedState).toStrictEqual({
        test1: 'value1',
        test2: true,
        snaps: {
          snap1: {
            id: 'snap1',
            test3: 123,
          },
          snap2: {
            id: 'snap2',
            test4: 456,
          },
        },
      });
    });

    it('sanitizes keyring controller state', () => {
      const state: Partial<KeyringControllerState> = {
        vault: 'vault',
        encryptionKey: 'encryptionKey',
        encryptionSalt: 'encryptionSalt',
      };

      const sanitizedState = sanitizeUIState(state);

      expect(sanitizedState).toStrictEqual({});
    });

    it('sanitizes authentication controller state', () => {
      const state: Partial<AuthenticationControllerState> = {
        srpSessionData: {
          test1: {
            token: {
              accessToken: 'accessToken', // to be sanitized
              expiresIn: 0,
              obtainedAt: 0,
            },
            profile: {
              identifierId: '',
              profileId: '',
              metaMetricsId: '',
            },
          },
        },
      };

      const sanitizedState = sanitizeUIState(state);

      expect(sanitizedState).toStrictEqual({
        srpSessionData: {
          test1: {
            token: {
              expiresIn: 0,
              obtainedAt: 0,
            },
            profile: {
              identifierId: '',
              profileId: '',
              metaMetricsId: '',
            },
          },
        },
      });
    });

    it('sanitizes seedless onboarding controller state', () => {
      const state: Partial<SeedlessOnboardingControllerState> = {
        vault: 'vault',
        vaultEncryptionKey: 'vaultEncryptionKey',
        vaultEncryptionSalt: 'vaultEncryptionSalt',
        encryptedSeedlessEncryptionKey: 'encryptedSeedlessEncryptionKey',
        encryptedKeyringEncryptionKey: 'encryptedKeyringEncryptionKey',
        accessToken: 'accessToken',
        metadataAccessToken: 'metadataAccessToken',
        refreshToken: 'refreshToken',
        revokeToken: 'revokeToken',
        nodeAuthTokens: [
          {
            authToken: 'authToken', // to be sanitized
            nodeIndex: 1,
            nodePubKey: 'nodeUrl',
          },
        ],
        socialBackupsMetadata: [
          {
            hash: 'hash', // to be sanitized
            type: SecretType.Mnemonic,
            keyringId: 'keyringId',
          },
        ],
      };

      const sanitizedState = sanitizeUIState(state);

      expect(sanitizedState).toStrictEqual({
        nodeAuthTokens: [
          {
            nodeIndex: 1,
            nodePubKey: 'nodeUrl',
          },
        ],
        socialBackupsMetadata: [
          {
            type: SecretType.Mnemonic,
            keyringId: 'keyringId',
          },
        ],
      });
    });
  });

  describe('sanitizePatches', () => {
    it('ignores patch if path matches remove key', () => {
      const patches: Patch[] = [
        {
          op: 'replace',
          path: ['snapStates'],
          value: 'value1',
        },
        {
          op: 'replace',
          path: ['phishingLists', 'other'],
          value: 'value2',
        },
        {
          op: 'replace',
          path: ['other'],
          value: 'value3',
        },
      ];

      const sanitizedPatches = sanitizePatches(patches);

      expect(sanitizedPatches).toStrictEqual([
        {
          op: 'replace',
          path: ['other'],
          value: 'value3',
        },
      ]);
    });

    it('removes large snap data if in path', () => {
      const patches: Patch[] = [
        {
          op: 'replace',
          path: ['snaps', 'snap1', 'sourceCode'],
          value: 'value1',
        },
        {
          op: 'replace',
          path: ['snaps', 'snap2', 'otherCode'],
          value: 'value2',
        },
        {
          op: 'replace',
          path: ['snaps', 'snap3', 'auxiliaryFiles'],
          value: 'value3',
        },
      ];

      const sanitizedPatches = sanitizePatches(patches);

      expect(sanitizedPatches).toStrictEqual([
        {
          op: 'replace',
          path: ['snaps', 'snap2', 'otherCode'],
          value: 'value2',
        },
      ]);
    });

    it('removes large snap data if in value', () => {
      const patches: Patch[] = [
        {
          op: 'replace',
          path: ['snaps'],
          value: {
            snap1: { sourceCode: 'value1', otherCode: 'value4' },
            snap2: { otherCode: 'value2' },
            snap3: { auxiliaryFiles: 'value3', otherCode: 'value5' },
          },
        },
      ];

      const sanitizedPatches = sanitizePatches(patches);

      expect(sanitizedPatches).toStrictEqual([
        {
          op: 'replace',
          path: ['snaps'],
          value: {
            snap1: { otherCode: 'value4' },
            snap2: { otherCode: 'value2' },
            snap3: { otherCode: 'value5' },
          },
        },
      ]);
    });

    it('removes auth tokens if in path', () => {
      const patches: Patch[] = [
        {
          op: 'replace',
          path: ['nodeAuthTokens', 0, 'authToken'],
          value: 'value1',
        },
        {
          op: 'replace',
          path: ['nodeAuthTokens', 1, 'otherToken'],
          value: 'value2',
        },
        {
          op: 'replace',
          path: ['nodeAuthTokens', 2, 'authToken'],
          value: 'value3',
        },
      ];

      const sanitizedPatches = sanitizePatches(patches);

      expect(sanitizedPatches).toStrictEqual([
        {
          op: 'replace',
          path: ['nodeAuthTokens', 1, 'otherToken'],
          value: 'value2',
        },
      ]);
    });

    it('removes auth tokens if in value', () => {
      const patches: Patch[] = [
        {
          op: 'replace',
          path: ['nodeAuthTokens'],
          value: {
            0: { authToken: 'value1', otherToken: 'value4' },
            1: { otherToken: 'value2' },
            2: { authToken: 'value3', otherToken: 'value5' },
          },
        },
      ];

      const sanitizedPatches = sanitizePatches(patches);

      expect(sanitizedPatches).toStrictEqual([
        {
          op: 'replace',
          path: ['nodeAuthTokens'],
          value: {
            0: { otherToken: 'value4' },
            1: { otherToken: 'value2' },
            2: { otherToken: 'value5' },
          },
        },
      ]);
    });

    it('removes social hashes if in path', () => {
      const patches: Patch[] = [
        {
          op: 'replace',
          path: ['socialBackupsMetadata', 0, 'hash'],
          value: 'value1',
        },
        {
          op: 'replace',
          path: ['socialBackupsMetadata', 1, 'other'],
          value: 'value2',
        },
        {
          op: 'replace',
          path: ['socialBackupsMetadata', 2, 'hash'],
          value: 'value3',
        },
      ];

      const sanitizedPatches = sanitizePatches(patches);

      expect(sanitizedPatches).toStrictEqual([
        {
          op: 'replace',
          path: ['socialBackupsMetadata', 1, 'other'],
          value: 'value2',
        },
      ]);
    });

    it('removes social hashes if in value', () => {
      const patches: Patch[] = [
        {
          op: 'replace',
          path: ['socialBackupsMetadata'],
          value: {
            0: { hash: 'value1', other: 'value4' },
            1: { other: 'value2' },
            2: { hash: 'value3', other: 'value5' },
          },
        },
      ];

      const sanitizedPatches = sanitizePatches(patches);

      expect(sanitizedPatches).toStrictEqual([
        {
          op: 'replace',
          path: ['socialBackupsMetadata'],
          value: {
            0: { other: 'value4' },
            1: { other: 'value2' },
            2: { other: 'value5' },
          },
        },
      ]);
    });

    it('removes SRP access tokens if in path', () => {
      const patches: Patch[] = [
        {
          op: 'replace',
          path: ['srpSessionData', 'session1', 'token', 'accessToken'],
          value: 'value1',
        },
        {
          op: 'replace',
          path: ['srpSessionData', 'session2', 'token', 'otherToken'],
          value: 'value2',
        },
        {
          op: 'replace',
          path: ['srpSessionData', 'session3', 'token', 'accessToken', 'extra'],
          value: 'value3',
        },
      ];

      const sanitizedPatches = sanitizePatches(patches);

      expect(sanitizedPatches).toStrictEqual([
        {
          op: 'replace',
          path: ['srpSessionData', 'session2', 'token', 'otherToken'],
          value: 'value2',
        },
      ]);
    });

    it('removes SRP access tokens if in value', () => {
      const patches: Patch[] = [
        {
          op: 'replace',
          path: ['srpSessionData'],
          value: {
            session1: {
              token: { accessToken: 'value1', otherToken: 'value4' },
            },
            session2: { token: { otherToken: 'value2' } },
            session3: {
              token: { accessToken: 'value3', otherToken: 'value5' },
            },
          },
        },
      ];

      const sanitizedPatches = sanitizePatches(patches);

      expect(sanitizedPatches).toStrictEqual([
        {
          op: 'replace',
          path: ['srpSessionData'],
          value: {
            session1: { token: { otherToken: 'value4' } },
            session2: { token: { otherToken: 'value2' } },
            session3: { token: { otherToken: 'value5' } },
          },
        },
      ]);
    });
  });
});
