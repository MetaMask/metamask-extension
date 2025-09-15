import { toUnicode } from 'punycode/punycode.js';
import { SubjectType } from '@metamask/permission-controller';
import { ApprovalType } from '@metamask/controller-utils';
import {
  stripSnapPrefix,
  getLocalizedSnapManifest,
  SnapStatus,
} from '@metamask/snaps-utils';
import { memoize } from 'lodash';
import semver from 'semver';
import { createSelector } from 'reselect';
import { NameType } from '@metamask/name-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
import { isEvmAccountType } from '@metamask/keyring-api';
import { RpcEndpointType } from '@metamask/network-controller';
import {
  SnapEndowments,
  WALLET_SNAP_PERMISSION_KEY,
} from '@metamask/snaps-rpc-methods';
import {
  Caip25EndowmentPermissionName,
  getEthAccounts,
  getPermittedEthChainIds,
  getAllScopesFromPermission,
  getCaipAccountIdsFromCaip25CaveatValue,
  getCaip25CaveatFromPermission,
} from '@metamask/chain-agnostic-permission';
import { KeyringTypes } from '@metamask/keyring-controller';
import { selectBridgeFeatureFlags } from '@metamask/bridge-controller';
import {
  KnownCaipNamespace,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import {
  getCurrentChainId,
  getProviderConfig,
  getSelectedNetworkClientId,
  getNetworkConfigurationsByChainId,
} from '../../shared/modules/selectors/networks';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { addHexPrefix, getEnvironmentType } from '../../app/scripts/lib/util';
import {
  TEST_CHAINS,
  MAINNET_DISPLAY_NAME,
  BSC_DISPLAY_NAME,
  POLYGON_DISPLAY_NAME,
  AVALANCHE_DISPLAY_NAME,
  CHAIN_ID_TO_RPC_URL_MAP,
  CHAIN_IDS,
  NETWORK_TYPES,
  SEPOLIA_DISPLAY_NAME,
  GOERLI_DISPLAY_NAME,
  LINEA_GOERLI_DISPLAY_NAME,
  LINEA_MAINNET_DISPLAY_NAME,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  ARBITRUM_DISPLAY_NAME,
  OPTIMISM_DISPLAY_NAME,
  BASE_DISPLAY_NAME,
  ZK_SYNC_ERA_DISPLAY_NAME,
  CHAIN_ID_TOKEN_IMAGE_MAP,
  LINEA_SEPOLIA_DISPLAY_NAME,
  CRONOS_DISPLAY_NAME,
  CELO_DISPLAY_NAME,
  GNOSIS_DISPLAY_NAME,
  FANTOM_DISPLAY_NAME,
  POLYGON_ZKEVM_DISPLAY_NAME,
  MOONBEAM_DISPLAY_NAME,
  MOONRIVER_DISPLAY_NAME,
  TEST_NETWORK_IDS,
  FEATURED_NETWORK_CHAIN_IDS,
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  NETWORK_TO_NAME_MAP,
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION,
} from '../../shared/constants/network';
import {
  WebHIDConnectedStatuses,
  LedgerTransportTypes,
  HardwareTransportStates,
} from '../../shared/constants/hardware-wallets';
import { KeyringType } from '../../shared/constants/keyring';

import { TRUNCATED_NAME_CHAR_LIMIT } from '../../shared/constants/labels';

import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  ALLOWED_PROD_SWAPS_CHAIN_IDS,
  ALLOWED_DEV_SWAPS_CHAIN_IDS,
} from '../../shared/constants/swaps';

import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../shared/constants/bridge';
import { AssetType } from '../../shared/constants/transaction';

import {
  shortenAddress,
  getAccountByAddress,
  getURLHostName,
  sortSelectedInternalAccounts,
} from '../helpers/utils/util';

import { TEMPLATED_CONFIRMATION_APPROVAL_TYPES } from '../pages/confirmations/confirmation/templates';
import { STATIC_MAINNET_TOKEN_LIST } from '../../shared/constants/tokens';
import { DAY } from '../../shared/constants/time';
import { TERMS_OF_USE_LAST_UPDATED } from '../../shared/constants/terms';
import {
  getConversionRate,
  isNotEIP1559Network,
  isEIP1559Network,
  getLedgerTransportType,
  isAddressLedger,
  getIsUnlocked,
  getCompletedOnboarding,
} from '../ducks/metamask/metamask';
import {
  getLedgerWebHidConnectedStatus,
  getLedgerTransportStatus,
} from '../ducks/app/app';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import {
  getValueFromWeiHex,
  hexToDecimal,
} from '../../shared/modules/conversion.utils';
import { BackgroundColor } from '../helpers/constants/design-system';
import { ENVIRONMENT_TYPE_POPUP } from '../../shared/constants/app';
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../shared/constants/multichain/assets';
import { hasTransactionData } from '../../shared/modules/transaction.utils';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { isSnapIgnoredInProd } from '../helpers/utils/snaps';
import {
  getAllUnapprovedTransactions,
  getCurrentNetworkTransactions,
  getUnapprovedTransactions,
} from './transactions';
// eslint-disable-next-line import/order
import { getSelectedInternalAccount, getInternalAccounts } from './accounts';
import {
  getMultichainBalances,
  getMultichainNetworkProviders,
  getMultichainNetwork,
} from './multichain';
import {
  getSelectedMultichainNetworkChainId,
  getIsEvmMultichainNetworkSelected,
} from './multichain/networks';
import { getRemoteFeatureFlags } from './remote-feature-flags';
import { getApprovalRequestsByType } from './approvals';

export const isGlobalNetworkSelectorRemoved = process.env.REMOVE_GNS;

/** `appState` slice selectors */

export const getConfirmationExchangeRates = (state) => {
  return state.appState.confirmationExchangeRates;
};

export function getAppIsLoading(state) {
  return state.appState.isLoading;
}

export function getNftIsStillFetchingIndication(state) {
  return state.appState.isNftStillFetchingIndication;
}

export function getSendInputCurrencySwitched({ appState }) {
  return appState.sendInputCurrencySwitched;
}

export function getCustomNonceValue(state) {
  return String(state.appState.customNonceValue);
}

export function getNextSuggestedNonce(state) {
  return Number(state.appState.nextNonce);
}

export function getShowWhatsNewPopup(state) {
  return state.appState.showWhatsNewPopup;
}

export function getShowPermittedNetworkToastOpen(state) {
  return state.appState.showPermittedNetworkToastOpen;
}

export function getNewNftAddedMessage(state) {
  return state.appState.newNftAddedMessage;
}

export function getRemoveNftMessage(state) {
  return state.appState.removeNftMessage;
}

/**
 * To retrieve the name of the new Network added using add network form
 *
 * @param {*} state
 * @returns string
 */
export function getNewNetworkAdded(state) {
  return state.appState.newNetworkAddedName;
}

/**
 * @param state
 * @returns {{ chainId: import('@metamask/utils').Hex; nickname: string; editCompleted: boolean} | undefined}
 */
export function getEditedNetwork(state) {
  return state.appState.editedNetwork;
}

export function getIsAddingNewNetwork(state) {
  return state.appState.isAddingNewNetwork;
}

export function getIsAccessedFromDappConnectedSitePopover(state) {
  return state.appState.isAccessedFromDappConnectedSitePopover;
}

export function getIsMultiRpcOnboarding(state) {
  return state.appState.isMultiRpcOnboarding;
}

export function getNetworksTabSelectedNetworkConfigurationId(state) {
  return state.appState.selectedNetworkConfigurationId;
}

/**
 * To fetch the name of the tokens that are imported from tokens found page
 *
 * @param {*} state
 * @returns
 */
export function getNewTokensImported(state) {
  return state.appState.newTokensImported;
}

export function getNewTokensImportedError(state) {
  return state.appState.newTokensImportedError;
}

export function getCustomTokenAmount(state) {
  return state.appState.customTokenAmount;
}

export function getOnboardedInThisUISession(state) {
  return state.appState.onboardedInThisUISession;
}

export function getShowBasicFunctionalityModal(state) {
  return state.appState.showBasicFunctionalityModal;
}

export function getExternalServicesOnboardingToggleState(state) {
  return state.appState.externalServicesOnboardingToggleState;
}

export function getShowDeleteMetaMetricsDataModal(state) {
  return state.appState.showDeleteMetaMetricsDataModal;
}

export function getShowDataDeletionErrorModal(state) {
  return state.appState.showDataDeletionErrorModal;
}

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
export function getKeyringSnapRemovalResult(state) {
  return state.appState.keyringRemovalSnapModal;
}
///: END:ONLY_INCLUDE_IF

export const getPendingTokens = (state) => state.appState.pendingTokens;

export function getShowConnectionsRemovedModal(state) {
  return state.appState.showConnectionsRemovedModal;
}

/** `metamask` slice selectors */

export function getNetworkIdentifier(state) {
  const { type, nickname, rpcUrl } = getProviderConfig(state);

  return nickname || rpcUrl || type;
}

export function getMetaMetricsId(state) {
  const { metaMetricsId } = state.metamask;
  return metaMetricsId;
}

export function isCurrentProviderCustom(state) {
  const provider = getProviderConfig(state);
  return (
    provider.type === NETWORK_TYPES.RPC &&
    !Object.values(CHAIN_IDS).includes(provider.chainId)
  );
}

export function getActiveQrCodeScanRequest(state) {
  return state.metamask.activeQrCodeScanRequest;
}

export function getIsSigningQRHardwareTransaction(state) {
  const activeQrCodeScanRequest = getActiveQrCodeScanRequest(state);
  return (
    activeQrCodeScanRequest &&
    activeQrCodeScanRequest.type === QrScanRequestType.SIGN
  );
}

export function getCurrentKeyring(state) {
  const internalAccount = getSelectedInternalAccount(state);

  if (!internalAccount) {
    return null;
  }

  return internalAccount.metadata?.keyring;
}

/**
 * The function returns true if network and account details are fetched and
 * both of them support EIP-1559.
 *
 * @param state
 * @param [networkClientId] - The optional network client ID to check network and account for EIP-1559 support
 */
export function checkNetworkAndAccountSupports1559(state, networkClientId) {
  const networkSupports1559 = isEIP1559Network(state, networkClientId);
  return networkSupports1559;
}

/**
 * The function returns true if network and account details are fetched and
 * either of them do not support EIP-1559.
 *
 * @param state
 */
export function checkNetworkOrAccountNotSupports1559(state) {
  const networkNotSupports1559 = isNotEIP1559Network(state);
  return networkNotSupports1559;
}

/**
 * Checks if the current wallet is a hardware wallet.
 *
 * @param {object} state
 * @returns {boolean}
 */
export function isHardwareWallet(state) {
  const keyring = getCurrentKeyring(state);
  return Boolean(keyring?.type?.includes('Hardware'));
}

/**
 * Checks if the account supports smart transactions.
 *
 * @param {object} state - The state object.
 * @returns {boolean}
 */
export function accountSupportsSmartTx(state) {
  const accountType = getAccountType(state);
  return Boolean(accountType !== 'snap');
}

/**
 * Get a HW wallet type, e.g. "Ledger Hardware"
 *
 * @param {object} state
 * @returns {string | undefined}
 */
export function getHardwareWalletType(state) {
  const keyring = getCurrentKeyring(state);
  return isHardwareWallet(state) ? keyring.type : undefined;
}

export function getAccountType(state) {
  const currentKeyring = getCurrentKeyring(state);
  return getAccountTypeForKeyring(currentKeyring);
}

export function getAccountTypeForKeyring(keyring) {
  if (!keyring) {
    return '';
  }

  const { type } = keyring;

  switch (type) {
    case KeyringType.trezor:
    case KeyringType.oneKey:
    case KeyringType.ledger:
    case KeyringType.lattice:
    case KeyringType.qr:
      return 'hardware';
    case KeyringType.imported:
      return 'imported';
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    case KeyringType.snap:
      return 'snap';
    ///: END:ONLY_INCLUDE_IF
    default:
      return 'default';
  }
}

/**
 * Get MetaMask accounts, including account name and balance.
 */
export const getMetaMaskAccounts = createDeepEqualSelector(
  getInternalAccounts,
  getMetaMaskAccountBalances,
  getMetaMaskCachedBalances,
  getMultichainBalances,
  getMultichainNetworkProviders,
  getCurrentChainId,
  (_, chainId) => chainId,
  (
    internalAccounts,
    balances,
    cachedBalances,
    multichainBalances,
    multichainNetworkProviders,
    currentChainId,
    chainId,
  ) =>
    Object.values(internalAccounts).reduce((accounts, internalAccount) => {
      // TODO: mix in the identity state here as well, consolidating this
      // selector with `accountsWithSendEtherInfoSelector`
      let account = internalAccount;

      if (chainId === undefined || currentChainId === chainId) {
        // TODO: `AccountTracker` balances are in hex and `MultichainBalance` are in number.
        // We should consolidate the format to either hex or number
        if (isEvmAccountType(internalAccount.type)) {
          if (balances?.[internalAccount.address]) {
            account = {
              ...account,
              ...balances[internalAccount.address],
            };
          }
        } else {
          const multichainNetwork = multichainNetworkProviders.find((network) =>
            network.isAddressCompatible(internalAccount.address),
          );
          account = {
            ...account,
            balance:
              multichainBalances?.[internalAccount.id]?.[
                MULTICHAIN_NETWORK_TO_ASSET_TYPES[multichainNetwork.chainId]
              ]?.amount ?? '0',
          };
        }

        if (account.balance === null || account.balance === undefined) {
          account = {
            ...account,
            balance:
              (cachedBalances && cachedBalances[internalAccount.address]) ??
              '0x0',
          };
        }
      } else {
        account = {
          ...account,
          balance:
            (cachedBalances && cachedBalances[internalAccount.address]) ??
            '0x0',
        };
      }

      return {
        ...accounts,
        [internalAccount.address]: account,
      };
    }, {}),
);
/**
 * Returns the address of the selected InternalAccount from the Metamask state.
 *
 * @param state - The Metamask state object.
 * @returns {string} The selected address.
 */
export function getSelectedAddress(state) {
  return getSelectedInternalAccount(state)?.address;
}

export const getInternalAccountByAddress = createSelector(
  (state) => state.metamask.internalAccounts.accounts,
  (_, address) => address,
  (accounts, address) => {
    return Object.values(accounts).find((account) =>
      isEqualCaseInsensitive(account.address, address),
    );
  },
);

export function getMaybeSelectedInternalAccount(state) {
  // Same as `getSelectedInternalAccount`, but might potentially be `undefined`:
  // - This might happen during the onboarding
  const accountId = state.metamask.internalAccounts?.selectedAccount;
  return accountId
    ? state.metamask.internalAccounts?.accounts[accountId]
    : undefined;
}

export function checkIfMethodIsEnabled(state, methodName) {
  const internalAccount = getSelectedInternalAccount(state);
  return Boolean(internalAccount.methods.includes(methodName));
}

