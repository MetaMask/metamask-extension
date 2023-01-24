import { ObservableStore } from '@metamask/obs-store';
import { normalize as normalizeAddress } from 'eth-sig-util';
import { ethers } from 'ethers';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../shared/constants/network';
import { isPrefixedFormattedHexString } from '../../../shared/modules/network.utils';
import { LEDGER_TRANSPORT_TYPES } from '../../../shared/constants/hardware-wallets';
import { THEME_TYPE } from '../../../ui/pages/settings/settings-tab/settings-tab.constant';
import { NETWORK_EVENTS } from './network';

export default class PreferencesController {
  /**
   *
   * @typedef {object} PreferencesController
   * @param {object} opts - Overrides the defaults for the initial state of this.store
   * @property {object} store The stored object containing a users preferences, stored in local storage
   * @property {Array} store.frequentRpcList A list of custom rpcs to provide the user
   * @property {boolean} store.useBlockie The users preference for blockie identicons within the UI
   * @property {boolean} store.useNonceField The users preference for nonce field within the UI
   * @property {object} store.featureFlags A key-boolean map, where keys refer to features and booleans to whether the
   * user wishes to see that feature.
   *
   * Feature flags can be set by the global function `setPreference(feature, enabled)`, and so should not expose any sensitive behavior.
   * @property {object} store.knownMethodData Contains all data methods known by the user
   * @property {string} store.currentLocale The preferred language locale key
   * @property {string} store.selectedAddress A hex string that matches the currently selected address in the app
   */
  constructor(opts = {}) {
    const initState = {
      frequentRpcListDetail: [],
      useBlockie: false,
      useNonceField: false,
      usePhishDetect: true,
      dismissSeedBackUpReminder: false,
      useMultiAccountBalanceChecker: true,

      // set to true means the dynamic list from the API is being used
      // set to false will be using the static list from contract-metadata
      useTokenDetection: false,
      useNftDetection: false,
      useCurrencyRateCheck: true,
      openSeaEnabled: false,
      advancedGasFee: null,

      // WARNING: Do not use feature flags for security-sensitive things.
      // Feature flag toggling is available in the global namespace
      // for convenient testing of pre-release features, and should never
      // perform sensitive operations.
      featureFlags: {
        showIncomingTransactions: true,
      },
      knownMethodData: {},
      currentLocale: opts.initLangCode,
      identities: {},
      lostIdentities: {},
      forgottenPassword: false,
      preferences: {
        autoLockTimeLimit: undefined,
        showFiatInTestnets: false,
        showTestNetworks: false,
        useNativeCurrencyAsPrimaryCurrency: true,
        hideZeroBalanceTokens: false,
      },
      // ENS decentralized website resolution
      ipfsGateway: IPFS_DEFAULT_GATEWAY_URL,
      infuraBlocked: null,
      ledgerTransportType: window.navigator.hid
        ? LEDGER_TRANSPORT_TYPES.WEBHID
        : LEDGER_TRANSPORT_TYPES.U2F,
      improvedTokenAllowanceEnabled: false,
      transactionSecurityCheckEnabled: false,
      theme: THEME_TYPE.OS,
      ...opts.initState,
    };

    this.network = opts.network;
    this.ethersProvider = new ethers.providers.Web3Provider(opts.provider);
    this.store = new ObservableStore(initState);
    this.store.setMaxListeners(12);
    this.openPopup = opts.openPopup;
    this.tokenListController = opts.tokenListController;

    this._subscribeToInfuraAvailability();

    global.setPreference = (key, value) => {
      return this.setFeatureFlag(key, value);
    };
  }
  // PUBLIC METHODS

  /**
   * Sets the {@code forgottenPassword} state property
   *
   * @param {boolean} forgottenPassword - whether or not the user has forgotten their password
   */
  setPasswordForgotten(forgottenPassword) {
    this.store.updateState({ forgottenPassword });
  }

  /**
   * Setter for the `useBlockie` property
   *
   * @param {boolean} val - Whether or not the user prefers blockie indicators
   */
  setUseBlockie(val) {
    this.store.updateState({ useBlockie: val });
  }

  /**
   * Setter for the `useNonceField` property
   *
   * @param {boolean} val - Whether or not the user prefers to set nonce
   */
  setUseNonceField(val) {
    this.store.updateState({ useNonceField: val });
  }

  /**
   * Setter for the `usePhishDetect` property
   *
   * @param {boolean} val - Whether or not the user prefers phishing domain protection
   */
  setUsePhishDetect(val) {
    this.store.updateState({ usePhishDetect: val });
  }

