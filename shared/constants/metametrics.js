// Type Imports
/**
 * @typedef {import('../../shared/constants/app').EnvironmentType} EnvironmentType
 */

// Type Declarations
/**
 * Used to attach context of where the user was at in the application when the
 * event was triggered. Also included as full details of the current page in
 * page events.
 *
 * @typedef {object} MetaMetricsPageObject
 * @property {string} [path] - the path of the current page (e.g /home)
 * @property {string} [title] - the title of the current page (e.g 'home')
 * @property {string} [url] - the fully qualified url of the current page
 */

/**
 * For metamask, this is the dapp that triggered an interaction
 *
 * @typedef {object} MetaMetricsReferrerObject
 * @property {string} [url] - the origin of the dapp issuing the
 *  notification
 */

/**
 * We attach context to every meta metrics event that help to qualify our
 * analytics. This type has all optional values because it represents a
 * returned object from a method call. Ideally app and userAgent are
 * defined on every event. This is confirmed in the getTrackMetaMetricsEvent
 * function, but still provides the consumer a way to override these values if
 * necessary.
 *
 * @typedef {object} MetaMetricsContext
 * @property {object} app - Application metadata.
 * @property {string} app.name - the name of the application tracking the event
 * @property {string} app.version - the version of the application
 * @property {string} userAgent - the useragent string of the user
 * @property {MetaMetricsPageObject} [page] - an object representing details of
 *  the current page
 * @property {MetaMetricsReferrerObject} [referrer] - for metamask, this is the
 *  dapp that triggered an interaction
 */

/**
 * @typedef {object} MetaMetricsEventPayload
 * @property {string} event - event name to track
 * @property {string} category - category to associate event to
 * @property {string} [environmentType] - The type of environment this event
 *  occurred in. Defaults to the background process type
 * @property {object} [properties] - object of custom values to track, keys
 *  in this object must be in snake_case
 * @property {object} [sensitiveProperties] - Object of sensitive values to
 *  track. Keys in this object must be in snake_case. These properties will be
 *  sent in an additional event that excludes the user's metaMetricsId
 * @property {number} [revenue] - amount of currency that event creates in
 *  revenue for MetaMask
 * @property {string} [currency] - ISO 4127 format currency for events with
 *  revenue, defaults to US dollars
 * @property {number} [value] - Abstract business "value" attributable to
 *  customers who trigger this event
 * @property {MetaMetricsPageObject} [page] - the page/route that the event
 *  occurred on
 * @property {MetaMetricsReferrerObject} [referrer] - the origin of the dapp
 *  that triggered the event
 */

/**
 * @typedef {object} MetaMetricsEventOptions
 * @property {boolean} [isOptIn] - happened during opt in/out workflow
 * @property {boolean} [flushImmediately] - When true will automatically flush
 *  the segment queue after tracking the event. Recommended if the result of
 *  tracking the event must be known before UI transition or update
 * @property {boolean} [excludeMetaMetricsId] - whether to exclude the user's
 *  metametrics id for anonymity
 * @property {string} [metaMetricsId] - an override for the metaMetricsId in
 *  the event one is created as part of an asynchronous workflow, such as
 *  awaiting the result of the metametrics opt-in function that generates the
 *  user's metametrics id
 * @property {boolean} [matomoEvent] - is this event a holdover from matomo
 *  that needs further migration? when true, sends the data to a special
 *  segment source that marks the event data as not conforming to our schema
 */

/**
 * @typedef {object} MetaMetricsEventFragment
 * @property {string} successEvent - The event name to fire when the fragment
 *  is closed in an affirmative action.
 * @property {string} [failureEvent] - The event name to fire when the fragment
 *  is closed with a rejection.
 * @property {string} [initialEvent] - An event name to fire immediately upon
 *  fragment creation. This is useful for building funnels in mixpanel and for
 *  reduction of code duplication.
 * @property {string} category - the event category to use for both the success
 *  and failure events
 * @property {boolean} [persist] - Should this fragment be persisted in
 *  state and progressed after the extension is locked and unlocked.
 * @property {number} [timeout] - Time in seconds the event should be persisted
 *  for. After the timeout the fragment will be closed as abandoned. if not
 *  supplied the fragment is stored indefinitely.
 * @property {number} [lastUpdated] - Date.now() when the fragment was last
 *  updated. Used to determine if the timeout has expired and the fragment
 *  should be closed.
 * @property {object} [properties] - Object of custom values to track, keys in
 *  this object must be in snake_case.
 * @property {object} [sensitiveProperties] - Object of sensitive values to
 *  track. Keys in this object must be in snake_case. These properties will be
 *  sent in an additional event that excludes the user's metaMetricsId
 * @property {number} [revenue] - amount of currency that event creates in
 *  revenue for MetaMask if fragment is successful.
 * @property {string} [currency] - ISO 4127 format currency for events with
 *  revenue, defaults to US dollars
 * @property {number} [value] - Abstract business "value" attributable to
 *  customers who successfully complete this fragment
 * @property {MetaMetricsPageObject} [page] - the page/route that the event
 *  occurred on
 * @property {MetaMetricsReferrerObject} [referrer] - the origin of the dapp
 *  that initiated the event fragment.
 * @property {string} [uniqueIdentifier] - optional argument to override the
 *  automatic generation of UUID for the event fragment. This is useful when
 *  tracking events for subsystems that already generate UUIDs so to avoid
 *  unnecessary lookups and reduce accidental duplication.
 */

