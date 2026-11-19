import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 2;

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

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data as LegacyState;
      if (state.config.provider.type === 'etherscan') {
        state.config.provider.type = 'rpc';
        state.config.provider.rpcTarget = 'https://rpc.metamask.io/';
      }
    } catch (_) {
      // empty
    }
    return Promise.resolve(versionedData);
  },
} satisfies LegacyMigration;
