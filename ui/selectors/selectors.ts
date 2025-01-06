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
import { InternalAccount } from '@metamask/keyring-internal-api';
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
  ProviderConfigState,
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
  MetaMaskSliceControllerState,
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
import { MultichainNetworkIds } from '../../shared/constants/multichain/networks';
import { EtherDenomination } from '../../shared/constants/common';
import {
  getAllUnapprovedTransactions,
  getCurrentNetworkTransactions,
  getUnapprovedTransactions,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedTypedMessagesSelector,
} from './transactions';
// eslint-disable-next-line import/order
import {
  getPermissionSubjects,
  getConnectedSubjectsForAllAddresses,
  getOrderedConnectedAccountsForActiveTab,
  getOrderedConnectedAccountsForConnectedDapp,
  getSubjectMetadata,
} from './permissions';
import {
  getSelectedInternalAccount,
  getInternalAccounts,
  AccountsMetaMaskState,
} from './accounts';
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

/**
 * Input selector for reusing the same state object.
 * Used in memoized selectors created with createSelector
 * when raw state is needed to be passed to other selectors
 * used to achieve re-usability.
 *
 * @param state - Redux state object.
 * @returns Object - Redux state object.
 */
export const rawStateSelector = <T>(state: T) => state;

export function getNetworkIdentifier(state: ProviderConfigState) {
  const { type, nickname, rpcUrl } = getProviderConfig(state);

  return nickname || rpcUrl || type;
}

export function getMetaMetricsId(
  state: MetaMaskSliceControllerState<'MetaMetricsController'>,
) {
  const { metaMetricsId } = state.metamask.MetaMetricsController;
  return metaMetricsId;
}

export function isCurrentProviderCustom(state: ProviderConfigState) {
  const provider = getProviderConfig(state);
  return (
    provider.type === NETWORK_TYPES.RPC &&
    !Object.values(CHAIN_IDS).find((chainId) => chainId === provider.chainId)
  );
}

export function getCurrentQRHardwareState(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  const { qrHardware } = state.metamask.AppStateController;
  return qrHardware ?? {};
}

