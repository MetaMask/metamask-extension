import { cloneDeep } from 'lodash';
import { type AccountOrderControllerState } from '../controllers/account-order';
import { type AccountTreeControllerState } from '@metamask/account-tree-controller';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 182;

/**
 * This migration removes exisitng pinned and hidden state from the AccountTreeController
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
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

function transformState(state: Record<string, unknown>) {
  const accountTreeControllerState = state?.AccountTreeController as
    | AccountTreeControllerState
    | undefined;

  if (accountTreeControllerState) {
    Object.values(accountTreeControllerState.accountGroupsMetadata).forEach(
      (groupMetadata) => {
        delete groupMetadata.pinned;
        delete groupMetadata.hidden;
      },
    );
  }
}
