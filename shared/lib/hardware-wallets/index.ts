/**
 * Shared hardware-wallet utilities safe for background and UI.
 */
export { HardwareWalletType } from './types';
export { createHardwareWalletError } from './errors';
export {
  isJsonRpcHardwareWalletError,
  getHardwareWalletErrorCode,
  toHardwareWalletError,
  isHardwareWalletError,
  isUserRejectedHardwareWalletError,
  extractTrezorCodeFromMessage,
  extractMessageFromUnknownError,
  hasUserRejectedMessage,
  isTrezorDesktopConnectionMissingError,
} from './rpc-error-utils';
export {
  ENABLE_DMK_FEATURE_FLAG,
  isDmkFeatureEnabled,
} from './feature-flags';
