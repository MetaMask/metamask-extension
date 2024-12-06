// PATH_NAME_MAP is used to pull a convenient name for analytics tracking events. The key must
// be react-router ready path, and can include params such as :id for popup windows
export const PATH_NAME_MAP: { [key: string]: string } = {};

export const DEFAULT_ROUTE = '/';
PATH_NAME_MAP[DEFAULT_ROUTE] = 'Home';

export const UNLOCK_ROUTE = '/unlock';
PATH_NAME_MAP[UNLOCK_ROUTE] = 'Unlock Page';

export const LOCK_ROUTE = '/lock';
PATH_NAME_MAP[LOCK_ROUTE] = 'Lock Page';

export const ASSET_ROUTE = '/asset';
PATH_NAME_MAP[`${ASSET_ROUTE}/:asset/:id`] = `Asset Page`;
PATH_NAME_MAP[`${ASSET_ROUTE}/image/:asset/:id`] = `Nft Image Page`;

export const SETTINGS_ROUTE = '/settings';
PATH_NAME_MAP[SETTINGS_ROUTE] = 'Settings Page';

export const GENERAL_ROUTE = '/settings/general';
PATH_NAME_MAP[GENERAL_ROUTE] = 'General Settings Page';

export const ADVANCED_ROUTE = '/settings/advanced';
PATH_NAME_MAP[ADVANCED_ROUTE] = 'Advanced Settings Page';

export const DEVELOPER_OPTIONS_ROUTE = '/settings/developer-options';
// DEVELOPER_OPTIONS_ROUTE not in PATH_NAME_MAP because we're not tracking analytics for this page

export const EXPERIMENTAL_ROUTE = '/settings/experimental';
PATH_NAME_MAP[EXPERIMENTAL_ROUTE] = 'Experimental Settings Page';

export const SECURITY_ROUTE = '/settings/security';
PATH_NAME_MAP[SECURITY_ROUTE] = 'Security Settings Page';

export const ABOUT_US_ROUTE = '/settings/about-us';
PATH_NAME_MAP[ABOUT_US_ROUTE] = 'About Us Page';

export const NETWORKS_ROUTE = '/settings/networks';
PATH_NAME_MAP[NETWORKS_ROUTE] = 'Network Settings Page';

export const NETWORKS_FORM_ROUTE = '/settings/networks/form';
PATH_NAME_MAP[NETWORKS_FORM_ROUTE] = 'Network Settings Page Form';

export const ADD_NETWORK_ROUTE = '/settings/networks/add-network';
PATH_NAME_MAP[ADD_NETWORK_ROUTE] = 'Add Network From Settings Page Form';

export const ADD_POPULAR_CUSTOM_NETWORK =
  '/settings/networks/add-popular-custom-network';
PATH_NAME_MAP[ADD_POPULAR_CUSTOM_NETWORK] =
  'Add Network From A List Of Popular Custom Networks';

export const CONTACT_LIST_ROUTE = '/settings/contact-list';
PATH_NAME_MAP[CONTACT_LIST_ROUTE] = 'Contact List Settings Page';

export const CONTACT_EDIT_ROUTE = '/settings/contact-list/edit-contact';
PATH_NAME_MAP[`${CONTACT_EDIT_ROUTE}/:address`] = 'Edit Contact Settings Page';

export const CONTACT_ADD_ROUTE = '/settings/contact-list/add-contact';
PATH_NAME_MAP[CONTACT_ADD_ROUTE] = 'Add Contact Settings Page';

export const CONTACT_VIEW_ROUTE = '/settings/contact-list/view-contact';
PATH_NAME_MAP[`${CONTACT_VIEW_ROUTE}/:address`] = 'View Contact Settings Page';

export const REVEAL_SEED_ROUTE = '/seed';
PATH_NAME_MAP[REVEAL_SEED_ROUTE] = 'Reveal Secret Recovery Phrase Page';

export const RESTORE_VAULT_ROUTE = '/restore-vault';
PATH_NAME_MAP[RESTORE_VAULT_ROUTE] = 'Restore Vault Page';

