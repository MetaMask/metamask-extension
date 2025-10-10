import { memoize } from 'lodash';
import { safeMatchPath } from '../../utils/safeRouteMatching';

type AppRoute = {
  path: string;
  label: string;
  trackInAnalytics: boolean;
};

export const DEFAULT_ROUTE = '/';
export const UNLOCK_ROUTE = '/unlock';
export const LOCK_ROUTE = '/lock';
export const ASSET_ROUTE = '/asset';
export const SETTINGS_ROUTE = '/settings';

const SETTINGS_PATHS = {
  GENERAL: 'general',
  ADVANCED: 'advanced',
  DEVELOPER_OPTIONS: 'developer-options',
  EXPERIMENTAL: 'experimental',
  TRANSACTION_SHIELD: 'transaction-shield',
  SECURITY: 'security',
  ABOUT_US: 'about-us',
  NETWORKS: 'networks',
  NETWORKS_FORM: 'networks/form',
  ADD_NETWORK: 'networks/add-network',
  ADD_POPULAR_CUSTOM_NETWORK: 'networks/add-popular-custom-network',
  CONTACT_LIST: 'contact-list',
  CONTACT_EDIT: 'contact-list/edit-contact',
  CONTACT_ADD: 'contact-list/add-contact',
  CONTACT_VIEW: 'contact-list/view-contact',
  SNAP: 'snap',
  REVEAL_SRP_LIST: 'security-and-privacy/reveal-srp-list',
  SECURITY_PASSWORD_CHANGE: 'security-and-privacy/password-change',
  BACKUP_AND_SYNC: 'security-and-privacy/backup-and-sync',
} as const;

export const GENERAL_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.GENERAL}`;
export const ADVANCED_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.ADVANCED}`;
export const DEVELOPER_OPTIONS_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.DEVELOPER_OPTIONS}`;
export const EXPERIMENTAL_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.EXPERIMENTAL}`;
export const TRANSACTION_SHIELD_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.TRANSACTION_SHIELD}`;
export const TRANSACTION_SHIELD_CLAIM_ROUTE = `${SETTINGS_ROUTE}/transaction-shield/submit-claim`;
export const SECURITY_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.SECURITY}`;
export const ABOUT_US_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.ABOUT_US}`;
export const NETWORKS_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.NETWORKS}`;
export const NETWORKS_FORM_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.NETWORKS_FORM}`;
export const ADD_NETWORK_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.ADD_NETWORK}`;
export const ADD_POPULAR_CUSTOM_NETWORK_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.ADD_POPULAR_CUSTOM_NETWORK}`;
export const CONTACT_LIST_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.CONTACT_LIST}`;
export const CONTACT_EDIT_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.CONTACT_EDIT}`;
export const CONTACT_ADD_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.CONTACT_ADD}`;
export const CONTACT_VIEW_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.CONTACT_VIEW}`;
export const SNAP_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.SNAP}`;
export const REVEAL_SRP_LIST_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.REVEAL_SRP_LIST}`;
export const SECURITY_PASSWORD_CHANGE_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.SECURITY_PASSWORD_CHANGE}`;
export const BACKUPANDSYNC_ROUTE = `${SETTINGS_ROUTE}/${SETTINGS_PATHS.BACKUP_AND_SYNC}`;
export const REVEAL_SEED_ROUTE = '/seed';
export const SMART_ACCOUNT_UPDATE = '/smart-account-update';
export const IMPORT_SRP_ROUTE = '/import-srp';
export const RESTORE_VAULT_ROUTE = '/restore-vault';
export const IMPORT_TOKEN_ROUTE = '/import-token';
export const IMPORT_TOKENS_ROUTE = '/import-tokens';
export const CONFIRM_IMPORT_TOKEN_ROUTE = '/confirm-import-token';
export const CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE = '/confirm-add-suggested-token';
export const ACCOUNT_LIST_PAGE_ROUTE = '/account-list';
export const MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE =
  '/multichain-account-address-list';
export const MULTICHAIN_ACCOUNT_PRIVATE_KEY_LIST_PAGE_ROUTE =
  '/multichain-account-private-key-list';