export function getIsSigningQRHardwareTransaction(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
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

export const getCurrentKeyring = createSelector(
  getSelectedInternalAccount,
  (internalAccount) => {
    if (!internalAccount) {
      return null;
    }

    return internalAccount.metadata.keyring as {
      type: (typeof KeyringType)[keyof typeof KeyringType];
    };
  },
);

/**
 * The function returns true if network and account details are fetched and
 * both of them support EIP-1559.
 *
 * @param state
 * @param [networkClientId] - The optional network client ID to check network and account for EIP-1559 support
 */
export function checkNetworkAndAccountSupports1559(
  state: Parameters<typeof isEIP1559Network>[0],
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
  state: Parameters<typeof isNotEIP1559Network>[0],
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
export function isHardwareWallet(state: AccountsMetaMaskState) {
  const keyring = getCurrentKeyring(state);
  return Boolean(keyring?.type?.includes('Hardware'));
}

/**
 * Checks if the account supports smart transactions.
 *
 * @param state - The state object.
 * @returns
 */
export function accountSupportsSmartTx(state: AccountsMetaMaskState) {
  const accountType = getAccountType(state);
  return Boolean(accountType !== 'snap');
}

/**
 * Get a HW wallet type, e.g. "Ledger Hardware"
 *
 * @param state
 */
export function getHardwareWalletType(state: AccountsMetaMaskState) {
  const keyring = getCurrentKeyring(state);
  return isHardwareWallet(state) ? keyring?.type : undefined;
}

export function getAccountType(state: AccountsMetaMaskState) {
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

export const getMetaMaskCachedBalances = createDeepEqualSelector(
  rawStateSelector<
    ProviderConfigState &
      Parameters<typeof getMetaMaskAccountBalancesByChainId>[0]
  >,
  getCurrentChainId,
  (state, chainId) => {
    const account = getMetaMaskAccountBalancesByChainId(state, chainId);
    if (account) {
      return getKnownPropertyNames(account).reduce<{
        [address: string]: string;
      }>((accumulator, key) => {
        accumulator[key] = account[key].balance ?? '0';
        return accumulator;
      }, {});
    }
    return {};
  },
);

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
                MULTICHAIN_NETWORK_TO_ASSET_TYPES[
                  multichainNetwork.chainId as MultichainNetworkIds
                ][0]
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
export function getSelectedAddress(state: AccountsMetaMaskState) {
  return getSelectedInternalAccount(state)?.address;
}

export function getInternalAccountByAddress(
  state: AccountsMetaMaskState,
  address: string,
) {
  return Object.values(
    state.metamask.AccountsController.internalAccounts.accounts,
  ).find((account) => isEqualCaseInsensitive(account.address, address));
}

export function getMaybeSelectedInternalAccount(state: AccountsMetaMaskState) {
  // Same as `getSelectedInternalAccount`, but might potentially be `undefined`:
  // - This might happen during the onboarding
  const accountId =
    state.metamask.AccountsController.internalAccounts?.selectedAccount;
  return accountId
    ? state.metamask.AccountsController.internalAccounts?.accounts[accountId]
    : undefined;
}

export function checkIfMethodIsEnabled(
  state: AccountsMetaMaskState,
  methodName: string,
) {
  const internalAccount = getSelectedInternalAccount(state);
  return Boolean(internalAccount.methods.includes(methodName));
}

export const getSelectedInternalAccountWithBalance = createDeepEqualSelector(
  getSelectedInternalAccount,
  getMetaMaskAccountBalances,
  (selectedAccount, accountBalances) => {
    const rawAccount = accountBalances[selectedAccount.address];

    const selectedAccountWithBalance = {
      ...selectedAccount,
      balance: rawAccount ? rawAccount.balance : '0x0',
    };

    return selectedAccountWithBalance;
  },
);

export function getInternalAccount(
  state: AccountsMetaMaskState,
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

/**
 * Retrieves native token information (symbol, decimals, name) for a given chainId from the state,
 * without hardcoding any values.
 *
 * @param state - Redux state
 * @param chainId - Chain ID
 * @returns Native token information
 */
const getNativeTokenInfo = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  (
    _state: Parameters<typeof getNetworkConfigurationsByChainId>[0],
    chainId: Hex,
  ) => chainId,
  (networkConfigurationsByChainId, chainId) => {
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
  },
);

export function getNumberOfTokens(
  state: MetaMaskSliceControllerState<'TokensController'>,
) {
  const { tokens } = state.metamask.TokensController;
  return tokens ? tokens.length : 0;
}

export function getMetaMaskKeyrings(
  state: MetaMaskSliceControllerState<'KeyringController'>,
) {
  return state.metamask.KeyringController.keyrings;
}

/**
 * Get account balances state.
 *
 * @param state - Redux state
 * @returns A map of account addresses to account objects (which includes the account balance)
 */
export function getMetaMaskAccountBalances(
  state: MetaMaskSliceControllerState<'AccountTracker'>,
) {
  return state.metamask.AccountTracker.accounts;
}

export function getMetaMaskAllAccountBalancesByChainId(
  state: MetaMaskSliceControllerState<'AccountTracker'>,
) {
  return state.metamask.AccountTracker.accountsByChainId;
}

export function getMetaMaskAccountBalancesByChainId(
  state: MetaMaskSliceControllerState<'AccountTracker'>,
  chainId: Hex,
) {
  return state.metamask.AccountTracker.accountsByChainId?.[chainId];
}

export const getCrossChainMetaMaskCachedBalances = createDeepEqualSelector(
  getMetaMaskAllAccountBalancesByChainId,
  (allAccountsByChainId) => {
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
  },
);

/**
 * Based on the current account address, return the balance for the native token of all chain networks on that account
 *
 * @returns An object of tokens with balances for the given account. Data relationship will be chainId => balance
 */
export const getSelectedAccountNativeTokenCachedBalanceByChainId =
  createDeepEqualSelector(
    getMetaMaskAllAccountBalancesByChainId,
    getSelectedInternalAccount,
    (accountsByChainId, { address: selectedAddress }) => {
      return getKnownPropertyNames(accountsByChainId).reduce<
        Record<Hex, string>
      >((balancesByChainId, chainId) => {
        const accounts = accountsByChainId[chainId];
        balancesByChainId[chainId] = accounts[selectedAddress].balance ?? '0';
        return balancesByChainId;
      }, {});
    },
  );

export const getSelectedAccountChainIds = createDeepEqualSelector(
  getAllTokens,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  (allTokens, nativeTokenBalancesByChainId) =>
    new Set([
      ...getKnownPropertyNames(allTokens ?? {}),
      ...getKnownPropertyNames(nativeTokenBalancesByChainId ?? {}),
    ]),
);

/**
 * Based on the current account address, query for all tokens across all chain networks on that account,
 * including the native tokens, without hardcoding any native token information.
 *
 * @param state - Redux state
 * @returns An object mapping chain IDs to arrays of tokens (including native tokens) with balances.
 */
export const getSelectedAccountTokensAcrossChains = createDeepEqualSelector(
  rawStateSelector<
    AccountsMetaMaskState &
      MetaMaskSliceControllerState<'AccountTracker' | 'TokensController'> &
      ProviderConfigState
  >,
  getAllTokens,
  getSelectedInternalAccount,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getSelectedAccountChainIds,
  (
    state,
    allTokens,
    { address: selectedAddress },
    nativeTokenBalancesByChainId,
    chainIds,
  ) => {
    const tokensByChain: Record<
      Hex,
      (Token & Partial<{ chainId: Hex; balance: string; isNative: boolean }>)[]
    > = {};

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
  },
);

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

export const getSelectedAccountCachedBalance = createDeepEqualSelector(
  getMetaMaskCachedBalances,
  getSelectedInternalAccount,
  (cachedBalances, { address: selectedAddress }) =>
    cachedBalances?.[selectedAddress as keyof typeof cachedBalances],
);

export const isBalanceCached = createDeepEqualSelector(
  getMetaMaskAccountBalances,
  getSelectedInternalAccount,
  getSelectedAccountCachedBalance,
  (accountBalances, { address: selectedAddress }, cachedBalance) => {
    const selectedAccountBalance = accountBalances[selectedAddress]?.balance;

    return Boolean(!selectedAccountBalance && cachedBalance);
  },
);

export function getAllTokens(
  state: MetaMaskSliceControllerState<'TokensController'>,
) {
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
export function getAllDomains(
  state: MetaMaskSliceControllerState<'SelectedNetworkController'>,
) {
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
  state: Parameters<typeof getMetaMaskAccounts>[0],
  targetAddress: string,
) {
  const accounts = getMetaMaskAccounts(state);
  return accounts[targetAddress];
}

export const getTokenExchangeRates = createDeepEqualSelector(
  getCurrentChainId,
  (state: MetaMaskSliceControllerState<'TokenRatesController'>) =>
    state.metamask.TokenRatesController.marketData ?? {},
  (chainId, marketData) => {
    const contractMarketData = marketData[chainId];
    return getKnownPropertyNames(contractMarketData).reduce<
      Record<Hex, number | null>
    >((acc, address) => {
      const marketDataDetails = contractMarketData[address];
      acc[address] = marketDataDetails?.price ?? null;
      return acc;
    }, {});
  },
);

export const getCrossChainTokenExchangeRates = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'TokenRatesController'>) =>
    state.metamask.TokenRatesController.marketData ?? {},
  (contractMarketData) => {
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
  },
);

export const getMarketData = (
  state: MetaMaskSliceControllerState<'TokenRatesController'>,
) => {
  return state.metamask.TokenRatesController.marketData;
};

/**
 * Get market data for tokens on the current chain
 */
export const getTokensMarketData = createDeepEqualSelector(
  getCurrentChainId,
  getMarketData,
  (chainId, marketData) => marketData?.[chainId],
);

export const getFullAddressBook = (
  state: MetaMaskSliceControllerState<'AddressBookController'>,
) => state.metamask.AddressBookController.addressBook;

export const getAddressBook = createDeepEqualSelector(
  getCurrentChainId,
  getFullAddressBook,
  (chainId, addressBook) => {
    if (!addressBook[chainId]) {
      return [];
    }
    return Object.values(addressBook[chainId]);
  },
);

export const getEnsResolutionByAddress = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'EnsController'>) =>
    state.metamask.EnsController.ensResolutionsByAddress,
  (
    state: Parameters<typeof getAddressBook>[0] &
      Parameters<typeof getInternalAccountByAddress>[0],
    address: string,
  ) => ({ state, address }),
  (ensResolutionsByAddress, { state, address }) => {
    if (ensResolutionsByAddress[address]) {
      const ensResolution = ensResolutionsByAddress[address];
      // ensResolution is a punycode encoded string hence toUnicode is used to decode it from same package
      const normalizedEnsResolution = toUnicode(ensResolution);
      return normalizedEnsResolution;
    }

    const entry =
      getAddressBookEntry(state, address) ??
      getInternalAccountByAddress(state, address);

    return entry && 'name' in entry ? entry.name : '';
  },
);

