import { toUnicode } from 'punycode/punycode.js';
import { SubjectMetadata, SubjectType } from '@metamask/permission-controller';
import { ApprovalType } from '@metamask/controller-utils';
import {
  stripSnapPrefix,
  getLocalizedSnapManifest,
  SnapStatus,
  Snap,
} from '@metamask/snaps-utils';
import { memoize } from 'lodash';
import semver from 'semver';
import { createSelector } from 'reselect';
import { NameType } from '@metamask/name-controller';
import { SnapEndowments } from '@metamask/snaps-rpc-methods';
import { isEvmAccountType } from '@metamask/keyring-api';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { getKnownPropertyNames, Hex, isNullOrUndefined } from '@metamask/utils';
import type { Token, TokenListMap } from '@metamask/assets-controllers';
import type { SnapId } from '@metamask/snaps-sdk';
import { SnapsRegistryMetadata } from '@metamask/snaps-controllers';
import {
  type TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
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
} from '../../shared/constants/network';
import {
  WebHIDConnectedStatuses,
  LedgerTransportTypes,
  HardwareTransportStates,
} from '../../shared/constants/hardware-wallets';
import { KeyringType } from '../../shared/constants/keyring';
import { getIsSmartTransaction } from '../../shared/modules/selectors';

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

import {
  PRIORITY_APPROVAL_TEMPLATE_TYPES,
  TEMPLATED_CONFIRMATION_APPROVAL_TYPES,
} from '../pages/confirmations/confirmation/templates';
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
  MetaMaskSliceState,
} from '../ducks/metamask/metamask';
import {
  getLedgerWebHidConnectedStatus,
  getLedgerTransportStatus,
  AppSliceState,
} from '../ducks/app/app';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import {
  getValueFromWeiHex,
  hexToDecimal,
} from '../../shared/modules/conversion.utils';
import { BackgroundColor } from '../helpers/constants/design-system';
import { NOTIFICATION_DROP_LEDGER_FIREFOX } from '../../shared/notifications';
import { ENVIRONMENT_TYPE_POPUP } from '../../shared/constants/app';
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../shared/constants/multichain/assets';
import { BridgeFeatureFlagsKey } from '../../shared/types/bridge';
import { hasTransactionData } from '../../shared/modules/transaction.utils';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { isSnapIgnoredInProd } from '../helpers/utils/snaps';
import type { MetaMaskReduxState } from '../store/store';
import { EtherDenomination } from '../../shared/constants/common';
import {
  getAllUnapprovedTransactions,
  getCurrentNetworkTransactions,
  getUnapprovedTransactions,
} from './transactions';
// eslint-disable-next-line import/order
import {
  getPermissionSubjects,
  getConnectedSubjectsForAllAddresses,
  getOrderedConnectedAccountsForActiveTab,
  getOrderedConnectedAccountsForConnectedDapp,
  getSubjectMetadata,
} from './permissions';
import { getSelectedInternalAccount, getInternalAccounts } from './accounts';
import {
  getMultichainBalances,
  getMultichainNetworkProviders,
} from './multichain';
import {
  InternalAccountWithBalance,
  InternalAccountWithPinnedHiddenActiveLastSelected,
} from './selectors.types';
import {
  isNetworkImageUrlMapChainId,
  isSwapsChainId,
  isTokenImageMapChainId,
} from './selectors.utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BackgroundStateProxy } from '../../shared/types/metamask';

export type SwapsEthToken = {
  /**
   * The symbol for ETH, namely "ETH".
   */
  symbol: 'ETH';
  /**
   * The name of the ETH currency, "Ether".
   */
  name: 'Ether';
  /**
   * A substitute address for the metaswap-api to recognize the ETH token.
   */
  address: string;
  /**
   * The number of ETH decimals, i.e. 18
   */
  decimals: 18;
  /**
   * The user's ETH balance in decimal wei, with a precision of 4 decimal places.
   */
  balance: string;
  /**
   * The user's ETH balance in decimal ETH/
   */
  string: string;
};

/** `appState` slice selectors */

export const getConfirmationExchangeRates = (state: AppSliceState) => {
  return state.appState.confirmationExchangeRates;
};

export function getAppIsLoading(state: AppSliceState) {
  return state.appState.isLoading;
}

export function getNftIsStillFetchingIndication(state: AppSliceState) {
  return state.appState.isNftStillFetchingIndication;
}

export function getSendInputCurrencySwitched({ appState }: AppSliceState) {
  return appState.sendInputCurrencySwitched;
}

export function getCustomNonceValue(state: AppSliceState) {
  return String(state.appState.customNonceValue);
}

export function getNextSuggestedNonce(state: AppSliceState) {
  return Number(state.appState.nextNonce);
}

export function getShowWhatsNewPopup(state: AppSliceState) {
  return state.appState.showWhatsNewPopup;
}

export function getShowPermittedNetworkToastOpen(state: AppSliceState) {
  return state.appState.showPermittedNetworkToastOpen;
}

export const getMemoizedTxId = createDeepEqualSelector(
  (state: AppSliceState) => state.appState.txId,
  (txId) => txId,
);

export function getNewNftAddedMessage(state: AppSliceState) {
  return state.appState.newNftAddedMessage;
}

export function getRemoveNftMessage(state: AppSliceState) {
  return state.appState.removeNftMessage;
}

/**
 * To retrieve the name of the new Network added using add network form
 *
 * @param state
 * @returns string
 */
export function getNewNetworkAdded(state: AppSliceState) {
  return state.appState.newNetworkAddedName;
}

/**
 * @param state
 */
export function getEditedNetwork(state: AppSliceState) {
  return state.appState.editedNetwork;
}

export function getIsAddingNewNetwork(state: AppSliceState) {
  return state.appState.isAddingNewNetwork;
}

export function getIsMultiRpcOnboarding(state: AppSliceState) {
  return state.appState.isMultiRpcOnboarding;
}

export function getNetworksTabSelectedNetworkConfigurationId(
  state: AppSliceState,
) {
  return state.appState.selectedNetworkConfigurationId;
}

/**
 * To fetch the name of the tokens that are imported from tokens found page
 *
 * @param state
 * @returns
 */
export function getNewTokensImported(state: AppSliceState) {
  return state.appState.newTokensImported;
}

export function getNewTokensImportedError(state: AppSliceState) {
  return state.appState.newTokensImportedError;
}

export function getCustomTokenAmount(state: AppSliceState) {
  return state.appState.customTokenAmount;
}

export function getOnboardedInThisUISession(state: AppSliceState) {
  return state.appState.onboardedInThisUISession;
}

export function getShowBasicFunctionalityModal(state: AppSliceState) {
  return state.appState.showBasicFunctionalityModal;
}

export function getExternalServicesOnboardingToggleState(state: AppSliceState) {
  return state.appState.externalServicesOnboardingToggleState;
}

export function getShowDeleteMetaMetricsDataModal(state: AppSliceState) {
  return state.appState.showDeleteMetaMetricsDataModal;
}

export function getShowDataDeletionErrorModal(state: AppSliceState) {
  return state.appState.showDataDeletionErrorModal;
}

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
export function getKeyringSnapRemovalResult(state: AppSliceState) {
  return state.appState.keyringRemovalSnapModal;
}
///: END:ONLY_INCLUDE_IF

export const getPendingTokens = (state: AppSliceState) =>
  state.appState.pendingTokens;

/** `metamask` slice selectors */

export function getNetworkIdentifier(state: MetaMaskReduxState) {
  const { type, nickname, rpcUrl } = getProviderConfig(state);

  return nickname || rpcUrl || type;
}

export function getMetaMetricsId(state: MetaMaskReduxState) {
  const { metaMetricsId } = state.metamask.MetaMetricsController;
  return metaMetricsId;
}

export function isCurrentProviderCustom(state: MetaMaskReduxState) {
  const provider = getProviderConfig(state);
  return (
    provider.type === NETWORK_TYPES.RPC &&
    !Object.values(CHAIN_IDS).find((chainId) => chainId === provider.chainId)
  );
}

export function getCurrentQRHardwareState(state: MetaMaskReduxState) {
  const { qrHardware } = state.metamask.AppStateController;
  return qrHardware ?? {};
}

export function getIsSigningQRHardwareTransaction(state: MetaMaskReduxState) {
  const qrHardware = getCurrentQRHardwareState(state);
  return (
    !isNullOrUndefined(qrHardware) &&
    typeof qrHardware === 'object' &&
    'sign' in qrHardware &&
    !isNullOrUndefined(qrHardware.sign) &&
    typeof qrHardware.sign === 'object' &&
    'request' in qrHardware.sign &&
    qrHardware.sign.request !== undefined
  );
}

