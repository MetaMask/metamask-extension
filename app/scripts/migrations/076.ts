/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep } from 'lodash';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 76;

/**
 * Update to `@metamask/controllers@33.0.0` (rename "Collectible" to "NFT").
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

export default migration;

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
    };
    delete state.CollectiblesController;
  }

  if (state.PreferencesController?.useCollectibleDetection !== undefined) {
    state.PreferencesController.useNftDetection =
      state.PreferencesController.useCollectibleDetection;
    delete state.PreferencesController.useCollectibleDetection;
  }

  return state;
}
