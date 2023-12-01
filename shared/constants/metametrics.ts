import type { EnvironmentType } from './app';
import { LedgerTransportTypes } from './hardware-wallets';

/**
 * Used to attach context of where the user was at in the application when the
 * event was triggered. Also included as full details of the current page in
 * page events.
 */
export type MetaMetricsPageObject = {
  /**
   * The path of the current page (e.g. "/home").
   */
  path?: string;
  /**
   * The title of the current page (e.g. "home").
   */
  title?: string;
  /**
   * The fully qualified URL of the current page.
   */
  url?: string;
};

/**
 * The dapp that triggered an interaction (MetaMask only).
 */
export type MetaMetricsReferrerObject = {
  /**
   * The origin of the dapp issuing the notification.
   */
  url?: string;
};

/**
 * We attach context to every meta metrics event that help to qualify our
 * analytics. This type has all optional values because it represents a
 * returned object from a method call. Ideally app and userAgent are
 * defined on every event. This is confirmed in the getTrackMetaMetricsEvent
 * function, but still provides the consumer a way to override these values if
 * necessary.
 */
type MetaMetricsContext = {
  /**
   * Application metadata.
   */
  app: {
    /**
     * The name of the application tracking the event.
     */
    name: string;
    /**
     * The version of the application.
     */
    version: string;
  };
  /**
   * The user agent of the application.
   */
  userAgent: string;
  /**
   * An object representing details of the current page.
   */
  page?: MetaMetricsPageObject;
  /**
   * The dapp that triggered an interaction (MetaMask only).
   */
  referrer?: MetaMetricsReferrerObject;
};

export type MetaMetricsEventPayload = {
  /**
   * The event name to track.
   */
  event: string;
  /**
   * The category to associate the event to.
   */
  category: string;
  /**
   * The action ID to deduplicate event requests from the UI.
   */
  actionId?: number;
  /**
   * The type of environment this event occurred in. Defaults to the background
   * process type.
   */
  environmentType?: string;
  /**
   * Custom values to track. Keys in this object must be `snake_case`.
   */
  properties?: object;
  /**
   * Sensitive values to track. These properties will be sent in an additional
   * event that excludes the user's `metaMetricsId`. Keys in this object must be
   * in `snake_case`.
   */
  sensitiveProperties?: object;
  /**
   * Amount of currency that the event creates in revenue for MetaMask.
   */
  revenue?: number;
  /**
   * ISO-4127-formatted currency for events with revenue. Defaults to US
   * dollars.
   */
  currency?: string;
  /**
   * Abstract business "value" attributable to customers who trigger this event.
   */
  value?: number;
  /**
   * The page/route that the event occurred on.
   */
  page?: MetaMetricsPageObject;
  /**
   * The origin of the dapp that triggered this event.
   */
  referrer?: MetaMetricsReferrerObject;
};

export type MetaMetricsEventOptions = {
  /**
   * Whether or not the event happened during the opt-in workflow.
   */
  isOptIn?: boolean;
  /**
   * Whether the segment queue should be flushed after tracking the event.
   * Recommended if the result of tracking the event must be known before UI
   * transition or update.
   */
  flushImmediately?: boolean;
  /**
   * Whether to exclude the user's `metaMetricsId` for anonymity.
   */
  excludeMetaMetricsId?: boolean;
  /**
   * An override for the `metaMetricsId` in the event (no pun intended) one is
   * created as a part of an asynchronous workflow, such as awaiting the result
   * of the MetaMetrics opt-in function that generates the user's
   * `metaMetricsId`.
   */
  metaMetricsId?: string;
  /**
   * Is this event a holdover from Matomo that needs further migration? When
   * true, sends the data to a special Segment source that marks the event data
   * as not conforming to our schema.
   */
  matomoEvent?: boolean;
};