export const ADD_WALLET_PAGE_ROUTE = '/add-wallet-page';
export const MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE =
  '/multichain-account-details';
export const MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE =
  '/multichain-wallet-details-page';
export const MULTICHAIN_SMART_ACCOUNT_PAGE_ROUTE = '/multichain-smart-account';
export const NEW_ACCOUNT_ROUTE = '/new-account';

const NEW_ACCOUNT_PATHS = {
  CONNECT: 'connect',
} as const;

export const ACCOUNT_DETAILS_ROUTE = '/account-details';
export const ACCOUNT_DETAILS_QR_CODE_ROUTE = '/account-details/qr-code';
export const CONFIRM_ADD_SUGGESTED_NFT_ROUTE = '/confirm-add-suggested-nft';
export const CONNECT_HARDWARE_ROUTE = `${NEW_ACCOUNT_ROUTE}/${NEW_ACCOUNT_PATHS.CONNECT}`;
export const SEND_ROUTE = '/send';
export const REMOTE_ROUTE = '/remote';
export const REMOTE_ROUTE_SETUP_SWAPS = '/remote/setup-swaps';
export const REMOTE_ROUTE_SETUP_DAILY_ALLOWANCE =
  '/remote/setup-daily-allowance';
export const CONNECTIONS = '/connections';
export const PERMISSIONS = '/permissions';
export const GATOR_PERMISSIONS = '/gator-permissions';
export const TOKEN_TRANSFER_ROUTE = '/gator-permissions/token-transfer';
export const REVIEW_GATOR_PERMISSIONS_ROUTE = '/review-gator-permissions';
export const REVIEW_PERMISSIONS = '/review-permissions';
export const CONNECT_ROUTE = '/connect';

const CONNECT_PATHS = {
  CONFIRM_PERMISSIONS: 'confirm-permissions',
  SNAPS_CONNECT: 'snaps-connect',
  SNAP_INSTALL: 'snap-install',
  SNAP_UPDATE: 'snap-update',
  SNAP_RESULT: 'snap-install-result',
} as const;

export const CONNECT_CONFIRM_PERMISSIONS_ROUTE = `/${CONNECT_PATHS.CONFIRM_PERMISSIONS}`;
export const CONNECT_SNAPS_CONNECT_ROUTE = `/${CONNECT_PATHS.SNAPS_CONNECT}`;
export const CONNECT_SNAP_INSTALL_ROUTE = `/${CONNECT_PATHS.SNAP_INSTALL}`;
export const CONNECT_SNAP_UPDATE_ROUTE = `/${CONNECT_PATHS.SNAP_UPDATE}`;
export const CONNECT_SNAP_RESULT_ROUTE = `/${CONNECT_PATHS.SNAP_RESULT}`;
export const SNAPS_ROUTE = '/snaps';

const SNAPS_PATHS = {
  VIEW: 'view',
} as const;

export const SNAPS_VIEW_ROUTE = `${SNAPS_ROUTE}/${SNAPS_PATHS.VIEW}`;
export const NOTIFICATIONS_ROUTE = '/notifications';
export const NOTIFICATIONS_SETTINGS_ROUTE = '/notifications/settings';
export const CONNECTED_ROUTE = '/connected';
export const CONNECTED_ACCOUNTS_ROUTE = '/connected/accounts';
export const CONFIRM_TRANSACTION_ROUTE = '/confirm-transaction';
export const CONFIRMATION_V_NEXT_ROUTE = '/confirmation';

const CONFIRM_TRANSACTION_PATHS = {
  SEND_ETHER: 'send-ether',
  SEND_TOKEN: 'send-token',
  DEPLOY_CONTRACT: 'deploy-contract',
  APPROVE: 'approve',
  SET_APPROVAL_FOR_ALL: 'set-approval-for-all',
  TRANSFER_FROM: 'transfer-from',
  SAFE_TRANSFER_FROM: 'safe-transfer-from',
  TOKEN_METHOD: 'token-method',
  INCREASE_ALLOWANCE: 'increase-allowance',
  SIGNATURE_REQUEST: 'signature-request',
  DECRYPT_MESSAGE_REQUEST: 'decrypt-message-request',
  ENCRYPTION_PUBLIC_KEY_REQUEST: 'encryption-public-key-request',
} as const;

