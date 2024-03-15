import { ObservableStore } from '@metamask/obs-store';
import { normalize as normalizeAddress } from '@metamask/eth-sig-util';
import {
  CHAIN_IDS,
  IPFS_DEFAULT_GATEWAY_URL,
} from '../../../shared/constants/network';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import { ThemeType } from '../../../shared/constants/preferences';
import { shouldShowLineaMainnet } from '../../../shared/modules/network.utils';

const mainNetworks = {
  [CHAIN_IDS.MAINNET]: true,
  [CHAIN_IDS.LINEA_MAINNET]: true,
};

const testNetworks = {
  [CHAIN_IDS.GOERLI]: true,
  [CHAIN_IDS.SEPOLIA]: true,
  [CHAIN_IDS.LINEA_GOERLI]: true,
};

export default class PreferencesController {
  /**
   *
   * @typedef {object} PreferencesController
   * @param {object} opts - Overrides the defaults for the initial state of this.store
   * @property {object} messenger - The controller messenger
   * @property {object} store The stored object containing a users preferences, stored in local storage
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
    const addedNonMainNetwork = Object.values(
      opts.networkConfigurations,
    ).reduce((acc, element) => {
      acc[element.chainId] = true;
      return acc;
    }, {});

    const initState = {
      useBlockie: false,
      useNonceField: false,
      usePhishDetect: true,
      dismissSeedBackUpReminder: false,
      disabledRpcMethodPreferences: {
        eth_sign: false,
      },
      useMultiAccountBalanceChecker: true,
      useSafeChainsListValidation: true,
      // set to true means the dynamic list from the API is being used
      // set to false will be using the static list from contract-metadata
      useTokenDetection: false,
      useNftDetection: false,
      use4ByteResolution: true,
      useCurrencyRateCheck: true,
      useRequestQueue: false,
      openSeaEnabled: false,
      ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
      securityAlertsEnabled: true,
      ///: END:ONLY_INCLUDE_IF
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      addSnapAccountEnabled: false,
      ///: END:ONLY_INCLUDE_IF
      advancedGasFee: {},

      // WARNING: Do not use feature flags for security-sensitive things.
      // Feature flag toggling is available in the global namespace
      // for convenient testing of pre-release features, and should never
      // perform sensitive operations.
      featureFlags: {},
      incomingTransactionsPreferences: {
        ...mainNetworks,
        ...addedNonMainNetwork,
        ...testNetworks,
      },
      knownMethodData: {},
      currentLocale: opts.initLangCode,
      identities: {},
      lostIdentities: {},
      forgottenPassword: false,
      preferences: {
        autoLockTimeLimit: undefined,
        showExtensionInFullSizeView: false,
        showFiatInTestnets: false,
        showTestNetworks: false,
        useNativeCurrencyAsPrimaryCurrency: true,
        hideZeroBalanceTokens: false,
        petnamesEnabled: true,
      },
      // ENS decentralized website resolution
      ipfsGateway: IPFS_DEFAULT_GATEWAY_URL,
      isIpfsGatewayEnabled: true,
      useAddressBarEnsResolution: true,
      // Ledger transport type is deprecated. We currently only support webhid
      // on chrome, and u2f on firefox.
      ledgerTransportType: window.navigator.hid
        ? LedgerTransportTypes.webhid
        : LedgerTransportTypes.u2f,
      snapRegistryList: {},
      transactionSecurityCheckEnabled: false,
      theme: ThemeType.os,
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      snapsAddSnapAccountModalDismissed: false,
      ///: END:ONLY_INCLUDE_IF
      isLineaMainnetReleased: false,
      useExternalNameSources: true,
      ...opts.initState,
    };

    this.network = opts.network;

    this.store = new ObservableStore(initState);
    this.store.setMaxListeners(13);
    this.tokenListController = opts.tokenListController;

    opts.onKeyringStateChange((state) => {
      const accounts = new Set();
      for (const keyring of state.keyrings) {
        for (const address of keyring.accounts) {
          accounts.add(address);
        }
      }
      if (accounts.size > 0) {
        this.syncAddresses(Array.from(accounts));
      }
    });

    this.messagingSystem = opts.messenger;
    this.messagingSystem?.registerActionHandler(
      `PreferencesController:getState`,
      () => this.store.getState(),
    );
    this.messagingSystem?.registerInitialEventPayload({
      eventType: `PreferencesController:stateChange`,
      getPayload: () => [this.store.getState(), []],
    });

    global.setPreference = (key, value) => {
      return this.setFeatureFlag(key, value);
    };

    this._showShouldLineaMainnetNetwork();
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
   * Setter for the `useSafeChainsListValidation` property
   *
   * @param {boolean} val - Whether or not the user prefers to turn off/on validation for manually adding networks
   */
  setUseSafeChainsListValidation(val) {
    this.store.updateState({ useSafeChainsListValidation: val });
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
   * @param {boolean} useNftDetection - Whether or not the user prefers to autodetect NFTs.
   */
  setUseNftDetection(useNftDetection) {
    this.store.updateState({ useNftDetection });
  }

  /**
   * Setter for the `use4ByteResolution` property
   *
   * @param {boolean} use4ByteResolution - (Privacy) Whether or not the user prefers to have smart contract name details resolved with 4byte.directory
   */
  setUse4ByteResolution(use4ByteResolution) {
    this.store.updateState({ use4ByteResolution });
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
   * Setter for the `useRequestQueue` property
   *
   * @param {boolean} val - Whether or not the user wants to have requests queued if network change is required.
   */
  setUseRequestQueue(val) {
    this.store.updateState({ useRequestQueue: val });
  }

  /**
   * Setter for the `openSeaEnabled` property
   *
   * @param {boolean} openSeaEnabled - Whether or not the user prefers to use the OpenSea API for NFTs data.
   */
  setOpenSeaEnabled(openSeaEnabled) {
    this.store.updateState({
      openSeaEnabled,
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  /**
   * Setter for the `securityAlertsEnabled` property
   *
   * @param {boolean} securityAlertsEnabled - Whether or not the user prefers to use the security alerts.
   */
  setSecurityAlertsEnabled(securityAlertsEnabled) {
    this.store.updateState({
      securityAlertsEnabled,
    });
  }
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  /**
   * Setter for the `addSnapAccountEnabled` property.
   *
   * @param {boolean} addSnapAccountEnabled - Whether or not the user wants to
   * enable the "Add Snap accounts" button.
   */
  setAddSnapAccountEnabled(addSnapAccountEnabled) {
    this.store.updateState({
      addSnapAccountEnabled,
    });
  }
  ///: END:ONLY_INCLUDE_IF

  /**
   * Setter for the `useExternalNameSources` property
   *
   * @param {boolean} useExternalNameSources - Whether or not to use external name providers in the name controller.
   */
  setUseExternalNameSources(useExternalNameSources) {
    this.store.updateState({
      useExternalNameSources,
    });
  }

  /**
   * Setter for the `advancedGasFee` property
   *
   * @param {object} options
   * @param {string} options.chainId - The chainId the advancedGasFees should be set on
   * @param {object} options.gasFeePreferences - The advancedGasFee options to set
   */
  setAdvancedGasFee({ chainId, gasFeePreferences }) {
    const { advancedGasFee } = this.store.getState();
    this.store.updateState({
      advancedGasFee: {
        ...advancedGasFee,
        [chainId]: gasFeePreferences,
      },
    });
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
   * @returns {string} selectedAddress the selected address.
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
   * Getter for the `useRequestQueue` property
   *
   * @returns {boolean} whether this option is on or off.
   */
  getUseRequestQueue() {
    return this.store.getState().useRequestQueue;
  }

  /**
   * Sets a custom label for an account
   *
   * @param {string} account - the account to set a label for
   * @param {string} label - the custom label for the account
   * @returns {Promise<string>}
   */
  async setAccountLabel(account, label) {
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
    return label;
  }

  /**
   * Updates the `featureFlags` property, which is an object. One property within that object will be set to a boolean.
   *
   * @param {string} feature - A key that corresponds to a UI feature.
   * @param {boolean} activated - Indicates whether or not the UI feature should be displayed
   * @returns {Promise<object>} Promises a new object; the updated featureFlags object.
   */
  async setFeatureFlag(feature, activated) {
    const currentFeatureFlags = this.store.getState().featureFlags;
    const updatedFeatureFlags = {
      ...currentFeatureFlags,
      [feature]: activated,
    };

    this.store.updateState({ featureFlags: updatedFeatureFlags });

    return updatedFeatureFlags;
  }

  /**
   * Updates the `preferences` property, which is an object. These are user-controlled features
   * found in the settings page.
   *
   * @param {string} preference - The preference to enable or disable.
   * @param {boolean |object} value - Indicates whether or not the preference should be enabled or disabled.
   * @returns {Promise<object>} Promises a new object; the updated preferences object.
   */
  async setPreference(preference, value) {
    const currentPreferences = this.getPreferences();
    const updatedPreferences = {
      ...currentPreferences,
      [preference]: value,
    };

    this.store.updateState({ preferences: updatedPreferences });
    return updatedPreferences;
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
  async setIpfsGateway(domain) {
    this.store.updateState({ ipfsGateway: domain });
    return domain;
  }

  /**
   * A setter for the `isIpfsGatewayEnabled` property
   *
   * @param {boolean} enabled - Whether or not IPFS is enabled
   */
  async setIsIpfsGatewayEnabled(enabled) {
    this.store.updateState({ isIpfsGatewayEnabled: enabled });
  }

  /**
   * A setter for the `useAddressBarEnsResolution` property
   *
   * @param {boolean} useAddressBarEnsResolution - Whether or not user prefers IPFS resolution for domains
   */
  async setUseAddressBarEnsResolution(useAddressBarEnsResolution) {
    this.store.updateState({ useAddressBarEnsResolution });
  }

  /**
   * A setter for the `ledgerTransportType` property.
   *
   * @deprecated We no longer support specifying a ledger transport type other
   * than webhid, therefore managing a preference is no longer necessary.
   * @param {LedgerTransportTypes.webhid} ledgerTransportType - 'webhid'
   * @returns {string} The transport type that was set.
   */
  setLedgerTransportPreference(ledgerTransportType) {
    this.store.updateState({ ledgerTransportType });
    return ledgerTransportType;
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

  /**
   * A setter for the user preference to enable/disable rpc methods
   *
   * @param {string} methodName - The RPC method name to change the setting of
   * @param {bool} isEnabled - true to enable the rpc method
   */
  async setDisabledRpcMethodPreference(methodName, isEnabled) {
    const currentRpcMethodPreferences =
      this.store.getState().disabledRpcMethodPreferences;
    const updatedRpcMethodPreferences = {
      ...currentRpcMethodPreferences,
      [methodName]: isEnabled,
    };

    this.store.updateState({
      disabledRpcMethodPreferences: updatedRpcMethodPreferences,
    });
  }

  /**
   * A setter for the incomingTransactions in preference to be updated
   *
   * @param {string} chainId - chainId of the network
   * @param {bool} value - preference of certain network, true to be enabled
   */
  setIncomingTransactionsPreferences(chainId, value) {
    const previousValue = this.store.getState().incomingTransactionsPreferences;
    const updatedValue = { ...previousValue, [chainId]: value };
    this.store.updateState({ incomingTransactionsPreferences: updatedValue });
  }

  getRpcMethodPreferences() {
    return this.store.getState().disabledRpcMethodPreferences;
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setSnapsAddSnapAccountModalDismissed(value) {
    this.store.updateState({ snapsAddSnapAccountModalDismissed: value });
  }
  ///: END:ONLY_INCLUDE_IF

  /**
   * A method to check is the linea mainnet network should be displayed
   */
  _showShouldLineaMainnetNetwork() {
    const showLineaMainnet = shouldShowLineaMainnet();
    this.store.updateState({ isLineaMainnetReleased: showLineaMainnet });
  }
}
