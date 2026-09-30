import { cloneDeep } from 'lodash';
import { BUILT_IN_NETWORKS } from '../../../shared/constants/network';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 51;

type LegacyNetworkProvider = {
  chainId?: string;
  type?: string;
  [key: string]: unknown;
};

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'NetworkController',
      { provider?: LegacyNetworkProvider; [key: string]: unknown }
    >
  >;

/**
 * Set the chainId in the Network Controller provider data for all infura networks
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    versionedData.data = transformState(state);
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState): LegacyState {
  const { chainId, type } = state?.NetworkController?.provider || {};
  const networkType = type as keyof typeof BUILT_IN_NETWORKS | undefined;
  const enumChainId =
    networkType === undefined
      ? undefined
      : BUILT_IN_NETWORKS[networkType]?.chainId;

  if (
    enumChainId &&
    chainId !== enumChainId &&
    state.NetworkController?.provider
  ) {
    state.NetworkController.provider.chainId = enumChainId;
  }
  return state;
}
