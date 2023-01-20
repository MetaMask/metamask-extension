import {
  createSelector,
  createSelectorCreator,
  defaultMemoize,
} from 'reselect';
import {
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  memoize,
  ///: END:ONLY_INCLUDE_IN
  isEqual,
} from 'lodash';
import { addHexPrefix } from '../../app/scripts/lib/util';
import {
  TEST_CHAINS,
  NATIVE_CURRENCY_TOKEN_IMAGE_MAP,
  BUYABLE_CHAINS_MAP,
  MAINNET_DISPLAY_NAME,
  BSC_DISPLAY_NAME,
  POLYGON_DISPLAY_NAME,
  AVALANCHE_DISPLAY_NAME,
  CHAIN_ID_TO_RPC_URL_MAP,
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../shared/constants/network';
import { KEYRING_TYPES } from '../../shared/constants/keyrings';
import {
  WEBHID_CONNECTED_STATUSES,
  LEDGER_TRANSPORT_TYPES,
  TRANSPORT_STATES,
} from '../../shared/constants/hardware-wallets';

import {
  MESSAGE_TYPE,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  SUBJECT_TYPES,
  ///: END:ONLY_INCLUDE_IN
} from '../../shared/constants/app';

import { TRUNCATED_NAME_CHAR_LIMIT } from '../../shared/constants/labels';

import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  ALLOWED_PROD_SWAPS_CHAIN_IDS,
  ALLOWED_DEV_SWAPS_CHAIN_IDS,
} from '../../shared/constants/swaps';

import {
  shortenAddress,
  getAccountByAddress,
  getURLHostName,
} from '../helpers/utils/util';

