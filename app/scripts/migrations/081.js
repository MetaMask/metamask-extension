import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';

const version = 81;

/**
 * Migrate the frequentRpcListDetail from the PreferencesController to the NetworkController, convert it from an array to an object
 * keyed by random uuids, and update property `nickname` to `chainName`.
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
  const { PreferencesController, NetworkController } = state || {};

  if (!PreferencesController?.frequentRpcListDetail) {
    return state;
  }

  const { frequentRpcListDetail = [] } = PreferencesController || {};

  const networkConfigurations = {};
  frequentRpcListDetail.forEach((rpcDetail) => {
    const networkConfigurationId = v4();
    if (networkConfigurations[networkConfigurationId] === undefined) {
      networkConfigurations[networkConfigurationId] = {};
    }
    networkConfigurations[networkConfigurationId] = {
      ...rpcDetail,
      chainName: rpcDetail.nickname,
    };

    delete networkConfigurations[networkConfigurationId]?.nickname;
  });

  if (PreferencesController?.frequentRpcListDetail) {
    delete PreferencesController.frequentRpcListDetail;
  }

  return {
    ...state,
    NetworkController: {
      ...NetworkController,
      networkConfigurations,
    },
    PreferencesController: {
      ...PreferencesController,
    },
  };
}