export function getAddressBookEntry(
  state: Parameters<typeof getAddressBook>[0],
  address: string,
) {
  const addressBook = getAddressBook(state);
  const entry = addressBook.find((contact) =>
    isEqualCaseInsensitive(contact.address, address),
  );
  return entry;
}

export function getAddressBookEntryOrAccountName(
  state: Parameters<typeof getAddressBook>[0] & AccountsMetaMaskState,
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

export function accountsWithSendEtherInfoSelector(
  state: Parameters<typeof getMetaMaskAccounts>[0],
) {
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

export function getAccountsWithLabels(
  state: Parameters<typeof getMetaMaskAccountsOrdered>[0],
) {
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

export const getCurrentAccountWithSendEtherInfo = createDeepEqualSelector(
  getSelectedInternalAccount,
  accountsWithSendEtherInfoSelector,
  ({ address: currentAddress }, accounts) => {
    return getAccountByAddress(accounts, currentAddress);
  },
);

export function getTargetAccountWithSendEtherInfo(
  state: AccountsMetaMaskState &
    Parameters<typeof accountsWithSendEtherInfoSelector>[0],
  targetAddress: string,
) {
  const accounts = accountsWithSendEtherInfoSelector(state);
  return getAccountByAddress(accounts, targetAddress);
}

export const getCurrentEthBalance = createDeepEqualSelector(
  getCurrentAccountWithSendEtherInfo,
  (currentAccount) => {
    if (
      ((account): account is InternalAccountWithBalance =>
        account !== undefined && 'balance' in account)(currentAccount)
    ) {
      return currentAccount.balance;
    }
    return undefined;
  },
);

export const getNetworkConfigurationIdByChainId = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'NetworkController'>) =>
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
  (_state: MetaMaskSliceControllerState<'NetworkController'>, chainId: Hex) =>
    chainId,
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
  (state: MetaMaskSliceControllerState<'CurrencyController'>) =>
    state.metamask.CurrencyController.currencyRates,
  (networkConfiguration, currencyRates) => {
    if (!networkConfiguration) {
      return undefined;
    }

    const { nativeCurrency } = networkConfiguration;
    return currencyRates[nativeCurrency]?.conversionRate;
  },
);

export const selectNftsByChainId = createSelector(
  getSelectedInternalAccount,
  (state: MetaMaskSliceControllerState<'NftController'>) =>
    state.metamask.NftController.allNfts,
  (_state: AccountsMetaMaskState, chainId: Hex) => chainId,
  (selectedAccount, nfts, chainId) => {
    return nfts?.[selectedAccount.address]?.[chainId] ?? [];
  },
);

export const selectNftContractsByChainId = createSelector(
  getSelectedInternalAccount,
  (state: MetaMaskSliceControllerState<'NftController'>) =>
    state.metamask.NftController.allNftContracts,
  (_state: AccountsMetaMaskState, chainId: Hex) => chainId,
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
  state: MetaMaskSliceControllerState<'NetworkController'>,
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
 * @returns An object with information about the network with the given networkClientId
 */
export const getSwitchedNetworkDetails = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'AppStateController'>) =>
    state.metamask.AppStateController,
  getNetworkConfigurationsByChainId,
  ({ switchedNetworkDetails }, networkConfigurations) => {
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
  },
);

export function getCurrentCurrency(
  state: MetaMaskSliceControllerState<'CurrencyController'>,
) {
  return state.metamask.CurrencyController.currentCurrency;
}

export function getTotalUnapprovedCount(
  state: MetaMaskSliceControllerState<'ApprovalController'>,
) {
  return state.metamask.ApprovalController.pendingApprovalCount ?? 0;
}

export function getQueuedRequestCount(
  state: MetaMaskSliceControllerState<'QueuedRequestController'>,
) {
  return state.metamask.QueuedRequestController.queuedRequestCount ?? 0;
}

export function getSlides(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  return state.metamask.AppStateController.slides ?? [];
}

export const getTotalUnapprovedMessagesCount = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'SignatureController'>) =>
    state.metamask.SignatureController,
  (state: MetaMaskSliceControllerState<'DecryptMessageController'>) =>
    state.metamask.DecryptMessageController,
  (state: MetaMaskSliceControllerState<'EncryptionPublicKeyController'>) =>
    state.metamask.EncryptionPublicKeyController,
  (
    { unapprovedPersonalMsgCount = 0, unapprovedTypedMessagesCount = 0 },
    { unapprovedDecryptMsgCount = 0 },
    { unapprovedEncryptionPublicKeyMsgCount = 0 },
  ) => {
    return (
      unapprovedPersonalMsgCount +
      unapprovedDecryptMsgCount +
      unapprovedEncryptionPublicKeyMsgCount +
      unapprovedTypedMessagesCount
    );
  },
);

export const getTotalUnapprovedSignatureRequestCount = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'SignatureController'>) =>
    state.metamask.SignatureController,
  ({ unapprovedPersonalMsgCount = 0, unapprovedTypedMessagesCount = 0 }) => {
    return unapprovedPersonalMsgCount + unapprovedTypedMessagesCount;
  },
);

export const getUnapprovedTxCount = createDeepEqualSelector(
  getUnapprovedTransactions,
  (unapprovedTxs) => {
    return Object.keys(unapprovedTxs).length;
  },
);

export const getUnapprovedConfirmations = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'ApprovalController'>) =>
    state.metamask.ApprovalController.pendingApprovals ?? {},
  (pendingApprovals) => Object.values(pendingApprovals),
);

export const getUnapprovedTemplatedConfirmations = createDeepEqualSelector(
  getUnapprovedConfirmations,
  (unapprovedConfirmations) => {
    return unapprovedConfirmations.filter((approval) =>
      TEMPLATED_CONFIRMATION_APPROVAL_TYPES.includes(approval.type),
    );
  },
);

export const getPrioritizedUnapprovedTemplatedConfirmations = createSelector(
  getUnapprovedTemplatedConfirmations,
  (unapprovedTemplatedConfirmations) =>
    unapprovedTemplatedConfirmations.filter(({ type }) =>
      PRIORITY_APPROVAL_TEMPLATE_TYPES.includes(type),
    ),
);

