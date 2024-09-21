import { cloneDeep } from 'lodash';

const version = 76;

/**
 * Update to `@metamask/controllers@33.0.0` (rename "Collectible" to "NFT").
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
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

  if (state.PreferencesController?.useCollectibleDetection) {
    state.PreferencesController.useNftDetection =
      state.PreferencesController.useCollectibleDetection;
    delete state.PreferencesController.useCollectibleDetection;
  }

  return state;
}