export function getCurrentKeyring(state: MetaMaskReduxState) {
  const internalAccount = getSelectedInternalAccount(state);

  if (!internalAccount) {
    return null;
  }

  return internalAccount.metadata.keyring as {
    type: (typeof KeyringType)[keyof typeof KeyringType];
  };
}

/**
 * The function returns true if network and account details are fetched and
 * both of them support EIP-1559.
 *
 * @param state
 * @param [networkClientId] - The optional network client ID to check network and account for EIP-1559 support
 */
export function checkNetworkAndAccountSupports1559(
  state: MetaMaskReduxState,
  networkClientId?: string,
) {
  const networkSupports1559 = isEIP1559Network(state, networkClientId);
  return networkSupports1559;
}

/**
 * The function returns true if network and account details are fetched and
 * either of them do not support EIP-1559.
 *
 * @param state
 */
export function checkNetworkOrAccountNotSupports1559(
  state: MetaMaskReduxState,
) {
  const networkNotSupports1559 = isNotEIP1559Network(state);
  return networkNotSupports1559;
}

/**
 * Checks if the current wallet is a hardware wallet.
 *
 * @param state
 * @returns
 */
export function isHardwareWallet(state: MetaMaskReduxState) {
  const keyring = getCurrentKeyring(state);
  return Boolean(keyring?.type?.includes('Hardware'));
}

/**
 * Checks if the account supports smart transactions.
 *
 * @param state - The state object.
 * @returns
 */
export function accountSupportsSmartTx(state: MetaMaskReduxState) {
  const accountType = getAccountType(state);
  return Boolean(accountType !== 'snap');
}

/**
 * Get a HW wallet type, e.g. "Ledger Hardware"
 *
 * @param state
 */
export function getHardwareWalletType(state: MetaMaskReduxState) {
  const keyring = getCurrentKeyring(state);
  return isHardwareWallet(state) ? keyring?.type : undefined;
}

export function getAccountType(state: MetaMaskReduxState) {
  const currentKeyring = getCurrentKeyring(state);
  return getAccountTypeForKeyring(currentKeyring);
}

