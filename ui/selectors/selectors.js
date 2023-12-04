///: BEGIN:ONLY_INCLUDE_IF(snaps)
import { SubjectType } from '@metamask/permission-controller';
///: END:ONLY_INCLUDE_IF
import { ApprovalType } from '@metamask/controller-utils';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import { memoize } from 'lodash';
import semver from 'semver';
///: END:ONLY_INCLUDE_IF
import { createSelector } from 'reselect';
import { NameType } from '@metamask/name-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
import { addHexPrefix } from '../../app/scripts/lib/util';
import {
  TEST_CHAINS,
  NATIVE_CURRENCY_TOKEN_IMAGE_MAP,
  BUYABLE_CHAINS_MAP,
  MAINNET_DISPLAY_NAME,
  BSC_DISPLAY_NAME,
  POLYGON_DISPLAY_NAME,
  AVALANCHE_DISPLAY_NAME,
  AURORA_DISPLAY_NAME,
  CHAIN_ID_TO_RPC_URL_MAP,
  CHAIN_IDS,
  NETWORK_TYPES,
  NetworkStatus,
  SEPOLIA_DISPLAY_NAME,
  GOERLI_DISPLAY_NAME,
  ETH_TOKEN_IMAGE_URL,
  LINEA_GOERLI_DISPLAY_NAME,
  CURRENCY_SYMBOLS,
  TEST_NETWORK_TICKER_MAP,
  LINEA_GOERLI_TOKEN_IMAGE_URL,
  LINEA_MAINNET_DISPLAY_NAME,
  LINEA_MAINNET_TOKEN_IMAGE_URL,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
} from '../../shared/constants/network';
import {
  WebHIDConnectedStatuses,
  LedgerTransportTypes,
  HardwareTransportStates,
} from '../../shared/constants/hardware-wallets';
import { KeyringType } from '../../shared/constants/keyring';
import { MESSAGE_TYPE } from '../../shared/constants/app';

import { TRUNCATED_NAME_CHAR_LIMIT } from '../../shared/constants/labels';

import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  ALLOWED_PROD_SWAPS_CHAIN_IDS,
  ALLOWED_DEV_SWAPS_CHAIN_IDS,
} from '../../shared/constants/swaps';

import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../shared/constants/bridge';

import {
  shortenAddress,
  getAccountByAddress,
  getURLHostName,
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  removeSnapIdPrefix,
  getSnapName,
  ///: END:ONLY_INCLUDE_IF
} from '../helpers/utils/util';

import { TEMPLATED_CONFIRMATION_APPROVAL_TYPES } from '../pages/confirmation/templates';
import { STATIC_MAINNET_TOKEN_LIST } from '../../shared/constants/tokens';
import { DAY } from '../../shared/constants/time';
import { TERMS_OF_USE_LAST_UPDATED } from '../../shared/constants/terms';
import {
  getNativeCurrency,
  getProviderConfig,
  getConversionRate,
  isNotEIP1559Network,
  isEIP1559Network,
  getLedgerTransportType,
  isAddressLedger,
  findKeyringForAddress,
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
import {
  NOTIFICATION_BUY_SELL_BUTTON,
  NOTIFICATION_DROP_LEDGER_FIREFOX,
  NOTIFICATION_OPEN_BETA_SNAPS,
  NOTIFICATION_U2F_LEDGER_LIVE,
} from '../../shared/notifications';
import {
  getCurrentNetworkTransactions,
  getUnapprovedTransactions,
} from './transactions';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
// eslint-disable-next-line import/order
import {
  getPermissionSubjects,
  getConnectedSubjectsForAllAddresses,
} from './permissions';
///: END:ONLY_INCLUDE_IF
import { createDeepEqualSelector } from './util';

/**
 * Returns true if the currently selected network is inaccessible or whether no
 * provider has been set yet for the currently selected network.
 *
 * @param {object} state - Redux state object.
 */
export function isNetworkLoading(state) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);
  return (
    selectedNetworkClientId &&
    state.metamask.networksMetadata[selectedNetworkClientId].status !==
      NetworkStatus.Available
  );
}

export function getSelectedNetworkClientId(state) {
  return state.metamask.selectedNetworkClientId;
}

export function getNetworkIdentifier(state) {
  const { type, nickname, rpcUrl } = getProviderConfig(state);

  return nickname || rpcUrl || type;
}

