// next version number
/*

normalizes txParams on unconfirmed txs

*/
import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 28;

type LegacyToken = {
  address: string;
  symbol: string;
  decimals: number;
};

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'PreferencesController',
      {
        tokens?: LegacyToken[];
        identities?: Record<string, unknown>;
        accountTokens?: Record<string, { mainnet: LegacyToken[] }>;
      }
    >
  >;

export default {
  version,

  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState): LegacyState {
  const newState = state;

  if (newState.PreferencesController) {
    if (
      newState.PreferencesController.tokens &&
      newState.PreferencesController.identities
    ) {
      const preferencesController = newState.PreferencesController;
      const { identities } = preferencesController;
      const { tokens } = preferencesController;
      if (!identities) {
        return newState;
      }
      const accountTokensMap: Record<string, { mainnet: LegacyToken[] }> = {};
      preferencesController.accountTokens = accountTokensMap;
      const tokenList = tokens ?? [];
      Object.keys(identities).forEach((identity) => {
        accountTokensMap[identity] = {
          mainnet: tokenList,
        };
      });
      newState.PreferencesController.tokens = [];
    }
  }

  return newState;
}