export function getAccountTypeForKeyring(
  keyring: { type: (typeof KeyringType)[keyof typeof KeyringType] } | null,
) {
  if (!keyring) {
    return '';
  }

  const { type } = keyring;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  if (type.startsWith('Custody')) {
    return 'custody';
  }
  ///: END:ONLY_INCLUDE_IF

  switch (type) {
    case KeyringType.trezor:
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
export const getMetaMaskAccounts = createSelector(
  getInternalAccounts,
  getMetaMaskAccountBalances,
  getMetaMaskCachedBalances,
  getMultichainBalances,
  getMultichainNetworkProviders,
  (
    internalAccounts,
    balances,
    cachedBalances,
    multichainBalances,
    multichainNetworkProviders,
  ) =>
    Object.values(internalAccounts).reduce<{
      [address: string]: InternalAccountWithBalance;
    }>((accounts, internalAccount) => {
      // TODO: mix in the identity state here as well, consolidating this
      // selector with `accountsWithSendEtherInfoSelector`
      let account = { ...internalAccount, balance: '0x0' };

      // TODO: `AccountTracker` balances are in hex and `MultichainBalance` are in number.
      // We should consolidate the format to either hex or number
      if (isEvmAccountType(internalAccount.type)) {
        if (balances?.[internalAccount.address]) {
          Object.assign(account, {
            ...balances[internalAccount.address],
          });
        }
      } else {
        const multichainNetwork = multichainNetworkProviders.find((network) =>
          network.isAddressCompatible(internalAccount.address),
        );
        if (multichainNetwork) {
          account = {
            ...account,
            balance:
              multichainBalances?.[internalAccount.id]?.[
                MULTICHAIN_NETWORK_TO_ASSET_TYPES[multichainNetwork.chainId]
              ]?.amount ?? '0',
          };
        }
      }

      if (account.balance === null || account.balance === undefined) {
        Object.assign(account, {
          balance: cachedBalances?.[internalAccount.address] ?? '0x0',
        });
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
 * @returns The selected address.
 */
export function getSelectedAddress(state: MetaMaskReduxState) {
  return getSelectedInternalAccount(state)?.address;
}

export function getInternalAccountByAddress(
  state: MetaMaskReduxState,
  address: string,
) {
  return Object.values(
    state.metamask.AccountsController.internalAccounts.accounts,
  ).find((account) => isEqualCaseInsensitive(account.address, address));
}

export function getMaybeSelectedInternalAccount(state: MetaMaskReduxState) {
  // Same as `getSelectedInternalAccount`, but might potentially be `undefined`:
  // - This might happen during the onboarding
  const accountId =
    state.metamask.AccountsController.internalAccounts?.selectedAccount;
  return accountId
    ? state.metamask.AccountsController.internalAccounts?.accounts[accountId]
    : undefined;
}

export function checkIfMethodIsEnabled(
  state: MetaMaskReduxState,
  methodName: string,
) {
  const internalAccount = getSelectedInternalAccount(state);
  return Boolean(internalAccount.methods.includes(methodName));
}

export function getSelectedInternalAccountWithBalance(
  state: MetaMaskReduxState,
) {
  const selectedAccount = getSelectedInternalAccount(state);
  const rawAccount = getMetaMaskAccountBalances(state)[selectedAccount.address];

  const selectedAccountWithBalance = {
    ...selectedAccount,
    balance: rawAccount ? rawAccount.balance : '0x0',
  };

  return selectedAccountWithBalance;
}

export function getInternalAccount(
  state: MetaMaskReduxState,
  accountId: string,
) {
  return state.metamask.AccountsController.internalAccounts.accounts[accountId];
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
export const getInternalAccountsSortedByKeyring = createSelector(
  getMetaMaskKeyrings,
  getMetaMaskAccounts,
  (keyrings, accounts) => {
    // keep existing keyring order
    const internalAccounts = keyrings
      .map(({ accounts: addresses }) => addresses)
      .flat()
      .map((address) => {
        return accounts[address];
      });

    return internalAccounts;
  },
);

export function getNumberOfTokens(state: MetaMaskReduxState) {
  const { tokens } = state.metamask.TokensController;
  return tokens ? tokens.length : 0;
}

export function getMetaMaskKeyrings(state: MetaMaskReduxState) {
  return state.metamask.KeyringController.keyrings;
}

/**
 * Get account balances state.
 *
 * @param state - Redux state
 * @returns A map of account addresses to account objects (which includes the account balance)
 */
export function getMetaMaskAccountBalances(state: MetaMaskReduxState) {
  return state.metamask.AccountTracker.accounts;
}

export function getMetaMaskCachedBalances(state: MetaMaskReduxState) {
  const chainId = getCurrentChainId(state);
  const account = state.metamask.AccountTracker.accountsByChainId?.[chainId];
  if (account) {
    return getKnownPropertyNames(account).reduce<Record<string, string>>(
      (accumulator, key) => {
        accumulator[key] = account[key].balance ?? '0';
        return accumulator;
      },
      {} as never,
    );
  }
  return {};
}

export function getCrossChainMetaMaskCachedBalances(state: MetaMaskReduxState) {
  const allAccountsByChainId = state.metamask.AccountTracker.accountsByChainId;
  return getKnownPropertyNames(allAccountsByChainId).reduce<
    Record<string, Record<string, string | number>>
  >((acc, topLevelKey) => {
    acc[topLevelKey] = getKnownPropertyNames(
      allAccountsByChainId[topLevelKey],
    ).reduce<Record<string, string | number>>((innerAcc, innerKey) => {
      innerAcc[innerKey] =
        allAccountsByChainId[topLevelKey][innerKey].balance ?? '0';
      return innerAcc;
    }, {});

    return acc;
  }, {});
}
/**
 * Based on the current account address, return the balance for the native token of all chain networks on that account
 *
 * @param state - Redux state
 * @returns An object of tokens with balances for the given account. Data relationship will be chainId => balance
 */
export function getSelectedAccountNativeTokenCachedBalanceByChainId(
  state: MetaMaskReduxState,
) {
  const { accountsByChainId } = state.metamask.AccountTracker;
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  return getKnownPropertyNames(accountsByChainId).reduce<Record<Hex, string>>(
    (balancesByChainId, chainId) => {
      const accounts = accountsByChainId[chainId];
      balancesByChainId[chainId] = accounts[selectedAddress].balance ?? '0';
      return balancesByChainId;
    },
    {},
  );
}

/**
 * Based on the current account address, query for all tokens across all chain networks on that account,
 * including the native tokens, without hardcoding any native token information.
 *
 * @param state - Redux state
 * @returns An object mapping chain IDs to arrays of tokens (including native tokens) with balances.
 */
export function getSelectedAccountTokensAcrossChains(
  state: MetaMaskReduxState,
) {
  const { allTokens } = state.metamask.TokensController;
  const selectedAddress = getSelectedInternalAccount(state).address;

  const tokensByChain: Record<
    Hex,
    (Token & Partial<{ chainId: Hex; balance: string; isNative: boolean }>)[]
  > = {};

  const nativeTokenBalancesByChainId =
    getSelectedAccountNativeTokenCachedBalanceByChainId(state);

  const chainIds = new Set([
    ...getKnownPropertyNames(allTokens ?? {}),
    ...getKnownPropertyNames(nativeTokenBalancesByChainId ?? {}),
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
      });
    }
  });

  return tokensByChain;
}

/**
 * Retrieves native token information (symbol, decimals, name) for a given chainId from the state,
 * without hardcoding any values.
 *
 * @param state - Redux state
 * @param chainId - Chain ID
 * @returns Native token information
 */
function getNativeTokenInfo(state: MetaMaskReduxState, chainId: Hex) {
  const { networkConfigurationsByChainId } = state.metamask.NetworkController;

  const networkConfig = networkConfigurationsByChainId?.[chainId];

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

  return { symbol: AssetType.native, decimals: 18, name: 'Native Token' };
}

/**
 * Get ordered (by keyrings) accounts with InternalAccount and balance
 *
 * @returns An array of internal accounts with balance
 */
export const getMetaMaskAccountsOrdered = createSelector(
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

export function isBalanceCached(state: MetaMaskReduxState) {
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const selectedAccountBalance =
    getMetaMaskAccountBalances(state)[selectedAddress]?.balance;
  const cachedBalance = getSelectedAccountCachedBalance(state);

  return Boolean(!selectedAccountBalance && cachedBalance);
}

export function getSelectedAccountCachedBalance(state: MetaMaskReduxState) {
  const cachedBalances = getMetaMaskCachedBalances(state);
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  return cachedBalances?.[selectedAddress];
}

export function getAllTokens(state: MetaMaskReduxState) {
  return state.metamask.TokensController.allTokens;
}

/**
 * Get a flattened list of all ERC-20 tokens owned by the user.
 * Includes all tokens from all chains and accounts.
 *
 * @returns An arrya of all ERC-20 tokens owned by the user in a flat array.
 */
export const selectAllTokensFlat = createSelector(
  getAllTokens,
  (tokensByAccountByChain) => {
    const tokensByAccountArray = Object.values(tokensByAccountByChain);

    return tokensByAccountArray.reduce<Token[]>((acc, tokensByAccount) => {
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
export function getAllDomains(state: MetaMaskReduxState) {
  return state.metamask.SelectedNetworkController.domains;
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

export const getWatchedToken = (transactionMeta: TransactionMeta) =>
  createSelector(
    [getSelectedAccount, getAllTokens],
    (selectedAccount, detectedTokens) => {
      const { chainId } = transactionMeta;

      const selectedToken = detectedTokens?.[chainId]?.[
        selectedAccount?.address ?? ''
      ]?.find(
        (token) =>
          toChecksumHexAddress(token.address) ===
          toChecksumHexAddress(transactionMeta.txParams.to ?? ''),
      );

      return selectedToken;
    },
  );

export function getTargetAccount(
  state: MetaMaskReduxState,
  targetAddress: string,
) {
  const accounts = getMetaMaskAccounts(state);
  return accounts[targetAddress];
}

export const getTokenExchangeRates = (state: MetaMaskReduxState) => {
  const chainId = getCurrentChainId(state);
  const contractMarketData =
    state.metamask.TokenRatesController.marketData?.[chainId] ?? {};
  return getKnownPropertyNames(contractMarketData).reduce<
    Record<Hex, number | null>
  >((acc, address) => {
    const marketData = contractMarketData[address];
    acc[address] = marketData?.price ?? null;
    return acc;
  }, {});
};

export const getCrossChainTokenExchangeRates = (state: MetaMaskReduxState) => {
  const contractMarketData =
    state.metamask.TokenRatesController.marketData ?? {};

  return getKnownPropertyNames(contractMarketData).reduce<
    Record<Hex, Record<Hex, number>>
  >((acc, topLevelKey) => {
    acc[topLevelKey] = getKnownPropertyNames(
      contractMarketData[topLevelKey],
    ).reduce<Record<Hex, number>>((innerAcc, innerKey) => {
      innerAcc[innerKey] = contractMarketData[topLevelKey][innerKey]?.price;
      return innerAcc;
    }, {});

    return acc;
  }, {});
};

/**
 * Get market data for tokens on the current chain
 *
 * @param state
 */
export const getTokensMarketData = (state: MetaMaskReduxState) => {
  const chainId = getCurrentChainId(state);
  return state.metamask.TokenRatesController.marketData?.[chainId];
};

export const getMarketData = (state: MetaMaskReduxState) => {
  return state.metamask.TokenRatesController.marketData;
};

export function getAddressBook(state: MetaMaskReduxState) {
  const chainId = getCurrentChainId(state);
  if (!state.metamask.AddressBookController.addressBook[chainId]) {
    return [];
  }
  return Object.values(
    state.metamask.AddressBookController.addressBook[chainId],
  );
}

export function getEnsResolutionByAddress(state, address) {
  if (state.metamask.ensResolutionsByAddress[address]) {
    const ensResolution = state.metamask.ensResolutionsByAddress[address];
    // ensResolution is a punycode encoded string hence toUnicode is used to decode it from same package
    const normalizedEnsResolution = toUnicode(ensResolution);
    return normalizedEnsResolution;
  }

  const entry =
    getAddressBookEntry(state, address) ??
    getInternalAccountByAddress(state, address);

  return entry && 'name' in entry ? entry.name : '';
}

export function getAddressBookEntry(
  state: MetaMaskReduxState,
  address: string,
) {
  const addressBook = getAddressBook(state);
  const entry = addressBook.find((contact) =>
    isEqualCaseInsensitive(contact.address, address),
  );
  return entry;
}

export function getAddressBookEntryOrAccountName(
  state: MetaMaskReduxState,
  address: string,
) {
  const entry = getAddressBookEntry(state, address);
  if (entry && entry.name !== '') {
    return entry.name;
  }

  const internalAccount = Object.values(getInternalAccounts(state)).find(
    (account) => isEqualCaseInsensitive(account.address, address),
  );

  return internalAccount?.metadata.name || address;
}

export function getAccountName(
  accounts: InternalAccount[],
  accountAddress: string,
) {
  const account = accounts.find((internalAccount) =>
    isEqualCaseInsensitive(internalAccount.address, accountAddress),
  );
  return account && account.metadata.name !== '' ? account.metadata.name : '';
}

export function accountsWithSendEtherInfoSelector(state: MetaMaskReduxState) {
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

export function getAccountsWithLabels(state: MetaMaskReduxState) {
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

export function getCurrentAccountWithSendEtherInfo(state: MetaMaskReduxState) {
  const { address: currentAddress } = getSelectedInternalAccount(state);
  const accounts = accountsWithSendEtherInfoSelector(state);

  return getAccountByAddress(accounts, currentAddress);
}

export function getTargetAccountWithSendEtherInfo(
  state: MetaMaskReduxState,
  targetAddress: string,
) {
  const accounts = accountsWithSendEtherInfoSelector(state);
  return getAccountByAddress(accounts, targetAddress);
}

export function getCurrentEthBalance(state: MetaMaskReduxState) {
  return getCurrentAccountWithSendEtherInfo(state)?.balance;
}

export const getNetworkConfigurationIdByChainId = createDeepEqualSelector(
  (state: MetaMaskReduxState) =>
    state.metamask.NetworkController.networkConfigurationsByChainId,
  (networkConfigurationsByChainId) =>
    getKnownPropertyNames(networkConfigurationsByChainId).reduce<
      Record<Hex, string>
    >((acc, chainId) => {
      const network = networkConfigurationsByChainId[chainId];
      const selectedRpcEndpoint =
        network.rpcEndpoints[network.defaultRpcEndpointIndex];
      acc[chainId] = selectedRpcEndpoint.networkClientId;
      return acc;
    }, {}),
);

export const selectNetworkConfigurationByChainId = createSelector(
  getNetworkConfigurationsByChainId,
  (_state: MetaMaskReduxState, chainId: Hex) => chainId,
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

export const selectConversionRateByChainId = createSelector(
  selectNetworkConfigurationByChainId,
  (state: MetaMaskReduxState) => state,
  (networkConfiguration, state) => {
    if (!networkConfiguration) {
      return undefined;
    }

    const { nativeCurrency } = networkConfiguration;
    return state.metamask.CurrencyController.currencyRates[nativeCurrency]
      ?.conversionRate;
  },
);

export const selectNftsByChainId = createSelector(
  getSelectedInternalAccount,
  (state: MetaMaskReduxState) => state.metamask.NftController.allNfts,
  (_state: MetaMaskReduxState, chainId: Hex) => chainId,
  (selectedAccount, nfts, chainId) => {
    return nfts?.[selectedAccount.address]?.[chainId] ?? [];
  },
);

export const selectNftContractsByChainId = createSelector(
  getSelectedInternalAccount,
  (state: MetaMaskReduxState) => state.metamask.NftController.allNftContracts,
  (_state: MetaMaskReduxState, chainId: Hex) => chainId,
  (selectedAccount, nftContracts, chainId) => {
    return nftContracts?.[selectedAccount.address]?.[chainId] ?? [];
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

export function getRequestingNetworkInfo(
  state: MetaMaskReduxState,
  chainIds: Hex[],
) {
  // If chainIds is undefined, set it to an empty array
  let processedChainIds = chainIds === undefined ? [] : chainIds;

  // If chainIds is a string, convert it to an array
  if (typeof processedChainIds === 'string') {
    processedChainIds = [processedChainIds];
  }

  // Ensure chainIds is flattened if it contains nested arrays
  const flattenedChainIds = processedChainIds.flat();

  // Filter the non-test networks to include only those with chainId in flattenedChainIds
  return Object.values(getNetworkConfigurationsByChainId(state)).filter(
    (network) =>
      !TEST_CHAINS.find((testChainId) => testChainId === network.chainId) &&
      flattenedChainIds.includes(network.chainId),
  );
}

/**
 * Provides information about the last network change if present
 *
 * @param state - Redux state object.
 * @returns An object with information about the network with the given networkClientId
 */
export function getSwitchedNetworkDetails(state: MetaMaskReduxState) {
  const { switchedNetworkDetails } = state.metamask.AppStateController;
  const networkConfigurations = getNetworkConfigurationsByChainId(state);

  if (switchedNetworkDetails) {
    const switchedNetwork = Object.values(networkConfigurations).filter(
      (network) =>
        network.rpcEndpoints.some(
          (rpcEndpoint) =>
            rpcEndpoint.networkClientId ===
            switchedNetworkDetails.networkClientId,
        ),
    )[0];
    return {
      nickname: switchedNetwork.name,
      imageUrl: isNetworkImageUrlMapChainId(switchedNetwork.chainId)
        ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[switchedNetwork.chainId]
        : null,
      origin: switchedNetworkDetails?.origin,
    };
  }

  return null;
}

export function getCurrentCurrency(state: MetaMaskReduxState) {
  return state.metamask.CurrencyController.currentCurrency;
}

export function getTotalUnapprovedCount(state: MetaMaskReduxState) {
  return state.metamask.ApprovalController.pendingApprovalCount ?? 0;
}

export function getQueuedRequestCount(state: MetaMaskReduxState) {
  return state.metamask.QueuedRequestController.queuedRequestCount ?? 0;
}

export function getSlides(state: MetaMaskSliceState) {
  return state.metamask.AppStateController.slides ?? [];
}

export function getTotalUnapprovedMessagesCount(state: MetaMaskReduxState) {
  const { unapprovedPersonalMsgCount = 0, unapprovedTypedMessagesCount = 0 } =
    state.metamask.SignatureController;

  const { unapprovedDecryptMsgCount = 0 } =
    state.metamask.DecryptMessageController;

  const { unapprovedEncryptionPublicKeyMsgCount = 0 } =
    state.metamask.EncryptionPublicKeyController;

  return (
    unapprovedPersonalMsgCount +
    unapprovedDecryptMsgCount +
    unapprovedEncryptionPublicKeyMsgCount +
    unapprovedTypedMessagesCount
  );
}

export function getTotalUnapprovedSignatureRequestCount(
  state: MetaMaskReduxState,
) {
  const { unapprovedPersonalMsgCount = 0, unapprovedTypedMessagesCount = 0 } =
    state.metamask.SignatureController;

  return unapprovedPersonalMsgCount + unapprovedTypedMessagesCount;
}

export function getUnapprovedTxCount(state: MetaMaskReduxState) {
  const unapprovedTxs = getUnapprovedTransactions(state);
  return Object.keys(unapprovedTxs).length;
}

export const getUnapprovedConfirmations = createDeepEqualSelector(
  (state: MetaMaskReduxState) =>
    state.metamask.ApprovalController.pendingApprovals ?? {},
  (pendingApprovals) => Object.values(pendingApprovals),
);

export function getUnapprovedTemplatedConfirmations(state: MetaMaskReduxState) {
  const unapprovedConfirmations = getUnapprovedConfirmations(state);
  return unapprovedConfirmations.filter((approval) =>
    TEMPLATED_CONFIRMATION_APPROVAL_TYPES.includes(approval.type),
  );
}

export const getPrioritizedUnapprovedTemplatedConfirmations = createSelector(
  getUnapprovedTemplatedConfirmations,
  (unapprovedTemplatedConfirmations) =>
    unapprovedTemplatedConfirmations.filter(({ type }) =>
      PRIORITY_APPROVAL_TEMPLATE_TYPES.includes(type),
    ),
);

export function getSuggestedTokens(state: MetaMaskReduxState) {
  return (
    getUnapprovedConfirmations(state)?.filter(({ type, requestData }) => {
      return (
        type === ApprovalType.WatchAsset &&
        'asset' in requestData &&
        typeof requestData.asset === 'object' &&
        requestData.asset !== null &&
        'tokenId' in requestData.asset &&
        requestData.asset.tokenId === undefined
      );
    }) ?? []
  );
}

export function getSuggestedNfts(state: MetaMaskReduxState) {
  return (
    getUnapprovedConfirmations(state)?.filter(({ requestData, type }) => {
      return (
        type === ApprovalType.WatchAsset &&
        'asset' in requestData &&
        typeof requestData.asset === 'object' &&
        requestData.asset !== null &&
        'tokenId' in requestData.asset &&
        requestData?.asset?.tokenId !== undefined
      );
    }) ?? []
  );
}

export function getIsMainnet(state: MetaMaskReduxState) {
  const chainId = getCurrentChainId(state);
  return chainId === CHAIN_IDS.MAINNET;
}

export function getIsLineaMainnet(state: MetaMaskReduxState) {
  const chainId = getCurrentChainId(state);
  return chainId === CHAIN_IDS.LINEA_MAINNET;
}

export function getIsTestnet(state: MetaMaskReduxState) {
  const currentChainId = getCurrentChainId(state);
  return (
    TEST_CHAINS.find((chainId) => chainId === currentChainId) !== undefined
  );
}

export function getIsNonStandardEthChain(state: MetaMaskReduxState) {
  return !(getIsMainnet(state) || getIsTestnet(state) || process.env.IN_TEST);
}

export function getPreferences(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.preferences ?? {};
}

export function getShowTestNetworks(state: MetaMaskReduxState) {
  const { showTestNetworks } = getPreferences(state);
  return Boolean(showTestNetworks);
}

export function getPetnamesEnabled(state: MetaMaskReduxState) {
  const { petnamesEnabled = true } = getPreferences(state);
  return petnamesEnabled;
}

export function getIsTokenNetworkFilterEqualCurrentNetwork(
  state: MetaMaskReduxState,
) {
  const chainId = getCurrentChainId(state);
  const { tokenNetworkFilter: tokenNetworkFilterValue } = getPreferences(state);
  const tokenNetworkFilter = tokenNetworkFilterValue ?? {};
  if (
    Object.keys(tokenNetworkFilter).length === 1 &&
    Object.keys(tokenNetworkFilter)[0] === chainId
  ) {
    return true;
  }
  return false;
}

/**
 * Returns an object indicating which networks
 * tokens should be shown on in the portfolio view.
 *
 * @param {*} state
 * @returns {Record<Hex, boolean>}
 */
export function getTokenNetworkFilter(state: MetaMaskSliceState) {
  const currentChainId = getCurrentChainId(state);
  const { tokenNetworkFilter } = getPreferences(state);

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
}

export function getUseTransactionSimulations(state: MetaMaskReduxState) {
  return Boolean(
    state.metamask.PreferencesController.useTransactionSimulations,
  );
}

export function getRedesignedConfirmationsEnabled(state: MetaMaskReduxState) {
  const { redesignedConfirmationsEnabled } = getPreferences(state);
  return redesignedConfirmationsEnabled;
}

export function getRedesignedTransactionsEnabled(state: MetaMaskReduxState) {
  const { redesignedTransactionsEnabled } = getPreferences(state);
  return redesignedTransactionsEnabled;
}

export function getFeatureNotificationsEnabled(state: MetaMaskReduxState) {
  const { featureNotificationsEnabled = false } = getPreferences(state);
  return featureNotificationsEnabled;
}

export function getShowExtensionInFullSizeView(state: MetaMaskReduxState) {
  const { showExtensionInFullSizeView } = getPreferences(state);
  return Boolean(showExtensionInFullSizeView);
}

export function getTestNetworkBackgroundColor(state: MetaMaskReduxState) {
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

export function getShouldShowFiat(state: MetaMaskReduxState) {
  const currentChainId = getCurrentChainId(state);
  const isTestnet =
    TEST_NETWORK_IDS.find((networkId) => networkId === currentChainId) !==
    undefined;
  const { showFiatInTestnets } = getPreferences(state);
  const conversionRate = getConversionRate(state);
  const useCurrencyRateCheck = getUseCurrencyRateCheck(state);
  const isConvertibleToFiat = Boolean(useCurrencyRateCheck && conversionRate);

  if (isTestnet) {
    return showFiatInTestnets && isConvertibleToFiat;
  }

  return isConvertibleToFiat;
}

export function getShouldHideZeroBalanceTokens(state: MetaMaskReduxState) {
  const { hideZeroBalanceTokens } = getPreferences(state);
  return hideZeroBalanceTokens;
}

export function getAdvancedInlineGasShown(state: MetaMaskReduxState) {
  return Boolean(
    state.metamask.PreferencesController.featureFlags.advancedInlineGas,
  );
}

export function getUseNonceField(state: MetaMaskReduxState) {
  const isSmartTransaction = getIsSmartTransaction(state);
  return Boolean(
    !isSmartTransaction && state.metamask.PreferencesController.useNonceField,
  );
}

/**
 * @param {string} svgString - The raw SVG string to make embeddable.
 * @returns {string} The embeddable SVG string.
 */
const getEmbeddableSvg = memoize(
  (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`,
);

export function getTargetSubjectMetadata(
  state: MetaMaskReduxState,
  origin: string,
) {
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
export const rawStateSelector = (state: MetaMaskReduxState) => state;

/**
 * Input selector used to retrieve Snaps that are added to Snaps Directory.
 *
 * @param state - Redux state object.
 * @returns Object - Containing verified Snaps from the Directory.
 */
const selectVerifiedSnapsRegistry = (state: MetaMaskReduxState) =>
  state.metamask.SnapsRegistry.database?.verifiedSnaps;

/**
 * Input selector providing a way to pass a snapId as an argument.
 *
 * @param _state - Redux state object.
 * @param snapId - ID of a Snap.
 * @returns string - ID of a Snap that can be used as input selector.
 */
const selectSnapId = (_state: MetaMaskReduxState, snapId: SnapId) => snapId;

/**
 * Input selector for retrieving all installed Snaps.
 *
 * @param state - Redux state object.
 * @returns Object - Installed Snaps.
 */
export const selectInstalledSnaps = (state: MetaMaskReduxState) =>
  state.metamask.SnapController.snaps;

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

    getKnownPropertyNames(installedSnaps).forEach((snapId) => {
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
const getInterfaces = (state: MetaMaskReduxState) =>
  state.metamask.SnapInterfaceController.interfaces;

/**
 * Input selector providing a way to pass a Snap interface ID as an argument.
 *
 * @param _state - Redux state object.
 * @param interfaceId - ID of a Snap interface.
 * @returns ID of a Snap Interface that can be used as input selector.
 */
const selectInterfaceId = (_state: MetaMaskReduxState, interfaceId: string) =>
  interfaceId;

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
const selectOrigins = (
  _state: MetaMaskReduxState,
  origins: Record<string, string>,
) => origins;

/**
 * Retrieve metadata for multiple subjects (origins).
 *
 * @param state - Redux state object.
 * @param origins - Object containing keys that represent subject's identification.
 * @returns Key:value object containing metadata attached to each subject key.
 */
export const getMultipleTargetsSubjectMetadata = createDeepEqualSelector(
  [rawStateSelector, selectOrigins],
  (state: MetaMaskReduxState, origins: Record<string, string>) => {
    return getKnownPropertyNames(origins ?? {}).reduce<
      Record<string, SubjectMetadata>
    >((originsMetadata, origin) => {
      originsMetadata[origin] = getTargetSubjectMetadata(state, origin);
      return originsMetadata;
    }, {});
  },
);

export function getRpcPrefsForCurrentProvider(state: MetaMaskReduxState) {
  const { rpcPrefs } = getProviderConfig(state);
  return rpcPrefs;
}

export function getKnownMethodData(state: MetaMaskReduxState, data: Hex) {
  const { knownMethodData, use4ByteResolution } =
    state.metamask.PreferencesController;

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

export function getFeatureFlags(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.featureFlags;
}

export function getOriginOfCurrentTab(state: MetaMaskReduxState) {
  return state.activeTab.origin;
}

export function getDefaultHomeActiveTabName(state: MetaMaskReduxState) {
  return state.metamask.AppStateController.defaultHomeActiveTabName;
}

export function getIpfsGateway(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.ipfsGateway;
}

export function getUseExternalServices(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.useExternalServices;
}

export function getUSDConversionRate(state: MetaMaskReduxState) {
  return state.metamask.CurrencyController.currencyRates[
    getProviderConfig(state).ticker
  ]?.usdConversionRate;
}

export const getUSDConversionRateByChainId = (chainId: Hex) =>
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

export function getCurrencyRates(state: MetaMaskReduxState) {
  return state.metamask.CurrencyController.currencyRates;
}

export function getWeb3ShimUsageStateForOrigin(
  state: MetaMaskReduxState,
  origin: string,
) {
  return state.metamask.AlertController.web3ShimUsageOrigins?.[origin];
}

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
 * @param {object} state - the redux state object
 * @param {string} overrideChainId - the chainId to override the current chainId
 * @returns {SwapsEthToken} The token object representation of the currently
 * selected account's ETH balance, as expected by the Swaps API.
 */

export function getSwapsDefaultToken(
  state: MetaMaskReduxState,
  overrideChainId = null,
) {
  const selectedAccount = getSelectedAccount(state);
  const balance = selectedAccount?.balance;
  const currentChainId = getCurrentChainId(state);

  const chainId = overrideChainId ?? currentChainId;
  const defaultTokenObject = isSwapsChainId(chainId)
    ? SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId]
    : {
        symbol: 'ETH',
        name: 'Ether',
        address: '',
        decimals: 18,
        iconUrl: '',
      };

  return {
    ...defaultTokenObject,
    balance: hexToDecimal(balance ?? '0x0'),
    string: getValueFromWeiHex({
      value: balance ?? '0x0',
      numberOfDecimals: 4,
      toDenomination: EtherDenomination.ETH,
    }),
  };
}

export function getIsSwapsChain(
  state: MetaMaskReduxState,
  overrideChainId: Hex,
) {
  const currentChainId = getCurrentChainId(state);
  const chainId = overrideChainId ?? currentChainId;
  const isNotDevelopment =
    process.env.METAMASK_ENVIRONMENT !== 'development' &&
    process.env.METAMASK_ENVIRONMENT !== 'testing';
  return isNotDevelopment
    ? ALLOWED_PROD_SWAPS_CHAIN_IDS.find((id) => id === chainId) !== undefined
    : ALLOWED_DEV_SWAPS_CHAIN_IDS.find((id) => id === chainId) !== undefined;
}

export function getIsBridgeChain(
  state: MetaMaskReduxState,
  overrideChainId?: Hex,
) {
  const currentChainId = getCurrentChainId(state);
  const chainId = overrideChainId ?? currentChainId;
  return ALLOWED_BRIDGE_CHAIN_IDS.find((id) => id === chainId) !== undefined;
}

function getBridgeFeatureFlags(state: {
  metamask: Pick<BackgroundStateProxy, 'BridgeController'>;
}) {
  return state.metamask.BridgeController.bridgeState?.bridgeFeatureFlags;
}

export const getIsBridgeEnabled = createSelector(
  [getBridgeFeatureFlags, getUseExternalServices],
  (bridgeFeatureFlags, shouldUseExternalServices) => {
    return (
      (shouldUseExternalServices &&
        bridgeFeatureFlags?.[BridgeFeatureFlagsKey.EXTENSION_CONFIG]
          ?.support) ??
      false
    );
  },
);

export function getNativeCurrencyImage(state: MetaMaskReduxState) {
  const chainId = getCurrentChainId(state);
  return isTokenImageMapChainId(chainId)
    ? CHAIN_ID_TOKEN_IMAGE_MAP[chainId]
    : undefined;
}

export function getNativeCurrencyForChain(chainId: Hex) {
  return isTokenImageMapChainId(chainId)
    ? CHAIN_ID_TOKEN_IMAGE_MAP[chainId]
    : undefined;
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

export const getMemoizedAddressBook = createDeepEqualSelector(
  getAddressBook,
  (addressBook) => addressBook,
);

export const selectERC20TokensByChain = createDeepEqualSelector(
  (state: MetaMaskReduxState) =>
    state.metamask.TokenListController.tokensChainsCache,
  (erc20TokensByChain) => erc20TokensByChain,
);

export const selectERC20Tokens = createDeepEqualSelector(
  (state: MetaMaskReduxState) => state.metamask.TokenListController.tokenList,
  (erc20Tokens) => erc20Tokens,
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
      ? (STATIC_MAINNET_TOKEN_LIST as TokenListMap)
      : remoteTokenList;
  },
);

export const getMemoizedMetadataContract = createSelector(
  (state: MetaMaskReduxState, _address: string) => getTokenList(state),
  (_state, address) => address,
  (tokenList, address) => tokenList[address?.toLowerCase()],
);

export const getMetadataContractName = createSelector(
  getMemoizedMetadataContract,
  (entry) => entry?.name ?? '',
);

export const getTxData = (state: MetaMaskReduxState) =>
  state.confirmTransaction.txData;

export const getUnapprovedTransaction = createDeepEqualSelector(
  getUnapprovedTransactions,
  (_: MetaMaskReduxState, transactionId: Hex) => transactionId,
  (unapprovedTxs: Record<Hex, TransactionMeta>, transactionId: Hex) =>
    Object.values(unapprovedTxs).find(({ id }) => id === transactionId),
);

export const getTransaction = createDeepEqualSelector(
  (state: MetaMaskReduxState) => getCurrentNetworkTransactions(state),
  (_: MetaMaskReduxState, transactionId: Hex) => transactionId,
  (unapprovedTxs, transactionId) => {
    return (
      Object.values(unapprovedTxs).find(({ id }) => id === transactionId) ?? {}
    );
  },
);

export const getFullTxData = createDeepEqualSelector(
  getTxData,
  (
    state: MetaMaskReduxState,
    transactionId: Hex,
    status: TransactionStatus,
  ) => {
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
    if ('simulationFails' in transaction && transaction?.simulationFails) {
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
    const sitesList: Record<
      string,
      (typeof connectedSubjectsForAllAddresses)[keyof typeof connectedSubjectsForAllAddresses][number] & {
        addresses: string[];
        addressToNameMap: Record<string, string>;
      }
    > = {};
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

export function getShouldShowAggregatedBalancePopover(
  state: MetaMaskReduxState,
) {
  const { shouldShowAggregatedBalancePopover } = getPreferences(state);
  return shouldShowAggregatedBalancePopover;
}

export const getConnectedSnapsList = createDeepEqualSelector(
  getSnapsList,
  (snapsData) => {
    const snapsList: Record<string, ReturnType<typeof getSnapsList>[number]> =
      {};

    Object.values(snapsData).forEach((snap) => {
      if (!snapsList[snap.name]) {
        snapsList[snap.name] = snap;
      }
    });

    return snapsList;
  },
);

export const getMemoizedCurrentChainId = createDeepEqualSelector(
  getCurrentChainId,
  (chainId) => chainId,
);

export const getMemoizedUnapprovedPersonalMessages = createDeepEqualSelector(
  (state: MetaMaskReduxState) =>
    state.metamask.SignatureController.unapprovedPersonalMsgs,
  (unapprovedPersonalMsgs) => unapprovedPersonalMsgs,
);

export const getMemoizedUnapprovedTypedMessages = createDeepEqualSelector(
  (state: MetaMaskReduxState) =>
    state.metamask.SignatureController.unapprovedTypedMessages,
  (unapprovedTypedMessages) => unapprovedTypedMessages,
);

export function getSnaps(state: MetaMaskReduxState) {
  return state.metamask.SnapController.snaps;
}

export function getLocale(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.currentLocale;
}

export const getSnap = createDeepEqualSelector(
  getSnaps,
  (_: MetaMaskReduxState, snapId: SnapId) => snapId,
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
    return Object.values(snaps).reduce<Record<SnapId, SnapsRegistryMetadata>>(
      (snapsMetadata, snap) => {
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
      },
      {},
    );
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
  (_: MetaMaskReduxState, snapId: SnapId) => snapId,
  (metadata, snapId) => {
    return (
      metadata[snapId] ?? {
        name: snapId ? stripSnapPrefix(snapId) : null,
      }
    );
  },
);

export const getEnabledSnaps = createDeepEqualSelector(getSnaps, (snaps) => {
  return Object.values(snaps).reduce<Record<SnapId, Snap>>((acc, cur) => {
    if (cur.enabled) {
      acc[cur.id] = cur;
    }
    return acc;
  }, {});
});

export const getPreinstalledSnaps = createDeepEqualSelector(
  getSnaps,
  (snaps) => {
    return Object.values(snaps).reduce<Record<SnapId, Snap>>((acc, snap) => {
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

function getAllSnapInsights(state: MetaMaskReduxState) {
  return state.metamask.SnapInsightsController.insights;
}

export const getSnapInsights = createDeepEqualSelector(
  getAllSnapInsights,
  (_: MetaMaskReduxState, id: SnapId) => id,
  (insights, id) => insights?.[id],
);

/**
 * Get an object of announcement IDs and if they are allowed or not.
 *
 * @param state
 */
function getAllowedAnnouncementIds(state: MetaMaskReduxState) {
  const currentKeyring = getCurrentKeyring(state);
  const currentKeyringIsLedger = currentKeyring?.type === KeyringType.ledger;
  const isFirefox = window.navigator.userAgent.includes('Firefox');

  return {
    [NOTIFICATION_DROP_LEDGER_FIREFOX]: currentKeyringIsLedger && isFirefox,
  };
}

/**
 * Announcements are managed by the announcement controller and referenced by
 * `state.metamask.AnnouncementController.announcements`. This function returns a list of announcements
 * the can be shown to the user. This list includes all announcements that do not
 * have a truthy `isShown` property.
 *
 * The returned announcements are sorted by date.
 *
 * @param state - the redux state object
 * @returns An array of announcements that can be shown to the user
 */

export function getSortedAnnouncementsToShow(state: MetaMaskReduxState) {
  const announcements = Object.values(
    state.metamask.AnnouncementController.announcements,
  );
  const allowedAnnouncementIds: Record<number, boolean> =
    getAllowedAnnouncementIds(state);
  const announcementsToShow = announcements.filter(
    (announcement) =>
      !announcement.isShown && allowedAnnouncementIds[announcement.id],
  );
  const announcementsSortedByDate = announcementsToShow.sort(
    (a, b) => new Date(b.date).getSeconds() - new Date(a.date).getSeconds(),
  );
  return announcementsSortedByDate;
}

/**
 * @param state
 */
export function getOrderedNetworksList(state: MetaMaskReduxState) {
  return state.metamask.NetworkOrderController.orderedNetworkList;
}

export function getPinnedAccountsList(state: MetaMaskReduxState) {
  return state.metamask.AccountOrderController.pinnedAccountList;
}

export function getHiddenAccountsList(state: MetaMaskReduxState) {
  return state.metamask.AccountOrderController.hiddenAccountList;
}

export function getShowRecoveryPhraseReminder(state: MetaMaskReduxState) {
  const {
    recoveryPhraseReminderLastShown,
    recoveryPhraseReminderHasBeenShown,
  } = state.metamask.AppStateController;

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
export function getNumberOfAllUnapprovedTransactionsAndMessages(
  state: MetaMaskReduxState,
) {
  const unapprovedTxs = getAllUnapprovedTransactions(state);
  const queuedRequestCount = getQueuedRequestCount(state);

  const allUnapprovedMessages = {
    ...unapprovedTxs,
    ...state.metamask.DecryptMessageController.unapprovedDecryptMsgs,
    ...state.metamask.SignatureController.unapprovedPersonalMsgs,
    ...state.metamask.EncryptionPublicKeyController
      .unapprovedEncryptionPublicKeyMsgs,
    ...state.metamask.SignatureController.unapprovedTypedMessages,
  };
  const numUnapprovedMessages = Object.keys(allUnapprovedMessages).length;
  return numUnapprovedMessages + queuedRequestCount;
}

export const getCurrentNetwork = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  getCurrentChainId,

  /**
   * Get the current network configuration.
   *
   * @param networkConfigurationsByChainId
   * @param currentChainId
   * @returns networkConfiguration - Configuration for the current network.
   */
  (networkConfigurationsByChainId, currentChainId) => {
    const currentNetwork = networkConfigurationsByChainId[currentChainId];

    const rpcEndpoint =
      currentNetwork.rpcEndpoints[currentNetwork.defaultRpcEndpointIndex];

    const blockExplorerUrl = currentNetwork.defaultBlockExplorerUrlIndex
      ? currentNetwork.blockExplorerUrls?.[
          currentNetwork.defaultBlockExplorerUrlIndex
        ]
      : '';

    return {
      chainId: currentNetwork.chainId,
      id: rpcEndpoint.networkClientId,
      nickname: currentNetwork.name,
      rpcUrl: rpcEndpoint.url,
      ticker: currentNetwork.nativeCurrency,
      blockExplorerUrl,
      rpcPrefs: {
        blockExplorerUrl,
        imageUrl: isNetworkImageUrlMapChainId(currentNetwork.chainId)
          ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[currentNetwork.chainId]
          : '',
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
    getKnownPropertyNames(sitesList).forEach((siteKey) => {
      const connectedNetwork = Object.values(networks).find((network) =>
        network.rpcEndpoints.some(
          (rpcEndpoint) => rpcEndpoint.networkClientId === domains[siteKey],
        ),
      );

      // For the testnets, if we do not have an image, we will have a fallback string
      Object.assign(sitesList[siteKey], {
        networkIconUrl: isNetworkImageUrlMapChainId(connectedNetwork?.chainId)
          ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[connectedNetwork.chainId]
          : '',
      });
      Object.assign(sitesList[siteKey], {
        networkName: connectedNetwork?.name || currentNetwork?.nickname || '',
      });
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
export function getNetworkToAutomaticallySwitchTo(state: MetaMaskReduxState) {
  const numberOfUnapprovedTx =
    getNumberOfAllUnapprovedTransactionsAndMessages(state);

  // This block autoswitches chains based on the last chain used
  // for a given dapp, when there are no pending confimrations
  // This allows the user to be connected on one chain
  // for one dapp, and automatically change for another
  const selectedTabOrigin = getOriginOfCurrentTab(state);
  const useRequestQueue = getUseRequestQueue(state);
  if (
    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP &&
    getIsUnlocked(state) &&
    useRequestQueue &&
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

export function getShowTermsOfUse(state: MetaMaskReduxState) {
  const { termsOfUseLastAgreed } = state.metamask.AppStateController;

  if (!termsOfUseLastAgreed) {
    return true;
  }
  return (
    new Date(termsOfUseLastAgreed).getTime() <
    new Date(TERMS_OF_USE_LAST_UPDATED).getTime()
  );
}

export function getLastViewedUserSurvey(state: MetaMaskReduxState) {
  return state.metamask.AppStateController.lastViewedUserSurvey;
}

export function getShowOutdatedBrowserWarning(state: MetaMaskReduxState) {
  const { outdatedBrowserWarningLastShown } = state.metamask.AppStateController;
  if (!outdatedBrowserWarningLastShown) {
    return true;
  }
  const currentTime = new Date().getTime();
  return currentTime - outdatedBrowserWarningLastShown >= DAY * 2;
}

export function getOnboardingDate(state: MetaMaskReduxState) {
  return state.metamask.AppStateController.onboardingDate;
}

export function getShowBetaHeader(state: MetaMaskReduxState) {
  return state.metamask.AppStateController.showBetaHeader;
}

export function getShowPermissionsTour(state: MetaMaskReduxState) {
  return state.metamask.AppStateController.showPermissionsTour;
}

export function getShowNetworkBanner(state: MetaMaskReduxState) {
  return state.metamask.AppStateController.showNetworkBanner;
}

export function getShowAccountBanner(state: MetaMaskReduxState) {
  return state.metamask.AppStateController.showAccountBanner;
}
/**
 * To get the useTokenDetection flag which determines whether a static or dynamic token list is used
 *
 * @param state
 * @returns Boolean
 */
export function getUseTokenDetection(state: MetaMaskReduxState) {
  return Boolean(state.metamask.PreferencesController.useTokenDetection);
}

/**
 * To get the useNftDetection flag which determines whether we autodetect NFTs
 *
 * @param state
 * @returns Boolean
 */
export function getUseNftDetection(state: MetaMaskReduxState) {
  return Boolean(state.metamask.PreferencesController.useNftDetection);
}

/**
 * To get the useBlockie flag which determines whether we show blockies or Jazzicons
 *
 * @param state
 * @returns Boolean
 */
export function getUseBlockie(state: MetaMaskReduxState) {
  return Boolean(state.metamask.PreferencesController.useBlockie);
}

/**
 * To get the openSeaEnabled flag which determines whether we use OpenSea's API
 *
 * @param state
 * @returns Boolean
 */
export function getOpenSeaEnabled(state: MetaMaskReduxState) {
  return Boolean(state.metamask.PreferencesController.openSeaEnabled);
}

/**
 * To get the `theme` value which determines which theme is selected
 *
 * @param state
 * @returns Boolean
 */
export function getTheme(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.theme;
}

export function doesAddressRequireLedgerHidConnection(
  state: MetaMaskReduxState & AppSliceState,
  address: string,
) {
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
    getKnownPropertyNames(networkConfigurationsByChainId).reduce<
      Record<Hex, NetworkConfiguration>
    >((acc, chainId) => {
      const network = networkConfigurationsByChainId[chainId];
      if (
        showTestNetworks ||
        !TEST_CHAINS.find((testChainId) => testChainId === chainId)
      ) {
        acc[chainId] = network;
      }
      return acc;
    }, {}),
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
        FEATURED_NETWORK_CHAIN_IDS.find(
          (featuredNetworkId) => featuredNetworkId === chainId,
        ),
    );
  },
);

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
        FEATURED_NETWORK_CHAIN_IDS.find(
          (featuredNetworkId) => featuredNetworkId === chainId,
        ),
    );
  },
);

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

    return getKnownPropertyNames(networkConfigurations).reduce<string[]>(
      (acc, chainId) => {
        const network = networkConfigurations[chainId];
        if (
          chainId === currentChainId ||
          FEATURED_NETWORK_CHAIN_IDS.find(
            (featuredNetworkId) => featuredNetworkId === chainId,
          )
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
 * To retrieve the maxBaseFee and priorityFee the user has set as default
 *
 * @param state
 */
export function getAdvancedGasFeeValues(state: MetaMaskReduxState) {
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
  return state.metamask.PreferencesController.advancedGasFee[
    getCurrentChainId(state)
  ];
}

/**
 * To get the name of the network that support token detection based in chainId.
 *
 * @param state
 * @returns string e.g. ethereum, bsc or polygon
 */
export const getTokenDetectionSupportNetworkByChainId = (
  state: MetaMaskReduxState,
) => {
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
 * @param state
 * @returns Boolean
 */
export function getIsDynamicTokenListAvailable(state: MetaMaskReduxState) {
  const currentChainId = getCurrentChainId(state);
  return Boolean(
    [
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
    ].find((chainId) => chainId === currentChainId),
  );
}

/**
 * To retrieve the list of tokens detected and saved on the state to detectedToken object.
 *
 * @param state
 * @returns list of token objects
 */
export function getDetectedTokensInCurrentNetwork(state: MetaMaskReduxState) {
  const currentChainId = getCurrentChainId(state);
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  return state.metamask.TokensController.allDetectedTokens?.[currentChainId]?.[
    selectedAddress
  ];
}

export function getAllDetectedTokens(state: MetaMaskReduxState) {
  return state.metamask.TokensController.allDetectedTokens;
}

/**
 * To retrieve the list of tokens detected across all chains.
 *
 * @param state
 * @returns list of token objects on all networks
 */
export function getAllDetectedTokensForSelectedAddress(
  state: MetaMaskReduxState,
) {
  const completedOnboarding = getCompletedOnboarding(state);

  if (!completedOnboarding) {
    return {};
  }

  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const { allDetectedTokens } = state.metamask.TokensController ?? {};
  const tokensByChainId = getKnownPropertyNames(allDetectedTokens).reduce<
    Record<Hex, Token[]>
  >((acc, chainId) => {
    const chainTokens = allDetectedTokens[chainId];
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
 * @param state
 * @returns Boolean
 */
export function getIsTokenDetectionInactiveOnMainnet(
  state: MetaMaskReduxState,
) {
  const isMainnet = getIsMainnet(state);
  const useTokenDetection = getUseTokenDetection(state);

  return !useTokenDetection && isMainnet;
}

/**
 * To check for the chainId that supports token detection ,
 * currently it returns true for Ethereum Mainnet, Polygon, BSC, and Avalanche
 *
 * @param state
 * @returns Boolean
 */
export function getIsTokenDetectionSupported(state: MetaMaskReduxState) {
  const useTokenDetection = getUseTokenDetection(state);
  const isDynamicTokenListAvailable = getIsDynamicTokenListAvailable(state);

  return useTokenDetection && isDynamicTokenListAvailable;
}

/**
 * To check if the token detection is OFF for the token detection supported networks
 * and the network is not Mainnet
 *
 * @param state
 * @returns Boolean
 */
export function getIstokenDetectionInactiveOnNonMainnetSupportedNetwork(
  state: MetaMaskReduxState,
) {
  const useTokenDetection = getUseTokenDetection(state);
  const isMainnet = getIsMainnet(state);
  const isDynamicTokenListAvailable = getIsDynamicTokenListAvailable(state);

  return isDynamicTokenListAvailable && !useTokenDetection && !isMainnet;
}

/**
 * To get the `useRequestQueue` value which determines whether we use a request queue infront of provider api calls. This will have the effect of implementing per-dapp network switching.
 *
 * @param state
 * @returns Boolean
 */
export function getUseRequestQueue(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.useRequestQueue;
}

/**
 * To get the `getIsSecurityAlertsEnabled` value which determines whether security check is enabled
 *
 * @param state
 * @returns Boolean
 */
export function getIsSecurityAlertsEnabled(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.securityAlertsEnabled;
}

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
/**
 * Get the state of the `addSnapAccountEnabled` flag.
 *
 * @param state
 * @returns The state of the `addSnapAccountEnabled` flag.
 */
export function getIsAddSnapAccountEnabled(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.addSnapAccountEnabled;
}
///: END:ONLY_INCLUDE_IF

export function getIsWatchEthereumAccountEnabled(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.watchEthereumAccountEnabled;
}

/**
 * Get the state of the `bitcoinSupportEnabled` flag.
 *
 * @param state
 * @returns The state of the `bitcoinSupportEnabled` flag.
 */
export function getIsBitcoinSupportEnabled(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.bitcoinSupportEnabled;
}

///: BEGIN:ONLY_INCLUDE_IF(solana)
/**
 * Get the state of the `solanaSupportEnabled` flag.
 *
 * @param state
 * @returns The state of the `solanaSupportEnabled` flag.
 */
export function getIsSolanaSupportEnabled(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.solanaSupportEnabled;
}
///: END:ONLY_INCLUDE_IF

/**
 * Get the state of the `bitcoinTestnetSupportEnabled` flag.
 *
 * @param state
 * @returns The state of the `bitcoinTestnetSupportEnabled` flag.
 */
export function getIsBitcoinTestnetSupportEnabled(state: MetaMaskReduxState) {
  return state.metamask.PreferencesController.bitcoinTestnetSupportEnabled;
}

export function getIsCustomNetwork(state: MetaMaskReduxState) {
  return Boolean(
    getKnownPropertyNames(CHAIN_ID_TO_RPC_URL_MAP).find(
      (chainId) => chainId === getCurrentChainId(state),
    ),
  );
}

export function getBlockExplorerLinkText(
  state: MetaMaskReduxState,
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

export function getAllAccountsOnNetworkAreEmpty(state: MetaMaskReduxState) {
  const balances = getMetaMaskCachedBalances(state) ?? {};
  const hasNoNativeFundsOnAnyAccounts = Object.values(balances).every(
    (balance) => balance === '0x0' || balance === '0x00',
  );
  const hasNoTokens = getNumberOfTokens(state) === 0;

  return hasNoNativeFundsOnAnyAccounts && hasNoTokens;
}

export function getShouldShowSeedPhraseReminder(state: MetaMaskReduxState) {
  const { seedPhraseBackedUp } = state.metamask.OnboardingController;
  const { dismissSeedBackUpReminder } = state.metamask.PreferencesController;
  const { tokens } = state.metamask.TokensController;

  // if there is no account, we don't need to show the seed phrase reminder
  const accountBalance = getSelectedInternalAccount(state)
    ? getCurrentEthBalance(state)
    : 0;

  return (
    seedPhraseBackedUp === false &&
    (parseInt(accountBalance, 16) > 0 || tokens.length > 0) &&
    dismissSeedBackUpReminder === false
  );
}

export function getUnconnectedAccounts(
  state: MetaMaskReduxState,
  activeTab: MetaMaskReduxState['activeTab'],
) {
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

export const getUpdatedAndSortedAccounts = createDeepEqualSelector(
  getMetaMaskAccountsOrdered,
  getPinnedAccountsList,
  getHiddenAccountsList,
  getOrderedConnectedAccountsForActiveTab,
  (accounts, pinnedAddresses, hiddenAddresses, connectedAccounts) => {
    connectedAccounts.forEach((connection) => {
      // Find if the connection exists in accounts
      const matchingAccount = (accounts.find(
        (account) => account.id === connection.id,
      ) ?? {}) as InternalAccountWithPinnedHiddenActiveLastSelected & {
        connections: boolean;
      };

      // If a matching account is found and the connection has metadata, add the connections property to true and lastSelected timestamp from metadata
      if (matchingAccount && connection.metadata) {
        matchingAccount.connections = true;
        matchingAccount.lastSelected = connection.metadata.lastSelected ?? 0;
      }
    });

    // Find the account with the most recent lastSelected timestamp among accounts with metadata
    const accountsWithLastSelected = accounts.filter(
      (
        account,
      ): account is InternalAccountWithBalance & {
        connections: boolean;
        lastSelected: number;
      } =>
        'connections' in account &&
        account.connections !== undefined &&
        'lastSelected' in account &&
        account.lastSelected !== undefined,
    );

    const mostRecentAccount =
      accountsWithLastSelected.length > 0
        ? accountsWithLastSelected.reduce((prev, current) =>
            prev.lastSelected > current.lastSelected ? prev : current,
          )
        : null;

    (accounts as InternalAccountWithPinnedHiddenActiveLastSelected[]).forEach(
      (account) => {
        account.pinned = Boolean(pinnedAddresses.includes(account.address));
        account.hidden = Boolean(hiddenAddresses.includes(account.address));
        account.active = Boolean(
          mostRecentAccount && account.id === mostRecentAccount.id,
        );
      },
    );

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

export const useSafeChainsListValidationSelector = (
  state: MetaMaskReduxState,
) => {
  return state.metamask.PreferencesController.useSafeChainsListValidation;
};

export function getShowFiatInTestnets(state: MetaMaskReduxState) {
  const { showFiatInTestnets } = getPreferences(state);
  return showFiatInTestnets;
}

/**
 * To get the useCurrencyRateCheck flag which to check if the user prefers currency conversion
 *
 * @param state
 * @returns Boolean
 */
export function getUseCurrencyRateCheck(state: MetaMaskReduxState) {
  return Boolean(state.metamask.PreferencesController.useCurrencyRateCheck);
}

export function getNames(state: MetaMaskReduxState) {
  return state.metamask.NameController.names ?? {};
}

export function getEthereumAddressNames(state: MetaMaskReduxState) {
  return state.metamask.NameController.names?.[NameType.ETHEREUM_ADDRESS] ?? {};
}

export function getNameSources(state: MetaMaskReduxState) {
  return state.metamask.NameController.nameSources ?? {};
}

export function getMetaMetricsDataDeletionId(state: MetaMaskReduxState) {
  return state.metamask.MetaMetricsDataDeletionController
    .metaMetricsDataDeletionId;
}

export function getMetaMetricsDataDeletionTimestamp(state: MetaMaskReduxState) {
  return state.metamask.MetaMetricsDataDeletionController
    .metaMetricsDataDeletionTimestamp;
}

export function getMetaMetricsDataDeletionStatus(state: MetaMaskReduxState) {
  return state.metamask.MetaMetricsDataDeletionController
    .metaMetricsDataDeletionStatus;
}

export function getRemoteFeatureFlags(state: MetaMaskReduxState) {
  return state.metamask.RemoteFeatureFlagController.remoteFeatureFlags;
}

/**
 * To get all installed snaps with proper metadata
 *
 * @param state
 * @returns Boolean
 */
export function getSnapsList(state: MetaMaskReduxState) {
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
export function getSnapsInstallPrivacyWarningShown(state: MetaMaskReduxState) {
  const { snapsInstallPrivacyWarningShown } = state.metamask.AppStateController;

  if (
    snapsInstallPrivacyWarningShown === undefined ||
    snapsInstallPrivacyWarningShown === null
  ) {
    return false;
  }

  return snapsInstallPrivacyWarningShown;
}

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
export function getsnapsAddSnapAccountModalDismissed(
  state: MetaMaskReduxState,
) {
  const { snapsAddSnapAccountModalDismissed } =
    state.metamask.PreferencesController;

  return snapsAddSnapAccountModalDismissed;
}

export function getSnapRegistry(state: MetaMaskReduxState) {
  const { snapRegistryList } = state.metamask.PreferencesController;
  return snapRegistryList;
}

export function getKeyringSnapAccounts(state: MetaMaskReduxState) {
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