export type MetaMetricsEventFragment = {
  /**
   * The action ID of transaction metadata object.
   */
  actionId?: string;
  /**
   * The event name to fire when the fragment is closed in an affirmative action.
   */
  successEvent: string;
  /**
   * The event name to fire when the fragment is closed with a rejection.
   */
  failureEvent?: string;
  /**
   * An event name to fire immediately upon fragment creation. This is useful
   * for building funnels in mixpanel and for reduction of code duplication.
   */
  initialEvent?: string;
  /**
   * The event category to use for both the success and failure events.
   */
  category: string;
  /**
   * Should this fragment be persisted in state and progressed after the
   * extension is locked and unlocked.
   */
  persist?: boolean;
  /**
   * Time in seconds the event should be persisted for. After the timeout the
   * fragment will be closed as abandoned. If not supplied the fragment is
   * stored indefinitely.
   */
  timeout?: number;
  /**
   * `Date.now()` when the fragment was last updated. Used to determine if the
   * timeout has expired and the fragment should be closed.
   */
  lastUpdated?: number;
  /**
   * Custom values to track. Keys in this object must be `snake_case`.
   */
  properties?: object;
  /**
   * Sensitive values to track. These properties will be sent in an additional
   * event that excludes the user's `metaMetricsId`. Keys in this object must be
   * in `snake_case`.
   */
  sensitiveProperties?: object;
  /**
   * Amount of currency that the event creates in revenue for MetaMask.
   */
  revenue?: number;
  /**
   * ISO-4127-formatted currency for events with revenue. Defaults to US
   * dollars.
   */
  currency?: string;
  /**
   * Abstract business "value" attributable to customers who trigger this event.
   */
  value?: number;
  /**
   * The page/route that the event occurred on.
   */
  page?: MetaMetricsPageObject;
  /**
   * The origin of the dapp that triggered this event.
   */
  referrer?: MetaMetricsReferrerObject;
  /**
   * Overrides the automatic generation of UUID for the event fragment. This is
   * useful when tracking events for subsystems that already generate UUIDs so
   * to avoid unnecessary lookups and reduce accidental duplication.
   */
  uniqueIdentifier?: string;
};

/**
 * Data sent to the `segment.track` method.
 */
export type SegmentEventPayload = {
  /**
   * The MetaMetrics id for the user.
   */
  userId?: string;
  /**
   * An anonymous ID that is used to track sensitive data while preserving
   * anonymity.
   */
  anonymousId?: string;
  /**
   * The name of the event to track.
   */
  event: string;
  /**
   * Properties to attach to the event.
   */
  properties: object;
  /**
   * The context the event occurred in.
   */
  context: MetaMetricsContext;
};

/**
 * Data sent to MetaMetrics for page views.
 */
export type MetaMetricsPagePayload = {
  /**
   * The name of the page that was viewed.
   */
  name: string;
  /**
   * The variadic parts of the page URL.
   *
   * Example: If the route is `/asset/:asset` and the path is `/asset/ETH`,
   * the `params` property would be `{ asset: 'ETH' }`.
   */
  params?: object;
  /**
   * The environment type that the page was viewed in.
   */
  environmentType: EnvironmentType;
  /**
   * The details of the page.
   */
  page?: MetaMetricsPageObject;
  /**
   * The dapp that triggered the page view.
   */
  referrer?: MetaMetricsReferrerObject;
};

export type MetaMetricsPageOptions = {
  /**
   * Is the current path one of the pages in the onboarding workflow? (If this
   * is true and participateInMetaMetrics is null, then the page view will be
   * tracked.)
   */
  isOptInPath?: boolean;
};

/**
 * Data sent to MetaMetrics for user traits.
 */
export type MetaMetricsUserTraits = {
  /**
   * The number of entries in the user's address book.
   */
  address_book_entries?: number;
  /**
   * The type of ledger connection set by user preference.
   */
  ledger_connection_type?: LedgerTransportTypes;
  /**
   * An array consisting of chain IDs that represent the networks added by the
   * user.
   */
  networks_added?: string[];
  /**
   * An array consisting of chain IDs that represent the networks added by the
   * user that do not have a ticker.
   */
  networks_without_ticker?: string[];
  /**
   * Does the user have the Autodetect NFTs feature enabled?
   */
  nft_autodetection_enabled?: number;
  /**
   * A number representing the number of identities (accounts) added to the
   * user's wallet.
   */
  number_of_accounts?: number;
  /**
   * A number representing the amount of NFT collections from which the user
   * possesses NFTs.
   */
  number_of_nft_collections?: number;
  /**
   * A number representing the amount of all NFTs the user possesses across all
   * networks and accounts.
   */
  number_of_nfts?: number;
  /**
   * The total number of token contracts the user has across all networks and
   * accounts.
   */
  number_of_tokens?: number;
  /**
   * Does the user have the OpenSea API enabled?
   */
  opensea_api_enabled?: boolean;
  /**
   * Does the user have 3Box sync enabled?
   *
   * @deprecated
   */
  three_box_enabled?: boolean;
  /**
   * Which theme the user has selected.
   */
  theme?: string;
  /**
   * Does the user have token detection enabled?
   */
  token_detection_enabled?: boolean;
  /**
   * Does the user have desktop enabled?
   */
  desktop_enabled?: boolean;
  /**
   * Whether the security provider feature has been enabled.
   */
  security_providers?: string[];
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  /**
   * The address of the MMI account in question
   */
  mmi_account_address?: string;
  /**
   * What is the MMI extension ID
   */
  mmi_extension_id?: string;
  /**
   * Is the user using a custodian account
   */
  mmi_is_custodian?: boolean;
  ///: END:ONLY_INCLUDE_IF
};

