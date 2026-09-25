/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep } from 'lodash';
import BigNumber from 'bignumber.js';
import { TEST_CHAINS } from '../../../shared/constants/network';

const hexNumberIsGreaterThanZero = (hexNumber: string | null | undefined) =>
  new BigNumber(hexNumber || '0x0', 16).gt(0);

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 67;

/**
 * Sets the showTestNetworks property to true if it was false or undefined, and there is evidence
 * that the user has used a test net
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

export default migration;

function transformState(state: LegacyState) {
  const PreferencesController = state?.PreferencesController || {};
  const preferences = PreferencesController.preferences || {};

  if (preferences.showTestNetworks) {
    return state;
  }

  const transactions = state?.TransactionController?.transactions || {};
  const provider = state.NetworkController?.provider || {};
  const cachedBalances = state.CachedBalancesController?.cachedBalances || {};

  const userIsCurrentlyOnATestNet = TEST_CHAINS.includes(provider?.chainId);
  const userHasMadeATestNetTransaction = Object.values(transactions)
    .filter((transaction) => transaction && typeof transaction === 'object')
    .some((transaction) => TEST_CHAINS.includes(transaction.chainId));
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
