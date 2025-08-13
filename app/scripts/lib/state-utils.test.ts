import {
  SecretType,
  SeedlessOnboardingControllerState,
} from '@metamask/seedless-onboarding-controller';
import { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import { KeyringControllerState } from '@metamask/keyring-controller';
import { sanitizeUIState } from './state-utils';

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