export const CONFIRM_SEND_ETHER_PATH = `/${CONFIRM_TRANSACTION_PATHS.SEND_ETHER}`;
export const CONFIRM_SEND_TOKEN_PATH = `/${CONFIRM_TRANSACTION_PATHS.SEND_TOKEN}`;
export const CONFIRM_DEPLOY_CONTRACT_PATH = `/${CONFIRM_TRANSACTION_PATHS.DEPLOY_CONTRACT}`;
export const CONFIRM_APPROVE_PATH = `/${CONFIRM_TRANSACTION_PATHS.APPROVE}`;
export const CONFIRM_SET_APPROVAL_FOR_ALL_PATH = `/${CONFIRM_TRANSACTION_PATHS.SET_APPROVAL_FOR_ALL}`;
export const CONFIRM_TRANSFER_FROM_PATH = `/${CONFIRM_TRANSACTION_PATHS.TRANSFER_FROM}`;
export const CONFIRM_SAFE_TRANSFER_FROM_PATH = `/${CONFIRM_TRANSACTION_PATHS.SAFE_TRANSFER_FROM}`;
export const CONFIRM_TOKEN_METHOD_PATH = `/${CONFIRM_TRANSACTION_PATHS.TOKEN_METHOD}`;
export const CONFIRM_INCREASE_ALLOWANCE_PATH = `/${CONFIRM_TRANSACTION_PATHS.INCREASE_ALLOWANCE}`;
export const SIGNATURE_REQUEST_PATH = `/${CONFIRM_TRANSACTION_PATHS.SIGNATURE_REQUEST}`;
export const DECRYPT_MESSAGE_REQUEST_PATH = `/${CONFIRM_TRANSACTION_PATHS.DECRYPT_MESSAGE_REQUEST}`;
export const ENCRYPTION_PUBLIC_KEY_REQUEST_PATH = `/${CONFIRM_TRANSACTION_PATHS.ENCRYPTION_PUBLIC_KEY_REQUEST}`;
export const CROSS_CHAIN_SWAP_ROUTE = '/cross-chain';

const CROSS_CHAIN_PATHS = {
  SWAPS_PREPARE: 'swaps/prepare-swap-page',
  AWAITING_SIGNATURES: 'awaiting-signatures',
  TX_DETAILS: 'tx-details',
} as const;

export const CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE = `${CROSS_CHAIN_SWAP_ROUTE}/${CROSS_CHAIN_PATHS.TX_DETAILS}`;
export const SWAPS_ROUTE = '/swaps';

const SWAPS_PATHS = {
  PREPARE: 'prepare-swap-page',
  NOTIFICATION: 'notification-page',
  LOADING_QUOTES: 'loading-quotes',
  AWAITING_SIGNATURES: 'awaiting-signatures',
  SMART_TRANSACTION_STATUS: 'smart-transaction-status',
  AWAITING_SWAP: 'awaiting-swap',
  ERROR: 'swaps-error',
  MAINTENANCE: 'maintenance',
} as const;

export const PREPARE_SWAP_ROUTE = `${SWAPS_ROUTE}/${SWAPS_PATHS.PREPARE}`;
export const SWAPS_NOTIFICATION_ROUTE = `${SWAPS_ROUTE}/${SWAPS_PATHS.NOTIFICATION}`;
export const LOADING_QUOTES_ROUTE = `${SWAPS_ROUTE}/${SWAPS_PATHS.LOADING_QUOTES}`;
export const AWAITING_SIGNATURES_ROUTE = `${SWAPS_ROUTE}/${SWAPS_PATHS.AWAITING_SIGNATURES}`;
export const SMART_TRANSACTION_STATUS_ROUTE = `${SWAPS_ROUTE}/${SWAPS_PATHS.SMART_TRANSACTION_STATUS}`;
export const AWAITING_SWAP_ROUTE = `${SWAPS_ROUTE}/${SWAPS_PATHS.AWAITING_SWAP}`;
export const SWAPS_ERROR_ROUTE = `${SWAPS_ROUTE}/${SWAPS_PATHS.ERROR}`;
export const SWAPS_MAINTENANCE_ROUTE = `${SWAPS_ROUTE}/${SWAPS_PATHS.MAINTENANCE}`;
export const ONBOARDING_ROUTE = '/onboarding';