export function getCurrentChainId(state) {
  const { chainId } = getProviderConfig(state);
  return chainId;
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

export function getCurrentQRHardwareState(state) {
  const { qrHardware } = state.metamask;
  return qrHardware || {};
}

export function hasUnsignedQRHardwareTransaction(state) {
  const { txParams } = state.confirmTransaction.txData;
  if (!txParams) {
    return false;
  }
  const { from } = txParams;
  const { keyrings } = state.metamask;
  const qrKeyring = keyrings.find((kr) => kr.type === KeyringType.qr);
  if (!qrKeyring) {
    return false;
  }
  return Boolean(
    qrKeyring.accounts.find(
      (account) => account.toLowerCase() === from.toLowerCase(),
    ),
  );
}

export function hasUnsignedQRHardwareMessage(state) {
  const { type, msgParams } = state.confirmTransaction.txData;
  if (!type || !msgParams) {
    return false;
  }
  const { from } = msgParams;
  const { keyrings } = state.metamask;
  const qrKeyring = keyrings.find((kr) => kr.type === KeyringType.qr);
  if (!qrKeyring) {
    return false;
  }
  switch (type) {
    case MESSAGE_TYPE.ETH_SIGN_TYPED_DATA:
    case MESSAGE_TYPE.ETH_SIGN:
    case MESSAGE_TYPE.PERSONAL_SIGN:
      return Boolean(
        qrKeyring.accounts.find(
          (account) => account.toLowerCase() === from.toLowerCase(),
        ),
      );
    default:
      return false;
  }
}

export function getCurrentKeyring(state) {
  const identity = getSelectedIdentity(state);

  if (!identity) {
    return null;
  }

  const keyring = findKeyringForAddress(state, identity.address);

  return keyring;
}

/**
 * The function returns true if network and account details are fetched and
 * both of them support EIP-1559.
 *
 * @param state
 */
export function checkNetworkAndAccountSupports1559(state) {
  const networkSupports1559 = isEIP1559Network(state);
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
    default:
      return 'default';
  }
}

/**
 * Get MetaMask accounts, including account name and balance.
 */
export const getMetaMaskAccounts = createSelector(
  getMetaMaskIdentities,
  getMetaMaskAccountBalances,
  getMetaMaskCachedBalances,
  (identities, balances, cachedBalances) =>
    Object.keys(identities).reduce((accounts, address) => {
      // TODO: mix in the identity state here as well, consolidating this
      // selector with `accountsWithSendEtherInfoSelector`
      let account = {};

      if (balances[address]) {
        account = {
          ...account,
          ...balances[address],
        };
      }

      if (account.balance === null || account.balance === undefined) {
        account = {
          ...account,
          balance: cachedBalances && cachedBalances[address],
        };
      }

      return {
        ...accounts,
        [address]: account,
      };
    }, {}),
);

export function getSelectedAddress(state) {
  return state.metamask.selectedAddress;
}

export function getSelectedIdentity(state) {
  const selectedAddress = getSelectedAddress(state);
  const { identities } = state.metamask;

  return identities[selectedAddress];
}

export function getNumberOfTokens(state) {
  const { tokens } = state.metamask;
  return tokens ? tokens.length : 0;
}

export function getMetaMaskKeyrings(state) {
  return state.metamask.keyrings;
}

/**
 * Get identity state.
 *
 * @param {object} state - Redux state
 * @returns {object} A map of account addresses to identities (which includes the account name)
 */
export function getMetaMaskIdentities(state) {
  return state.metamask.identities;
}

/**
 * Get account balances state.
 *
 * @param {object} state - Redux state
 * @returns {object} A map of account addresses to account objects (which includes the account balance)
 */
export function getMetaMaskAccountBalances(state) {
  return state.metamask.accounts;
}

export function getMetaMaskCachedBalances(state) {
  const chainId = getCurrentChainId(state);

  return state.metamask.cachedBalances[chainId];
}

/**
 * Get ordered (by keyrings) accounts with identity and balance
 */
export const getMetaMaskAccountsOrdered = createSelector(
  getMetaMaskKeyrings,
  getMetaMaskIdentities,
  getMetaMaskAccounts,
  (keyrings, identities, accounts) =>
    keyrings
      .reduce((list, keyring) => list.concat(keyring.accounts), [])
      .filter((address) => Boolean(identities[address]))
      .map((address) => ({ ...identities[address], ...accounts[address] })),
);

export const getMetaMaskAccountsConnected = createSelector(
  getMetaMaskAccountsOrdered,
  (connectedAccounts) =>
    connectedAccounts.map(({ address }) => address.toLowerCase()),
);

export function isBalanceCached(state) {
  const selectedAccountBalance =
    getMetaMaskAccountBalances(state)[getSelectedAddress(state)]?.balance;
  const cachedBalance = getSelectedAccountCachedBalance(state);

  return Boolean(!selectedAccountBalance && cachedBalance);
}