export enum MetaMetricsUserTrait {
  /**
   * Identified when the user adds or modifies addresses in the address book.
   */
  AddressBookEntries = 'address_book_entries',
  /**
   * Identified when the user installed the extension.
   */
  InstallDateExt = 'install_date_ext',
  /**
   * Identified when the Ledger Live connection type is changed.
   */
  LedgerConnectionType = 'ledger_connection_type',
  /**
   * Identified when the user modifies networks.
   */
  NetworksAdded = 'networks_added',
  /**
   * Identified when the user modifies networks that lack a ticker.
   */
  NetworksWithoutTicker = 'networks_without_ticker',
  /**
   * Identified when the "Autodetect NFTs" feature is toggled.
   */
  NftAutodetectionEnabled = 'nft_autodetection_enabled',
  /**
   * Identified when identities change.
   */
  NumberOfAccounts = 'number_of_accounts',
  /**
   * The number of unique NFT addresses.
   */
  NumberOfNftCollections = 'number_of_nft_collections',
  /**
   * Identified when the number of NFTs owned by the user changes.
   */
  NumberOfNfts = 'number_of_nfts',
  /**
   * Identified when the number of tokens change.
   */
  NumberOfTokens = 'number_of_tokens',
  /**
   * Identified when the OpenSea API is enabled.
   */
  OpenSeaApiEnabled = 'opensea_api_enabled',
  /**
   * Identified when the user's theme changes.
   */
  Theme = 'theme',
  /**
   * Identified when the 3Box feature is toggled.
   *
   * @deprecated
   */
  ThreeBoxEnabled = 'three_box_enabled',
  /**
   * Identified when the token detection feature is toggled.
   */
  TokenDetectionEnabled = 'token_detection_enabled',
  /**
   * Identified when the user enables desktop.
   */
  DesktopEnabled = 'desktop_enabled',
  /**
   * Identified when the security provider feature is enabled.
   */
  SecurityProviders = 'security_providers',
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  /**
   * Identified when we get the current account in question
   */
  MmiAccountAddress = 'mmi_account_address',
  /**
   * Identified when we the user has the extension
   */
  MmiExtensionId = 'mmi_extension_id',
  /**
   * Identified when the user connects a custodian
   */
  MmiIsCustodian = 'mmi_is_custodian',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(petnames)
  PetnameAddressCount = 'petname_addresses_count',
  ///: END:ONLY_INCLUDE_IF
}

/**
 * Mixpanel converts the zero address value to a truly anonymous event, which
 * speeds up reporting
 */
export const METAMETRICS_ANONYMOUS_ID = '0x0000000000000000';

/**
 * Used to identify events that are triggered by the background process.
 */
export const METAMETRICS_BACKGROUND_PAGE_OBJECT: MetaMetricsPageObject = {
  path: '/background-process',
  title: 'Background Process',
  url: '/background-process',
};

export const REJECT_NOTIFICATION_CLOSE = 'Cancel Via Notification Close';

export const REJECT_NOTIFICATION_CLOSE_SIG =
  'Cancel Sig Request Via Notification Close';