const ONBOARDING_PATHS = {
  WELCOME: 'welcome',
  CREATE_PASSWORD: 'create-password',
  REVEAL_SRP: 'reveal-recovery-phrase',
  REVIEW_SRP: 'review-recovery-phrase',
  CONFIRM_SRP: 'confirm-recovery-phrase',
  IMPORT_WITH_SRP: 'import-with-recovery-phrase',
  UNLOCK: 'unlock',
  HELP_US_IMPROVE: 'help-us-improve',
  PRIVACY_SETTINGS: 'privacy-settings',
  COMPLETION: 'completion',
  PIN_EXTENSION: 'pin-extension',
  METAMETRICS: 'metametrics',
  ACCOUNT_EXIST: 'account-exist',
  ACCOUNT_NOT_FOUND: 'account-not-found',
  DOWNLOAD_APP: 'download-app',
  EXPERIMENTAL_AREA: 'experimental-area',
} as const;

export const ONBOARDING_WELCOME_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.WELCOME}`;
export const ONBOARDING_CREATE_PASSWORD_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.CREATE_PASSWORD}`;
export const ONBOARDING_REVEAL_SRP_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.REVEAL_SRP}`;
export const ONBOARDING_REVIEW_SRP_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.REVIEW_SRP}`;
export const ONBOARDING_CONFIRM_SRP_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.CONFIRM_SRP}`;
export const ONBOARDING_IMPORT_WITH_SRP_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.IMPORT_WITH_SRP}`;
export const ONBOARDING_UNLOCK_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.UNLOCK}`;
export const ONBOARDING_HELP_US_IMPROVE_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.HELP_US_IMPROVE}`;
export const ONBOARDING_PRIVACY_SETTINGS_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.PRIVACY_SETTINGS}`;
export const ONBOARDING_COMPLETION_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.COMPLETION}`;
export const ONBOARDING_PIN_EXTENSION_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.PIN_EXTENSION}`;
export const ONBOARDING_METAMETRICS = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.METAMETRICS}`;
export const ONBOARDING_ACCOUNT_EXIST = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.ACCOUNT_EXIST}`;
export const ONBOARDING_ACCOUNT_NOT_FOUND = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.ACCOUNT_NOT_FOUND}`;
export const ONBOARDING_DOWNLOAD_APP_ROUTE = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.DOWNLOAD_APP}`;
export const NONEVM_BALANCE_CHECK_ROUTE = '/nonevm-balance-check';

///: BEGIN:ONLY_INCLUDE_IF(build-flask)
export const INITIALIZE_EXPERIMENTAL_AREA = '/initialize/experimental-area';
export const ONBOARDING_EXPERIMENTAL_AREA = `${ONBOARDING_ROUTE}/${ONBOARDING_PATHS.EXPERIMENTAL_AREA}`;
///: END:ONLY_INCLUDE_IF

export const DEEP_LINK_ROUTE = '/link';
export const WALLET_DETAILS_ROUTE = '/wallet-details/:id';
export const DEFI_ROUTE = '/defi';

export const SHIELD_PLAN_ROUTE = '/shield-plan';

export {
  ONBOARDING_PATHS,
  SETTINGS_PATHS,
  SWAPS_PATHS,
  CROSS_CHAIN_PATHS,
  CONNECT_PATHS,
  CONFIRM_TRANSACTION_PATHS,
  SNAPS_PATHS,
  NEW_ACCOUNT_PATHS,
};

export const ROUTES = [
  { path: DEFAULT_ROUTE, label: 'Home', trackInAnalytics: true },
  { path: '', label: 'Home', trackInAnalytics: true }, // "" is an alias for the Home route
  { path: UNLOCK_ROUTE, label: 'Unlock Page', trackInAnalytics: true },
  { path: LOCK_ROUTE, label: 'Lock Page', trackInAnalytics: true },
  {
    path: ACCOUNT_LIST_PAGE_ROUTE,
    label: 'Account List Page',
    trackInAnalytics: true,
  },
  {
    path: `${MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE}/:id`,
    label: 'Account Details Page',
    trackInAnalytics: true,
  },
  {
    path: `${MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE}/:id`,
    label: 'Wallet Details Page',
    trackInAnalytics: true,
  },
  {
    path: `${MULTICHAIN_SMART_ACCOUNT_PAGE_ROUTE}/:address`,
    label: 'Smart Account Page',
    trackInAnalytics: true,
  },
  {
    path: `${ASSET_ROUTE}/:asset/:id`,
    label: 'Asset Page',
    trackInAnalytics: true,
  },
  {
    path: `${ASSET_ROUTE}/image/:asset/:id`,
    label: 'Nft Image Page',
    trackInAnalytics: true,
  },
  { path: SETTINGS_ROUTE, label: 'Settings Page', trackInAnalytics: true },
  {
    path: GENERAL_ROUTE,
    label: 'General Settings Page',
    trackInAnalytics: true,
  },
  {
    path: ADVANCED_ROUTE,
    label: 'Advanced Settings Page',
    trackInAnalytics: true,
  },
  {
    path: DEVELOPER_OPTIONS_ROUTE,
    label: 'Developer Options Page',
    // DEVELOPER_OPTIONS_ROUTE not in PATH_NAME_MAP because we're not tracking analytics for this page
    trackInAnalytics: false,
  },
  {
    path: EXPERIMENTAL_ROUTE,
    label: 'Experimental Settings Page',
    trackInAnalytics: true,
  },
  {
    path: SECURITY_ROUTE,
    label: 'Security Settings Page',
    trackInAnalytics: true,
  },
  {
    path: ABOUT_US_ROUTE,
    label: 'About Us Page',
    trackInAnalytics: true,
  },
  {
    path: NETWORKS_ROUTE,
    label: 'Network Settings Page',
    trackInAnalytics: true,
  },
  {
    path: NETWORKS_FORM_ROUTE,
    label: 'Network Settings Page Form',
    trackInAnalytics: true,
  },
  {
    path: ADD_NETWORK_ROUTE,
    label: 'Add Network From Settings Page Form',
    trackInAnalytics: true,
  },
  {
    path: ADD_POPULAR_CUSTOM_NETWORK_ROUTE,
    label: 'Add Network From A List Of Popular Custom Networks',
    trackInAnalytics: true,
  },
  {
    path: CONTACT_LIST_ROUTE,
    label: 'Contact List Settings Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONTACT_EDIT_ROUTE}/:address`,
    label: 'Edit Contact Settings Page',
    trackInAnalytics: true,
  },
  {
    path: CONTACT_ADD_ROUTE,
    label: 'Add Contact Settings Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONTACT_VIEW_ROUTE}/:address`,
    label: 'View Contact Settings Page',
    trackInAnalytics: true,
  },
  {
    path: `${SNAP_SETTINGS_ROUTE}/:snapId`,
    label: 'Snap Settings Page',
    trackInAnalytics: true,
  },
  {
    path: REVEAL_SRP_LIST_ROUTE,
    label: 'Reveal Secret Recovery Phrase List Page',
    trackInAnalytics: true,
  },
  {
    path: SECURITY_PASSWORD_CHANGE_ROUTE,
    label: 'Change Password',
    trackInAnalytics: true,
  },
  {
    path: BACKUPANDSYNC_ROUTE,
    label: 'Backup And Sync Settings Page',
    trackInAnalytics: true,
  },
  {
    path: REVEAL_SEED_ROUTE,
    label: 'Reveal Secret Recovery Phrase Page',
    trackInAnalytics: false,
  },
  {
    path: `${REVEAL_SEED_ROUTE}/:keyringId`,
    label: 'Reveal Secret Recovery Phrase Page',
    trackInAnalytics: true,
  },
  {
    path: SMART_ACCOUNT_UPDATE,
    label: 'Smart Account Update Page',
    trackInAnalytics: true,
  },
  {
    path: IMPORT_SRP_ROUTE,
    label: 'Import Secret Recovery Phrase Page',
    trackInAnalytics: true,
  },
  {
    path: RESTORE_VAULT_ROUTE,
    label: 'Restore Vault Page',
    trackInAnalytics: true,
  },
  {
    path: IMPORT_TOKEN_ROUTE,
    label: 'Import Token Page',
    trackInAnalytics: true,
  },
  {
    path: IMPORT_TOKENS_ROUTE,
    label: 'Import Tokens Page',
    trackInAnalytics: true,
  },
  {
    path: CONFIRM_IMPORT_TOKEN_ROUTE,
    label: 'Confirm Import Token Page',
    trackInAnalytics: true,
  },
  {
    path: CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
    label: 'Confirm Add Suggested Token Page',
    trackInAnalytics: true,
  },
  {
    path: NEW_ACCOUNT_ROUTE,
    label: 'New Account Page',
    trackInAnalytics: true,
  },
  {
    path: ACCOUNT_DETAILS_ROUTE,
    label: 'Account Details Page',
    trackInAnalytics: true,
  },
  {
    path: ACCOUNT_DETAILS_QR_CODE_ROUTE,
    label: 'Account Details QR Code Page',
    trackInAnalytics: true,
  },
  {
    path: CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
    label: 'Confirm Add Suggested NFT Page',
    trackInAnalytics: true,
  },
  {
    path: CONNECT_HARDWARE_ROUTE,
    label: 'Connect Hardware Wallet Page',
    trackInAnalytics: true,
  },
  { path: SEND_ROUTE, label: 'Send Page', trackInAnalytics: true },
  { path: REMOTE_ROUTE, label: 'Remote Mode Page', trackInAnalytics: true },
  {
    path: REMOTE_ROUTE_SETUP_SWAPS,
    label: 'Remote Mode Setup Swaps Page',
    trackInAnalytics: true,
  },
  {
    path: REMOTE_ROUTE_SETUP_DAILY_ALLOWANCE,
    label: 'Remote Mode Setup Daily Allowance Page',
    trackInAnalytics: true,
  },
  { path: CONNECTIONS, label: 'Connections', trackInAnalytics: true },
  { path: PERMISSIONS, label: 'Permissions', trackInAnalytics: true },
  {
    path: `${CONNECT_ROUTE}/:id`,
    label: 'Connect To Site Confirmation Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONNECT_ROUTE}/:id${CONNECT_CONFIRM_PERMISSIONS_ROUTE}`,
    label: 'Grant Connected Site Permissions Confirmation Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONNECT_ROUTE}/:id${CONNECT_SNAPS_CONNECT_ROUTE}`,
    label: 'Snaps Connect Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONNECT_ROUTE}/:id${CONNECT_SNAP_INSTALL_ROUTE}`,
    label: 'Snap Install Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONNECT_ROUTE}/:id${CONNECT_SNAP_UPDATE_ROUTE}`,
    label: 'Snap Update Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONNECT_ROUTE}/:id${CONNECT_SNAP_RESULT_ROUTE}`,
    label: 'Snap Install Result Page',
    trackInAnalytics: true,
  },
  { path: SNAPS_ROUTE, label: 'Snaps List Page', trackInAnalytics: true },
  {
    path: `${SNAPS_VIEW_ROUTE}/:snapId`,
    label: 'Snap View Page',
    trackInAnalytics: true,
  },
  {
    path: NOTIFICATIONS_ROUTE,
    label: 'Notifications Page',
    trackInAnalytics: true,
  },
  {
    path: `${NOTIFICATIONS_ROUTE}/:uuid`,
    label: 'Notification Detail Page',
    trackInAnalytics: true,
  },
  {
    path: NOTIFICATIONS_SETTINGS_ROUTE,
    label: 'Notifications Settings Page',
    trackInAnalytics: true,
  },
  {
    path: CONNECTED_ROUTE,
    label: 'Sites Connected To This Account Page',
    trackInAnalytics: true,
  },
  {
    path: CONNECTED_ACCOUNTS_ROUTE,
    label: 'Accounts Connected To This Site Page',
    trackInAnalytics: true,
  },
  {
    path: CONFIRM_TRANSACTION_ROUTE,
    label: 'Confirmation Root Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id`,
    label: 'Confirmation Root Page',
    trackInAnalytics: true,
  },
  {
    path: CONFIRMATION_V_NEXT_ROUTE,
    label: 'New Confirmation Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRMATION_V_NEXT_ROUTE}/:id`,
    label: 'New Confirmation Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SEND_ETHER_PATH}`,
    label: 'Confirm Send Ether Transaction Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SEND_TOKEN_PATH}`,
    label: 'Confirm Send Token Transaction Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_DEPLOY_CONTRACT_PATH}`,
    label: 'Confirm Deploy Contract Transaction Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_APPROVE_PATH}`,
    label: 'Confirm Approve Transaction Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SET_APPROVAL_FOR_ALL_PATH}`,
    label: 'Confirm Set Approval For All Transaction Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_TRANSFER_FROM_PATH}`,
    label: 'Confirm Transfer From Transaction Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SAFE_TRANSFER_FROM_PATH}`,
    label: 'Confirm Safe Transfer From Transaction Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_TOKEN_METHOD_PATH}`,
    label: 'Confirm Token Method Transaction Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_INCREASE_ALLOWANCE_PATH}`,
    label: 'Confirm Increase Allowance Transaction Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${SIGNATURE_REQUEST_PATH}`,
    label: 'Signature Request Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${DECRYPT_MESSAGE_REQUEST_PATH}`,
    label: 'Decrypt Message Request Page',
    trackInAnalytics: true,
  },
  {
    path: `${CONFIRM_TRANSACTION_ROUTE}/:id${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`,
    label: 'Encryption Public Key Request Page',
    trackInAnalytics: true,
  },
  {
    path: CROSS_CHAIN_SWAP_ROUTE,
    label: 'Prepare Cross Chain Swap Page',
    trackInAnalytics: true,
  },
  { path: SWAPS_ROUTE, label: 'Swaps', trackInAnalytics: false },
  {
    path: PREPARE_SWAP_ROUTE,
    label: 'Prepare Swap Page',
    trackInAnalytics: true,
  },
  {
    path: SWAPS_NOTIFICATION_ROUTE,
    label: 'Swaps Notification Page',
    trackInAnalytics: true,
  },
  {
    path: LOADING_QUOTES_ROUTE,
    label: 'Swaps Loading Quotes Page',
    trackInAnalytics: true,
  },
  {
    path: AWAITING_SWAP_ROUTE,
    label: 'Swaps Awaiting Swaps Page',
    trackInAnalytics: true,
  },
  {
    path: SWAPS_ERROR_ROUTE,
    label: 'Swaps Error Page',
    trackInAnalytics: true,
  },
  {
    path: DEEP_LINK_ROUTE,
    label: 'Deep link Redirect Page',
    trackInAnalytics: true,
  },
  {
    path: WALLET_DETAILS_ROUTE,
    label: 'Wallet Details Page',
    trackInAnalytics: true,
  },
  // Onboarding routes
  { path: ONBOARDING_ROUTE, label: 'Onboarding', trackInAnalytics: false },
  {
    path: ONBOARDING_WELCOME_ROUTE,
    label: 'Onboarding Welcome',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_CREATE_PASSWORD_ROUTE,
    label: 'Onboarding Create Password',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_REVIEW_SRP_ROUTE,
    label: 'Onboarding Review Recovery Phrase',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_CONFIRM_SRP_ROUTE,
    label: 'Onboarding Confirm Recovery Phrase',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_REVEAL_SRP_ROUTE,
    label: 'Onboarding Reveal Recovery Phrase',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_IMPORT_WITH_SRP_ROUTE,
    label: 'Onboarding Import With Recovery Phrase',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_UNLOCK_ROUTE,
    label: 'Onboarding Unlock',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_PRIVACY_SETTINGS_ROUTE,
    label: 'Onboarding Privacy Settings',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_COMPLETION_ROUTE,
    label: 'Onboarding Completion',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_PIN_EXTENSION_ROUTE,
    label: 'Onboarding Pin Extension',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_HELP_US_IMPROVE_ROUTE,
    label: 'Onboarding Help Us Improve',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_METAMETRICS,
    label: 'Onboarding Metametrics',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_ACCOUNT_EXIST,
    label: 'Onboarding Account Exist',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_ACCOUNT_NOT_FOUND,
    label: 'Onboarding Account Not Found',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_DOWNLOAD_APP_ROUTE,
    label: 'Onboarding Download App',
    trackInAnalytics: false,
  },
  // Additional routes
  { path: DEFI_ROUTE, label: 'DeFi', trackInAnalytics: false },
  {
    path: REVIEW_PERMISSIONS,
    label: 'Review Permissions',
    trackInAnalytics: false,
  },
  {
    path: CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE,
    label: 'Cross Chain Transaction Details',
    trackInAnalytics: false,
  },
  {
    path: AWAITING_SIGNATURES_ROUTE,
    label: 'Swaps Awaiting Signatures',
    trackInAnalytics: false,
  },
  {
    path: SMART_TRANSACTION_STATUS_ROUTE,
    label: 'Swaps Smart Transaction Status',
    trackInAnalytics: false,
  },
  {
    path: SWAPS_MAINTENANCE_ROUTE,
    label: 'Swaps Maintenance',
    trackInAnalytics: false,
  },
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  {
    path: INITIALIZE_EXPERIMENTAL_AREA,
    label: 'Initialize Experimental Area',
    trackInAnalytics: false,
  },
  {
    path: ONBOARDING_EXPERIMENTAL_AREA,
    label: 'Onboarding Experimental Area',
    trackInAnalytics: false,
  },
  ///: END:ONLY_INCLUDE_IF
  {
    path: SHIELD_PLAN_ROUTE,
    label: 'Shield Plan',
    trackInAnalytics: false,
  },
  {
    path: GATOR_PERMISSIONS,
    label: 'Gator Permissions',
    trackInAnalytics: false,
  },
  {
    path: TOKEN_TRANSFER_ROUTE,
    label: 'Gator Permissions Token Transfer',
    trackInAnalytics: false,
  },
  {
    path: `${REVIEW_GATOR_PERMISSIONS_ROUTE}/:chainId/:permissionGroupName`,
    label: 'Review Gator Permissions',
    trackInAnalytics: false,
  },
] as const satisfies AppRoute[];