export const IMPORT_TOKEN_ROUTE = '/import-token';
PATH_NAME_MAP[IMPORT_TOKEN_ROUTE] = 'Import Token Page';

export const IMPORT_TOKENS_ROUTE = '/import-tokens';
PATH_NAME_MAP[IMPORT_TOKENS_ROUTE] = 'Import Tokens Page';

export const CONFIRM_IMPORT_TOKEN_ROUTE = '/confirm-import-token';
PATH_NAME_MAP[CONFIRM_IMPORT_TOKEN_ROUTE] = 'Confirm Import Token Page';

export const CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE = '/confirm-add-suggested-token';
PATH_NAME_MAP[CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE] =
  'Confirm Add Suggested Token Page';

export const NEW_ACCOUNT_ROUTE = '/new-account';
PATH_NAME_MAP[NEW_ACCOUNT_ROUTE] = 'New Account Page';

export const CONFIRM_ADD_SUGGESTED_NFT_ROUTE = '/confirm-add-suggested-nft';
PATH_NAME_MAP[CONFIRM_ADD_SUGGESTED_NFT_ROUTE] =
  'Confirm Add Suggested NFT Page';

export const CONNECT_HARDWARE_ROUTE = '/new-account/connect';
PATH_NAME_MAP[CONNECT_HARDWARE_ROUTE] = 'Connect Hardware Wallet Page';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
export const CUSTODY_ACCOUNT_ROUTE = '/new-account/custody';
PATH_NAME_MAP[CUSTODY_ACCOUNT_ROUTE] = 'Connect Custody';

export const INSTITUTIONAL_FEATURES_DONE_ROUTE = '/institutional-features/done';
PATH_NAME_MAP[INSTITUTIONAL_FEATURES_DONE_ROUTE] =
  'Institutional Features Done Page';

export const CUSTODY_ACCOUNT_DONE_ROUTE = '/new-account/custody/done';
PATH_NAME_MAP[CUSTODY_ACCOUNT_DONE_ROUTE] = 'Connect Custody Account done';

export const CONFIRM_ADD_CUSTODIAN_TOKEN = '/confirm-add-custodian-token';
PATH_NAME_MAP[CONFIRM_ADD_CUSTODIAN_TOKEN] = 'Confirm Add Custodian Token';

export const INTERACTIVE_REPLACEMENT_TOKEN_PAGE =
  '/interactive-replacement-token-page';
PATH_NAME_MAP[INTERACTIVE_REPLACEMENT_TOKEN_PAGE] =
  'Interactive replacement token page';

export const SRP_REMINDER = '/onboarding/remind-srp';
PATH_NAME_MAP[SRP_REMINDER] = 'Secret Recovery Phrase Reminder';
///: END:ONLY_INCLUDE_IF

export const SEND_ROUTE = '/send';
PATH_NAME_MAP[SEND_ROUTE] = 'Send Page';

export const CONNECTIONS = '/connections';
PATH_NAME_MAP[CONNECTIONS] = 'Connections';

export const PERMISSIONS = '/permissions';
PATH_NAME_MAP[PERMISSIONS] = 'Permissions';

export const REVIEW_PERMISSIONS = '/review-permissions';

export const CONNECT_ROUTE = '/connect';
PATH_NAME_MAP[`${CONNECT_ROUTE}/:id`] = 'Connect To Site Confirmation Page';

export const CONNECT_CONFIRM_PERMISSIONS_ROUTE = '/confirm-permissions';
PATH_NAME_MAP[`${CONNECT_ROUTE}/:id${CONNECT_CONFIRM_PERMISSIONS_ROUTE}`] =
  'Grant Connected Site Permissions Confirmation Page';

export const CONNECT_SNAPS_CONNECT_ROUTE = '/snaps-connect';
PATH_NAME_MAP[`${CONNECT_ROUTE}/:id${CONNECT_SNAPS_CONNECT_ROUTE}`] =
  'Snaps Connect Page';