export enum MetaMetricsEventName {
  AccountAdded = 'Account Added',
  AccountAddSelected = 'Account Add Selected',
  AccountAddFailed = 'Account Add Failed',
  AccountPasswordCreated = 'Account Password Created',
  AccountReset = 'Account Reset',
  AccountRenamed = 'Account Renamed',
  ActivityDetailsOpened = 'Activity Details Opened',
  ActivityDetailsClosed = 'Activity Details Closed',
  AppInstalled = 'App Installed',
  AppUnlocked = 'App Unlocked',
  AppUnlockedFailed = 'App Unlocked Failed',
  AppLocked = 'App Locked',
  AppWindowExpanded = 'App Window Expanded',
  BridgeLinkClicked = 'Bridge Link Clicked',
  DecryptionApproved = 'Decryption Approved',
  DecryptionRejected = 'Decryption Rejected',
  DecryptionRequested = 'Decryption Requested',
  EncryptionPublicKeyApproved = 'Encryption Approved',
  EncryptionPublicKeyRejected = 'Encryption Rejected',
  EncryptionPublicKeyRequested = 'Encryption Requested',
  ExternalLinkClicked = 'External Link Clicked',
  KeyExportSelected = 'Key Export Selected',
  KeyExportRequested = 'Key Export Requested',
  KeyExportFailed = 'Key Export Failed',
  KeyExportCanceled = 'Key Export Canceled',
  KeyExportRevealed = 'Key Material Revealed',
  KeyExportCopied = 'Key Material Copied',
  KeyTokenDetectionSelected = 'Key Token Detection Selected',
  KeyGlobalSecurityToggleSelected = 'Key Global Security/Privacy Settings',
  KeyBalanceTokenPriceChecker = 'Key Show Balance and Token Price Checker Settings',
  KeyGasFeeEstimationBuySwapTokens = 'Key Show Gas Fee Estimation, Buy Crypto and Swap Tokens',
  KeyAutoDetectTokens = 'Key Autodetect tokens',
  KeyBatchAccountBalanceRequests = 'Key Batch account balance requests',
  MetricsOptIn = 'Metrics Opt In',
  MetricsOptOut = 'Metrics Opt Out',
  NavAccountMenuOpened = 'Account Menu Opened',
  NavAccountDetailsOpened = 'Account Details Opened',
  NavConnectedSitesOpened = 'Connected Sites Opened',
  NavMainMenuOpened = 'Main Menu Opened',
  NavNetworkMenuOpened = 'Network Menu Opened',
  NavSettingsOpened = 'Settings Opened',
  NavAccountSwitched = 'Account Switched',
  NavNetworkSwitched = 'Network Switched',
  NavBuyButtonClicked = 'Buy Button Clicked',
  NavSendButtonClicked = 'Send Button Clicked',
  NavSwapButtonClicked = 'Swap Button Clicked',
  NftAdded = 'NFT Added',
  OnboardingWalletCreationStarted = 'Wallet Setup Selected',
  OnboardingWalletImportStarted = 'Wallet Import Started',
  OnboardingWalletCreationAttempted = 'Wallet Password Created',
  OnboardingWalletSecurityStarted = 'SRP Backup Selected',
  OnboardingWalletSecuritySkipInitiated = 'SRP Skip Backup Selected',
  OnboardingWalletSecuritySkipConfirmed = 'SRP Backup Skipped',
  OnboardingWalletSecuritySkipCanceled = 'SRP Skip Backup Canceled',
  OnboardingWalletSecurityPhraseRevealed = 'SRP Revealed',
  OnboardingWalletSecurityPhraseWrittenDown = 'SRP Backup Confirm Display',
  OnboardingWalletSecurityPhraseConfirmed = 'SRP Backup Confirmed',
  OnboardingWalletCreationComplete = 'Wallet Created',
  OnboardingWalletSetupComplete = 'Application Opened',
  OnboardingWalletAdvancedSettings = 'Settings Updated',
  OnboardingWalletImportAttempted = 'Wallet Import Attempted',
  OnboardingWalletVideoPlay = 'SRP Intro Video Played',
  OnboardingTwitterClick = 'External Link Clicked',
  OnrampProviderSelected = 'On-ramp Provider Selected',
  PermissionsApproved = 'Permissions Approved',
  PermissionsRejected = 'Permissions Rejected',
  PermissionsRequested = 'Permissions Requested',
  PetnameCreated = 'Petname Created',
  PetnameDeleted = 'Petname Deleted',
  PetnameDisplayed = 'Petname Displayed',
  PetnameModalOpened = 'Petname Modal Opened',
  PetnameUpdated = 'Petname Updated',
  PhishingPageDisplayed = 'Phishing Page Displayed',
  PortfolioLinkClicked = 'Portfolio Link Clicked',
  ProviderMethodCalled = 'Provider Method Called',
  PublicAddressCopied = 'Public Address Copied',
  QuoteError = 'Quote Error',
  SettingsUpdated = 'Settings Updated',
  SignatureApproved = 'Signature Approved',
  SignatureFailed = 'Signature Failed',
  SignatureRejected = 'Signature Rejected',
  SignatureRequested = 'Signature Requested',
  SimulationFails = 'Simulation Fails',
  SrpRevealStarted = 'Reveal SRP Initiated',
  SrpRevealClicked = 'Clicked Reveal Secret Recovery',
  SrpRevealViewed = 'Views Reveal Secret Recovery',
  SrpRevealBackButtonClicked = 'Clicked Back on Reveal SRP Password Page',
  SrpRevealCancelled = 'Reveal SRP Cancelled',
  SrpRevealCancelButtonClicked = 'Clicks Cancel on Reveal Secret Recovery Phrase Page',
  SrpRevealCloseClicked = 'Clicks CLOSE with SRP',
  SrpRevealNextClicked = 'Clicks Next on Reveal Secret Recovery Phrase',
  SrpHoldToRevealClickStarted = 'Reveal SRP Click Started',
  SrpHoldToRevealCloseClicked = 'Closes Hold To Reveal SRP',
  SrpHoldToRevealCompleted = 'Reveal SRP Completed',
  SrpViewsSrpQR = 'Views SRP QR Code',
  SrpViewSrpText = 'Views SRP',
  SrpCopiedToClipboard = 'Copies SRP to clipboard',
  SrpToConfirmBackup = 'SRP Backup Confirm Displayed',
  SupportLinkClicked = 'Support Link Clicked',
  TermsOfUseShown = 'Terms of Use Shown',
  TermsOfUseAccepted = 'Terms of Use Accepted',
  TokenImportButtonClicked = 'Import Token Button Clicked',
  TokenScreenOpened = 'Token Screen Opened',
  TokenAdded = 'Token Added',
  TokenDetected = 'Token Detected',
  TokenHidden = 'Token Hidden',
  TokenImportCanceled = 'Token Import Canceled',
  TokenImportClicked = 'Token Import Clicked',
  WalletSetupStarted = 'Wallet Setup Selected',
  WalletSetupCanceled = 'Wallet Setup Canceled',
  WalletSetupFailed = 'Wallet Setup Failed',
  WalletCreated = 'Wallet Created',
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  DeeplinkClicked = 'Deeplink Clicked',
  ConnectCustodialAccountClicked = 'Connect Custodial Account Clicked',
  MMIPortfolioButtonClicked = 'MMI Portfolio Button Clicked',
  PortfolioDashboardModalButtonClicked = 'Portfolio Dashboard Modal Button Clicked',
  PortfolioDashboardModalOpened = 'Portfolio Dashboard Modal Opened',
  StakeButtonClicked = 'Stake Button Clicked',
  InteractiveReplacementTokenButtonClicked = 'Interactive Replacement Token Button Clicked',
  RefreshTokenListClicked = 'Refresh Token List Clicked',
  SignatureDeeplinkDisplayed = 'Signature Deeplink Displayed',
  InstitutionalFeatureConnected = 'Institutional Feature Connected',
  CustodianSelected = 'Custodian Selected',
  CustodianConnected = 'Custodian Connected',
  CustodianConnectionCanceled = 'Custodian Connection Canceled',
  CustodianConnectionFailed = 'Custodian Connection Failed',
  CustodialAccountsConnected = 'Custodial Accounts Connected',
  ///: END:ONLY_INCLUDE_IF
  AccountDetailMenuOpened = 'Account Details Menu Opened',
  BlockExplorerLinkClicked = 'Block Explorer Clicked',
  AccountRemoved = 'Account Removed',
  TestNetworksDisplayed = 'Test Networks Displayed',
  AddNetworkButtonClick = 'Add Network Button Clicked',
  CustomNetworkAdded = 'Custom Network Added',
  TokenDetailsOpened = 'Token Details Opened',
  NftScreenOpened = 'NFT Screen Opened',
  ActivityScreenOpened = 'Activity Screen Opened',
  WhatsNewViewed = `What's New Viewed`,
  WhatsNewClicked = `What's New Link Clicked`,
  PrepareSwapPageLoaded = 'Prepare Swap Page Loaded',
  QuotesRequested = 'Quotes Requested',
  QuotesReceived = 'Quotes Received',
  BestQuoteReviewed = 'Best Quote Reviewed',
  AllAvailableQuotesOpened = 'All Available Quotes Opened',
  SwapStarted = 'Swap Started',
  TransactionAdded = 'Transaction Added',
  TransactionSubmitted = 'Transaction Submitted',
  TransactionApproved = 'Transaction Approved',
  SwapCompleted = 'Swap Completed',
  TransactionFinalized = 'Transaction Finalized',
  ExitedSwaps = 'Exited Swaps',
  SwapError = 'Swap Error',
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  SnapInstalled = 'Snap Installed',
  SnapUninstalled = 'Snap Uninstalled',
  SnapUpdated = 'Snap Updated',
  SnapExportUsed = 'Snap Export Used',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  InsightSnapViewed = 'Insight Snap Viewed',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  AddSnapAccountEnabled = 'Add Snap Account Enabled',
  ///: END:ONLY_INCLUDE_IF
}

