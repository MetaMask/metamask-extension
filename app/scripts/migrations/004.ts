import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 4;

type LegacyState = MigrationState['data'] & {
  config: {
    provider: {
      rpcTarget?: string;
      type: string;
    };
  };
};

export default {
  version,

  migrate(versionedData) {
    const safeVersionedData = cloneDeep(versionedData);
    safeVersionedData.meta.version = version;
    try {
      const state = safeVersionedData.data as LegacyState;
      if (state.config.provider.type !== 'rpc') {
        return Promise.resolve(safeVersionedData);
      }
      switch (state.config.provider.rpcTarget) {
        case 'https://testrpc.metamask.io/':
          state.config.provider = {
            type: 'testnet',
          };
          break;
        case 'https://rpc.metamask.io/':
          state.config.provider = {
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
} satisfies LegacyMigration;
