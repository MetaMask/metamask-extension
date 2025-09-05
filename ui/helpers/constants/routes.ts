import { memoize } from 'lodash';

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
export const GENERAL_ROUTE = '/settings/general';
export const ADVANCED_ROUTE = '/settings/advanced';
export const DEVELOPER_OPTIONS_ROUTE = '/settings/developer-options';
export const EXPERIMENTAL_ROUTE = '/settings/experimental';
export const TRANSACTION_SHIELD_ROUTE = '/settings/transaction-shield';
export const SECURITY_ROUTE = '/settings/security';
export const ABOUT_US_ROUTE = '/settings/about-us';
export const NETWORKS_ROUTE = '/settings/networks';
export const NETWORKS_FORM_ROUTE = '/settings/networks/form';
export const ADD_NETWORK_ROUTE = '/settings/networks/add-network';
export const ADD_POPULAR_CUSTOM_NETWORK =
  '/settings/networks/add-popular-custom-network';
export const CONTACT_LIST_ROUTE = '/settings/contact-list';
export const CONTACT_EDIT_ROUTE = '/settings/contact-list/edit-contact';
export const CONTACT_ADD_ROUTE = '/settings/contact-list/add-contact';
export const CONTACT_VIEW_ROUTE = '/settings/contact-list/view-contact';
export const SNAP_SETTINGS_ROUTE = '/settings/snap';
export const REVEAL_SRP_LIST_ROUTE =
  '/settings/security-and-privacy/reveal-srp-list';
export const SECURITY_PASSWORD_CHANGE_ROUTE =
  '/settings/security-and-privacy/password-change';
export const BACKUPANDSYNC_ROUTE =
  '/settings/security-and-privacy/backup-and-sync';
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
export const NEW_ACCOUNT_ROUTE = '/new-account';
export const ACCOUNT_DETAILS_ROUTE = '/account-details';
export const ACCOUNT_DETAILS_QR_CODE_ROUTE = '/account-details/qr-code';
export const CONFIRM_ADD_SUGGESTED_NFT_ROUTE = '/confirm-add-suggested-nft';
export const CONNECT_HARDWARE_ROUTE = '/new-account/connect';
export const SEND_ROUTE = '/send';
export const REMOTE_ROUTE = '/remote';
export const REMOTE_ROUTE_SETUP_SWAPS = '/remote/setup-swaps';
export const REMOTE_ROUTE_SETUP_DAILY_ALLOWANCE =
  '/remote/setup-daily-allowance';
export const CONNECTIONS = '/connections';
export const PERMISSIONS = '/permissions';
export const REVIEW_PERMISSIONS = '/review-permissions';
export const CONNECT_ROUTE = '/connect';
export const CONNECT_CONFIRM_PERMISSIONS_ROUTE = '/confirm-permissions';
export const CONNECT_SNAPS_CONNECT_ROUTE = '/snaps-connect';
export const CONNECT_SNAP_INSTALL_ROUTE = '/snap-install';
export const CONNECT_SNAP_UPDATE_ROUTE = '/snap-update';
export const CONNECT_SNAP_RESULT_ROUTE = '/snap-install-result';
export const SNAPS_ROUTE = '/snaps';
export const SNAPS_VIEW_ROUTE = '/snaps/view';
export const NOTIFICATIONS_ROUTE = '/notifications';
export const NOTIFICATIONS_SETTINGS_ROUTE = '/notifications/settings';
export const CONNECTED_ROUTE = '/connected';
export const CONNECTED_ACCOUNTS_ROUTE = '/connected/accounts';
export const CONFIRM_TRANSACTION_ROUTE = '/confirm-transaction';
export const CONFIRMATION_V_NEXT_ROUTE = '/confirmation';
export const CONFIRM_SEND_ETHER_PATH = '/send-ether';
export const CONFIRM_SEND_TOKEN_PATH = '/send-token';
export const CONFIRM_DEPLOY_CONTRACT_PATH = '/deploy-contract';
export const CONFIRM_APPROVE_PATH = '/approve';
export const CONFIRM_SET_APPROVAL_FOR_ALL_PATH = '/set-approval-for-all';
export const CONFIRM_TRANSFER_FROM_PATH = '/transfer-from';
export const CONFIRM_SAFE_TRANSFER_FROM_PATH = '/safe-transfer-from';
export const CONFIRM_TOKEN_METHOD_PATH = '/token-method';
export const CONFIRM_INCREASE_ALLOWANCE_PATH = '/increase-allowance';
export const SIGNATURE_REQUEST_PATH = '/signature-request';
export const DECRYPT_MESSAGE_REQUEST_PATH = '/decrypt-message-request';
export const ENCRYPTION_PUBLIC_KEY_REQUEST_PATH =
  '/encryption-public-key-request';