  /**
   * Setter for the `useMultiAccountBalanceChecker` property
   *
   * @param {boolean} val - Whether or not the user prefers to turn off/on all security settings
   */
  setUseMultiAccountBalanceChecker(val) {
    this.store.updateState({ useMultiAccountBalanceChecker: val });
  }

  /**
   * Setter for the `useTokenDetection` property
   *
   * @param {boolean} val - Whether or not the user prefers to use the static token list or dynamic token list from the API
   */
  setUseTokenDetection(val) {
    this.store.updateState({ useTokenDetection: val });
    this.tokenListController.updatePreventPollingOnNetworkRestart(!val);
    if (val) {
      this.tokenListController.start();
    } else {
      this.tokenListController.clearingTokenListData();
      this.tokenListController.stop();
    }
  }

  /**
   * Setter for the `useNftDetection` property
   *
   * @param {boolean} useNftDetection - Whether or not the user prefers to autodetect collectibles.
   */
  setUseNftDetection(useNftDetection) {
    this.store.updateState({ useNftDetection });
  }

  /**
   * Setter for the `useCurrencyRateCheck` property
   *
   * @param {boolean} val - Whether or not the user prefers to use currency rate check for ETH and tokens.
   */
  setUseCurrencyRateCheck(val) {
    this.store.updateState({ useCurrencyRateCheck: val });
  }

  /**
   * Setter for the `openSeaEnabled` property
   *
   * @param {boolean} openSeaEnabled - Whether or not the user prefers to use the OpenSea API for collectibles data.
   */
  setOpenSeaEnabled(openSeaEnabled) {
    this.store.updateState({
      openSeaEnabled,
    });
  }

  /**
   * Setter for the `advancedGasFee` property
   *
   * @param {object} val - holds the maxBaseFee and PriorityFee that the user set as default advanced settings.
   */
  setAdvancedGasFee(val) {
    this.store.updateState({ advancedGasFee: val });
  }

  /**
   * Setter for the `theme` property
   *
   * @param {string} val - 'default' or 'dark' value based on the mode selected by user.
   */
  setTheme(val) {
    this.store.updateState({ theme: val });
  }

  /**
   * Setter for the `improvedTokenAllowanceEnabled` property
   *
   * @param improvedTokenAllowanceEnabled
   */
  setImprovedTokenAllowanceEnabled(improvedTokenAllowanceEnabled) {
    this.store.updateState({
      improvedTokenAllowanceEnabled,
    });
  }

  /**
   * Setter for the `transactionSecurityCheckEnabled` property
   *
   * @param transactionSecurityCheckEnabled
   */
  setTransactionSecurityCheckEnabled(transactionSecurityCheckEnabled) {
    this.store.updateState({
      transactionSecurityCheckEnabled,
    });
  }

  /**
   * Add new methodData to state, to avoid requesting this information again through Infura
   *
   * @param {string} fourBytePrefix - Four-byte method signature
   * @param {string} methodData - Corresponding data method
   */
  addKnownMethodData(fourBytePrefix, methodData) {
    const { knownMethodData } = this.store.getState();
    knownMethodData[fourBytePrefix] = methodData;
    this.store.updateState({ knownMethodData });
  }

  /**
   * Setter for the `currentLocale` property
   *
   * @param {string} key - he preferred language locale key
   */
  setCurrentLocale(key) {
    const textDirection = ['ar', 'dv', 'fa', 'he', 'ku'].includes(key)
      ? 'rtl'
      : 'auto';
    this.store.updateState({
      currentLocale: key,
      textDirection,
    });
    return textDirection;
  }

  /**
   * Updates identities to only include specified addresses. Removes identities
   * not included in addresses array
   *
   * @param {string[]} addresses - An array of hex addresses
   */
  setAddresses(addresses) {
    const oldIdentities = this.store.getState().identities;

    const identities = addresses.reduce((ids, address, index) => {
      const oldId = oldIdentities[address] || {};
      ids[address] = { name: `Account ${index + 1}`, address, ...oldId };
      return ids;
    }, {});

    this.store.updateState({ identities });
  }

  /**
   * Removes an address from state
   *
   * @param {string} address - A hex address
   * @returns {string} the address that was removed
   */
  removeAddress(address) {
    const { identities } = this.store.getState();

    if (!identities[address]) {
      throw new Error(`${address} can't be deleted cause it was not found`);
    }
    delete identities[address];
    this.store.updateState({ identities });

    // If the selected account is no longer valid,
    // select an arbitrary other account:
    if (address === this.getSelectedAddress()) {
      const [selected] = Object.keys(identities);
      this.setSelectedAddress(selected);
    }
    return address;
  }