export const CONNECT_SNAP_INSTALL_ROUTE = '/snap-install';
PATH_NAME_MAP[`${CONNECT_ROUTE}/:id${CONNECT_SNAP_INSTALL_ROUTE}`] =
  'Snap Install Page';

export const CONNECT_SNAP_UPDATE_ROUTE = '/snap-update';
PATH_NAME_MAP[`${CONNECT_ROUTE}/:id${CONNECT_SNAP_UPDATE_ROUTE}`] =
  'Snap Update Page';

export const CONNECT_SNAP_RESULT_ROUTE = '/snap-install-result';
PATH_NAME_MAP[`${CONNECT_ROUTE}/:id${CONNECT_SNAP_RESULT_ROUTE}`] =
  'Snap Install Result Page';

export const SNAPS_ROUTE = '/snaps';
PATH_NAME_MAP[SNAPS_ROUTE] = 'Snaps List Page';

export const SNAPS_VIEW_ROUTE = '/snaps/view';
PATH_NAME_MAP[`${SNAPS_VIEW_ROUTE}/:snapId`] = 'Snap View Page';

export const NOTIFICATIONS_ROUTE = '/notifications';
PATH_NAME_MAP[NOTIFICATIONS_ROUTE] = 'Notifications Page';
PATH_NAME_MAP[`${NOTIFICATIONS_ROUTE}/:uuid`] = 'Notification Detail Page';

export const NOTIFICATIONS_SETTINGS_ROUTE = '/notifications/settings';
PATH_NAME_MAP[NOTIFICATIONS_SETTINGS_ROUTE] = 'Notifications Settings Page';

export const CONNECTED_ROUTE = '/connected';
PATH_NAME_MAP[CONNECTED_ROUTE] = 'Sites Connected To This Account Page';

export const CONNECTED_ACCOUNTS_ROUTE = '/connected/accounts';
PATH_NAME_MAP[CONNECTED_ACCOUNTS_ROUTE] =
  'Accounts Connected To This Site Page';

export const CONFIRM_TRANSACTION_ROUTE = '/confirm-transaction';
PATH_NAME_MAP[CONFIRM_TRANSACTION_ROUTE] = 'Confirmation Root Page';
PATH_NAME_MAP[`${CONFIRM_TRANSACTION_ROUTE}/:id`] = 'Confirmation Root Page';

export const CONFIRMATION_V_NEXT_ROUTE = '/confirmation';
PATH_NAME_MAP[CONFIRMATION_V_NEXT_ROUTE] = 'New Confirmation Page';
PATH_NAME_MAP[`${CONFIRMATION_V_NEXT_ROUTE}/:id`] = 'New Confirmation Page';

export const CONFIRM_SEND_ETHER_PATH = '/send-ether';
PATH_NAME_MAP[`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SEND_ETHER_PATH}`] =
  'Confirm Send Ether Transaction Page';

export const CONFIRM_SEND_TOKEN_PATH = '/send-token';
PATH_NAME_MAP[`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SEND_TOKEN_PATH}`] =
  'Confirm Send Token Transaction Page';

export const CONFIRM_DEPLOY_CONTRACT_PATH = '/deploy-contract';
PATH_NAME_MAP[
  `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_DEPLOY_CONTRACT_PATH}`
] = 'Confirm Deploy Contract Transaction Page';

export const CONFIRM_APPROVE_PATH = '/approve';
PATH_NAME_MAP[`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_APPROVE_PATH}`] =
  'Confirm Approve Transaction Page';

export const CONFIRM_SET_APPROVAL_FOR_ALL_PATH = '/set-approval-for-all';
PATH_NAME_MAP[
  `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SET_APPROVAL_FOR_ALL_PATH}`
] = 'Confirm Set Approval For All Transaction Page';

export const CONFIRM_TRANSFER_FROM_PATH = '/transfer-from';
PATH_NAME_MAP[`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_TRANSFER_FROM_PATH}`] =
  'Confirm Transfer From Transaction Page';

