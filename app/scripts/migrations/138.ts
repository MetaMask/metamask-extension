import { KeyringControllerState } from '@metamask/keyring-controller';
import { hasProperty } from '@metamask/utils';
import { monotonicFactory } from 'ulid';
import { cloneDeep } from 'lodash';

export type VersionedData = {
  meta: {
    version: number;
  };
  data: {
    KeyringController?: KeyringControllerState;
  };
};

export const version = 138;
const ulid = monotonicFactory();

function transformState(state: VersionedData['data']) {
  if (!hasProperty(state, 'KeyringController')) {
    global.sentry?.captureException?.(
      new Error(
        `Invalid KeyringController state: ${typeof state.KeyringController}`,
      ),
    );
    return state;
  }

  const { KeyringController } = state;

  if (
    KeyringController &&
    (!Array.isArray(KeyringController.keyringsMetadata) ||
      (Array.isArray(KeyringController.keyringsMetadata) &&
        KeyringController.keyringsMetadata.length === 0))
  ) {
    const newKeyringsMetadata = KeyringController.keyrings.map((kr) => {
      return {
        id: ulid(),
        name: kr.type,
      };
    });

    KeyringController.keyringsMetadata = newKeyringsMetadata;
    return state;
  }

  return state;
}

/**
 * This migration sets isAccountSyncingReadyToBeDispatched to true if completedOnboarding is true
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}
