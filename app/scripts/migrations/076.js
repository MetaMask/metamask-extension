import { cloneDeep } from 'lodash';

const version = 76;

/**
 * Update to `@metamask/controllers@33.0.0` (rename "Nft" to "NFT").
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
  if (state.NftsController) {
    const { allNftContracts, allNfts, ignoredNfts, ...remainingState } =
      state.NftsController;
    state.NftController = {
      ...(allNftContracts ? { allNftContracts } : {}),
      ...(allNfts ? { allNfts } : {}),
      ...(ignoredNfts ? { ignoredNfts } : {}),
      ...remainingState,
    };
    delete state.NftsController;
  }

  return state;
}