export const CONFIRM_SAFE_TRANSFER_FROM_PATH = '/safe-transfer-from';
PATH_NAME_MAP[
  `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_SAFE_TRANSFER_FROM_PATH}`
] = 'Confirm Safe Transfer From Transaction Page';

export const CONFIRM_TOKEN_METHOD_PATH = '/token-method';
PATH_NAME_MAP[`${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_TOKEN_METHOD_PATH}`] =
  'Confirm Token Method Transaction Page';

export const CONFIRM_INCREASE_ALLOWANCE_PATH = '/increase-allowance';
PATH_NAME_MAP[
  `${CONFIRM_TRANSACTION_ROUTE}/:id${CONFIRM_INCREASE_ALLOWANCE_PATH}`
] = 'Confirm Increase Allowance Transaction Page';

export const SIGNATURE_REQUEST_PATH = '/signature-request';
PATH_NAME_MAP[`${CONFIRM_TRANSACTION_ROUTE}/:id${SIGNATURE_REQUEST_PATH}`] =
  'Signature Request Page';

export const DECRYPT_MESSAGE_REQUEST_PATH = '/decrypt-message-request';
PATH_NAME_MAP[
  `${CONFIRM_TRANSACTION_ROUTE}/:id${DECRYPT_MESSAGE_REQUEST_PATH}`
] = 'Decrypt Message Request Page';

export const ENCRYPTION_PUBLIC_KEY_REQUEST_PATH =
  '/encryption-public-key-request';
PATH_NAME_MAP[
  `${CONFIRM_TRANSACTION_ROUTE}/:id${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`
] = 'Encryption Public Key Request Page';

export const CROSS_CHAIN_SWAP_ROUTE = '/cross-chain';
PATH_NAME_MAP[CROSS_CHAIN_SWAP_ROUTE] = 'Prepare Cross Chain Swap Page';
export const CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE = '/cross-chain/tx-details';

export const SWAPS_ROUTE = '/swaps';

export const PREPARE_SWAP_ROUTE = '/swaps/prepare-swap-page';
PATH_NAME_MAP[PREPARE_SWAP_ROUTE] = 'Prepare Swap Page';

export const SWAPS_NOTIFICATION_ROUTE = '/swaps/notification-page';
PATH_NAME_MAP[SWAPS_NOTIFICATION_ROUTE] = 'Swaps Notification Page';

export const LOADING_QUOTES_ROUTE = '/swaps/loading-quotes';
PATH_NAME_MAP[LOADING_QUOTES_ROUTE] = 'Swaps Loading Quotes Page';

export const AWAITING_SIGNATURES_ROUTE = '/swaps/awaiting-signatures';

export const SMART_TRANSACTION_STATUS_ROUTE = '/swaps/smart-transaction-status';

export const AWAITING_SWAP_ROUTE = '/swaps/awaiting-swap';
PATH_NAME_MAP[AWAITING_SWAP_ROUTE] = 'Swaps Awaiting Swaps Page';

export const SWAPS_ERROR_ROUTE = '/swaps/swaps-error';
PATH_NAME_MAP[SWAPS_ERROR_ROUTE] = 'Swaps Error Page';

export const SWAPS_MAINTENANCE_ROUTE = '/swaps/maintenance';

export const ONBOARDING_ROUTE = '/onboarding';
export const ONBOARDING_REVIEW_SRP_ROUTE = '/onboarding/review-recovery-phrase';
export const ONBOARDING_CONFIRM_SRP_ROUTE =
  '/onboarding/confirm-recovery-phrase';
export const ONBOARDING_CREATE_PASSWORD_ROUTE = '/onboarding/create-password';
export const ONBOARDING_COMPLETION_ROUTE = '/onboarding/completion';
export const MMI_ONBOARDING_COMPLETION_ROUTE = '/onboarding/account-completion';
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

///: BEGIN:ONLY_INCLUDE_IF(build-flask)
export const INITIALIZE_EXPERIMENTAL_AREA = '/initialize/experimental-area';
export const ONBOARDING_EXPERIMENTAL_AREA = '/onboarding/experimental-area';
///: END:ONLY_INCLUDE_IF
