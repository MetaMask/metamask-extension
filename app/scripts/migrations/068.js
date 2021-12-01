import { cloneDeep } from 'lodash';

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
      `${addUrlProtocolPrefix(oldIpfsGateWay)}/ipfs/`,
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
          ipfsGateway: 'https://cloudflare-ipfs.com/ipfs/',
        },
      },
    };
  }

  return newState;
}
