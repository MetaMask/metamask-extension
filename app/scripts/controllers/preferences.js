import { ObservableStore } from '@metamask/obs-store';
import {
  CHAIN_IDS,
  IPFS_DEFAULT_GATEWAY_URL,
} from '../../../shared/constants/network';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import { ThemeType } from '../../../shared/constants/preferences';

const mainNetworks = {
  [CHAIN_IDS.MAINNET]: true,
  [CHAIN_IDS.LINEA_MAINNET]: true,
};

const testNetworks = {
  [CHAIN_IDS.GOERLI]: true,
  [CHAIN_IDS.SEPOLIA]: true,
  [CHAIN_IDS.LINEA_SEPOLIA]: true,
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
      useMultiAccountBalanceChecker: true,
      useSafeChainsListValidation: true,
      // set to true means the dynamic list from the API is being used
      // set to false will be using the static list from contract-metadata
      useTokenDetection: opts?.initState?.useTokenDetection ?? true,
      useNftDetection: opts?.initState?.useTokenDetection ?? true,
      use4ByteResolution: true,
      useCurrencyRateCheck: true,
      useRequestQueue: true,
      openSeaEnabled: true, // todo set this to true
      securityAlertsEnabled: true,
      watchEthereumAccountEnabled: false,
      bitcoinSupportEnabled: false,
      bitcoinTestnetSupportEnabled: false,
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
        smartTransactionsOptInStatus: null, // null means we will show the Smart Transactions opt-in modal to a user if they are eligible
        useNativeCurrencyAsPrimaryCurrency: true,
        hideZeroBalanceTokens: false,
        petnamesEnabled: true,
        redesignedConfirmationsEnabled: true,
        redesignedTransactionsEnabled: true,
        featureNotificationsEnabled: false,
        isRedesignedConfirmationsDeveloperEnabled: false,
        showConfirmationAdvancedDetails: false,
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
      theme: ThemeType.os,
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      snapsAddSnapAccountModalDismissed: false,
      ///: END:ONLY_INCLUDE_IF
      useExternalNameSources: true,
      useTransactionSimulations: true,
      enableMV3TimestampSave: true,
      // Turning OFF basic functionality toggle means turning OFF this useExternalServices flag.
      // Whenever useExternalServices is false, certain features will be disabled.
      // The flag is true by Default, meaning the toggle is ON by default.
      useExternalServices: true,
      ...opts.initState,
    };

    this.network = opts.network;

    this.store = new ObservableStore(initState);
    this.store.setMaxListeners(13);

    this.messagingSystem = opts.messenger;
    this.messagingSystem?.registerActionHandler(
      `PreferencesController:getState`,
      () => this.store.getState(),
    );
    this.messagingSystem?.registerInitialEventPayload({
      eventType: `PreferencesController:stateChange`,
      getPayload: () => [this.store.getState(), []],
    });

    this.messagingSystem?.subscribe(
      'AccountsController:stateChange',
      this.#handleAccountsControllerSync.bind(this),
    );

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
   * Setter for the `useSafeChainsListValidation` property
   *
   * @param {boolean} val - Whether or not the user prefers to turn off/on validation for manually adding networks
   */
  setUseSafeChainsListValidation(val) {
    this.store.updateState({ useSafeChainsListValidation: val });
  }

  toggleExternalServices(useExternalServices) {
    this.store.updateState({ useExternalServices });
    this.setUseTokenDetection(useExternalServices);
    this.setUseCurrencyRateCheck(useExternalServices);
    this.setUsePhishDetect(useExternalServices);
    this.setUseAddressBarEnsResolution(useExternalServices);
    this.setOpenSeaEnabled(useExternalServices);
    this.setUseNftDetection(useExternalServices);
  }

  /**
   * Setter for the `useTokenDetection` property
   *
   * @param {boolean} val - Whether or not the user prefers to use the static token list or dynamic token list from the API
   */
  setUseTokenDetection(val) {
    this.store.updateState({ useTokenDetection: val });
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
   * Setter for the `watchEthereumAccountEnabled` property.
   *
   * @param {boolean} watchEthereumAccountEnabled - Whether or not the user wants to
   * enable the "Watch Ethereum account (Beta)" button.
   */
  setWatchEthereumAccountEnabled(watchEthereumAccountEnabled) {
    this.store.updateState({
      watchEthereumAccountEnabled,
    });
  }

  /**
   * Setter for the `bitcoinSupportEnabled` property.
   *
   * @param {boolean} bitcoinSupportEnabled - Whether or not the user wants to
   * enable the "Add a new Bitcoin account (Beta)" button.
   */
  setBitcoinSupportEnabled(bitcoinSupportEnabled) {
    this.store.updateState({
      bitcoinSupportEnabled,
    });
  }

  /**
   * Setter for the `bitcoinTestnetSupportEnabled` property.
   *
   * @param {boolean} bitcoinTestnetSupportEnabled - Whether or not the user wants to
   * enable the "Add a new Bitcoin account (Testnet)" button.
   */
  setBitcoinTestnetSupportEnabled(bitcoinTestnetSupportEnabled) {
    this.store.updateState({
      bitcoinTestnetSupportEnabled,
    });
  }

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
   * Setter for the `useTransactionSimulations` property
   *
   * @param {boolean} useTransactionSimulations - Whether or not to use simulations in the transaction confirmations.
   */
  setUseTransactionSimulations(useTransactionSimulations) {
    this.store.updateState({
      useTransactionSimulations,
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
   * Setter for the `selectedAddress` property
   *
   * @deprecated - Use setSelectedAccount from the AccountsController
   * @param {string} address - A new hex address for an account
   */
  setSelectedAddress(address) {
    const account = this.messagingSystem.call(
      'AccountsController:getAccountByAddress',
      address,
    );
    if (!account) {
      throw new Error(`Identity for '${address} not found`);
    }

    this.messagingSystem.call(
      'AccountsController:setSelectedAccount',
      account.id,
    );
  }

  /**
   * Getter for the `selectedAddress` property
   *
   * @deprecated - Use the getSelectedAccount from the AccountsController
   * @returns {string} The hex address for the currently selected account
   */
  getSelectedAddress() {
    const selectedAccount = this.messagingSystem.call(
      'AccountsController:getSelectedAccount',
    );

    return selectedAccount.address;
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
   * @deprecated - Use setAccountName from the AccountsController
   * @param {string} address - the account to set a label for
   * @param {string} label - the custom label for the account
   * @returns {Promise<string>}
   */
  async setAccountLabel(address, label) {
    const account = this.messagingSystem.call(
      'AccountsController:getAccountByAddress',
      address,
    );
    if (!address) {
      throw new Error(
        `setAccountLabel requires a valid address, got ${String(address)}`,
      );
    }

    this.messagingSystem.call(
      'AccountsController:setAccountName',
      account.id,
      label,
    );

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

  setServiceWorkerKeepAlivePreference(value) {
    this.store.updateState({ enableMV3TimestampSave: value });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setSnapsAddSnapAccountModalDismissed(value) {
    this.store.updateState({ snapsAddSnapAccountModalDismissed: value });
  }
  ///: END:ONLY_INCLUDE_IF

  #handleAccountsControllerSync(newAccountsControllerState) {
    const { accounts, selectedAccount: selectedAccountId } =
      newAccountsControllerState.internalAccounts;

    const selectedAccount = accounts[selectedAccountId];

    const { identities, lostIdentities } = this.store.getState();

    const addresses = Object.values(accounts).map((account) =>
      account.address.toLowerCase(),
    );
    Object.keys(identities).forEach((identity) => {
      if (addresses.includes(identity.toLowerCase())) {
        lostIdentities[identity] = identities[identity];
      }
    });

    const updatedIdentities = Object.values(accounts).reduce(
      (identitiesMap, account) => {
        identitiesMap[account.address] = {
          address: account.address,
          name: account.metadata.name,
          lastSelected: account.metadata.lastSelected,
        };

        return identitiesMap;
      },
      {},
    );

    this.store.updateState({
      identities: updatedIdentities,
      lostIdentities,
      selectedAddress: selectedAccount?.address || '', // it will be an empty string during onboarding
    });
  }
}