export function getSelectedAccountCachedBalance(state) {
  const cachedBalances = getMetaMaskCachedBalances(state);
  const selectedAddress = getSelectedAddress(state);
  return cachedBalances?.[selectedAddress];
}

export function getAllTokens(state) {
  return state.metamask.allTokens;
}

export function getSelectedAccount(state) {
  const accounts = getMetaMaskAccounts(state);
  const selectedAddress = getSelectedAddress(state);

  return accounts[selectedAddress];
}

export function getTargetAccount(state, targetAddress) {
  const accounts = getMetaMaskAccounts(state);
  return accounts[targetAddress];
}

export const getTokenExchangeRates = (state) =>
  state.metamask.contractExchangeRates;

export function getAddressBook(state) {
  const chainId = getCurrentChainId(state);
  if (!state.metamask.addressBook[chainId]) {
    return [];
  }
  return Object.values(state.metamask.addressBook[chainId]);
}

export function getEnsResolutionByAddress(state, address) {
  if (state.metamask.ensResolutionsByAddress[address]) {
    return state.metamask.ensResolutionsByAddress[address];
  }

  const entry =
    getAddressBookEntry(state, address) ||
    Object.values(state.metamask.identities).find((identity) =>
      isEqualCaseInsensitive(identity.address, address),
    );

  return entry?.name || '';
}

export function getAddressBookEntry(state, address) {
  const addressBook = getAddressBook(state);
  const entry = addressBook.find((contact) =>
    isEqualCaseInsensitive(contact.address, address),
  );
  return entry;
}

export function getAddressBookEntryOrAccountName(state, address) {
  const entry =
    getAddressBookEntry(state, address) ||
    Object.values(state.metamask.identities).find((identity) =>
      isEqualCaseInsensitive(identity.address, address),
    );
  return entry && entry.name !== '' ? entry.name : address;
}

export function getAccountName(identities, address) {
  const entry = Object.values(identities).find((identity) =>
    isEqualCaseInsensitive(identity.address, address),
  );
  return entry && entry.name !== '' ? entry.name : '';
}

export function getMetadataContractName(state, address) {
  const tokenList = getTokenList(state);
  const entry = Object.values(tokenList).find((identity) =>
    isEqualCaseInsensitive(identity.address, address),
  );
  return entry && entry.name !== '' ? entry.name : '';
}

export function accountsWithSendEtherInfoSelector(state) {
  const accounts = getMetaMaskAccounts(state);
  const identities = getMetaMaskIdentities(state);

  const accountsWithSendEtherInfo = Object.entries(identities).map(
    ([key, identity]) => {
      return { ...identity, ...accounts[key] };
    },
  );

  return accountsWithSendEtherInfo;
}

export function getAccountsWithLabels(state) {
  return getMetaMaskAccountsOrdered(state).map(
    ({ address, name, balance }) => ({
      address,
      addressLabel: `${
        name.length < TRUNCATED_NAME_CHAR_LIMIT
          ? name
          : `${name.slice(0, TRUNCATED_NAME_CHAR_LIMIT - 1)}...`
      } (${shortenAddress(address)})`,
      label: name,
      balance,
    }),
  );
}

export function getCurrentAccountWithSendEtherInfo(state) {
  const currentAddress = getSelectedAddress(state);
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

export function getGasIsLoading(state) {
  return state.appState.gasIsLoading;
}

export function getAppIsLoading(state) {
  return state.appState.isLoading;
}

export function getCurrentCurrency(state) {
  return state.metamask.currentCurrency;
}

export function getTotalUnapprovedCount(state) {
  return state.metamask.pendingApprovalCount ?? 0;
}

export function getTotalUnapprovedMessagesCount(state) {
  const {
    unapprovedMsgCount = 0,
    unapprovedPersonalMsgCount = 0,
    unapprovedDecryptMsgCount = 0,
    unapprovedEncryptionPublicKeyMsgCount = 0,
    unapprovedTypedMessagesCount = 0,
  } = state.metamask;

  return (
    unapprovedMsgCount +
    unapprovedPersonalMsgCount +
    unapprovedDecryptMsgCount +
    unapprovedEncryptionPublicKeyMsgCount +
    unapprovedTypedMessagesCount
  );
}

export function getTotalUnapprovedSignatureRequestCount(state) {
  const {
    unapprovedMsgCount = 0,
    unapprovedPersonalMsgCount = 0,
    unapprovedTypedMessagesCount = 0,
  } = state.metamask;

  return (
    unapprovedMsgCount +
    unapprovedPersonalMsgCount +
    unapprovedTypedMessagesCount
  );
}

export function getUnapprovedTxCount(state) {
  const unapprovedTxs = getUnapprovedTransactions(state);
  return Object.keys(unapprovedTxs).length;
}

export function getUnapprovedConfirmations(state) {
  const { pendingApprovals = {} } = state.metamask;
  return Object.values(pendingApprovals);
}

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
  return metamask.preferences;
}

