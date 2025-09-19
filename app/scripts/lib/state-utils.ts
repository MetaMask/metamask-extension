import { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import { SeedlessOnboardingControllerState } from '@metamask/seedless-onboarding-controller';
import { SnapControllerState } from '@metamask/snaps-controllers';
import { Snap } from '@metamask/snaps-utils';
import { Patch } from 'immer';
import { cloneDeep } from 'lodash';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FlattenedUIState = Record<string, any>;

/*
 * Top-level state keys to not send to UI.
 * Temporary mechanism pending new state metadata property.
 */
const REMOVE_KEYS = [
  // KeyringController
  'encryptionKey',
  'encryptionSalt',
  'vault',

  // PhishingController
  'c2DomainBlocklistLastFetched',
  'hotlistLastFetched',
  'phishingLists',
  'stalelistLastFetched',
  'whitelist',

  // SeedlessOnboardingController
  'encryptedKeyringEncryptionKey',
  'encryptedSeedlessEncryptionKey',
  'metadataAccessToken',
  'refreshToken',
  'revokeToken',
  'vaultEncryptionKey',
  'vaultEncryptionSalt',

  // SnapController
  'snapStates',
  'unencryptedSnapStates',
];

/*
 * Data to remove from patches.
 * Patches with matching paths will be skipped.
 * Matching data in a patch value will also be removed.
 * Using `true` acts as a wildcard to match any key or index at that level.
 */
const REMOVE_PATHS = [
  ['nodeAuthTokens', true, 'authToken'],
  ['snaps', true, 'auxiliaryFiles'],
  ['snaps', true, 'sourceCode'],
  ['socialBackupsMetadata', true, 'hash'],
  ['srpSessionData', true, 'token', 'accessToken'],
];

export function sanitizePatches(patches: Patch[]): Patch[] {
  return patches.filter((patch) => {
    if (REMOVE_KEYS.includes(patch.path[0] as string)) {
      return false;
    }

    for (const removePath of REMOVE_PATHS) {
      if (deletePathFromPatch(patch, removePath)) {
        return false;
      }
    }

    return true;
  });
}

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
      const token = {
        ...value.token,
      };
      // @ts-expect-error - Intentionally sanitizing a required field.
      delete token.accessToken;
      acc[key] = {
        ...value,
        token,
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
    'accessToken',
    'metadataAccessToken',
    'refreshToken',
    'revokeToken',
  ];
  for (const key of toDelete) {
    delete state[key];
  }

  // Manually sanitize the nodeAuthTokens.
  const nodeAuthTokens =
    state.nodeAuthTokens as SeedlessOnboardingControllerState['nodeAuthTokens'];

  if (nodeAuthTokens) {
    state.nodeAuthTokens = nodeAuthTokens.map((token) => {
      const sanitizedToken = {
        ...token,
      };
      // @ts-expect-error - Intentionally sanitizing a required field.
      delete sanitizedToken.authToken;
      return sanitizedToken;
    });
  }

  // Manually sanitize the socialBackupsMetadata.
  const socialBackupsMetadata =
    state.socialBackupsMetadata as SeedlessOnboardingControllerState['socialBackupsMetadata'];

  if (socialBackupsMetadata) {
    state.socialBackupsMetadata = socialBackupsMetadata.map((backup) => {
      const sanitizedBackup = {
        ...backup,
      };
      // @ts-expect-error - Intentionally sanitizing a required field.
      delete sanitizedBackup.hash;
      return sanitizedBackup;
    });
  }
}

function deletePathFromPatch(patch: Patch, removePath: (string | boolean)[]) {
  for (let i = 0; i < removePath.length; i++) {
    const key = removePath[i];
    const isLastKey = i === removePath.length - 1;
    const isEndOfPatchKey = i === patch.path.length;

    const isMatch =
      patch.path[i] === key || (key === true && patch.path[i] !== undefined);

    if (isMatch && isLastKey) {
      return true;
    }

    if (!isMatch && !isEndOfPatchKey) {
      return false;
    }

    if (!isMatch && isEndOfPatchKey) {
      const remainingPath = removePath.slice(i);

      patch.value = cloneDeep(patch.value);
      deletePathInObject(patch.value, remainingPath);

      return false;
    }
  }

  return false;
}

function deletePathInObject(
  obj: Record<string, JSON>,
  removePath: (string | boolean)[],
  index = 0,
) {
  const key = removePath[index];
  const isLast = index === removePath.length - 1;

  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  if (isLast && (key as string) in obj) {
    delete obj[key as string];
    return;
  }

  const nextObjects = [];

  if (key === true) {
    if (Array.isArray(obj)) {
      nextObjects.push(...obj);
    } else {
      for (const prop in obj) {
        if (typeof obj[prop] === 'object' && obj[prop] !== null) {
          nextObjects.push(obj[prop]);
        }
      }
    }
  } else {
    nextObjects.push(obj[key as string]);
  }

  for (const nextObj of nextObjects) {
    deletePathInObject(nextObj, removePath, index + 1);
  }
}
