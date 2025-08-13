import { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import { AccessToken } from '@metamask/profile-sync-controller/sdk';
import { SnapControllerState } from '@metamask/snaps-controllers';
import { Snap } from '@metamask/snaps-utils';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FlattenedUIState = Record<string, any>;

const REMOVE_KEYS = [
  'snapStates',
  'unencryptedSnapStates',
  'phishingLists',
  'whitelist',
  'hotlistLastFetched',
  'stalelistLastFetched',
  'c2DomainBlocklistLastFetched',

  // Keyring controller
  'vault',
  'encryptionKey',
  'encryptionSalt',
];

export function sanitizeUIState(state: FlattenedUIState): FlattenedUIState {
  const newState = { ...state };

  for (const key of REMOVE_KEYS) {
    delete newState[key];
  }

  sanitizeSnapData(newState);
  sanitizeAuthenticationControllerState(newState);
  sanitizeSeedlessOnboardingControllerState(newState);

  return newState;
}

function sanitizeSnapData(state: FlattenedUIState) {
  const snapsData = state.snaps as SnapControllerState['snaps'] | undefined;

  if (!snapsData) {
    return;
  }

  state.snaps = Object.values(snapsData).reduce(
    (acc, snap) => {
      acc[snap.id] = stripLargeSnapData(snap) as Snap;
      return acc;
    },
    {} as SnapControllerState['snaps'],
  );
}

function stripLargeSnapData(snapData: Snap): Partial<Snap> {
  const newData: Partial<Snap> = {
    ...snapData,
  };

  delete newData.sourceCode;
  delete newData.auxiliaryFiles;

  return newData;
}

function sanitizeAuthenticationControllerState(state: FlattenedUIState) {
  const srpSessionData = state.srpSessionData as
    | AuthenticationControllerState['srpSessionData']
    | undefined;

  if (!srpSessionData) {
    return;
  }

  state.srpSessionData = Object.entries(srpSessionData).reduce(
    (acc, [key, value]) => {
      const token: Partial<AccessToken> = {
        ...value.token,
      };
      delete token.accessToken;
      acc[key] = {
        ...value,
        token: token as AccessToken, // Cast ignores missing accessToken field.
      };
      return acc;
    },
    {} as NonNullable<AuthenticationControllerState['srpSessionData']>,
  );
}

function sanitizeSeedlessOnboardingControllerState(state: FlattenedUIState) {
  const toDelete = [
    'vault',
    'vaultEncryptionKey',
    'vaultEncryptionSalt',
    'encryptedSeedlessEncryptionKey',
    'encryptedKeyringEncryptionKey',
    'metadataAccessToken',
    'revokeToken',
  ];
  for (const key of toDelete) {
    delete state[key];
  }

  // Can't delete these because a selector in `social-sync.ts` depends on them.
  const toReplace = [
    { key: 'refreshToken', value: 'redacted' },
    { key: 'accessToken', value: 'redacted' },
    { key: 'nodeAuthTokens', value: [] },
  ];
  for (const { key, value } of toReplace) {
    if (state[key]) {
      state[key] = value;
    }
  }
}