/**
 * Represents the shape of data sent to the segment.track method.
 *
 * @typedef {object} SegmentEventPayload
 * @property {string} [userId] - The metametrics id for the user
 * @property {string} [anonymousId] - An anonymousId that is used to track
 *  sensitive data while preserving anonymity.
 * @property {string} event - name of the event to track
 * @property {object} properties - properties to attach to the event
 * @property {MetaMetricsContext} context - the context the event occurred in
 */

/**
 * @typedef {object} MetaMetricsPagePayload
 * @property {string} name - The name of the page that was viewed
 * @property {object} [params] - The variadic parts of the page url
 *  example (route: `/asset/:asset`, path: `/asset/ETH`)
 *  params: { asset: 'ETH' }
 * @property {EnvironmentType} environmentType - the environment type that the
 *  page was viewed in
 * @property {MetaMetricsPageObject} [page] - the details of the page
 * @property {MetaMetricsReferrerObject} [referrer] - dapp that triggered the page
 *  view
 */

/**
 * @typedef {object} MetaMetricsPageOptions
 * @property {boolean} [isOptInPath] - is the current path one of the pages in
 *  the onboarding workflow? If true and participateInMetaMetrics is null track
 *  the page view
 */

/**
 * @typedef {object} Traits
 * @property {'address_book_entries'} ADDRESS_BOOK_ENTRIES - When the user
 *  adds or modifies addresses in address book the address_book_entries trait
 *  is identified.
 * @property {'ledger_connection_type'} LEDGER_CONNECTION_TYPE - when ledger
 *  live connnection type is changed we identify the ledger_connection_type
 *  trait
 * @property {'networks_added'} NETWORKS_ADDED - when user modifies networks
 *  we identify the networks_added trait
 * @property {'networks_without_ticker'} NETWORKS_WITHOUT_TICKER - when user
 *  modifies networks we identify the networks_without_ticker trait for
 *  networks without a ticker.
 * @property {'nft_autodetection_enabled'} NFT_AUTODETECTION_ENABLED - when Autodetect NFTs
 * feature is toggled we identify the nft_autodetection_enabled trait
 * @property {'number_of_accounts'} NUMBER_OF_ACCOUNTS - when identities
 *  change, we identify the new number_of_accounts trait
 * @property {'number_of_nft_collections'} NUMBER_OF_NFT_COLLECTIONS - user
 *  trait for number of unique NFT addresses
 * @property {'number_of_nfts'} NUMBER_OF_NFTS - user trait for number of all NFT addresses
 * @property {'number_of_tokens'} NUMBER_OF_TOKENS - when the number of tokens change, we
 * identify the new number_of_tokens trait
 * @property {'opensea_api_enabled'} OPENSEA_API_ENABLED - when the OpenSea API is enabled
 * we identify the opensea_api_enabled trait
 * @property {'three_box_enabled'} THREE_BOX_ENABLED - When 3Box feature is
 *  toggled we identify the 3box_enabled trait. This trait has been deprecated.
 * @property {'theme'} THEME - when the user's theme changes we identify the theme trait
 * @property {'token_detection_enabled'} TOKEN_DETECTION_ENABLED - when token detection feature is toggled we
 * identify the token_detection_enabled trait
 * @property {'install_date_ext'} INSTALL_DATE_EXT - when the user installed the extension
 */

/**
 *
 * @type {Traits}
 */

