import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type {
  LegacyNftController,
  LegacyState,
} from './legacy-migration-utils';
const version = 76;

/**
 * Update to `@metamask/controllers@33.0.0` (rename "Collectible" to "NFT").
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState) {
  if (state.CollectiblesController) {
    const {
      allCollectibleContracts,
      allCollectibles,
      ignoredCollectibles,
      ...remainingState
    } = state.CollectiblesController;
    state.NftController = {
      ...(allCollectibleContracts
        ? { allNftContracts: allCollectibleContracts }
        : {}),
      ...(allCollectibles ? { allNfts: allCollectibles } : {}),
      ...(ignoredCollectibles ? { ignoredNfts: ignoredCollectibles } : {}),
      ...remainingState,
    } as LegacyNftController;
    delete state.CollectiblesController;
  }

  if (state.PreferencesController?.useCollectibleDetection !== undefined) {
    state.PreferencesController.useNftDetection =
      state.PreferencesController.useCollectibleDetection;
    delete state.PreferencesController.useCollectibleDetection;
  }

  return state;
}