import { TEMPLATED_CONFIRMATION_MESSAGE_TYPES } from '../pages/confirmation/templates';
import { STATIC_MAINNET_TOKEN_LIST } from '../../shared/constants/tokens';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import { DAY } from '../../shared/constants/time';
import {
  getNativeCurrency,
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
import { formatMoonpaySymbol } from '../helpers/utils/moonpay';
import { TransactionStatus } from '../../shared/constants/transaction';
import {
  getValueFromWeiHex,
  hexToDecimal,
} from '../../shared/modules/conversion.utils';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import { SNAPS_VIEW_ROUTE } from '../helpers/constants/routes';
import { getPermissionSubjects } from './permissions';
///: END:ONLY_INCLUDE_IN

/**
 * One of the only remaining valid uses of selecting the network subkey of the
 * metamask state tree is to determine if the network is currently 'loading'.
 *
 * This will be used for all cases where this state key is accessed only for that
 * purpose.
 *
 * @param {object} state - redux state object
 */
export function isNetworkLoading(state) {
  return state.metamask.network === 'loading';
}

export function getNetworkIdentifier(state) {
  const {
    metamask: {
      provider: { type, nickname, rpcUrl },
    },
  } = state;

  return nickname || rpcUrl || type;
}

export function getMetricsNetworkIdentifier(state) {
  const { provider } = state.metamask;
  return provider.type === NETWORK_TYPES.RPC ? provider.rpcUrl : provider.type;
}

export function getCurrentChainId(state) {
  const { chainId } = state.metamask.provider;
  return chainId;
}

export function isCurrentProviderCustom(state) {
  const provider = getProvider(state);
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
  const qrKeyring = keyrings.find((kr) => kr.type === KEYRING_TYPES.QR);
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
  const qrKeyring = keyrings.find((kr) => kr.type === KEYRING_TYPES.QR);
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

export function getParticipateInMetaMetrics(state) {
  return Boolean(state.metamask.participateInMetaMetrics);
}

export function isEIP1559Account() {
  return true;
}

/**
 * The function returns true if network and account details are fetched and
 * both of them support EIP-1559.
 *
 * @param state
 */
export function checkNetworkAndAccountSupports1559(state) {
  const networkSupports1559 = isEIP1559Network(state);
  const accountSupports1559 = isEIP1559Account(state);

  return networkSupports1559 && accountSupports1559;
}

/**
 * The function returns true if network and account details are fetched and
 * either of them do not support EIP-1559.
 *
 * @param state
 */
export function checkNetworkOrAccountNotSupports1559(state) {
  const networkNotSupports1559 = isNotEIP1559Network(state);
  const accountSupports1559 = isEIP1559Account(state);

  return networkNotSupports1559 || accountSupports1559 === false;
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
  const type = currentKeyring && currentKeyring.type;

  switch (type) {
    case KEYRING_TYPES.TREZOR:
    case KEYRING_TYPES.LEDGER:
    case KEYRING_TYPES.LATTICE:
      return 'hardware';
    case KEYRING_TYPES.IMPORTED:
      return 'imported';
    default:
      return 'default';
  }
}

/**
 * get the currently selected networkId which will be 'loading' when the
 * network changes. The network id should not be used in most cases,
 * instead use chainId in most situations. There are a limited number of
 * use cases to use this method still, such as when comparing transaction
 * metadata that predates the switch to using chainId.
 *
 * @deprecated - use getCurrentChainId instead
 * @param {object} state - redux state object
 */
export function deprecatedGetCurrentNetworkId(state) {
  return state.metamask.network;
}

export const getMetaMaskAccounts = createSelector(
  getMetaMaskAccountsRaw,
  getMetaMaskCachedBalances,
  (currentAccounts, cachedBalances) =>
    Object.entries(currentAccounts).reduce(
      (selectedAccounts, [accountID, account]) => {
        if (account.balance === null || account.balance === undefined) {
          return {
            ...selectedAccounts,
            [accountID]: {
              ...account,
              balance: cachedBalances && cachedBalances[accountID],
            },
          };
        }
        return {
          ...selectedAccounts,
          [accountID]: account,
        };
      },
      {},
    ),
);

export function getSelectedAddress(state) {
  return state.metamask.selectedAddress;
}

export function getSelectedIdentity(state) {
  const selectedAddress = getSelectedAddress(state);
  const { identities } = state.metamask;

  return identities[selectedAddress];
}

export function getNumberOfAccounts(state) {
  return Object.keys(state.metamask.accounts).length;
}

export function getNumberOfTokens(state) {
  const { tokens } = state.metamask;
  return tokens ? tokens.length : 0;
}

export function getMetaMaskKeyrings(state) {
  return state.metamask.keyrings;
}

export function getMetaMaskIdentities(state) {
  return state.metamask.identities;
}

export function getMetaMaskAccountsRaw(state) {
  return state.metamask.accounts;
}

export function getMetaMaskCachedBalances(state) {
  const chainId = getCurrentChainId(state);

  // Fallback to fetching cached balances from network id
  // this can eventually be removed
  const network = deprecatedGetCurrentNetworkId(state);

  return (
    state.metamask.cachedBalances[chainId] ??
    state.metamask.cachedBalances[network]
  );
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
    state.metamask.accounts[getSelectedAddress(state)].balance;
  const cachedBalance = getSelectedAccountCachedBalance(state);

  return Boolean(!selectedAccountBalance && cachedBalance);
}

export function getSelectedAccountCachedBalance(state) {
  const cachedBalances = getMetaMaskCachedBalances(state);
  const selectedAddress = getSelectedAddress(state);

  return cachedBalances && cachedBalances[selectedAddress];
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
      isEqualCaseInsensitive(identity.address, toChecksumHexAddress(address)),
    );

  return entry?.name || '';
}

export function getAddressBookEntry(state, address) {
  const addressBook = getAddressBook(state);
  const entry = addressBook.find((contact) =>
    isEqualCaseInsensitive(contact.address, toChecksumHexAddress(address)),
  );
  return entry;
}

export function getAddressBookEntryOrAccountName(state, address) {
  const entry =
    getAddressBookEntry(state, address) ||
    Object.values(state.metamask.identities).find((identity) =>
      isEqualCaseInsensitive(identity.address, toChecksumHexAddress(address)),
    );
  return entry && entry.name !== '' ? entry.name : address;
}

export function getAccountName(identities, address) {
  const entry = Object.values(identities).find((identity) =>
    isEqualCaseInsensitive(identity.address, toChecksumHexAddress(address)),
  );
  return entry && entry.name !== '' ? entry.name : '';
}

export function getMetadataContractName(state, address) {
  const tokenList = getTokenList(state);
  const entry = Object.values(tokenList).find((identity) =>
    isEqualCaseInsensitive(identity.address, toChecksumHexAddress(address)),
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
  const {
    unapprovedMsgCount = 0,
    unapprovedPersonalMsgCount = 0,
    unapprovedDecryptMsgCount = 0,
    unapprovedEncryptionPublicKeyMsgCount = 0,
    unapprovedTypedMessagesCount = 0,
    pendingApprovalCount = 0,
  } = state.metamask;

  return (
    unapprovedMsgCount +
    unapprovedPersonalMsgCount +
    unapprovedDecryptMsgCount +
    unapprovedEncryptionPublicKeyMsgCount +
    unapprovedTypedMessagesCount +
    getUnapprovedTxCount(state) +
    pendingApprovalCount +
    getSuggestedAssetCount(state)
  );
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

export function getUnapprovedTxCount(state) {
  const { unapprovedTxs = {} } = state.metamask;
  return Object.keys(unapprovedTxs).length;
}

export function getUnapprovedConfirmations(state) {
  const { pendingApprovals } = state.metamask;
  return Object.values(pendingApprovals);
}

export function getUnapprovedTemplatedConfirmations(state) {
  const unapprovedConfirmations = getUnapprovedConfirmations(state);
  return unapprovedConfirmations.filter((approval) =>
    TEMPLATED_CONFIRMATION_MESSAGE_TYPES.includes(approval.type),
  );
}

function getSuggestedAssetCount(state) {
  const { suggestedAssets = [] } = state.metamask;
  return suggestedAssets.length;
}

export function getSuggestedAssets(state) {
  return state.metamask.suggestedAssets;
}

export function getIsMainnet(state) {
  const chainId = getCurrentChainId(state);
  return chainId === CHAIN_IDS.MAINNET;
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

export function getShouldShowFiat(state) {
  const isMainNet = getIsMainnet(state);
  const isCustomNetwork = getIsCustomNetwork(state);
  const conversionRate = getConversionRate(state);
  const useCurrencyRateCheck = getUseCurrencyRateCheck(state);
  const { showFiatInTestnets } = getPreferences(state);
  return Boolean(
    (isMainNet || isCustomNetwork || showFiatInTestnets) &&
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

///: BEGIN:ONLY_INCLUDE_IN(flask)
/**
 * @param {string} svgString - The raw SVG string to make embeddable.
 * @returns {string} The embeddable SVG string.
 */
const getEmbeddableSvg = memoize(
  (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`,
);
///: END:ONLY_INCLUDE_IN

export function getTargetSubjectMetadata(state, origin) {
  const metadata = getSubjectMetadata(state)[origin];

  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  if (metadata?.subjectType === SUBJECT_TYPES.SNAP) {
    const { svgIcon, ...remainingMetadata } = metadata;
    return {
      ...remainingMetadata,
      iconUrl: svgIcon ? getEmbeddableSvg(svgIcon) : null,
    };
  }
  ///: END:ONLY_INCLUDE_IN
  return metadata;
}

export function getRpcPrefsForCurrentProvider(state) {
  const { frequentRpcListDetail, provider } = state.metamask;
  const selectRpcInfo = frequentRpcListDetail.find(
    (rpcInfo) => rpcInfo.rpcUrl === provider.rpcUrl,
  );
  const { rpcPrefs = {} } = selectRpcInfo || {};
  return rpcPrefs;
}

export function getKnownMethodData(state, data) {
  if (!data) {
    return null;
  }
  const prefixedData = addHexPrefix(data);
  const fourBytePrefix = prefixedData.slice(0, 10);
  const { knownMethodData } = state.metamask;

  return knownMethodData && knownMethodData[fourBytePrefix];
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
  return Boolean(state.metamask.infuraBlocked);
}

export function getUSDConversionRate(state) {
  return state.metamask.usdConversionRate;
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
  const { balance } = selectedAccount;
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

export function getIsBuyableChain(state) {
  const chainId = getCurrentChainId(state);
  return Object.keys(BUYABLE_CHAINS_MAP).includes(chainId);
}

export function getIsBuyableTransakChain(state) {
  const chainId = getCurrentChainId(state);
  return Boolean(BUYABLE_CHAINS_MAP?.[chainId]?.transakCurrencies);
}

export function getIsBuyableTransakToken(state, symbol) {
  const chainId = getCurrentChainId(state);
  return Boolean(
    BUYABLE_CHAINS_MAP?.[chainId]?.transakCurrencies?.includes(symbol),
  );
}

export function getIsBuyableMoonpayToken(state, symbol) {
  const chainId = getCurrentChainId(state);
  const _symbol = formatMoonpaySymbol(symbol, chainId);
  return Boolean(
    BUYABLE_CHAINS_MAP?.[chainId]?.moonPay?.showOnlyCurrencies?.includes(
      _symbol,
    ),
  );
}

export function getIsBuyableWyreToken(state, symbol) {
  const chainId = getCurrentChainId(state);
  return Boolean(
    BUYABLE_CHAINS_MAP?.[chainId]?.wyre?.currencies.includes(symbol),
  );
}

export function getIsBuyableMoonPayChain(state) {
  const chainId = getCurrentChainId(state);
  return Boolean(BUYABLE_CHAINS_MAP?.[chainId]?.moonPay);
}

export function getIsBuyableWyreChain(state) {
  const chainId = getCurrentChainId(state);
  return Boolean(BUYABLE_CHAINS_MAP?.[chainId]?.wyre);
}
export function getIsBuyableCoinbasePayChain(state) {
  const chainId = getCurrentChainId(state);
  return Boolean(BUYABLE_CHAINS_MAP?.[chainId]?.coinbasePayCurrencies);
}

export function getIsBuyableCoinbasePayToken(state, symbol) {
  const chainId = getCurrentChainId(state);
  return Boolean(
    BUYABLE_CHAINS_MAP?.[chainId]?.coinbasePayCurrencies?.includes(symbol),
  );
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

const createDeepEqualSelector = createSelectorCreator(defaultMemoize, isEqual);

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
      isEqualCaseInsensitive(identity.address, toChecksumHexAddress(address)),
    );
    return entry && entry.name !== '' ? entry.name : '';
  },
);

export const getUnapprovedTransactions = (state) =>
  state.metamask.unapprovedTxs;

const getCurrentNetworkTransactionList = (state) =>
  state.metamask.currentNetworkTxList;

export const getTxData = (state) => state.confirmTransaction.txData;

export const getUnapprovedTransaction = createDeepEqualSelector(
  getUnapprovedTransactions,
  (_, transactionId) => transactionId,
  (unapprovedTxs, transactionId) => {
    return (
      Object.values(unapprovedTxs).find(({ id }) => id === transactionId) || {}
    );
  },
);

export const getTransaction = createDeepEqualSelector(
  getCurrentNetworkTransactionList,
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
      txData.simulationFails = transaction.simulationFails;
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

///: BEGIN:ONLY_INCLUDE_IN(flask)
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

export const getInsightSnaps = createDeepEqualSelector(
  getSnaps,
  getPermissionSubjects,
  (snaps, subjects) => {
    return Object.values(snaps).filter(
      ({ id }) => subjects[id]?.permissions['endowment:transaction-insight'],
    );
  },
);

export const getSnapsRouteObjects = createSelector(getSnaps, (snaps) => {
  return Object.values(snaps).map((snap) => {
    return {
      id: snap.id,
      tabMessage: () => snap.manifest.proposedName,
      descriptionMessage: () => snap.manifest.description,
      sectionMessage: () => snap.manifest.description,
      route: `${SNAPS_VIEW_ROUTE}/${encodeURIComponent(snap.id)}`,
      icon: 'fa fa-flask',
    };
  });
});

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
///: END:ONLY_INCLUDE_IN

/**
 * Get an object of announcement IDs and if they are allowed or not.
 *
 * @param {object} state
 * @returns {object}
 */
function getAllowedAnnouncementIds(state) {
  const currentKeyring = getCurrentKeyring(state);
  const currentKeyringIsLedger = currentKeyring?.type === KEYRING_TYPES.LEDGER;
  const supportsWebHid = window.navigator.hid !== undefined;
  const currentlyUsingLedgerLive =
    getLedgerTransportType(state) === LEDGER_TRANSPORT_TYPES.LIVE;

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
    16: true,
    17: true,
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

export function getShowRecoveryPhraseReminder(state) {
  const {
    recoveryPhraseReminderLastShown,
    recoveryPhraseReminderHasBeenShown,
  } = state.metamask;

  const currentTime = new Date().getTime();
  const frequency = recoveryPhraseReminderHasBeenShown ? DAY * 90 : DAY * 2;

  return currentTime - recoveryPhraseReminderLastShown >= frequency;
}

export function getShowPortfolioTooltip(state) {
  return state.metamask.showPortfolioTooltip;
}

export function getShowBetaHeader(state) {
  return state.metamask.showBetaHeader;
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
    getLedgerTransportType(state) === LEDGER_TRANSPORT_TYPES.WEBHID;
  const webHidIsNotConnected =
    getLedgerWebHidConnectedStatus(state) !==
    WEBHID_CONNECTED_STATUSES.CONNECTED;
  const ledgerTransportStatus = getLedgerTransportStatus(state);
  const transportIsNotSuccessfullyCreated =
    ledgerTransportStatus !== TRANSPORT_STATES.VERIFIED;

  return (
    addressIsLedger &&
    transportTypePreferenceIsWebHID &&
    (webHidIsNotConnected || transportIsNotSuccessfullyCreated)
  );
}

export function getNewCollectibleAddedMessage(state) {
  return state.appState.newCollectibleAddedMessage;
}

/**
 * To retrieve the name of the new Network added using add network form
 *
 * @param {*} state
 * @returns string
 */
export function getNewNetworkAdded(state) {
  return state.appState.newNetworkAdded;
}

export function getNetworksTabSelectedRpcUrl(state) {
  return state.appState.networksTabSelectedRpcUrl;
}

export function getProvider(state) {
  return state.metamask.provider;
}

export function getFrequentRpcListDetail(state) {
  return state.metamask.frequentRpcListDetail;
}

export function getIsOptimism(state) {
  return (
    getCurrentChainId(state) === CHAIN_IDS.OPTIMISM ||
    getCurrentChainId(state) === CHAIN_IDS.OPTIMISM_TESTNET
  );
}

export function getNetworkSupportsSettingGasFees(state) {
  return !getIsOptimism(state);
}

export function getIsMultiLayerFeeNetwork(state) {
  return getIsOptimism(state);
}
/**
 *  To retrieve the maxBaseFee and priotitFee teh user has set as default
 *
 * @param {*} state
 * @returns Boolean
 */
export function getAdvancedGasFeeValues(state) {
  return state.metamask.advancedGasFee;
}

/**
 *  To check if the user has set advanced gas fee settings as default with a non empty  maxBaseFee and priotityFee.
 *
 * @param {*} state
 * @returns Boolean
 */
export function getIsAdvancedGasFeeDefault(state) {
  const { advancedGasFee } = state.metamask;
  return (
    Boolean(advancedGasFee?.maxBaseFee) && Boolean(advancedGasFee?.priorityFee)
  );
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
    default:
      return '';
  }
};
/**
 * To check if teh chainId supports token detection ,
 * currently it returns true for Ethereum Mainnet, Polygon, BSC and Avalanche
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
 * currently it returns true for Ethereum Mainnet, Polygon, BSC and Avalanche
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
 * To get the `improvedTokenAllowanceEnabled` value which determines whether we use the improved token allowance
 *
 * @param {*} state
 * @returns Boolean
 */
export function getIsImprovedTokenAllowanceEnabled(state) {
  return state.metamask.improvedTokenAllowanceEnabled;
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

/**
 * To get the useCurrencyRateCheck flag which to check if the user prefers currency conversion
 *
 * @param {*} state
 * @returns Boolean
 */
export function getUseCurrencyRateCheck(state) {
  return Boolean(state.metamask.useCurrencyRateCheck);
}
