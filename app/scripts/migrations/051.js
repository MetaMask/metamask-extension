import { cloneDeep } from 'lodash';
import { BUILT_IN_NETWORKS } from '../../../shared/constants/network';

const version = 51;

/**
 * Set the chainId in the Network Controller provider data for all infura networks
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

function transformState(state) {
  const { chainId, type } = state?.NetworkController?.provider || {};
  const enumChainId = BUILT_IN_NETWORKS[type]?.chainId;

  if (enumChainId && chainId !== enumChainId) {
    state.NetworkController.provider.chainId = enumChainId;
  }
  return state;
}