export enum MetaMetricsEventAccountType {
  Default = 'metamask',
  Hardware = 'hardware',
  Imported = 'imported',
}

export enum MetaMetricsEventAccountImportType {
  Json = 'json',
  PrivateKey = 'private_key',
  Srp = 'srp',
}

export enum MetaMetricsEventCategory {
  Accounts = 'Accounts',
  App = 'App',
  Auth = 'Auth',
  Background = 'Background',
  Desktop = 'Desktop',
  // The TypeScript ESLint rule is incorrectly marking this line.
  /* eslint-disable-next-line @typescript-eslint/no-shadow */
  Error = 'Error',
  Footer = 'Footer',
  Home = 'Home',
  InpageProvider = 'inpage_provider',
  Keys = 'Keys',
  Messages = 'Messages',
  Navigation = 'Navigation',
  Network = 'Network',
  Onboarding = 'Onboarding',
  Petnames = 'Petnames',
  Phishing = 'Phishing',
  Retention = 'Retention',
  Settings = 'Settings',
  Snaps = 'Snaps',
  Swaps = 'Swaps',
  Tokens = 'Tokens',
  Transactions = 'Transactions',
  Wallet = 'Wallet',
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  MMI = 'Institutional',
  ///: END:ONLY_INCLUDE_IF
}

