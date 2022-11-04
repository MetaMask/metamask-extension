import { cloneDeep } from 'lodash';
import BigNumber from 'bignumber.js';
import { TEST_CHAINS } from '../../../shared/constants/network';

const hexNumberIsGreaterThanZero = (hexNumber) =>
  new BigNumber(hexNumber || '0x0', 16).gt(0);

const version = 67;

/**
 * Sets the showTestNetworks property to true if it was false or undefined, and there is evidence
 * that the user has used a test net
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  const PreferencesController = state?.PreferencesController || {};
  const preferences = PreferencesController.preferences || {};

  if (preferences.showTestNetworks) {
    return state;
  }

  const transactions = state?.TransactionController?.transactions || {};
  const provider = state.NetworkController?.provider || {};
  const cachedBalances = state.CachedBalancesController?.cachedBalances || {};

  const userIsCurrentlyOnATestNet = TEST_CHAINS.includes(provider?.chainId);
  const userHasMadeATestNetTransaction = Object.values(transactions).some(
    ({ chainId }) => TEST_CHAINS.includes(chainId),
  );
  const userHasACachedBalanceOnATestnet = TEST_CHAINS.some((chainId) => {
    const cachedBalancesForChain = Object.values(cachedBalances[chainId] || {});
    const userHasABalanceGreaterThanZeroOnThisChain =
      cachedBalancesForChain.some(hexNumberIsGreaterThanZero);
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