export function getSelectedInternalAccountWithBalance(state) {
  const selectedAccount = getSelectedInternalAccount(state);
  const rawAccount = getMetaMaskAccountBalances(state)[selectedAccount.address];

  const selectedAccountWithBalance = {
    ...selectedAccount,
    balance: rawAccount ? rawAccount.balance : '0x0',
  };

  return selectedAccountWithBalance;
}

export function getInternalAccount(state, accountId) {
  return state.metamask.internalAccounts.accounts[accountId];
}

export const getEvmInternalAccounts = createSelector(
  getInternalAccounts,
  (accounts) => {
    return accounts.filter((account) => isEvmAccountType(account.type));
  },
);

export const getSelectedEvmInternalAccount = createSelector(
  getEvmInternalAccounts,
  (accounts) => {
    // We should always have 1 EVM account (if not, it would be `undefined`, same
    // as `getSelectedInternalAccount` selector.
    const [evmAccountSelected] = sortSelectedInternalAccounts(accounts);
    return evmAccountSelected;
  },
);

/**
 * Returns an array of internal accounts sorted by keyring.
 *
 * @param keyrings - The array of keyrings.
 * @param accounts - The object containing the accounts.
 * @returns The array of internal accounts sorted by keyring.
 */
export const getInternalAccountsSortedByKeyring = createDeepEqualSelector(
  getMetaMaskKeyrings,
  getMetaMaskAccounts,
  (keyrings, accounts) => {
    const thirdPartySnaps = 'thirdPartySnaps';
    // Create a map of entropySource map to accounts for quick lookup
    const entropySourceToAccountsMap = Object.values(accounts).reduce(
      (map, account) => {
        if (account.metadata?.keyring?.type === KeyringTypes.snap) {
          const { entropySource = thirdPartySnaps } = account.options || {};
          if (!map[entropySource]) {
            map[entropySource] = [];
          }
          map[entropySource].push(account);
        }
        return map;
      },
      {},
    );

    // keep existing keyring order
    return keyrings.reduce((internalAccounts, keyring) => {
      // Get regular accounts for this keyring
      const keyringAccounts = keyring.accounts.map(
        (address) => accounts[address],
      );

      // If it's an HD keyring, add any snap accounts that belong to it
      if (keyring.type === KeyringTypes.hd) {
        const snapAccounts =
          entropySourceToAccountsMap[keyring.metadata.id] || [];
        internalAccounts.push(...keyringAccounts, ...snapAccounts);
        return internalAccounts;
      } else if (keyring.type === KeyringTypes.snap) {
        const thirdpartySnapAccounts =
          entropySourceToAccountsMap[thirdPartySnaps] || [];
        // In a scenario where there are multiple snap keyrings, which isn't the case for today
        // There would be duplicate third party snap accounts that are being pushed into internalAccounts again
        // This will only be run once, when there is only one snap keyring
        const accountsToAdd = thirdpartySnapAccounts.filter(
          (account) =>
            !internalAccounts.some((existing) => existing.id === account.id),
        );

        internalAccounts.push(...accountsToAdd);
        return internalAccounts;
      }
      internalAccounts.push(...keyringAccounts);
      return internalAccounts;
    }, []);
  },
);

export function getNumberOfTokens(state) {
  const { tokens } = state.metamask;
  return tokens ? tokens.length : 0;
}

export function getMetaMaskKeyrings(state) {
  return state.metamask.keyrings;
}

export function getMetaMaskHdKeyrings(state) {
  return state.metamask.keyrings.filter(
    (keyring) => keyring.type === KeyringTypes.hd,
  );
}

export function getHDEntropyIndex(state) {
  const selectedAddress = getSelectedAddress(state);
  const keyrings = getMetaMaskKeyrings(state);
  const hdKeyrings = keyrings.filter(
    (keyring) => keyring.type === KeyringType.hdKeyTree,
  );
  let hdEntropyIndex = hdKeyrings.findIndex((keyring) =>
    keyring.accounts.includes(selectedAddress),
  );
  // if the account is not found in the hd keyring, we should try to get entropySource from the accounts options
  if (hdEntropyIndex === -1) {
    const account = getSelectedInternalAccount(state);
    if (account) {
      const { entropySource } = account.options;
      hdEntropyIndex = keyrings.findIndex(
        ({ metadata }) => metadata.id === entropySource,
      );
    }
  }
  return hdEntropyIndex === -1 ? undefined : hdEntropyIndex;
}

/**
 * Get account balances state.
 *
 * @param {object} state - Redux state
 * @returns {object} A map of account addresses to account objects (which includes the account balance)
 */
export function getMetaMaskAccountBalances(state) {
  const currentChainId = getCurrentChainId(state);
  return state.metamask?.accountsByChainId?.[currentChainId] ?? {};
}

export function getMetaMaskCachedBalances(state, networkChainId) {
  const chainId = networkChainId ?? getCurrentChainId(state);

  if (state.metamask.accountsByChainId?.[chainId]) {
    return Object.entries(state.metamask.accountsByChainId[chainId]).reduce(
      (accumulator, [key, value]) => {
        accumulator[key] = value.balance;
        return accumulator;
      },
      {},
    );
  }
  return {};
}

export function getCrossChainMetaMaskCachedBalances(state) {
  const allAccountsByChainId = state.metamask.accountsByChainId;
  return Object.keys(allAccountsByChainId).reduce((acc, topLevelKey) => {
    acc[topLevelKey] = Object.keys(allAccountsByChainId[topLevelKey]).reduce(
      (innerAcc, innerKey) => {
        innerAcc[innerKey] =
          allAccountsByChainId[topLevelKey][innerKey].balance;
        return innerAcc;
      },
      {},
    );

    return acc;
  }, {});
}

/**
 * Based on the current account address, return the balance for the native token of all chain networks on that account
 *
 * @param {object} state - Redux state
 * @returns {object} An object of tokens with balances for the given account. Data relationship will be chainId => balance
 */
export function getSelectedAccountNativeTokenCachedBalanceByChainId(state) {
  const { accountsByChainId } = state.metamask;
  const { address: selectedAddress } = getSelectedEvmInternalAccount(state);

  const balancesByChainId = {};
  for (const [chainId, accounts] of Object.entries(accountsByChainId || {})) {
    if (accounts[selectedAddress]) {
      balancesByChainId[chainId] = accounts[selectedAddress].balance;
    }
  }
  return balancesByChainId;
}

/**
 * Based on the current account address, query for all tokens across all chain networks on that account,
 * including the native tokens, without hardcoding any native token information.
 *
 * @param {object} state - Redux state
 * @returns {object} An object mapping chain IDs to arrays of tokens (including native tokens) with balances.
 */
export function getSelectedAccountTokensAcrossChains(state) {
  const tokensByChain = {};

  const { address: selectedAddress } =
    getSelectedEvmInternalAccount(state) ?? {};
  if (!selectedAddress) {
    return tokensByChain;
  }

  const { allTokens } = state.metamask;

  const nativeTokenBalancesByChainId =
    getSelectedAccountNativeTokenCachedBalanceByChainId(state);

  const chainIds = new Set([
    ...Object.keys(allTokens || {}),
    ...Object.keys(nativeTokenBalancesByChainId || {}),
  ]);

  chainIds.forEach((chainId) => {
    if (!tokensByChain[chainId]) {
      tokensByChain[chainId] = [];
    }

    if (
      allTokens[chainId] &&
      selectedAddress &&
      selectedAddress in allTokens[chainId] &&
      allTokens[chainId][selectedAddress]
    ) {
      allTokens[chainId][selectedAddress].forEach((token) => {
        const tokenWithChain = { ...token, chainId, isNative: false };
        tokensByChain[chainId].push(tokenWithChain);
      });
    }

    const nativeBalance = nativeTokenBalancesByChainId[chainId];
    if (nativeBalance) {
      const nativeTokenInfo = getNativeTokenInfo(state, chainId);
      tokensByChain[chainId].push({
        ...nativeTokenInfo,
        address: '',
        balance: nativeBalance,
        chainId,
        isNative: true,
      });
    }
  });

  return tokensByChain;
}

/**
 * Get the native token balance for a given account address and chainId
 *
 * @param {object} state - Redux state
 * @param {string} accountAddress - The address of the account
 * @param {string} chainId - The chainId of the account
 */
export const getNativeTokenCachedBalanceByChainIdSelector = createSelector(
  (state) => state,
  (_state, accountAddress) => accountAddress,
  (state, accountAddress) =>
    getNativeTokenCachedBalanceByChainIdByAccountAddress(state, accountAddress),
);

/**
 * Get the tokens across chains for a given account address
 *
 * @param {object} state - Redux state
 * @param {string} accountAddress - The address of the account
 */
export const getTokensAcrossChainsByAccountAddressSelector = createSelector(
  (state) => state,
  (_state, accountAddress) => accountAddress,
  (state, accountAddress) =>
    getTokensAcrossChainsByAccountAddress(state, accountAddress),
);

/**
 * Get the native token balance for a given account address and chainId
 *
 * @param {object} state - Redux state
 * @param {string} selectedAddress - The address of the selected account
 */
export function getNativeTokenCachedBalanceByChainIdByAccountAddress(
  state,
  selectedAddress,
) {
  const { accountsByChainId } = state.metamask;

  const balancesByChainId = {};
  for (const [chainId, accounts] of Object.entries(accountsByChainId || {})) {
    if (accounts[selectedAddress]) {
      balancesByChainId[chainId] = accounts[selectedAddress].balance;
    }
  }
  return balancesByChainId;
}

/**
 * Get the tokens across chains for a given account address
 *
 * @param {object} state - Redux state
 * @param {string} selectedAddress - The address of the selected account
 */
export function getTokensAcrossChainsByAccountAddress(state, selectedAddress) {
  const { allTokens } = state.metamask;

  const tokensByChain = {};

  const nativeTokenBalancesByChainId =
    getNativeTokenCachedBalanceByChainIdByAccountAddress(
      state,
      selectedAddress,
    );

  const chainIds = new Set([
    ...Object.keys(allTokens || {}),
    ...Object.keys(nativeTokenBalancesByChainId || {}),
  ]);

  chainIds.forEach((chainId) => {
    if (!tokensByChain[chainId]) {
      tokensByChain[chainId] = [];
    }

    if (allTokens[chainId]?.[selectedAddress]) {
      allTokens[chainId][selectedAddress].forEach((token) => {
        const tokenWithChain = { ...token, chainId, isNative: false };
        tokensByChain[chainId].push(tokenWithChain);
      });
    }

    const nativeBalance = nativeTokenBalancesByChainId[chainId];
    if (nativeBalance) {
      const nativeTokenInfo = getNativeTokenInfo(state, chainId);
      tokensByChain[chainId].push({
        ...nativeTokenInfo,
        address: '',
        balance: nativeBalance,
        chainId,
        isNative: true,
        image: getNativeCurrencyForChain(chainId),
      });
    }
  });
  return tokensByChain;
}

/**
 * Retrieves native token information (symbol, decimals, name) for a given chainId from the state,
 * without hardcoding any values.
 *
 * @param {object} state - Redux state
 * @param {string} chainId - Chain ID
 * @returns {object} Native token information
 */
export function getNativeTokenInfo(state, chainId) {
  const { networkConfigurationsByChainId } = state.metamask;

  const networkConfig = networkConfigurationsByChainId?.[chainId];

  // Fill native token info by network config (if a user has a network added)
  if (networkConfig) {
    const symbol = networkConfig.nativeCurrency || AssetType.native;
    const decimals = 18;
    const name = networkConfig.name || 'Native Token';

    return {
      symbol,
      decimals,
      name,
    };
  }

  // Fill native token info by DApp provider
  const { provider } = state.metamask;
  if (provider?.chainId === chainId) {
    const symbol = provider.ticker || AssetType.native;
    const decimals = provider.nativeCurrency?.decimals || 18;
    const name = provider.nickname || 'Native Token';

    return {
      symbol,
      decimals,
      name,
    };
  }

  // Attempt to retried native token info from hardcoded known networks
  const hardcodedSymbol = CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[chainId];
  const hardcodedName = NETWORK_TO_NAME_MAP[chainId];
  if (hardcodedSymbol && hardcodedName) {
    return { symbol: hardcodedSymbol, decimals: 18, name: hardcodedName };
  }

  // Fallback to "NATIVE" symbol as this is an unknown native token
  return { symbol: AssetType.native, decimals: 18, name: 'Native Token' };
}

/**
 *  @typedef {import('./selectors.types').InternalAccountWithBalance} InternalAccountWithBalance
 */

/**
 * Get ordered (by keyrings) accounts with InternalAccount and balance
 *
 * @returns {InternalAccountWithBalance} An array of internal accounts with balance
 */
export const getMetaMaskAccountsOrdered = createDeepEqualSelector(
  getInternalAccountsSortedByKeyring,
  getMetaMaskAccounts,
  (internalAccounts, accounts) => {
    return internalAccounts.map((internalAccount) => ({
      ...internalAccount,
      ...accounts[internalAccount.address],
    }));
  },
);

export const getMetaMaskAccountsConnected = createSelector(
  getMetaMaskAccountsOrdered,
  (connectedAccounts) =>
    connectedAccounts.map(({ address }) => address.toLowerCase()),
);

export function isBalanceCached(state) {
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const selectedAccountBalance =
    getMetaMaskAccountBalances(state)?.[selectedAddress]?.balance;
  const cachedBalance = getSelectedAccountCachedBalance(state);

  return Boolean(!selectedAccountBalance && cachedBalance);
}

export function getSelectedAccountCachedBalance(state) {
  const cachedBalances = getMetaMaskCachedBalances(state);
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  return cachedBalances?.[selectedAddress];
}

export function getAllTokens(state) {
  return state.metamask.allTokens;
}

/**
 * Get a flattened list of all ERC-20 tokens owned by the user.
 * Includes all tokens from all chains and accounts.
 *
 * @returns {object[]} All ERC-20 tokens owned by the user in a flat array.
 */
export const selectAllTokensFlat = createSelector(
  getAllTokens,
  (tokensByAccountByChain) => {
    const tokensByAccountArray = Object.values(tokensByAccountByChain);

    return tokensByAccountArray.reduce((acc, tokensByAccount) => {
      const tokensArray = Object.values(tokensByAccount);
      return acc.concat(...tokensArray);
    }, []);
  },
);

/**
 * Selector to return an origin to network ID map
 *
 * @param state - Redux state object.
 * @returns Object - Installed Snaps.
 */
export function getAllDomains(state) {
  return state.metamask.domains;
}

export const getSelectedAccount = createDeepEqualSelector(
  getMetaMaskAccounts,
  getSelectedInternalAccount,
  (accounts, selectedAccount) => {
    // At the time of onboarding there is no selected account
    if (selectedAccount) {
      return {
        ...selectedAccount,
        ...accounts[selectedAccount.address],
      };
    }
    return undefined;
  },
);

