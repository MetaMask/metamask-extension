// next version number
/*

removes invalid chaids from preferences and networkController for custom rpcs

*/

import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 30;

type FrequentRpcListEntry = {
  chainId?: string;
  nickname?: string;
  rpcUrl?: string;
  ticker?: string;
};

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'PreferencesController',
      { frequentRpcListDetail?: FrequentRpcListEntry[] }
    >
  > &
  Partial<
    Record<
      'NetworkController',
      {
        network?: string;
        provider?: {
          chainId?: string;
          nickname?: string;
          rpcTarget?: string;
          ticker?: string;
          type?: string;
        };
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
  const preferencesController = state.PreferencesController;
  if (preferencesController) {
    const { frequentRpcListDetail } = preferencesController;
    if (frequentRpcListDetail) {
      frequentRpcListDetail.forEach((rpc, index) => {
        if (
          rpc.chainId !== undefined &&
          rpc.chainId !== '' &&
          // eslint-disable-next-line radix
          Number.isNaN(parseInt(rpc.chainId))
        ) {
          delete frequentRpcListDetail[index].chainId;
        }
      });
      preferencesController.frequentRpcListDetail = frequentRpcListDetail;
    }
  }
  const networkController = state.NetworkController;
  if (networkController) {
    if (
      networkController.network &&
      // eslint-disable-next-line radix
      Number.isNaN(parseInt(networkController.network))
    ) {
      delete networkController.network;
    }

    if (
      networkController.provider &&
      networkController.provider.chainId &&
      // eslint-disable-next-line radix
      Number.isNaN(parseInt(networkController.provider.chainId))
    ) {
      delete networkController.provider.chainId;
    }
  }

  return newState;
}
