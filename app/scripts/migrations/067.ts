import { cloneDeep } from 'lodash';
import BigNumber from 'bignumber.js';
import { TEST_CHAINS } from '../../../shared/constants/network';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState, LegacyTransaction } from './legacy-migration-utils';
const hexNumberIsGreaterThanZero = (hexNumber: string | null | undefined) =>
  new BigNumber(hexNumber || '0x0', 16).gt(0);

const version = 67;

/**
 * Sets the showTestNetworks property to true if it was false or undefined, and there is evidence
 * that the user has used a test net
 */
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

function transformState(state: LegacyState) {
  const PreferencesController = state?.PreferencesController || {};
  const preferences = PreferencesController.preferences || {};

  if (preferences.showTestNetworks) {
    return state;
  }

  const transactions = state?.TransactionController?.transactions || {};
  const provider = state.NetworkController?.provider || {};
  const cachedBalances = state.CachedBalancesController?.cachedBalances || {};

  const chainId = provider.chainId;
  const userIsCurrentlyOnATestNet =
    typeof chainId === 'string' &&
    TEST_CHAINS.includes(chainId as (typeof TEST_CHAINS)[number]);
  const userHasMadeATestNetTransaction = Object.values(
    transactions as Record<string, LegacyTransaction>,
  )
    .filter((transaction) => transaction && typeof transaction === 'object')
    .some(
      (transaction) =>
        typeof transaction.chainId === 'string' &&
        TEST_CHAINS.includes(
          transaction.chainId as (typeof TEST_CHAINS)[number],
        ),
    );
  const userHasACachedBalanceOnATestnet = TEST_CHAINS.some((chainId) => {
    const cachedBalancesForChain = Object.values(cachedBalances[chainId] || {});
    const userHasABalanceGreaterThanZeroOnThisChain =
      cachedBalancesForChain.some((hexNumber) =>
        hexNumberIsGreaterThanZero(hexNumber as string | null | undefined),
      );
    return userHasABalanceGreaterThanZeroOnThisChain;
  });
  const userHasUsedATestnet =
    userIsCurrentlyOnATestNet ||
    userHasMadeATestNetTransaction ||
    userHasACachedBalanceOnATestnet;

  const newState = {
    ...state,
    PreferencesController: {
      ...PreferencesController,
      preferences: {
        ...preferences,
        showTestNetworks: userHasUsedATestnet,
      },
    },
  };

  return newState;
}
