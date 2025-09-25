import { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import { SeedlessOnboardingControllerState } from '@metamask/seedless-onboarding-controller';
import { SnapControllerState } from '@metamask/snaps-controllers';
import { Snap } from '@metamask/snaps-utils';
import { Patch } from 'immer';
import { cloneDeep } from 'lodash';
import { Json } from '@metamask/utils';

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
  'accessToken',
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
const REMOVE_PATHS: (string | true)[][] = [
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

/**
 * Ensure that a patch does not contain data with a specific path.
 * This checks both the patch path, plus any matching data in the patch value.
 *
 * @param patch - The patch to check and modify.
 * @param removePath - The path to remove, with `true` as a wildcard for any key or index.
 * @returns Whether the entire patch should be removed.
 */
function deletePathFromPatch(patch: Patch, removePath: (string | true)[]) {
  for (let i = 0; i < removePath.length; i++) {
    const key = removePath[i];
    const isLastKey = i === removePath.length - 1;
    const isLastPatchKey = i === patch.path.length - 1;

    const isMatch =
      patch.path[i] === key || (key === true && patch.path[i] !== undefined);

    // Do not delete patch as paths do not match
    if (!isMatch) {
      return false;
    }

    // Delete patch as paths match
    if (isLastKey) {
      return true;
    }

    // Remove path may be inside the patch value
    // Do not delete patch but mutate it to delete remove path from the value
    if (isLastPatchKey) {
      const remainingPath = removePath.slice(i + 1);
      patch.value = cloneDeep(patch.value);

      deletePathInObject(patch.value, remainingPath);

      return false;
    }

    // Continue iterating until we reach the end of the remove path or the patch path
  }

  return false;
}

/**
 * Delete a specific path from an object.
 * Uses `true` as a wildcard to match any key or index at that level.
 *
 * @param obj - The object to modify.
 * @param removePath - The path to remove.
 * @param index - The current index in the path.
 */
function deletePathInObject(
  obj: Record<string, Json> | Json[],
  removePath: (string | true)[],
  index = 0,
) {
  const key = removePath[index];
  const isLast = index === removePath.length - 1;

  if (isLast && key !== true && key in obj && !Array.isArray(obj)) {
    delete obj[key];
    return;
  }

  if (isLast) {
    return;
  }

  let children: Json[] = [];

  if (key === true) {
    children = Object.values(obj);
  } else if (!Array.isArray(obj)) {
    children = [obj[key]];
  }

  const validChildren = children.filter(isObjectOrArray);

  for (const child of validChildren) {
    deletePathInObject(child, removePath, index + 1);
  }
}

function isObjectOrArray(
  value: unknown,
): value is Record<string, Json> | Json[] {
  return typeof value === 'object' && value !== null && value !== undefined;
}
