import { cloneDeep } from 'lodash';
import { NETWORK_TYPE_TO_ID_MAP } from '../../../shared/constants/network';

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
  const enumChainId = NETWORK_TYPE_TO_ID_MAP[type]?.chainId;

  if (enumChainId && chainId !== enumChainId) {
    state.NetworkController.provider.chainId = enumChainId;
  }
  return state;
}
