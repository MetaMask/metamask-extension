import { Json } from '@metamask/utils';
import type { EnvironmentType } from './app';
import { LedgerTransportTypes } from './hardware-wallets';

type JsonWithUndefined =
  | null
  | boolean
  | number
  | string
  | undefined
  | Json[]
  | {
      [prop: string]: Json;
    };

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
export type MetaMetricsContext = {
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
  /**
   * The marketing campaign cookie ID.
   */
  marketingCampaignCookieId?: string | null;
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
  actionId?: string;
  /**
   * The type of environment this event occurred in. Defaults to the background
   * process type.
   */
  environmentType?: string;
  /**
   * Custom values to track. Keys in this object must be `snake_case`.
   */
  properties?: Record<string, Json>;

  /**
   * Sensitive values to track. These properties will be sent in an additional
   * event that excludes the user's `metaMetricsId`. Keys in this object must be
   * in `snake_case`.
   */
  sensitiveProperties?: Record<string, Json>;
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
  /*
   * The unique identifier for the event.
   */
  uniqueIdentifier?: string;
  /**
   * Whether the event is a duplicate of an anonymized event.
   */
  isDuplicateAnonymizedEvent?: boolean;
};

export type UnsanitizedMetaMetricsEventPayload = Omit<
  MetaMetricsEventPayload,
  'properties'
> & {
  properties?: Record<string, JsonWithUndefined>;
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
  /**
   * Values that can used in the "properties" tracking object as keys,
   */
  contextPropsIntoEventProperties?: string | string[];
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
  properties?: Record<string, Json>;
  /**
   * Sensitive values to track. These properties will be sent in an additional
   * event that excludes the user's `metaMetricsId`. Keys in this object must be
   * in `snake_case`.
   */
  sensitiveProperties?: Record<string, Json>;
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
  /*
   * The event id.
   */
  id: string;
  /*
   * The environment type.
   */
  environmentType?: string;
  /*
   * The event name.
   */
  event?: string;

  /**
   * HACK: "transaction-submitted-<id>" fragment hack
   * If this is true and the fragment is found as an abandoned fragment,
   * then delete the fragment instead of finalizing it.
   */
  canDeleteIfAbandoned?: boolean;
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
  properties: {
    params?: Record<string, string>;
    legacy_event?: boolean;
    locale: string;
    chain_id: string;
    environment_type?: string;
    revenue?: number;
    value?: number;
    currency?: string;
    category?: string;
  };
  /**
   * The context the event occurred in.
   */
  context: MetaMetricsContext;
  /**
   * The message id
   */
  messageId?: string;

  /**
   * The timestamp of the event.
   */
  timestamp?: string;
  /*
   * The event name.
   */
  name?: string;
  /*
   * The user trais
   */
  traits?: MetaMetricsUserTraits;
};

/**
 * Data sent to MetaMetrics for page views.
 */
export type MetaMetricsPagePayload = {
  /**
   * The name of the page that was viewed.
   */
  name?: string;
  /**
   * The variadic parts of the page URL.
   *
   * Example: If the route is `/asset/:asset` and the path is `/asset/ETH`,
   * the `params` property would be `{ asset: 'ETH' }`.
   */
  params?: Record<string, string>;
  /**
   * The environment type that the page was viewed in.
   */
  environmentType?: EnvironmentType;
  /**
   * The details of the page.
   */
  page?: MetaMetricsPageObject;
  /**
   * The dapp that triggered the page view.
   */
  referrer?: MetaMetricsReferrerObject;
  /**
   * The action ID of the page view.
   */
  actionId?: string;
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
  nft_autodetection_enabled?: boolean;
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
   * Does the user have a selected currency in the settings
   */
  current_currency?: string;
  /**
   * Does the user have show native token as main balance enabled.
   */
  show_native_token_as_main_balance?: boolean;
  /**
   * Does the user have native currency enabled?
   */
  use_native_as_primary_currency?: boolean;
  /**
   * Does the user opt in for metrics
   */
  is_metrics_opted_in?: boolean;
  /**
   * Does the user accepted marketing consent
   */
  has_marketing_consent?: boolean;
  /**
   * The date the extension was installed.
   */
  install_date_ext?: string;
  /**
   * Whether the security provider feature has been enabled.
   */
  security_providers?: string[];
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  /**
   * The address of the MMI account in question
   */
  mmi_account_address?: string | null;
  /**
   * What is the MMI extension ID
   */
  mmi_extension_id?: string;
  /**
   * Is the user using a custodian account
   */
  mmi_is_custodian?: boolean;
  ///: END:ONLY_INCLUDE_IF
  /**
   * Does the user change the token sort order on the asset list
   */
  token_sort_preference?: string;
  /**
   * The number of petname addresses
   */
  petname_addresses_count?: number;
};

