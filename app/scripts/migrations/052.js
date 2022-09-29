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
            case 'ropsten':
              newAccountTokens[address]['0x3'] = accountTokens[address].ropsten;
              break;
            case 'rinkeby':
              newAccountTokens[address]['0x4'] = accountTokens[address].rinkeby;
              break;
            case NETWORK_TYPES.GOERLI:
              newAccountTokens[address][CHAIN_IDS.GOERLI] =
                accountTokens[address][NETWORK_TYPES.GOERLI];
              break;
            case 'kovan':
              newAccountTokens[address]['0x2a'] = accountTokens[address].kovan;
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
            case 'ropsten':
              newAccountHiddenTokens[address]['0x3'] =
                accountHiddenTokens[address].ropsten;
              break;
            case 'rinkeby':
              newAccountHiddenTokens[address]['0x4'] =
                accountHiddenTokens[address].rinkeby;
              break;
            case NETWORK_TYPES.GOERLI:
              newAccountHiddenTokens[address][CHAIN_IDS.GOERLI] =
                accountHiddenTokens[address][NETWORK_TYPES.GOERLI];
              break;
            case 'kovan':
              newAccountHiddenTokens[address]['0x2a'] =
                accountHiddenTokens[address].kovan;
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