export function getShowTestNetworks(state) {
  const { showTestNetworks } = getPreferences(state);
  return Boolean(showTestNetworks);
}

export function getTestNetworkBackgroundColor(state) {
  const currentNetwork = state.metamask.providerConfig.ticker;
  switch (true) {
    case currentNetwork?.includes(GOERLI_DISPLAY_NAME):
      return BackgroundColor.goerli;
    case currentNetwork?.includes(SEPOLIA_DISPLAY_NAME):
      return BackgroundColor.sepolia;
    default:
      return undefined;
  }
}

export function getDisabledRpcMethodPreferences(state) {
  return state.metamask.disabledRpcMethodPreferences;
}

export function getShouldShowFiat(state) {
  const isMainNet = getIsMainnet(state);
  const isLineaMainNet = getIsLineaMainnet(state);
  const isCustomNetwork = getIsCustomNetwork(state);
  const conversionRate = getConversionRate(state);
  const useCurrencyRateCheck = getUseCurrencyRateCheck(state);
  const { showFiatInTestnets } = getPreferences(state);
  return Boolean(
    (isMainNet || isLineaMainNet || isCustomNetwork || showFiatInTestnets) &&
      useCurrencyRateCheck &&
      conversionRate,
  );
}

export function getShouldHideZeroBalanceTokens(state) {
  const { hideZeroBalanceTokens } = getPreferences(state);
  return hideZeroBalanceTokens;
}

export function getAdvancedInlineGasShown(state) {
  return Boolean(state.metamask.featureFlags.advancedInlineGas);
}

export function getUseNonceField(state) {
  return Boolean(state.metamask.useNonceField);
}

export function getCustomNonceValue(state) {
  return String(state.metamask.customNonceValue);
}

export function getSubjectMetadata(state) {
  return state.metamask.subjectMetadata;
}

///: BEGIN:ONLY_INCLUDE_IF(snaps)
/**
 * @param {string} svgString - The raw SVG string to make embeddable.
 * @returns {string} The embeddable SVG string.
 */