  /**
   * Adds addresses to the identities object without removing identities
   *
   * @param {string[]} addresses - An array of hex addresses
   */
  addAddresses(addresses) {
    const { identities } = this.store.getState();
    addresses.forEach((address) => {
      // skip if already exists
      if (identities[address]) {
        return;
      }
      // add missing identity
      const identityCount = Object.keys(identities).length;

      identities[address] = { name: `Account ${identityCount + 1}`, address };
    });
    this.store.updateState({ identities });
  }

  /**
   * Synchronizes identity entries with known accounts.
   * Removes any unknown identities, and returns the resulting selected address.
   *
   * @param {Array<string>} addresses - known to the vault.
   * @returns {Promise<string>} selectedAddress the selected address.
   */
  syncAddresses(addresses) {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('Expected non-empty array of addresses. Error #11201');
    }

    const { identities, lostIdentities } = this.store.getState();

    const newlyLost = {};
    Object.keys(identities).forEach((identity) => {
      if (!addresses.includes(identity)) {
        newlyLost[identity] = identities[identity];
        delete identities[identity];
      }
    });

    // Identities are no longer present.
    if (Object.keys(newlyLost).length > 0) {
      // store lost accounts
      Object.keys(newlyLost).forEach((key) => {
        lostIdentities[key] = newlyLost[key];
      });
    }

    this.store.updateState({ identities, lostIdentities });
    this.addAddresses(addresses);

    // If the selected account is no longer valid,
    // select an arbitrary other account:
    let selected = this.getSelectedAddress();
    if (!addresses.includes(selected)) {
      [selected] = addresses;
      this.setSelectedAddress(selected);
    }