export const CROSS_CHAIN_SWAP_ROUTE = '/cross-chain';
export const CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE = '/cross-chain/tx-details';
export const SWAPS_ROUTE = '/swaps';
export const PREPARE_SWAP_ROUTE = '/swaps/prepare-swap-page';
export const SWAPS_NOTIFICATION_ROUTE = '/swaps/notification-page';
export const LOADING_QUOTES_ROUTE = '/swaps/loading-quotes';
export const AWAITING_SIGNATURES_ROUTE = '/swaps/awaiting-signatures';
export const SMART_TRANSACTION_STATUS_ROUTE = '/swaps/smart-transaction-status';
export const AWAITING_SWAP_ROUTE = '/swaps/awaiting-swap';
export const SWAPS_ERROR_ROUTE = '/swaps/swaps-error';
export const SWAPS_MAINTENANCE_ROUTE = '/swaps/maintenance';
export const ONBOARDING_ROUTE = '/onboarding';
export const ONBOARDING_REVEAL_SRP_ROUTE = '/onboarding/reveal-recovery-phrase';
export const ONBOARDING_REVIEW_SRP_ROUTE = '/onboarding/review-recovery-phrase';
export const ONBOARDING_CONFIRM_SRP_ROUTE =
  '/onboarding/confirm-recovery-phrase';
export const ONBOARDING_CREATE_PASSWORD_ROUTE = '/onboarding/create-password';
export const ONBOARDING_COMPLETION_ROUTE = '/onboarding/completion';
export const ONBOARDING_UNLOCK_ROUTE = '/onboarding/unlock';
export const ONBOARDING_HELP_US_IMPROVE_ROUTE = '/onboarding/help-us-improve';
export const ONBOARDING_IMPORT_WITH_SRP_ROUTE =
  '/onboarding/import-with-recovery-phrase';
export const ONBOARDING_SECURE_YOUR_WALLET_ROUTE =
  '/onboarding/secure-your-wallet';
export const ONBOARDING_PRIVACY_SETTINGS_ROUTE = '/onboarding/privacy-settings';
export const ONBOARDING_PIN_EXTENSION_ROUTE = '/onboarding/pin-extension';
export const ONBOARDING_WELCOME_ROUTE = '/onboarding/welcome';
export const ONBOARDING_METAMETRICS = '/onboarding/metametrics';
export const ONBOARDING_ACCOUNT_EXIST = '/onboarding/account-exist';
export const ONBOARDING_ACCOUNT_NOT_FOUND = '/onboarding/account-not-found';
export const ONBOARDING_DOWNLOAD_APP_ROUTE = '/onboarding/download-app';
export const NONEVM_BALANCE_CHECK_ROUTE = '/nonevm-balance-check';

///: BEGIN:ONLY_INCLUDE_IF(build-flask)
export const INITIALIZE_EXPERIMENTAL_AREA = '/initialize/experimental-area';
export const ONBOARDING_EXPERIMENTAL_AREA = '/onboarding/experimental-area';
///: END:ONLY_INCLUDE_IF

export const DEEP_LINK_ROUTE = '/link';
export const WALLET_DETAILS_ROUTE = '/wallet-details/:id';
export const DEFI_ROUTE = '/defi';

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
    path: ADD_POPULAR_CUSTOM_NETWORK,
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
    path: ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
    label: 'Onboarding Secure Your Wallet',
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
] as const satisfies AppRoute[];

export type AppRoutes = (typeof ROUTES)[number];

export const getPaths = memoize(() =>
  ROUTES.filter((r) => r.trackInAnalytics).map((r) => r.path),
);

// PATH_NAME_MAP for backward compatibility - only includes analytics-tracked routes
export const PATH_NAME_MAP = new Map<AppRoutes['path'], AppRoutes['label']>();

// Populate the map only with routes that have trackInAnalytics: true
ROUTES.forEach((route) => {
  if (route.trackInAnalytics) {
    PATH_NAME_MAP.set(route.path, route.label);
  }
});