export const TRAITS = {
  ADDRESS_BOOK_ENTRIES: 'address_book_entries',
  INSTALL_DATE_EXT: 'install_date_ext',
  LEDGER_CONNECTION_TYPE: 'ledger_connection_type',
  NETWORKS_ADDED: 'networks_added',
  NETWORKS_WITHOUT_TICKER: 'networks_without_ticker',
  NFT_AUTODETECTION_ENABLED: 'nft_autodetection_enabled',
  NUMBER_OF_ACCOUNTS: 'number_of_accounts',
  NUMBER_OF_NFT_COLLECTIONS: 'number_of_nft_collections',
  NUMBER_OF_NFTS: 'number_of_nfts',
  NUMBER_OF_TOKENS: 'number_of_tokens',
  OPENSEA_API_ENABLED: 'opensea_api_enabled',
  THEME: 'theme',
  THREE_BOX_ENABLED: 'three_box_enabled',
  TOKEN_DETECTION_ENABLED: 'token_detection_enabled',
};

/**
 * @typedef {object} MetaMetricsTraits
 * @property {number} [address_book_entries] - The number of entries in the
 *  user's address book.
 * @property {'ledgerLive' | 'webhid' | 'u2f'} [ledger_connection_type] - the
 *  type of ledger connection set by user preference.
 * @property {Array<string>} [networks_added] - An array consisting of chainIds
 *  that indicate the networks a user has added to their MetaMask.
 * @property {Array<string>} [networks_without_ticker] - An array consisting of
 *  chainIds that indicate the networks added by the user that do not have a
 *  ticker.
 * @property {number} [nft_autodetection_enabled] - does the user have the
 * use collection/nft detection enabled?
 * @property {number} [number_of_accounts] - A number representing the number
 *  of identities(accounts) added to the user's MetaMask.
 * @property {number} [number_of_nft_collections] - A number representing the
 *  amount of different NFT collections the user possesses an NFT from.
 * @property {number} [number_of_nfts] - A number representing the
 *  amount of all NFTs the user possesses across all networks and accounts.
 * @property {number} [number_of_tokens] - The total number of token contracts
 *  the user has across all networks and accounts.
 * @property {boolean} [opensea_api_enabled] - does the user have the OpenSea
 *  API enabled?
 * @property {boolean} [three_box_enabled] - Does the user have 3box sync
 *  enabled? (deprecated)
 * @property {string} [theme] - which theme the user has selected
 * @property {boolean} [token_detection_enabled] - does the user have token detection is enabled?
 */

// Mixpanel converts the zero address value to a truly anonymous event, which
// speeds up reporting
export const METAMETRICS_ANONYMOUS_ID = '0x0000000000000000';

/**
 * This object is used to identify events that are triggered by the background
 * process.
 *
 * @type {MetaMetricsPageObject}
 */
export const METAMETRICS_BACKGROUND_PAGE_OBJECT = {
  path: '/background-process',
  title: 'Background Process',
  url: '/background-process',
};

/**
 * @typedef {object} SegmentInterface
 * @property {SegmentEventPayload[]} queue - A queue of events to be sent when
 *  the flushAt limit has been reached, or flushInterval occurs
 * @property {() => void} flush - Immediately flush the queue, resetting it to
 *  an empty array and sending the pending events to Segment
 * @property {(
 *  payload: SegmentEventPayload,
 *  callback: (err?: Error) => void
 * ) => void} track - Track an event with Segment, using the internal batching
 *  mechanism to optimize network requests
 * @property {(payload: object) => void} page - Track a page view with Segment
 * @property {() => void} identify - Identify an anonymous user. We do not
 *  currently use this method.
 */

export const REJECT_NOTFICIATION_CLOSE = 'Cancel Via Notification Close';
export const REJECT_NOTFICIATION_CLOSE_SIG =
  'Cancel Sig Request Via Notification Close';

/**
 * EVENTS
 */

