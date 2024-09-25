import { ObservableStore } from '@metamask/obs-store';
import {
  AccountsControllerChangeEvent,
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSetAccountNameAction,
  AccountsControllerSetSelectedAccountAction,
  AccountsControllerState,
} from '@metamask/accounts-controller';
import { Hex } from '@metamask/utils';
import { RestrictedControllerMessenger } from '@metamask/base-controller';
import {
  CHAIN_IDS,
  IPFS_DEFAULT_GATEWAY_URL,
} from '../../../shared/constants/network';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';
import { ThemeType } from '../../../shared/constants/preferences';

type AccountIdentityEntry = {
  address: string;
  name: string;
  lastSelected: number | undefined;
};

const mainNetworks = {
  [CHAIN_IDS.MAINNET]: true,
  [CHAIN_IDS.LINEA_MAINNET]: true,
};

const testNetworks = {
  [CHAIN_IDS.GOERLI]: true,
  [CHAIN_IDS.SEPOLIA]: true,
  [CHAIN_IDS.LINEA_SEPOLIA]: true,
};

const controllerName = 'PreferencesController';

/**
 * Returns the state of the {@link PreferencesController}.
 */
export type PreferencesControllerGetStateAction = {
  type: 'PreferencesController:getState';
  handler: () => PreferencesControllerState;
};

/**
 * Actions exposed by the {@link PreferencesController}.
 */
export type PreferencesControllerActions = PreferencesControllerGetStateAction;

/**
 * Event emitted when the state of the {@link PreferencesController} changes.
 */
export type PreferencesControllerStateChangeEvent = {
  type: 'PreferencesController:stateChange';
  payload: [PreferencesControllerState, []];
};

/**
 * Events emitted by {@link PreferencesController}.
 */
export type PreferencesControllerEvents = PreferencesControllerStateChangeEvent;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions =
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerSetAccountNameAction
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerSetSelectedAccountAction;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents = AccountsControllerChangeEvent;

export type PreferencesControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  PreferencesControllerActions | AllowedActions,
  PreferencesControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

type PreferencesControllerOptions = {
  networkConfigurationsByChainId?: Record<Hex, { chainId: Hex }>;
  initState?: Partial<PreferencesControllerState>;
  initLangCode?: string;
  messenger: PreferencesControllerMessenger;
};

export type Preferences = {
  autoLockTimeLimit?: number;
  showExtensionInFullSizeView: boolean;
  showFiatInTestnets: boolean;
  showTestNetworks: boolean;
  smartTransactionsOptInStatus: boolean | null;
  useNativeCurrencyAsPrimaryCurrency: boolean;
  hideZeroBalanceTokens: boolean;
  petnamesEnabled: boolean;
  redesignedConfirmationsEnabled: boolean;
  redesignedTransactionsEnabled: boolean;
  featureNotificationsEnabled: boolean;
  showMultiRpcModal: boolean;
  isRedesignedConfirmationsDeveloperEnabled: boolean;
  showConfirmationAdvancedDetails: boolean;
};

export type PreferencesControllerState = {
  selectedAddress: string;
  useBlockie: boolean;
  useNonceField: boolean;
  usePhishDetect: boolean;
  dismissSeedBackUpReminder: boolean;
  useMultiAccountBalanceChecker: boolean;
  useSafeChainsListValidation: boolean;
  useTokenDetection: boolean;
  useNftDetection: boolean;
  use4ByteResolution: boolean;
  useCurrencyRateCheck: boolean;
  useRequestQueue: boolean;
  openSeaEnabled: boolean;
  securityAlertsEnabled: boolean;
  watchEthereumAccountEnabled: boolean;
  bitcoinSupportEnabled: boolean;
  bitcoinTestnetSupportEnabled: boolean;
  addSnapAccountEnabled: boolean;
  advancedGasFee: Record<string, Record<string, string>>;
  featureFlags: Record<string, boolean>;
  incomingTransactionsPreferences: Record<number, boolean>;
  knownMethodData: Record<string, string>;
  currentLocale: string;
  identities: Record<string, AccountIdentityEntry>;
  lostIdentities: Record<string, object>;
  forgottenPassword: boolean;
  preferences: Preferences;
  ipfsGateway: string;
  isIpfsGatewayEnabled: boolean;
  useAddressBarEnsResolution: boolean;
  ledgerTransportType: LedgerTransportTypes;
  snapRegistryList: Record<string, object>;
  theme: ThemeType;
  snapsAddSnapAccountModalDismissed: boolean;
  useExternalNameSources: boolean;
  useTransactionSimulations: boolean;
  enableMV3TimestampSave: boolean;
  useExternalServices: boolean;
  textDirection?: string;
};

