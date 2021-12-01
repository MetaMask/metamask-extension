import { cloneDeep } from 'lodash';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../shared/constants/network';

const version = 68;

function addUrlProtocolPrefix(urlString) {
  if (!urlString.match(/(^http:\/\/)|(^https:\/\/)/u)) {
    return `https://${urlString}`;
  }
  return urlString;
}

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
  const preferences = PreferencesController.preferences || {};
  const oldIpfsGateWay = preferences.ipfsGateway;

  let newState;

  if (oldIpfsGateWay && oldIpfsGateWay !== 'dweb.link') {
    const newIpfsGateway = new URL(
      addUrlProtocolPrefix(oldIpfsGateWay),
    ).toString();
    newState = {
      ...state,
      PreferencesController: {
        ...PreferencesController,
        preferences: {
          ...preferences,
          ipfsGateway: newIpfsGateway,
        },
      },
    };
  } else {
    newState = {
      ...state,
      PreferencesController: {
        ...PreferencesController,
        preferences: {
          ...preferences,
          ipfsGateway: IPFS_DEFAULT_GATEWAY_URL,
        },
      },
    };
  }

  return newState;
}
