import { cloneDeep } from 'lodash';
import {
  GOERLI,
  GOERLI_CHAIN_ID,
  KOVAN,
  KOVAN_CHAIN_ID,
  MAINNET,
  MAINNET_CHAIN_ID,
  NETWORK_TYPE_RPC,
  RINKEBY,
  RINKEBY_CHAIN_ID,
  ROPSTEN,
  ROPSTEN_CHAIN_ID,
} from '../../../shared/constants/network';

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
    const {
      accountTokens,
      accountHiddenTokens,
      frequentRpcListDetail,
    } = state.PreferencesController;

    const newAccountTokens = {};
    const newAccountHiddenTokens = {};

    if (accountTokens && Object.keys(accountTokens).length > 0) {
      for (const address of Object.keys(accountTokens)) {
        newAccountTokens[address] = {};
        if (accountTokens[address][NETWORK_TYPE_RPC]) {
          frequentRpcListDetail.forEach((detail) => {
            newAccountTokens[address][detail.chainId] =
              accountTokens[address][NETWORK_TYPE_RPC];
          });
        }
        for (const providerType of Object.keys(accountTokens[address])) {
          switch (providerType) {
            case MAINNET:
              newAccountTokens[address][MAINNET_CHAIN_ID] =
                accountTokens[address][MAINNET];
              break;
            case ROPSTEN:
              newAccountTokens[address][ROPSTEN_CHAIN_ID] =
                accountTokens[address][ROPSTEN];
              break;
            case RINKEBY:
              newAccountTokens[address][RINKEBY_CHAIN_ID] =
                accountTokens[address][RINKEBY];
              break;
            case GOERLI:
              newAccountTokens[address][GOERLI_CHAIN_ID] =
                accountTokens[address][GOERLI];
              break;
            case KOVAN:
              newAccountTokens[address][KOVAN_CHAIN_ID] =
                accountTokens[address][KOVAN];
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
        if (accountHiddenTokens[address][NETWORK_TYPE_RPC]) {
          frequentRpcListDetail.forEach((detail) => {
            newAccountHiddenTokens[address][detail.chainId] =
              accountHiddenTokens[address][NETWORK_TYPE_RPC];
          });
        }
        for (const providerType of Object.keys(accountHiddenTokens[address])) {
          switch (providerType) {
            case MAINNET:
              newAccountHiddenTokens[address][MAINNET_CHAIN_ID] =
                accountHiddenTokens[address][MAINNET];
              break;
            case ROPSTEN:
              newAccountHiddenTokens[address][ROPSTEN_CHAIN_ID] =
                accountHiddenTokens[address][ROPSTEN];
              break;
            case RINKEBY:
              newAccountHiddenTokens[address][RINKEBY_CHAIN_ID] =
                accountHiddenTokens[address][RINKEBY];
              break;
            case GOERLI:
              newAccountHiddenTokens[address][GOERLI_CHAIN_ID] =
                accountHiddenTokens[address][GOERLI];
              break;
            case KOVAN:
              newAccountHiddenTokens[address][KOVAN_CHAIN_ID] =
                accountHiddenTokens[address][KOVAN];
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
