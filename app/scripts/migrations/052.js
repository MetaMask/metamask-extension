import { cloneDeep } from 'lodash';
import { CHAIN_IDS, NETWORK_TYPES } from '../../../shared/constants/network';

const version = 52;

/**
 * Migrate tokens in Preferences to be keyed by chainId instead of
 * providerType. To prevent breaking user's MetaMask and selected
 * tokens, this migration copies the RPC entry into *every* custom RPC
 * chainId.
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

function transformState(state = {}) {
  if (state.PreferencesController) {
    const { accountTokens, accountHiddenTokens, frequentRpcListDetail } =
      state.PreferencesController;

    const newAccountTokens = {};
    const newAccountHiddenTokens = {};

    if (accountTokens && Object.keys(accountTokens).length > 0) {
      for (const address of Object.keys(accountTokens)) {
        newAccountTokens[address] = {};
        if (accountTokens[address][NETWORK_TYPES.RPC]) {
          frequentRpcListDetail.forEach((detail) => {
            newAccountTokens[address][detail.chainId] =
              accountTokens[address][NETWORK_TYPES.RPC];
          });
        }
        for (const providerType of Object.keys(accountTokens[address])) {
          switch (providerType) {
            case NETWORK_TYPES.MAINNET:
              newAccountTokens[address][CHAIN_IDS.MAINNET] =
                accountTokens[address][NETWORK_TYPES.MAINNET];
              break;
            case NETWORK_TYPES.ROPSTEN:
              newAccountTokens[address][CHAIN_IDS.ROPSTEN] =
                accountTokens[address][NETWORK_TYPES.ROPSTEN];
              break;
            case NETWORK_TYPES.RINKEBY:
              newAccountTokens[address][CHAIN_IDS.RINKEBY] =
                accountTokens[address][NETWORK_TYPES.RINKEBY];
              break;
            case NETWORK_TYPES.GOERLI:
              newAccountTokens[address][CHAIN_IDS.GOERLI] =
                accountTokens[address][NETWORK_TYPES.GOERLI];
              break;
            case NETWORK_TYPES.KOVAN:
              newAccountTokens[address][CHAIN_IDS.KOVAN] =
                accountTokens[address][NETWORK_TYPES.KOVAN];
              break;
            default:
              break;
          }
        }
      }
      state.PreferencesController.accountTokens = newAccountTokens;
    }

    if (accountHiddenTokens && Object.keys(accountHiddenTokens).length > 0) {
      for (const address of Object.keys(accountHiddenTokens)) {
        newAccountHiddenTokens[address] = {};
        if (accountHiddenTokens[address][NETWORK_TYPES.RPC]) {
          frequentRpcListDetail.forEach((detail) => {
            newAccountHiddenTokens[address][detail.chainId] =
              accountHiddenTokens[address][NETWORK_TYPES.RPC];
          });
        }
        for (const providerType of Object.keys(accountHiddenTokens[address])) {
          switch (providerType) {
            case NETWORK_TYPES.MAINNET:
              newAccountHiddenTokens[address][CHAIN_IDS.MAINNET] =
                accountHiddenTokens[address][NETWORK_TYPES.MAINNET];
              break;
            case NETWORK_TYPES.ROPSTEN:
              newAccountHiddenTokens[address][CHAIN_IDS.ROPSTEN] =
                accountHiddenTokens[address][NETWORK_TYPES.ROPSTEN];
              break;
            case NETWORK_TYPES.RINKEBY:
              newAccountHiddenTokens[address][CHAIN_IDS.RINKEBY] =
                accountHiddenTokens[address][NETWORK_TYPES.RINKEBY];
              break;
            case NETWORK_TYPES.GOERLI:
              newAccountHiddenTokens[address][CHAIN_IDS.GOERLI] =
                accountHiddenTokens[address][NETWORK_TYPES.GOERLI];
              break;
            case NETWORK_TYPES.KOVAN:
              newAccountHiddenTokens[address][CHAIN_IDS.KOVAN] =
                accountHiddenTokens[address][NETWORK_TYPES.KOVAN];
              break;
            default:
              break;
          }
        }
      }
      state.PreferencesController.accountHiddenTokens = newAccountHiddenTokens;
    }
  }
  return state;
}