export const getSuggestedTokens = createDeepEqualSelector(
  getUnapprovedConfirmations,
  (unapprovedConfirmations) => {
    return (
      unapprovedConfirmations?.filter(({ type, requestData }) => {
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
  },
);

export const getSuggestedNfts = createDeepEqualSelector(
  getUnapprovedConfirmations,
  (unapprovedConfirmations) => {
    return (
      unapprovedConfirmations?.filter(({ requestData, type }) => {
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
  },
);

export const getIsMainnet = createSelector(
  getCurrentChainId,
  (chainId) => chainId === CHAIN_IDS.MAINNET,
);

export const getIsLineaMainnet = createSelector(
  getCurrentChainId,
  (chainId) => chainId === CHAIN_IDS.LINEA_MAINNET,
);

export const getIsTestnet = createSelector(
  getCurrentChainId,
  (currentChainId) =>
    TEST_CHAINS.find((chainId) => chainId === currentChainId) !== undefined,
);

export function getIsNonStandardEthChain(state: ProviderConfigState) {
  return !(getIsMainnet(state) || getIsTestnet(state) || process.env.IN_TEST);
}

export function getPreferences(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.preferences ?? {};
}

export function getShowTestNetworks(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  const { showTestNetworks } = getPreferences(state);
  return Boolean(showTestNetworks);
}

export function getPetnamesEnabled(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  const { petnamesEnabled = true } = getPreferences(state);
  return petnamesEnabled;
}

export const getIsTokenNetworkFilterEqualCurrentNetwork =
  createDeepEqualSelector(
    getCurrentChainId,
    getPreferences,
    (chainId, { tokenNetworkFilter: tokenNetworkFilterValue }) => {
      const tokenNetworkFilter = tokenNetworkFilterValue ?? {};
      if (
        Object.keys(tokenNetworkFilter).length === 1 &&
        Object.keys(tokenNetworkFilter)[0] === chainId
      ) {
        return true;
      }
      return false;
    },
  );

/**
 * Returns an object indicating which networks
 * tokens should be shown on in the portfolio view.
 *
 * @param {*} state
 * @returns {Record<Hex, boolean>}
 */
export const getTokenNetworkFilter = createDeepEqualSelector(
  getCurrentChainId,
  getPreferences,
  (currentChainId, { tokenNetworkFilter = {} }) => {
    // Portfolio view not enabled outside popular networks
    if (
      !process.env.PORTFOLIO_VIEW ||
      !FEATURED_NETWORK_CHAIN_IDS.find(
        (networkId) => networkId === currentChainId,
      )
    ) {
      return { [currentChainId]: true };
    }

    // Portfolio view only enabled on featured networks
    return Object.entries(tokenNetworkFilter).reduce<
      Record<(typeof FEATURED_NETWORK_CHAIN_IDS)[number], boolean>
    >((acc, [chainId, value]) => {
      if (
        ((id): id is (typeof FEATURED_NETWORK_CHAIN_IDS)[number] =>
          FEATURED_NETWORK_CHAIN_IDS.find((networkId) => networkId === id) !==
          undefined)(chainId)
      ) {
        acc[chainId] = value;
      }
      return acc;
    }, {} as never);
  },
);

export function getUseTransactionSimulations(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return Boolean(
    state.metamask.PreferencesController.useTransactionSimulations,
  );
}

export function getRedesignedConfirmationsEnabled(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  const { redesignedConfirmationsEnabled } = getPreferences(state);
  return redesignedConfirmationsEnabled;
}

export function getRedesignedTransactionsEnabled(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  const { redesignedTransactionsEnabled } = getPreferences(state);
  return redesignedTransactionsEnabled;
}

export function getFeatureNotificationsEnabled(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  const { featureNotificationsEnabled = false } = getPreferences(state);
  return featureNotificationsEnabled;
}

export function getShowExtensionInFullSizeView(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  const { showExtensionInFullSizeView } = getPreferences(state);
  return Boolean(showExtensionInFullSizeView);
}

export function getTestNetworkBackgroundColor(state: ProviderConfigState) {
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

export const getShouldShowFiat = createDeepEqualSelector(
  getCurrentChainId,
  getPreferences,
  getConversionRate,
  getUseCurrencyRateCheck,
  (
    currentChainId,
    { showFiatInTestnets },
    conversionRate,
    useCurrencyRateCheck,
  ) => {
    const isTestnet =
      TEST_NETWORK_IDS.find((networkId) => networkId === currentChainId) !==
      undefined;
    const isConvertibleToFiat = Boolean(useCurrencyRateCheck && conversionRate);

    if (isTestnet) {
      return showFiatInTestnets && isConvertibleToFiat;
    }

    return isConvertibleToFiat;
  },
);

export function getShouldHideZeroBalanceTokens(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  const { hideZeroBalanceTokens } = getPreferences(state);
  return hideZeroBalanceTokens;
}

export function getAdvancedInlineGasShown(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return Boolean(
    state.metamask.PreferencesController.featureFlags.advancedInlineGas,
  );
}

export const getUseNonceField = createSelector(
  getIsSmartTransaction,
  (state: MetaMaskSliceControllerState<'PreferencesController'>) =>
    state.metamask.PreferencesController,
  (isSmartTransaction, { useNonceField }) => {
    return Boolean(!isSmartTransaction && useNonceField);
  },
);

/**
 * @param {string} svgString - The raw SVG string to make embeddable.
 * @returns {string} The embeddable SVG string.
 */
const getEmbeddableSvg = memoize(
  (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`,
);

export function getTargetSubjectMetadata(
  state: MetaMaskSliceControllerState<'SubjectMetadataController'>,
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
 * Input selector used to retrieve Snaps that are added to Snaps Directory.
 *
 * @param state - Redux state object.
 * @returns Object - Containing verified Snaps from the Directory.
 */
const selectVerifiedSnapsRegistry = (
  state: MetaMaskSliceControllerState<'SnapsRegistry'>,
) => state.metamask.SnapsRegistry.database?.verifiedSnaps;

/**
 * Input selector providing a way to pass a snapId as an argument.
 *
 * @param _state - Redux state object.
 * @param snapId - ID of a Snap.
 * @returns string - ID of a Snap that can be used as input selector.
 */
const selectSnapId = (
  _state: MetaMaskSliceControllerState<'SnapController'>,
  snapId: SnapId,
) => snapId;

/**
 * Input selector for retrieving all installed Snaps.
 *
 * @param state - Redux state object.
 * @returns Object - Installed Snaps.
 */
export const selectInstalledSnaps = (
  state: MetaMaskSliceControllerState<'SnapController'>,
) => state.metamask.SnapController.snaps;

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
  [
    rawStateSelector<Parameters<typeof getSnapLatestVersion>[0]>,
    selectInstalledSnaps,
  ],
  (state, installedSnaps) => {
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
const getInterfaces = (
  state: MetaMaskSliceControllerState<'SnapInterfaceController'>,
) => state.metamask.SnapInterfaceController.interfaces;

/**
 * Input selector providing a way to pass a Snap interface ID as an argument.
 *
 * @param _state - Redux state object.
 * @param interfaceId - ID of a Snap interface.
 * @returns ID of a Snap Interface that can be used as input selector.
 */
const selectInterfaceId = <T>(_state: T, interfaceId: string) => interfaceId;

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
const selectOrigins = <T>(_state: T, origins: Record<string, string>) =>
  origins;

/**
 * Retrieve metadata for multiple subjects (origins).
 *
 * @param state - Redux state object.
 * @param origins - Object containing keys that represent subject's identification.
 * @returns Key:value object containing metadata attached to each subject key.
 */
export const getMultipleTargetsSubjectMetadata = createDeepEqualSelector(
  selectOrigins,
  rawStateSelector<Parameters<typeof getTargetSubjectMetadata>[0]>,
  (origins, state) => {
    return getKnownPropertyNames(origins ?? {}).reduce<
      Record<string, SubjectMetadata>
    >((originsMetadata, origin) => {
      originsMetadata[origin] = getTargetSubjectMetadata(state, origin);
      return originsMetadata;
    }, {});
  },
);

export function getRpcPrefsForCurrentProvider(state: ProviderConfigState) {
  const { rpcPrefs } = getProviderConfig(state);
  return rpcPrefs;
}

export function getKnownMethodData(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
  data: Hex,
) {
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

export function getFeatureFlags(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.featureFlags;
}

export function getCurrentTab(state: Pick<MetaMaskReduxState, 'activeTab'>) {
  return state.activeTab.origin;
}

export function getOriginOfCurrentTab(
  state: Pick<MetaMaskReduxState, 'activeTab'>,
) {
  return state.activeTab.origin;
}

export function getDefaultHomeActiveTabName(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  return state.metamask.AppStateController.defaultHomeActiveTabName;
}

export function getIpfsGateway(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.ipfsGateway;
}

export function getUseExternalServices(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.useExternalServices;
}

export function getUSDConversionRate(
  state: MetaMaskSliceControllerState<'CurrencyController'> &
    ProviderConfigState,
) {
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

export function getCurrencyRates(
  state: MetaMaskSliceControllerState<'CurrencyController'>,
) {
  return state.metamask.CurrencyController.currencyRates;
}

export function getWeb3ShimUsageStateForOrigin(
  state: MetaMaskSliceControllerState<'AlertController'>,
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

export const getSwapsDefaultToken = createDeepEqualSelector(
  getSelectedAccount,
  getCurrentChainId,
  (_state: Parameters<typeof getSelectedAccount>[0], overrideChainId = null) =>
    overrideChainId,
  (selectedAccount, currentChainId, overrideChainId) => {
    const balance = selectedAccount?.balance;

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
  },
);

export function getIsSwapsChain(
  state: ProviderConfigState,
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
  state: ProviderConfigState,
  overrideChainId?: Hex,
) {
  const currentChainId = getCurrentChainId(state);
  const chainId = overrideChainId ?? currentChainId;
  return ALLOWED_BRIDGE_CHAIN_IDS.find((id) => id === chainId) !== undefined;
}

function getBridgeFeatureFlags(
  state: MetaMaskSliceControllerState<'BridgeController'>,
) {
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

export function getNativeCurrencyImage(state: ProviderConfigState) {
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
  (state: MetaMaskSliceControllerState<'TokenListController'>) =>
    state.metamask.TokenListController.tokensChainsCache,
  (erc20TokensByChain) => erc20TokensByChain,
);

export const selectERC20Tokens = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'TokenListController'>) =>
    state.metamask.TokenListController.tokenList,
  (erc20Tokens) => erc20Tokens,
);

/**
 * To check if the token detection is OFF and the network is Mainnet
 * so that the user can skip third party token api fetch
 * and use the static tokenlist from contract-metadata
 *
 * @param state
 * @returns Boolean
 */
export const getIsTokenDetectionInactiveOnMainnet = createSelector(
  getIsMainnet,
  getUseTokenDetection,
  (isMainnet, useTokenDetection) => !useTokenDetection && isMainnet,
);

/**
 * To retrieve the token list for use throughout the UI. Will return the remotely fetched list
 * from the tokens controller if token detection is enabled, or the static list if not.
 *
 * @type {() => object}
 */
export const getTokenList = createDeepEqualSelector(
  selectERC20Tokens,
  getIsTokenDetectionInactiveOnMainnet,
  (remoteTokenList, isTokenDetectionInactiveOnMainnet) => {
    return isTokenDetectionInactiveOnMainnet
      ? (STATIC_MAINNET_TOKEN_LIST as TokenListMap)
      : remoteTokenList;
  },
);

export const getMemoizedMetadataContract = createDeepEqualSelector(
  (_state: Parameters<typeof getTokenList>[0], address: string) => address,
  getTokenList,
  (address, tokenList) => tokenList[address?.toLowerCase()],
);

export const getMetadataContractName = createSelector(
  getMemoizedMetadataContract,
  (entry) => entry?.name ?? '',
);

export const getTxData = (
  state: Pick<MetaMaskReduxState, 'confirmTransaction'>,
) => state.confirmTransaction.txData;

export const getUnapprovedTransaction = createDeepEqualSelector(
  getUnapprovedTransactions,
  (_: Parameters<typeof getUnapprovedTransactions>[0], transactionId: Hex) =>
    transactionId,
  (unapprovedTxs, transactionId) =>
    Object.values(unapprovedTxs).find(({ id }) => id === transactionId),
);

export const getTransaction = createDeepEqualSelector(
  getCurrentNetworkTransactions,
  (
    _: Parameters<typeof getCurrentNetworkTransactions>[0],
    transactionId: Hex,
  ) => transactionId,
  (unapprovedTxs, transactionId) => {
    return (
      Object.values(unapprovedTxs).find(({ id }) => id === transactionId) ?? {}
    );
  },
);

export const getFullTxData = createDeepEqualSelector(
  getTxData,
  (
    state: Parameters<typeof getUnapprovedTransaction>[0] &
      Parameters<typeof getTransaction>[0],
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
  state: Parameters<typeof getPreferences>[0],
) {
  const { shouldShowAggregatedBalancePopover } = getPreferences(state);
  return shouldShowAggregatedBalancePopover;
}
export const getMemoizedCurrentChainId = createDeepEqualSelector(
  getCurrentChainId,
  (chainId) => chainId,
);

export const getMemoizedUnapprovedPersonalMessages = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'SignatureController'>) =>
    state.metamask.SignatureController.unapprovedPersonalMsgs,
  (unapprovedPersonalMsgs) => unapprovedPersonalMsgs,
);

export const getMemoizedUnapprovedTypedMessages = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'SignatureController'>) =>
    state.metamask.SignatureController.unapprovedTypedMessages,
  (unapprovedTypedMessages) => unapprovedTypedMessages,
);

export function getSnaps(
  state: MetaMaskSliceControllerState<'SnapController'>,
) {
  return state.metamask.SnapController.snaps;
}

export function getLocale(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.currentLocale;
}

export const getSnap = createDeepEqualSelector(
  getSnaps,
  (_: Parameters<typeof getSnaps>[0], snapId: SnapId) => snapId,
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
  (_: Parameters<typeof getSnapsMetadata>[0], snapId: SnapId) => snapId,
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

function getAllSnapInsights(
  state: MetaMaskSliceControllerState<'SnapInsightsController'>,
) {
  return state.metamask.SnapInsightsController.insights;
}

export const getSnapInsights = createDeepEqualSelector(
  getAllSnapInsights,
  (_: Parameters<typeof getAllSnapInsights>[0], id: SnapId) => id,
  (insights, id) => insights?.[id],
);

/**
 * To get all installed snaps with proper metadata
 *
 * @returns Boolean
 */
export const getSnapsList = createDeepEqualSelector(
  rawStateSelector<
    Parameters<typeof getTargetSubjectMetadata>[0] &
      Parameters<typeof getSnapMetadata>[0] &
      Parameters<typeof getSnaps>[0]
  >,
  getSnaps,
  (state, snaps) => {
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
  },
);

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

/**
 * Get an object of announcement IDs and if they are allowed or not.
 *
 * @param state
 */
function getAllowedAnnouncementIds(
  state: Parameters<typeof getCurrentKeyring>[0],
) {
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

export function getSortedAnnouncementsToShow(
  state: MetaMaskSliceControllerState<'AnnouncementController'> &
    Parameters<typeof getAllowedAnnouncementIds>[0],
) {
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
export function getOrderedNetworksList(
  state: MetaMaskSliceControllerState<'NetworkOrderController'>,
) {
  return state.metamask.NetworkOrderController.orderedNetworkList;
}

export function getPinnedAccountsList(
  state: MetaMaskSliceControllerState<'AccountOrderController'>,
) {
  return state.metamask.AccountOrderController.pinnedAccountList;
}

export function getHiddenAccountsList(
  state: MetaMaskSliceControllerState<'AccountOrderController'>,
) {
  return state.metamask.AccountOrderController.hiddenAccountList;
}

export function getShowRecoveryPhraseReminder(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
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
export const getNumberOfAllUnapprovedTransactionsAndMessages =
  createDeepEqualSelector(
    getAllUnapprovedTransactions,
    getQueuedRequestCount,
    unapprovedDecryptMsgsSelector,
    unapprovedPersonalMsgsSelector,
    unapprovedEncryptionPublicKeyMsgsSelector,
    unapprovedTypedMessagesSelector,
    (
      unapprovedTxs,
      queuedRequestCount,
      unapprovedDecryptMsgs,
      unapprovedPersonalMsgs,
      unapprovedEncryptionPublicKeyMsgs,
      unapprovedTypedMessages,
    ) => {
      const allUnapprovedMessages = {
        ...unapprovedTxs,
        ...unapprovedDecryptMsgs,
        ...unapprovedPersonalMsgs,
        ...unapprovedEncryptionPublicKeyMsgs,
        ...unapprovedTypedMessages,
      };
      const numUnapprovedMessages = Object.keys(allUnapprovedMessages).length;
      return numUnapprovedMessages + queuedRequestCount;
    },
  );

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
 * @returns Network ID to switch to
 */
export const getNetworkToAutomaticallySwitchTo = createDeepEqualSelector(
  getNumberOfAllUnapprovedTransactionsAndMessages,
  getOriginOfCurrentTab,
  getUseRequestQueue,
  getEnvironmentType,
  getIsUnlocked,
  getAllDomains,
  getCurrentNetwork,
  (
    numberOfUnapprovedTx,
    selectedTabOrigin,
    useRequestQueue,
    environmentType,
    isUnlocked,
    domainNetworks,
    currentNetwork,
  ) => {
    // This block autoswitches chains based on the last chain used
    // for a given dapp, when there are no pending confimrations
    // This allows the user to be connected on one chain
    // for one dapp, and automatically change for another
    if (
      environmentType === ENVIRONMENT_TYPE_POPUP &&
      isUnlocked &&
      useRequestQueue &&
      selectedTabOrigin &&
      numberOfUnapprovedTx === 0
    ) {
      const networkIdForThisDomain = domainNetworks[selectedTabOrigin];
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
  },
);

export function getShowTermsOfUse(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  const { termsOfUseLastAgreed } = state.metamask.AppStateController;

  if (!termsOfUseLastAgreed) {
    return true;
  }
  return (
    new Date(termsOfUseLastAgreed).getTime() <
    new Date(TERMS_OF_USE_LAST_UPDATED).getTime()
  );
}

export function getLastViewedUserSurvey(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  return state.metamask.AppStateController.lastViewedUserSurvey;
}

export function getShowOutdatedBrowserWarning(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  const { outdatedBrowserWarningLastShown } = state.metamask.AppStateController;
  if (!outdatedBrowserWarningLastShown) {
    return true;
  }
  const currentTime = new Date().getTime();
  return currentTime - outdatedBrowserWarningLastShown >= DAY * 2;
}

export function getOnboardingDate(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  return state.metamask.AppStateController.onboardingDate;
}

export function getShowBetaHeader(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  return state.metamask.AppStateController.showBetaHeader;
}

export function getShowPermissionsTour(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  return state.metamask.AppStateController.showPermissionsTour;
}

export function getShowNetworkBanner(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  return state.metamask.AppStateController.showNetworkBanner;
}

export function getShowAccountBanner(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  return state.metamask.AppStateController.showAccountBanner;
}
/**
 * To get the useTokenDetection flag which determines whether a static or dynamic token list is used
 *
 * @param state
 * @returns Boolean
 */
export function getUseTokenDetection(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return Boolean(state.metamask.PreferencesController.useTokenDetection);
}

/**
 * To get the useNftDetection flag which determines whether we autodetect NFTs
 *
 * @param state
 * @returns Boolean
 */
export function getUseNftDetection(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return Boolean(state.metamask.PreferencesController.useNftDetection);
}

/**
 * To get the useBlockie flag which determines whether we show blockies or Jazzicons
 *
 * @param state
 * @returns Boolean
 */
export function getUseBlockie(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return Boolean(state.metamask.PreferencesController.useBlockie);
}

/**
 * To get the openSeaEnabled flag which determines whether we use OpenSea's API
 *
 * @param state
 * @returns Boolean
 */
export function getOpenSeaEnabled(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return Boolean(state.metamask.PreferencesController.openSeaEnabled);
}

/**
 * To get the `theme` value which determines which theme is selected
 *
 * @param state
 * @returns Boolean
 */
export function getTheme(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.theme;
}

export const doesAddressRequireLedgerHidConnection = createDeepEqualSelector(
  (state: Parameters<typeof isAddressLedger>[0], address: string) => ({
    state,
    address,
  }),
  getLedgerTransportType,
  getLedgerWebHidConnectedStatus,
  getLedgerTransportStatus,
  (
    { state, address },
    ledgerTransportType,
    ledgerWebHidConnectedStatus,
    ledgerTransportStatus,
  ) => {
    const addressIsLedger = isAddressLedger(state, address);
    const transportTypePreferenceIsWebHID =
      ledgerTransportType === LedgerTransportTypes.webhid;
    const webHidIsNotConnected =
      ledgerWebHidConnectedStatus !== WebHIDConnectedStatuses.connected;
    const transportIsNotSuccessfullyCreated =
      ledgerTransportStatus !== HardwareTransportStates.verified;

    return (
      addressIsLedger &&
      transportTypePreferenceIsWebHID &&
      (webHidIsNotConnected || transportIsNotSuccessfullyCreated)
    );
  },
);

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
export const getAdvancedGasFeeValues = createDeepEqualSelector(
  getCurrentChainId,
  (state) => state.metamask.PreferencesController.advancedGasFee,
  (currentChainId, advancedGasFee) => {
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
    return advancedGasFee[currentChainId];
  },
);

/**
 * To get the name of the network that support token detection based in chainId.
 *
 * @param state
 * @returns string e.g. ethereum, bsc or polygon
 */
export const getTokenDetectionSupportNetworkByChainId = createSelector(
  getCurrentChainId,
  (chainId) => {
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
  },
);

/**
 * Returns true if a token list is available for the current network.
 *
 * @param state
 * @returns Boolean
 */
export const getIsDynamicTokenListAvailable = createSelector(
  getCurrentChainId,
  (currentChainId) => {
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
  },
);

/**
 * To retrieve the list of tokens detected and saved on the state to detectedToken object.
 *
 * @param state
 * @returns list of token objects
 */
export const getDetectedTokensInCurrentNetwork = createDeepEqualSelector(
  getCurrentChainId,
  getSelectedInternalAccount,
  getAllDetectedTokens,
  (currentChainId, { address: selectedAddress }, allDetectedTokens) => {
    return allDetectedTokens?.[currentChainId]?.[selectedAddress];
  },
);

export function getAllDetectedTokens(
  state: MetaMaskSliceControllerState<'TokensController'>,
) {
  return state.metamask.TokensController.allDetectedTokens;
}

/**
 * To retrieve the list of tokens detected across all chains.
 *
 * @param state
 * @returns list of token objects on all networks
 */
export const getAllDetectedTokensForSelectedAddress = createDeepEqualSelector(
  getCompletedOnboarding,
  getSelectedInternalAccount,
  getAllDetectedTokens,
  (completedOnboarding, { address: selectedAddress }, allDetectedTokens) => {
    if (!completedOnboarding) {
      return {};
    }

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
  },
);

/**
 * To check for the chainId that supports token detection ,
 * currently it returns true for Ethereum Mainnet, Polygon, BSC, and Avalanche
 *
 * @returns Boolean
 */
export const getIsTokenDetectionSupported = createSelector(
  getUseTokenDetection,
  getIsDynamicTokenListAvailable,
  (useTokenDetection, isDynamicTokenListAvailable) =>
    useTokenDetection && isDynamicTokenListAvailable,
);

/**
 * To check if the token detection is OFF for the token detection supported networks
 * and the network is not Mainnet
 *
 * @returns Boolean
 */
export const getIstokenDetectionInactiveOnNonMainnetSupportedNetwork =
  createSelector(
    getUseTokenDetection,
    getIsMainnet,
    getIsDynamicTokenListAvailable,
    (useTokenDetection, isMainnet, isDynamicTokenListAvailable) =>
      isDynamicTokenListAvailable && !useTokenDetection && !isMainnet,
  );

/**
 * To get the `useRequestQueue` value which determines whether we use a request queue infront of provider api calls. This will have the effect of implementing per-dapp network switching.
 *
 * @param state
 * @returns Boolean
 */
export function getUseRequestQueue(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.useRequestQueue;
}

/**
 * To get the `getIsSecurityAlertsEnabled` value which determines whether security check is enabled
 *
 * @param state
 * @returns Boolean
 */
export function getIsSecurityAlertsEnabled(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.securityAlertsEnabled;
}

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
/**
 * Get the state of the `addSnapAccountEnabled` flag.
 *
 * @param state
 * @returns The state of the `addSnapAccountEnabled` flag.
 */
export function getIsAddSnapAccountEnabled(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.addSnapAccountEnabled;
}
///: END:ONLY_INCLUDE_IF

export function getIsWatchEthereumAccountEnabled(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.watchEthereumAccountEnabled;
}

/**
 * Get the state of the `bitcoinSupportEnabled` flag.
 *
 * @param state
 * @returns The state of the `bitcoinSupportEnabled` flag.
 */
export function getIsBitcoinSupportEnabled(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.bitcoinSupportEnabled;
}

///: BEGIN:ONLY_INCLUDE_IF(solana)
/**
 * Get the state of the `solanaSupportEnabled` flag.
 *
 * @param state
 * @returns The state of the `solanaSupportEnabled` flag.
 */
export function getIsSolanaSupportEnabled(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.solanaSupportEnabled;
}
///: END:ONLY_INCLUDE_IF

/**
 * Get the state of the `bitcoinTestnetSupportEnabled` flag.
 *
 * @param state
 * @returns The state of the `bitcoinTestnetSupportEnabled` flag.
 */
export function getIsBitcoinTestnetSupportEnabled(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return state.metamask.PreferencesController.bitcoinTestnetSupportEnabled;
}

export function getIsCustomNetwork(state: ProviderConfigState) {
  return Boolean(
    getKnownPropertyNames(CHAIN_ID_TO_RPC_URL_MAP).find(
      (chainId) => chainId === getCurrentChainId(state),
    ),
  );
}

export function getBlockExplorerLinkText(
  state: ProviderConfigState,
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

export const getAllAccountsOnNetworkAreEmpty = createDeepEqualSelector(
  getMetaMaskCachedBalances,
  getNumberOfTokens,
  (balances, numberOfTokens) => {
    const hasNoNativeFundsOnAnyAccounts = Object.values(balances ?? {}).every(
      (balance) => balance === '0x0' || balance === '0x00',
    );
    const hasNoTokens = numberOfTokens === 0;

    return hasNoNativeFundsOnAnyAccounts && hasNoTokens;
  },
);

export const getShouldShowSeedPhraseReminder = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'OnboardingController'>) =>
    state.metamask.OnboardingController,
  (state: MetaMaskSliceControllerState<'PreferencesController'>) =>
    state.metamask.PreferencesController,
  (state: MetaMaskSliceControllerState<'TokensController'>) =>
    state.metamask.TokensController,
  getSelectedInternalAccount,
  getCurrentEthBalance,
  (
    { seedPhraseBackedUp },
    { dismissSeedBackUpReminder },
    { tokens },
    selectedAccount,
    currentEthBalance,
  ) => {
    // if there is no account, we don't need to show the seed phrase reminder
    const accountBalance = selectedAccount ? currentEthBalance ?? '0' : '0';

    return (
      seedPhraseBackedUp === false &&
      (parseInt(accountBalance, 16) > 0 || tokens.length > 0) &&
      dismissSeedBackUpReminder === false
    );
  },
);

export const getUnconnectedAccounts = createDeepEqualSelector(
  getMetaMaskAccountsOrdered,
  getCurrentTab,
  rawStateSelector<
    Parameters<typeof getMetaMaskAccountsOrdered>[0] &
      Parameters<typeof getCurrentTab>[0] &
      Parameters<typeof getOrderedConnectedAccountsForConnectedDapp>[0]
  >,
  (accounts, origin, state) => {
    const connectedAccounts = getOrderedConnectedAccountsForConnectedDapp(
      state,
      { origin },
    );
    const unConnectedAccounts = accounts.filter((account) => {
      return !connectedAccounts.some(
        (connectedAccount) => connectedAccount.address === account.address,
      );
    });
    return unConnectedAccounts;
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
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) => {
  return state.metamask.PreferencesController.useSafeChainsListValidation;
};

export function getShowFiatInTestnets(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  const { showFiatInTestnets } = getPreferences(state);
  return showFiatInTestnets;
}

/**
 * To get the useCurrencyRateCheck flag which to check if the user prefers currency conversion
 *
 * @param state
 * @returns Boolean
 */
export function getUseCurrencyRateCheck(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  return Boolean(state.metamask.PreferencesController.useCurrencyRateCheck);
}

export function getNames(
  state: MetaMaskSliceControllerState<'NameController'>,
) {
  return state.metamask.NameController.names ?? {};
}

export function getEthereumAddressNames(
  state: MetaMaskSliceControllerState<'NameController'>,
) {
  return state.metamask.NameController.names?.[NameType.ETHEREUM_ADDRESS] ?? {};
}

export function getNameSources(
  state: MetaMaskSliceControllerState<'NameController'>,
) {
  return state.metamask.NameController.nameSources ?? {};
}

export function getMetaMetricsDataDeletionId(
  state: MetaMaskSliceControllerState<'MetaMetricsDataDeletionController'>,
) {
  return state.metamask.MetaMetricsDataDeletionController
    .metaMetricsDataDeletionId;
}

export function getMetaMetricsDataDeletionTimestamp(
  state: MetaMaskSliceControllerState<'MetaMetricsDataDeletionController'>,
) {
  return state.metamask.MetaMetricsDataDeletionController
    .metaMetricsDataDeletionTimestamp;
}

export function getMetaMetricsDataDeletionStatus(
  state: MetaMaskSliceControllerState<'MetaMetricsDataDeletionController'>,
) {
  return state.metamask.MetaMetricsDataDeletionController
    .metaMetricsDataDeletionStatus;
}

export function getRemoteFeatureFlags(
  state: MetaMaskSliceControllerState<'RemoteFeatureFlagController'>,
) {
  return state.metamask.RemoteFeatureFlagController.remoteFeatureFlags;
}

/**
 * To get the state of snaps privacy warning popover.
 *
 * @param state - Redux state object.
 * @returns True if popover has been shown, false otherwise.
 */
export function getSnapsInstallPrivacyWarningShown(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
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
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  const { snapsAddSnapAccountModalDismissed } =
    state.metamask.PreferencesController;

  return snapsAddSnapAccountModalDismissed;
}

export function getSnapRegistry(
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) {
  const { snapRegistryList } = state.metamask.PreferencesController;
  return snapRegistryList;
}

export const getKeyringSnapAccounts = createDeepEqualSelector(
  getInternalAccounts,
  (internalAccounts) => {
    const keyringAccounts = Object.values(internalAccounts).filter(
      (internalAccount) => {
        const { keyring } = internalAccount.metadata;
        return keyring.type === KeyringType.snap;
      },
    );
    return keyringAccounts;
  },
);
///: END:ONLY_INCLUDE_IF