export enum MetaMetricsUserTrait {
  /**
   * Identifies if the user has opted in for MetaMetrics
   */
  IsMetricsOptedIn = 'is_metrics_opted_in',
  /**
   * Identifies is the user has given marketing consent
   */
  HasMarketingConsent = 'has_marketing_consent',
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
   * Identified when show native token as main balance is toggled.
   */
  ShowNativeTokenAsMainBalance = 'show_native_token_as_main_balance',
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
  PetnameAddressCount = 'petname_addresses_count',
  /**
   * Identified when the user selects a currency from settings
   */
  CurrentCurrency = 'current_currency',
  /**
   * Identified when the user changes token sort order on asset-list
   */
  TokenSortPreference = 'token_sort_preference',
  /**
   * Identifies if the Privacy Mode is enabled
   */
  PrivacyModeEnabled = 'privacy_mode_toggle',
  /**
   * Identified when the user prefers to see all tokens or current network tokens in wallet list
   */
  NetworkFilterPreference = 'selected_network_filter',
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

/**
 * The name of the event. Event definitions with corresponding properties can be found in the following document:
 *
 * @see {@link https://www.notion.so/f2997ab32326441793ff790ba5c60a6a?v=267d984721cd4a26be610b5caa3e25b7&pvs=4}
 */
export enum MetaMetricsEventName {
  AccountAdded = 'Account Added',
  AccountAddSelected = 'Account Add Selected',
  AccountAddFailed = 'Account Add Failed',
  AccountDetailsOpened = 'Account Details Opened',
  AccountPasswordCreated = 'Account Password Created',
  AccountReset = 'Account Reset',
  AccountRenamed = 'Account Renamed',
  AccountsSyncAdded = 'Accounts Sync Added',
  AccountsSyncNameUpdated = 'Accounts Sync Name Updated',
  AccountsSyncErroneousSituation = 'Accounts Sync Erroneous Situation',
  ActivityDetailsOpened = 'Activity Details Opened',
  ActivityDetailsClosed = 'Activity Details Closed',
  AnalyticsPreferenceSelected = 'Analytics Preference Selected',
  AppInstalled = 'App Installed',
  AppOpened = 'App Opened',
  AppUnlocked = 'App Unlocked',
  AppUnlockedFailed = 'App Unlocked Failed',
  AppLocked = 'App Locked',
  AppWindowExpanded = 'App Window Expanded',
  BridgeLinkClicked = 'Bridge Link Clicked',
  BitcoinSupportToggled = 'Bitcoin Support Toggled',
  BitcoinTestnetSupportToggled = 'Bitcoin Testnet Support Toggled',
  SolanaSupportToggled = 'Solana Support Toggled',
  CurrentCurrency = 'Current Currency',
  DappViewed = 'Dapp Viewed',
  DecryptionApproved = 'Decryption Approved',
  DecryptionRejected = 'Decryption Rejected',
  DecryptionRequested = 'Decryption Requested',
  DisablingNotifications = 'Notifications Disabled',
  EmptyBuyBannerDisplayed = 'Empty Buy Banner Displayed',
  EmptyBuyBannerClicked = 'Empty Buy Banner Clicked',
  EmptyReceiveBannerDisplayed = 'Empty Receive Banner Displayed',
  EmptyReceiveBannerClicked = 'Empty Receive Banner Clicked',
  EmptyNftsBannerDisplayed = 'Empty NFTs Banner Displayed',
  EmptyNftsBannerClicked = 'Empty NFTs Banner Clicked',
  EnablingNotifications = 'Notifications Enabled',
  EncryptionPublicKeyApproved = 'Encryption Approved',
  EncryptionPublicKeyRejected = 'Encryption Rejected',
  EncryptionPublicKeyRequested = 'Encryption Requested',
  ErrorOccured = 'Error occured',
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
  MarkAllNotificationsRead = 'Notifications Marked All as Read',
  MetricsOptIn = 'Metrics Opt In',
  MetricsOptOut = 'Metrics Opt Out',
  MetricsDataDeletionRequest = 'Delete MetaMetrics Data Request Submitted',
  NavAccountMenuOpened = 'Account Menu Opened',
  NavConnectedSitesOpened = 'Connected Sites Opened',
  NavMainMenuOpened = 'Main Menu Opened',
  NavPermissionsOpened = 'Permissions Opened',
  UpdatePermissionedNetworks = 'Update Permissioned Networks',
  UpdatePermissionedAccounts = 'Update Permissioned Accounts',
  ViewPermissionedNetworks = 'View Permissioned Networks',
  ViewPermissionedAccounts = 'View Permissioned Accounts',
  NavNetworkMenuOpened = 'Network Menu Opened',
  NavSettingsOpened = 'Settings Opened',
  NavAccountSwitched = 'Account Switched',
  NavNetworkSwitched = 'Network Switched',
  NavBuyButtonClicked = 'Buy Button Clicked',
  NavSendButtonClicked = 'Send Button Clicked',
  NavSwapButtonClicked = 'Swap Button Clicked',
  NavReceiveButtonClicked = 'Receive Button Clicked',
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
  OnboardingWalletAdvancedSettings = 'Settings Updated',
  OnboardingWalletImportAttempted = 'Wallet Import Attempted',
  OnboardingWalletVideoPlay = 'SRP Intro Video Played',
  OnboardingTwitterClick = 'External Link Clicked',
  OnboardingWalletSetupComplete = 'Wallet Setup Complete',
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
  ProceedAnywayClicked = 'Proceed Anyway Clicked',
  PortfolioLinkClicked = 'Portfolio Link Clicked',
  ProviderMethodCalled = 'Provider Method Called',
  PublicAddressCopied = 'Public Address Copied',
  QuoteError = 'Quote Error',
  SettingsUpdated = 'Settings Updated',
  SignatureApproved = 'Signature Approved',
  SignatureFailed = 'Signature Failed',
  SignatureRejected = 'Signature Rejected',
  SignatureRequested = 'Signature Requested',
  SignatureApprovedAnon = 'Signature Approved Anon',
  SignatureRejectedAnon = 'Signature Rejected Anon',
  SignatureRequestedAnon = 'Signature Requested Anon',
  SimulationFails = 'Simulation Fails',
  SimulationIncompleteAssetDisplayed = 'Incomplete Asset Displayed',
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
  StakingEntryPointClicked = 'Stake Button Clicked',
  SurveyToast = 'Survey Toast',
  SupportLinkClicked = 'Support Link Clicked',
  TermsOfUseShown = 'Terms of Use Shown',
  TermsOfUseAccepted = 'Terms of Use Accepted',
  TokenImportButtonClicked = 'Import Token Button Clicked',
  TokenScreenOpened = 'Token Screen Opened',
  TokenAdded = 'Token Added',
  TokenRemoved = 'Token Removed',
  TokenSortPreference = 'Token Sort Preference',
  NFTRemoved = 'NFT Removed',
  TokenDetected = 'Token Detected',
  TokenHidden = 'Token Hidden',
  TokenImportCanceled = 'Token Import Canceled',
  TokenImportClicked = 'Token Import Clicked',
  ShowNativeTokenAsMainBalance = 'Show native token as main balance',
  WalletSetupStarted = 'Wallet Setup Selected',
  WalletSetupCanceled = 'Wallet Setup Canceled',
  WalletSetupFailed = 'Wallet Setup Failed',
  WalletCreated = 'Wallet Created',
  // BEGIN:ONLY_INCLUDE_IF(build-flask)
  WatchEthereumAccountsToggled = 'Watch Ethereum Accounts Toggled',
  // END:ONLY_INCLUDE_IF
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
  AccountRemoveFailed = 'Account Remove Failed',
  TestNetworksDisplayed = 'Test Networks Displayed',
  AddNetworkButtonClick = 'Add Network Button Clicked',
  CustomNetworkAdded = 'Custom Network Added',
  TokenDetailsOpened = 'Token Details Opened',
  NftScreenOpened = 'NFT Screen Opened',
  NftDetailsOpened = 'NFT Details Opened',
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
  ConfirmationQueued = 'Confirmation Queued',
  ExitedSwaps = 'Exited Swaps',
  SwapError = 'Swap Error',
  SnapInstallStarted = 'Snap Install Started',
  SnapInstallFailed = 'Snap Install Failed',
  SnapInstallRejected = 'Snap Install Rejected',
  SnapInstalled = 'Snap Installed',
  SnapUninstalled = 'Snap Uninstalled',
  SnapUpdateStarted = 'Snap Update Started',
  SnapUpdateRejected = 'Snap Update Rejected',
  SnapUpdateFailed = 'Snap Update Failed',
  SnapUpdated = 'Snap Updated',
  SnapExportUsed = 'Snap Export Used',
  InsightSnapViewed = 'Insight Snap Viewed',
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  AddSnapAccountEnabled = 'Add Snap Account Enabled',
  AddSnapAccountViewed = 'Add Snap Account Viewed',
  AddSnapAccountConfirmed = 'Add Snap Account Confirmed',
  AddSnapAccountCanceled = 'Add Snap Account Canceled',
  AddSnapAccountSuccessViewed = 'Add Snap Account Success Viewed',
  AddSnapAccountSuccessClicked = 'Add Snap Account Success Clicked',
  RemoveSnapAccountViewed = 'Remove Snap Account Viewed',
  RemoveSnapAccountConfirmed = 'Remove Snap Account Confirmed',
  RemoveSnapAccountCanceled = 'Remove Snap Account Canceled',
  RemoveSnapAccountSuccessViewed = 'Remove Snap Account Success Viewed',
  RemoveSnapAccountSuccessClicked = 'Remove Snap Account Success Clicked',
  SnapAccountTransactionLoadingViewed = 'Snap Account Transaction Loading Viewed',
  SnapAccountTransactionFinalizeViewed = 'Snap Account Transaction Finalize Viewed',
  SnapAccountTransactionFinalizeRedirectGoToSiteClicked = 'Snap Account Transaction Finalize Redirect "Go To Site" Clicked',
  SnapAccountTransactionFinalizeRedirectSnapUrlClicked = 'Snap Account Transaction Finalize Redirect "Snap URL" Clicked',
  SnapAccountTransactionFinalizeClosed = 'Snap Account Transaction Finalize Closed',
  ///: END:ONLY_INCLUDE_IF
  TurnOnMetaMetrics = 'MetaMetrics Turned On',
  TurnOffMetaMetrics = 'MetaMetrics Turned Off',
  // Notifications
  NotificationClicked = 'Notification Clicked',
  NotificationDetailClicked = 'Notification Detail Clicked',
  NotificationsMenuOpened = 'Notifications Menu Opened',
  NotificationsSettingsUpdated = 'Notifications Settings Updated',
  NotificationsActivated = 'Notifications Activated',
  PushNotificationReceived = 'Push Notification Received',
  PushNotificationClicked = 'Push Notification Clicked',