export default class PreferencesController {
  store: ObservableStore<PreferencesControllerState>;

  private messagingSystem: PreferencesControllerMessenger;

  /**
   *
   * @param opts - Overrides the defaults for the initial state of this.store
   * @property messenger - The controller messenger
   * @property initState The stored object containing a users preferences, stored in local storage
   * @property initState.useBlockie The users preference for blockie identicons within the UI
   * @property initState.useNonceField The users preference for nonce field within the UI
   * @property initState.featureFlags A key-boolean map, where keys refer to features and booleans to whether the
   * user wishes to see that feature.
   *
   * Feature flags can be set by the global function `setPreference(feature, enabled)`, and so should not expose any sensitive behavior.
   * @property initState.knownMethodData Contains all data methods known by the user
   * @property initState.currentLocale The preferred language locale key
   * @property initState.selectedAddress A hex string that matches the currently selected address in the app
   */
  constructor(opts: PreferencesControllerOptions) {
    const addedNonMainNetwork: Record<Hex, boolean> = Object.values(
      opts.networkConfigurationsByChainId ?? {},
    ).reduce((acc: Record<Hex, boolean>, element) => {
      acc[element.chainId] = true;
      return acc;
    }, {});

    const initState: PreferencesControllerState = {
      selectedAddress: '',
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
      openSeaEnabled: true,
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
      currentLocale: opts.initLangCode ?? '',
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
        showMultiRpcModal: false,
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

    this.store = new ObservableStore(initState);
    this.store.setMaxListeners(13);

    this.messagingSystem = opts.messenger;
    this.messagingSystem.registerActionHandler(
      `PreferencesController:getState`,
      () => this.store.getState(),
    );
    this.messagingSystem.registerInitialEventPayload({
      eventType: `PreferencesController:stateChange`,
      getPayload: () => [this.store.getState(), []],
    });

    this.messagingSystem.subscribe(
      'AccountsController:stateChange',
      this.#handleAccountsControllerSync.bind(this),
    );

    globalThis.setPreference = (key: keyof Preferences, value: boolean) => {
      return this.setFeatureFlag(key, value);
    };
  }

  /**
   * Sets the {@code forgottenPassword} state property
   *
   * @param forgottenPassword - whether or not the user has forgotten their password
   */
  setPasswordForgotten(forgottenPassword: boolean): void {
    this.store.updateState({ forgottenPassword });
  }

  /**
   * Setter for the `useBlockie` property
   *
   * @param val - Whether or not the user prefers blockie indicators
   */
  setUseBlockie(val: boolean): void {
    this.store.updateState({ useBlockie: val });
  }

  /**
   * Setter for the `useNonceField` property
   *
   * @param val - Whether or not the user prefers to set nonce
   */
  setUseNonceField(val: boolean): void {
    this.store.updateState({ useNonceField: val });
  }

  /**
   * Setter for the `usePhishDetect` property
   *
   * @param val - Whether or not the user prefers phishing domain protection
   */
  setUsePhishDetect(val: boolean): void {
    this.store.updateState({ usePhishDetect: val });
  }

  /**
   * Setter for the `useMultiAccountBalanceChecker` property
   *
   * @param val - Whether or not the user prefers to turn off/on all security settings
   */
  setUseMultiAccountBalanceChecker(val: boolean): void {
    this.store.updateState({ useMultiAccountBalanceChecker: val });
  }

  /**
   * Setter for the `useSafeChainsListValidation` property
   *
   * @param val - Whether or not the user prefers to turn off/on validation for manually adding networks
   */
  setUseSafeChainsListValidation(val: boolean): void {
    this.store.updateState({ useSafeChainsListValidation: val });
  }

  toggleExternalServices(useExternalServices: boolean): void {
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
   * @param val - Whether or not the user prefers to use the static token list or dynamic token list from the API
   */
  setUseTokenDetection(val: boolean): void {
    this.store.updateState({ useTokenDetection: val });
  }

  /**
   * Setter for the `useNftDetection` property
   *
   * @param useNftDetection - Whether or not the user prefers to autodetect NFTs.
   */
  setUseNftDetection(useNftDetection: boolean): void {
    this.store.updateState({ useNftDetection });
  }

  /**
   * Setter for the `use4ByteResolution` property
   *
   * @param use4ByteResolution - (Privacy) Whether or not the user prefers to have smart contract name details resolved with 4byte.directory
   */
  setUse4ByteResolution(use4ByteResolution: boolean): void {
    this.store.updateState({ use4ByteResolution });
  }

  /**
   * Setter for the `useCurrencyRateCheck` property
   *
   * @param val - Whether or not the user prefers to use currency rate check for ETH and tokens.
   */
  setUseCurrencyRateCheck(val: boolean): void {
    this.store.updateState({ useCurrencyRateCheck: val });
  }

  /**
   * Setter for the `useRequestQueue` property
   *
   * @param val - Whether or not the user wants to have requests queued if network change is required.
   */
  setUseRequestQueue(val: boolean): void {
    this.store.updateState({ useRequestQueue: val });
  }

  /**
   * Setter for the `openSeaEnabled` property
   *
   * @param openSeaEnabled - Whether or not the user prefers to use the OpenSea API for NFTs data.
   */
  setOpenSeaEnabled(openSeaEnabled: boolean): void {
    this.store.updateState({
      openSeaEnabled,
    });
  }

  /**
   * Setter for the `securityAlertsEnabled` property
   *
   * @param securityAlertsEnabled - Whether or not the user prefers to use the security alerts.
   */
  setSecurityAlertsEnabled(securityAlertsEnabled: boolean): void {
    this.store.updateState({
      securityAlertsEnabled,
    });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  /**
   * Setter for the `addSnapAccountEnabled` property.
   *
   * @param addSnapAccountEnabled - Whether or not the user wants to
   * enable the "Add Snap accounts" button.
   */
  setAddSnapAccountEnabled(addSnapAccountEnabled: boolean): void {
    this.store.updateState({
      addSnapAccountEnabled,
    });
  }
  ///: END:ONLY_INCLUDE_IF

  /**
   * Setter for the `watchEthereumAccountEnabled` property.
   *
   * @param watchEthereumAccountEnabled - Whether or not the user wants to
   * enable the "Watch Ethereum account (Beta)" button.
   */
  setWatchEthereumAccountEnabled(watchEthereumAccountEnabled: boolean): void {
    this.store.updateState({
      watchEthereumAccountEnabled,
    });
  }

  /**
   * Setter for the `bitcoinSupportEnabled` property.
   *
   * @param bitcoinSupportEnabled - Whether or not the user wants to
   * enable the "Add a new Bitcoin account (Beta)" button.
   */
  setBitcoinSupportEnabled(bitcoinSupportEnabled: boolean): void {
    this.store.updateState({
      bitcoinSupportEnabled,
    });
  }

  /**
   * Setter for the `bitcoinTestnetSupportEnabled` property.
   *
   * @param bitcoinTestnetSupportEnabled - Whether or not the user wants to
   * enable the "Add a new Bitcoin account (Testnet)" button.
   */
  setBitcoinTestnetSupportEnabled(bitcoinTestnetSupportEnabled: boolean): void {
    this.store.updateState({
      bitcoinTestnetSupportEnabled,
    });
  }

  /**
   * Setter for the `useExternalNameSources` property
   *
   * @param useExternalNameSources - Whether or not to use external name providers in the name controller.
   */
  setUseExternalNameSources(useExternalNameSources: boolean): void {
    this.store.updateState({
      useExternalNameSources,
    });
  }

  /**
   * Setter for the `useTransactionSimulations` property
   *
   * @param useTransactionSimulations - Whether or not to use simulations in the transaction confirmations.
   */
  setUseTransactionSimulations(useTransactionSimulations: boolean): void {
    this.store.updateState({
      useTransactionSimulations,
    });
  }

  /**
   * Setter for the `advancedGasFee` property
   *
   * @param options
   * @param options.chainId - The chainId the advancedGasFees should be set on
   * @param options.gasFeePreferences - The advancedGasFee options to set
   */
  setAdvancedGasFee({
    chainId,
    gasFeePreferences,
  }: {
    chainId: string;
    gasFeePreferences: Record<string, string>;
  }): void {
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
   * @param val - 'default' or 'dark' value based on the mode selected by user.
   */
  setTheme(val: ThemeType): void {
    this.store.updateState({ theme: val });
  }

  /**
   * Add new methodData to state, to avoid requesting this information again through Infura
   *
   * @param fourBytePrefix - Four-byte method signature
   * @param methodData - Corresponding data method
   */
  addKnownMethodData(fourBytePrefix: string, methodData: string): void {
    const { knownMethodData } = this.store.getState();

    const updatedKnownMethodData = { ...knownMethodData };
    updatedKnownMethodData[fourBytePrefix] = methodData;

    this.store.updateState({ knownMethodData: updatedKnownMethodData });
  }

  /**
   * Setter for the `currentLocale` property
   *
   * @param key - he preferred language locale key
   */
  setCurrentLocale(key: string): string {
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
   * @param address - A new hex address for an account
   */
  setSelectedAddress(address: string): void {
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
   * @returns The hex address for the currently selected account
   */
  getSelectedAddress(): string {
    const selectedAccount = this.messagingSystem.call(
      'AccountsController:getSelectedAccount',
    );

    return selectedAccount.address;
  }

  /**
   * Getter for the `useRequestQueue` property
   *
   * @returns whether this option is on or off.
   */
  getUseRequestQueue(): boolean {
    return this.store.getState().useRequestQueue;
  }

  /**
   * Sets a custom label for an account
   *
   * @deprecated - Use setAccountName from the AccountsController
   * @param address - the account to set a label for
   * @param label - the custom label for the account
   * @returns the account label
   */
  setAccountLabel(address: string, label: string): string | undefined {
    if (!address) {
      throw new Error(
        `setAccountLabel requires a valid address, got ${String(address)}`,
      );
    }

    const account = this.messagingSystem.call(
      'AccountsController:getAccountByAddress',
      address,
    );
    if (account) {
      this.messagingSystem.call(
        'AccountsController:setAccountName',
        account.id,
        label,
      );

      return label;
    }

    return undefined;
  }

  /**
   * Updates the `featureFlags` property, which is an object. One property within that object will be set to a boolean.
   *
   * @param feature - A key that corresponds to a UI feature.
   * @param activated - Indicates whether or not the UI feature should be displayed
   * @returns the updated featureFlags object.
   */
  setFeatureFlag(feature: string, activated: boolean): Record<string, boolean> {
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
   * @param preference - The preference to enable or disable.
   * @param value - Indicates whether or not the preference should be enabled or disabled.
   * @returns Promises a updated Preferences object.
   */
  setPreference(
    preference: keyof Preferences,
    value: Preferences[typeof preference],
  ): Preferences {
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
   * @returns A map of user-selected preferences.
   */
  getPreferences(): Preferences {
    return this.store.getState().preferences;
  }

  /**
   * A getter for the `ipfsGateway` property
   *
   * @returns The current IPFS gateway domain
   */
  getIpfsGateway(): string {
    return this.store.getState().ipfsGateway;
  }

  /**
   * A setter for the `ipfsGateway` property
   *
   * @param domain - The new IPFS gateway domain
   * @returns the update IPFS gateway domain
   */
  setIpfsGateway(domain: string): string {
    this.store.updateState({ ipfsGateway: domain });
    return domain;
  }

  /**
   * A setter for the `isIpfsGatewayEnabled` property
   *
   * @param enabled - Whether or not IPFS is enabled
   */
  setIsIpfsGatewayEnabled(enabled: boolean): void {
    this.store.updateState({ isIpfsGatewayEnabled: enabled });
  }

  /**
   * A setter for the `useAddressBarEnsResolution` property
   *
   * @param useAddressBarEnsResolution - Whether or not user prefers IPFS resolution for domains
   */
  setUseAddressBarEnsResolution(useAddressBarEnsResolution: boolean): void {
    this.store.updateState({ useAddressBarEnsResolution });
  }

  /**
   * A setter for the `ledgerTransportType` property.
   *
   * @deprecated We no longer support specifying a ledger transport type other
   * than webhid, therefore managing a preference is no longer necessary.
   * @param ledgerTransportType - 'webhid'
   * @returns The transport type that was set.
   */
  setLedgerTransportPreference(
    ledgerTransportType: LedgerTransportTypes,
  ): string {
    this.store.updateState({ ledgerTransportType });
    return ledgerTransportType;
  }

  /**
   * A setter for the user preference to dismiss the seed phrase backup reminder
   *
   * @param dismissSeedBackUpReminder - User preference for dismissing the back up reminder.
   */
  setDismissSeedBackUpReminder(dismissSeedBackUpReminder: boolean): void {
    this.store.updateState({
      dismissSeedBackUpReminder,
    });
  }

  /**
   * A setter for the incomingTransactions in preference to be updated
   *
   * @param chainId - chainId of the network
   * @param value - preference of certain network, true to be enabled
   */
  setIncomingTransactionsPreferences(chainId: Hex, value: boolean): void {
    const previousValue = this.store.getState().incomingTransactionsPreferences;
    const updatedValue = { ...previousValue, [chainId]: value };
    this.store.updateState({ incomingTransactionsPreferences: updatedValue });
  }

  setServiceWorkerKeepAlivePreference(value: boolean): void {
    this.store.updateState({ enableMV3TimestampSave: value });
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setSnapsAddSnapAccountModalDismissed(value: boolean): void {
    this.store.updateState({ snapsAddSnapAccountModalDismissed: value });
  }
  ///: END:ONLY_INCLUDE_IF

  #handleAccountsControllerSync(
    newAccountsControllerState: AccountsControllerState,
  ): void {
    const { accounts, selectedAccount: selectedAccountId } =
      newAccountsControllerState.internalAccounts;
    const selectedAccount = accounts[selectedAccountId];

    const { identities, lostIdentities } = this.store.getState();

    const addresses = Object.values(accounts).map((account) =>
      account.address.toLowerCase(),
    );

    const updatedLostIdentities = Object.keys(identities).reduce(
      (acc, identity) => {
        if (addresses.includes(identity.toLowerCase())) {
          acc[identity] = identities[identity];
        }
        return acc;
      },
      { ...(lostIdentities ?? {}) },
    );

    const updatedIdentities = Object.values(accounts).reduce(
      (identitiesMap: Record<string, AccountIdentityEntry>, account) => {
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
      lostIdentities: updatedLostIdentities,
      selectedAddress: selectedAccount?.address || '', // it will be an empty string during onboarding
    });
  }
}