export const EVENT_NAMES = {
  ACCOUNT_ADDED: 'Account Added',
  ACCOUNT_ADD_SELECTED: 'Account Add Selected',
  ACCOUNT_ADD_FAILED: 'Account Add Failed',
  ACCOUNT_PASSWORD_CREATED: 'Wallet Password Created',
  ACCOUNT_RESET: 'Account Reset',
  APP_INSTALLED: 'App Installed',
  APP_UNLOCKED: 'App Unlocked',
  APP_UNLOCKED_FAILED: 'App Unlocked Failed',
  APP_WINDOW_EXPANDED: 'App Window Expanded',
  DECRYPTION_APPROVED: 'Decryption Approved',
  DECRYPTION_REJECTED: 'Decryption Rejected',
  DECRYPTION_REQUESTED: 'Decryption Requested',
  ENCRYPTION_PUBLIC_KEY_APPROVED: 'Encryption Approved',
  ENCRYPTION_PUBLIC_KEY_REJECTED: 'Encryption Rejected',
  ENCRYPTION_PUBLIC_KEY_REQUESTED: 'Encryption Requested',
  EXTERNAL_LINK_CLICKED: 'External Link Clicked',
  KEY_EXPORT_SELECTED: 'Key Export Selected',
  KEY_EXPORT_REQUESTED: 'Key Export Requested',
  KEY_EXPORT_FAILED: 'Key Export Failed',
  KEY_EXPORT_CANCELED: 'Key Export Canceled',
  KEY_EXPORT_REVEALED: 'Key Material Revealed',
  KEY_EXPORT_COPIED: 'Key Material Copied',
  KEY_TOKEN_DETECTION_SELECTED: 'Key Token Detection Selected',
  KEY_GLOBAL_SECURITY_TOGGLE_SELECTED: 'Key Global Security/Privacy Settings',
  KEY_BALANCE_TOKEN_PRICE_CHECKER:
    'Key Show Balance and Token Price Checker Settings',
  KEY_GAS_FEE_ESTIMATION_BUY_SWAP_TOKENS:
    'Key Show Gas Fee Estimation, Buy Crypto and Swap Tokens',
  KEY_AUTO_DETECT_TOKENS: 'Key Autodetect tokens',
  KEY_BATCH_ACCOUNT_BALANCE_REQUESTS: 'Key Batch account balance requests',
  METRICS_OPT_IN: 'Metrics Opt In',
  METRICS_OPT_OUT: 'Metrics Opt Out',
  NAV_ACCOUNT_MENU_OPENED: 'Account Menu Opened',
  NAV_ACCOUNT_DETAILS_OPENED: 'Account Details Opened',
  NAV_CONNECTED_SITES_OPENED: 'Connected Sites Opened',
  NAV_MAIN_MENU_OPENED: 'Main Menu Opened',
  NAV_NETWORK_MENU_OPENED: 'Network Menu Opened',
  NAV_SETTINGS_OPENED: 'Settings Opened',
  NAV_ACCOUNT_SWITCHED: 'Account Switched',
  NAV_NETWORK_SWITCHED: 'Network Switched',
  NAV_BUY_BUTTON_CLICKED: 'Buy Button Clicked',
  NAV_SEND_BUTTON_CLICKED: 'Send Button Clicked',
  NAV_SWAP_BUTTON_CLICKED: 'Swap Button Clicked',
  SRP_TO_CONFIRM_BACKUP: 'SRP Backup Confirm Displayed',
  WALLET_SETUP_STARTED: 'Wallet Setup Selected',
  WALLET_SETUP_CANCELED: 'Wallet Setup Canceled',
  WALLET_SETUP_FAILED: 'Wallet Setup Failed',
  WALLET_CREATED: 'Wallet Created',
  NFT_ADDED: 'NFT Added',
  ONRAMP_PROVIDER_SELECTED: 'On-ramp Provider Selected',
  PERMISSIONS_APPROVED: 'Permissions Approved',
  PERMISSIONS_REJECTED: 'Permissions Rejected',
  PERMISSIONS_REQUESTED: 'Permissions Requested',
  PORTFOLIO_LINK_CLICKED: 'Portfolio Link Clicked',
  PUBLIC_ADDRESS_COPIED: 'Public Address Copied',
  PROVIDER_METHOD_CALLED: 'Provider Method Called',
  SIGNATURE_APPROVED: 'Signature Approved',
  SIGNATURE_REJECTED: 'Signature Rejected',
  SIGNATURE_REQUESTED: 'Signature Requested',
  TOKEN_IMPORT_BUTTON_CLICKED: 'Import Token Button Clicked',
  TOKEN_SCREEN_OPENED: 'Token Screen Opened',
  SUPPORT_LINK_CLICKED: 'Support Link Clicked',
  TOKEN_ADDED: 'Token Added',
  TOKEN_DETECTED: 'Token Detected',
  TOKEN_HIDDEN: 'Token Hidden',
  TOKEN_IMPORT_CANCELED: 'Token Import Canceled',
  TOKEN_IMPORT_CLICKED: 'Token Import Clicked',
  ONBOARDING_WELCOME: 'App Installed',
  ONBOARDING_WALLET_CREATION_STARTED: 'Wallet Setup Selected',
  ONBOARDING_WALLET_IMPORT_STARTED: 'Wallet Import Started',
  ONBOARDING_WALLET_CREATION_ATTEMPTED: 'Wallet Password Created',
  ONBOARDING_WALLET_SECURITY_STARTED: 'SRP Backup Selected',
  ONBOARDING_WALLET_SECURITY_SKIP_INITIATED: 'SRP Skip Backup Selected',
  ONBOARDING_WALLET_SECURITY_SKIP_CONFIRMED: 'SRP Backup Skipped',
  ONBOARDING_WALLET_SECURITY_SKIP_CANCELED: 'SRP Skip Backup Canceled',
  ONBOARDING_WALLET_SECURITY_PHRASE_REVEALED: 'Key Material Revealed',
  ONBOARDING_WALLET_SECURITY_PHRASE_WRITTEN_DOWN: 'SRP Backup Confirm Display',
  ONBOARDING_WALLET_SECURITY_PHRASE_CONFIRMED: 'SRP Backup Confirmed',
  ONBOARDING_WALLET_CREATION_COMPLETE: 'Wallet Created',
  ONBOARDING_WALLET_IMPORT_COMPLETE: 'Wallet Imported',
  ONBOARDING_WALLET_SETUP_COMPLETE: 'Application Opened',
  ONBOARDING_WALLET_ADVANCED_SETTINGS: 'Settings Updated',
  ONBOARDING_WALLET_IMPORT_ATTEMPTED: 'Wallet Import Attempted',
  ONBOARDING_WALLET_METRICS_PREFENCE_SELECTED: 'Analytics Preferences Selected',
  ONBOARDING_WALLET_VIDEO_PLAY: 'SRP Intro Video Played',
  ONBOARDING_TWITTER_CLICK: 'External Link Clicked',
};