  // Send
  sendAssetSelected = 'Send Asset Selected',
  sendFlowExited = 'Send Flow Exited',
  sendRecipientSelected = 'Send Recipient Selected',
  sendSwapQuoteError = 'Send Swap Quote Error',
  sendSwapQuoteRequested = 'Send Swap Quote Requested',
  sendSwapQuoteReceived = 'Send Swap Quote Received',
  sendTokenModalOpened = 'Send Token Modal Opened',
}

export enum MetaMetricsEventAccountType {
  Default = 'metamask',
  Hardware = 'hardware',
  Imported = 'imported',
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  Snap = 'snap',
  ///: END:ONLY_INCLUDE_IF
}

export enum QueueType {
  NavigationHeader = 'navigation_header',
  QueueController = 'queue_controller',
}

export enum MetaMetricsEventAccountImportType {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Json = 'json',
  PrivateKey = 'private_key',
  Srp = 'srp',
}

export enum MetaMetricsEventCategory {
  Accounts = 'Accounts',
  App = 'App',
  Auth = 'Auth',
  Background = 'Background',
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
  NotificationInteraction = 'Notification Interaction',
  NotificationsActivationFlow = 'Notifications Activation Flow',
  NotificationSettings = 'Notification Settings',
  Petnames = 'Petnames',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Permissions = 'Permissions',
  Phishing = 'Phishing',
  ProfileSyncing = 'Profile Syncing',
  PushNotifications = 'Notifications',
  Retention = 'Retention',
  Send = 'Send',
  Settings = 'Settings',
  Feedback = 'Feedback',
  Snaps = 'Snaps',
  Swaps = 'Swaps',
  Tokens = 'Tokens',
  Transactions = 'Transactions',
  Wallet = 'Wallet',
  Confirmations = 'Confirmations',
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
  DeprecatedNetworkModal = 'deprecated_network_modal',
  NewAddNetworkFlow = 'new_add_network_flow',
  Bridge = 'bridge',
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
  AlertFrictionModal = 'alert_friction_modal',
  Confirmation = 'confirmation',
  SignatureConfirmation = 'signature_confirmation',
  TokenDetails = 'token_details',
  TokenDetection = 'token_detection',
  TokenMenu = 'token_menu',
  Transaction = 'transaction',
}

export enum MetaMetricsEventUiCustomization {
  FlaggedAsMalicious = 'flagged_as_malicious',
  FlaggedAsSafetyUnknown = 'flagged_as_safety_unknown',
  FlaggedAsWarning = 'flagged_as_warning',
  GasEstimationFailed = 'gas_estimation_failed',
  Order = 'order',
  RedesignedConfirmation = 'redesigned_confirmation',
  SecurityAlertError = 'security_alert_error',
  Siwe = 'sign_in_with_ethereum',
  Permit = 'permit',
}

/**
 * Values that can used in the "properties" tracking object as keys, e.g. `{
 * location: 'Home' }`.
 */
export enum MetaMetricsContextProp {
  PageTitle = 'location',
}

/**
 * The status on which to filter the returned regulations.
 * Mentioned here: https://docs.segmentapis.com/tag/Deletion-and-Suppression#operation/listRegulationsFromSource
 */
export enum DeleteRegulationStatus {
  Failed = 'FAILED',
  Finished = 'FINISHED',
  Initialized = 'INITIALIZED',
  Invalid = 'INVALID',
  NotSupported = 'NOT_SUPPORTED',
  PartialSuccess = 'PARTIAL_SUCCESS',
  Running = 'RUNNING',
  Unknown = 'UNKNOWN',
}