    return selected;
  }

  /**
   * Setter for the `selectedAddress` property
   *
   * @param {string} _address - A new hex address for an account
   */
  setSelectedAddress(_address) {
    const address = normalizeAddress(_address);

    const { identities } = this.store.getState();
    const selectedIdentity = identities[address];
    if (!selectedIdentity) {
      throw new Error(`Identity for '${address} not found`);
    }

    selectedIdentity.lastSelected = Date.now();
    this.store.updateState({ identities, selectedAddress: address });
  }

  /**
   * Getter for the `selectedAddress` property
   *
   * @returns {string} The hex address for the currently selected account
   */
  getSelectedAddress() {
    return this.store.getState().selectedAddress;
  }

  /**
   * Sets a custom label for an account
   *
   * @param {string} account - the account to set a label for
   * @param {string} label - the custom label for the account
   * @returns {Promise<string>}
   */
  setAccountLabel(account, label) {
    if (!account) {
      throw new Error(
        `setAccountLabel requires a valid address, got ${String(account)}`,
      );
    }
    const address = normalizeAddress(account);
    const { identities } = this.store.getState();
    identities[address] = identities[address] || {};
    identities[address].name = label;
    this.store.updateState({ identities });
    return Promise.resolve(label);
  }

  /**
   * Adds custom RPC url to state.
   *
   * @param {string} rpcUrl - The RPC url to add to frequentRpcList.
   * @param {string} chainId - The chainId of the selected network.
   * @param {string} [ticker] - Ticker symbol of the selected network.
   * @param {string} [nickname] - Nickname of the selected network.
   * @param {object} [rpcPrefs] - Optional RPC preferences, such as the block explorer URL
   */
  upsertToFrequentRpcList(
    rpcUrl,
    chainId,
    ticker = 'ETH',
    nickname = '',
    rpcPrefs = {},
  ) {
    const rpcList = this.getFrequentRpcListDetail();

    const index = rpcList.findIndex((element) => {
      return element.rpcUrl === rpcUrl;
    });
    if (index !== -1) {
      rpcList.splice(index, 1, { rpcUrl, chainId, ticker, nickname, rpcPrefs });
      return;
    }

    if (!isPrefixedFormattedHexString(chainId)) {
      throw new Error(`Invalid chainId: "${chainId}"`);
    }

    rpcList.push({ rpcUrl, chainId, ticker, nickname, rpcPrefs });
    this.store.updateState({ frequentRpcListDetail: rpcList });
  }

  /**
   * Removes custom RPC url from state.
   *
   * @param {string} url - The RPC url to remove from frequentRpcList.
   * @returns {Promise<Array>} Promise resolving to updated frequentRpcList.
   */
  removeFromFrequentRpcList(url) {
    const rpcList = this.getFrequentRpcListDetail();
    const index = rpcList.findIndex((element) => {
      return element.rpcUrl === url;
    });
    if (index !== -1) {
      rpcList.splice(index, 1);
    }
    this.store.updateState({ frequentRpcListDetail: rpcList });
    return Promise.resolve(rpcList);
  }

  /**
   * Getter for the `frequentRpcListDetail` property.
   *
   * @returns {Array<Array>} An array of rpc urls.
   */
  getFrequentRpcListDetail() {
    return this.store.getState().frequentRpcListDetail;
  }

  /**
   * Updates the `featureFlags` property, which is an object. One property within that object will be set to a boolean.
   *
   * @param {string} feature - A key that corresponds to a UI feature.
   * @param {boolean} activated - Indicates whether or not the UI feature should be displayed
   * @returns {Promise<object>} Promises a new object; the updated featureFlags object.
   */
  setFeatureFlag(feature, activated) {
    const currentFeatureFlags = this.store.getState().featureFlags;
    const updatedFeatureFlags = {
      ...currentFeatureFlags,
      [feature]: activated,
    };

    this.store.updateState({ featureFlags: updatedFeatureFlags });

    return Promise.resolve(updatedFeatureFlags);
  }

  /**
   * Updates the `preferences` property, which is an object. These are user-controlled features
   * found in the settings page.
   *
   * @param {string} preference - The preference to enable or disable.
   * @param {boolean} value - Indicates whether or not the preference should be enabled or disabled.
   * @returns {Promise<object>} Promises a new object; the updated preferences object.
   */
  setPreference(preference, value) {
    const currentPreferences = this.getPreferences();
    const updatedPreferences = {
      ...currentPreferences,
      [preference]: value,
    };

    this.store.updateState({ preferences: updatedPreferences });
    return Promise.resolve(updatedPreferences);
  }

  /**
   * A getter for the `preferences` property
   *
   * @returns {object} A key-boolean map of user-selected preferences.
   */
  getPreferences() {
    return this.store.getState().preferences;
  }

  /**
   * A getter for the `ipfsGateway` property
   *
   * @returns {string} The current IPFS gateway domain
   */
  getIpfsGateway() {
    return this.store.getState().ipfsGateway;
  }

  /**
   * A setter for the `ipfsGateway` property
   *
   * @param {string} domain - The new IPFS gateway domain
   * @returns {Promise<string>} A promise of the update IPFS gateway domain
   */
  setIpfsGateway(domain) {
    this.store.updateState({ ipfsGateway: domain });
    return Promise.resolve(domain);
  }

  /**
   * A setter for the `ledgerTransportType` property.
   *
   * @param {string} ledgerTransportType - Either 'ledgerLive', 'webhid' or 'u2f'
   * @returns {string} The transport type that was set.
   */
  setLedgerTransportPreference(ledgerTransportType) {
    this.store.updateState({ ledgerTransportType });
    return ledgerTransportType;
  }

  /**
   * A getter for the `ledgerTransportType` property.
   *
   * @returns {string} The current preferred Ledger transport type.
   */
  getLedgerTransportPreference() {
    return this.store.getState().ledgerTransportType;
  }

  /**
   * A setter for the user preference to dismiss the seed phrase backup reminder
   *
   * @param {bool} dismissSeedBackUpReminder - User preference for dismissing the back up reminder.
   */
  async setDismissSeedBackUpReminder(dismissSeedBackUpReminder) {
    await this.store.updateState({
      dismissSeedBackUpReminder,
    });
  }

  //
  // PRIVATE METHODS
  //

  _subscribeToInfuraAvailability() {
    this.network.on(NETWORK_EVENTS.INFURA_IS_BLOCKED, () => {
      this._setInfuraBlocked(true);
    });
    this.network.on(NETWORK_EVENTS.INFURA_IS_UNBLOCKED, () => {
      this._setInfuraBlocked(false);
    });
  }

  /**
   *
   * A setter for the `infuraBlocked` property
   *
   * @param {boolean} isBlocked - Bool indicating whether Infura is blocked
   */
  _setInfuraBlocked(isBlocked) {
    const { infuraBlocked } = this.store.getState();

    if (infuraBlocked === isBlocked) {
      return;
    }

    this.store.updateState({ infuraBlocked: isBlocked });
  }
}
