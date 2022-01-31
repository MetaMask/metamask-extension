import { cloneDeep } from 'lodash';

const version = 4;

export default {
  version,

  migrate(versionedData) {
    const safeVersionedData = cloneDeep(versionedData);
    safeVersionedData.meta.version = version;
    try {
      if (safeVersionedData.data.config.provider.type !== 'rpc') {
        return Promise.resolve(safeVersionedData);
      }
      switch (safeVersionedData.data.config.provider.rpcTarget) {
        case 'https://testrpc.metamask.io/':
          safeVersionedData.data.config.provider = {
            type: 'testnet',
          };
          break;
        case 'https://rpc.metamask.io/':
          safeVersionedData.data.config.provider = {
            type: 'mainnet',
          };
          break;
        // No default
      }
    } catch (_) {
      // empty
    }
    return Promise.resolve(safeVersionedData);
  },
};