export const getWatchedToken = (transactionMeta) =>
  createSelector(
    [getSelectedAccount, getAllTokens],
    (selectedAccount, detectedTokens) => {
      const { chainId } = transactionMeta;

      const selectedToken = detectedTokens?.[chainId]?.[
        selectedAccount.address
      ]?.find(
        (token) =>
          toChecksumHexAddress(token.address) ===
          toChecksumHexAddress(transactionMeta.txParams.to),
      );

      return selectedToken;
    },
  );

export function getTargetAccount(state, targetAddress) {
  const accounts = getMetaMaskAccounts(state);
  return accounts[targetAddress];
}

export const getTokenExchangeRates = createSelector(
  (state) => getCurrentChainId(state),
  (state) => state.metamask.marketData,
  (chainId, marketData) => {
    const contractMarketData = marketData?.[chainId] ?? {};
    return Object.entries(contractMarketData).reduce(
      (acc, [address, tokenData]) => {
        acc[address] = tokenData?.price ?? null;
        return acc;
      },
      {},
    );
  },
);

export const getCrossChainTokenExchangeRates = (state) => {
  const contractMarketData = state.metamask.marketData ?? {};

  return Object.keys(contractMarketData).reduce((acc, topLevelKey) => {
    acc[topLevelKey] = Object.keys(contractMarketData[topLevelKey]).reduce(
      (innerAcc, innerKey) => {
        innerAcc[innerKey] = contractMarketData[topLevelKey][innerKey]?.price;
        return innerAcc;
      },
      {},
    );

    return acc;
  }, {});
};

/**
 * Get market data for tokens on the current chain
 *
 * @param state
 * @returns {Record<Hex, import('@metamask/assets-controllers').MarketDataDetails>}
 */
export const getTokensMarketData = (state) => {
  const chainId = getCurrentChainId(state);
  return state.metamask.marketData?.[chainId];
};

export const getMarketData = (state) => {
  return state.metamask.marketData;
};

export function getAddressBook(state) {
  const chainId = getCurrentChainId(state);
  if (!state.metamask.addressBook[chainId]) {
    return [];
  }
  return Object.values(state.metamask.addressBook[chainId]);
}

export function getCompleteAddressBook(state) {
  const addresses = state.metamask.addressBook;
  const addressWithChainId = Object.entries(addresses)
    .filter(([chainId, _]) => chainId !== '*')
    .map(([chainId, addresse]) =>
      Object.values(addresse).map((address) => ({
        ...address,
        chainId,
      })),
    )
    .flat();
  return addressWithChainId;
}

export function getEnsResolutionByAddress(state, address) {
  if (state.metamask.ensResolutionsByAddress[address]) {
    const ensResolution = state.metamask.ensResolutionsByAddress[address];
    // ensResolution is a punycode encoded string hence toUnicode is used to decode it from same package
    const normalizedEnsResolution = toUnicode(ensResolution);
    return normalizedEnsResolution;
  }

  const entry =
    getAddressBookEntry(state, address) ||
    getInternalAccountByAddress(state, address);

  return entry?.name || '';
}

export function getAddressBookEntry(state, address) {
  const addressBook = getCompleteAddressBook(state);
  const entry = addressBook.find((contact) =>
    isEqualCaseInsensitive(contact.address, address),
  );
  return entry;
}

export function getAddressBookEntryOrAccountName(state, address) {
  const entry = getAddressBookEntry(state, address);
  if (entry && entry.name !== '') {
    return entry.name;
  }

  const internalAccount = Object.values(getInternalAccounts(state)).find(
    (account) => isEqualCaseInsensitive(account.address, address),
  );

  return internalAccount?.metadata.name || address;
}

export function getAccountName(accounts, accountAddress) {
  const account = accounts.find((internalAccount) =>
    isEqualCaseInsensitive(internalAccount.address, accountAddress),
  );
  return account && account.metadata.name !== '' ? account.metadata.name : '';
}

export function accountsWithSendEtherInfoSelector(state) {
  const accounts = getMetaMaskAccounts(state);
  const internalAccounts = getInternalAccounts(state);

  const accountsWithSendEtherInfo = Object.values(internalAccounts).map(
    (internalAccount) => {
      return {
        ...internalAccount,
        ...accounts[internalAccount.address],
      };
    },
  );

  return accountsWithSendEtherInfo;
}

export function getAccountsWithLabels(state) {
  return getMetaMaskAccountsOrdered(state).map((account) => {
    const {
      address,
      metadata: { name },
      balance,
    } = account;
    return {
      ...account,
      addressLabel: `${
        name.length < TRUNCATED_NAME_CHAR_LIMIT
          ? name
          : `${name.slice(0, TRUNCATED_NAME_CHAR_LIMIT - 1)}...`
      } (${shortenAddress(address)})`,
      label: name,
      balance,
    };
  });
}

export function getCurrentAccountWithSendEtherInfo(state) {
  const { address: currentAddress } = getSelectedInternalAccount(state);
  const accounts = accountsWithSendEtherInfoSelector(state);

  return getAccountByAddress(accounts, currentAddress);
}

export function getTargetAccountWithSendEtherInfo(state, targetAddress) {
  const accounts = accountsWithSendEtherInfoSelector(state);
  return getAccountByAddress(accounts, targetAddress);
}

export function getCurrentEthBalance(state) {
  return getCurrentAccountWithSendEtherInfo(state)?.balance;
}

export const getNetworkConfigurationIdByChainId = createDeepEqualSelector(
  (state) => state.metamask.networkConfigurationsByChainId,
  (networkConfigurationsByChainId) =>
    Object.entries(networkConfigurationsByChainId).reduce(
      (acc, [_chainId, network]) => {
        const selectedRpcEndpoint =
          network.rpcEndpoints[network.defaultRpcEndpointIndex];
        acc[_chainId] = selectedRpcEndpoint.networkClientId;
        return acc;
      },
      {},
    ),
);

/**
 * @type (state: any, chainId: string) => import('@metamask/network-controller').NetworkConfiguration
 */
export const selectNetworkConfigurationByChainId = createSelector(
  getNetworkConfigurationsByChainId,
  (_state, chainId) => chainId,
  (networkConfigurationsByChainId, chainId) =>
    networkConfigurationsByChainId[chainId],
);

export const selectDefaultRpcEndpointByChainId = createSelector(
  selectNetworkConfigurationByChainId,
  (networkConfiguration) => {
    if (!networkConfiguration) {
      return undefined;
    }

    const { defaultRpcEndpointIndex, rpcEndpoints } = networkConfiguration;
    return rpcEndpoints[defaultRpcEndpointIndex];
  },
);

/**
 * @type (state: RemoteFeatureFlagsState) => boolean
 */
export const getIsRpcFailoverEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) =>
    remoteFeatureFlags.walletFrameworkRpcFailoverEnabled ?? false,
);

/**
 * @type (state: any, chainId: string) => number | undefined
 */
export const selectConversionRateByChainId = createSelector(
  selectNetworkConfigurationByChainId,
  (state) => state,
  (networkConfiguration, state) => {
    if (!networkConfiguration) {
      return undefined;
    }

    const { nativeCurrency } = networkConfiguration;
    return state.metamask.currencyRates[nativeCurrency]?.conversionRate;
  },
);

export const selectNftsByChainId = createSelector(
  getSelectedInternalAccount,
  (state) => state.metamask.allNfts,
  (_state, chainId) => chainId,
  (selectedAccount, nfts, chainId) => {
    return nfts?.[selectedAccount.address]?.[chainId] ?? [];
  },
);

export const selectNetworkIdentifierByChainId = createSelector(
  selectNetworkConfigurationByChainId,
  selectDefaultRpcEndpointByChainId,
  (networkConfiguration, defaultRpcEndpoint) => {
    const { name: nickname } = networkConfiguration ?? {};
    const { url: rpcUrl, networkClientId } = defaultRpcEndpoint ?? {};

    return nickname || rpcUrl || networkClientId;
  },
);

export function getRequestingNetworkInfo(state, chainIds) {
  // If chainIds is undefined, set it to an empty array
  let processedChainIds = chainIds === undefined ? [] : chainIds;

  // If chainIds is a string, convert it to an array
  if (typeof processedChainIds === 'string') {
    processedChainIds = [processedChainIds];
  }

  // Ensure chainIds is flattened if it contains nested arrays
  const flattenedChainIds = processedChainIds.flat();

  // Filter the networks to include only those with chainId in flattenedChainIds
  return Object.values(getNetworkConfigurationsByChainId(state)).filter(
    (network) => flattenedChainIds.includes(network.chainId),
  );
}

export function getTotalUnapprovedCount(state) {
  return state.metamask.pendingApprovalCount ?? 0;
}

export function getSlides(state) {
  return state.metamask.slides || [];
}

export function getUnapprovedTxCount(state) {
  const unapprovedTxs = getUnapprovedTransactions(state);
  return Object.keys(unapprovedTxs).length;
}

export const getUnapprovedConfirmations = createDeepEqualSelector(
  (state) => state.metamask.pendingApprovals || {},
  (pendingApprovals) => Object.values(pendingApprovals),
);

export function getUnapprovedTemplatedConfirmations(state) {
  const unapprovedConfirmations = getUnapprovedConfirmations(state);
  return unapprovedConfirmations.filter((approval) =>
    TEMPLATED_CONFIRMATION_APPROVAL_TYPES.includes(approval.type),
  );
}

export function getSuggestedTokens(state) {
  return (
    getUnapprovedConfirmations(state)?.filter(({ type, requestData }) => {
      return (
        type === ApprovalType.WatchAsset &&
        requestData?.asset?.tokenId === undefined
      );
    }) || []
  );
}

export function getSuggestedNfts(state) {
  return (
    getUnapprovedConfirmations(state)?.filter(({ requestData, type }) => {
      return (
        type === ApprovalType.WatchAsset &&
        requestData?.asset?.tokenId !== undefined
      );
    }) || []
  );
}

export function getIsMainnet(state) {
  const chainId = getCurrentChainId(state);
  return chainId === CHAIN_IDS.MAINNET;
}

export function getIsLineaMainnet(state) {
  const chainId = getCurrentChainId(state);
  return chainId === CHAIN_IDS.LINEA_MAINNET;
}

export function getIsTestnet(state) {
  const chainId = getCurrentChainId(state);
  return TEST_CHAINS.includes(chainId);
}

export function getIsNonStandardEthChain(state) {
  return !(getIsMainnet(state) || getIsTestnet(state) || process.env.IN_TEST);
}

export function getPreferences({ metamask }) {
  return metamask.preferences ?? {};
}

export function getShowTestNetworks(state) {
  const { showTestNetworks } = getPreferences(state);
  return Boolean(showTestNetworks);
}

/**
 * privacy mode preference
 *
 * @param state
 * @returns {boolean}
 */
export function getPrivacyMode(state) {
  const { privacyMode } = getPreferences(state);
  return Boolean(privacyMode);
}

export function getUseExternalNameSources(state) {
  return state.metamask.useExternalNameSources;
}

export const getTokenSortConfig = createDeepEqualSelector(
  getPreferences,
  ({ tokenSortConfig }) => {
    return tokenSortConfig;
  },
);

/**
 * Returns an object indicating which networks
 * tokens should be shown on in the portfolio view.
 */
// @deprecated('Use `getEnabledNetworks` instead')
export const getTokenNetworkFilter = createDeepEqualSelector(
  getCurrentChainId,
  getPreferences,
  getIsEvmMultichainNetworkSelected,
  getSelectedMultichainNetworkChainId,
  /**
   * @param {*} currentChainId - chainId
   * @param {*} preferences - preferences state
   * @param {*} isEvmMultichainNetworkSelected - whether the evm multichain network is selected
   * @param {*} multichainNetworkChainId - the chainId of the multichain network
   * @returns {Record<Hex, boolean>}
   */
  (
    currentChainId,
    { tokenNetworkFilter },
    isEvmMultichainNetworkSelected,
    multichainNetworkChainId,
  ) => {
    if (!isEvmMultichainNetworkSelected) {
      return { [multichainNetworkChainId]: true };
    }
    // Portfolio view not enabled outside popular networks
    if (
      !process.env.PORTFOLIO_VIEW ||
      !FEATURED_NETWORK_CHAIN_IDS.includes(currentChainId)
    ) {
      return { [currentChainId]: true };
    }
    // Portfolio view only enabled on featured networks
    return Object.entries(tokenNetworkFilter || {}).reduce(
      (acc, [chainId, value]) => {
        if (FEATURED_NETWORK_CHAIN_IDS.includes(chainId)) {
          acc[chainId] = value;
        }
        return acc;
      },
      {},
    );
  },
);

// @deprecated('Use `getEnabledNetworks` instead')
export function getIsTokenNetworkFilterEqualCurrentNetwork(state) {
  const chainId = getCurrentChainId(state);
  const enabledNetworks = getEnabledNetworks(state);
  const tokenNetworkFilter = getTokenNetworkFilter(state);

  const currentMultichainChainId = getSelectedMultichainNetworkChainId(state);
  const { namespace } = parseCaipChainId(currentMultichainChainId);

  const networks = isGlobalNetworkSelectorRemoved
    ? (enabledNetworks?.[namespace] ?? {})
    : tokenNetworkFilter;

  if (
    Object.keys(networks).length === 1 &&
    Object.keys(networks)[0] === chainId
  ) {
    return true;
  }
  return false;
}

export function getUseTransactionSimulations(state) {
  return Boolean(state.metamask.useTransactionSimulations);
}

export function getFeatureNotificationsEnabled(state) {
  const { featureNotificationsEnabled = false } = getPreferences(state);
  return featureNotificationsEnabled;
}

export function getShowExtensionInFullSizeView(state) {
  const { showExtensionInFullSizeView } = getPreferences(state);
  return Boolean(showExtensionInFullSizeView);
}

export function getTestNetworkBackgroundColor(state) {
  const currentNetwork = getProviderConfig(state).ticker;
  switch (true) {
    case currentNetwork?.includes(GOERLI_DISPLAY_NAME):
      return BackgroundColor.goerli;
    case currentNetwork?.includes(SEPOLIA_DISPLAY_NAME):
      return BackgroundColor.sepolia;
    default:
      return undefined;
  }
}

export function getShouldShowFiat(state, chainId) {
  let currentChainId;
  let conversionRate;
  if (chainId) {
    currentChainId = chainId;
    // Try known constants before user defined ticker
    const ticker =
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[chainId] ??
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION[chainId] ??
      selectNetworkConfigurationByChainId(state, chainId)?.nativeCurrency;
    conversionRate = getCurrencyRates(state)?.[ticker]?.conversionRate;
  } else {
    currentChainId = getCurrentChainId(state);
    conversionRate = getConversionRate(state);
  }

  const isTestnet = TEST_NETWORK_IDS.includes(currentChainId);
  const { showFiatInTestnets } = getPreferences(state);
  const useCurrencyRateCheck = getUseCurrencyRateCheck(state);
  const isConvertibleToFiat = Boolean(useCurrencyRateCheck && conversionRate);

  if (isTestnet) {
    return showFiatInTestnets && isConvertibleToFiat;
  }

  return isConvertibleToFiat;
}