export const EVENT = {
  ACCOUNT_TYPES: {
    DEFAULT: 'metamask',
    IMPORTED: 'imported',
    HARDWARE: 'hardware',
  },
  ACCOUNT_IMPORT_TYPES: {
    JSON: 'json',
    PRIVATE_KEY: 'private_key',
    SRP: 'srp',
  },
  CATEGORIES: {
    ACCOUNTS: 'Accounts',
    APP: 'App',
    AUTH: 'Auth',
    BACKGROUND: 'Background',
    ERROR: 'Error',
    FOOTER: 'Footer',
    HOME: 'Home',
    INPAGE_PROVIDER: 'inpage_provider',
    KEYS: 'Keys',
    MESSAGES: 'Messages',
    NAVIGATION: 'Navigation',
    NETWORK: 'Network',
    ONBOARDING: 'Onboarding',
    RETENTION: 'Retention',
    SETTINGS: 'Settings',
    SNAPS: 'Snaps',
    SWAPS: 'Swaps',
    TRANSACTIONS: 'Transactions',
    WALLET: 'Wallet',
  },
  EXTERNAL_LINK_TYPES: {
    TRANSACTION_BLOCK_EXPLORER: 'Transaction Block Explorer',
    BLOCK_EXPLORER: 'Block Explorer',
    ACCOUNT_TRACKER: 'Account Tracker',
    TOKEN_TRACKER: 'Token Tracker',
  },
  KEY_TYPES: {
    PKEY: 'private_key',
    SRP: 'srp',
  },
  ONRAMP_PROVIDER_TYPES: {
    COINBASE: 'coinbase',
    MOONPAY: 'moonpay',
    WYRE: 'wyre',
    TRANSAK: 'transak',
    SELF_DEPOSIT: 'direct_deposit',
  },
  SOURCE: {
    NETWORK: {
      CUSTOM_NETWORK_FORM: 'custom_network_form',
      POPULAR_NETWORK_LIST: 'popular_network_list',
    },
    SWAPS: {
      MAIN_VIEW: 'Main View',
      TOKEN_VIEW: 'Token View',
    },
    TOKEN: {
      CUSTOM: 'custom',
      DAPP: 'dapp',
      DETECTED: 'detected',
      LIST: 'list',
    },
    TRANSACTION: {
      DAPP: 'dapp',
      USER: 'user',
    },
  },
  LOCATION: {
    TOKEN_DETAILS: 'token_details',
    TOKEN_DETECTION: 'token_detection',
    TOKEN_MENU: 'token_menu',
  },
};

// Values below (e.g. 'location') can be used in the "properties"
// tracking object as keys, e.g. { location: 'Home' }
export const CONTEXT_PROPS = {
  PAGE_TITLE: 'location',
};
