import { cloneDeep } from 'lodash';

const version = 81;
/**
 * Adds the `chainId` property to the advancedGasFee.
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
  const PreferencesController = state?.PreferencesController || {};
  const currentAdvancedGasFee = PreferencesController.advancedGasFee;
  const provider = state.NetworkController?.provider || {};
  const currentChainId = provider.chainId;

  const newState = {
    ...state,
    PreferencesController: {
      ...PreferencesController,
      advancedGasFee: {
        [currentChainId]: currentAdvancedGasFee,
      },
    },
  };

  return newState;
}