export function getShouldHideZeroBalanceTokens(state) {
  const { hideZeroBalanceTokens } = getPreferences(state);
  return hideZeroBalanceTokens;
}

export function getAdvancedInlineGasShown(state) {
  return Boolean(state.metamask.featureFlags.advancedInlineGas);
}

/**
 * @param {string} svgString - The raw SVG string to make embeddable.
 * @returns {string} The embeddable SVG string.
 */
const getEmbeddableSvg = memoize(
  (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`,
);

export function getTargetSubjectMetadata(state, origin) {
  const metadata = getSubjectMetadata(state)[origin];

  if (metadata?.subjectType === SubjectType.Snap) {
    const { svgIcon, ...remainingMetadata } = metadata;
    return {
      ...remainingMetadata,
      iconUrl: svgIcon ? getEmbeddableSvg(svgIcon) : null,
    };
  }

  return metadata;
}

/**
 * Input selector for reusing the same state object.
 * Used in memoized selectors created with createSelector
 * when raw state is needed to be passed to other selectors
 * used to achieve re-usability.
 *
 * @param state - Redux state object.
 * @returns Object - Redux state object.
 */
export const rawStateSelector = (state) => state;

/**
 * Input selector used to retrieve Snaps that are added to Snaps Directory.
 *
 * @param state - Redux state object.
 * @returns Object - Containing verified Snaps from the Directory.
 */
const selectVerifiedSnapsRegistry = (state) =>
  state.metamask.database?.verifiedSnaps;

/**
 * Input selector providing a way to pass a snapId as an argument.
 *
 * @param _state - Redux state object.
 * @param snapId - ID of a Snap.
 * @returns string - ID of a Snap that can be used as input selector.
 */
const selectSnapId = (_state, snapId) => snapId;

/**
 * Input selector for retrieving all installed Snaps.
 *
 * @param state - Redux state object.
 * @returns Object - Installed Snaps.
 */
export const selectInstalledSnaps = (state) => state.metamask.snaps;

/**
 * Retrieve registry data for requested Snap.
 *
 * @param state - Redux state object.
 * @param snapId - ID of a Snap.
 * @returns Object containing metadata stored in Snaps registry for requested Snap.
 */
export const getSnapRegistryData = createSelector(
  [selectVerifiedSnapsRegistry, selectSnapId],
  (snapsRegistryData, snapId) => {
    return snapsRegistryData ? snapsRegistryData[snapId] : null;
  },
);

/**
 * Find and return Snap's latest version available in registry.
 *
 * @param state - Redux state object.
 * @param snapId - ID of a Snap.
 * @returns String SemVer version.
 */
export const getSnapLatestVersion = createSelector(
  [getSnapRegistryData],
  (snapRegistryData) => {
    if (!snapRegistryData) {
      return null;
    }

    return Object.keys(snapRegistryData.versions).reduce((latest, version) => {
      return semver.gt(version, latest) ? version : latest;
    }, '0.0.0');
  },
);

/**
 * Return a Map of all installed Snaps with available update status.
 *
 * @param state - Redux state object.
 * @returns Map Snap IDs mapped to a boolean value (true if update is available, false otherwise).
 */
export const getAllSnapAvailableUpdates = createSelector(
  [selectInstalledSnaps, rawStateSelector],
  (installedSnaps, state) => {
    const snapMap = new Map();

    Object.keys(installedSnaps).forEach((snapId) => {
      const latestVersion = getSnapLatestVersion(state, snapId);

      snapMap.set(
        snapId,
        latestVersion
          ? semver.gt(latestVersion, installedSnaps[snapId].version)
          : false,
      );
    });

    return snapMap;
  },
);

/**
 * Return status of Snaps update availability for any installed Snap.
 *
 * @param state - Redux state object.
 * @returns boolean true if update is available, false otherwise.
 */
export const getAnySnapUpdateAvailable = createSelector(
  [getAllSnapAvailableUpdates],
  (snapMap) => {
    return [...snapMap.values()].some((value) => value === true);
  },
);

/**
 * Return if the snap branding should show in the UI.
 */
export const getHideSnapBranding = createDeepEqualSelector(
  [selectInstalledSnaps, selectSnapId],
  (installedSnaps, snapId) => {
    return installedSnaps[snapId]?.hideSnapBranding;
  },
);

/**
 * Get a memoized version of the target subject metadata.
 */
export const getMemoizedTargetSubjectMetadata = createDeepEqualSelector(
  getTargetSubjectMetadata,
  (interfaces) => interfaces,
);

/**
 * Get a memoized version of the unapproved confirmations.
 */
export const getMemoizedUnapprovedConfirmations = createDeepEqualSelector(
  getUnapprovedConfirmations,
  (confirmations) => confirmations,
);

/**
 * Get a memoized version of the unapproved templated confirmations.
 */
export const getMemoizedUnapprovedTemplatedConfirmations =
  createDeepEqualSelector(
    getUnapprovedTemplatedConfirmations,
    (confirmations) => confirmations,
  );

/**
 * Get the Snap interfaces from the redux state.
 *
 * @param state - Redux state object.
 * @returns the Snap interfaces.
 */
const getInterfaces = (state) => state.metamask.interfaces;

/**
 * Input selector providing a way to pass a Snap interface ID as an argument.
 *
 * @param _state - Redux state object.
 * @param interfaceId - ID of a Snap interface.
 * @returns ID of a Snap Interface that can be used as input selector.
 */
const selectInterfaceId = (_state, interfaceId) => interfaceId;

/**
 * Get a memoized version of the Snap interfaces.
 */
export const getMemoizedInterfaces = createDeepEqualSelector(
  getInterfaces,
  (interfaces) => interfaces,
);

/**
 * Get a Snap Interface with a given ID.
 */
export const getInterface = createSelector(
  [getMemoizedInterfaces, selectInterfaceId],
  (interfaces, id) => interfaces[id],
);

/**
 * Get a memoized version of a Snap interface with a given ID
 */
export const getMemoizedInterface = createDeepEqualSelector(
  getInterface,
  (snapInterface) => snapInterface,
);

/**
 * Get the content from a Snap interface with a given ID.
 */
export const getInterfaceContent = createSelector(
  [getMemoizedInterfaces, selectInterfaceId],
  (interfaces, id) => interfaces[id]?.content,
);

/**
 * Get a memoized version of the content from a Snap interface with a given ID.
 */
export const getMemoizedInterfaceContent = createDeepEqualSelector(
  getInterfaceContent,
  (content) => content,
);

/**
 * Input selector providing a way to pass the origins as an argument.
 *
 * @param _state - Redux state object.
 * @param origins - Object containing origins.
 * @returns object - Object with keys that can be used as input selector.
 */
const selectOrigins = (_state, origins) => origins;

/**
 * Retrieve metadata for multiple subjects (origins).
 *
 * @param state - Redux state object.
 * @param origins - Object containing keys that represent subject's identification.
 * @returns Key:value object containing metadata attached to each subject key.
 */
export const getMultipleTargetsSubjectMetadata = createDeepEqualSelector(
  [rawStateSelector, selectOrigins],
  (state, origins) => {
    return Object.keys(origins ?? {}).reduce((originsMetadata, origin) => {
      originsMetadata[origin] = getTargetSubjectMetadata(state, origin);
      return originsMetadata;
    }, {});
  },
);

export function getRpcPrefsForCurrentProvider(state) {
  const { rpcPrefs } = getProviderConfig(state);
  return rpcPrefs;
}

export function getKnownMethodData(state, data) {
  const { knownMethodData, use4ByteResolution } = state.metamask;

  if (!use4ByteResolution || !hasTransactionData(data)) {
    return null;
  }

  const prefixedData = addHexPrefix(data);
  const fourBytePrefix = prefixedData.slice(0, 10);

  if (fourBytePrefix.length < 10) {
    return null;
  }

  return knownMethodData?.[fourBytePrefix] ?? null;
}

export function getFeatureFlags(state) {
  return state.metamask.featureFlags;
}

export function getOriginOfCurrentTab(state) {
  return state.activeTab.origin;
}

export function getDefaultHomeActiveTabName(state) {
  return state.metamask.defaultHomeActiveTabName;
}

export function getIpfsGateway(state) {
  return state.metamask.ipfsGateway;
}

export function getUseExternalServices(state) {
  return state.metamask.useExternalServices;
}

export function getUSDConversionRate(state) {
  return state.metamask.currencyRates[getProviderConfig(state).ticker]
    ?.usdConversionRate;
}

export const getUSDConversionRateByChainId = (chainId) =>
  createSelector(
    getCurrencyRates,
    (state) => selectNetworkConfigurationByChainId(state, chainId),
    (currencyRates, networkConfiguration) => {
      if (!networkConfiguration) {
        return undefined;
      }

      const { nativeCurrency } = networkConfiguration;
      return currencyRates[nativeCurrency]?.usdConversionRate;
    },
  );

export function getCurrencyRates(state) {
  return state.metamask.currencyRates;
}

export function getWeb3ShimUsageStateForOrigin(state, origin) {
  return state.metamask.web3ShimUsageOrigins[origin];
}

/**
 * @typedef {object} SwapsEthToken
 * @property {string} symbol - The symbol for ETH, namely "ETH"
 * @property {string} name - The name of the ETH currency, "Ether"
 * @property {string} address - A substitute address for the metaswap-api to
 * recognize the ETH token
 * @property {string} chainId - The chainId of the ETH token
 * @property {string} decimals - The number of ETH decimals, i.e. 18
 * @property {string} balance - The user's ETH balance in decimal wei, with a
 * precision of 4 decimal places
 * @property {string} string - The user's ETH balance in decimal ETH
 */

/**
 * Swaps related code uses token objects for various purposes. These objects
 * always have the following properties: `symbol`, `name`, `address`, and
 * `decimals`.
 *
 * When available for the current account, the objects can have `balance` and
 * `string` properties.
 * `balance` is the users token balance in decimal values, denominated in the
 * minimal token units (according to its decimals).
 * `string` is the token balance in a readable format, ready for rendering.
 *
 * Swaps treats the selected chain's currency as a token, and we use the token constants
 * in the SWAPS_CHAINID_DEFAULT_TOKEN_MAP to set the standard properties for
 * the token. The getSwapsDefaultToken selector extends that object with
 * `balance` and `string` values of the same type as in regular ERC-20 token
 * objects, per the above description.
 *
 * @deprecated Use getNativeAssetForChainId instead because this only supports EVM chains
 * @param {object} state - the redux state object
 * @param {string} overrideChainId - the chainId to override the current chainId
 * @returns {SwapsEthToken} The token object representation of the currently
 * selected account's ETH balance, as expected by the Swaps API.
 */

export function getSwapsDefaultToken(state, overrideChainId = null) {
  const selectedAccount = getSelectedAccount(state);
  const balance = selectedAccount?.balance;
  const currentChainId = getCurrentChainId(state);

  const chainId = overrideChainId ?? currentChainId;
  const defaultTokenObject = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId];

  return {
    ...defaultTokenObject,
    chainId,
    balance: hexToDecimal(balance),
    string: getValueFromWeiHex({
      value: balance,
      numberOfDecimals: 4,
      toDenomination: 'ETH',
    }),
  };
}

export function getIsSwapsChain(state, overrideChainId) {
  const currentChainId = getCurrentChainId(state);
  const chainId = overrideChainId ?? currentChainId;
  const isDevelopment =
    process.env.METAMASK_ENVIRONMENT === 'development' ||
    process.env.METAMASK_ENVIRONMENT === 'testing';
  return isDevelopment
    ? ALLOWED_DEV_SWAPS_CHAIN_IDS.includes(chainId)
    : ALLOWED_PROD_SWAPS_CHAIN_IDS.includes(chainId);
}

export function getIsBridgeChain(state, overrideChainId) {
  const account = getSelectedInternalAccount(state);
  const { chainId: selectedMultiChainId, isEvmNetwork } = getMultichainNetwork(
    state,
    account,
  );

  let currentChainId = selectedMultiChainId;

  // While we do not support the multichain network on EVM chains (ex: mainnet is epi155:1), use the old chainId
  if (isEvmNetwork) {
    currentChainId = getCurrentChainId(state);
  }

  const chainId = overrideChainId ?? currentChainId;
  return ALLOWED_BRIDGE_CHAIN_IDS.includes(chainId);
}

const getBridgeFeatureFlags = createDeepEqualSelector(
  [(state) => getRemoteFeatureFlags(state).bridgeConfig],
  (bridgeConfig) => {
    const validatedFlags = selectBridgeFeatureFlags({
      remoteFeatureFlags: { bridgeConfig },
    });
    return validatedFlags;
  },
);

export const getIsBridgeEnabled = createSelector(
  [getBridgeFeatureFlags, getUseExternalServices],
  (bridgeFeatureFlags, shouldUseExternalServices) => {
    return (shouldUseExternalServices && bridgeFeatureFlags?.support) ?? false;
  },
);

export function getNativeCurrencyImage(state) {
  const chainId = getCurrentChainId(state);
  return CHAIN_ID_TOKEN_IMAGE_MAP[chainId];
}

export function getNativeCurrencyForChain(chainId) {
  return CHAIN_ID_TOKEN_IMAGE_MAP[chainId] ?? undefined;
}

/**
 * Returns a memoized selector that gets the internal accounts from the Redux store.
 *
 * @param state - The Redux store state.
 * @returns {Array} An array of internal accounts.
 */
export const getMemoizedMetaMaskInternalAccounts = createDeepEqualSelector(
  getInternalAccounts,
  (internalAccounts) => internalAccounts,
);

export const selectERC20TokensByChain = createDeepEqualSelector(
  (state) => state.metamask.tokensChainsCache,
  (erc20TokensByChain) => erc20TokensByChain,
);

export const selectERC20Tokens = createDeepEqualSelector(
  getCurrentChainId,
  (state) => state.metamask.tokensChainsCache,
  (chainId, erc20Tokens) => erc20Tokens?.[chainId]?.data || {},
);

/**
 * To retrieve the token list for use throughout the UI. Will return the remotely fetched list
 * from the tokens controller if token detection is enabled, or the static list if not.
 *
 * @type {() => object}
 */
export const getTokenList = createSelector(
  selectERC20Tokens,
  getIsTokenDetectionInactiveOnMainnet,
  (remoteTokenList, isTokenDetectionInactiveOnMainnet) => {
    return isTokenDetectionInactiveOnMainnet
      ? STATIC_MAINNET_TOKEN_LIST
      : remoteTokenList;
  },
);

export const getMemoizedMetadataContract = createSelector(
  (state, _address) => getTokenList(state),
  (_state, address) => address,
  (tokenList, address) => tokenList[address?.toLowerCase()],
);

/**
 * @type (state: any, address: string) => string
 */
export const getMetadataContractName = createSelector(
  getMemoizedMetadataContract,
  (entry) => entry?.name ?? '',
);

export const getTxData = (state) => state.confirmTransaction.txData;

export const getUnapprovedTransaction = createDeepEqualSelector(
  (state) => getUnapprovedTransactions(state),
  (_, transactionId) => transactionId,
  (unapprovedTxs, transactionId) =>
    Object.values(unapprovedTxs).find(({ id }) => id === transactionId),
);

export const getTransaction = createDeepEqualSelector(
  (state) => getCurrentNetworkTransactions(state),
  (_, transactionId) => transactionId,
  (unapprovedTxs, transactionId) => {
    return (
      Object.values(unapprovedTxs).find(({ id }) => id === transactionId) || {}
    );
  },
);

export const getFullTxData = createDeepEqualSelector(
  getTxData,
  (state, transactionId, status) => {
    if (status === TransactionStatus.unapproved) {
      return getUnapprovedTransaction(state, transactionId) ?? {};
    }
    return getTransaction(state, transactionId);
  },
  (
    _state,
    _transactionId,
    _status,
    customTxParamsData,
    hexTransactionAmount,
  ) => ({
    customTxParamsData,
    hexTransactionAmount,
  }),
  (txData, transaction, { customTxParamsData, hexTransactionAmount }) => {
    let fullTxData = { ...txData, ...transaction };
    if (transaction && transaction.simulationFails) {
      fullTxData.simulationFails = { ...transaction.simulationFails };
    }
    if (customTxParamsData) {
      fullTxData = {
        ...fullTxData,
        txParams: {
          ...fullTxData.txParams,
          data: customTxParamsData,
        },
      };
    }
    if (hexTransactionAmount) {
      fullTxData = {
        ...fullTxData,
        txParams: {
          ...fullTxData.txParams,
          value: hexTransactionAmount,
        },
      };
    }
    return fullTxData;
  },
);

/**
 *  @typedef {import('./selectors.types').AccountConnections} AccountConnections
 */

/**
 * Retrieves the connected subjects for all addresses.
 *
 * @returns {AccountConnections}  The connected subjects for all addresses.
 */
export const getConnectedSubjectsForAllAddresses = createDeepEqualSelector(
  getPermissionSubjects,
  getSubjectMetadata,
  (subjects, subjectMetadata) => {
    const accountsToConnections = {};
    Object.entries(subjects).forEach(([subjectKey, subjectValue]) => {
      const exposedAccounts = getAccountsFromSubject(subjectValue);
      exposedAccounts.forEach((address) => {
        if (!accountsToConnections[address]) {
          accountsToConnections[address] = [];
        }
        const metadata = subjectMetadata[subjectKey];
        accountsToConnections[address].push({
          origin: subjectKey,
          ...metadata,
        });
      });
    });

    return accountsToConnections;
  },
);

export const getAllConnectedAccounts = createDeepEqualSelector(
  getConnectedSubjectsForAllAddresses,
  (connectedSubjects) => {
    return Object.keys(connectedSubjects);
  },
);
export const getConnectedSitesList = createDeepEqualSelector(
  getConnectedSubjectsForAllAddresses,
  getInternalAccounts,
  getAllConnectedAccounts,
  (connectedSubjectsForAllAddresses, internalAccounts, connectedAddresses) => {
    const sitesList = {};
    connectedAddresses.forEach((connectedAddress) => {
      connectedSubjectsForAllAddresses[connectedAddress].forEach((app) => {
        const siteKey = app.origin;

        const internalAccount = internalAccounts.find((account) =>
          isEqualCaseInsensitive(account.address, connectedAddress),
        );

        if (sitesList[siteKey]) {
          sitesList[siteKey].addresses.push(connectedAddress);
          sitesList[siteKey].addressToNameMap[connectedAddress] =
            internalAccount?.metadata.name || ''; // Map address to name
        } else {
          sitesList[siteKey] = {
            ...app,
            addresses: [connectedAddress],
            addressToNameMap: {
              [connectedAddress]: internalAccount?.metadata.name || '',
            },
          };
        }
      });
    });
    return sitesList;
  },
);

export const getMemoizedCurrentChainId = createDeepEqualSelector(
  getCurrentChainId,
  (chainId) => chainId,
);

export function getSnaps(state) {
  return state.metamask.snaps;
}

export function getLocale(state) {
  return state.metamask.currentLocale;
}

export const getSnap = createDeepEqualSelector(
  getSnaps,
  (_, snapId) => snapId,
  (snaps, snapId) => {
    return snaps[snapId];
  },
);

/**
 * Get a selector that returns all Snaps metadata (name and description) for all Snaps.
 *
 * @param {object} state - The Redux state object.
 * @returns {object} An object mapping all installed snaps to their metadata, which contains the snap name and description.
 */
export const getSnapsMetadata = createDeepEqualSelector(
  getLocale,
  getSnaps,
  (locale, snaps) => {
    return Object.values(snaps).reduce((snapsMetadata, snap) => {
      const snapId = snap.id;
      const manifest = snap.localizationFiles
        ? getLocalizedSnapManifest(
            snap.manifest,
            locale,
            snap.localizationFiles,
          )
        : snap.manifest;

      snapsMetadata[snapId] = {
        name: manifest.proposedName,
        description: manifest.description,
        hidden: snap.hidden,
      };
      return snapsMetadata;
    }, {});
  },
);

/**
 * Get a selector that returns the snap metadata (name and description) for a
 * given `snapId`.
 *
 * @param {object} state - The Redux state object.
 * @param {string} snapId - The snap ID to get the metadata for.
 * @returns {object} An object containing the snap name and description.
 */
export const getSnapMetadata = createDeepEqualSelector(
  getSnapsMetadata,
  (_, snapId) => snapId,
  (metadata, snapId) => {
    return (
      metadata[snapId] ?? {
        name: snapId ? stripSnapPrefix(snapId) : null,
      }
    );
  },
);

export const getEnabledSnaps = createDeepEqualSelector(getSnaps, (snaps) => {
  return Object.values(snaps).reduce((acc, cur) => {
    if (cur.enabled) {
      acc[cur.id] = cur;
    }
    return acc;
  }, {});
});

export const getPreinstalledSnaps = createDeepEqualSelector(
  getSnaps,
  (snaps) => {
    return Object.values(snaps).reduce((acc, snap) => {
      if (snap.preinstalled) {
        acc[snap.id] = snap;
      }
      return acc;
    }, {});
  },
);

export const getInsightSnaps = createDeepEqualSelector(
  getEnabledSnaps,
  getPermissionSubjects,
  (snaps, subjects) => {
    return Object.values(snaps).filter(
      ({ id }) => subjects[id]?.permissions['endowment:transaction-insight'],
    );
  },
);

export const getSettingsPageSnaps = createDeepEqualSelector(
  getEnabledSnaps,
  getPermissionSubjects,
  (snaps, subjects) => {
    return Object.values(snaps).filter(
      ({ id, preinstalled }) =>
        subjects[id]?.permissions[SnapEndowments.SettingsPage] &&
        preinstalled &&
        !isSnapIgnoredInProd(id),
    );
  },
);

export const getSignatureInsightSnaps = createDeepEqualSelector(
  getEnabledSnaps,
  getPermissionSubjects,
  (snaps, subjects) => {
    return Object.values(snaps).filter(
      ({ id }) => subjects[id]?.permissions['endowment:signature-insight'],
    );
  },
);

export const getSignatureInsightSnapIds = createDeepEqualSelector(
  getSignatureInsightSnaps,
  (snaps) => snaps.map((snap) => snap.id),
);

export const getInsightSnapIds = createDeepEqualSelector(
  getInsightSnaps,
  (snaps) => snaps.map((snap) => snap.id),
);

export const getNameLookupSnapsIds = createDeepEqualSelector(
  getEnabledSnaps,
  getPermissionSubjects,
  (snaps, subjects) => {
    return Object.values(snaps)
      .filter(({ id }) => subjects[id]?.permissions['endowment:name-lookup'])
      .map((snap) => snap.id);
  },
);

export const getNameLookupSnaps = createDeepEqualSelector(
  getEnabledSnaps,
  getPermissionSubjects,
  (snaps, subjects) => {
    return Object.values(snaps)
      .filter(({ id }) => subjects[id]?.permissions['endowment:name-lookup'])
      .map((snap) => ({
        id: snap.id,
        permission: subjects[snap.id]?.permissions['endowment:name-lookup'],
      }));
  },
);

export const getSettingsPageSnapsIds = createDeepEqualSelector(
  getSettingsPageSnaps,
  (snaps) => snaps.map((snap) => snap.id),
);

export const getNotifySnaps = createDeepEqualSelector(
  getEnabledSnaps,
  getPermissionSubjects,
  (snaps, subjects) => {
    return Object.values(snaps).filter(
      ({ id }) => subjects[id]?.permissions.snap_notify,
    );
  },
);
/**
 * Get non-preinstalled snaps that have the snap_notify permission.
 *
 * @param {object} state - The Redux state object.
 * @returns {object[]} An array of notify snaps that are not preinstalled.
 */
export const getThirdPartyNotifySnaps = createDeepEqualSelector(
  getNotifySnaps,
  (snaps) => snaps.filter((snap) => !snap.preinstalled),
);

function getAllSnapInsights(state) {
  return state.metamask.insights;
}

export const getSnapInsights = createDeepEqualSelector(
  getAllSnapInsights,
  (_, id) => id,
  (insights, id) => insights?.[id],
);

/**
 * Get an object of announcement IDs and if they are allowed or not.
 *
 * @returns {object}
 */
function getAllowedAnnouncementIds() {
  return {};
}

/**
 * @typedef {object} Announcement
 * @property {number} id - A unique identifier for the announcement
 * @property {string} date - A date in YYYY-MM-DD format, identifying when the notification was first committed
 */

/**
 * Announcements are managed by the announcement controller and referenced by
 * `state.metamask.announcements`. This function returns a list of announcements
 * the can be shown to the user. This list includes all announcements that do not
 * have a truthy `isShown` property.
 *
 * The returned announcements are sorted by date.
 *
 * @param {object} state - the redux state object
 * @returns {Announcement[]} An array of announcements that can be shown to the user
 */

export function getSortedAnnouncementsToShow(state) {
  const announcements = Object.values(state.metamask.announcements);
  const allowedAnnouncementIds = getAllowedAnnouncementIds(state);
  const announcementsToShow = announcements.filter(
    (announcement) =>
      !announcement.isShown && allowedAnnouncementIds[announcement.id],
  );
  const announcementsSortedByDate = announcementsToShow.sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  return announcementsSortedByDate;
}

/**
 * @param state
 * @returns {{networkId: string}[]}
 */
export function getOrderedNetworksList(state) {
  return state.metamask.orderedNetworkList;
}

/**
 *
 * @param state
 * @returns { Record<string, Record<string, boolean>> }
 * @example
 * {
 *     "eip155": {
 *         "0x1": true,
 *         "0xe708": true,
 *     },
 *     "solana": {
 *         "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": true
 *     }
 * }
 */
export function getEnabledNetworks(state) {
  return state.metamask.enabledNetworkMap;
}

export function getPinnedAccountsList(state) {
  return state.metamask.pinnedAccountList;
}

export function getHiddenAccountsList(state) {
  return state.metamask.hiddenAccountList;
}

export function getShowRecoveryPhraseReminder(state) {
  const {
    recoveryPhraseReminderLastShown,
    recoveryPhraseReminderHasBeenShown,
  } = state.metamask;

  const currentTime = new Date().getTime();
  const frequency = recoveryPhraseReminderHasBeenShown ? DAY * 90 : DAY * 2;

  return currentTime - recoveryPhraseReminderLastShown >= frequency;
}

/**
 * Retrieves the number of unapproved transactions and messages
 *
 * @param state - Redux state object.
 * @returns Number of unapproved transactions
 */
export function getNumberOfAllUnapprovedTransactionsAndMessages(state) {
  const unapprovedTxs = getAllUnapprovedTransactions(state);

  const allUnapprovedMessages = {
    ...unapprovedTxs,
    ...state.metamask.unapprovedDecryptMsgs,
    ...state.metamask.unapprovedPersonalMsgs,
    ...state.metamask.unapprovedEncryptionPublicKeyMsgs,
    ...state.metamask.unapprovedTypedMessages,
  };
  const numUnapprovedMessages = Object.keys(allUnapprovedMessages).length;
  return numUnapprovedMessages;
}

export const getCurrentNetwork = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  getCurrentChainId,

  /**
   * Get the current network configuration.
   *
   * @param networkConfigurationsByChainId
   * @param currentChainId
   * @returns {{
   *   chainId: `0x${string}`;
   *   id?: string;
   *   nickname?: string;
   *   providerType?: string;
   *   rpcPrefs?: { blockExplorerUrl?: string; imageUrl?: string; };
   *   rpcUrl: string;
   *   ticker: string;
   * }} networkConfiguration - Configuration for the current network.
   */
  (networkConfigurationsByChainId, currentChainId) => {
    const currentNetwork = networkConfigurationsByChainId[currentChainId];

    const rpcEndpoint =
      currentNetwork.rpcEndpoints[currentNetwork.defaultRpcEndpointIndex];

    const blockExplorerUrl =
      currentNetwork.blockExplorerUrls?.[
        currentNetwork.defaultBlockExplorerUrlIndex
      ];

    return {
      chainId: currentNetwork.chainId,
      id: rpcEndpoint.networkClientId,
      nickname: currentNetwork.name,
      rpcUrl: rpcEndpoint.url,
      ticker: currentNetwork.nativeCurrency,
      blockExplorerUrl,
      rpcPrefs: {
        blockExplorerUrl,
        imageUrl: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[currentNetwork.chainId],
      },
      ...(rpcEndpoint.type === RpcEndpointType.Infura && {
        providerType: rpcEndpoint.networkClientId,
      }),
    };
  },
);

export const getSelectedNetwork = createDeepEqualSelector(
  getSelectedNetworkClientId,
  getNetworkConfigurationsByChainId,
  (selectedNetworkClientId, networkConfigurationsByChainId) => {
    if (selectedNetworkClientId === undefined) {
      throw new Error('No network is selected');
    }

    // TODO: Add `networkConfigurationsByNetworkClientId` to NetworkController state so this is easier to do
    const possibleNetworkConfiguration = Object.values(
      networkConfigurationsByChainId,
    ).find((networkConfiguration) => {
      return networkConfiguration.rpcEndpoints.some((rpcEndpoint) => {
        return rpcEndpoint.networkClientId === selectedNetworkClientId;
      });
    });
    if (possibleNetworkConfiguration === undefined) {
      throw new Error(
        'Could not find network configuration for selected network client',
      );
    }

    return {
      configuration: possibleNetworkConfiguration,
      clientId: selectedNetworkClientId,
    };
  },
);

export const getConnectedSitesListWithNetworkInfo = createDeepEqualSelector(
  getConnectedSitesList,
  getAllDomains,
  getNetworkConfigurationsByChainId,
  getCurrentNetwork,
  (sitesList, domains, networks, currentNetwork) => {
    Object.keys(sitesList).forEach((siteKey) => {
      const connectedNetwork = Object.values(networks).find((network) =>
        network.rpcEndpoints.some(
          (rpcEndpoint) => rpcEndpoint.networkClientId === domains[siteKey],
        ),
      );

      // For the testnets, if we do not have an image, we will have a fallback string
      sitesList[siteKey].networkIconUrl =
        CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[connectedNetwork?.chainId] || '';
      sitesList[siteKey].networkName =
        connectedNetwork?.name || currentNetwork?.nickname || '';
    });
    return sitesList;
  },
);

/**
 * Returns the network client ID of the network that should be auto-switched to
 * based on the current tab origin and its last network connected to
 *
 * @param state - Redux state object.
 * @returns Network ID to switch to
 */
export function getNetworkToAutomaticallySwitchTo(state) {
  const numberOfUnapprovedTx =
    getNumberOfAllUnapprovedTransactionsAndMessages(state);

  // This block autoswitches chains based on the last chain used
  // for a given dapp, when there are no pending confimrations
  // This allows the user to be connected on one chain
  // for one dapp, and automatically change for another
  const selectedTabOrigin = getOriginOfCurrentTab(state);
  if (
    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP &&
    getIsUnlocked(state) &&
    selectedTabOrigin &&
    numberOfUnapprovedTx === 0
  ) {
    const domainNetworks = getAllDomains(state);
    const networkIdForThisDomain = domainNetworks[selectedTabOrigin];
    const currentNetwork = getCurrentNetwork(state);

    // If we have a match, "silently" switch networks if the network differs
    // from the current network
    if (
      networkIdForThisDomain &&
      currentNetwork.id !== networkIdForThisDomain
    ) {
      return networkIdForThisDomain;
    }
  }
  return null;
}

export function getShowTermsOfUse(state) {
  const { termsOfUseLastAgreed } = state.metamask;

  if (!termsOfUseLastAgreed) {
    return true;
  }
  return (
    new Date(termsOfUseLastAgreed).getTime() <
    new Date(TERMS_OF_USE_LAST_UPDATED).getTime()
  );
}

export function getLastViewedUserSurvey(state) {
  return state.metamask.lastViewedUserSurvey;
}

export function getShowOutdatedBrowserWarning(state) {
  const { outdatedBrowserWarningLastShown } = state.metamask;
  if (!outdatedBrowserWarningLastShown) {
    return true;
  }
  const currentTime = new Date().getTime();
  return currentTime - outdatedBrowserWarningLastShown >= DAY * 2;
}

export function getOnboardingDate(state) {
  return state.metamask.onboardingDate;
}

export function getShowBetaHeader(state) {
  return state.metamask.showBetaHeader;
}

export function getShowPermissionsTour(state) {
  return state.metamask.showPermissionsTour;
}

export function getShowNetworkBanner(state) {
  return state.metamask.showNetworkBanner;
}

export function getShowAccountBanner(state) {
  return state.metamask.showAccountBanner;
}

export function getShowDownloadMobileAppSlide(state) {
  return state.metamask.showDownloadMobileAppSlide;
}

/**
 * To get the useTokenDetection flag which determines whether a static or dynamic token list is used
 *
 * @param {*} state
 * @returns Boolean
 */
export function getUseTokenDetection(state) {
  return Boolean(state.metamask.useTokenDetection);
}

/**
 * To get the useNftDetection flag which determines whether we autodetect NFTs
 *
 * @param {*} state
 * @returns Boolean
 */
export function getUseNftDetection(state) {
  return Boolean(state.metamask.useNftDetection);
}

/**
 * To get the useBlockie flag which determines whether we show blockies or Jazzicons
 *
 * @param {*} state
 * @returns Boolean
 */
export function getUseBlockie(state) {
  return Boolean(state.metamask.useBlockie);
}

/**
 * To get the openSeaEnabled flag which determines whether we use OpenSea's API
 *
 * @param {*} state
 * @returns Boolean
 */
export function getOpenSeaEnabled(state) {
  return Boolean(state.metamask.openSeaEnabled);
}

/**
 * To get the `theme` value which determines which theme is selected
 *
 * @param {*} state
 * @returns Boolean
 */
export function getTheme(state) {
  return state.metamask.theme;
}

export function doesAddressRequireLedgerHidConnection(state, address) {
  const addressIsLedger = isAddressLedger(state, address);
  const transportTypePreferenceIsWebHID =
    getLedgerTransportType(state) === LedgerTransportTypes.webhid;
  const webHidIsNotConnected =
    getLedgerWebHidConnectedStatus(state) !== WebHIDConnectedStatuses.connected;
  const ledgerTransportStatus = getLedgerTransportStatus(state);
  const transportIsNotSuccessfullyCreated =
    ledgerTransportStatus !== HardwareTransportStates.verified;

  return (
    addressIsLedger &&
    transportTypePreferenceIsWebHID &&
    (webHidIsNotConnected || transportIsNotSuccessfullyCreated)
  );
}

export const getAllEnabledNetworks = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  getShowTestNetworks,
  (networkConfigurationsByChainId, showTestNetworks) =>
    Object.entries(networkConfigurationsByChainId).reduce(
      (acc, [chainId, network]) => {
        if (showTestNetworks || !TEST_CHAINS.includes(chainId)) {
          acc[chainId] = network;
        }
        return acc;
      },
      {},
    ),
);

/*
 * USE THIS WITH CAUTION
 *
 * Only use this selector if you are absolutely sure that your UI component needs
 * data from _all chains_ to compute a value. Else, use `getChainIdsToPoll`.
 *
 * Examples:
 * - Components that should NOT use this selector:
 *   - Token list: This only needs to poll for chains based on the network filter
 *     (potentially only one chain). In this case, use `getChainIdsToPoll`.
 * - Components that SHOULD use this selector:
 *   - Aggregated balance: This needs to display data regardless of network filter
 *     selection (always showing aggregated balances across all chains).
 *
 * Key Considerations:
 * - This selector can cause expensive computations. It should only be used when
 *   necessary, and where possible, optimized to use `getChainIdsToPoll` instead.
 * - Logic Overview:
 *   - If `PORTFOLIO_VIEW` is not enabled, the selector returns only the `currentChainId`.
 *   - Otherwise, it includes all chains from `networkConfigurations`, excluding
 *     `TEST_CHAINS`, while ensuring the `currentChainId` is included.
 */
// @deprecated('Use `getEnabledChainIds` instead')
export const getAllChainsToPoll = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  getCurrentChainId,
  (networkConfigurations, currentChainId) => {
    if (!process.env.PORTFOLIO_VIEW) {
      return [currentChainId];
    }

    return Object.keys(networkConfigurations).filter(
      (chainId) =>
        chainId === currentChainId ||
        FEATURED_NETWORK_CHAIN_IDS.includes(chainId),
    );
  },
);

// @deprecated('Use `getEnabledChainIds` instead')
export const getChainIdsToPoll = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  getCurrentChainId,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  (
    networkConfigurations,
    currentChainId,
    isTokenNetworkFilterEqualCurrentNetwork,
  ) => {
    if (
      !process.env.PORTFOLIO_VIEW ||
      isTokenNetworkFilterEqualCurrentNetwork
    ) {
      return [currentChainId];
    }

    return Object.keys(networkConfigurations).filter(
      (chainId) =>
        chainId === currentChainId ||
        FEATURED_NETWORK_CHAIN_IDS.includes(chainId),
    );
  },
);

// @deprecated('Use `getEnabledNetworkClientIds` instead')
export const getNetworkClientIdsToPoll = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  getCurrentChainId,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  (
    networkConfigurations,
    currentChainId,
    isTokenNetworkFilterEqualCurrentNetwork,
  ) => {
    if (
      !process.env.PORTFOLIO_VIEW ||
      isTokenNetworkFilterEqualCurrentNetwork
    ) {
      const networkConfiguration = networkConfigurations[currentChainId];
      return [
        networkConfiguration.rpcEndpoints[
          networkConfiguration.defaultRpcEndpointIndex
        ].networkClientId,
      ];
    }

    return Object.entries(networkConfigurations).reduce(
      (acc, [chainId, network]) => {
        if (
          chainId === currentChainId ||
          FEATURED_NETWORK_CHAIN_IDS.includes(chainId)
        ) {
          acc.push(
            network.rpcEndpoints[network.defaultRpcEndpointIndex]
              .networkClientId,
          );
        }
        return acc;
      },
      [],
    );
  },
);

/**
 *  To retrieve the maxBaseFee and priorityFee the user has set as default
 *
 * @param {*} state
 * @returns {{maxBaseFee: string, priorityFee: string} | undefined}
 */
export function getAdvancedGasFeeValues(state) {
  // This will not work when we switch to supporting multi-chain.
  // There are four non-test files that use this selector.
  // advanced-gas-fee-defaults
  // base-fee-input
  // priority-fee-input
  // useGasItemFeeDetails
  // The first three are part of the AdvancedGasFeePopover
  // The latter is used by the EditGasPopover
  // Both of those are used in Confirmations as well as transaction-list-item
  // All of the call sites have access to the GasFeeContext, which has a
  // transaction object set on it, but there are currently no guarantees that
  // the transaction has a chainId associated with it. To have this method
  // support multichain we'll need a reliable way for the chainId of the
  // transaction being modified to be available to all callsites and either
  // pass it in to the selector as a second parameter, or access it at the
  // callsite.
  return state.metamask.advancedGasFee[getCurrentChainId(state)];
}

/**
 * To get the name of the network that support token detection based in chainId.
 *
 * @param state
 * @returns string e.g. ethereum, bsc or polygon
 */
export const getTokenDetectionSupportNetworkByChainId = (state) => {
  const chainId = getCurrentChainId(state);
  switch (chainId) {
    case CHAIN_IDS.MAINNET:
      return MAINNET_DISPLAY_NAME;
    case CHAIN_IDS.BSC:
      return BSC_DISPLAY_NAME;
    case CHAIN_IDS.POLYGON:
      return POLYGON_DISPLAY_NAME;
    case CHAIN_IDS.AVALANCHE:
      return AVALANCHE_DISPLAY_NAME;
    case CHAIN_IDS.LINEA_GOERLI:
      return LINEA_GOERLI_DISPLAY_NAME;
    case CHAIN_IDS.LINEA_SEPOLIA:
      return LINEA_SEPOLIA_DISPLAY_NAME;
    case CHAIN_IDS.LINEA_MAINNET:
      return LINEA_MAINNET_DISPLAY_NAME;
    case CHAIN_IDS.ARBITRUM:
      return ARBITRUM_DISPLAY_NAME;
    case CHAIN_IDS.OPTIMISM:
      return OPTIMISM_DISPLAY_NAME;
    case CHAIN_IDS.BASE:
      return BASE_DISPLAY_NAME;
    case CHAIN_IDS.ZKSYNC_ERA:
      return ZK_SYNC_ERA_DISPLAY_NAME;
    case CHAIN_IDS.CRONOS:
      return CRONOS_DISPLAY_NAME;
    case CHAIN_IDS.CELO:
      return CELO_DISPLAY_NAME;
    case CHAIN_IDS.GNOSIS:
      return GNOSIS_DISPLAY_NAME;
    case CHAIN_IDS.FANTOM:
      return FANTOM_DISPLAY_NAME;
    case CHAIN_IDS.POLYGON_ZKEVM:
      return POLYGON_ZKEVM_DISPLAY_NAME;
    case CHAIN_IDS.MOONBEAM:
      return MOONBEAM_DISPLAY_NAME;
    case CHAIN_IDS.MOONRIVER:
      return MOONRIVER_DISPLAY_NAME;
    default:
      return '';
  }
};
/**
 * Returns true if a token list is available for the current network.
 *
 * @param {*} state
 * @returns Boolean
 */
export function getIsDynamicTokenListAvailable(state) {
  const chainId = getCurrentChainId(state);
  return [
    CHAIN_IDS.MAINNET,
    CHAIN_IDS.BSC,
    CHAIN_IDS.POLYGON,
    CHAIN_IDS.AVALANCHE,
    CHAIN_IDS.LINEA_GOERLI,
    CHAIN_IDS.LINEA_SEPOLIA,
    CHAIN_IDS.LINEA_MAINNET,
    CHAIN_IDS.ARBITRUM,
    CHAIN_IDS.OPTIMISM,
    CHAIN_IDS.BASE,
    CHAIN_IDS.ZKSYNC_ERA,
    CHAIN_IDS.CRONOS,
    CHAIN_IDS.CELO,
    CHAIN_IDS.GNOSIS,
    CHAIN_IDS.FANTOM,
    CHAIN_IDS.POLYGON_ZKEVM,
    CHAIN_IDS.MOONBEAM,
    CHAIN_IDS.MOONRIVER,
    CHAIN_IDS.SEI,
  ].includes(chainId);
}

/**
 * To retrieve the list of tokens detected and saved on the state to detectedToken object.
 *
 * @param {*} state
 * @returns list of token objects
 */
export function getDetectedTokensInCurrentNetwork(state) {
  const currentChainId = getCurrentChainId(state);
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  return state.metamask.allDetectedTokens?.[currentChainId]?.[selectedAddress];
}

export function getAllDetectedTokens(state) {
  return state.metamask.allDetectedTokens;
}

/**
 * To retrieve the list of tokens detected across all chains.
 *
 * @param {*} state
 * @returns list of token objects on all networks
 */
export function getAllDetectedTokensForSelectedAddress(state) {
  const completedOnboarding = getCompletedOnboarding(state);

  if (!completedOnboarding) {
    return {};
  }

  const { address: selectedAddress } = getSelectedInternalAccount(state);

  const tokensByChainId = Object.entries(
    state.metamask.allDetectedTokens || {},
  ).reduce((acc, [chainId, chainTokens]) => {
    const tokensForAddress = chainTokens[selectedAddress];
    if (tokensForAddress) {
      acc[chainId] = tokensForAddress.map((token) => ({
        ...token,
        chainId,
      }));
    }
    return acc;
  }, {});

  return tokensByChainId;
}

/**
 * To check if the token detection is OFF and the network is Mainnet
 * so that the user can skip third party token api fetch
 * and use the static tokenlist from contract-metadata
 *
 * @param {*} state
 * @returns Boolean
 */
export function getIsTokenDetectionInactiveOnMainnet(state) {
  const isMainnet = getIsMainnet(state);
  const useTokenDetection = getUseTokenDetection(state);

  return !useTokenDetection && isMainnet;
}

/**
 * To check for the chainId that supports token detection ,
 * currently it returns true for Ethereum, Polygon, BSC, and Avalanche
 *
 * @param {*} state
 * @returns Boolean
 */
export function getIsTokenDetectionSupported(state) {
  const useTokenDetection = getUseTokenDetection(state);
  const isDynamicTokenListAvailable = getIsDynamicTokenListAvailable(state);

  return useTokenDetection && isDynamicTokenListAvailable;
}

/**
 * To check if the token detection is OFF for the token detection supported networks
 * and the network is not Mainnet
 *
 * @param {*} state
 * @returns Boolean
 */
export function getIstokenDetectionInactiveOnNonMainnetSupportedNetwork(state) {
  const useTokenDetection = getUseTokenDetection(state);
  const isMainnet = getIsMainnet(state);
  const isDynamicTokenListAvailable = getIsDynamicTokenListAvailable(state);

  return isDynamicTokenListAvailable && !useTokenDetection && !isMainnet;
}

/**
 * To get the `getIsSecurityAlertsEnabled` value which determines whether security check is enabled
 *
 * @param {*} state
 * @returns Boolean
 */
export function getIsSecurityAlertsEnabled(state) {
  return state.metamask.securityAlertsEnabled;
}

/**
 * Gets the cached address security alert response for a given address
 *
 * @param {*} state
 * @param {string} address - The address to get security alert for
 * @returns the cached address security alert response for the given address
 */
export function getAddressSecurityAlertResponse(state, address) {
  if (!address) {
    return undefined;
  }
  return state.metamask.addressSecurityAlertResponses?.[address.toLowerCase()];
}

/**
 * Gets the cached url scan result for a given hostname
 *
 * @param {*} state
 * @param {string | undefined} hostname - The hostname to get the url scan result for
 * @returns the cached url scan result for the given hostname or undefined if the hostname is not provided
 */
export function getUrlScanCacheResult(state, hostname) {
  if (!hostname) {
    return undefined;
  }

  return state.metamask.urlScanCache?.[hostname];
}

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
/**
 * Get the state of the `addSnapAccountEnabled` flag.
 *
 * @param {*} state
 * @returns The state of the `addSnapAccountEnabled` flag.
 */
export function getIsAddSnapAccountEnabled(state) {
  return state.metamask.addSnapAccountEnabled;
}
///: END:ONLY_INCLUDE_IF

/**
 * Get the state of the `solanaTestnetsEnabled` remote feature flag.
 *
 * @param {*} state
 * @returns The state of the `solanaTestnetsEnabled` remote feature flag.
 */
export function getIsSolanaTestnetSupportEnabled(state) {
  const { solanaTestnetsEnabled } = getRemoteFeatureFlags(state);
  return Boolean(solanaTestnetsEnabled);
}

export function getIsWatchEthereumAccountEnabled(state) {
  return state.metamask.watchEthereumAccountEnabled;
}

/**
 * Get the state of the `bitcoinSupportEnabled` flag.
 *
 * @param {*} state
 * @returns The state of the `bitcoinSupportEnabled` flag.
 */
export function getIsBitcoinSupportEnabled(state) {
  const { addBitcoinAccount } = getRemoteFeatureFlags(state);
  return Boolean(addBitcoinAccount);
}

/**
 * Get the state of the `solanaSupportEnabled` remote feature flag.
 *
 * @param {*} state
 * @returns The state of the `solanaSupportEnabled` remote feature flag.
 */
export function getIsSolanaSupportEnabled(state) {
  const { addSolanaAccount } = getRemoteFeatureFlags(state);
  return Boolean(addSolanaAccount);
}

/**
 * Checks if the new settings redesign is enabled
 *
 * @param state - The state of the application
 * @returns true if the new settings redesign is enabled, false otherwise
 */
export function getIsNewSettingsEnabled(state) {
  const { settingsRedesign } = getRemoteFeatureFlags(state);
  return Boolean(settingsRedesign);
}

export function getManageInstitutionalWallets(state) {
  return state.metamask.manageInstitutionalWallets;
}
/**
 * Get the state of the `defiPositionsEnabled` remote feature flag.
 *
 * @param {*} state
 * @returns The state of the `defiPositionsEnabled` remote feature flag.
 */
export function getIsDefiPositionsEnabled(state) {
  const { assetsDefiPositionsEnabled } = getRemoteFeatureFlags(state);
  return Boolean(assetsDefiPositionsEnabled);
}

export function getIsCustomNetwork(state) {
  const chainId = getCurrentChainId(state);

  return !CHAIN_ID_TO_RPC_URL_MAP[chainId];
}

/**
 * Get the state of the `neNetworkDiscoverButton` remote feature flag.
 * This flag determines whether the user should see a `Discover` button on the network menu list.
 *
 * @param {*} state
 * @returns The state of the `neNetworkDiscoverButton` remote feature flag.
 */
export function getNetworkDiscoverButtonEnabled(state) {
  const { neNetworkDiscoverButton } = getRemoteFeatureFlags(state);
  return neNetworkDiscoverButton;
}

export function getBlockExplorerLinkText(
  state,
  accountDetailsModalComponent = false,
) {
  const isCustomNetwork = getIsCustomNetwork(state);
  const rpcPrefs = getRpcPrefsForCurrentProvider(state);

  let blockExplorerLinkText = {
    firstPart: 'addBlockExplorer',
    secondPart: '',
  };

  if (rpcPrefs.blockExplorerUrl) {
    blockExplorerLinkText = accountDetailsModalComponent
      ? {
          firstPart: 'blockExplorerView',
          secondPart: getURLHostName(rpcPrefs.blockExplorerUrl),
        }
      : {
          firstPart: 'viewinExplorer',
          secondPart: 'blockExplorerAccountAction',
        };
  } else if (isCustomNetwork === false) {
    blockExplorerLinkText = accountDetailsModalComponent
      ? { firstPart: 'etherscanViewOn', secondPart: '' }
      : {
          firstPart: 'viewOnEtherscan',
          secondPart: 'blockExplorerAccountAction',
        };
  }

  return blockExplorerLinkText;
}

export function getAllAccountsOnNetworkAreEmpty(state) {
  const balances = getMetaMaskCachedBalances(state) ?? {};
  const hasNoNativeFundsOnAnyAccounts = Object.values(balances).every(
    (balance) => balance === '0x0' || balance === '0x00',
  );
  const hasNoTokens = getNumberOfTokens(state) === 0;

  return hasNoNativeFundsOnAnyAccounts && hasNoTokens;
}

export function getUnconnectedAccounts(state, activeTab) {
  const accounts = getMetaMaskAccountsOrdered(state);
  const connectedAccounts = getOrderedConnectedAccountsForConnectedDapp(
    state,
    activeTab,
  );
  const unConnectedAccounts = accounts.filter((account) => {
    return !connectedAccounts.some(
      (connectedAccount) => connectedAccount.address === account.address,
    );
  });
  return unConnectedAccounts;
}

export const getOrderedConnectedAccountsForActiveTab = createDeepEqualSelector(
  (state) => state.activeTab,
  (state) => state.metamask.permissionHistory,
  getMetaMaskAccountsOrdered,
  getAllPermittedAccountsForCurrentTab,
  (activeTab, permissionHistory, orderedAccounts, connectedAccounts) => {
    const permissionHistoryByAccount =
      permissionHistory[activeTab.origin]?.eth_accounts?.accounts || {};

    const connectedAccountsAddresses = connectedAccounts.map(
      (caipAccountId) => {
        const { address } = parseCaipAccountId(caipAccountId);
        return address;
      },
    );

    return orderedAccounts
      .filter((account) => connectedAccountsAddresses.includes(account.address))
      .map((account) => ({
        ...account,
        metadata: {
          ...account.metadata,
          lastActive: permissionHistoryByAccount?.[account.address],
        },
      }))
      .sort(
        ({ lastSelected: lastSelectedA }, { lastSelected: lastSelectedB }) => {
          if (lastSelectedA === lastSelectedB) {
            return 0;
          } else if (lastSelectedA === undefined) {
            return 1;
          } else if (lastSelectedB === undefined) {
            return -1;
          }

          return lastSelectedB - lastSelectedA;
        },
      );
  },
);

export const getUpdatedAndSortedAccounts = createDeepEqualSelector(
  getMetaMaskAccountsOrdered,
  getPinnedAccountsList,
  getHiddenAccountsList,
  getOrderedConnectedAccountsForActiveTab,
  (accounts, pinnedAddresses, hiddenAddresses, connectedAccounts) => {
    connectedAccounts.forEach((connection) => {
      // Find if the connection exists in accounts
      const matchingAccount = accounts.find(
        (account) => account.id === connection.id,
      );

      // If a matching account is found and the connection has metadata, add the connections property to true and lastSelected timestamp from metadata
      if (matchingAccount && connection.metadata) {
        matchingAccount.connections = true;
        matchingAccount.lastSelected = connection.metadata.lastSelected;
      }
    });

    // Find the account with the most recent lastSelected timestamp among accounts with metadata
    const accountsWithLastSelected = accounts.filter(
      (account) => account.connections && account.lastSelected,
    );

    const mostRecentAccount =
      accountsWithLastSelected.length > 0
        ? accountsWithLastSelected.reduce((prev, current) =>
            prev.lastSelected > current.lastSelected ? prev : current,
          )
        : null;

    accounts.forEach((account) => {
      account.pinned = Boolean(pinnedAddresses.includes(account.address));
      account.hidden = Boolean(hiddenAddresses.includes(account.address));
      account.active = Boolean(
        mostRecentAccount && account.id === mostRecentAccount.id,
      );
    });

    const sortedPinnedAccounts = pinnedAddresses
      ?.map((address) =>
        accounts.find((account) => account.address === address),
      )
      .filter((account) =>
        Boolean(
          account &&
            pinnedAddresses.includes(account.address) &&
            !hiddenAddresses?.includes(account.address),
        ),
      );

    const notPinnedAccounts = accounts.filter(
      (account) =>
        !pinnedAddresses.includes(account.address) &&
        !hiddenAddresses.includes(account.address),
    );

    const filteredHiddenAccounts = accounts.filter((account) =>
      hiddenAddresses.includes(account.address),
    );

    const sortedSearchResults = [
      ...sortedPinnedAccounts,
      ...notPinnedAccounts,
      ...filteredHiddenAccounts,
    ];

    return sortedSearchResults;
  },
);

export const getUpdatedAndSortedAccountsWithCaipAccountId =
  createDeepEqualSelector(getUpdatedAndSortedAccounts, (accounts) => {
    return accounts.map((account) => {
      const { namespace, reference } = parseCaipChainId(account.scopes[0]);
      return {
        ...account,
        caipAccountId: `${namespace}:${reference}:${account.address}`,
      };
    });
  });

export const useSafeChainsListValidationSelector = (state) => {
  return state.metamask.useSafeChainsListValidation;
};

export function getShowFiatInTestnets(state) {
  const { showFiatInTestnets } = getPreferences(state);
  return showFiatInTestnets;
}

/**
 * To get the useCurrencyRateCheck flag which to check if the user prefers currency conversion
 *
 * @param {*} state
 * @returns Boolean
 */
export function getUseCurrencyRateCheck(state) {
  return Boolean(state.metamask.useCurrencyRateCheck);
}

export function getNames(state) {
  return state.metamask.names || {};
}

export function getEthereumAddressNames(state) {
  return state.metamask.names?.[NameType.ETHEREUM_ADDRESS] || {};
}

export function getNameSources(state) {
  return state.metamask.nameSources || {};
}

export function getMetaMetricsDataDeletionId(state) {
  return state.metamask.metaMetricsDataDeletionId;
}

export function getMetaMetricsDataDeletionTimestamp(state) {
  return state.metamask.metaMetricsDataDeletionTimestamp;
}

export function getMetaMetricsDataDeletionStatus(state) {
  return state.metamask.metaMetricsDataDeletionStatus;
}

/**
 * To get all installed snaps with proper metadata
 *
 * @param {*} state
 * @returns Boolean
 */
export function getSnapsList(state) {
  const snaps = getSnaps(state);
  return Object.entries(snaps)
    .filter(([_key, snap]) => {
      // Always hide installing Snaps.
      if (snap.status === SnapStatus.Installing) {
        return false;
      }

      // For backwards compatibility, preinstalled Snaps must specify hidden = false to be displayed.
      if (snap.preinstalled) {
        return snap.hidden === false;
      }

      return true;
    })
    .map(([key, snap]) => {
      const targetSubjectMetadata = getTargetSubjectMetadata(state, snap?.id);
      return {
        key,
        id: snap.id,
        iconUrl: targetSubjectMetadata?.iconUrl,
        subjectType: targetSubjectMetadata?.subjectType,
        packageName: stripSnapPrefix(snap.id),
        name: getSnapMetadata(state, snap.id).name,
      };
    });
}

/**
 * To get the state of snaps privacy warning popover.
 *
 * @param state - Redux state object.
 * @returns True if popover has been shown, false otherwise.
 */
export function getSnapsInstallPrivacyWarningShown(state) {
  const { snapsInstallPrivacyWarningShown } = state.metamask;

  if (
    snapsInstallPrivacyWarningShown === undefined ||
    snapsInstallPrivacyWarningShown === null
  ) {
    return false;
  }

  return snapsInstallPrivacyWarningShown;
}

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
export function getsnapsAddSnapAccountModalDismissed(state) {
  const { snapsAddSnapAccountModalDismissed } = state.metamask;

  return snapsAddSnapAccountModalDismissed;
}

export function getSnapRegistry(state) {
  const { snapRegistryList } = state.metamask;
  return snapRegistryList;
}

export function getKeyringSnapAccounts(state) {
  const internalAccounts = getInternalAccounts(state);

  const keyringAccounts = Object.values(internalAccounts).filter(
    (internalAccount) => {
      const { keyring } = internalAccount.metadata;
      return keyring.type === KeyringType.snap;
    },
  );
  return keyringAccounts;
}
///: END:ONLY_INCLUDE_IF

export const getSelectedKeyringByIdOrDefault = createSelector(
  getMetaMaskKeyrings,
  (_state, keyringId) => keyringId,
  (keyrings, keyringId) => {
    return (
      keyrings.find((keyring) => keyring.metadata.id === keyringId) ??
      keyrings[0]
    );
  },
);

export const getHdKeyringIndexByIdOrDefault = createSelector(
  getMetaMaskHdKeyrings,
  (_state, keyringId) => keyringId,
  (keyrings, keyringId) => {
    return (
      // 0 is the default hd keyring index.
      keyrings.findIndex((keyring) => keyring.metadata.id === keyringId) ?? 0
    );
  },
);

export const getKeyringOfSelectedAccount = createSelector(
  getSelectedInternalAccount,
  getMetaMaskKeyrings,
  (selectedAccount, keyrings) => {
    return keyrings.find((keyring) =>
      keyring.accounts.some((account) =>
        isEqualCaseInsensitive(account, selectedAccount.address),
      ),
    );
  },
);

export const getHdKeyringOfSelectedAccountOrPrimaryKeyring = createSelector(
  getKeyringOfSelectedAccount,
  getMetaMaskHdKeyrings,
  (keyringOfSelectedAccount, hdKeyrings) => {
    if (keyringOfSelectedAccount.type === KeyringTypes.hd) {
      return keyringOfSelectedAccount;
    }
    return hdKeyrings[0];
  },
);

// #region permissions selectors

/**
 * Deep equal selector to get the permission subjects object.
 *
 * @param {object} state - The current state.
 * @returns {object} The permissions subjects object.
 */
export const getPermissionSubjectsDeepEqual = createDeepEqualSelector(
  (state) => state.metamask.subjects || {},
  (subjects) => subjects,
);

/**
 * Deep equal selector to get the subject metadata object.
 *
 * @param {object} state - The current state.
 * @returns {object} The subject metadata object.
 */
export const getSubjectMetadataDeepEqual = createDeepEqualSelector(
  (state) => state.metamask.subjectMetadata,
  (metadata) => metadata,
);

/**
 * Selector to get the permission subjects object.
 *
 * @param {object} state - The current state.
 * @returns {object} The permissions subjects object.
 */
export function getPermissionSubjects(state) {
  return state.metamask.subjects || {};
}

/**
 * Selects the permitted accounts from the eth_accounts permission given state
 * and an origin.
 *
 * @param {object} state - The current state.
 * @param {string} origin - The origin/subject to get the permitted accounts for.
 * @returns {Array<string>} An empty array or an array of accounts.
 */
export function getPermittedEVMAccounts(state, origin) {
  return getEVMAccountsFromPermission(
    getCaip25PermissionFromSubject(subjectSelector(state, origin)),
  );
}

export function getPermittedEVMChains(state, origin) {
  return getEVMChainsFromPermission(
    getCaip25PermissionFromSubject(subjectSelector(state, origin)),
  );
}

export function getAllPermittedAccounts(state, origin) {
  const caip25Permission = getCaip25PermissionFromSubject(
    subjectSelector(state, origin),
  );
  const caip25Caveat = getCaip25CaveatFromPermission(caip25Permission);
  return caip25Caveat
    ? getCaipAccountIdsFromCaip25CaveatValue(caip25Caveat.value)
    : [];
}

export function getAllPermittedScopes(state, origin) {
  const caip25Permission = getCaip25PermissionFromSubject(
    subjectSelector(state, origin),
  );
  return caip25Permission ? getAllScopesFromPermission(caip25Permission) : [];
}

/**
 * Selects the permitted accounts from the eth_accounts permission for the
 * origin of the current tab.
 *
 * @param {object} state - The current state.
 * @returns {Array<string>} An empty array or an array of accounts.
 */
export function getPermittedEVMAccountsForCurrentTab(state) {
  return getPermittedEVMAccounts(state, getOriginOfCurrentTab(state));
}

export function getPermittedEVMAccountsForSelectedTab(state, activeTab) {
  return getPermittedEVMAccounts(state, activeTab);
}

export function getAllPermittedAccountsForCurrentTab(state) {
  return getAllPermittedAccounts(state, getOriginOfCurrentTab(state));
}

export function getAllPermittedAccountsForSelectedTab(state, activeTab) {
  return getAllPermittedAccounts(state, activeTab);
}

export function getPermittedEVMChainsForSelectedTab(state, activeTab) {
  return getPermittedEVMChains(state, activeTab);
}

export function getAllPermittedChainsForSelectedTab(state, activeTab) {
  const permittedScopes = getAllPermittedScopes(state, activeTab);
  // our `endowment:caip25` permission can include a special class of `wallet` scopes,
  // see https://github.com/ChainAgnostic/namespaces/tree/main/wallet &
  // https://github.com/ChainAgnostic/namespaces/blob/main/wallet/caip2.md
  // amongs the other chainId scopes. We want to exclude the `wallet` scopes here.
  return permittedScopes.filter((caipChainId) => {
    try {
      const { namespace } = parseCaipChainId(caipChainId);
      return namespace !== KnownCaipNamespace.Wallet;
    } catch (err) {
      return false;
    }
  });
}

/**
 * Returns a map of permitted accounts by origin for all origins.
 *
 * @param {object} state - The current state.
 * @returns {object} Permitted accounts by origin.
 */
export function getPermittedAccountsByOrigin(state) {
  const subjects = getPermissionSubjects(state);
  return Object.keys(subjects).reduce((acc, subjectKey) => {
    const accounts = getAccountsFromSubject(subjects[subjectKey]);
    if (accounts.length > 0) {
      acc[subjectKey] = accounts;
    }
    return acc;
  }, {});
}

export function getPermittedEVMChainsByOrigin(state) {
  const subjects = getPermissionSubjects(state);
  return Object.keys(subjects).reduce((acc, subjectKey) => {
    const chains = getEVMChainsFromSubject(subjects[subjectKey]);
    if (chains.length > 0) {
      acc[subjectKey] = chains;
    }
    return acc;
  }, {});
}

export function getSubjectMetadata(state) {
  return state.metamask.subjectMetadata;
}

/**
 * Returns an array of connected subject objects, with the following properties:
 * - extensionId
 * - key (i.e. origin)
 * - name
 * - icon
 *
 * @param {object} state - The current state.
 * @returns {Array<object>} An array of connected subject objects.
 */
export function getConnectedSubjectsForSelectedAddress(state) {
  const selectedInternalAccount = getSelectedInternalAccount(state);
  const subjects = getPermissionSubjects(state);
  const subjectMetadata = getSubjectMetadata(state);

  const connectedSubjects = [];

  Object.entries(subjects).forEach(([subjectKey, subjectValue]) => {
    const exposedAccounts = getAccountsFromSubject(subjectValue);
    if (!exposedAccounts.includes(selectedInternalAccount.address)) {
      return;
    }

    const { extensionId, name, iconUrl } = subjectMetadata[subjectKey] || {};

    connectedSubjects.push({
      extensionId,
      origin: subjectKey,
      name,
      iconUrl,
    });
  });

  return connectedSubjects;
}

export function getSubjectsWithPermission(state, permissionName) {
  const subjects = getPermissionSubjects(state);

  const connectedSubjects = [];

  Object.entries(subjects).forEach(([origin, { permissions }]) => {
    if (permissions[permissionName]) {
      const { extensionId, name, iconUrl } =
        getTargetSubjectMetadata(state, origin) || {};

      connectedSubjects.push({
        extensionId,
        origin,
        name,
        iconUrl,
      });
    }
  });
  return connectedSubjects;
}

export function getSubjectsWithSnapPermission(state, snapId) {
  const subjects = getPermissionSubjects(state);

  return Object.entries(subjects)
    .filter(
      ([_origin, { permissions }]) =>
        permissions[WALLET_SNAP_PERMISSION_KEY]?.caveats[0].value[snapId],
    )
    .map(([origin, _subject]) => {
      const { extensionId, name, iconUrl } =
        getTargetSubjectMetadata(state, origin) || {};
      return {
        extensionId,
        origin,
        name,
        iconUrl,
      };
    });
}

/**
 * Returns an object mapping addresses to objects mapping origins to connected
 * subject info. Subject info objects have the following properties:
 * - iconUrl
 * - name
 *
 * @param {object} state - The current state.
 * @returns {object} A mapping of addresses to a mapping of origins to
 * connected subject info.
 */
export function getAddressConnectedSubjectMap(state) {
  const subjectMetadata = getSubjectMetadata(state);
  const accountsMap = getPermittedAccountsByOrigin(state);
  const addressConnectedIconMap = {};

  Object.keys(accountsMap).forEach((subjectKey) => {
    const { iconUrl, name } = subjectMetadata[subjectKey] || {};

    accountsMap[subjectKey].forEach((address) => {
      const nameToRender = name || subjectKey;

      addressConnectedIconMap[address] = addressConnectedIconMap[address]
        ? {
            ...addressConnectedIconMap[address],
            [subjectKey]: { iconUrl, name: nameToRender },
          }
        : { [subjectKey]: { iconUrl, name: nameToRender } };
    });
  });

  return addressConnectedIconMap;
}

export const isAccountConnectedToCurrentTab = createDeepEqualSelector(
  getPermittedEVMAccountsForCurrentTab,
  (_state, address) => address,
  (permittedAccounts, address) => {
    return permittedAccounts.some((account) => account === address);
  },
);

// selector helpers
function getCaip25PermissionFromSubject(subject = {}) {
  return subject.permissions?.[Caip25EndowmentPermissionName];
}

function getAccountsFromSubject(subject) {
  return getEVMAccountsFromPermission(getCaip25PermissionFromSubject(subject));
}

function getEVMChainsFromSubject(subject) {
  return getEVMChainsFromPermission(getCaip25PermissionFromSubject(subject));
}

function getEVMAccountsFromPermission(caip25Permission) {
  if (!caip25Permission) {
    return [];
  }
  const caip25Caveat = getCaip25CaveatFromPermission(caip25Permission);
  return caip25Caveat ? getEthAccounts(caip25Caveat.value) : [];
}

function getEVMChainsFromPermission(caip25Permission) {
  if (!caip25Permission) {
    return [];
  }
  const caip25Caveat = getCaip25CaveatFromPermission(caip25Permission);
  return caip25Caveat ? getPermittedEthChainIds(caip25Caveat.value) : [];
}

function subjectSelector(state, origin) {
  return origin && state.metamask.subjects?.[origin];
}

export function getAccountToConnectToActiveTab(state) {
  const selectedInternalAccount = getSelectedInternalAccount(state);
  const connectedAccounts = getPermittedEVMAccountsForCurrentTab(state);

  const {
    metamask: {
      internalAccounts: { accounts },
    },
  } = state;
  const numberOfAccounts = Object.keys(accounts).length;

  if (
    connectedAccounts.length &&
    connectedAccounts.length !== numberOfAccounts
  ) {
    if (
      connectedAccounts.findIndex(
        (address) => address === selectedInternalAccount.address,
      ) === -1
    ) {
      return getInternalAccount(state, selectedInternalAccount.id);
    }
  }

  return undefined;
}

export function getOrderedConnectedAccountsForConnectedDapp(state, activeTab) {
  const {
    metamask: { permissionHistory },
  } = state;

  const permissionHistoryByAccount =
    // eslint-disable-next-line camelcase
    permissionHistory[activeTab.origin]?.eth_accounts?.accounts;
  const orderedAccounts = getMetaMaskAccountsOrdered(state);
  const connectedAccounts = getPermittedEVMAccountsForSelectedTab(
    state,
    activeTab,
  );

  return orderedAccounts
    .filter((account) => connectedAccounts.includes(account.address))
    .filter((account) => isEvmAccountType(account.type))
    .map((account) => ({
      ...account,
      metadata: {
        ...account.metadata,
        lastActive: permissionHistoryByAccount?.[account.address],
      },
    }))
    .sort(
      ({ lastSelected: lastSelectedA }, { lastSelected: lastSelectedB }) => {
        if (lastSelectedA === lastSelectedB) {
          return 0;
        } else if (lastSelectedA === undefined) {
          return 1;
        } else if (lastSelectedB === undefined) {
          return -1;
        }

        return lastSelectedB - lastSelectedA;
      },
    );
}

export function getPermissionsForActiveTab(state) {
  const { activeTab, metamask } = state;
  const { subjects = {} } = metamask;

  const permissions = subjects[activeTab.origin]?.permissions ?? {};
  return Object.keys(permissions).map((parentCapability) => {
    return {
      key: parentCapability,
      value: permissions[parentCapability],
    };
  });
}

export function activeTabHasPermissions(state) {
  const { activeTab, metamask } = state;
  const { subjects = {} } = metamask;

  return Boolean(
    Object.keys(subjects[activeTab.origin]?.permissions || {}).length > 0,
  );
}

/**
 * Get the connected accounts history for all origins.
 *
 * @param {Record<string, unknown>} state - The MetaMask state.
 * @returns {Record<string, { accounts: Record<string, number> }>} An object
 * with account connection histories by origin.
 */
export function getLastConnectedInfo(state) {
  const { permissionHistory = {} } = state.metamask;
  return Object.keys(permissionHistory).reduce((lastConnectedInfo, origin) => {
    if (permissionHistory[origin].eth_accounts) {
      lastConnectedInfo[origin] = JSON.parse(
        JSON.stringify(permissionHistory[origin].eth_accounts),
      );
    }

    return lastConnectedInfo;
  }, {});
}

export function getSnapInstallOrUpdateRequests(state) {
  return Object.values(state.metamask.pendingApprovals)
    .filter(
      ({ type }) =>
        type === 'wallet_installSnap' ||
        type === 'wallet_updateSnap' ||
        type === 'wallet_installSnapResult',
    )
    .map(({ requestData }) => requestData);
}

export function getFirstSnapInstallOrUpdateRequest(state) {
  return getSnapInstallOrUpdateRequests(state)?.[0] ?? null;
}

export function getPermissionsRequests(state) {
  return getApprovalRequestsByType(
    state,
    ApprovalType.WalletRequestPermissions,
  )?.map(({ requestData }) => requestData);
}

export function getFirstPermissionRequest(state) {
  const requests = getPermissionsRequests(state);
  return requests && requests[0] ? requests[0] : null;
}

export function getPermissions(state, origin) {
  return getPermissionSubjects(state)[origin]?.permissions;
}

export function getRequestState(state, id) {
  return state.metamask.pendingApprovals[id]?.requestState;
}

export function getRequestType(state, id) {
  return state.metamask.pendingApprovals[id]?.type;
}

// #endregion permissions selectors

/**
 * Determines whether the update modal should be shown.
 *
 * @param {import('../../ui/store/store').MetaMaskReduxState} state - The MetaMask state.
 * @returns {boolean} True if the update modal should be shown, false otherwise.
 */
export function getShowUpdateModal(state) {
  const {
    metamask: { isUpdateAvailable, updateModalLastDismissedAt, lastUpdatedAt },
  } = state;
  const remoteFeatureFlags = getRemoteFeatureFlags(state);

  const extensionCurrentVersion = semver.valid(
    semver.coerce(global.platform?.getVersion()),
  );
  const extensionUpdatePromptMinimumVersion = semver.valid(
    semver.coerce(remoteFeatureFlags.extensionUpdatePromptMinimumVersion),
  );
  const isExtensionOutdated =
    extensionCurrentVersion && extensionUpdatePromptMinimumVersion
      ? semver.lt(extensionCurrentVersion, extensionUpdatePromptMinimumVersion)
      : false;

  const currentTime = Date.now();
  const updateModalCooldown = 24 * 60 * 60 * 1000; // 24 hours
  const enoughTimePassedSinceLastDismissal = updateModalLastDismissedAt
    ? currentTime - updateModalLastDismissedAt > updateModalCooldown
    : true;
  const enoughTimePassedSinceLastUpdate = lastUpdatedAt
    ? currentTime - lastUpdatedAt > updateModalCooldown
    : true;

  const showUpdateModal =
    isExtensionOutdated &&
    isUpdateAvailable &&
    enoughTimePassedSinceLastDismissal &&
    enoughTimePassedSinceLastUpdate;

  return showUpdateModal;
}

/**
 * Selector to get the allow list for non-zero unused approvals from remote feature flags.
 *
 * @param state - The MetaMask state object
 * @returns {string[]} Array of URL strings for the allow list
 */
export const selectNonZeroUnusedApprovalsAllowList = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) => remoteFeatureFlags?.nonZeroUnusedApprovals ?? [],
);
