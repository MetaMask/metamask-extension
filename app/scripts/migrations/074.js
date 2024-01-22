import { cloneDeep, uniq } from 'lodash';
import BigNumber from 'bignumber.js';
import { getRpcUrl } from '../../../shared/constants/network';

const version = 74;

const hexNumberIsGreaterThanZero = (hexNumber) =>
  new BigNumber(hexNumber || '0x0', 16).gt(0);

const DEPRECATED_TEST_NET_CHAINIDS = ['0x3', '0x2a', '0x4'];
const DEPRECATED_TEST_NET_DETAILS = {
  '0x3': {
    rpcUrl: getRpcUrl({ network: 'ropsten' }),
    nickname: 'Ropsten',
    ticker: 'RopstenETH',
  },
  '0x2a': {
    rpcUrl: getRpcUrl({ network: 'kovan' }),
    nickname: 'Kovan',
    ticker: 'KovanETH',
  },
  '0x4': {
    rpcUrl: getRpcUrl({ network: 'rinkeby' }),
    nickname: 'Rinkeby',
    ticker: 'RinkebyETH',
  },
};

/**
 * Migrates the user default but deprecated testnet networks to custom networks, and
 * if the current network is one such network, updates the network provider details so that it
 * will work as a custom rpc
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
  const NetworkController = state?.NetworkController || {};
  const provider = NetworkController?.provider || {};

  const currentlyOnDeprecatedNetwork = DEPRECATED_TEST_NET_CHAINIDS.filter(
    (chainId) => chainId === provider?.chainId,
  );

  // If the user does not want to see test networks, and if the user is not on a deprecated test network, then
  // no need to migrate the test network data to a custom network
  if (
    !preferences.showTestNetworks &&
    currentlyOnDeprecatedNetwork.length === 0
  ) {
    return state;
  }

  const transactions = state?.TransactionController?.transactions || {};
  const cachedBalances = state.CachedBalancesController?.cachedBalances || {};

  const deprecatedTestnetsOnWhichTheUserHasMadeATransaction = Object.values(
    transactions,
  )
    .filter(({ chainId }) => DEPRECATED_TEST_NET_CHAINIDS.includes(chainId))
    .map(({ chainId }) => chainId);
  const deprecatedTestnetsOnWhichTheUserHasCachedBalance =
    DEPRECATED_TEST_NET_CHAINIDS.filter((chainId) => {
      const cachedBalancesForChain = Object.values(
        cachedBalances[chainId] || {},
      );
      const userHasABalanceGreaterThanZeroOnThisChain =
        cachedBalancesForChain.some(hexNumberIsGreaterThanZero);
      return userHasABalanceGreaterThanZeroOnThisChain;
    });
  const deprecatedTestnetsThatHaveBeenUsed = uniq([
    ...deprecatedTestnetsOnWhichTheUserHasCachedBalance,
    ...deprecatedTestnetsOnWhichTheUserHasMadeATransaction,
    ...currentlyOnDeprecatedNetwork,
  ]);

  const newFrequentRpcListDetail =
    PreferencesController.frequentRpcListDetail ?? [];

  deprecatedTestnetsThatHaveBeenUsed.forEach((chainId) => {
    if (
      !newFrequentRpcListDetail.find(
        (rpcDetails) => rpcDetails.chainId === chainId,
      )
    ) {
      newFrequentRpcListDetail.unshift({
        rpcUrl: DEPRECATED_TEST_NET_DETAILS[chainId].rpcUrl,
        chainId,
        ticker: DEPRECATED_TEST_NET_DETAILS[chainId].ticker,
        nickname: DEPRECATED_TEST_NET_DETAILS[chainId].nickname,
        rpcPrefs: {},
      });
    }
  });

  if (newFrequentRpcListDetail.length) {
    PreferencesController.frequentRpcListDetail = newFrequentRpcListDetail;
  }

  if (currentlyOnDeprecatedNetwork.length) {
    const selectedNetworkChainId = currentlyOnDeprecatedNetwork[0];
    NetworkController.provider = {
      ...NetworkController.provider,
      type: 'rpc',
      rpcUrl: DEPRECATED_TEST_NET_DETAILS[selectedNetworkChainId].rpcUrl,
      chainId: selectedNetworkChainId,
      nickname: DEPRECATED_TEST_NET_DETAILS[selectedNetworkChainId].nickname,
      ticker: DEPRECATED_TEST_NET_DETAILS[selectedNetworkChainId].ticker,
    };
  }

  return {
    ...state,
    PreferencesController: {
      ...PreferencesController,
    },
    NetworkController: {
      ...NetworkController,
    },
  };
}