export enum MetaMetricsEventLinkType {
  AccountTracker = 'Account Tracker',
  BlockExplorer = 'Block Explorer',
  TokenTracker = 'Token Tracker',
  TransactionBlockExplorer = 'Transaction Block Explorer',
}

export enum MetaMetricsEventKeyType {
  Pkey = 'private_key',
  Srp = 'srp',
}

export enum MetaMetricsEventErrorType {
  InsufficientGas = 'insufficient_gas',
  GasTimeout = 'gas_timeout',
}

export enum MetaMetricsNetworkEventSource {
  CustomNetworkForm = 'custom_network_form',
  PopularNetworkList = 'popular_network_list',
  Dapp = 'dapp',
}

export enum MetaMetricsSwapsEventSource {
  MainView = 'Main View',
  TokenView = 'Token View',
}

export enum MetaMetricsTokenEventSource {
  Custom = 'custom',
  Dapp = 'dapp',
  Detected = 'detected',
  List = 'list',
}

export enum MetaMetricsTransactionEventSource {
  Dapp = 'dapp',
  User = 'user',
}

export enum MetaMetricsEventLocation {
  TokenDetails = 'token_details',
  TokenDetection = 'token_detection',
  TokenMenu = 'token_menu',
}

export enum MetaMetricsEventUiCustomization {
  FlaggedAsMalicious = 'flagged_as_malicious',
  FlaggedAsSafetyUnknown = 'flagged_as_safety_unknown',
  GasEstimationFailed = 'gas_estimation_failed',
  Siwe = 'sign_in_with_ethereum',
}

/**
 * Values that can used in the "properties" tracking object as keys, e.g. `{
 * location: 'Home' }`.
 */
export enum MetaMetricsContextProp {
  PageTitle = 'location',
}
