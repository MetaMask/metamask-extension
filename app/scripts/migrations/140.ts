import { KeyringControllerState } from '@metamask/keyring-controller';
import { hasProperty } from '@metamask/utils';
import { monotonicFactory } from 'ulid';
import { cloneDeep, isObject } from 'lodash';
import { AccountsControllerState } from '@metamask/accounts-controller';

export type VersionedData = {
  meta: {
    version: number;
  };
  data: {
    KeyringController?: KeyringControllerState;
    AccountsController?: AccountsControllerState;
  };
};

export const version = 140;
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

  // The vault with the keyrings is currently locked. We can use the number of keyring types to infer the number of keyringsMetadata to create
  const { KeyringController, AccountsController } = state;

  let numberOfKeyringMetadataToCreate = 0;

  if (
    isObject(AccountsController) &&
    hasProperty(AccountsController, 'internalAccounts') &&
    hasProperty(
      AccountsController.internalAccounts as AccountsControllerState['internalAccounts'],
      'accounts',
    )
  ) {
    numberOfKeyringMetadataToCreate = Object.values(
      AccountsController.internalAccounts.accounts,
    ).length;
  }

  if (KeyringController && Array.isArray(KeyringController.keyrings)) {
    if (!Array.isArray(KeyringController.keyringsMetadata)) {
      KeyringController.keyringsMetadata = [];
    }

    const newKeyringsMetadata = Array.from(
      { length: numberOfKeyringMetadataToCreate },
      () => ({
        id: ulid(),
        name: '',
      }),
    );

    KeyringController.keyringsMetadata = newKeyringsMetadata;
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