const getEmbeddableSvg = memoize(
  (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`,
);
///: END:ONLY_INCLUDE_IF

export function getTargetSubjectMetadata(state, origin) {
  const metadata = getSubjectMetadata(state)[origin];

  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  if (metadata?.subjectType === SubjectType.Snap) {
    const { svgIcon, ...remainingMetadata } = metadata;
    return {
      ...remainingMetadata,
      iconUrl: svgIcon ? getEmbeddableSvg(svgIcon) : null,
    };
  }
  ///: END:ONLY_INCLUDE_IF
  return metadata;
}

///: BEGIN:ONLY_INCLUDE_IF(snaps)
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
///: END:ONLY_INCLUDE_IF

export function getRpcPrefsForCurrentProvider(state) {
  const { rpcPrefs } = getProviderConfig(state);
  return rpcPrefs || {};
}

export function getKnownMethodData(state, data) {
  if (!data) {
    return null;
  }
  const prefixedData = addHexPrefix(data);
  const fourBytePrefix = prefixedData.slice(0, 10);
  const { knownMethodData, use4ByteResolution } = state.metamask;
  // If 4byte setting is off, we do not want to return the knownMethodData
  return use4ByteResolution && knownMethodData?.[fourBytePrefix];
}

export function getFeatureFlags(state) {
  return state.metamask.featureFlags;
}

export function getOriginOfCurrentTab(state) {
  return state.activeTab.origin;
}

export function getIpfsGateway(state) {
  return state.metamask.ipfsGateway;
}

export function getInfuraBlocked(state) {
  return (
    state.metamask.networksMetadata[getSelectedNetworkClientId(state)]
      .status === NetworkStatus.Blocked
  );
}

export function getUSDConversionRate(state) {
  return state.metamask.currencyRates[getProviderConfig(state).ticker]
    ?.usdConversionRate;
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
 * @param {object} state - the redux state object
 * @returns {SwapsEthToken} The token object representation of the currently
 * selected account's ETH balance, as expected by the Swaps API.
 */

export function getSwapsDefaultToken(state) {
  const selectedAccount = getSelectedAccount(state);
  const balance = selectedAccount?.balance;
  const chainId = getCurrentChainId(state);
  const defaultTokenObject = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId];

  return {
    ...defaultTokenObject,
    balance: hexToDecimal(balance),
    string: getValueFromWeiHex({
      value: balance,
      numberOfDecimals: 4,
      toDenomination: 'ETH',
    }),
  };
}

export function getIsSwapsChain(state) {
  const chainId = getCurrentChainId(state);
  const isNotDevelopment =
    process.env.METAMASK_ENVIRONMENT !== 'development' &&
    process.env.METAMASK_ENVIRONMENT !== 'testing';
  return isNotDevelopment
    ? ALLOWED_PROD_SWAPS_CHAIN_IDS.includes(chainId)
    : ALLOWED_DEV_SWAPS_CHAIN_IDS.includes(chainId);
}

export function getIsBridgeChain(state) {
  const chainId = getCurrentChainId(state);
  return ALLOWED_BRIDGE_CHAIN_IDS.includes(chainId);
}

export function getIsBuyableChain(state) {
  const chainId = getCurrentChainId(state);
  return Object.keys(BUYABLE_CHAINS_MAP).includes(chainId);
}
export function getNativeCurrencyImage(state) {
  const nativeCurrency = getNativeCurrency(state)?.toUpperCase();
  return NATIVE_CURRENCY_TOKEN_IMAGE_MAP[nativeCurrency];
}

export function getNextSuggestedNonce(state) {
  return Number(state.metamask.nextNonce);
}

export function getShowWhatsNewPopup(state) {
  return state.appState.showWhatsNewPopup;
}

export const getMemoizedMetaMaskIdentities = createDeepEqualSelector(
  getMetaMaskIdentities,
  (identities) => identities,
);

export const getMemoizedAddressBook = createDeepEqualSelector(
  getAddressBook,
  (addressBook) => addressBook,
);

export const getMemoizedMetadataContractName = createDeepEqualSelector(
  getTokenList,
  (_tokenList, address) => address,
  (tokenList, address) => {
    const entry = Object.values(tokenList).find((identity) =>
      isEqualCaseInsensitive(identity.address, address),
    );
    return entry && entry.name !== '' ? entry.name : '';
  },
);

export const getTxData = (state) => state.confirmTransaction.txData;

export const getUnapprovedTransaction = createDeepEqualSelector(
  (state) => getUnapprovedTransactions(state),
  (_, transactionId) => transactionId,
  (unapprovedTxs, transactionId) => {
    return (
      Object.values(unapprovedTxs).find(({ id }) => id === transactionId) || {}
    );
  },
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
      return getUnapprovedTransaction(state, transactionId);
    }
    return getTransaction(state, transactionId);
  },
  (_state, _transactionId, _status, customTxParamsData) => customTxParamsData,
  (txData, transaction, customTxParamsData) => {
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
    return fullTxData;
  },
);

export const getAllConnectedAccounts = createDeepEqualSelector(
  getConnectedSubjectsForAllAddresses,
  (connectedSubjects) => {
    return Object.keys(connectedSubjects);
  },
);

///: BEGIN:ONLY_INCLUDE_IF(snaps)
export function getSnaps(state) {
  return state.metamask.snaps;
}

export const getSnap = createDeepEqualSelector(
  getSnaps,
  (_, snapId) => snapId,
  (snaps, snapId) => {
    return snaps[snapId];
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

export const getInsightSnaps = createDeepEqualSelector(
  getEnabledSnaps,
  getPermissionSubjects,
  (snaps, subjects) => {
    return Object.values(snaps).filter(
      ({ id }) => subjects[id]?.permissions['endowment:transaction-insight'],
    );
  },
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
 * @typedef {object} Notification
 * @property {string} id - A unique identifier for the notification
 * @property {string} origin - A string identifing the snap origin
 * @property {EpochTimeStamp} createdDate - A date in epochTimeStramps, identifying when the notification was first committed
 * @property {EpochTimeStamp} readDate - A date in epochTimeStramps, identifying when the notification was read by the user
 * @property {string} message - A string containing the notification message
 */

/**
 * Notifications are managed by the notification controller and referenced by
 * `state.metamask.notifications`. This function returns a list of notifications
 * the can be shown to the user.
 *
 * The returned notifications are sorted by date.
 *
 * @param {object} state - the redux state object
 * @returns {Notification[]} An array of notifications that can be shown to the user
 */

export function getNotifications(state) {
  const notifications = Object.values(state.metamask.notifications);

  const notificationsSortedByDate = notifications.sort(
    (a, b) => new Date(b.createdDate) - new Date(a.createdDate),
  );
  return notificationsSortedByDate;
}

export function getUnreadNotifications(state) {
  const notifications = getNotifications(state);

  const unreadNotificationCount = notifications.filter(
    (notification) => notification.readDate === null,
  );

  return unreadNotificationCount;
}

export const getUnreadNotificationsCount = createSelector(
  getUnreadNotifications,
  (notifications) => notifications.length,
);
///: END:ONLY_INCLUDE_IF

/**
 * Get an object of announcement IDs and if they are allowed or not.
 *
 * @param {object} state
 * @returns {object}
 */
function getAllowedAnnouncementIds(state) {
  const currentKeyring = getCurrentKeyring(state);
  const currentKeyringIsLedger = currentKeyring?.type === KeyringType.ledger;
  const supportsWebHid = window.navigator.hid !== undefined;
  const currentlyUsingLedgerLive =
    getLedgerTransportType(state) === LedgerTransportTypes.live;
  const isFirefox = window.navigator.userAgent.includes('Firefox');

  return {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: supportsWebHid && currentKeyringIsLedger && currentlyUsingLedgerLive,
    9: false,
    10: false,
    11: false,
    12: false,
    13: false,
    14: false,
    15: false,
    16: false,
    17: false,
    18: false,
    19: false,
    20: currentKeyringIsLedger && isFirefox,
    21: false,
    22: false,
    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    23: true,
    ///: END:ONLY_INCLUDE_IF
    24: state.metamask.hadAdvancedGasFeesSetPriorToMigration92_3 === true,
    // This syntax is unusual, but very helpful here.  It's equivalent to `unnamedObject[NOTIFICATION_DROP_LEDGER_FIREFOX] =`
    [NOTIFICATION_DROP_LEDGER_FIREFOX]: currentKeyringIsLedger && isFirefox,
    [NOTIFICATION_OPEN_BETA_SNAPS]: true,
    [NOTIFICATION_BUY_SELL_BUTTON]: true,
    [NOTIFICATION_U2F_LEDGER_LIVE]: currentKeyringIsLedger && !isFirefox,
  };
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

export function getOrderedNetworksList(state) {
  return state.metamask.orderedNetworkList;
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

export function getShowOutdatedBrowserWarning(state) {
  const { outdatedBrowserWarningLastShown } = state.metamask;
  if (!outdatedBrowserWarningLastShown) {
    return true;
  }
  const currentTime = new Date().getTime();
  return currentTime - outdatedBrowserWarningLastShown >= DAY * 2;
}

export function getShowBetaHeader(state) {
  return state.metamask.showBetaHeader;
}

export function getShowProductTour(state) {
  return state.metamask.showProductTour;
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

/**
 * To retrieve the token list for use throughout the UI. Will return the remotely fetched list
 * from the tokens controller if token detection is enabled, or the static list if not.
 *
 * @param {*} state
 * @returns {object}
 */
export function getTokenList(state) {
  const isTokenDetectionInactiveOnMainnet =
    getIsTokenDetectionInactiveOnMainnet(state);
  const caseInSensitiveTokenList = isTokenDetectionInactiveOnMainnet
    ? STATIC_MAINNET_TOKEN_LIST
    : state.metamask.tokenList;
  return caseInSensitiveTokenList;
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

export function getNetworksTabSelectedNetworkConfigurationId(state) {
  return state.appState.selectedNetworkConfigurationId;
}

export function getNetworkConfigurations(state) {
  return state.metamask.networkConfigurations;
}

export function getCurrentNetwork(state) {
  const allNetworks = getAllNetworks(state);
  const providerConfig = getProviderConfig(state);

  const filter =
    providerConfig.type === 'rpc'
      ? (network) => network.id === providerConfig.id
      : (network) => network.id === providerConfig.type;
  return allNetworks.find(filter);
}

export function getAllEnabledNetworks(state) {
  const nonTestNetworks = getNonTestNetworks(state);
  const allNetworks = getAllNetworks(state);
  const showTestnetNetworks = getShowTestNetworks(state);

  return showTestnetNetworks ? allNetworks : nonTestNetworks;
}

export function getTestNetworks(state) {
  const networkConfigurations = getNetworkConfigurations(state) || {};

  return [
    {
      chainId: CHAIN_IDS.GOERLI,
      nickname: GOERLI_DISPLAY_NAME,
      rpcUrl: CHAIN_ID_TO_RPC_URL_MAP[CHAIN_IDS.GOERLI],
      providerType: NETWORK_TYPES.GOERLI,
      ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.GOERLI],
      id: NETWORK_TYPES.GOERLI,
      removable: false,
    },
    {
      chainId: CHAIN_IDS.SEPOLIA,
      nickname: SEPOLIA_DISPLAY_NAME,
      rpcUrl: CHAIN_ID_TO_RPC_URL_MAP[CHAIN_IDS.SEPOLIA],
      providerType: NETWORK_TYPES.SEPOLIA,
      ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.SEPOLIA],
      id: NETWORK_TYPES.SEPOLIA,
      removable: false,
    },
    {
      chainId: CHAIN_IDS.LINEA_GOERLI,
      nickname: LINEA_GOERLI_DISPLAY_NAME,
      rpcUrl: CHAIN_ID_TO_RPC_URL_MAP[CHAIN_IDS.LINEA_GOERLI],
      rpcPrefs: {
        imageUrl: LINEA_GOERLI_TOKEN_IMAGE_URL,
      },
      providerType: NETWORK_TYPES.LINEA_GOERLI,
      ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_GOERLI],
      id: NETWORK_TYPES.LINEA_GOERLI,
      removable: false,
    },
    // Localhosts
    ...Object.values(networkConfigurations)
      .filter(({ chainId }) => chainId === CHAIN_IDS.LOCALHOST)
      .map((network) => ({ ...network, removable: true })),
  ];
}

export function getNonTestNetworks(state) {
  const networkConfigurations = getNetworkConfigurations(state) || {};

  return [
    // Mainnet always first
    {
      chainId: CHAIN_IDS.MAINNET,
      nickname: MAINNET_DISPLAY_NAME,
      rpcUrl: CHAIN_ID_TO_RPC_URL_MAP[CHAIN_IDS.MAINNET],
      rpcPrefs: {
        imageUrl: ETH_TOKEN_IMAGE_URL,
      },
      providerType: NETWORK_TYPES.MAINNET,
      ticker: CURRENCY_SYMBOLS.ETH,
      id: NETWORK_TYPES.MAINNET,
      removable: false,
    },
    {
      chainId: CHAIN_IDS.LINEA_MAINNET,
      nickname: LINEA_MAINNET_DISPLAY_NAME,
      rpcUrl: CHAIN_ID_TO_RPC_URL_MAP[CHAIN_IDS.LINEA_MAINNET],
      rpcPrefs: {
        imageUrl: LINEA_MAINNET_TOKEN_IMAGE_URL,
      },
      providerType: NETWORK_TYPES.LINEA_MAINNET,
      ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.LINEA_MAINNET],
      id: NETWORK_TYPES.LINEA_MAINNET,
      removable: false,
    },
    // Custom networks added by the user
    ...Object.values(networkConfigurations)
      .filter(({ chainId }) => ![CHAIN_IDS.LOCALHOST].includes(chainId))
      .map((network) => ({
        ...network,
        rpcPrefs: {
          ...network.rpcPrefs,
          // Provide an image based on chainID if a network
          // has been added without an image
          imageUrl:
            network?.rpcPrefs?.imageUrl ??
            CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId],
        },
        removable: true,
      })),
  ];
}

export function getAllNetworks(state) {
  const networks = [
    // Mainnet and custom networks
    ...getNonTestNetworks(state),
    // Test networks
    ...getTestNetworks(state),
  ];

  return networks;
}

export function getIsOptimism(state) {
  return (
    getCurrentChainId(state) === CHAIN_IDS.OPTIMISM ||
    getCurrentChainId(state) === CHAIN_IDS.OPTIMISM_TESTNET
  );
}

export function getIsBase(state) {
  return (
    getCurrentChainId(state) === CHAIN_IDS.BASE ||
    getCurrentChainId(state) === CHAIN_IDS.BASE_TESTNET
  );
}

export function getIsOpbnb(state) {
  return (
    getCurrentChainId(state) === CHAIN_IDS.OPBNB ||
    getCurrentChainId(state) === CHAIN_IDS.OPBNB_TESTNET
  );
}

export function getIsOpStack(state) {
  return getIsOptimism(state) || getIsBase(state) || getIsOpbnb(state);
}

export function getIsMultiLayerFeeNetwork(state) {
  return getIsOpStack(state);
}

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
    case CHAIN_IDS.LINEA_MAINNET:
      return LINEA_MAINNET_DISPLAY_NAME;
    case CHAIN_IDS.AURORA:
      return AURORA_DISPLAY_NAME;
    default:
      return '';
  }
};
/**
 * To check if the chainId supports token detection,
 * currently it returns true for Ethereum Mainnet, BSC, Polygon, Avalanche, Linea and Aurora
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
    CHAIN_IDS.LINEA_MAINNET,
    CHAIN_IDS.AURORA,
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
  const selectedAddress = getSelectedAddress(state);
  return state.metamask.allDetectedTokens?.[currentChainId]?.[selectedAddress];
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
 * currently it returns true for Ethereum Mainnet, Polygon, BSC, Avalanche and Aurora
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
 * To get the `transactionSecurityCheckEnabled` value which determines whether we use the transaction security check
 *
 * @param {*} state
 * @returns Boolean
 */
export function getIsTransactionSecurityCheckEnabled(state) {
  return state.metamask.transactionSecurityCheckEnabled;
}

/**
 * To get the `useRequestQueue` value which determines whether we use a request queue infront of provider api calls. This will have the effect of implementing per-dapp network switching.
 *
 * @param {*} state
 * @returns Boolean
 */
export function getUseRequestQueue(state) {
  return state.metamask.useRequestQueue;
}

///: BEGIN:ONLY_INCLUDE_IF(blockaid)
/**
 * To get the `getIsSecurityAlertsEnabled` value which determines whether security check is enabled
 *
 * @param {*} state
 * @returns Boolean
 */
export function getIsSecurityAlertsEnabled(state) {
  return state.metamask.securityAlertsEnabled;
}
///: END:ONLY_INCLUDE_IF

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

export function getIsCustomNetwork(state) {
  const chainId = getCurrentChainId(state);

  return !CHAIN_ID_TO_RPC_URL_MAP[chainId];
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

export function getIsNetworkUsed(state) {
  const chainId = getCurrentChainId(state);
  const { usedNetworks } = state.metamask;

  return Boolean(usedNetworks[chainId]);
}

export function getAllAccountsOnNetworkAreEmpty(state) {
  const balances = getMetaMaskCachedBalances(state) ?? {};
  const hasNoNativeFundsOnAnyAccounts = Object.values(balances).every(
    (balance) => balance === '0x0' || balance === '0x00',
  );
  const hasNoTokens = getNumberOfTokens(state) === 0;

  return hasNoNativeFundsOnAnyAccounts && hasNoTokens;
}

export function getShouldShowSeedPhraseReminder(state) {
  const { tokens, seedPhraseBackedUp, dismissSeedBackUpReminder } =
    state.metamask;
  const accountBalance = getCurrentEthBalance(state) ?? 0;
  return (
    seedPhraseBackedUp === false &&
    (parseInt(accountBalance, 16) > 0 || tokens.length > 0) &&
    dismissSeedBackUpReminder === false
  );
}

export function getCustomTokenAmount(state) {
  return state.appState.customTokenAmount;
}

export function getOnboardedInThisUISession(state) {
  return state.appState.onboardedInThisUISession;
}

export const useSafeChainsListValidationSelector = (state) => {
  return state.metamask.useSafeChainsListValidation;
};

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

///: BEGIN:ONLY_INCLUDE_IF(desktop)
/**
 * To get the `desktopEnabled` value which determines whether we use the desktop app
 *
 * @param {*} state
 * @returns Boolean
 */
export function getIsDesktopEnabled(state) {
  return state.metamask.desktopEnabled;
}
///: END:ONLY_INCLUDE_IF

///: BEGIN:ONLY_INCLUDE_IF(snaps)
/**
 * To get all installed snaps with proper metadata
 *
 * @param {*} state
 * @returns Boolean
 */
export function getSnapsList(state) {
  const snaps = getSnaps(state);
  return Object.entries(snaps).map(([key, snap]) => {
    const targetSubjectMetadata = getTargetSubjectMetadata(state, snap?.id);
    return {
      key,
      id: snap.id,
      iconUrl: targetSubjectMetadata?.iconUrl,
      subjectType: targetSubjectMetadata?.subjectType,
      packageName: removeSnapIdPrefix(snap.id),
      name: getSnapName(snap.id, targetSubjectMetadata),
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
///: END:ONLY_INCLUDE_IF
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
  const identities = getMetaMaskIdentities(state);

  const keyringAccounts = Object.values(identities).filter((identity) => {
    return (
      findKeyringForAddress(state, identity.address).type === 'Snap Keyring'
    );
  });
  return keyringAccounts;
}

export function getKeyringSnapRemovalResult(state) {
  return state.appState.keyringRemovalSnapModal;
}

///: END:ONLY_INCLUDE_IF
