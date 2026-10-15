import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 3;
const oldTestRpc = 'https://rawtestrpc.metamask.io/';
const newTestRpc = 'https://testrpc.metamask.io/';

type LegacyState = MigrationState['data'] & {
  config: {
    provider: {
      rpcTarget?: string;
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
      if (state.config.provider.rpcTarget === oldTestRpc) {
        state.config.provider.rpcTarget = newTestRpc;
      }
    } catch (_) {
      // empty
    }
    return Promise.resolve(versionedData);
  },
} satisfies LegacyMigration;
