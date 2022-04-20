import { RestrictedMethods } from './permissions';

/**
 * A string representing the type of environment the application is currently running in
 * popup - When the user click's the icon in their browser's extension bar; the default view
 * notification - When the extension opens due to interaction with a Web3 enabled website
 * fullscreen - When the user clicks 'expand view' to open the extension in a new tab
 * background - The background process that powers the extension
 *
 * @typedef {'popup' | 'notification' | 'fullscreen' | 'background'} EnvironmentType
 */
export const ENVIRONMENT_TYPE_POPUP = 'popup';
export const ENVIRONMENT_TYPE_NOTIFICATION = 'notification';
export const ENVIRONMENT_TYPE_FULLSCREEN = 'fullscreen';
export const ENVIRONMENT_TYPE_BACKGROUND = 'background';

/**
 * The distribution this build is intended for.
 *
 * This should be kept in-sync with the `BuildType` map in `development/build/utils.js`.
 */
export const BuildType = {
  beta: 'beta',
  flask: 'flask',
  main: 'main',
};

export const PLATFORM_BRAVE = 'Brave';
export const PLATFORM_CHROME = 'Chrome';
export const PLATFORM_EDGE = 'Edge';
export const PLATFORM_FIREFOX = 'Firefox';
export const PLATFORM_OPERA = 'Opera';

export const MESSAGE_TYPE = {
  ADD_ETHEREUM_CHAIN: 'wallet_addEthereumChain',
  ETH_ACCOUNTS: RestrictedMethods.eth_accounts,
  ETH_DECRYPT: 'eth_decrypt',
  ETH_GET_ENCRYPTION_PUBLIC_KEY: 'eth_getEncryptionPublicKey',
  ETH_REQUEST_ACCOUNTS: 'eth_requestAccounts',
  ETH_SIGN: 'eth_sign',
  ETH_SIGN_TYPED_DATA: 'eth_signTypedData',
  GET_PROVIDER_STATE: 'metamask_getProviderState',
  LOG_WEB3_SHIM_USAGE: 'metamask_logWeb3ShimUsage',
  PERSONAL_SIGN: 'personal_sign',
  SEND_METADATA: 'metamask_sendDomainMetadata',
  SWITCH_ETHEREUM_CHAIN: 'wallet_switchEthereumChain',
  WATCH_ASSET: 'wallet_watchAsset',
  WATCH_ASSET_LEGACY: 'metamask_watchAsset',
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  SNAP_CONFIRM: RestrictedMethods.snap_confirm,
  GET_LOCALE: RestrictedMethods.wallet_getLocale
  ///: END:ONLY_INCLUDE_IN
};

/**
 * The different kinds of subjects that MetaMask may interact with, including
 * third parties and itself (e.g. when the background communicated with the UI).
 */
export const SUBJECT_TYPES = {
  EXTENSION: 'extension',
  INTERNAL: 'internal',
  UNKNOWN: 'unknown',
  WEBSITE: 'website',
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  SNAP: 'snap',
  ///: END:ONLY_INCLUDE_IN
};

export const POLLING_TOKEN_ENVIRONMENT_TYPES = {
  [ENVIRONMENT_TYPE_POPUP]: 'popupGasPollTokens',
  [ENVIRONMENT_TYPE_NOTIFICATION]: 'notificationGasPollTokens',
  [ENVIRONMENT_TYPE_FULLSCREEN]: 'fullScreenGasPollTokens',
};
