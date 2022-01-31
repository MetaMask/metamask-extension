import { cloneDeep } from 'lodash';

const version = 2;

export default {
  version,

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      if (versionedData.data.config.provider.type === 'etherscan') {
        versionedData.data.config.provider.type = 'rpc';
        versionedData.data.config.provider.rpcTarget =
          'https://rpc.metamask.io/';
      }
    } catch (_) {
      // empty
    }
    return Promise.resolve(versionedData);
  },
};