export type AppRoutes = (typeof ROUTES)[number];

export const getPaths = memoize(() =>
  ROUTES.filter((r) => r.trackInAnalytics).map((r) => r.path),
);

export const PATH_NAME_MAP = new Map<AppRoutes['path'], AppRoutes['label']>();

ROUTES.forEach((route) => {
  if (route.trackInAnalytics) {
    PATH_NAME_MAP.set(route.path, route.label);
  }
});

/**
 * Matches a pathname against multiple paths using React Router's matchPath.
 * This is needed because v6/v5-compat matchPath expects a single path, not an array.
 *
 * @param paths - Array of path patterns to match against
 * @param pathname - The pathname to match
 * @param options - Additional matchPath options (exact, strict, etc.)
 * @param options.exact - If true, only matches if path exactly matches pathname (v5 compat)
 * @param options.strict - If true, trailing slash matters (v5 compat) - NOTE: v6 doesn't have direct equivalent
 * @returns The first match found or null if no match
 */
export function matchMultiplePaths(
  paths: string[],
  pathname: string,
  options: { exact?: boolean; strict?: boolean } = {},
) {
  for (const path of paths) {
    const match = safeMatchPath(
      {
        path,
        end: options.exact,
      },
      pathname,
    );
    if (match) {
      return match;
    }
  }
  return null;
}
